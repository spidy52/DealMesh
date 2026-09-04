import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mic,
  Sparkles,
  Shield,
  Bot,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  History,
  RotateCcw,
  Zap,
  Volume2,
  User,
  LogIn,
  Sun,
  Moon,
  MessageSquare,
  X,
  Watch,
  Headphones,
  Footprints,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  Activity,
  Monitor,
  Palette,
  Settings,
} from 'lucide-react';
import { SearchVisualizer } from './components/Search/SearchVisualizer';
import { SplitBrowserView } from './components/Browser/SplitBrowserView';
import { HologramProjection } from './components/Hologram/HologramProjection';
import { ApprovalModal } from './components/Approval/ApprovalModal';
import { RazorpayModal } from './components/Checkout/RazorpayModal';
import { TransactionPassport } from './components/Passport/TransactionPassport';
import { CurrentOngoingDeal } from './components/Deals/CurrentOngoingDeal';
import { ChatHistoryFeed } from './components/Chat/ChatHistoryFeed';
import { AuthUserData } from './components/Auth/AuthModal';
import { DesktopNegotiationArena } from './components/Negotiation/DesktopNegotiationArena';
import { FreeRoamingPet } from './components/Pet/FreeRoamingPet';
import { SettingsModal } from './components/Settings/SettingsModal';
import { useVoiceInput } from './hooks/useVoiceInput';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { api, RankedProductData, SearchResponse, NegotiationResult, TransactionPassportData, UserSettingsData } from './services/api';
import { wsClient } from './services/websocket';

