
import re
import json
import urllib.parse
from typing import Optional, Dict, Any
from backend.app.agents.llm_service import llm_service

class LLMPageExtractor:
    """
    Autonomous LLM-driven Web Page Extraction Engine.
    Uses AI reasoning instead of brittle CSS selectors to find the best deal,
    parse verified pricing, and extract direct product detail page (PDP) links.
    """

    @staticmethod
    async def extract_best_deal_from_page(page_content: str, store_name: str, query: str, budget: Optional[int] = None, base_url: str = "") -> Optional[Dict[str, Any]]:
        """
        Feeds live store web page text to the LLM to dynamically determine
        the best matching product, verified price, and direct link.
        """
        # Trim content to keep context fast and dense
        clean_content = page_content[:6000].strip()
        if not clean_content:
            return None

        sys_prompt = (
            "You are an autonomous AI commerce extractor for DealMesh. "
            f"Analyze this live e-commerce web page content from {store_name}. "
            f"User Query: '{query}'. "
            f"Budget: {budget if budget else 'Best available'}. "
            "Identify the BEST single product deal on this page that genuinely matches the query and fits the budget. "
            "Return ONLY a valid JSON object with these exact keys:\n"
            "{\n"
            '  "title": "Exact product title",\n'
            '  "price": 249,\n'
            '  "original_price": 499,\n'
            '  "product_url": "/product-path or full https url",\n'
            '  "reason": "Why this is the best match"\n'
            "}"
        )

        try:
            ai_reply = await llm_service.generate_response(sys_prompt, clean_content, temperature=0.1)
            if ai_reply:
                # Extract JSON block
                json_match = re.search(r'\{.*\}', ai_reply, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                    p_url = data.get("product_url", "")
                    if p_url and base_url and not p_url.startswith("http"):
                        p_url = urllib.parse.urljoin(base_url, p_url)
                    data["product_url"] = p_url
                    return data
        except Exception as e:
            print(f"[LLMPageExtractor] AI extraction notice: {e}")

        return None

    @staticmethod
    def extract_best_deal_from_page_sync(page_content: str, store_name: str, query: str, budget: Optional[int] = None, base_url: str = "") -> Optional[Dict[str, Any]]:
        """
        Synchronous version for direct use inside Playwright or worker threads without asyncio loop conflicts.
        """
        clean_content = page_content[:6000].strip()
        if not clean_content:
            return None

        sys_prompt = (
            "You are an autonomous AI commerce extractor for DealMesh. "
            f"Analyze this live e-commerce web page content from {store_name}. "
            f"User Query: '{query}'. "
            f"Budget: {budget if budget else 'Best available'}. "
            "Identify the BEST single product deal on this page that genuinely matches the query and fits the budget. "
            "Return ONLY a valid JSON object with these exact keys:\n"
            "{\n"
            '  "title": "Exact product title",\n'
            '  "price": 249,\n'
            '  "original_price": 499,\n'
            '  "product_url": "/product-path or full https url",\n'
            '  "reason": "Why this is the best match"\n'
            "}"
        )

        try:
            ai_reply = llm_service.generate_response_sync(sys_prompt, clean_content, temperature=0.1)
            if ai_reply:
                json_match = re.search(r'\{.*\}', ai_reply, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                    p_url = data.get("product_url", "")
                    if p_url and base_url and not p_url.startswith("http"):
                        p_url = urllib.parse.urljoin(base_url, p_url)
                    data["product_url"] = p_url
                    return data
        except Exception as e:
            print(f"[LLMPageExtractor] Sync AI extraction notice: {e}")

        return None
