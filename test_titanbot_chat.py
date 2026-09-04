import sys, os
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath("."))
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_chat():
    print("=" * 60)
    print(">>> DEALMESH TITANBOT INTERACTIVE DMCP CHAT / TEST CONSOLE <<<")
    print("=" * 60)
    print("Product: Titan Neo Workwear Classic Formal Watch (watch_titan_001)")
    print("Listed Price: Rs.2,799 | Store: Titan Demo Store")
    print("Private Policy: Auto Floor: Rs.2,400 | Absolute Floor: Rs.2,299 [Private]")
    print("-" * 60)
    print("Try sending offers:")
    print("  - 2200 (TitanBot will counter at Rs.2,699)")
    print("  - 2350 (Enters Human Approval Range -> Escorted to Merchant Dashboard!)")
    print("  - 2500 (Direct Autonomous Agreement!)")
    print("  - 1500 (Rejected below reserve floor)")
    print("=" * 60)

    # 1. Capabilities
    cap = client.get("/agent/capabilities?merchant_id=merchant_titan_demo").json()
    agent_title = cap.get('agent_name') or cap.get('name') or "TitanBot"
    print(f"TitanBot Status: Connected ({agent_title})")

    round_num = 1
    while True:
        try:
            user_input = input(f"\n[Round {round_num}] Enter your offer in INR (or 'q' to quit): ").strip()
            if not user_input or user_input.lower() == 'q':
                print("Exiting TitanBot chat.")
                break

            offer = float(user_input.replace(",", "").replace("Rs.", ""))

            print(f">> Sending DMCP offer of Rs.{offer:,.0f} to TitanBot...")
            resp = client.post("/agent/offer", json={
                "product_id": "watch_titan_001",
                "merchant_id": "merchant_titan_demo",
                "offer_amount": offer,
                "currency": "INR",
                "agent_id": "Omni",
                "round_number": round_num
            })

            data = resp.json()
            action = data.get("action")
            counter = data.get("counter_price")
            reason = data.get("reason", "").replace("₹", "Rs.")

            print(f"<< TitanBot Response:")
            print(f"   * Action: {action}")
            if counter:
                print(f"   * Counter Price: Rs.{counter:,.0f}")
            print(f"   * Reason: {reason}")
            print(f"   * Inventory Available: {data.get('inventory_available')}")
            print(f"   * Scarcity Active: {data.get('scarcity_active')}")

            if action == "waiting_for_approval":
                print("\n   [!] ESCALATED TO MERCHANT DASHBOARD FOR HUMAN APPROVAL!")
                print("   The store manager at http://localhost:5174 sees this offer and can [APPROVE] or [REJECT].")
            elif action == "accept_offer":
                print("\n   [+] DEAL ACCEPTED AUTONOMOUSLY BY TITANBOT!")
                print(f"   Locking price at Rs.{counter:,.0f}...")
                break
            elif action == "reject_below_floor":
                print("\n   [-] OFFER REJECTED: Below merchant reserve limits.")

            round_num += 1

        except ValueError:
            print("Please enter a valid numeric price (e.g. 2350).")
        except KeyboardInterrupt:
            print("\nExiting.")
            break

if __name__ == "__main__":
    test_chat()