export default function App() {
  const [isNegotiationArenaOpen, setIsNegotiationArenaOpen] = useState(false);

  // Active User Profile
  const [currentUser, setCurrentUser] = useState<AuthUserData | null>(() => {
    try {
      const saved = localStorage.getItem('dealmesh_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'user_buyer_default',
      name: 'Alex Walker',
      email: 'buyer@dealmesh.ai',
      role: 'buyer',
    };
  });

  // Per-User Bot & UI Customization Settings
  const [userSettings, setUserSettings] = useState<UserSettingsData>({
    user_id: 'user_buyer_default',
    accent_color: '#00F0FF',
    eye_color: '#00F0FF',
    voice_name: 'default',
    voice_pitch: 1.0,
    voice_rate: 1.0,
    dock_x_percent: 0.85,
    dock_y_percent: 0.82,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [searchQuery, setSearchQuery] = useState('Find me formal watches under ₹3,000');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState('BEST_VALUE');
  const [isHologramActive, setIsHologramActive] = useState(false);

  // Active negotiation & selected product for split view
  const [selectedProduct, setSelectedProduct] = useState<RankedProductData | null>(null);
  const [activeNegotiation, setActiveNegotiation] = useState<NegotiationResult | null>(null);
  const [isNegotiating, setIsNegotiating] = useState(false);

  // Modals & Drawer states
  const [isChatFeedOpen, setIsChatFeedOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalDetails, setApprovalDetails] = useState<{
    negotiationId: string;
    productName: string;
    merchantName: string;
    counterPrice: number;
    reason: string;
  } | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentDealId, setCurrentDealId] = useState<string>('');

  // Transaction Passport
  const [passportData, setPassportData] = useState<TransactionPassportData | null>(null);

  // TTS Speech Synthesizer Hook with active user customizations
  const { speak } = useSpeechSynthesis({
    voiceName: userSettings.voice_name,
    pitch: userSettings.voice_pitch,
    rate: userSettings.voice_rate,
  });

  // Load User Customization Settings on user switch
  useEffect(() => {
    const fetchSettings = async () => {
      const uId = currentUser?.id || 'user_buyer_default';
      try {
        const s = await api.getSettings(uId);
        if (s) {
          setUserSettings(s);
        }
      } catch (err) {
        console.warn('Failed to load user settings:', err);
      }
    };
    fetchSettings();
  }, [currentUser?.id]);

  // Voice Recognition Hook with "Hey Omni" Wake Word
  const voice = useVoiceInput({
    onWakeWord: () => {
      speak('I am listening. What product should I find for you?');
    },
    onResult: async (spokenText) => {
      setSearchQuery(spokenText);
      setIsHologramActive(true);

      if (
        spokenText.toLowerCase().startsWith('who') ||
        spokenText.toLowerCase().startsWith('why') ||
        spokenText.toLowerCase().startsWith('how') ||
        spokenText.toLowerCase().startsWith('what')
      ) {
        try {
          const chatRes = await api.chatWithPet(spokenText);
          speak(chatRes.reply);
        } catch {
          handleSearch(undefined, spokenText);
        }
      } else {
        speak(`Searching live market for ${spokenText}`);
        handleSearch(undefined, spokenText);
      }
    },
    onError: (err) => {
      console.warn('Voice error:', err);
    },
  });

  // Initialize WebSockets and listeners
  useEffect(() => {
    wsClient.connect();

    const unsubApproval = wsClient.on('approval.required', (data: any) => {
      setApprovalDetails({
        negotiationId: data.negotiation_id,
        productName: selectedProduct?.product_name || 'Verified Product',
        merchantName: selectedProduct?.merchant_name || 'Online Merchant',
        counterPrice: data.merchant_counter,
        reason: data.reason,
      });
      setIsApprovalModalOpen(true);
      speak(`Approval required! Merchant AI offered ${data.merchant_counter} rupees.`);
    });

    const unsubSettings = wsClient.on('pet.settings_updated', (data: any) => {
      if (data?.user_id === (currentUser?.id || 'user_buyer_default')) {
        setUserSettings((prev) => ({ ...prev, ...data }));
      }
    });

    const unsubDock = wsClient.on('pet.dock_updated', (data: any) => {
      if (data?.user_id === (currentUser?.id || 'user_buyer_default')) {
        setUserSettings((prev) => ({
          ...prev,
          dock_x_percent: data.x_percent,
          dock_y_percent: data.y_percent,
        }));
      }
    });

    return () => {
      unsubApproval();
      unsubSettings();
      unsubDock();
    };
  }, [selectedProduct, currentUser?.id]);

  // Execute Search: Instant responsive multi-store results with real live web discovery
  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || searchQuery;
    if (!q.trim()) return;

    setIsSearching(true);
    setPassportData(null);
    setSelectedProduct(null);
    setActiveNegotiation(null);
    setIsHologramActive(true);

    const priceUnderMatch = q.match(/(?:under|below|upto|up to|less than|around)\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
    const parsedMax = priceUnderMatch ? parseInt(priceUnderMatch[1].replace(/,/g, ''), 10) : undefined;
    const isWatchQuery = /watch|watches|smartwatch|chronograph|titan|fastrack|fossil/i.test(q);

    try {
      // 1. If searching for watches, query instant seeded store catalog (<300ms)
      if (isWatchQuery) {
        try {
          const res = await api.searchMarket(q, undefined, parsedMax || 3000, selectedStrategy);
          if (res.ranked_products.length > 0) {
            setSearchResponse(res);
            setSelectedProduct(res.ranked_products[0]);
          }
        } catch (marketErr) {
          console.warn('Local market search notice:', marketErr);
        }
      }

      // 2. Real-time live multi-store web discovery across Amazon, Flipkart, Blinkit, Zepto, etc.
      const liveRes = await api.searchLive(q, undefined, parsedMax);
      if (liveRes.success && liveRes.products && liveRes.products.length > 0) {
        const rankedProds: RankedProductData[] = liveRes.products.map((p: any, idx: number) => {
          const hasRealOriginal = p.original_price && p.original_price > p.price;
          return {
            product_id: `prod_live_${idx}`,
            merchant_id: `merchant_${(p.merchant || 'store').toLowerCase().replace(/\s+/g, '_')}`,
            merchant_name: p.merchant,
            product_name: p.title,
            brand: p.merchant,
            original_price: p.original_price || p.price,
            current_price: p.price,
            currency: 'INR',
            trust_score: idx === 0 ? 96 : 91,
            trust_reasons: ['Live DOM price verified', 'Direct merchant page authenticated'],
            rating: p.rating || 4.5,
            review_count: p.review_count || 0,
            delivery_days: p.delivery_days || 2,
            return_days: p.return_days || 14,
            inventory: p.inventory || 1,
            is_ai_native: false,
            negotiated_savings: hasRealOriginal ? p.original_price - p.price : 0,
            value_composite_score: 95 - idx * 6,
            recommendation_badge: idx === 0 ? 'BEST VERIFIED DEAL' : undefined,
            win_explanation: idx === 0 ? 'Lowest verified price extracted directly from store DOM.' : undefined,
            image_url: p.image_url,
            url: p.url,
          };
        });

        setSearchResponse({
          search_session_id: `live_sess_${Date.now()}`,
          query: q,
          strategy: selectedStrategy,
          stores_checked: liveRes.stores?.length || liveRes.products.length,
          products_found: liveRes.products.length,
          ai_merchants_count: 1,
          store_reports: (liveRes.stores || []).map((s: any) => ({
            merchant_id: (s.name || 'store').toLowerCase().replace(/\s+/g, '_'),
            merchant_name: s.name,
            status: 'VERIFIED',
            is_ai_native: false,
            product_count: 1,
          })),
          ranked_products: rankedProds,
        });
        if (rankedProds.length > 0) {
          setSelectedProduct(rankedProds[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Strategy change
  const handleStrategyChange = async (strategy: string) => {
    setSelectedStrategy(strategy);
    if (searchQuery) {
      setIsSearching(true);
      const priceUnderMatch = searchQuery.match(/(?:under|below|upto|up to|less than|around)\s*(?:rs\.?|inr|₹)?\s*([\d,]+)/i);
      const parsedMax = priceUnderMatch ? parseInt(priceUnderMatch[1].replace(/,/g, ''), 10) : undefined;
      const isWatchQuery = /watch|watches|smartwatch|chronograph|titan|fastrack|fossil/i.test(searchQuery);

      try {
        if (isWatchQuery) {
          const res = await api.searchMarket(searchQuery, undefined, parsedMax || 3000, strategy);
          setSearchResponse(res);
          if (res.ranked_products.length > 0) {
            setSelectedProduct(res.ranked_products[0]);
          }
        } else if (searchResponse && searchResponse.ranked_products.length > 0) {
          const sorted = [...searchResponse.ranked_products];
          if (strategy === 'CHEAPEST_TRUSTED') {
            sorted.sort((a, b) => a.current_price - b.current_price);
          } else if (strategy === 'MAX_SAVINGS') {
            sorted.sort((a, b) => b.negotiated_savings - a.negotiated_savings);
          } else {
            sorted.sort((a, b) => b.value_composite_score - a.value_composite_score);
          }
          setSearchResponse({
            ...searchResponse,
            strategy,
            ranked_products: sorted,
          });
          setSelectedProduct(sorted[0]);
        }
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Start Live Negotiation
  const handleStartNegotiation = async (product: RankedProductData, simulateAboveCap = false) => {
    setSelectedProduct(product);
    setIsNegotiating(true);
    speak(`Negotiating price concessions autonomously with merchant AI.`);

    try {
      const res = await api.startNegotiation(product.product_id, product.merchant_id, simulateAboveCap);
      setActiveNegotiation(res);

      if (res.status === 'WAITING_FOR_APPROVAL') {
        setApprovalDetails({
          negotiationId: res.negotiation_id,
          productName: product.product_name,
          merchantName: product.merchant_name,
          counterPrice: res.current_merchant_counter || 2750,
          reason: res.message || 'Counter exceeds auto cap',
        });
        setIsApprovalModalOpen(true);
        speak(`Offer needs your approval at ${res.current_merchant_counter || 2750} rupees.`);
      } else if (res.deal_id) {
        setCurrentDealId(res.deal_id);
        speak(`Deal agreed at ${res.final_price || 2299} rupees. Ready for checkout.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNegotiating(false);
    }
  };

  // Handle User Approval
  const handleApproveAboveCap = async () => {
    if (!approvalDetails) return;
    speak(`Approved at ${approvalDetails.counterPrice} rupees. Proceeding to checkout.`);
    const res = await api.submitApprovalDecision(
      approvalDetails.negotiationId,
      'APPROVE',
      approvalDetails.counterPrice
    );
    setIsApprovalModalOpen(false);
    if (res.deal_id) {
      setCurrentDealId(res.deal_id);
      setIsCheckoutOpen(true);
    }
  };

  const handleRejectAboveCap = async () => {
    if (!approvalDetails) return;
    speak(`Rejected offer above auto cap. Continuing search.`);
    await api.submitApprovalDecision(approvalDetails.negotiationId, 'REJECT');
    setIsApprovalModalOpen(false);
  };

  // Payment Success
  const handlePaymentSuccess = async (dealId: string) => {
    setIsCheckoutOpen(false);
    speak(`Payment captured successfully. Generating cryptographic Transaction Passport.`);
    try {
      const pass = await api.getTransactionPassport(dealId);
      setPassportData(pass);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVoiceButtonClick = () => {
    if (voice.isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
      speak('Say Hey Omni, or speak your search request.');
    }
  };

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between selection:bg-lemon-500 selection:text-black relative overflow-x-hidden transition-colors duration-300 font-sans ${
        isLight ? 'bg-[#F9FAFB] text-slate-900' : 'bg-[#000000] text-slate-100'
      }`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-white/95 border-slate-200 shadow-sm'
            : 'bg-[#000000]/90 border-[#181818]'
        }`}
      >
        {/* Left: Brand & Engine Tag */}
        <div className="flex items-center gap-3.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm shadow-inner ${
            isLight ? 'bg-slate-900 text-white' : 'bg-[#0E0E0E] border border-[#222222] text-lemon-400'
          }`}>
            DM
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-base font-black tracking-tight font-mono uppercase ${isLight ? 'text-slate-900' : 'text-white'}`}>
              DEALMESH
            </span>
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isLight
                ? 'bg-slate-100 border border-slate-300 text-slate-700'
                : 'bg-[#0E1508] border border-lemon-500/30 text-lemon-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-slate-800' : 'bg-lemon-400 animate-pulse'}`} />
              LIVE COMMERCE ENGINE
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Conversation History */}
          <button
            onClick={() => setIsChatFeedOpen(true)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                : 'bg-[#0D0D0D] hover:bg-[#161616] text-slate-300 hover:text-white border-[#222222]'
            }`}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${isLight ? 'text-slate-800' : 'text-lemon-400'}`} />
            <span>Deal History</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
            className={`p-2 rounded-xl border transition ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-sm'
                : 'bg-[#0D0D0D] border-[#222222] text-slate-400 hover:text-lemon-400 hover:border-lemon-500/40'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-lemon-400" />}
          </button>

          {/* Unified Settings Hub (Appearance, Position, Voice, Account & Policy) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-[#0D0D0D] hover:bg-[#161616] text-slate-200 hover:text-white border-[#222222] hover:border-lemon-500/40'
            }`}
            title="Open Unified Settings Hub (Appearance, Dock Position, Voice, Account & Policy)"
          >
            <Settings className="w-3.5 h-3.5 text-lemon-400" />
            <span>Settings</span>
            <span
              className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20 shrink-0"
              style={{
                backgroundColor: userSettings.accent_color,
                boxShadow: `0 0 8px ${userSettings.accent_color}`,
              }}
            />
            <span className="hidden sm:inline text-slate-400 font-mono text-[11px] font-normal border-l border-slate-700/60 pl-2">
              {currentUser?.name ? currentUser.name.split(' ')[0] : 'Guest'}
            </span>
          </button>

          {/* Merchant Studio Link */}
          <a
            href="http://localhost:5174"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black text-xs font-extrabold transition shadow-[0_0_15px_rgba(204,255,0,0.2)]"
          >
            <span className="hidden sm:inline">Merchant Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 space-y-10 flex-1 relative z-10 pb-28">
        {passportData ? (
          <TransactionPassport
            passport={passportData}
            onBackToHome={() => setPassportData(null)}
          />
        ) : (
          <>
            {/* Search Console Header */}
            <div className="space-y-4 max-w-3xl mx-auto text-center">
              <span className={`text-xs font-bold uppercase tracking-widest font-mono flex items-center justify-center gap-1.5 ${
                isLight ? 'text-slate-700 font-extrabold' : 'text-lemon-400'
              }`}>
                <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-slate-800' : 'text-lemon-400'}`} />
                Autonomous Multi-Merchant Intelligence
              </span>
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Scan live web stores. Negotiate with AI. Complete verified purchase.
              </h2>

              {/* Natural Language Query Bar */}
              <div
                className={`rounded-3xl p-3 sm:p-4 border shadow-2xl space-y-3 transition-colors ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-slate-200/60'
                    : 'bg-[#0A0A0A] border-[#1F1F1F] shadow-[0_0_50px_rgba(0,0,0,0.9)] focus-within:border-lemon-500/50'
                }`}
              >
                <form onSubmit={(e) => handleSearch(e)} className="relative flex items-center">
                  <Search className={`w-5 h-5 absolute left-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search across stores (e.g. Find formal watches under ₹3,000)..."
                    className={`w-full pl-12 pr-44 py-4 border rounded-2xl text-sm focus:outline-none transition-colors font-mono ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-800'
                        : 'bg-[#050505] border-[#222222] text-white placeholder-slate-500 focus:border-lemon-400 shadow-inner'
                    }`}
                  />
                  <div className="absolute right-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleVoiceButtonClick}
                      className={`p-2.5 rounded-xl transition flex items-center gap-1.5 ${
                        voice.isListening
                          ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_#F43F5E]'
                          : isLight
                          ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                          : 'bg-[#141414] hover:bg-[#1E1E1E] text-slate-300 hover:text-lemon-400 border border-[#262626]'
                      }`}
                      title={voice.isListening ? 'Listening for voice input...' : 'Activate Voice'}
                    >
                      <Mic className={`w-4 h-4 ${voice.isListening ? 'text-white' : isLight ? 'text-slate-800' : 'text-lemon-400'}`} />
                      <span className="text-[11px] font-bold">
                        {voice.isListening ? 'Listening' : 'Voice'}
                      </span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-5 py-2.5 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-black text-xs shadow-lg shadow-lemon-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {isSearching ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Scanning...</span>
                        </span>
                      ) : (
                        <span>Scan Live Stores</span>
                      )}
                    </button>
                  </div>
                </form>

                {/* Quick Prompts */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Quick Searches:</span>
                  {[
                    { label: 'Titan formal watches under ₹3,000', icon: Watch },
                    { label: 'Adidas running shoes under ₹3,500', icon: Footprints },
                    { label: 'Noise cancelling headphones', icon: Headphones },
                  ].map((item, pIdx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(item.label);
                          handleSearch(undefined, item.label);
                        }}
                        className={`text-[11px] px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            : 'bg-[#0E0E0E] hover:bg-[#161616] text-slate-300 hover:text-white border-[#222222] hover:border-lemon-500/30'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-lemon-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Current Ongoing Deal Hero Card */}
            {selectedProduct && (
              <CurrentOngoingDeal
                deal={{
                  title: selectedProduct.product_name,
                  merchant_name: selectedProduct.merchant_name,
                  price: selectedProduct.current_price,
                  original_price: selectedProduct.original_price,
                  image_url: selectedProduct.image_url,
                  url: selectedProduct.url,
                  savings: selectedProduct.negotiated_savings,
                  discount_percent: selectedProduct.original_price && selectedProduct.original_price > selectedProduct.current_price
                    ? Math.round(((selectedProduct.original_price - selectedProduct.current_price) / selectedProduct.original_price) * 100)
                    : undefined,
                  trust_score: selectedProduct.trust_score
                }}
                isLight={isLight}
                on1ClickBuy={() => {
                  setCurrentDealId('deal_titan_default');
                  setIsCheckoutOpen(true);
                }}
                onViewPassport={() => {
                  fetch('http://localhost:8000/api/audit/passport/deal_titan_default')
                    .then((res) => res.json())
                    .then((data) => setPassportData(data))
                    .catch((err) => console.warn(err));
                }}
              />
            )}

            {/* Multi-Store Concurrent Search Visualizer */}
            <SearchVisualizer
              isSearching={isSearching}
              searchResponse={searchResponse}
              query={searchQuery}
            />

            {/* Split Screen Storefront & DMCP Live Negotiation */}
            {selectedProduct && (
              <SplitBrowserView
                product={selectedProduct}
                negotiation={activeNegotiation}
                petName="DealMesh AI"
                onProceedToBuy={() => {
                  if (activeNegotiation?.deal_id) {
                    setCurrentDealId(activeNegotiation.deal_id);
                  } else {
                    handleStartNegotiation(selectedProduct);
                  }
                  setIsCheckoutOpen(true);
                }}
                onNegotiateAgain={() => handleStartNegotiation(selectedProduct)}
                onOpenArena={() => setIsNegotiationArenaOpen(true)}
              />
            )}

            {/* Holographic Projection Floating Cards Matrix */}
            {searchResponse && (
              <HologramProjection
                products={searchResponse.ranked_products}
                selectedStrategy={selectedStrategy}
                onStrategyChange={handleStrategyChange}
                onSelectProduct={setSelectedProduct}
                onStartNegotiation={handleStartNegotiation}
              />
            )}
          </>
        )}
      </main>

      {/* Floating On-Screen Desktop Bot */}
      <FreeRoamingPet
        pet={{
          id: 'pet_omni',
          name: 'Omni',
          species: 'Fox',
          personality: 'Playful',
          appearance: 'orange_fox',
          state: isNegotiating ? 'NEGOTIATING' : isSearching ? 'SEARCHING' : 'SLEEPING',
          current_thought: isNegotiating ? 'Negotiating price concessions...' : 'Ready to search deals',
        }}
        onPetUpdate={() => {}}
        onVoiceTrigger={handleVoiceButtonClick}
        onOpenPolicy={() => setIsSettingsOpen(true)}
        isHologramActive={isHologramActive}
        onToggleHologram={() => setIsHologramActive(!isHologramActive)}
        isVoiceListening={voice.isListening}
        products={searchResponse?.ranked_products || []}
        onStartNegotiation={handleStartNegotiation}
        accentColor={userSettings.accent_color}
        dockCoords={{ xPercent: userSettings.dock_x_percent, yPercent: userSettings.dock_y_percent }}
      />

      {/* Unified Settings Hub Modal (All-in-one: Appearance, Position, Voice, Account & Policy) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUserUpdate={(user) => {
          setCurrentUser(user);
          if (user) {
            localStorage.setItem('dealmesh_buyer_user', JSON.stringify(user));
          } else {
            localStorage.removeItem('dealmesh_buyer_user');
          }
        }}
        currentSettings={userSettings}
        onSettingsUpdate={(updated) => {
          setUserSettings(updated);
        }}
      />

      <ApprovalModal
        isOpen={isApprovalModalOpen}
        productName={approvalDetails?.productName || 'Verified Product'}
        merchantName={approvalDetails?.merchantName || 'Online Merchant'}
        offeredPrice={approvalDetails?.counterPrice || 2750}
        autoCap={3000}
        absoluteMax={3500}
        reason={approvalDetails?.reason || ''}
        onApprove={handleApproveAboveCap}
        onReject={handleRejectAboveCap}
      />

      <RazorpayModal
        isOpen={isCheckoutOpen}
        dealId={currentDealId || 'deal_titan_default'}
        productName={selectedProduct?.product_name || 'Titan Neo Classic Watch'}
        merchantName={selectedProduct?.merchant_name || 'Titan Demo Store'}
        originalPrice={selectedProduct?.original_price || 2799}
        finalPrice={activeNegotiation?.final_price || selectedProduct?.current_price || 2299}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handlePaymentSuccess}
        onFailureTriggered={async (failedDealId) => {
          setIsCheckoutOpen(false);
          const rec = await api.executeRecovery(failedDealId, 1);
          alert(`Autonomous Recovery Agent: ${rec.message}`);
        }}
      />

      {/* Fullscreen AI Multi-Chat History Modal */}
      {isChatFeedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl">
            <button
              onClick={() => setIsChatFeedOpen(false)}
              className={`absolute -top-3 -right-3 z-10 p-2 rounded-full border shadow-xl transition ${
                isLight ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100' : 'bg-[#141414] text-slate-400 hover:text-white border-[#2A2A2A]'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
            <ChatHistoryFeed
              isLight={isLight}
              onSelectDeal={(dealData, query) => {
                setSelectedProduct(dealData);
                setSearchQuery(query);
                setIsChatFeedOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Desktop Dual-Bot Negotiation Arena - ONLY opens when actively making a deal */}
      <DesktopNegotiationArena
        isOpen={isNegotiationArenaOpen}
        productName={selectedProduct?.product_name || 'Titan Neo Workwear Classic Formal Watch'}
        listedPrice={selectedProduct?.original_price || 2799}
        storeName={selectedProduct?.merchant_name || 'Titan Demo Store'}
        onClose={() => setIsNegotiationArenaOpen(false)}
        onProceedToCart={(pName, price, store) => {
          setIsNegotiationArenaOpen(false);
          setIsCheckoutOpen(true);
        }}
        onExploreOtherStores={() => {
          setIsNegotiationArenaOpen(false);
          handleSearch(undefined, 'watches under 2500');
        }}
      />
    </div>
  );
}
