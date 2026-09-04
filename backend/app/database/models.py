import datetime
import uuid
import json
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default="buyer")  # buyer, merchant, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    pet = relationship("Pet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_policy = relationship("BuyerPolicy", back_populates="user", uselist=False, cascade="all, delete-orphan")
    merchants = relationship("Merchant", back_populates="user", cascade="all, delete-orphan")


class Pet(Base):
    __tablename__ = "pets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100), default="Omni")
    species = Column(String(50), default="Fox")  # Fox, Cat, Dog, Owl, Dragon
    personality = Column(String(50), default="Playful")  # Playful, Sharp, Calm, Protective
    appearance = Column(String(100), default="orange_fox")
    state = Column(String(50), default="SLEEPING")  # SLEEPING, WAKING, LISTENING, UNDERSTANDING, SEARCHING, BROWSING, NEGOTIATING, COMPARING, WAITING_FOR_APPROVAL, PAYING, COMPLETED, RECOVERING
    current_thought = Column(String(255), default="Zzz... dreaming of great deals")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="pet")


class BuyerPolicy(Base):
    __tablename__ = "buyer_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    target_price = Column(Float, default=2000.0)
    auto_negotiation_cap = Column(Float, default=2700.0)
    absolute_max = Column(Float, default=3000.0)
    allowed_categories = Column(Text, default="watches,electronics,accessories")  # comma separated
    allowed_merchants = Column(Text, default="*")
    final_purchase_requires_user = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="buyer_policy")


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    store_name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="Watches & Accessories")
    website = Column(String(255), nullable=True)
    contact_info = Column(String(255), nullable=True)
    agent_supported = Column(Boolean, default=True)
    dmcp_endpoint = Column(String(255), default="/agent")
    trust_reputation_score = Column(Float, default=94.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="merchants")
    agent = relationship("MerchantAgent", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
    products = relationship("Product", back_populates="merchant", cascade="all, delete-orphan")


class MerchantAgent(Base):
    __tablename__ = "merchant_agents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), unique=True, nullable=False)
    agent_name = Column(String(100), default="TitanBot")
    personality = Column(String(50), default="Pragmatic Seller")
    is_paused = Column(Boolean, default=False)
    negotiation_enabled = Column(Boolean, default=True)
    max_auto_discount_percent = Column(Float, default=20.0)
    human_approval_threshold = Column(Float, default=2400.0)
    inventory_reservation_enabled = Column(Boolean, default=True)
    suggest_alternatives = Column(Boolean, default=True)
    scarcity_mode = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    merchant = relationship("Merchant", back_populates="agent")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    brand = Column(String(100), nullable=False)
    category = Column(String(100), default="Watches")
    listed_price = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    features = Column(Text, default="[]")  # JSON list
    rating = Column(Float, default=4.5)
    review_count = Column(Integer, default=120)
    seller_name = Column(String(255), default="Official Brand Store")
    delivery_days = Column(Integer, default=2)
    return_days = Column(Integer, default=30)
    inventory = Column(Integer, default=10)
    is_ai_native = Column(Boolean, default=False)
    source = Column(String(100), default="demo_feed")
    last_verified_at = Column(DateTime, default=datetime.datetime.utcnow)
    image_url = Column(String(500), nullable=True)

    merchant = relationship("Merchant", back_populates="products")
    policy = relationship("MerchantPolicy", back_populates="product", uselist=False, cascade="all, delete-orphan")


class MerchantPolicy(Base):
    __tablename__ = "merchant_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), unique=True, nullable=False)
    preferred_price = Column(Float, nullable=False)
    auto_negotiation_floor = Column(Float, nullable=False)
    absolute_floor = Column(Float, nullable=False)  # 🔒 strictly private server-side
    max_discount_percent = Column(Float, default=20.0)
    human_approval_threshold = Column(Float, nullable=False)

    product = relationship("Product", back_populates="policy")


class SearchSession(Base):
    __tablename__ = "search_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False)
    query = Column(String(255), nullable=False)
    min_price = Column(Float, default=1000.0)
    max_price = Column(Float, default=3000.0)
    category = Column(String(100), default="Watches")
    stores_checked = Column(Integer, default=0)
    products_found = Column(Integer, default=0)
    ai_merchants_count = Column(Integer, default=0)
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Negotiation(Base):
    __tablename__ = "negotiations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    search_session_id = Column(String(36), nullable=True)
    user_id = Column(String(36), nullable=False)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    buyer_agent_name = Column(String(100), default="Omni")
    merchant_agent_name = Column(String(100), default="TitanBot")
    current_buyer_offer = Column(Float, nullable=True)
    current_merchant_counter = Column(Float, nullable=True)
    agreed_price = Column(Float, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, WAITING_FOR_APPROVAL, AGREED, REJECTED, EXPIRED, LOCKED, SCARCITY_HOLD
    rounds_count = Column(Integer, default=0)
    decision_reason = Column(Text, nullable=True)
    approval_required = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    messages = relationship("NegotiationMessage", back_populates="negotiation", cascade="all, delete-orphan")


class InventoryReservation(Base):
    __tablename__ = "inventory_reservations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    negotiation_id = Column(String(36), nullable=True)
    deal_id = Column(String(36), nullable=True)
    buyer_agent_id = Column(String(100), default="Omni")
    quantity = Column(Integer, default=1)
    status = Column(String(50), default="RESERVED")  # RESERVED, COMMITTED, RELEASED, EXPIRED
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    negotiation_id = Column(String(36), ForeignKey("negotiations.id"), nullable=False)
    sender_type = Column(String(20), nullable=False)  # BUYER, MERCHANT, SYSTEM
    sender_name = Column(String(100), nullable=False)
    offer_amount = Column(Float, nullable=True)
    message_text = Column(Text, nullable=False)
    authorization_token = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    negotiation = relationship("Negotiation", back_populates="messages")


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    deal_ref = Column(String(50), unique=True, nullable=False)
    negotiation_id = Column(String(36), nullable=True)
    user_id = Column(String(36), nullable=False)
    merchant_id = Column(String(36), ForeignKey("merchants.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    listed_price = Column(Float, nullable=False)
    final_price = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    buyer_authorization = Column(String(255), default="valid")
    merchant_authorization = Column(String(255), default="valid")
    inventory_reserved = Column(Boolean, default=True)
    status = Column(String(50), default="LOCKED")  # LOCKED, EXPIRED, PAID, FAILED, RECOVERED, CANCELLED
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    deal_id = Column(String(36), ForeignKey("deals.id"), nullable=False)
    user_id = Column(String(36), nullable=False)
    merchant_id = Column(String(36), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    razorpay_order_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    status = Column(String(50), default="INITIATED")  # INITIATED, AUTHORIZED, CAPTURED, FAILED, RECOVERED
    attempts_count = Column(Integer, default=1)
    risk_score = Column(Float, default=0.02)
    idempotency_key = Column(String(100), unique=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class RiskCheck(Base):
    __tablename__ = "risk_checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    deal_id = Column(String(36), nullable=False)
    decision = Column(String(20), default="ALLOW")  # ALLOW, REVIEW, BLOCK
    risk_score = Column(Float, default=0.0)
    reasons = Column(Text, default="[]")  # JSON list
    checked_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=False)
    actor_type = Column(String(50), nullable=False)  # BUYER_AGENT, MERCHANT_AGENT, POLICY_ENGINE, RISK_ENGINE, RAZORPAY
    actor_id = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    details = Column(Text, default="{}")  # JSON data
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), default="user_buyer_default")
    title = Column(String(255), default="New Chat")
    last_message = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, COMPLETED, ABANDONED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ChatLog(Base):
    __tablename__ = "chat_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), nullable=True, index=True)
    user_id = Column(String(36), default="user_buyer_default")
    sender = Column(String(20), nullable=False)  # user, omni, system
    message_text = Column(Text, nullable=False)
    deal_query = Column(String(255), nullable=True)
    deal_data = Column(Text, nullable=True)  # JSON payload of multi-store comparison
    status = Column(String(50), default="ACTIVE")  # SEARCHED, COMPARED, PROCEEDED, PURCHASED, ABANDONED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BuyerSettings(Base):
    __tablename__ = "buyer_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(100), unique=True, nullable=False, index=True)
    accent_color = Column(String(50), default="#00F0FF")
    eye_color = Column(String(50), default="#00F0FF")
    voice_name = Column(String(100), default="default")
    voice_pitch = Column(Float, default=1.0)
    voice_rate = Column(Float, default=1.0)
    dock_x_percent = Column(Float, default=0.85)
    dock_y_percent = Column(Float, default=0.82)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

