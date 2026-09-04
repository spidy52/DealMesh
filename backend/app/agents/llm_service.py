import httpx
import json
import logging
from typing import Dict, Any, Optional
from backend.app.config import settings

logger = logging.getLogger("dealmesh.llm")

class OpenRouterLLMService:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.fallback_model = settings.OPENROUTER_FALLBACK_MODEL
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"

    async def generate_response(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> Optional[str]:
        if not self.api_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://dealmesh.ai",
            "X-Title": "DealMesh AI Commerce Network",
            "Content-Type": "application/json"
        }

        # Try active free models
        models_to_try = [
            "minimax/minimax-m3:free",
            "z-ai/glm-5.2:free",
            "nvidia/nemotron-3.5-lightning:free",
            self.model,
            self.fallback_model
        ]

        for mdl in models_to_try:
            payload = {
                "model": mdl,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "max_tokens": 800
            }
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(self.api_url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            return choices[0]["message"]["content"]
                    else:
                        logger.warning(f"OpenRouter model {mdl} returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Failed to query OpenRouter model {mdl}: {str(e)}")

        return None

    def generate_response_sync(self, system_prompt: str, user_prompt: str, temperature: float = 0.3) -> Optional[str]:
        if not self.api_key:
            return None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://dealmesh.ai",
            "X-Title": "DealMesh AI Commerce Network",
            "Content-Type": "application/json"
        }

        models_to_try = [
            "minimax/minimax-m3:free",
            "z-ai/glm-5.2:free",
            "nvidia/nemotron-3.5-lightning:free",
            self.model,
            self.fallback_model
        ]

        for mdl in models_to_try:
            payload = {
                "model": mdl,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "max_tokens": 800
            }
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(self.api_url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices and "message" in choices[0]:
                            return choices[0]["message"]["content"]
            except Exception as e:
                logger.warning(f"Failed to query sync OpenRouter model {mdl}: {str(e)}")

        return None

llm_service = OpenRouterLLMService()
