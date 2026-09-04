import sys
import os
import json
import time
import re
import urllib.parse
import requests
import speech_recognition as sr
import win32com.client
import threading

# OpenRouter Free High-Speed Models Fallback Chain (Loaded dynamically from environment / .env)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
if not OPENROUTER_API_KEY:
    # Attempt loading from root .env if running from electron app
    candidate_envs = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"),
        os.path.join(os.getcwd(), ".env"),
    ]
    for c_env in candidate_envs:
        if os.path.isfile(c_env):
            try:
                with open(c_env, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("OPENROUTER_API_KEY="):
                            OPENROUTER_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                            break
            except Exception:
                pass
        if OPENROUTER_API_KEY:
            break

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

ACTIVE_MODELS = [
    "z-ai/glm-5.2:free",
    "google/gemma-4-26b-a4b-it:free",
    "minimax/minimax-m3:free",
    "nvidia/nemotron-3.5-lightning:free",
    "meta-llama/llama-3.3-70b-instruct:free"
]

SYSTEM_PROMPT = (
    "You are Omni, a smart, cheerful, and helpful AI desktop companion and commerce assistant for DealMesh. "
    "Provide clear, direct, intelligent answers in 1 to 2 short sentences max so they sound great spoken aloud. "
    "When asked about deals, recommend the best options and mention savings."
)

conversation_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

def sanitize_for_tts(raw_text):
    if not raw_text:
        return ""
    text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL)
    text = re.sub(r"Here's a thinking process:.*?\n\n", '', text, flags=re.DOTALL)
    text = re.sub(r"Here's a response:.*?\n", '', text, flags=re.IGNORECASE)
    # Currency and dashes replacement to avoid SAPI COM crashes
    text = text.replace('–', '-').replace('—', '-')
    text = text.replace('₹', 'Rupees ').replace('$', 'Dollars ')
    text = text.replace('Rs.', 'Rupees ').replace('Rs', 'Rupees ')
    text = text.replace('“', '"').replace('”', '"').replace('‘', "'").replace('’', "'")
    text = re.sub(r'[*#_`~\\\[\]\(\)]', '', text)
    # Keep only standard printable ASCII
    clean = re.sub(r'[^\x20-\x7E]', '', text)
    return clean.strip()

def send_ipc(event_type, **kwargs):
    payload = {"event": event_type, **kwargs}
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()

def is_sapi_speaking(speaker):
    """Returns True ONLY if SAPI is actively synthesizing and playing audio right now"""
    try:
        if speaker and speaker.Status.RunningState != 1:
            return True
    except Exception:
        pass
    return False

def stop_speaking(speaker):
    """Instantly silences speech ONLY if SAPI is currently speaking"""
    try:
        if speaker and is_sapi_speaking(speaker):
            # SVSFPurgeBeforeSpeak = 2 (stops speech output instantly)
            speaker.Speak("", 2)
            return True
    except Exception:
        pass
    return False

def speak_text(speaker, text):
    try:
        clean = sanitize_for_tts(text)
        if speaker and clean:
            # SVSFlagsAsync = 1 (speaks in background, allowing real-time listening & interruption!)
            speaker.Speak(clean, 1)
    except Exception as e:
        sys.stderr.write(f"TTS Error: {e}\n")

def ask_backend_or_llm(user_message):
    """Queries backend dynamic multi-platform deal comparison engine first"""
    try:
        resp = requests.post(
            "http://localhost:8000/api/voice/chat",
            json={"message": user_message},
            timeout=30
        )
        if resp.status_code == 200:
            data = resp.json()
            reply = data.get("reply")
            action = data.get("action", "none")
            search_url = data.get("search_url", "")
            product_query = data.get("product_query", "")
            deal_data = data.get("deal_data", None)
            if reply:
                return reply, action, search_url, product_query, deal_data
    except Exception as e:
        sys.stderr.write(f"Backend chat query notice: {e}\n")

    lower_msg = user_message.lower().strip()
    non_product_commands = {"proceed", "confirm", "yes", "no", "cancel", "close", "ok", "okay", "stop", "back", "exit"}
    if lower_msg in non_product_commands:
        return "I'm on standby! Say a product you want to find or tell me to close.", "none", "", "", None

    # If backend is slow or timed out, NEVER return action='none' for shopping queries!
    clean_q = re.sub(r'^(can\s+you\s+)?(find|get|show|search|buy)(\s+me)?(\s+a|\s+some)?(\s+deal\s+of|\s+deals\s+on|\s+prices\s+for)?', '', lower_msg).strip() or lower_msg
    if clean_q in non_product_commands:
        return "I'm on standby! Say a product you want to find or tell me to close.", "none", "", "", None

    reply = f"Here are the top verified deals for '{clean_q}'! I've opened the deals popup on your screen."
    return reply, "show_deal_overlay", "", clean_q, None

