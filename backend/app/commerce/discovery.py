from typing import Dict, Any

class MerchantDiscovery:
    """
    Deterministic capability discovery handler for DMCP agents.
    Exposes and queries standard /.well-known/dealmesh-agent manifests.
    """

    @staticmethod
    def get_well_known_manifest(merchant_name: str = "Titan Demo Store") -> Dict[str, Any]:
        return {
            "merchant": merchant_name,
            "dealmesh_protocol_version": "1.0.0",
            "agent_supported": True,
            "capabilities": {
                "search": True,
                "negotiation": True,
                "inventory_reservation": True,
                "offer_expiry": True,
                "scarcity_bidding": True,
                "webhook_settlement": True
            },
            "endpoints": {
                "discovery": "/.well-known/dealmesh-agent",
                "capabilities": "/agent/capabilities",
                "search": "/agent/search",
                "inventory": "/agent/inventory",
                "offer": "/agent/offer",
                "counter": "/agent/counter",
                "accept": "/agent/accept",
                "renew": "/agent/renew",
                "deal_lock": "/agent/deal-lock"
            },
            "supported_currencies": ["INR"]
        }
