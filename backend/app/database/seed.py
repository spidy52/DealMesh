import asyncio
import json
import datetime
import uuid
from sqlalchemy import select
from backend.app.database.session import AsyncSessionLocal, engine, Base
from backend.app.database.models import (
    User, Pet, BuyerPolicy, Merchant, MerchantAgent, Product, MerchantPolicy, generate_uuid
)

MERCHANTS_SEED = [
    {
        "id": "merchant_titan_demo",
        "store_name": "Titan Demo Store",
        "description": "Official flagship digital storefront for Titan luxury and formal timepieces with native DMCP AI agent.",
        "category": "Watches & Horology",
        "website": "https://titan.dealmesh.demo",
        "contact_info": "concierge@titan.demo",
        "agent_supported": True,
        "dmcp_endpoint": "/agent",
        "trust_reputation_score": 94.0,
        "agent_name": "TitanBot",
        "agent_personality": "Polite Luxury Concierge",
        "max_auto_discount": 20.0,
        "human_approval_threshold": 2400.0,
        "products": [
            {
                "id": "watch_titan_001",
                "name": "Titan Neo Workwear Classic Formal Watch",
                "brand": "Titan",
                "listed_price": 2799.0,
                "preferred_price": 2500.0,
                "auto_negotiation_floor": 2400.0,
                "absolute_floor": 2299.0,
                "rating": 4.8,
                "review_count": 3100,
                "seller_name": "Titan Official Retail",
                "delivery_days": 2,
                "return_days": 30,
                "inventory": 12,
                "features": ["Sapphire Crystal Glass", "Genuine Italian Leather Strap", "50m Water Resistant", "Quartz Precision Movement", "Date Display"],
                "image_url": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&q=80"
            },
            {
                "id": "watch_titan_002",
                "name": "Titan Regalia Sovereign Chronograph",
                "brand": "Titan",
                "listed_price": 3899.0,
                "preferred_price": 3400.0,
                "auto_negotiation_floor": 3200.0,
                "absolute_floor": 3000.0,
                "rating": 4.9,
                "review_count": 1840,
                "seller_name": "Titan Official Retail",
                "delivery_days": 1,
                "return_days": 30,
                "inventory": 6,
                "features": ["Stainless Steel Duo-Tone Strap", "Precision Chronograph", "Rose Gold Bezel", "100m Water Resistant"],
                "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80"
            },
            {
                "id": "watch_titan_003",
                "name": "Titan Edge Ultra-Slim Minimalist Watch",
                "brand": "Titan",
                "listed_price": 2499.0,
                "preferred_price": 2200.0,
                "auto_negotiation_floor": 2100.0,
                "absolute_floor": 1999.0,
                "rating": 4.7,
                "review_count": 950,
                "seller_name": "Titan Official Retail",
                "delivery_days": 2,
                "return_days": 30,
                "inventory": 1,  # Scarcity trigger product!
                "features": ["3.8mm Slim Profile", "Sunray Charcoal Dial", "Calfskin Leather Strap", "Scratch Resistant"],
                "image_url": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_chrono_ai",
        "store_name": "ChronoStore AI",
        "description": "Next-gen horology boutique with high-speed automated DMCP negotiation agents.",
        "category": "Watches & Horology",
        "website": "https://chrono.dealmesh.demo",
        "contact_info": "support@chronostore.demo",
        "agent_supported": True,
        "dmcp_endpoint": "/agent",
        "trust_reputation_score": 96.0,
        "agent_name": "ChronoAgent",
        "agent_personality": "Dynamic Dealmaker",
        "max_auto_discount": 22.0,
        "human_approval_threshold": 2100.0,
        "products": [
            {
                "id": "watch_chrono_001",
                "name": "Chrono Classic Executive Silver Edition",
                "brand": "Chrono",
                "listed_price": 2650.0,
                "preferred_price": 2350.0,
                "auto_negotiation_floor": 2200.0,
                "absolute_floor": 2150.0,
                "rating": 4.8,
                "review_count": 2200,
                "seller_name": "Chrono Precision Hub",
                "delivery_days": 2,
                "return_days": 30,
                "inventory": 15,
                "features": ["Automatic Self-Winding", "Anti-Reflective Coating", "Solid Link Bracelet", "Luminous Hands"],
                "image_url": "https://images.unsplash.com/photo-1547996160-71dfa63582b8?w=500&q=80"
            },
            {
                "id": "watch_chrono_002",
                "name": "Chrono Aviator Automatic Heritage",
                "brand": "Chrono",
                "listed_price": 2999.0,
                "preferred_price": 2600.0,
                "auto_negotiation_floor": 2450.0,
                "absolute_floor": 2399.0,
                "rating": 4.9,
                "review_count": 1430,
                "seller_name": "Chrono Precision Hub",
                "delivery_days": 2,
                "return_days": 30,
                "inventory": 4,
                "features": ["Matte Black Dial", "Pilot Style Markers", "Reinforced Canvas Band", "Shock Resistant"],
                "image_url": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_aura_ai",
        "store_name": "AuraWatches AI",
        "description": "Smart boutique specializing in contemporary dress watches with conversational DMCP commerce.",
        "category": "Watches & Horology",
        "website": "https://aurawatches.demo",
        "contact_info": "hello@aurawatches.demo",
        "agent_supported": True,
        "dmcp_endpoint": "/agent",
        "trust_reputation_score": 92.0,
        "agent_name": "AuraBot",
        "agent_personality": "Friendly Specialist",
        "max_auto_discount": 18.0,
        "human_approval_threshold": 1900.0,
        "products": [
            {
                "id": "watch_aura_001",
                "name": "Aura Grand Prix Midnight Dress Watch",
                "brand": "Aura",
                "listed_price": 2399.0,
                "preferred_price": 2100.0,
                "auto_negotiation_floor": 1950.0,
                "absolute_floor": 1899.0,
                "rating": 4.6,
                "review_count": 890,
                "seller_name": "Aura Direct",
                "delivery_days": 3,
                "return_days": 15,
                "inventory": 8,
                "features": ["Deep Navy Sunburst Dial", "Mesh Steel Band", "Japanese Miyota Movement", "Water Resistant 3ATM"],
                "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_apex_ai",
        "store_name": "Apex Horology AI",
        "description": "Curated premium horology studio with automated DMCP protocol integration.",
        "category": "Watches & Horology",
        "website": "https://apexhorology.demo",
        "contact_info": "sales@apexhorology.demo",
        "agent_supported": True,
        "dmcp_endpoint": "/agent",
        "trust_reputation_score": 95.0,
        "agent_name": "ApexBot",
        "agent_personality": "Executive Broker",
        "max_auto_discount": 15.0,
        "human_approval_threshold": 2300.0,
        "products": [
            {
                "id": "watch_apex_001",
                "name": "Apex Sovereign Monolith Titanium Watch",
                "brand": "Apex",
                "listed_price": 2899.0,
                "preferred_price": 2550.0,
                "auto_negotiation_floor": 2400.0,
                "absolute_floor": 2350.0,
                "rating": 4.8,
                "review_count": 1120,
                "seller_name": "Apex Guild",
                "delivery_days": 2,
                "return_days": 30,
                "inventory": 5,
                "features": ["Grade 2 Titanium Casing", "Ceramic Bezel", "Micro-adjust Clasp", "Super-LumiNova"],
                "image_url": "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=500&q=80"
            }
        ]
    },
    # Traditional Non-AI fixed price merchants
    {
        "id": "merchant_stylekart",
        "store_name": "StyleKart",
        "description": "Major multi-brand retail marketplace with fixed pricing.",
        "category": "Department Store",
        "website": "https://stylekart.demo",
        "contact_info": "help@stylekart.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 86.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_stylekart_001",
                "name": "Timex Modern Easy Reader Dress Watch",
                "brand": "Timex",
                "listed_price": 2199.0,
                "rating": 4.4,
                "review_count": 1540,
                "seller_name": "StyleKart Fulfilled",
                "delivery_days": 3,
                "return_days": 10,
                "inventory": 20,
                "features": ["Indiglo Night-Light", "White Dial", "Black Leather Strap"],
                "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&q=80"
            },
            {
                "id": "watch_stylekart_002",
                "name": "Casio Enticer Minimal Analog Watch",
                "brand": "Casio",
                "listed_price": 1895.0,
                "rating": 4.5,
                "review_count": 2800,
                "seller_name": "CloudRetail India",
                "delivery_days": 2,
                "return_days": 7,
                "inventory": 35,
                "features": ["Mineral Glass", "Stainless Steel Case", "Water Resistance"],
                "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_watchhub",
        "store_name": "WatchHub",
        "description": "Dedicated watch portal with curated traditional inventory.",
        "category": "Watches",
        "website": "https://watchhub.demo",
        "contact_info": "contact@watchhub.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 91.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_watchhub_001",
                "name": "Fossil Minimalist Slim Formal Watch",
                "brand": "Fossil",
                "listed_price": 2895.0,
                "rating": 4.6,
                "review_count": 1820,
                "seller_name": "WatchHub Verified",
                "delivery_days": 2,
                "return_days": 15,
                "inventory": 14,
                "features": ["Satin Dial", "Brown Leather Strap", "Quartz Three-Hand Movement"],
                "image_url": "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_timemarket",
        "store_name": "TimeMarket",
        "description": "Discount watch seller with fast shipping.",
        "category": "Watches",
        "website": "https://timemarket.demo",
        "contact_info": "orders@timemarket.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 78.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_timemarket_001",
                "name": "Sonata Volt Business Analog Watch",
                "brand": "Sonata",
                "listed_price": 1250.0,
                "rating": 4.1,
                "review_count": 420,
                "seller_name": "FastTrack Logistics",
                "delivery_days": 4,
                "return_days": 7,
                "inventory": 50,
                "features": ["Alloy Case", "Textured Dial", "1 Year Warranty"],
                "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_luxeavenue",
        "store_name": "LuxeAvenue",
        "description": "Upscale luxury marketplace with curated collections.",
        "category": "Luxury Fashion",
        "website": "https://luxeavenue.demo",
        "contact_info": "support@luxeavenue.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 89.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_luxe_001",
                "name": "Tommy Hilfiger Royal Classic Formal Watch",
                "brand": "Tommy Hilfiger",
                "listed_price": 2999.0,
                "rating": 4.5,
                "review_count": 910,
                "seller_name": "Luxe Verified Outlet",
                "delivery_days": 3,
                "return_days": 14,
                "inventory": 9,
                "features": ["Navy Blue Dial", "Signature TH Flag Logo", "Stainless Steel Mesh"],
                "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_metrotime",
        "store_name": "MetroTime",
        "description": "Urban watch retailer with everyday deals.",
        "category": "Watches",
        "website": "https://metrotime.demo",
        "contact_info": "care@metrotime.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 74.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_metro_001",
                "name": "Fastrack Trendsetter Dress Analog",
                "brand": "Fastrack",
                "listed_price": 1499.0,
                "rating": 4.2,
                "review_count": 670,
                "seller_name": "Metro Express",
                "delivery_days": 4,
                "return_days": 7,
                "inventory": 22,
                "features": ["Grey Sunray Dial", "Leather Band", "Water Resistant 30m"],
                "image_url": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_pulsetime",
        "store_name": "PulseTime",
        "description": "Trendy accessories and contemporary wristwear store.",
        "category": "Fashion Accessories",
        "website": "https://pulsetime.demo",
        "contact_info": "hello@pulsetime.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 81.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_pulse_001",
                "name": "Citizen Eco-Drive Essential Dress Watch",
                "brand": "Citizen",
                "listed_price": 2750.0,
                "rating": 4.7,
                "review_count": 880,
                "seller_name": "Pulse Authorized",
                "delivery_days": 3,
                "return_days": 15,
                "inventory": 11,
                "features": ["Solar Powered Eco-Drive", "Black Dial", "Stainless Steel Bracelet"],
                "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_urbanclocks",
        "store_name": "UrbanClocks",
        "description": "Discount horology depot.",
        "category": "Watches & Clocks",
        "website": "https://urbanclocks.demo",
        "contact_info": "info@urbanclocks.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 70.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_urban_001",
                "name": "Skmei Executive Black Quartz Watch",
                "brand": "Skmei",
                "listed_price": 1050.0,
                "rating": 3.9,
                "review_count": 310,
                "seller_name": "Urban Direct",
                "delivery_days": 5,
                "return_days": 5,
                "inventory": 60,
                "features": ["Zinc Alloy Case", "Black Coating", "Quartz Movement"],
                "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80"
            }
        ]
    },
    {
        "id": "merchant_velvetwatches",
        "store_name": "VelvetWatches",
        "description": "Boutique watch gallery with classic styling.",
        "category": "Watches",
        "website": "https://velvetwatches.demo",
        "contact_info": "concierge@velvetwatches.demo",
        "agent_supported": False,
        "dmcp_endpoint": "",
        "trust_reputation_score": 83.0,
        "agent_name": "",
        "agent_personality": "",
        "products": [
            {
                "id": "watch_velvet_001",
                "name": "Daniel Wellington Classic St Mawes Dress Watch",
                "brand": "Daniel Wellington",
                "listed_price": 2899.0,
                "rating": 4.5,
                "review_count": 1340,
                "seller_name": "Velvet Horizon",
                "delivery_days": 2,
                "return_days": 14,
                "inventory": 16,
                "features": ["Eggshell White Dial", "Rose Gold Casing", "Italian Leather Strap"],
                "image_url": "https://images.unsplash.com/photo-1547996160-71dfa63582b8?w=500&q=80"
            }
        ]
    }
]

# Additional 30+ generated catalog items for rich search
ADDITIONAL_WATCH_NAMES = [
    ("Titan Octane Active Sport Chronograph", "Titan", 2950.0, 94.0, True, "Titan Demo Store"),
    ("Titan Karishma Gold Formal Analog", "Titan", 1999.0, 94.0, True, "Titan Demo Store"),
    ("Chrono Horizon Automatic GMT", "Chrono", 2790.0, 96.0, True, "ChronoStore AI"),
    ("Chrono Stealth Matte Diver Watch", "Chrono", 2490.0, 96.0, True, "ChronoStore AI"),
    ("Aura Solstice Rose Gold Watch", "Aura", 2150.0, 92.0, True, "AuraWatches AI"),
    ("Aura Eclipse Chrono Mesh", "Aura", 2590.0, 92.0, True, "AuraWatches AI"),
    ("Apex Zenith Titanium Automatic", "Apex", 2990.0, 95.0, True, "Apex Horology AI"),
    ("Casio Vintage Digital Gold", "Casio", 1695.0, 86.0, False, "StyleKart"),
    ("Timex Expedition Scout Watch", "Timex", 2399.0, 86.0, False, "StyleKart"),
    ("Fossil Neutra Minimal Chrono", "Fossil", 2995.0, 91.0, False, "WatchHub"),
    ("Sonata Sleek Steel Formal", "Sonata", 1150.0, 78.0, False, "TimeMarket"),
    ("Fastrack Casual Black Quartz", "Fastrack", 1350.0, 74.0, False, "MetroTime"),
    ("Citizen Quartz Gold Bezel", "Citizen", 2650.0, 81.0, False, "PulseTime"),
    ("Skmei Business Blue Dial", "Skmei", 1100.0, 70.0, False, "UrbanClocks"),
    ("Armani Exchange Stainless Watch", "Armani Exchange", 2999.0, 89.0, False, "LuxeAvenue"),
    ("Titan Classique Champagne Dial", "Titan", 2250.0, 94.0, True, "Titan Demo Store"),
    ("Titan Bandhan Couple Collection", "Titan", 2800.0, 94.0, True, "Titan Demo Store"),
    ("Chrono Matrix Skeleton Automatic", "Chrono", 2899.0, 96.0, True, "ChronoStore AI"),
    ("Aura Luna Ceramic Minimalist", "Aura", 2300.0, 92.0, True, "AuraWatches AI"),
    ("Apex Vanguard Ceramic Bezel", "Apex", 2750.0, 95.0, True, "Apex Horology AI"),
]

async def seed_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Seed Default Buyer User & Pet
        user_stmt = select(User).where(User.email == "buyer@dealmesh.ai")
        existing_user = (await session.execute(user_stmt)).scalars().first()
        
        if not existing_user:
            buyer_user = User(
                id="user_buyer_default",
                email="buyer@dealmesh.ai",
                name="Alex Walker",
                role="buyer"
            )
            session.add(buyer_user)
            await session.flush()

            pet = Pet(
                id="pet_omni_default",
                user_id=buyer_user.id,
                name="Omni",
                species="Fox",
                personality="Playful",
                appearance="orange_fox",
                state="SLEEPING",
                current_thought="Zzz... dreaming of great deals"
            )
            session.add(pet)

            buyer_policy = BuyerPolicy(
                id="policy_buyer_default",
                user_id=buyer_user.id,
                target_price=2000.0,
                auto_negotiation_cap=2700.0,
                absolute_max=3000.0,
                allowed_categories="watches,electronics,accessories",
                allowed_merchants="*",
                final_purchase_requires_user=True
            )
            session.add(buyer_policy)

        # 2. Seed Default Merchant User (for Titan Demo Store dashboard)
        merchant_user_stmt = select(User).where(User.email == "merchant@titan.demo")
        existing_merchant_user = (await session.execute(merchant_user_stmt)).scalars().first()
        if not existing_merchant_user:
            merchant_user = User(
                id="user_merchant_titan",
                email="merchant@titan.demo",
                name="Titan Store Manager",
                role="merchant"
            )
            session.add(merchant_user)
            await session.flush()
        else:
            merchant_user = existing_merchant_user

        # 3. Seed Merchants, Agents, Products and Merchant Policies
        for m_data in MERCHANTS_SEED:
            merchant_stmt = select(Merchant).where(Merchant.id == m_data["id"])
            existing_m = (await session.execute(merchant_stmt)).scalars().first()

            if not existing_m:
                merchant = Merchant(
                    id=m_data["id"],
                    user_id=merchant_user.id if m_data["agent_supported"] else None,
                    store_name=m_data["store_name"],
                    description=m_data["description"],
                    category=m_data["category"],
                    website=m_data["website"],
                    contact_info=m_data["contact_info"],
                    agent_supported=m_data["agent_supported"],
                    dmcp_endpoint=m_data["dmcp_endpoint"],
                    trust_reputation_score=m_data["trust_reputation_score"],
                    is_active=True
                )
                session.add(merchant)
                await session.flush()

                if m_data["agent_supported"]:
                    agent = MerchantAgent(
                        id=f"agent_{m_data['id']}",
                        merchant_id=merchant.id,
                        agent_name=m_data["agent_name"],
                        personality=m_data["agent_personality"],
                        is_paused=False,
                        negotiation_enabled=True,
                        max_auto_discount_percent=m_data.get("max_auto_discount", 20.0),
                        human_approval_threshold=m_data.get("human_approval_threshold", 2400.0),
                        inventory_reservation_enabled=True,
                        suggest_alternatives=True,
                        scarcity_mode=True
                    )
                    session.add(agent)

                # Add products
                for p_data in m_data.get("products", []):
                    prod = Product(
                        id=p_data["id"],
                        merchant_id=merchant.id,
                        name=p_data["name"],
                        brand=p_data["brand"],
                        category="Watches",
                        listed_price=p_data["listed_price"],
                        currency="INR",
                        features=json.dumps(p_data["features"]),
                        rating=p_data["rating"],
                        review_count=p_data["review_count"],
                        seller_name=p_data["seller_name"],
                        delivery_days=p_data["delivery_days"],
                        return_days=p_data["return_days"],
                        inventory=p_data["inventory"],
                        is_ai_native=m_data["agent_supported"],
                        source="dmcp_protocol" if m_data["agent_supported"] else "browser_scrape",
                        image_url=p_data["image_url"]
                    )
                    session.add(prod)
                    await session.flush()

                    if m_data["agent_supported"]:
                        policy = MerchantPolicy(
                            id=f"policy_{prod.id}",
                            merchant_id=merchant.id,
                            product_id=prod.id,
                            preferred_price=p_data.get("preferred_price", p_data["listed_price"] * 0.9),
                            auto_negotiation_floor=p_data.get("auto_negotiation_floor", p_data["listed_price"] * 0.85),
                            absolute_floor=p_data.get("absolute_floor", p_data["listed_price"] * 0.8),
                            max_discount_percent=m_data.get("max_auto_discount", 20.0),
                            human_approval_threshold=m_data.get("human_approval_threshold", p_data["listed_price"] * 0.85)
                        )
                        session.add(policy)

        # Seed additional catalog products
        for idx, item in enumerate(ADDITIONAL_WATCH_NAMES):
            name, brand, price, rating, is_ai, store_name = item
            prod_id = f"watch_catalog_gen_{idx+100}"
            prod_stmt = select(Product).where(Product.id == prod_id)
            existing_prod = (await session.execute(prod_stmt)).scalars().first()
            if not existing_prod:
                # Find merchant
                m_lookup = select(Merchant).where(Merchant.store_name == store_name)
                m_obj = (await session.execute(m_lookup)).scalars().first()
                if m_obj:
                    extra_prod = Product(
                        id=prod_id,
                        merchant_id=m_obj.id,
                        name=name,
                        brand=brand,
                        category="Watches",
                        listed_price=price,
                        currency="INR",
                        features=json.dumps(["Quartz Precision", "Water Resistant", "Stainless Steel", "Mineral Crystal"]),
                        rating=round(4.0 + (idx % 10) * 0.09, 1),
                        review_count=350 + (idx * 45),
                        seller_name=f"{brand} Direct",
                        delivery_days=2 + (idx % 3),
                        return_days=15 if idx % 2 == 0 else 30,
                        inventory=8 + (idx % 15),
                        is_ai_native=is_ai,
                        source="dmcp_protocol" if is_ai else "browser_scrape",
                        image_url=f"https://images.unsplash.com/photo-{1522335789200 + idx * 100}?w=500&q=80"
                    )
                    session.add(extra_prod)
                    await session.flush()

                    if is_ai:
                        extra_policy = MerchantPolicy(
                            id=f"policy_{prod_id}",
                            merchant_id=m_obj.id,
                            product_id=prod_id,
                            preferred_price=round(price * 0.9, 2),
                            auto_negotiation_floor=round(price * 0.85, 2),
                            absolute_floor=round(price * 0.8, 2),
                            max_discount_percent=20.0,
                            human_approval_threshold=round(price * 0.85, 2)
                        )
                        session.add(extra_policy)

        await session.commit()
        print("Database seeded successfully with 12 merchants and rich watch catalog.")

if __name__ == "__main__":
    asyncio.run(seed_database())