def main():
    speaker = None
    try:
        speaker = win32com.client.Dispatch("SAPI.SpVoice")
        voices = speaker.GetVoices()
        for v in voices:
            desc = v.GetDescription().lower()
            if "zira" in desc or "female" in desc or "eva" in desc or "jenny" in desc:
                speaker.Voice = v
                break
    except Exception as e:
        sys.stderr.write(f"SAPI init: {e}\n")

    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 350
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 1.2
    recognizer.non_speaking_duration = 0.8

    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source, duration=0.8)
        send_ipc("calibrated", threshold=recognizer.energy_threshold)

        # Start background thread to listen for stdin speak commands from Electron
        def stdin_listener():
            try:
                for line in sys.stdin:
                    if not line or not line.strip():
                        continue
                    try:
                        cmd = json.loads(line.strip())
                        if cmd.get("command") == "speak" and cmd.get("text"):
                            speak_text(speaker, cmd["text"])
                    except Exception:
                        pass
            except Exception:
                pass

        threading.Thread(target=stdin_listener, daemon=True).start()

        # Track last spoken text to filter out microphone self-echoes
        last_spoken_cache = [""]

        def speak_and_track(text):
            last_spoken_cache[0] = text.lower()
            speak_text(speaker, text)

        # Single clean initial startup greeting
        startup_greeting = "Hi! I'm Omni, your desktop companion. How can I help you today?"
        send_ipc("ready", reply=startup_greeting)
        speak_and_track(startup_greeting)

        while True:
            try:
                # CRITICAL: Prevent self-echo! If Omni is currently speaking, wait for speech to finish
                while is_sapi_speaking(speaker):
                    time.sleep(0.15)
                time.sleep(0.4)  # Allow speaker room acoustic echo to completely dissipate

                send_ipc("listening")
                audio = recognizer.listen(source, timeout=15, phrase_time_limit=15)
                
                send_ipc("transcribing")
                user_text = recognizer.recognize_google(audio)
                
                if not user_text or not user_text.strip():
                    continue

                clean_text = user_text.strip()
                lower = clean_text.lower()

                # Filter out self-echo if microphone transcribed words from Omni's own output
                last_spoken = last_spoken_cache[0]
                if last_spoken and len(lower) > 5 and (lower in last_spoken or last_spoken in lower):
                    sys.stderr.write(f"Suppressed self-echo: '{clean_text}'\n")
                    continue

                send_ipc("heard", text=clean_text)

                # ==============================================================
                # 1. SPECIFIC APP SHORTCUTS
                # ==============================================================
                if lower in ["open chrome", "launch chrome", "open browser", "open brave"]:
                    reply = "Opening Google Chrome for you!"
                    send_ipc("action", action="open_url", url="https://www.google.com", reply=reply)
                    speak_and_track(reply)
                    continue

                if "calculator" in lower:
                    reply = "Opening Calculator!"
                    send_ipc("action", action="launch_app", command="calc", reply=reply)
                    speak_and_track(reply)
                    continue

                if "notepad" in lower:
                    reply = "Opening Notepad!"
                    send_ipc("action", action="launch_app", command="notepad", reply=reply)
                    speak_and_track(reply)
                    continue

                # ==============================================================
                # 2. QUERY BACKEND AUTONOMOUS COMMERCE & DEALS ENGINE
                # ==============================================================
                send_ipc("thinking", text=clean_text)

                # Give immediate speech feedback if it's a shopping query
                is_shopping = any(k in lower for k in [
                    "deal", "discount", "price", "buy", "shoe", "shoes", "sneaker", "watch", "watches", "laptop", "phone", "flower", "flowers", "find", "search", "get me", "formal"
                ])
                if is_shopping and not any(w in lower for w in ["proceed", "cart", "checkout", "between", "under", "below"]):
                    speak_text(speaker, f"Searching verified stores for {clean_text}...")

                reply, action, search_url, product_query, deal_data = ask_backend_or_llm(clean_text)

                resolved_url = search_url or ""
                if not resolved_url and isinstance(deal_data, dict):
                    resolved_url = deal_data.get("confirmed_url") or deal_data.get("search_url") or (deal_data.get("stores", [{}])[0].get("url") if deal_data.get("stores") else "")

                if action == "deal_completed":
                    send_ipc("action", action="deal_completed", query=product_query or clean_text, deal_data=deal_data, reply=reply, url=resolved_url)
                    speak_and_track(reply)
                    continue

                if action == "checkout":
                    send_ipc("action", action="checkout", reply=reply)
                    speak_and_track(reply)
                    continue

                if action == "open_url" and resolved_url:
                    send_ipc("action", action="open_url", url=resolved_url, reply=reply)
                    speak_and_track(reply)
                    continue

                if action in ["show_deal_overlay", "show_screen_products", "show_variant_picker"]:
                    send_ipc("action", action=action, query=product_query or clean_text, deal_data=deal_data, reply=reply, url=resolved_url)
                    speak_and_track(reply)
                    continue

                if action == "show_negotiation_arena":
                    send_ipc("action", action="show_negotiation_arena", query=product_query or clean_text, deal_data=deal_data, reply=reply, url=resolved_url)
                    speak_and_track(reply)
                    continue

                if is_shopping and action == "none" and not any(q in reply.lower() for q in ["what price", "range or budget", "budget do you have"]):
                    send_ipc("action", action="show_deal_overlay", query=product_query or clean_text, deal_data=deal_data, reply=reply, url=resolved_url)
                    speak_and_track(reply)
                    continue

                # Standard chat or range question reply
                send_ipc("reply", text=clean_text, reply=reply)
                speak_text(speaker, reply)

            except sr.WaitTimeoutError:
                pass
            except sr.UnknownValueError:
                pass
            except Exception as err:
                sys.stderr.write(f"Loop warning: {err}\n")
                time.sleep(0.5)

if __name__ == "__main__":
    main()
