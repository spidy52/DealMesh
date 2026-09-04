import sys
import time
import re
import requests
import speech_recognition as sr
import win32com.client

import os

# OpenRouter Free High-Speed Models (Loaded dynamically from environment / .env)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
if not OPENROUTER_API_KEY:
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.isfile(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("OPENROUTER_API_KEY="):
                    OPENROUTER_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

ACTIVE_MODELS = [
    "z-ai/glm-5.2:free",
    "google/gemma-4-26b-a4b-it:free",
    "minimax/minimax-m3:free",
    "nvidia/nemotron-3.5-lightning:free"
]

SYSTEM_PROMPT = (
    "You are Omni, a smart, cheerful, friendly AI desktop assistant for DealMesh. "
    "Output ONLY your final spoken reply. Do not include thinking steps or prefixes. "
    "Answer directly in 1 to 2 short sentences max so it is quick to speak aloud."
)

conversation_history = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

def clean_ai_reply(raw_text):
    """Strips thinking tags, markdown asterisks and reasoning headers"""
    text = re.sub(r'<think>.*?</think>', '', raw_text, flags=re.DOTALL)
    text = re.sub(r"Here's a thinking process:.*?\n\n", '', text, flags=re.DOTALL)
    text = re.sub(r"Here's a response:.*?\n", '', text, flags=re.IGNORECASE)
    text = text.replace('*', '').replace('#', '').strip()
    return text

def speak_text(speaker, text):
    """Speaks text aloud using Windows Native SAPI5 Voice"""
    try:
        if speaker:
            clean = text.encode('ascii', 'ignore').decode('ascii')
            speaker.Speak(clean)
    except Exception as e:
        print(f"[!] TTS Error: {e}")

def ask_llm(user_message):
    """Queries active OpenRouter LLM models (GLM 5.2 / Gemma 4 / Nemotron)"""
    conversation_history.append({"role": "user", "content": user_message})

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "https://dealmesh.ai",
        "X-Title": "DealMesh Omni AI Companion",
        "Content-Type": "application/json"
    }

    for model in ACTIVE_MODELS:
        payload = {
            "model": model,
            "messages": conversation_history[-6:],
            "temperature": 0.4,
            "max_tokens": 120
        }
        try:
            resp = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=7)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    raw_reply = choices[0]["message"]["content"]
                    reply = clean_ai_reply(raw_reply)
                    if reply:
                        conversation_history.append({"role": "assistant", "content": reply})
                        return reply
        except Exception:
            continue

    return f"I heard you ask about {user_message}. How else can I help?"

def run_voice_chatbot():
    print("=" * 70)
    print("      🤖 DEALMESH OMNI — REAL AI VOICE CHATBOT (LIVE LLM)")
    print("=" * 70)
    print("  • Connected to OpenRouter AI Engine (GLM 5.2 / Gemma 4 / Nemotron)")
    print("  • Speaks real-time intelligent AI answers through your speakers")
    print("  • Say 'exit', 'quit', or 'bye' (or press Ctrl+C) to stop")
    print("=" * 70)

    # Initialize Windows TTS Voice Engine
    try:
        speaker = win32com.client.Dispatch("SAPI.SpVoice")
        voices = speaker.GetVoices()
        for v in voices:
            desc = v.GetDescription().lower()
            if "zira" in desc or "female" in desc or "eva" in desc or "jenny" in desc:
                speaker.Voice = v
                break
    except Exception:
        speaker = None

    # Initialize Speech Recognition
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 1400
    recognizer.dynamic_energy_threshold = False
    recognizer.pause_threshold = 0.8

    try:
        with sr.Microphone() as source:
            print("\n[1] Calibrating microphone for room noise (1.5 seconds, stay quiet)...")
            recognizer.adjust_for_ambient_noise(source, duration=1.5)
            if recognizer.energy_threshold < 1200:
                recognizer.energy_threshold = 1200
            print(f"    ✓ Calibration complete. Noise threshold: {int(recognizer.energy_threshold)}")
            
            # Welcome greeting
            greeting = "Konnichiwa! I am Omni, connected to live AI. Ask me anything!"
            print(f"\n🤖 OMNI: \"{greeting}\"")
            if speaker:
                speak_text(speaker, greeting)

            turn = 1
            while True:
                print(f"\n[{turn}] 🎧 [LISTENING...] Speak now:")
                try:
                    audio = recognizer.listen(source, timeout=15, phrase_time_limit=10)
                    print("    ⏳ [TRANSCRIBING AUDIO...]")
                    
                    user_text = recognizer.recognize_google(audio)
                    print(f"🗣️  YOU: \"{user_text}\"")

                    # Exit check
                    lower = user_text.lower().strip()
                    if lower in ["exit", "quit", "bye", "goodbye", "stop", "close"]:
                        farewell = "Oyasumi, partner! Talk to you soon. Goodbye!"
                        print(f"🤖 OMNI: \"{farewell}\"")
                        if speaker:
                            speak_text(speaker, farewell)
                        break

                    # Query real AI LLM
                    print("    🧠 [OMNI AI THINKING...]")
                    reply = ask_llm(user_text)
                    print(f"🤖 OMNI: \"{reply}\"")
                    
                    # Speak response aloud
                    if speaker:
                        speak_text(speaker, reply)
                    
                    turn += 1

                except sr.WaitTimeoutError:
                    print("    💤 (No speech detected in 15 seconds. Still listening...)")
                except sr.UnknownValueError:
                    print("    ⚠️ (Audio heard but words were unclear. Please speak closer to the mic.)")
                except Exception as err:
                    print(f"    ⚠️ [Recognition Warning]: {err}")

    except KeyboardInterrupt:
        print("\n\n[!] Voice chat ended by user. Goodbye!")
    except Exception as e:
        print(f"\n[!] Fatal Error: {e}")

if __name__ == "__main__":
    run_voice_chatbot()
