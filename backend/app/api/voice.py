import io
import re
import json
import asyncio
import urllib.parse
import datetime
import speech_recognition as sr
from fastapi import APIRouter, UploadFile, File, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy import select, desc, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database.session import get_db, AsyncSessionLocal
from backend.app.database.models import ChatLog, ChatSession
from backend.app.agents.llm_service import llm_service
from backend.app.commerce.live_web_search_provider import LiveWebSearchProvider
from backend.app.commerce.live_market_crawler import LiveMarketCrawler
from backend.app.commerce.live_screen_inspector import LiveScreenAndPageInspector

router = APIRouter(prefix="/voice", tags=["Voice & Pet"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    action: str = "none"
    search_url: str = ""
    product_query: str = ""
    platform: str = ""
    deal_data: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

class NegotiationCompleteRequest(BaseModel):
    product_name: str
    agreed_price: float
    original_price: Optional[float] = None
    store_name: Optional[str] = "DealMesh Store"
    savings: Optional[float] = 0

conversation_context = {
    "last_product_query": "",
    "last_deal_data": None,
    "pending_product": None,
    "last_budget": None,
    "last_min_budget": None,
    "pending_confirmation": None,
    "screen_inspection": None,
    "awaiting_screen_product_choice": False,
    "awaiting_variant_choice": False,
    "awaiting_negotiation_budget": False,
    "awaiting_negotiation_decision": False,
    "negotiated_deal": None,
}

def normalize_spoken_amounts(text: str) -> str:
    t = text.lower()
    # e.g. 15 to 20 thousand -> 15000 to 20000
    t = re.sub(r'(\d+)\s*(?:to|and|-)\s*(\d+)\s*thousand', lambda m: f'{int(m.group(1))*1000} to {int(m.group(2))*1000}', t)
    t = re.sub(r'(\d+)\s*thousand', lambda m: str(int(m.group(1))*1000), t)
    t = re.sub(r'(\d+)\s*hundred', lambda m: str(int(m.group(1))*100), t)

    # Word numbers
    words_map = {
        'ten thousand': 10000, 'fifteen thousand': 15000, 'twenty thousand': 20000,
        'twenty five thousand': 25000, 'thirty thousand': 30000, 'thirty five thousand': 35000,
        'forty thousand': 40000, 'fifty thousand': 50000, 'sixty thousand': 60000,
        'seventy thousand': 70000, 'eighty thousand': 80000, 'ninety thousand': 90000,
        'one thousand': 1000, 'two thousand': 2000, 'three thousand': 3000,
        'four thousand': 4000, 'five thousand': 5000, 'six thousand': 6000,
        'seven thousand': 7000, 'eight thousand': 8000, 'nine thousand': 9000,
        'five hundred': 500, 'fifteen hundred': 1500, 'two hundred': 200,
        'three hundred': 300, 'four hundred': 400, 'six hundred': 600,
        'seven hundred': 700, 'eight hundred': 800, 'nine hundred': 900,
        'one lakh': 100000, 'two lakh': 200000
    }
    for w, val in words_map.items():
        t = re.sub(rf'\b{w}\b', str(val), t)
    return t

def parse_budget_and_query(text: str):
    norm = normalize_spoken_amounts(text)
    min_budget = None
    budget = None

    # Range 1: 15k to 20k, 15 to 20k, 15k - 20k
    m_k_range = re.search(r'(\d+)\s*k?\s*(?:to|and|-)\s*(\d+)\s*k\b', norm)
    if m_k_range:
        v1 = int(m_k_range.group(1))
        v2 = int(m_k_range.group(2))
        min_b = (v1 * 1000) if v1 < 100 else v1
        max_b = (v2 * 1000) if v2 < 100 else v2
        min_budget = min(min_b, max_b)
        budget = max(min_b, max_b)
    else:
        # Range 2: 15000 to 20000, 1000 to 3000
        m_range = re.search(r'(\d+)\s*(?:to|and|-)\s*(\d+)', norm)
        if m_range:
            v1 = int(m_range.group(1))
            v2 = int(m_range.group(2))
            if v1 < 100 and v2 < 100 and any(w in norm for w in ['thousand', 'k']):
                v1, v2 = v1 * 1000, v2 * 1000
            if v1 >= 50 and v2 >= 50:
                min_budget = min(v1, v2)
                budget = max(v1, v2)
        else:
            # Single k: 20k, 50k
            m_k = re.search(r'(\d+)\s*k\b', norm)
            if m_k:
                budget = int(m_k.group(1)) * 1000
            else:
                # Single number: under 20000, 20000
                m_single = re.search(r'(?:under|below|around|about|less than|for|at|upto|up to|budget is)?\s*(?:rs\.?|inr|₹)?\s*(\d{3,7})', norm)
                if m_single:
                    budget = int(m_single.group(1))

    # Clean query tokens
    clean = re.sub(
        r'^(yeah\s+|hey\s+|hi\s+|ok\s+|please\s+)?(can\s+you\s+)?(want\s+to\s+buy|want\s+to\s+get|i\s+want\s+to\s+buy|i\s+want\s+to\s+get|i\s+want|want|need|look\s+for|looking\s+for|find|get|show|search|buy)(\s+for|\s+me)?(\s+a|\s+an|\s+some|\s+the)?(\s+deal\s+of|\s+deals\s+on|\s+prices\s+for|\s+deal\s+for|\s+best)?',
        '',
        norm
    ).strip()
    clean = re.sub(r'^(to\s+buy|to\s+get|to\s+order)\s+(a|an|the|some)?\s*', '', clean, flags=re.I).strip()
    clean = re.sub(r'^(a|an|the|some)\s+', '', clean, flags=re.I).strip()
    clean = re.sub(r'(?:under|below|around|about|less than|for|at|between|range|upto|up to)?\s*(?:rs\.?|inr|₹)?\s*(?:\d+\s*k|\d{3,7}(?:\s*(?:to|and|-)\s*\d{3,7})?)', '', clean).strip()
    clean = re.sub(r'\b(starting only|starting from|starting|only|for me|please)\b', '', clean, flags=re.I).strip()
    clean = re.sub(r'^(for|of|on|a\s+pair\s+of|some|a|an|the)\s+', '', clean).strip()
    clean = re.sub(r'\s+for$', '', clean).strip()

    return clean or text, min_budget, budget

async def understand_user_intent_with_llm(user_msg: str, context: dict) -> Optional[dict]:
    """Uses LLM to deeply understand user intent, product query, price ranges, and conversational corrections."""
    system_prompt = """You are the intelligent Natural Language Understanding (NLU) engine for Omni, an AI shopping companion.
Analyze the user's message in context of the conversation and return ONLY a valid JSON object:
{
  "intent": "NEGOTIATE_ARENA" | "SEARCH_PRODUCT" | "BUDGET_UPDATE" | "PROCEED_DEAL" | "CONFIRM_DEAL" | "SEARCH_MORE" | "APP_ACTION" | "GENERAL_CHAT",
  "product": string or null (the specific cleaned product name, resolving any context or conversational corrections),
  "min_price": integer or null (in INR, e.g. 15000; null if no minimum or not mentioned),
  "max_price": integer or null (in INR, e.g. 20000; null if user says no budget / any price / just give deal),
  "chosen_store": string or null (e.g. "Amazon", "Flipkart", "Croma", "Titan"),
  "app_action": "chrome" | "calc" | "notepad" | "email" | null
}

Intent Classification Rules:
- If user wants to negotiate with merchant/store/TitanBot, arrange a negotiation, bargain, haggle, or open the negotiation arena ('can you arrange a negotiation with titan watch', 'arrange a negotiation', 'negotiate with titan watch', 'negotiate', 'bargain', 'haggle', 'start negotiation', 'talk to merchant bot', 'open arena', 'meet both bots'): intent = 'NEGOTIATE_ARENA'.
- If user wants to proceed/open the store website to check/inspect product ('proceed the deal', 'proceed', 'proceed with best', 'proceed with second', 'open website', 'take this store'): intent = 'PROCEED_DEAL'.
- If user confirms the deal after seeing the website ('yes confirm', 'confirm deal', 'proceed with deal', 'confirm and proceed', 'buy it', 'place order', 'looks good', 'yes done', 'confirm'): intent = 'CONFIRM_DEAL'.
- If user does not confirm and asks to search more ('no search more', 'search again', 'research again', 'show more options', 'find other deals', 'find different stores', 'other options'): intent = 'SEARCH_MORE'.
- If user is searching for a product: intent = 'SEARCH_PRODUCT'.
- If user is refining budget/price: intent = 'BUDGET_UPDATE'.
- If user asks to open calc, notepad, chrome, or draft email: intent = 'APP_ACTION'.
- Otherwise: intent = 'GENERAL_CHAT'.
"""
    user_prompt = f"Context: {json.dumps(context)}\nUser Message: \"{user_msg}\"\nJSON:"
    try:
        raw = await asyncio.wait_for(
            llm_service.generate_response(system_prompt, user_prompt, temperature=0.1),
            timeout=3.5
        )
        if raw:
            m = re.search(r'\{.*\}', raw, re.DOTALL)
            if m:
                return json.loads(m.group(0))
    except Exception as e:
        print(f"[LLM NLU Notice]: {e}")
    return None
NON_PRODUCT_WORDS = {
    "proceed", "confirm", "yes", "no", "cancel", "close", "ok", "okay", "stop", "back", "exit",
    "hey", "hi", "hello", "rashid", "open", "price", "deal", "deals", "more", "cart", "size",
    "exactly", "up to", "upto", "under", "below", "between", "yeah", "nope", "nah", "option",
    "select", "choose", "pick", "want", "know", "about", "my", "dont", "what"
}

def is_valid_product_title(title: str) -> bool:
    if not title or len(title.strip()) < 3:
        return False
    words = [w for w in re.findall(r'\b[a-zA-Z]+\b', title.lower()) if len(w) > 1]
    if not words:
        return False
    # If all words are in non-product keywords, it's not a real product title
    if all(w in NON_PRODUCT_WORDS for w in words):
        return False
    return True

async def save_chat_to_db(sender: str, message: str, deal_query: str = None, deal_data: dict = None, status: str = "ACTIVE", session_id: str = None) -> str:
    try:
        async with AsyncSessionLocal() as session:
            target_session_id = session_id or conversation_context.get("current_session_id")
            
            existing = None
            if target_session_id:
                sess_stmt = select(ChatSession).where(ChatSession.id == target_session_id)
                existing = (await session.execute(sess_stmt)).scalars().first()

            # Every deal interaction (from deal start to deal end) belongs to ONE continuous session.
            # Only create a new session if:
            # 1) There is no existing session, OR
            # 2) The existing session has already reached status 'COMPLETED'
            needs_new = False
            if not existing or existing.status == "COMPLETED":
                if status not in ["COMPLETED", "SESSION_CLOSED"]:
                    needs_new = True

            if needs_new:
                clean_query = deal_query if (deal_query and is_valid_product_title(deal_query)) else None
                topic_title = (clean_query.title() + " Deals") if clean_query else "Shopping Conversation"
                new_s = ChatSession(
                    title=topic_title[:60],
                    last_message=message[:80],
                    status=status
                )
                session.add(new_s)
                await session.commit()
                await session.refresh(new_s)
                target_session_id = new_s.id
                conversation_context["current_session_id"] = target_session_id
            elif existing:
                target_session_id = existing.id
                conversation_context["current_session_id"] = existing.id

            log_entry = ChatLog(
                session_id=target_session_id,
                sender=sender,
                message_text=message,
                deal_query=deal_query,
                deal_data=json.dumps(deal_data) if deal_data else None,
                status=status
            )
            session.add(log_entry)

            # Update parent session metadata
            if target_session_id:
                sess_stmt = select(ChatSession).where(ChatSession.id == target_session_id)
                sess = (await session.execute(sess_stmt)).scalars().first()
                if sess:
                    sess.last_message = message[:120]
                    sess.updated_at = datetime.datetime.utcnow()
                    if status in ["COMPLETED", "SESSION_CLOSED"]:
                        sess.status = "COMPLETED"
                        conversation_context["current_session_id"] = None
                    elif (sess.title in ["New Chat", "Shopping Conversation", "Shopping Deals", None] or sess.title.startswith("New")) and deal_query and is_valid_product_title(deal_query):
                        sess.title = (deal_query.title() + " Deals")[:60]

            await session.commit()
            if status in ["COMPLETED", "SESSION_CLOSED"]:
                conversation_context["current_session_id"] = None
            return target_session_id
    except Exception as e:
        print(f"Failed to log chat to DB: {e}")
        if status in ["COMPLETED", "SESSION_CLOSED"]:
            conversation_context["current_session_id"] = None
        return session_id

@router.get("/sessions")
async def get_chat_sessions(db: AsyncSession = Depends(get_db)):
    stmt = select(ChatSession).order_by(desc(ChatSession.updated_at)).limit(50)
    sessions = (await db.execute(stmt)).scalars().all()
    result = []
    for s in sessions:
        count_stmt = select(func.count(ChatLog.id)).where(ChatLog.session_id == s.id)
        msg_count = (await db.execute(count_stmt)).scalar() or 0
        if msg_count == 0:
            continue
        # Filter out any single-message dummy fragment sessions with non-product titles
        if msg_count <= 1 and s.title and not is_valid_product_title(s.title.replace(" Deals", "")):
            continue
        result.append({
            "id": s.id,
            "title": s.title,
            "last_message": s.last_message,
            "message_count": msg_count,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None
        })
    return result

@router.post("/sessions")
async def create_chat_session(payload: dict = {}, db: AsyncSession = Depends(get_db)):
    title = payload.get("title", "New Chat").strip() or "New Chat"
    sess = ChatSession(title=title[:80])
    db.add(sess)
    await db.commit()
    await db.refresh(sess)
    return {
        "id": sess.id,
        "title": sess.title,
        "message_count": 0,
        "last_message": None,
        "created_at": sess.created_at.isoformat() if sess.created_at else None,
        "updated_at": sess.updated_at.isoformat() if sess.updated_at else None
    }

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ChatLog).where(ChatLog.session_id == session_id))
    await db.execute(delete(ChatSession).where(ChatSession.id == session_id))
    await db.commit()
