import hmac
import hashlib
import time
import json
from typing import Dict, Any, Optional
from backend.app.config import settings

def create_authorization_token(
    agent_id: str,
    action: str,
    price: float,
    policy_version: str = "v1",
    custom_claims: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Creates a verifiable authorization proof without exposing private financial ceilings.
    Receiving party verifies that the action was signed and authorized within policy.
    """
    payload = {
        "agent_id": agent_id,
        "action": action,
        "price": round(price, 2),
        "policy_version": policy_version,
        "timestamp": int(time.time()),
        "claims": custom_claims or {}
    }
    payload_str = json.dumps(payload, sort_keys=True)
    signature = hmac.new(
        settings.DMCP_TOKEN_SALT.encode("utf-8"),
        payload_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()
    
    return {
        "auth_token": f"dmcp_auth_{signature[:16]}_{payload['timestamp']}",
        "signature": signature,
        "payload": payload
    }

def verify_authorization_token(
    auth_data: Dict[str, Any],
    max_age_seconds: int = 3600
) -> bool:
    """
    Validates token integrity and freshness.
    """
    try:
        payload = auth_data.get("payload")
        signature = auth_data.get("signature")
        if not payload or not signature:
            return False
        
        # Check freshness
        timestamp = payload.get("timestamp", 0)
        if time.time() - timestamp > max_age_seconds:
            return False
        
        expected_sig = hmac.new(
            settings.DMCP_TOKEN_SALT.encode("utf-8"),
            json.dumps(payload, sort_keys=True).encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_sig)
    except Exception:
        return False
