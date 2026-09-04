import asyncio
import os
import time
import threading
import urllib.parse
from typing import Dict, Any, Optional
from playwright.sync_api import sync_playwright
from backend.app.commerce.live_web_search_provider import LiveWebSearchProvider

class LiveMarketCrawler:
    """
    100% Real-Time E-Commerce Discovery powered directly by Firecrawl Web Search & Scraping API
    and Autonomous Cart & Store Automation powered by Playwright.
    NO fake stores. NO synthetic multipliers. NO fabricated savings.
    """

    @staticmethod
    async def search_live_market(query: str, budget: Optional[int] = None) -> Dict[str, Any]:
        """
        Executes real live web search & Playwright verification across multiple authentic stores.
        Returns ONLY real verified product records.
        """
        return await LiveWebSearchProvider.execute_live_multi_store_search(query, budget)

    @staticmethod
    def sync_resolve_first_product_pdp(listing_url: str) -> str:
        """
        If a URL is a category or search results listing, resolves it directly
        to the 1st individual product detail page (PDP).
        """
        if any(x in listing_url for x in ['/dp/', '/p/itm', '/prid/', '/pvid/']) and not any(x in listing_url for x in ['/pr?sid=', '/s?k=', '/collections/']):
            return listing_url

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
                page.goto(listing_url, timeout=15000, wait_until='domcontentloaded')
                page.wait_for_timeout(800)

                # Flipkart product cards
                if 'flipkart' in listing_url.lower():
                    anchors = page.query_selector_all('a[href*="/p/"]')
                    for a in anchors:
                        href = a.get_attribute('href')
                        if href and '/p/' in href:
                            browser.close()
                            return urllib.parse.urljoin('https://www.flipkart.com', href.split('?')[0])

                # Amazon product cards
                elif 'amazon' in listing_url.lower():
                    anchors = page.query_selector_all('a[href*="/dp/"]')
                    for a in anchors:
                        href = a.get_attribute('href')
                        if href and '/dp/' in href:
                            browser.close()
                            return urllib.parse.urljoin('https://www.amazon.in', href.split('?')[0])

                # General e-commerce / Shopify
                else:
                    anchors = page.query_selector_all('a[href*="/products/"], a[href*="/product/"], a[href*="/p/"], a[href*="/item/"]')
                    for a in anchors:
                        href = a.get_attribute('href')
                        if href and not any(x in href for x in ['collections', 'category', 'sort_by', 'page=']):
                            browser.close()
                            return urllib.parse.urljoin(listing_url, href.split('?')[0])

                browser.close()
        except Exception as err:
            print(f'[LiveMarketCrawler] PDP Resolver Notice: {err}')

        return listing_url

    @staticmethod
    def sync_resolve_store_search_bar(store_name_or_url: str, product_query: str) -> str:
        """
        Navigates to the store, types the product query into the store's search bar,
        hits Enter, and resolves the 1st matching product card into a direct PDP URL.
        """
        target = store_name_or_url.lower()
        
        if "flipkart" in target:
            base_url = "https://www.flipkart.com"
            search_sel = 'input[name="q"], input[type="text"]'
            card_sel = 'a[href*="/p/"]'
        elif "amazon" in target:
            base_url = "https://www.amazon.in"
            search_sel = 'input#twotabsearchtextbox, input[name="field-keywords"]'
            card_sel = "div[data-component-type='s-search-result'] h2 a, a.a-link-normal.s-no-outline, a[href*='/dp/']"
        elif "croma" in target:
            base_url = "https://www.croma.com"
            search_sel = 'input#searchV2, input[name="q"], input[type="search"]'
            card_sel = 'a.product-title, a[href*="/p/"]'
        elif "reliancedigital" in target or "reliance" in target:
            base_url = "https://www.reliancedigital.in"
            search_sel = 'input#suggestionBoxEle, input[type="search"]'
            card_sel = 'a.sp__name, a[href*="/p/"]'
        elif "myntra" in target:
            base_url = f"https://www.myntra.com/{urllib.parse.quote_plus(product_query)}" if product_query else "https://www.myntra.com"
            search_sel = 'input.desktop-searchBar, input[placeholder*="Search" i]'
            card_sel = 'li.product-base a, a[href*="/buy"], a[href*="/p/"]'
        elif "ajio" in target:
            base_url = f"https://www.ajio.com/search/?text={urllib.parse.quote_plus(product_query)}" if product_query else "https://www.ajio.com"
            search_sel = 'input[name="searchVal"], input[type="text"]'
            card_sel = 'a.rilrtl-products-list__link, a[href*="/p/"]'
        elif "tatacliq" in target or "tata cliq" in target:
            base_url = f"https://www.tatacliq.com/search/?searchCategory=all&text={urllib.parse.quote_plus(product_query)}"
            search_sel = 'input[type="search"], input[name="q"]'
            card_sel = 'a[href*="/p-mp"]'
        elif "maxfashion" in target or "max fashion" in target or target == "max":
            base_url = f"https://www.maxfashion.in/in/en/search?q={urllib.parse.quote_plus(product_query)}"
            search_sel = 'input[type="search"], input[name="q"]'
            card_sel = 'a[href*="/product/"], a[href*="/p/"]'
        else:
            base_url = store_name_or_url if store_name_or_url.startswith("http") else f"https://www.google.com/search?q={urllib.parse.quote_plus(product_query)}"
            search_sel = 'input[type="search"], input[name="q"], input[placeholder*="Search" i]'
            card_sel = 'a[href*="/products/"], a[href*="/product/"], a[href*="/item/"], a[href*="/p/"]'

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
                page.goto(base_url, timeout=20000, wait_until='domcontentloaded')
                page.wait_for_timeout(800)

                search_box = page.query_selector(search_sel)
                if search_box:
                    search_box.fill(product_query)
                    page.wait_for_timeout(300)
                    page.keyboard.press('Enter')
                    
                    try:
                        page.wait_for_selector(card_sel, timeout=12000)
                        
                        # Collect page cards and text summary
                        cards = page.query_selector_all(f"{card_sel}, a[href*='/p/'], a[href*='/dp/'], a[href*='/products/']")[:8]
                        items_summary = []
                        for c in cards:
                            h = c.get_attribute("href")
                            t = c.inner_text().strip()
                            if t and h:
                                items_summary.append(f"Product: {' '.join(t.split())} | Link: {h.split('?')[0]}")
                        
                        if items_summary:
                            try:
                                from backend.app.commerce.llm_page_extractor import LLMPageExtractor
                                deal = LLMPageExtractor.extract_best_deal_from_page_sync(
                                    page_content="\n".join(items_summary),
                                    store_name=store_name_or_url,
                                    query=product_query,
                                    base_url=base_url
                                )
                                if deal and deal.get("product_url"):
                                    print(f"[LiveMarketCrawler] LLM selected best deal on {store_name_or_url}: {deal.get('title')} -> {deal.get('product_url')}")
                                    browser.close()
                                    return deal["product_url"]
                            except Exception as llm_err:
                                print(f"[LiveMarketCrawler] LLM extraction fallback: {llm_err}")

                        # Fallback to first matching card
                        first_card = page.query_selector(card_sel)
                        if first_card:
                            href = first_card.get_attribute('href')
                            if href:
                                browser.close()
                                return urllib.parse.urljoin(base_url, href.split('?')[0])
                    except Exception as wait_err:
                        print(f"[LiveMarketCrawler] Search bar wait error: {wait_err}")

                browser.close()
        except Exception as e:
            print(f"[LiveMarketCrawler] Error in sync_resolve_store_search_bar: {e}")

        return store_name_or_url

    @staticmethod
    def get_browser_controller():
        return ActiveBrowserController.get_instance()

    @staticmethod
    def launch_visible_browser_sync(platform_or_url: str, product_query: str) -> Dict[str, Any]:
        """
        Launches Chromium VISIBLY on desktop, navigates to store/product,
        inspects the page in real time, and returns the structured inspection report.
        """
        controller = ActiveBrowserController.get_instance()
        return controller.open_and_inspect(platform_or_url, product_query)

    @staticmethod
    async def automate_cart_addition(platform_or_url: str, product_query: str) -> Dict[str, Any]:
        """
        Uses Playwright to open the live e-commerce platform in a visible Chromium browser window,
        inspects the screen in real time, and returns the live page status.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            LiveMarketCrawler.launch_visible_browser_sync,
            platform_or_url,
            product_query
        )


class ActiveBrowserController:
    """
    Singleton controller managing the live visible Chromium browser on the user's desktop.
    Maintains a persistent worker thread to execute Playwright commands in a 100% thread-safe way.
    """
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        import queue
        self.cmd_queue = queue.Queue()
        self.worker_thread = None
        self.current_inspection = None
        self.is_running = False

    def _worker_loop(self):
        from backend.app.commerce.live_screen_inspector import LiveScreenAndPageInspector
        user_data_dir = os.path.join(os.path.expanduser("~"), ".dealmesh", "browser_profile")
        os.makedirs(user_data_dir, exist_ok=True)

        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                user_data_dir,
                headless=False,
                args=["--start-maximized", "--disable-blink-features=AutomationControlled"],
                no_viewport=True
            )
            page = context.pages[0] if context.pages else context.new_page()

            while True:
                cmd_data = self.cmd_queue.get()
                cmd = cmd_data.get("cmd")
                resp_q = cmd_data.get("resp_q")

                if cmd == "open_and_inspect":
                    target = cmd_data.get("target", "").lower()
                    product_query = cmd_data.get("product_query", "")
                    raw_target = cmd_data.get("target", "")

                    try:
                        is_direct_product = any(x in target for x in ["/dp/", "/p/itm", "/prid/", "/pvid/"]) and not any(x in target for x in ["/pr?sid=", "/s?k=", "/collections/"])

                        if is_direct_product:
                            page.goto(raw_target, timeout=30000, wait_until="domcontentloaded")
                            page.wait_for_timeout(1000)
                        else:
                            if "flipkart" in target:
                                base_url = "https://www.flipkart.com"
                                search_sel = 'input[name="q"], input[type="text"]'
                            elif "amazon" in target:
                                base_url = "https://www.amazon.in"
                                search_sel = 'input#twotabsearchtextbox, input[name="field-keywords"]'
                            elif "croma" in target:
                                base_url = "https://www.croma.com"
                                search_sel = 'input#searchV2, input[name="q"], input[type="search"]'
                            elif "myntra" in target:
                                base_url = f"https://www.myntra.com/{urllib.parse.quote_plus(product_query)}" if product_query else "https://www.myntra.com"
                                search_sel = 'input.desktop-searchBar, input[placeholder*="Search" i]'
                            elif "ajio" in target:
                                base_url = f"https://www.ajio.com/search/?text={urllib.parse.quote_plus(product_query)}" if product_query else "https://www.ajio.com"
                                search_sel = 'input[name="searchVal"], input[type="text"]'
                            elif "tatacliq" in target or "tata cliq" in target:
                                base_url = f"https://www.tatacliq.com/search/?searchCategory=all&text={urllib.parse.quote_plus(product_query)}"
                                search_sel = 'input[type="search"], input[name="q"]'
                            elif "maxfashion" in target or "max fashion" in target or target == "max":
                                base_url = f"https://www.maxfashion.in/in/en/search?q={urllib.parse.quote_plus(product_query)}"
                                search_sel = 'input[type="search"], input[name="q"]'
                            else:
                                base_url = raw_target if raw_target.startswith("http") else f"https://www.google.com/search?q={urllib.parse.quote_plus(product_query)}"
                                search_sel = 'input[type="search"], input[name="q"], input[placeholder*="Search" i]'

                            page.goto(base_url, timeout=25000, wait_until="domcontentloaded")
                            page.wait_for_timeout(1000)

                            # If product query provided and not a direct store catalog, search it
                            if product_query and not any(x in base_url for x in ["vgrgardens", "nurserylive", "fnp"]):
                                search_box = page.query_selector(search_sel)
                                if search_box:
                                    search_box.fill(product_query)
                                    page.wait_for_timeout(400)
                                    page.keyboard.press("Enter")
                                    page.wait_for_load_state("domcontentloaded")
                                    page.wait_for_timeout(1500)

                        # Inspect the loaded page in real-time
                        inspection = LiveScreenAndPageInspector.inspect_page(page, page.url)
                        self.current_inspection = inspection
                        resp_q.put({"status": "success", "data": inspection})
                    except Exception as e:
                        print(f"[ActiveBrowserController] open_and_inspect error: {e}")
                        resp_q.put({"status": "error", "message": str(e), "data": None})

                elif cmd == "select_product":
                    target_name = (cmd_data.get("target_name") or "").lower()
                    target_idx = cmd_data.get("target_index")
                    try:
                        clicked = False
                        anchors = page.query_selector_all('a')
                        
                        # Match by title or index
                        candidate_links = []
                        for a in anchors:
                            txt = (a.inner_text() or '').strip()
                            href = a.get_attribute('href') or ''
                            if len(txt) > 3 and any(x in href for x in ['product', '/p/', '/dp/', 'item']):
                                candidate_links.append((a, txt.lower()))

                        if target_idx is not None and 0 <= target_idx < len(candidate_links):
                            candidate_links[target_idx][0].click(timeout=5000)
                            clicked = True
                        else:
                            for a, txt in candidate_links:
                                if target_name in txt or any(w in txt for w in target_name.split() if len(w) > 3):
                                    a.click(timeout=5000)
                                    clicked = True
                                    break

                        if clicked:
                            page.wait_for_load_state("domcontentloaded")
                            page.wait_for_timeout(1500)
                            inspection = LiveScreenAndPageInspector.inspect_page(page, page.url)
                            self.current_inspection = inspection
                            resp_q.put({"status": "success", "data": inspection})
                        else:
                            resp_q.put({"status": "not_found", "message": f"Could not find product matching '{target_name}'"})
                    except Exception as e:
                        resp_q.put({"status": "error", "message": str(e)})

                elif cmd == "select_variant":
                    opt_to_pick = str(cmd_data.get("size") or cmd_data.get("option") or "").strip().lower()
                    quantity = cmd_data.get("quantity", 1)
                    try:
                        opt_clicked = False
                        if opt_to_pick:
                            # Try universal swatch and option selectors across all stores
                            opt_selectors = [
                                'li[id*="swatch"] a', 'li[id*="swatch"] button',
                                'a._1fGeJ5', 'div._2zZ1N-', 'ul._1q8tAE li',
                                'button[data-option]', 'div[class*="size-picker"] button',
                                'div[class*="variant-picker"] button', 'div[class*="swatch"] button',
                                '.swatch-element label', '.swatch-element input',
                                'button[class*="size" i]', 'button[class*="variant" i]',
                                'span[class*="size-btn" i]', 'div[class*="capacity" i] button',
                                'div[class*="storage" i] button', 'ul[data-action="a-button-group"] li'
                            ]
                            cand_elements = page.query_selector_all(", ".join(opt_selectors))
                            for el in cand_elements:
                                txt = (el.inner_text() or el.get_attribute("data-value") or el.get_attribute("value") or "").strip().lower()
                                if opt_to_pick == txt or f"uk {opt_to_pick}" == txt or opt_to_pick in txt:
                                    el.click(timeout=3000)
                                    opt_clicked = True
                                    page.wait_for_timeout(800)
                                    break

                            # Dropdown selects (e.g. Amazon or Shopify)
                            if not opt_clicked:
                                for sel in ['#native_dropdown_selected_size_name', 'select[name*="size" i]', 'select[name*="option" i]', 'select[name*="variant" i]']:
                                    dropdown = page.query_selector(sel)
                                    if dropdown:
                                        try:
                                            dropdown.select_option(label=opt_to_pick)
                                            opt_clicked = True
                                            break
                                        except Exception:
                                            pass

                        # Set quantity if specified
                        if quantity > 1:
                            qty_input = page.query_selector('input[name*="quantity" i], .quantity-input')
                            if qty_input:
                                try:
                                    qty_input.fill(str(quantity))
                                    page.wait_for_timeout(400)
                                except Exception:
                                    pass

                        # Click Add to Cart / Add to Bag / Buy Now
                        cart_btn = page.query_selector(
                            "#add-to-cart-button, input#add-to-cart-button, button._2KpZ6l._2U9uOA._3v1-ww, button:has-text('Add to Cart'), button:has-text('ADD TO CART'), button:has-text('Buy Now'), button:has-text('BUY NOW'), button:has-text('Add to Bag')"
                        )
                        if cart_btn:
                            cart_btn.click(timeout=4000)
                            page.wait_for_timeout(1500)

                        resp_q.put({"status": "success", "option_selected": opt_to_pick, "quantity": quantity, "cart_clicked": bool(cart_btn)})
                    except Exception as e:
                        resp_q.put({"status": "error", "message": str(e)})

                elif cmd == "close":
                    try:
                        context.close()
                    except Exception:
                        pass
                    resp_q.put({"status": "closed"})
                    break

    def start_if_needed(self):
        if not self.worker_thread or not self.worker_thread.is_alive():
            self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
            self.worker_thread.start()

    def open_and_inspect(self, target: str, product_query: str = "", timeout=25) -> Dict[str, Any]:
        self.start_if_needed()
        import queue
        resp_q = queue.Queue()
        self.cmd_queue.put({
            "cmd": "open_and_inspect",
            "target": target,
            "product_query": product_query,
            "resp_q": resp_q
        })
        try:
            return resp_q.get(timeout=timeout)
        except Exception as e:
            return {"status": "timeout", "message": str(e), "data": None}

    def select_product(self, target_name: str = "", target_index: Optional[int] = None, timeout=15) -> Dict[str, Any]:
        self.start_if_needed()
        import queue
        resp_q = queue.Queue()
        self.cmd_queue.put({
            "cmd": "select_product",
            "target_name": target_name,
            "target_index": target_index,
            "resp_q": resp_q
        })
        try:
            return resp_q.get(timeout=timeout)
        except Exception as e:
            return {"status": "timeout", "message": str(e)}

    def select_variant(self, size: Optional[str] = None, quantity: int = 1, timeout=15) -> Dict[str, Any]:
        self.start_if_needed()
        import queue
        resp_q = queue.Queue()
        self.cmd_queue.put({
            "cmd": "select_variant",
            "size": size,
            "quantity": quantity,
            "resp_q": resp_q
        })
        try:
            return resp_q.get(timeout=timeout)
        except Exception as e:
            return {"status": "timeout", "message": str(e)}

    def close(self):
        if self.worker_thread and self.worker_thread.is_alive():
            import queue
            resp_q = queue.Queue()
            self.cmd_queue.put({"cmd": "close", "resp_q": resp_q})
            try:
                resp_q.get(timeout=5)
            except Exception:
                pass