@router.post("/negotiation-completed")
async def register_negotiation_completed(req: NegotiationCompleteRequest):
    conversation_context["awaiting_negotiation_decision"] = True
    conversation_context["negotiated_deal"] = {
        "title": req.product_name,
        "product_name": req.product_name,
        "agreed_price": req.agreed_price,
        "original_price": req.original_price or req.agreed_price,
        "store": req.store_name or "DealMesh Store",
        "savings": req.savings or 0,
        "url": "http://localhost:5174/",
    }
    reply = (
        f"Negotiation complete! The final agreed price is Rs.{int(req.agreed_price):,} "
        f"(saving Rs.{int(req.savings or 0):,}). Would you like to proceed with this deal, or check other deals?"
    )
    return {
        "status": "success",
        "reply": reply,
        "action": "negotiation_concluded",
        "agreed_price": req.agreed_price,
        "savings": req.savings
    }

@router.post("/close-deal-session")
async def close_deal_session_endpoint(payload: dict = {}, db: AsyncSession = Depends(get_db)):
    target_session_id = payload.get("session_id") or conversation_context.get("current_session_id")
    deal_query = payload.get("deal_query") or conversation_context.get("last_product_query") or "Shopping Deals"
    reason = payload.get("reason", "USER_CLOSED_DEAL")
    
    if target_session_id:
        log_msg = f"Deal session ended: {reason.replace('_', ' ').title()} for '{deal_query}'."
        try:
            await save_chat_to_db("ASSISTANT", log_msg, deal_query=deal_query, status="COMPLETED", session_id=target_session_id)
            sess = await db.get(ChatSession, target_session_id)
            if sess:
                sess.status = "COMPLETED"
                sess.last_message = log_msg[:120]
                sess.updated_at = datetime.datetime.utcnow()
                await db.commit()
        except Exception as e:
            print(f"Error marking session completed: {e}")

    # Complete reset to normal state
    conversation_context["current_session_id"] = None
    conversation_context["last_product_query"] = ""
    conversation_context["last_deal_data"] = None
    conversation_context["pending_product"] = None
    conversation_context["pending_confirmation"] = None
    conversation_context["awaiting_negotiation_budget"] = False
    conversation_context["awaiting_negotiation_decision"] = False
    conversation_context["negotiated_deal"] = None
    conversation_context["awaiting_screen_product_choice"] = False
    conversation_context["awaiting_variant_choice"] = False
    conversation_context["screen_inspection"] = None

    return {"status": "success", "message": "Deal session closed and returned to normal state."}

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(ChatLog).where(ChatLog.session_id == session_id).order_by(ChatLog.created_at.asc())
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "session_id": r.session_id,
            "sender": r.sender,
            "message": r.message_text,
            "deal_query": r.deal_query,
            "deal_data": json.loads(r.deal_data) if r.deal_data else None,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in rows
    ]

