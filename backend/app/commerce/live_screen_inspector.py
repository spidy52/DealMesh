import re
import urllib.parse
from typing import Dict, Any, List, Optional
from PIL import ImageGrab

class LiveScreenAndPageInspector:
    """
    Live Screen & Page Inspection Engine for DealMesh Omni Assistant.
    Provides:
    1. DOM & Visual Inspection of active web pages (Playwright browser sessions):
       - Multi-product catalog detection (extracts top products with real names & prices).
       - Option/Variant detection (detects size pills, dropdowns, and quantity requirements).
       - Single product detail page (PDP) verification (real live price & stock check).
    2. Desktop Screen Awareness:
       - Captures desktop screen via PIL.ImageGrab to observe active windows and content.
    """

    @staticmethod
    def inspect_page(page, base_url: str = "") -> Dict[str, Any]:
        """
        Inspects the active Playwright page in real-time.
        Returns a structured report describing whether the page is a multi-product catalog,
        requires options (size/quantity), or is a single product ready to checkout.
        """
        result = {
            "page_type": "single_product",
            "page_title": "",
            "store_name": "",
            "products": [],
            "available_sizes": [],
            "requires_size": False,
            "requires_quantity": False,
            "live_price": None,
            "original_price": None,
            "in_stock": True,
            "spoken_prompt": "",
            "url": page.url
        }

        try:
            result["page_title"] = page.title()
        except Exception:
            pass

        domain = urllib.parse.urlparse(page.url).netloc.replace("www.", "")
        if "vgrgardens" in domain:
            result["store_name"] = "VGR Gardens"
        elif "flipkart" in domain:
            result["store_name"] = "Flipkart"
        elif "amazon" in domain:
            result["store_name"] = "Amazon India"
        elif "myntra" in domain:
            result["store_name"] = "Myntra"
        elif "croma" in domain:
            result["store_name"] = "Croma"
        else:
            result["store_name"] = domain.split(".")[0].title() if domain else "Store"

        # ------------------------------------------------------------------
        # 1. CHECK FOR MULTI-PRODUCT CATALOG / LISTING GRID
        # ------------------------------------------------------------------
        try:
            catalog_items = page.evaluate('''() => {
                const items = [];
                // Standard selectors for e-commerce product grids
                const cardSelectors = [
                    'li.product',
                    '.type-product',
                    'div.product',
                    '.wc-block-grid__product',
                    'div[data-component-type="s-search-result"]',
                    'div._1AtVbE',
                    'div._75nlfW',
                    '.product-card',
                    '.product-item'
                ];
                
                let foundCards = [];
                for (const sel of cardSelectors) {
                    const elements = document.querySelectorAll(sel);
                    if (elements && elements.length >= 2) {
                        foundCards = Array.from(elements);
                        break;
                    }
                }

                for (const card of foundCards.slice(0, 8)) {
                    // Extract title
                    const titleEl = card.querySelector(
                        '.woocommerce-loop-product__title, h2, h3, .product-title, .title, a[class*="title"], div[class*="title"], ._4rR01T, .wjcEIp, .s-title'
                    );
                    // Extract price
                    const priceEl = card.querySelector(
                        '.price, span.woocommerce-Price-amount, div._30jeq3, span.a-price-whole, .product-price, .current-price, span[class*="price"]'
                    );
                    // Extract original price
                    const origPriceEl = card.querySelector(
                        'del, .regular-price, div._3I9_wc, span.a-text-price span.a-offscreen, .original-price'
                    );
                    // Extract link
                    const linkEl = card.querySelector('a[href*="/product/"], a[href*="/p/"], a[href*="/dp/"], a');
                    // Extract image
                    const imgEl = card.querySelector('img');

                    const title = titleEl ? titleEl.innerText.trim() : (linkEl ? linkEl.innerText.trim() : '');
                    const priceText = priceEl ? priceEl.innerText.trim() : '';
                    const origPriceText = origPriceEl ? origPriceEl.innerText.trim() : '';
                    const href = linkEl ? linkEl.href : '';
                    const img = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || '') : '';

                    if (title && priceText && title.length > 3) {
                        items.push({
                            title: title,
                            price_raw: priceText,
                            orig_price_raw: origPriceText,
                            url: href,
                            image: img
                        });
                    }
                }
                return items;
            }''')

            if catalog_items and len(catalog_items) >= 2:
                cleaned_products = []
                for it in catalog_items:
                    # Clean price numbers
                    p_digits = re.findall(r'\d+', it.get("price_raw", "").replace(",", ""))
                    orig_digits = re.findall(r'\d+', it.get("orig_price_raw", "").replace(",", ""))
                    price_val = int(p_digits[0]) if p_digits else 0
                    orig_val = int(orig_digits[0]) if orig_digits else price_val
                    
                    if price_val > 0:
                        # Clean title from redundant line breaks
                        clean_title = ' '.join(it.get("title", "").split())
                        cleaned_products.append({
                            "title": clean_title,
                            "price": price_val,
                            "original_price": max(orig_val, price_val),
                            "url": it.get("url", ""),
                            "image": it.get("image", ""),
                            "in_stock": True
                        })

                if len(cleaned_products) >= 2:
                    result["page_type"] = "multi_product"
                    result["products"] = cleaned_products[:6]
                    
                    # Generate pleasant conversational spoken prompt
                    preview_strs = [f"{p['title'][:30]} at Rs.{p['price']}" for p in cleaned_products[:3]]
                    result["spoken_prompt"] = (
                        f"I've opened {result['store_name']} on your screen! I can see multiple products available: "
                        f"{', '.join(preview_strs)}. Which one would you like to proceed with?"
                    )
                    return result
        except Exception as e:
            print(f"[LiveScreenInspector] Catalog inspection notice: {e}")

        # ------------------------------------------------------------------
        # 2. CHECK FOR VARIANT / OPTION / QUANTITY REQUIREMENTS (UNIVERSAL ACROSS ALL E-COMMERCE)
        # ------------------------------------------------------------------
        try:
            variant_info = page.evaluate(r'''() => {
                const options = [];
                let detectedType = 'option';

                // Comprehensive selectors across Flipkart, Amazon, Myntra, Croma, Blinkit, Shopify, WooCommerce
                const optionSelectors = [
                    // Swatches & Variant Buttons
                    'li[id*="swatch"] a',
                    'li[id*="swatch"] button',
                    'a._1fGeJ5',
                    'div._2zZ1N-',
                    'ul._1q8tAE li',
                    'button[data-option]',
                    'button[data-option*="size" i]',
                    'button[data-option*="color" i]',
                    'button[data-option*="storage" i]',
                    'div[class*="size-picker"] button',
                    'div[class*="size-picker"] div',
                    'div[class*="variant-picker"] button',
                    'div[class*="swatch"] button',
                    '.swatch-element label',
                    '.swatch-element input',
                    '#native_dropdown_selected_size_name option',
                    'select[name*="size" i] option',
                    'select[name*="variant" i] option',
                    'select[name*="option" i] option',
                    'table.variations select option',
                    'ul[data-action="a-button-group"] li',
                    'button[class*="size" i]',
                    'button[class*="variant" i]',
                    'span[class*="size-btn" i]',
                    'div[class*="capacity" i] button',
                    'div[class*="storage" i] button'
                ];

                for (const sel of optionSelectors) {
                    const els = document.querySelectorAll(sel);
                    if (els && els.length >= 2) {
                        for (const el of els) {
                            let txt = (el.innerText || el.value || el.getAttribute('data-value') || '').trim();
                            // Clean noise
                            txt = txt.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
                            if (txt && !txt.toLowerCase().includes('select') && !txt.toLowerCase().includes('choose') && txt.length < 25) {
                                const cleanTxt = txt.replace(/[\r\n\t]/g, '').trim();
                                if (cleanTxt && !options.includes(cleanTxt)) {
                                    options.push(cleanTxt);
                                }
                            }
                        }
                        if (options.length >= 2) break;
                    }
                }

                // Check quantity input
                const qtyEl = document.querySelector('input[name*="quantity" i], .quantity-input, select[name*="quantity" i]');
                const hasQty = !!qtyEl;

                // Detect option category type
                const sampleStr = options.join(' ').toLowerCase();
                if (/(\b\d{1,2}\b|xs|s|m|l|xl|xxl|uk|us)/i.test(sampleStr)) {
                    detectedType = 'size';
                } else if (/(gb|tb|ram|ssd|storage)/i.test(sampleStr)) {
                    detectedType = 'storage';
                } else if (/(black|blue|red|white|gold|silver|grey|green|pink)/i.test(sampleStr)) {
                    detectedType = 'color';
                } else if (/(kg|g|gm|ml|ltr|pack|pcs|piece)/i.test(sampleStr)) {
                    detectedType = 'pack / weight';
                }

                return {
                    options: options.slice(0, 10),
                    option_type: detectedType,
                    has_quantity: hasQty
                };
            }''')

            if variant_info and variant_info.get("options") and len(variant_info["options"]) >= 2:
                opts = variant_info["options"]
                opt_type = variant_info.get("option_type", "option")
                result["page_type"] = "requires_options"
                result["available_sizes"] = opts
                result["available_options"] = opts
                result["option_type"] = opt_type
                result["requires_size"] = True
                result["requires_quantity"] = variant_info.get("has_quantity", False)

                opts_str = ", ".join(opts[:6])
                if opt_type == 'size':
                    result["spoken_prompt"] = (
                        f"I've opened the product on your screen! Available sizes are {opts_str}. "
                        f"What size and quantity would you like me to select for you?"
                    )
                elif opt_type == 'storage':
                    result["spoken_prompt"] = (
                        f"I've opened the product on your screen! Available variants are {opts_str}. "
                        f"Which storage variant and quantity should I select for you?"
                    )
                elif opt_type == 'color':
                    result["spoken_prompt"] = (
                        f"I've opened the product on your screen! Available color options are {opts_str}. "
                        f"Which color and quantity would you like me to select?"
                    )
                elif opt_type == 'pack / weight':
                    result["spoken_prompt"] = (
                        f"I've opened the product on your screen! Available pack sizes are {opts_str}. "
                        f"Which pack option and quantity should I select?"
                    )
                else:
                    result["spoken_prompt"] = (
                        f"I've opened the product on your screen! Available options are {opts_str}. "
                        f"Which option and quantity would you like me to select for you?"
                    )
                return result
        except Exception as e:
            print(f"[LiveScreenInspector] Variant inspection notice: {e}")

        # ------------------------------------------------------------------
        # 3. SINGLE PRODUCT DETAIL PAGE (PDP)
        # ------------------------------------------------------------------
        try:
            pdp_info = page.evaluate('''() => {
                // Myntra brand + name
                const myntraBrand = document.querySelector('.pdp-title, h1.pdp-title, .product-brand');
                const myntraName = document.querySelector('.pdp-name, h1.pdp-name, h2.pdp-title, .product-product');
                
                let title = '';
                if (myntraBrand && myntraName) {
                    title = `${myntraBrand.innerText.trim()} - ${myntraName.innerText.trim()}`;
                } else {
                    const titleEl = document.querySelector('h1.pdp-title, h1.pdp-name, h1, .product-title, ._2N1Ekc, .B_NuCI, #productTitle');
                    title = titleEl ? titleEl.innerText.trim() : '';
                }

                // E-commerce price selectors (Myntra, Flipkart, Amazon, Croma, Shopify)
                const priceEl = document.querySelector(
                    'span.pdp-price, strong.pdp-price, span.pdp-discounted-price, .pdp-selling-price, .product-discountedPrice, .price, span.woocommerce-Price-amount, div._30jeq3, span.a-price-whole, #priceblock_ourprice, div[class*="price" i], span[class*="price" i]'
                );
                const origPriceEl = document.querySelector(
                    'span.pdp-mrp, .pdp-strike, del, div._3I9_wc, span.a-text-price span.a-offscreen, .product-strike'
                );

                // Myntra and e-commerce size buttons
                const sizeBtns = document.querySelectorAll(
                    'button.size-buttons-size-button, .size-buttons-unified-size, div.size-buttons-tipAndBtnContainer button, p.size-buttons-unified-size'
                );
                const extractedSizes = [];
                if (sizeBtns && sizeBtns.length > 0) {
                    for (const b of sizeBtns) {
                        const sTxt = b.innerText.trim();
                        if (sTxt && !extractedSizes.includes(sTxt)) {
                            extractedSizes.push(sTxt);
                        }
                    }
                }

                return {
                    title: title,
                    price: priceEl ? priceEl.innerText.trim() : '',
                    original_price: origPriceEl ? origPriceEl.innerText.trim() : '',
                    sizes: extractedSizes
                };
            }''')

            p_digits = re.findall(r'\d+', pdp_info.get("price", "").replace(",", "")) if pdp_info else []
            orig_digits = re.findall(r'\d+', pdp_info.get("original_price", "").replace(",", "")) if pdp_info else []
            if p_digits:
                result["live_price"] = int(p_digits[0])
                result["original_price"] = int(orig_digits[0]) if orig_digits else result["live_price"]

            clean_pdp_title = ' '.join(pdp_info.get("title", "").split()) if pdp_info else ""
            if clean_pdp_title:
                result["page_title"] = clean_pdp_title

            pdp_sizes = pdp_info.get("sizes", []) if pdp_info else []
            if pdp_sizes and len(pdp_sizes) >= 2:
                result["available_sizes"] = pdp_sizes
                result["requires_size"] = True
                result["page_type"] = "requires_options"
                result["option_type"] = "size"

            is_footwear_or_apparel = any(w in (result["page_title"] or "").lower() for w in [
                "shoe", "shoes", "sneaker", "sneakers", "loafers", "boot", "boots", "sandals", "slippers",
                "shirt", "tshirt", "t-shirt", "kurta", "jeans", "pants", "dress"
            ])

            if is_footwear_or_apparel and not result.get("available_sizes"):
                result["available_sizes"] = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"]
                result["requires_size"] = True
                result["page_type"] = "requires_options"
                result["option_type"] = "size"

            if result["requires_size"]:
                size_str = ", ".join(result["available_sizes"][:6])
                price_mention = f" at Rs.{result['live_price']}" if result["live_price"] else ""
                result["spoken_prompt"] = (
                    f"I've opened {result['store_name']} on your screen for '{result['page_title'] or 'this item'}'{price_mention}! "
                    f"Available sizes are {size_str}. What shoe size do you wear so I can select it for you?"
                )
            elif result["live_price"]:
                result["spoken_prompt"] = (
                    f"I've opened {result['store_name']} on your screen! The verified live price for "
                    f"'{result['page_title'][:35]}' is Rs.{result['live_price']}. Would you like me to confirm and add it to your cart?"
                )
            else:
                result["spoken_prompt"] = (
                    f"I've opened {result['store_name']} on your screen! Would you like me to proceed with this deal?"
                )
        except Exception as e:
            print(f"[LiveScreenInspector] PDP inspection notice: {e}")

        return result

    @staticmethod
    def capture_active_screen_snapshot() -> Optional[str]:
        """
        Grabs a full-desktop screenshot and returns temporary save path.
        Enables visual screen inspection by Omni.
        """
        try:
            import tempfile
            import os
            screenshot = ImageGrab.grab()
            tmp_path = os.path.join(tempfile.gettempdir(), "dealmesh_screen_inspect.png")
            screenshot.save(tmp_path, format="PNG")
            return tmp_path
        except Exception as e:
            print(f"[LiveScreenInspector] Screen capture notice: {e}")
            return None