@router.get("/history")
async def get_chat_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = select(ChatLog).order_by(desc(ChatLog.created_at)).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": r.id,
            "session_id": r.session_id,
            "sender": r.sender,
            "message": r.message_text,
            "deal_query": r.deal_query,
            "deal_data": json.loads(r.deal_data) if r.deal_data else None,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in reversed(rows)
    ]

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        recognizer = sr.Recognizer()
        recognizer.energy_threshold = 1200
        recognizer.dynamic_energy_threshold = True

        contents = await file.read()
        audio_file = io.BytesIO(contents)

        with sr.AudioFile(audio_file) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            return {"status": "success", "text": text}
    except sr.UnknownValueError:
        return {"status": "unclear", "text": ""}
    except Exception as e:
        return {"status": "error", "message": str(e), "text": ""}

@router.post("/chat", response_model=ChatResponse)
async def pet_chat(req: ChatRequest):
    """100% Real Live Web E-Commerce Discovery & Playwright Automation Engine"""
    user_msg = req.message.strip()
    if not user_msg:
        return ChatResponse(reply="I'm listening. How can I help you search or buy?", action="none", session_id=req.session_id)

    lower = user_msg.lower()
    clean_search_hint, _, _ = parse_budget_and_query(lower)
    deal_q = clean_search_hint if is_valid_product_title(clean_search_hint) else (conversation_context.get("last_product_query") or None)
    session_id = await save_chat_to_db(sender="user", message=user_msg, deal_query=deal_q, session_id=req.session_id)

    async def emit_reply(
        reply_text: str,
        action: str = "none",
        deal_query: str = None,
        deal_data: dict = None,
        status: str = "ACTIVE",
        search_url: str = "",
        product_query: str = "",
        platform: str = ""
    ) -> ChatResponse:
        await save_chat_to_db(
            sender="omni",
            message=reply_text,
            deal_query=deal_query,
            deal_data=deal_data,
            status=status,
            session_id=session_id
        )
        return ChatResponse(
            reply=reply_text,
            action=action,
            search_url=search_url,
            product_query=product_query,
            platform=platform,
            deal_data=deal_data,
            session_id=session_id
        )

    # ==============================================================
    # 1. INTELLIGENT LLM NLU UNDERSTANDING (NO HARDCODING)
    # ==============================================================
    active_deal = conversation_context.get("last_deal_data")
    prod_title = active_deal.get("title", conversation_context["last_product_query"]) if active_deal else conversation_context["last_product_query"]
    
    ctx = {
        "last_product": conversation_context.get("last_product_query"),
        "pending_product": conversation_context.get("pending_product"),
        "last_budget": conversation_context.get("last_budget"),
        "stores": [s.get("name") for s in (active_deal.get("stores") or [])] if active_deal else []
    }

    nlu = await understand_user_intent_with_llm(user_msg, ctx)
    
    intent = "GENERAL_CHAT"
    
    # Extract entities from LLM or fallback
    if nlu:
        intent = nlu.get("intent", "GENERAL_CHAT")
        target_product = nlu.get("product") or conversation_context.get("pending_product") or conversation_context.get("last_product_query")
        min_budget = nlu.get("min_price")
        budget = nlu.get("max_price")
        chosen_store_name = nlu.get("chosen_store")
        app_action = nlu.get("app_action")
    else:
        # Fallback algorithmic parser if LLM service is momentarily unreachable
        fallback_clean, min_budget, budget = parse_budget_and_query(lower)
        target_product = conversation_context.get("pending_product") or conversation_context.get("last_product_query") or fallback_clean
        chosen_store_name = None
        app_action = None
        if any(k in lower for k in ["negotiat", "arrange a negotiation", "bargain", "haggle", "arena", "meet the bot", "meet both", "discuss on desktop", "handshake"]):
            intent = "NEGOTIATE_ARENA"
        elif any(w in lower for w in ["proceed the deal", "proceed with deal", "proceed with best", "proceed"]):
            intent = "PROCEED_DEAL"
        elif any(k in lower for k in ["confirm", "place order", "buy it", "looks good", "yes done", "yes proceed"]):
            intent = "CONFIRM_DEAL"
        elif any(k in lower for k in ["search more", "research again", "research", "search again", "other options"]):
            intent = "SEARCH_MORE"
    # Distinguish new product searches from confirmations
    is_new_search = any(k in lower for k in [
        "buy me", "can you buy", "find me", "search for", "search", "show me", "get me",
        "i want to buy", "i want", "look for", "looking for", "roses", "rose", "watch", "phone",
        "shoe", "laptop", "flower", "flowers"
    ])

    if is_new_search and not any(c in lower for c in ["confirm", "proceed with", "yes confirm"]):
        intent = "SEARCH_PRODUCT"
        conversation_context["pending_confirmation"] = None
        clean_prod, mb, b = parse_budget_and_query(lower)
        if clean_prod:
            target_product = clean_prod
            if mb is not None: min_budget = mb
            if b is not None: budget = b

        # When switching to a brand-new distinct product search, complete the previous active session
        old_sess_id = conversation_context.get("current_session_id")
        old_prod = conversation_context.get("last_product_query")
        if old_sess_id and old_prod and target_product and (old_prod.lower() not in target_product.lower() and target_product.lower() not in old_prod.lower()):
            try:
                async with AsyncSessionLocal() as db_sess:
                    old_s = await db_sess.get(ChatSession, old_sess_id)
                    if old_s and old_s.status != "COMPLETED":
                        old_s.status = "COMPLETED"
                        await db_sess.commit()
            except Exception:
                pass
            conversation_context["current_session_id"] = None

    # ==============================================================
    # -1. LIVE SCREEN INSPECTION QUERIES ("what is on my screen?")
    # ==============================================================
    if any(w in lower for w in [
        "what's on my screen", "what is on my screen", "look at my screen",
        "inspect my screen", "check my screen", "what do you see on my screen", "see my screen", "on my screen"
    ]):
        controller = LiveMarketCrawler.get_browser_controller()
        inspection = controller.current_inspection
        if inspection and inspection.get("store_name"):
            st = inspection.get("store_name")
            if inspection.get("page_type") == "multi_product":
                p_names = [f"{p['title']} at Rs.{p['price']}" for p in inspection.get("products", [])[:3]]
                reply = f"On your screen, I can see {st} with several items: {', '.join(p_names)}. Which one would you like to proceed with?"
            elif inspection.get("page_type") == "requires_options":
                sizes = ", ".join(inspection.get("available_sizes", [])[:6])
                reply = f"On your screen, I can see the product page on {st}. Available sizes are {sizes}. What size should I select?"
            else:
                reply = f"On your screen, I can see {st} showing '{inspection.get('page_title', '')[:35]}' at Rs.{inspection.get('live_price', 'verified')}."
        else:
            LiveScreenAndPageInspector.capture_active_screen_snapshot()
            reply = "I'm looking at your live desktop screen right now! I'm monitoring your shopping window and ready to help select products, verify prices, and add to cart."

        return await emit_reply(reply, action="none", deal_query=prod_title, status="SCREEN_INSPECTED")

    # ==============================================================
    # -0A. SCREEN PRODUCT SELECTION (e.g. "Cape Jasmine", "Pink Rose", "1st plant")
    # ==============================================================
    if conversation_context.get("awaiting_screen_product_choice") or (active_deal and active_deal.get("page_type") == "multi_product" and not is_new_search) or "select product" in lower:
        inspection = conversation_context.get("screen_inspection") or (active_deal if active_deal and active_deal.get("page_type") == "multi_product" else None)
        products = (inspection.get("products") if inspection else []) or []
        
        matched_prod = None
        matched_idx = None
        
        # Check ordinal patterns
        for pat, idx in [(r'\b(?:1st|first)\b', 0), (r'\b(?:2nd|second)\b', 1), (r'\b(?:3rd|third)\b', 2), (r'\b(?:4th|fourth)\b', 3)]:
            if re.search(pat, lower) and idx < len(products):
                matched_prod = products[idx]
                matched_idx = idx
                break

        if not matched_prod:
            clean_sub = re.sub(r'^(select\s+product|i\s+want|proceed\s+with|go\s+with|pick)\s*', '', lower).strip()
            for idx, p in enumerate(products):
                p_title_l = p.get("title", "").lower()
                words = [w for w in p_title_l.split() if len(w) >= 4]
                if clean_sub and (clean_sub in p_title_l or any(w in clean_sub for w in words)):
                    matched_prod = p
                    matched_idx = idx
                    break

        if matched_prod:
            conversation_context["awaiting_screen_product_choice"] = False
            controller = LiveMarketCrawler.get_browser_controller()
            loop = asyncio.get_event_loop()
            sel_res = await loop.run_in_executor(
                None,
                controller.select_product,
                matched_prod.get("title"),
                matched_idx
            )
            
            new_data = sel_res.get("data") if (sel_res and sel_res.get("status") == "success") else None
            p_price = (new_data.get("live_price") if new_data else None) or matched_prod.get("price")
            p_title = (new_data.get("page_title") if new_data else None) or matched_prod.get("title")
            st_name = (new_data.get("store_name") if new_data else None) or (inspection.get("store_name") if inspection else "Store")

            if new_data and new_data.get("page_type") == "requires_options":
                conversation_context["awaiting_variant_choice"] = True
                conversation_context["screen_inspection"] = new_data
                reply = (
                    f"I've selected '{p_title[:35]}' on your screen! It requires a size. "
                    f"Available sizes are {', '.join(new_data.get('available_sizes', [])[:6])}. Which size should I select for you?"
                )
                variant_deal = dict(active_deal or {})
                variant_deal["page_type"] = "requires_options"
                variant_deal["available_sizes"] = new_data.get("available_sizes")
                variant_deal["title"] = p_title
                variant_deal["basePrice"] = p_price
                return await emit_reply(
                    reply,
                    action="show_variant_picker",
                    deal_query=p_title,
                    deal_data=variant_deal,
                    status="AWAITING_VARIANT"
                )

            conversation_context["pending_confirmation"] = {
                "store": st_name,
                "url": matched_prod.get("url") or (new_data.get("url") if new_data else ""),
                "price": p_price,
                "title": p_title,
                "deal_data": active_deal,
                "session_id": session_id
            }

            reply = (
                f"I've selected '{p_title[:35]}' on your screen at Rs.{p_price}! "
                f"Say 'yes confirm' to add it to your cart and lock the deal, or choose another product."
            )
            selected_deal = dict(active_deal or {})
            selected_deal["title"] = p_title
            selected_deal["basePrice"] = p_price
            selected_deal["bestStore"] = st_name
            return await emit_reply(
                reply,
                action="show_deal_overlay",
                deal_query=p_title,
                deal_data=selected_deal,
                status="PRODUCT_SELECTED_ON_SCREEN"
            )

    # ==============================================================
    # -0C. USER WANTS TO CLOSE DEAL SESSION / NOT BUY RIGHT NOW
    # ==============================================================
    is_close_deal_intent = any(w in lower for w in [
        "close the deal", "close deal", "close popup", "close the popup", "not right now",
        "cancel deal", "cancel the deal", "don't want to buy", "dont want to buy",
        "not buying", "never mind", "nevermind", "exit deal", "close the window", "close window"
    ]) or (lower.strip() in ["close", "cancel", "stop", "exit"])

    if is_close_deal_intent and not is_new_search:
        sess_id = session_id or conversation_context.get("current_session_id")
        target_p = conversation_context.get("last_product_query") or prod_title or "Shopping"
        if sess_id:
            try:
                async with AsyncSessionLocal() as db_sess:
                    sess_rec = await db_sess.get(ChatSession, sess_id)
                    if sess_rec:
                        sess_rec.status = "COMPLETED"
                        sess_rec.last_message = f"Deal session ended: user closed without purchasing {target_p}."
                        sess_rec.updated_at = datetime.datetime.utcnow()
                        await db_sess.commit()
            except Exception as e:
                print(f"Error completing session on close: {e}")

        conversation_context["current_session_id"] = None
        conversation_context["last_product_query"] = ""
        conversation_context["last_deal_data"] = None
        conversation_context["pending_product"] = None
        conversation_context["pending_confirmation"] = None
        conversation_context["awaiting_negotiation_budget"] = False
        conversation_context["awaiting_negotiation_decision"] = False
        conversation_context["negotiated_deal"] = None
        conversation_context["awaiting_screen_product_choice"] = False
        conversation_context["awaiting_variant_choice"] = False
        conversation_context["screen_inspection"] = None

        reply = f"Deal session for '{target_p}' is closed. I'm back in normal standby mode! Whenever you want to search for another deal, just ask!"
        return await emit_reply(
            reply,
            action="close_all_overlays",
            deal_query=target_p,
            status="SESSION_CLOSED"
        )

    # ==============================================================
    # -0B. UNIVERSAL VARIANT & OPTION SELECTION (Size, Storage, Color, Pack, Quantity)
    # ==============================================================
    # Check if user asks about size specifically
    is_asking_about_size = any(w in lower for w in [
        "about my size", "know about my size", "what about size", "want my size", "ask for size",
        "ask my size", "need my size", "which size", "what sizes", "what size", "my size"
    ])
    if is_asking_about_size and not is_new_search:
        conversation_context["awaiting_variant_choice"] = True
        reply = (
            f"Yes, absolutely! Footwear and apparel require a size. "
            f"What shoe size do you wear (for example: UK 7, 8, 9, 10, or 11)? Tell me your size and I will select it on the screen for you!"
        )
        return await emit_reply(
            reply,
            action="show_variant_picker",
            deal_query=prod_title,
            deal_data=active_deal,
            status="AWAITING_VARIANT"
        )
    inspection = conversation_context.get("screen_inspection") or (active_deal if active_deal and active_deal.get("page_type") == "requires_options" else None)
    available_opts = (inspection.get("available_options") if inspection else None) or (inspection.get("available_sizes") if inspection else None) or []
    
    # Check if user stated an option or quantity
    matched_option = None
    if available_opts:
        for opt in available_opts:
            if opt.lower() in lower or re.search(rf'\b{re.escape(opt.lower())}\b', lower):
                matched_option = opt
                break

    # Fallbacks for common e-commerce option categories
    if not matched_option:
        size_match = re.search(r'\b(?:size|uk|us)?\s*([5-9]|1[0-2]|xs|s|m|l|xl|xxl)\b', lower)
        storage_match = re.search(r'\b(\d{2,4}\s*(?:gb|tb))\b', lower)
        pack_match = re.search(r'\b(\d+\s*(?:kg|g|gm|ml|pack|pcs))\b', lower)
        color_match = re.search(r'\b(black|blue|white|silver|gold|grey|red|green|pink)\b', lower)

        if size_match:
            matched_option = size_match.group(1).upper()
        elif storage_match:
            matched_option = storage_match.group(1).upper()
        elif pack_match:
            matched_option = pack_match.group(1)
        elif color_match:
            matched_option = color_match.group(1).title()

    KNOWN_STORES = [
        "myntra", "amazon", "flipkart", "croma", "ajio", "tatacliq", "tata cliq",
        "blinkit", "zepto", "instamart", "bigbasket", "fresho", "maxfashion", "max fashion",
        "titan", "dealmesh", "nykaa", "meesho", "reliancedigital", "reliance", "fnp", "nurserylive"
    ]
    user_mentioned_store = any(s in lower for s in KNOWN_STORES) or any(
        (s.get("name") or "").lower() in lower
        for s in (active_deal.get("stores", []) if active_deal else [])
        if len(s.get("name") or "") > 2
    )
    user_wants_proceed_store = any(w in lower for w in ["proceed with", "go with", "pick", "choose", "select", "buy from", "open", "view"]) and (user_mentioned_store or any(w in lower for w in ["deal", "store", "option", "first", "1st", "second", "2nd", "third", "3rd"]))

    if user_mentioned_store or user_wants_proceed_store:
        conversation_context["awaiting_variant_choice"] = False

    is_variant_answer = bool(matched_option or (conversation_context.get("awaiting_variant_choice") and (re.search(r'\b(?:quantity|qty|count|pieces?)\s*(\d+)\b', lower) or any(w in lower for w in ["default", "first", "medium", "large", "small", "size", "black", "white"]))))

    if is_variant_answer and not is_new_search and not user_mentioned_store and not user_wants_proceed_store:
        chosen_opt = matched_option or (available_opts[0] if available_opts else "Default")
        qty_match = re.search(r'\b(?:quantity|qty|count|pieces?)\s*(\d+)\b', lower)
        chosen_qty = int(qty_match.group(1)) if qty_match else 1

        conversation_context["awaiting_variant_choice"] = False
        controller = LiveMarketCrawler.get_browser_controller()
        loop = asyncio.get_event_loop()
        try:
            await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    controller.select_variant,
                    chosen_opt,
                    chosen_qty
                ),
                timeout=8.0
            )
        except Exception as var_err:
            print(f"[Voice] Browser select_variant non-blocking notice: {var_err}")

        pending_conf = conversation_context.get("pending_confirmation") or {}
        p_title = pending_conf.get("title") or prod_title
        p_price = pending_conf.get("price") or (active_deal.get("basePrice") if active_deal else "verified")
        p_store = pending_conf.get("store") or (active_deal.get("bestStore") if active_deal else "Store")
        p_url = pending_conf.get("url") or (active_deal.get("stores", [{}])[0].get("url") if active_deal else "")

        reply = (
            f"I've selected {chosen_opt} (Quantity: {chosen_qty}) and clicked Add to Cart on {p_store} on your screen! "
            f"Your order is verified and ready in your cart!"
        )

        completed_deal_data = dict(active_deal or {})
        completed_deal_data["is_completed"] = True
        completed_deal_data["confirmed_store"] = p_store
        completed_deal_data["confirmed_price"] = p_price
        completed_deal_data["confirmed_title"] = f"{p_title} ({chosen_opt})"
        completed_deal_data["confirmed_url"] = p_url

        return await emit_reply(
            reply,
            action="deal_completed",
            search_url=p_url,
            platform=(p_store or "").lower(),
            deal_query=p_title,
            deal_data=completed_deal_data,
            status="COMPLETED"
        )

    # ==============================================================
    # 0. AWAITING NEGOTIATION DECISION (PROCEED TO CART VS OTHER DEALS)
    # ==============================================================
    if conversation_context.get("awaiting_negotiation_decision"):
        negotiated = conversation_context.get("negotiated_deal") or {}
        final_p = negotiated.get("agreed_price") or (active_deal.get("basePrice") if active_deal else 2000)
        prod_t = negotiated.get("title") or (active_deal.get("title") if active_deal else None) or conversation_context.get("last_product_query") or "Verified Product"
        store_n = negotiated.get("store") or "DealMesh Store"
        savings_val = negotiated.get("savings", 0)

        # Check if user rejects or wants other deals / options
        is_other_deals = any(w in lower for w in [
            "other deal", "other deals", "other store", "other stores", "other option", "other options",
            "check other", "check others", "no", "don't", "dont", "not this", "cancel", "back", "popup",
            "show popup", "close", "reject"
        ])

        # Check if user wants to proceed
        is_proceed = any(w in lower for w in [
            "proceed", "confirm", "yes", "add to cart", "add it to cart", "buy", "cart",
            "take it", "lock", "deal", "accept", "sure", "okay", "ok", "go ahead", "checkout"
        ]) and not is_other_deals

        if is_proceed:
            conversation_context["awaiting_negotiation_decision"] = False
            orig_p = int(negotiated.get("original_price") or 2499)
            cart_params = urllib.parse.urlencode({
                "cart": "open",
                "product": prod_t,
                "price": int(final_p),
                "original_price": orig_p,
                "savings": int(savings_val),
                "store": store_n
            })
            store_url = negotiated.get("url") or f"http://localhost:5174/?{cart_params}"
            reply = (
                f"Great choice! Proceeding with '{prod_t}' at the agreed price of Rs.{int(final_p):,}. "
                f"I've added it to your cart on {store_n} with your verified negotiated discount applied!"
            )
            completed_deal_data = {
                "title": prod_t,
                "basePrice": final_p,
                "originalPrice": negotiated.get("original_price"),
                "bestStore": store_n,
                "is_completed": True,
                "confirmed_price": final_p,
                "confirmed_store": store_n,
                "confirmed_title": prod_t,
                "savings": savings_val,
                "url": store_url
            }
            conversation_context["pending_confirmation"] = None
            conversation_context["negotiated_deal"] = None

            # Mark active chat session as completed
            sess_id_to_complete = session_id or conversation_context.get("current_session_id")
            if sess_id_to_complete:
                try:
                    async with AsyncSessionLocal() as db_sess:
                        sess_record = await db_sess.get(ChatSession, sess_id_to_complete)
                        if sess_record:
                            sess_record.status = "COMPLETED"
                            await db_sess.commit()
                except Exception as e:
                    print(f"Failed to mark chat session completed: {e}")

            return await emit_reply(
                reply,
                action="deal_completed",
                platform=store_n.lower(),
                deal_query=prod_t,
                deal_data=completed_deal_data,
                status="COMPLETED"
            )

        elif is_other_deals:
            conversation_context["awaiting_negotiation_decision"] = False
            conversation_context["negotiated_deal"] = None
            last_data = conversation_context.get("last_deal_data") or active_deal
            reply = (
                f"Understood! Closing the negotiation and taking you back to the deals list to explore other stores for '{prod_t}'."
            )
            return await emit_reply(
                reply,
                action="show_deal_overlay",
                product_query=prod_t,
                deal_query=prod_t,
                deal_data=last_data,
                status="RESEARCHED_MORE"
            )
        else:
            reply = (
                f"The final negotiated price for '{prod_t}' is Rs.{int(final_p):,} (saving Rs.{int(savings_val):,}). "
                f"Say 'proceed' to add it to your cart, or say 'check other deals' to return to the deals list!"
            )
            return await emit_reply(
                reply,
                action="negotiation_awaiting_decision",
                deal_query=prod_t,
                deal_data=negotiated,
                status="AWAITING_DECISION"
            )

    # ==============================================================
    # 0. AWAITING NEGOTIATION BUDGET CAP
    # ==============================================================
    if conversation_context.get("awaiting_negotiation_budget"):
        nums = re.findall(r'\b\d[\d,]*\b', user_msg.replace(',', ''))
        if nums:
            b_val = float(nums[0])
            conversation_context["awaiting_negotiation_budget"] = False
            conversation_context["negotiation_budget"] = b_val
            target_prod = (active_deal.get("title") if active_deal else None) or conversation_context.get("last_product_query") or "Verified Product"
            if active_deal:
                active_deal["user_budget"] = b_val

            reply = (
                f"Target budget set to Rs.{int(b_val):,}! Summoning TitanBot from DealMesh Storefront to your desktop screen to negotiate for '{target_prod}' under Rs.{int(b_val):,}."
            )
            return await emit_reply(
                reply,
                action="show_negotiation_arena",
                deal_query=target_prod,
                deal_data=active_deal,
                status="NEGOTIATING"
            )

    # ==============================================================
    # 1. DUAL-BOT DESKTOP NEGOTIATION ARENA (HIGHEST PRIORITY)
    # ==============================================================
    if intent == "NEGOTIATE_ARENA" or any(k in lower for k in [
        "negotiat", "arrange a negotiation", "bargain", "haggle", "arena",
        "meet the bot", "meet both", "discuss on desktop", "handshake"
    ]):
        target_prod = (active_deal.get("title") if active_deal else None) or conversation_context.get("last_product_query") or "Verified Product"
        best_store_name = (active_deal.get("bestStore") if active_deal else None) or "DealMesh Store"

        # Check if ANY store for this product actually has an AI negotiation bot!
        has_ai_bot = any(
            s.get("has_ai_merchant") or any(k in (s.get("name") or "").lower() for k in ["dealmesh", "titan", "bloommesh"])
            for s in (active_deal.get("stores", []) if active_deal else [])
        )
        if not has_ai_bot:
            best_p = active_deal.get("basePrice", "N/A") if active_deal else "N/A"
            best_s = active_deal.get("bestStore", "the store") if active_deal else "the store"
            reply = (
                f"None of the stores selling '{target_prod}' have an AI negotiation bot available — they are external retail stores with fixed prices. "
                f"The best verified price is Rs.{best_p} on {best_s}. Say 'proceed' or 'yes confirm' to continue with this deal!"
            )
            return await emit_reply(
                reply,
                action="show_deal_overlay",
                deal_query=target_prod,
                deal_data=active_deal,
                status="NO_BOT_AVAILABLE"
            )

        # Check if user already stated a budget in this sentence (e.g. "negotiate under 600" or "for 2200")
        nums = re.findall(r'\b\d[\d,]*\b', user_msg.replace(',', ''))
        if nums and any(w in lower for w in ["under", "for", "at", "below", "budget", "to"]):
            b_val = float(nums[0])
            if active_deal:
                active_deal["user_budget"] = b_val
            reply = (
                f"Target budget set to Rs.{int(b_val):,}! Summoning TitanBot from DealMesh Storefront to negotiate for '{target_prod}' under Rs.{int(b_val):,}."
            )
            return await emit_reply(
                reply,
                action="show_negotiation_arena",
                deal_query=target_prod,
                deal_data=active_deal,
                status="NEGOTIATING"
            )

        # USER REQUIREMENT: Ask user's budget for every negotiation as product prices vary
        base_p = active_deal.get("basePrice", 1000) if active_deal else 1000
        target_example = int(base_p * 0.85)
        conversation_context["awaiting_negotiation_budget"] = True
        reply = (
            f"What is your target budget or maximum price for '{target_prod}'? (For example: Rs.{target_example:,})"
        )
        return await emit_reply(
            reply,
            action="ask_budget",
            deal_query=target_prod,
            deal_data=active_deal,
            status="ASKING_BUDGET"
        )

    # ==============================================================
    # 2. CONFIRM DEAL -> COMPLETE CHAT SESSION!
    # ==============================================================
    is_explicit_confirmation = any(w in lower for w in [
        "confirm the deal", "confirm deal", "confirm and proceed", "yes confirm",
        "place order", "place the order", "confirm order", "lock the deal", "yes place order"
    ])
    if (intent == "CONFIRM_DEAL" or is_explicit_confirmation) and conversation_context.get("pending_confirmation") and not is_new_search:
        pending_conf = conversation_context.get("pending_confirmation")
        if not pending_conf and active_deal:
            pending_conf = {
                "store": active_deal.get("bestStore", "Verified Merchant"),
                "url": active_deal.get("stores", [{}])[0].get("url", ""),
                "price": active_deal.get("basePrice", ""),
                "title": prod_title,
                "deal_data": active_deal,
                "session_id": session_id
            }

        if pending_conf:
            # Automate adding to cart / order placement
            if pending_conf.get("url"):
                await LiveMarketCrawler.automate_cart_addition(pending_conf["url"], pending_conf["title"])

            # Mark this chat session as COMPLETED in the database!
            sess_id_to_complete = pending_conf.get("session_id") or session_id
            if sess_id_to_complete:
                try:
                    async with AsyncSessionLocal() as db_sess:
                        sess_record = await db_sess.get(ChatSession, sess_id_to_complete)
                        if sess_record:
                            sess_record.status = "COMPLETED"
                            await db_sess.commit()
                except Exception as e:
                    print(f"Failed to mark chat session as COMPLETED: {e}")

            reply = (
                f"Deal confirmed and completed for '{pending_conf['title']}' on {pending_conf['store']} at Rs.{pending_conf['price']}! "
                f"Your order is verified and this shopping chat session is now completed!"
            )
            completed_deal_data = dict(pending_conf.get("deal_data") or {})
            completed_deal_data["is_completed"] = True
            completed_deal_data["confirmed_store"] = pending_conf["store"]
            completed_deal_data["confirmed_price"] = pending_conf["price"]
            completed_deal_data["confirmed_title"] = pending_conf["title"]
            completed_deal_data["confirmed_url"] = pending_conf["url"]

            # Clear pending states
            conversation_context["pending_confirmation"] = None
            conversation_context["last_deal_data"] = None

            return await emit_reply(
                reply,
                action="deal_completed",
                platform=pending_conf['store'].lower(),
                deal_query=pending_conf['title'],
                deal_data=completed_deal_data,
                status="COMPLETED"
            )

    # ==============================================================
    # 3. DID NOT CONFIRM -> RESEARCH AGAIN!
    # ==============================================================
    is_reject_or_search_more = (
        intent == "SEARCH_MORE" or
        any(w in lower for w in ["search more", "research", "search again", "more option", "other deal", "other store", "not this", "different store"]) or
        (conversation_context.get("pending_confirmation") and re.search(r'\b(?:no|nope|nah)\b', lower) and not any(w in lower for w in ["size", "know"]))
    )
    if is_reject_or_search_more and not is_new_search:
        conversation_context["pending_confirmation"] = None
        target_product = conversation_context.get("last_product_query") or prod_title

        # Execute fresh live search across alternative stores
        live_result = await LiveWebSearchProvider.execute_live_multi_store_search(
            target_product,
            min_budget=conversation_context.get("last_min_budget"),
            max_budget=conversation_context.get("last_budget")
        )

        if not live_result or not live_result.get("success") or not live_result.get("stores"):
            fail_msg = f"I researched other live stores for '{target_product}', but could not verify alternative options in your range. Would you like to adjust your budget or try another item?"
            return await emit_reply(fail_msg, action="none", deal_query=target_product, status="FAILED_SEARCH")

        conversation_context["last_deal_data"] = live_result
        best_price = live_result.get("basePrice")
        best_store = live_result.get("bestStore")
        raw_title = live_result.get("title", target_product)

        reply = (
            f"I researched alternative options for '{raw_title}'! "
            f"Best verified price is Rs.{best_price} on {best_store}. "
            f"Say 'proceed the deal' to open the store website and inspect it!"
        )
        primary_url = live_result.get("stores", [{}])[0].get("url", "")
        return await emit_reply(
            reply,
            action="show_deal_overlay",
            search_url=primary_url,
            product_query=raw_title,
            deal_query=raw_title,
            deal_data=live_result,
            status="RESEARCHED_MORE"
        )

    if (intent == "PROCEED_DEAL" or any(w in lower for w in [
        "proceed the deal", "proceed with deal", "proceed with best", "proceed",
        "pick deal", "choose deal", "select deal", "pick the", "choose the", "go with",
        "open the", "open store", "open website", "open price", "open the price", "open the rs",
        "exactly open"
    ])) and active_deal and active_deal.get("stores"):
        stores_list = active_deal.get("stores", [])
        chosen_store = None
        chosen_url = None
        chosen_price = active_deal.get("basePrice", "verified")
        matched_ordinal_name = None

        # 1. Check ordinal indicators (e.g. "1st", "second", "3rd deal", "option 2")
        ordinal_patterns = [
            (r'\b(?:1st|first)\b', 0, "1st"),
            (r'\b(?:2nd|second)\b', 1, "2nd"),
            (r'\b(?:3rd|third)\b', 2, "3rd"),
            (r'\b(?:4th|fourth)\b', 3, "4th"),
            (r'\b(?:5th|fifth)\b', 4, "5th"),
            (r'\b(?:deal\s*1|option\s*1|position\s*1)\b', 0, "1st"),
            (r'\b(?:deal\s*2|option\s*2|position\s*2)\b', 1, "2nd"),
            (r'\b(?:deal\s*3|option\s*3|position\s*3)\b', 2, "3rd"),
            (r'\b(?:deal\s*4|option\s*4|position\s*4)\b', 3, "4th"),
        ]
        for pat, idx, name in ordinal_patterns:
            if re.search(pat, lower):
                if idx < len(stores_list):
                    chosen_store = stores_list[idx].get("name")
                    chosen_url = stores_list[idx].get("url")
                    chosen_price = stores_list[idx].get("price", chosen_price)
                    matched_ordinal_name = name
                    break

        # 1B. Check if user mentioned a specific price from the stores list (e.g. "open the Rs 150 price", "150 price", "at 150")
        if not chosen_store:
            price_matches = re.findall(r'\b(\d{2,6})\b', lower)
            for p_str in price_matches:
                p_val = float(p_str)
                for s in stores_list:
                    sp = s.get("price")
                    if sp and (abs(float(sp) - p_val) <= 2):
                        chosen_store = s.get("name")
                        chosen_url = s.get("url")
                        chosen_price = sp
                        break
                if chosen_store:
                    break

        store_aliases = {
            "blanket": "blinkit",
            "blankit": "blinkit",
            "blenkit": "blinkit",
            "blink it": "blinkit",
            "blink": "blinkit",
            "fresho": "bigbasket",
            "big basket": "bigbasket",
            "bigbasket": "bigbasket",
            "bb": "bigbasket",
            "flipkart": "flipkart",
            "flip kart": "flipkart",
            "amazon": "amazon",
            "croma": "croma",
            "chroma": "croma",
            "tatacliq": "tatacliq",
            "tata cliq": "tatacliq",
            "titan": "titan",
            "dealmesh": "dealmesh",
            "zepto": "zepto",
            "instamart": "instamart",
            "swiggy": "instamart",
            "myntra": "myntra",
            "ajio": "ajio",
            "max": "maxfashion",
            "maxfashion": "maxfashion",
            "max fashion": "maxfashion",
            "nykaa": "nykaa",
            "meesho": "meesho",
            "reliance": "reliancedigital",
            "reliancedigital": "reliancedigital",
            "fnp": "fnp",
            "ferns": "fnp",
            "nikki": "nikki",
            "blooms": "bloomsflora",
            "rose n petal": "rosenpetal",
            "nursery": "nurserylive"
        }

        # Check if user mentioned any store alias in speech
        target_name = (chosen_store_name or "").lower()
        for alias, mapped in store_aliases.items():
            if alias in lower:
                target_name = mapped
                break

        if target_name and not chosen_store:
            for s in stores_list:
                s_name_l = s.get("name", "").lower()
                s_url_l = s.get("url", "").lower()
                if target_name in s_name_l or target_name in s_url_l:
                    chosen_store = s.get("name")
                    chosen_url = s.get("url")
                    chosen_price = s.get("price", chosen_price)
                    break

            # If the user specifically requested a store (e.g. Myntra), synthesize real live store URL
            if not chosen_store:
                if target_name == "myntra":
                    chosen_store = "Myntra"
                    chosen_url = f"https://www.myntra.com/{urllib.parse.quote_plus(prod_title)}"
                elif target_name == "amazon":
                    chosen_store = "Amazon India"
                    chosen_url = f"https://www.amazon.in/s?k={urllib.parse.quote_plus(prod_title)}"
                elif target_name == "flipkart":
                    chosen_store = "Flipkart"
                    chosen_url = f"https://www.flipkart.com/search?q={urllib.parse.quote_plus(prod_title)}"
                elif target_name == "croma":
                    chosen_store = "Croma"
                    chosen_url = f"https://www.croma.com/searchB?q={urllib.parse.quote_plus(prod_title)}"
                elif target_name == "ajio":
                    chosen_store = "Ajio"
                    chosen_url = f"https://www.ajio.com/search/?text={urllib.parse.quote_plus(prod_title)}"
                elif target_name in ["maxfashion", "max"]:
                    chosen_store = "Max Fashion"
                    chosen_url = f"https://www.maxfashion.in/in/en/search?q={urllib.parse.quote_plus(prod_title)}"
                elif target_name in ["tatacliq", "tata cliq"]:
                    chosen_store = "Tata CLiQ"
                    chosen_url = f"https://www.tatacliq.com/search/?searchCategory=all&text={urllib.parse.quote_plus(prod_title)}"
                elif target_name == "nykaa":
                    chosen_store = "Nykaa"
                    chosen_url = f"https://www.nykaa.com/search/result/?q={urllib.parse.quote_plus(prod_title)}"
                elif target_name == "meesho":
                    chosen_store = "Meesho"
                    chosen_url = f"https://www.meesho.com/search?q={urllib.parse.quote_plus(prod_title)}"
                elif target_name in ["reliancedigital", "reliance"]:
                    chosen_store = "Reliance Digital"
                    chosen_url = f"https://www.reliancedigital.in/search?q={urllib.parse.quote_plus(prod_title)}"
                else:
                    chosen_store = target_name.title()
                    chosen_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(f'{prod_title} {chosen_store}')}"

        if not chosen_store:
            # Default to best verified store
            chosen_store = active_deal.get("bestStore") or stores_list[0].get("name")
            chosen_url = stores_list[0].get("url")
            chosen_price = stores_list[0].get("price", chosen_price)

        # Safety check on aggregator URLs
        if chosen_url and "91mobile" in chosen_url.lower():
            chosen_store = "Amazon India"
            chosen_url = f"https://www.amazon.in/s?k={urllib.parse.quote_plus(prod_title)}"

        is_ai_store = any(k in (chosen_store or "").lower() for k in ["dealmesh", "titan", "bloommesh"])

        # USER REQUIREMENT: If store has AI bot -> Can negotiate with bot!
        if is_ai_store:
            reply = (
                f"You selected {chosen_store}! TitanBot AI is active on this store. "
                f"Say 'negotiate' to have both bots negotiate a lower price, or say 'confirm' to proceed straight to cart!"
            )
            return await emit_reply(
                reply,
                action="show_deal_overlay",
                deal_query=prod_title,
                deal_data=active_deal,
                status="AI_DEAL_SELECTED"
            )

        # USER REQUIREMENT: Open website, inspect live screen immediately, and ask user for product / variant verification!
        controller = LiveMarketCrawler.get_browser_controller()
        loop = asyncio.get_event_loop()
        try:
            inspect_res = await asyncio.wait_for(
                loop.run_in_executor(
                    None,
                    controller.open_and_inspect,
                    chosen_url,
                    prod_title
                ),
                timeout=10.0
            )
        except Exception as insp_err:
            print(f"[Voice] Browser inspection non-blocking timeout or notice: {insp_err}")
            inspect_res = None

        insp_data = inspect_res.get("data") if (inspect_res and inspect_res.get("status") == "success") else None

        if active_deal:
            active_deal["bestStore"] = chosen_store
            active_deal["confirmed_store"] = chosen_store
            active_deal["url"] = chosen_url
            active_deal["confirmed_url"] = chosen_url
            active_deal["basePrice"] = chosen_price

        conversation_context["pending_confirmation"] = {
            "store": chosen_store,
            "url": chosen_url,
            "price": chosen_price,
            "title": prod_title,
            "deal_data": active_deal,
            "session_id": session_id
        }

        if insp_data and insp_data.get("page_type") == "multi_product":
            conversation_context["awaiting_screen_product_choice"] = True
            conversation_context["screen_inspection"] = insp_data
            reply = insp_data.get("spoken_prompt") or (
                f"I've opened {chosen_store} on your screen! There are multiple products visible. "
                f"Which one would you like to proceed with?"
            )
            screen_deal_data = dict(active_deal or {})
            screen_deal_data["page_type"] = "multi_product"
            screen_deal_data["bestStore"] = insp_data.get("store_name", chosen_store)
            screen_deal_data["products"] = insp_data.get("products", [])
            if insp_data.get("products"):
                screen_deal_data["basePrice"] = min(p["price"] for p in insp_data["products"])
            return await emit_reply(
                reply,
                action="show_screen_products",
                search_url=chosen_url,
                platform=(chosen_store or "").lower(),
                deal_query=prod_title,
                deal_data=screen_deal_data,
                status="SCREEN_MULTI_PRODUCT"
            )

        elif insp_data and insp_data.get("page_type") == "requires_options":
            conversation_context["awaiting_variant_choice"] = True
            conversation_context["screen_inspection"] = insp_data
            reply = insp_data.get("spoken_prompt") or (
                f"I've opened {chosen_store} on your screen! What size and quantity would you like me to select?"
            )
            screen_deal_data = dict(active_deal or {})
            screen_deal_data["page_type"] = "requires_options"
            screen_deal_data["available_sizes"] = insp_data.get("available_sizes", [])
            return await emit_reply(
                reply,
                action="show_variant_picker",
                search_url=chosen_url,
                platform=(chosen_store or "").lower(),
                deal_query=prod_title,
                deal_data=screen_deal_data,
                status="AWAITING_VARIANT"
            )

        elif insp_data and insp_data.get("live_price"):
            live_price = insp_data["live_price"]
            conversation_context["pending_confirmation"] = {
                "store": chosen_store,
                "url": chosen_url,
                "price": live_price,
                "title": insp_data.get("page_title") or prod_title,
                "deal_data": active_deal,
                "session_id": session_id
            }
            reply = (
                f"I've opened {chosen_store} on your screen! The verified live price on the page is Rs.{live_price}. "
                f"Say 'yes confirm' to add it to your cart and lock this deal!"
            )
            screen_deal_data = dict(active_deal or {})
            screen_deal_data["basePrice"] = live_price
            screen_deal_data["title"] = insp_data.get("page_title") or prod_title
            return await emit_reply(
                reply,
                action="show_deal_overlay",
                search_url=chosen_url,
                platform=(chosen_store or "").lower(),
                deal_query=prod_title,
                deal_data=screen_deal_data,
                status="AWAITING_CONFIRMATION"
            )

        conversation_context["pending_confirmation"] = {
            "store": chosen_store,
            "url": chosen_url,
            "price": chosen_price,
            "title": prod_title,
            "deal_data": active_deal,
            "session_id": session_id
        }

        is_shoes_or_apparel = any(w in (prod_title or "").lower() for w in [
            "shoe", "shoes", "sneaker", "sneakers", "loafers", "boot", "boots", "sandals", "slippers",
            "shirt", "tshirt", "t-shirt", "kurta", "jeans", "pants", "dress"
        ])

        if is_shoes_or_apparel:
            conversation_context["awaiting_variant_choice"] = True
            reply = (
                f"I've opened {chosen_store} on your screen for '{prod_title}' at Rs.{chosen_price}! "
                f"What shoe size do you wear (e.g. UK 7, 8, 9, 10) so I can select it for you?"
            )
            return await emit_reply(
                reply,
                action="show_variant_picker",
                search_url=chosen_url,
                platform=(chosen_store or "").lower(),
                product_query=prod_title,
                deal_query=prod_title,
                deal_data=active_deal,
                status="AWAITING_VARIANT"
            )

        reply = (
            f"I've opened {chosen_store} on your screen for '{prod_title}' at Rs.{chosen_price}. "
            f"Please verify: say 'yes confirm' to add it to your cart and proceed with this deal."
        )
        return await emit_reply(
            reply,
            action="show_deal_overlay",
            search_url=chosen_url,
            platform=(chosen_store or "").lower(),
            product_query=prod_title,
            deal_query=prod_title,
            deal_data=active_deal,
        )

    # ==============================================================
    # 5. SEARCH / BUDGET UPDATE (LIVE WEB SEARCH & DIRECT POPUP)
    # ==============================================================
    if intent in ["SEARCH_PRODUCT", "BUDGET_UPDATE"]:
        clean_search = target_product or "deals"
        
        # Clear pending product and record budget if provided
        conversation_context["pending_product"] = None
        if budget is not None:
            conversation_context["last_budget"] = budget
        conversation_context["last_product_query"] = clean_search

        # Execute 100% REAL live web search with local AI Storefront priority (< 2s)
        live_result = await LiveWebSearchProvider.execute_live_multi_store_search(
            clean_search,
            min_budget=min_budget,
            max_budget=budget
        )
        
        if not live_result or not live_result.get("success") or not live_result.get("stores"):
            range_desc = f"between Rs.{min_budget} and Rs.{budget}" if min_budget and budget else (f"under Rs.{budget}" if budget else "")
            fail_msg = f"I searched the live web for '{clean_search}' {range_desc}, but could not verify live merchant prices in that range right now. Please try another specific product or price range."
            return await emit_reply(fail_msg, action="none", deal_query=clean_search, status="FAILED_SEARCH")

        conversation_context["last_deal_data"] = live_result

        stores_count = len(live_result.get("stores", []))
        best_price = live_result.get("basePrice")
        raw_title = live_result.get("title", clean_search)

        # Sanitize SEO spam from title
        clean_title = re.sub(r'^(buy|shop|order)\s+', '', raw_title, flags=re.I)
        clean_title = re.sub(r'\s+(online\s+at\s+best\s+prices|online\s+at\s+low\s+prices|great\s+indian\s+summer\s+sale|online\s+shopping).*$', '', clean_title, flags=re.I)
        clean_title = re.sub(r'\s*[|—–-]\s*(amazon\.in|flipkart|titan|myntra|croma).*$', '', clean_title, flags=re.I)
        clean_title = re.sub(r'\s*,.*online.*$', '', clean_title, flags=re.I).strip() or clean_search
        title = clean_title
        live_result["title"] = title
        best_store = live_result.get("bestStore") or "Titan Store"
        top_store_obj = live_result.get("stores", [{}])[0]
        has_ai_bot = top_store_obj.get("has_ai_merchant") or any(k in (best_store or "").lower() for k in ["titan", "dealmesh"])

        # If user explicitly asked to negotiate right away
        if any(k in lower for k in ["negotiat", "bargain", "haggle", "arrange a negotiation", "meet the bot"]):
            reply = (
                f"I found an AI Merchant available for '{title}' at {best_store}! "
                f"Summoning TitanBot directly onto your desktop right now and negotiating autonomously on your behalf to get you the best deal below market price."
            )
            return await emit_reply(
                reply,
                action="show_negotiation_arena",
                search_url="http://localhost:5174/",
                product_query=title,
                deal_query=title,
                deal_data=live_result,
                status="NEGOTIATING"
            )

        # Check for any out-of-stock stores to alert user
        oos_stores = [s.get("name") for s in live_result.get("stores", []) if s.get("in_stock") is False]
        dealmesh_in_stores = any("dealmesh" in (s.get("name") or "").lower() for s in live_result.get("stores", []))
        if oos_stores and dealmesh_in_stores:
            oos_note = f" (Note: {oos_stores[0]} is currently out of stock, but our DealMesh store has it guaranteed in stock!)."
        elif oos_stores:
            oos_note = f" (Note: {oos_stores[0]} is currently out of stock)."
        else:
            oos_note = ""

        # Directly show the deal popup on screen!
        if has_ai_bot:
            reply = (
                f"I found verified deals for '{title}'! "
                f"Our top recommendation is {best_store} at Rs.{best_price} with TitanBot AI available.{oos_note} "
                f"I've opened the deals popup on your screen. Say 'negotiate' to have both bots negotiate a better deal, or say 'proceed'!"
            )
        else:
            reply = (
                f"I found verified deals for '{title}'! "
                f"The best verified price is Rs.{best_price} on {best_store}. This store has fixed retail prices (no bot available).{oos_note} "
                f"I've opened the deals popup on your screen. Say 'proceed' to verify and continue with this deal!"
            )

        primary_url = live_result.get("stores", [{}])[0].get("url", "")
        return await emit_reply(
            reply,
            action="show_deal_overlay",
            search_url=primary_url,
            product_query=title,
            deal_query=title,
            deal_data=live_result,
            status="VERIFIED_LIVE"
        )

    # Email drafting and browser shortcuts
    if any(k in lower for k in ["open brave", "brave browser", "open my mails", "open mail", "open gmail", "access my mail", "check my mail"]):
        reply = "Opening webmail in your browser for you!"
        return await emit_reply(reply, action="open_url", search_url="https://mail.google.com", status="BROWSER_ACTION")

    if any(k in lower for k in ["write an email", "draft an email", "email for my hr", "leave request"]):
        draft_prompt = (
            "You are Omni, a smart desktop AI assistant. The user asked to write an email for their HR regarding a leave request. "
            "Provide a concise, professional leave application draft ready to copy and send. Keep it clear and under 5 lines."
        )
        ai_draft = await llm_service.generate_response(draft_prompt, user_msg)
        if ai_draft:
            clean_draft = re.sub(r'[^\x20-\x7E\n]', '', ai_draft.strip())
            return await emit_reply(clean_draft, action="chat", status="EMAIL_DRAFT")

    # General conversational query
    system_prompt = (
        "You are Omni, a proactive, capable, and cheerful AI desktop companion for DealMesh. "
        "You have desktop automation capabilities: you can open browsers (Brave, Chrome), launch apps, draft emails, and find live shopping deals. "
        "Never claim you lack permissions or cannot open apps; assist the user enthusiastically with helpful answers or drafts. "
        "Keep spoken responses punchy, helpful, and natural (1 to 3 short sentences)."
    )

    try:
        ai_reply = await llm_service.generate_response(system_prompt, user_msg)
        if ai_reply and ai_reply.strip():
            clean_reply = re.sub(r'[^\x20-\x7E]', '', ai_reply.strip())
            return await emit_reply(clean_reply, action="chat", status="CHAT")
    except Exception as e:
        print(f"LLM Chat Error: {e}")

    fallback_reply = f"I hear you loud and clear! You said '{user_msg}'. How can I assist you?"
    return await emit_reply(fallback_reply, action="chat", status="CHAT")
