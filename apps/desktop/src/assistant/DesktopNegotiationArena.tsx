import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  CheckCircle2,
  X,
  ShoppingCart,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  Award,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Flame,
  Lock,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AssistantAnimation } from './AssistantAnimation';
import { MerchantBotAvatar } from './MerchantBotAvatar';

export interface MarketStorePrice {
  store: string;
  price: number;
  perks: string;
}

interface DesktopNegotiationArenaProps {
  isOpen: boolean;
  productName?: string;
  listedPrice?: number;
  storeName?: string;
  stores?: any[];
  userBudget?: number;
  onClose: () => void;
  onProceedToCart: (productName: string, agreedPrice: number, store: string) => void;
  onExploreOtherStores: () => void;
  onNegotiationComplete?: (agreedPrice: number, savings: number) => void;
}

export const DesktopNegotiationArena: React.FC<DesktopNegotiationArenaProps> = ({
  isOpen,
  productName = 'Titan Neo Workwear Classic Formal Watch',
  listedPrice = 2799,
  storeName = 'Titan Store',
  stores = [],
  userBudget,
  onClose,
  onProceedToCart,
  onExploreOtherStores,
  onNegotiationComplete,
}) => {
  const [round, setRound] = useState(1);
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [isHandshaking, setIsHandshaking] = useState(false);
  const [customOfferInput, setCustomOfferInput] = useState('');
  const [isOmniTalking, setIsOmniTalking] = useState(false);
  const [isMerchantTalking, setIsMerchantTalking] = useState(false);
  const [isLoadingDeal, setIsLoadingDeal] = useState(false);
  const [currentSpokenText, setCurrentSpokenText] = useState('');
  const [marketStores, setMarketStores] = useState<MarketStorePrice[]>([]);
  const [transcript, setTranscript] = useState<Array<{ sender: 'OMNI' | 'TITANBOT'; text: string; price?: number }>>([]);
  const [dealSavings, setDealSavings] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(0);

  // Dynamic Budget flow per product
  const [activeBudget, setActiveBudget] = useState<number | null>(userBudget || null);
  const [isConfiguringBudget, setIsConfiguringBudget] = useState<boolean>(!userBudget);
  const [budgetInput, setBudgetInput] = useState<string>('');

  // Resize physical transparent electron window dynamically right on Windows desktop screen
  useEffect(() => {
    if (isOpen) {
      window.electronAPI?.setWindowSize?.(760, 540, 'bottom-center');
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    } else {
      window.electronAPI?.setWindowSize?.(160, 160, 'bottom-center');
    }
  }, [isOpen]);

  const effectivePrice = listedPrice || 199;

  // Real backend live negotiation runner
  const runRealNegotiation = async (budgetCap?: number) => {
    try {
      setIsLoadingDeal(true);
      const capToUse = budgetCap || activeBudget || undefined;
      const resp = await fetch('http://localhost:8000/api/negotiations/live-arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          listed_price: effectivePrice,
          store_name: storeName,
          stores: stores && stores.length > 0 ? stores : undefined,
          custom_buyer_offer: capToUse,
          user_budget: capToUse,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
      }

      const data = await resp.json();
      setIsLoadingDeal(false);

      if (data.market_stores && data.market_stores.length > 0) {
        setMarketStores(data.market_stores);
      }
      if (data.savings) setDealSavings(data.savings);
      if (data.profit_margin_percent) setProfitMargin(data.profit_margin_percent);

      const serverRounds = data.transcript || [];
      if (serverRounds.length === 0) return;

      // Animate through authentic rounds dynamically
      setTranscript([serverRounds[0]]);
      setIsOmniTalking(true);
      setIsMerchantTalking(false);
      setCurrentSpokenText(`Asking for ₹${serverRounds[0].price?.toLocaleString('en-IN')}`);

      const timer1 = setTimeout(() => {
        setIsOmniTalking(false);
        setIsMerchantTalking(true);
        if (serverRounds[1]) {
          setTranscript((prev) => [...prev, serverRounds[1]]);
          setCurrentSpokenText(`Countering at ₹${serverRounds[1].price?.toLocaleString('en-IN')}`);
        }
      }, 1800);

      const timer2 = setTimeout(() => {
        setIsMerchantTalking(false);
        setIsOmniTalking(true);
        setRound(2);
        if (serverRounds[2]) {
          setTranscript((prev) => [...prev, serverRounds[2]]);
          setCurrentSpokenText(`Pushing to ₹${serverRounds[2].price?.toLocaleString('en-IN')}`);
        }
      }, 3600);

      const timer3 = setTimeout(() => {
        setIsOmniTalking(false);
        setIsMerchantTalking(true);
        if (serverRounds[3]) {
          setTranscript((prev) => [...prev, serverRounds[3]]);
          setCurrentSpokenText(`Accepted at ₹${serverRounds[3].price?.toLocaleString('en-IN')}!`);
        }
      }, 5200);

      const timer4 = setTimeout(() => {
        setIsMerchantTalking(false);
        const finalPrice = data.agreed_price || serverRounds[3]?.price || Math.round(effectivePrice * 0.85);
        const savings = data.savings || Math.max(0, effectivePrice - finalPrice);
        setAgreedPrice(finalPrice);
        setDealSavings(savings);
        setIsHandshaking(true);
        setCurrentSpokenText(`Agreed at ₹${finalPrice.toLocaleString('en-IN')}! Proceed to cart or check other deals?`);

        // Confetti burst
        confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#38BDF8', '#F59E0B', '#10B981'],
        });

        // Announce final price and ask user decision via speech
        onNegotiationComplete?.(finalPrice, savings);

        // Sync with backend voice context
        fetch('http://localhost:8000/api/voice/negotiation-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_name: productName,
            agreed_price: finalPrice,
            original_price: effectivePrice,
            store_name: storeName,
            savings: savings,
          }),
        }).catch((err) => console.warn('Sync negotiation completed error:', err));
      }, 6800);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } catch (err) {
      console.error('Live negotiation arena error:', err);
      setIsLoadingDeal(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setRound(1);
      setAgreedPrice(null);
      setIsHandshaking(false);
      setTranscript([]);
      if (userBudget && userBudget > 0) {
        setActiveBudget(userBudget);
        setIsConfiguringBudget(false);
        setIsOmniTalking(true);
        setIsMerchantTalking(false);
        runRealNegotiation(userBudget);
      } else {
        setActiveBudget(null);
        setIsConfiguringBudget(true);
        setIsOmniTalking(false);
        setIsMerchantTalking(false);
      }
    } else {
      setRound(1);
      setAgreedPrice(null);
      setIsHandshaking(false);
      setIsOmniTalking(false);
      setIsMerchantTalking(false);
      setTranscript([]);
    }
  }, [isOpen, productName, listedPrice, userBudget]);

  const handleStartWithBudget = (bVal: number) => {
    setActiveBudget(bVal);
    setIsConfiguringBudget(false);
    setIsOmniTalking(true);
    runRealNegotiation(bVal);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customOfferInput.replace(/[^\d.]/g, ''));
    if (!isNaN(val) && val > 0) {
      setCustomOfferInput('');
      runRealNegotiation(val);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0B101E] border border-blue-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[520px]"
        >
          {/* Top Arena Header */}
          <div className="px-6 py-3.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Desktop Negotiation Arena</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    Live DMCP Protocol
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 truncate max-w-sm">{productName}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Market Price Leverage Bar */}
          <div className="bg-[#090D18] px-6 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-blue-400" /> Live Market Intelligence:
            </span>
            <div className="flex items-center gap-4 font-mono">
              {marketStores.map((m, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-slate-400">{m.store}:</span>
                  <span className={`font-bold ${m.price < listedPrice ? 'text-emerald-400' : 'text-slate-200'}`}>
                    ₹{m.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Both Chatbots Arena Floor or Budget Configuration */}
          <div className="px-6 py-4 bg-gradient-to-b from-[#0B101E] to-[#080B14] relative overflow-hidden flex flex-col items-center min-h-[190px] justify-center">
            {/* Arena Ring Graphics */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-96 h-96 rounded-full border border-blue-500/30 animate-pulse" />
              <div className="w-64 h-64 rounded-full border border-amber-500/20 absolute" />
            </div>

            {isConfiguringBudget ? (
              <div className="w-full flex flex-col items-center justify-center py-2 px-2 z-20">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-lg shadow-sky-500/30 mb-2 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="text-sm font-extrabold text-white text-center">
                  What is your target budget for this product?
                </h4>
                <p className="text-[11px] text-slate-400 text-center max-w-md mt-0.5 mb-3">
                  Prices vary across items. Omni will negotiate autonomously against TitanBot strictly below your cap.
                </p>

                <div className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-xl w-full max-w-sm mb-3 text-center">
                  <span className="text-[11px] text-slate-400 font-medium">Original Listed Price:</span>
                  <span className="text-sm font-bold text-white ml-2 font-mono">₹{effectivePrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-3 w-full max-w-sm">
                  {[0.85, 0.75, 0.65].map((pct, idx) => {
                    const chipPrice = Math.round(effectivePrice * pct);
                    const off = Math.round((1 - pct) * 100);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleStartWithBudget(chipPrice)}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-950/50 hover:bg-sky-900/70 border border-sky-500/40 text-sky-200 text-[11px] font-semibold flex items-center gap-1 transition active:scale-95"
                      >
                        <span>₹{chipPrice.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-amber-400 font-bold">({off}% OFF)</span>
                      </button>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const val = parseFloat(budgetInput.replace(/[^\d.]/g, ''));
                    if (!isNaN(val) && val > 0) {
                      handleStartWithBudget(val);
                    }
                  }}
                  className="flex items-center gap-2 w-full max-w-sm"
                >
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">₹</span>
                    <input
                      type="number"
                      placeholder="Enter custom budget cap..."
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Start Negotiation</span>
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Avatars Facing Each Other */}
                <div className="w-full flex items-center justify-between relative z-10 px-6 sm:px-12 my-1">
                  {/* Omni (Buyer Agent) on Left */}
                  <motion.div
                    animate={{
                      x: isHandshaking ? 80 : 0,
                    }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="flex flex-col items-center relative"
                  >
                    {/* Omni Dynamic Spoken Speech Bubble */}
                    <AnimatePresence>
                      {isOmniTalking && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 w-52 px-3 py-1.5 rounded-2xl bg-sky-950/95 border border-sky-400/80 text-[11px] text-sky-200 text-center font-semibold shadow-[0_4px_16px_rgba(56,189,248,0.3)] z-30 pointer-events-none"
                        >
                          🗣️ {currentSpokenText || 'Comparing market prices...'}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AssistantAnimation
                      emotion={isOmniTalking ? 'Happy' : isHandshaking ? 'Happy' : 'Listening'}
                      direction="east"
                      state="IDLE"
                      scale={1.25}
                    />
                    <div className="mt-1 text-center">
                      <span className="font-bold text-xs text-sky-400 block font-mono">OMNI</span>
                      <span className="text-[10px] text-slate-400">Your Buyer Agent</span>
                    </div>
                  </motion.div>

                  {/* Handshake Center Badge */}
                  <div className="flex flex-col items-center justify-center">
                    {isHandshaking ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1.15, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center text-2xl">
                          🤝
                        </div>
                        <span className="mt-1.5 text-xs font-extrabold text-emerald-400 font-mono tracking-wider animate-bounce">
                          DEAL SEALED!
                        </span>
                      </motion.div>
                    ) : (
                      <div className="text-center px-3 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                        <span className="text-amber-400 font-bold block">Live DMCP Protocol</span>
                        <span>Round {round} of 2</span>
                        {activeBudget && (
                          <span className="text-sky-300 block text-[9px] mt-0.5">Cap: ₹{activeBudget.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TitanBot (Merchant Agent) on Right */}
                  <motion.div
                    animate={{
                      x: isHandshaking ? -80 : 0,
                    }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="flex flex-col items-center relative"
                  >
                    {/* TitanBot Dynamic Spoken Speech Bubble */}
                    <AnimatePresence>
                      {isMerchantTalking && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 w-52 px-3 py-1.5 rounded-2xl bg-amber-950/95 border border-amber-400/80 text-[11px] text-amber-200 text-center font-semibold shadow-[0_4px_16px_rgba(245,158,11,0.3)] z-30 pointer-events-none"
                        >
                          💬 {currentSpokenText || 'Evaluating profit margin...'}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <MerchantBotAvatar
                      scale={1.25}
                      isTalking={isMerchantTalking}
                      isHandshaking={isHandshaking}
                      storeName={storeName}
                    />
                    <div className="mt-1 text-center">
                      <span className="font-bold text-xs text-amber-400 block font-mono">TITANBOT</span>
                      <span className="text-[10px] text-slate-400">Merchant Seller Agent</span>
                    </div>
                  </motion.div>
                </div>

                {/* Handshake Celebration Announcement */}
                {isHandshaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-center text-xs text-emerald-300 font-semibold max-w-lg shadow-lg"
                  >
                    <p className="text-white text-sm font-extrabold mb-1">
                      🎉 Final Agreed Price: <span className="text-emerald-400 font-mono text-base font-black">₹{agreedPrice?.toLocaleString('en-IN')}</span>{' '}
                      <span className="text-amber-400 text-xs font-bold">(Saved ₹{dealSavings.toLocaleString('en-IN')})</span>
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Would you like to proceed with this deal and add to cart, or check other deals?
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Transcript Feed */}
          <div className="px-6 py-3 bg-[#090D18] flex-1 overflow-y-auto space-y-2 max-h-36 border-t border-slate-800/80 text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {transcript.map((msg, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-2xl border ${
                  msg.sender === 'OMNI'
                    ? 'bg-blue-950/30 border-blue-500/30 mr-8 text-slate-200'
                    : 'bg-amber-950/30 border-amber-500/30 ml-8 text-slate-200 text-right'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px] font-bold font-mono">
                  <span className={msg.sender === 'OMNI' ? 'text-sky-400' : 'text-amber-400'}>
                    {msg.sender === 'OMNI' ? '🤖 Omni (Buyer Agent)' : `🏪 TitanBot (${storeName})`}
                  </span>
                  {msg.price && (
                    <span className="text-white px-2 py-0.5 rounded bg-slate-800">
                      Offer: ₹{msg.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="p-3.5 bg-[#0F172A] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            {isHandshaking ? (
              <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => onProceedToCart(productName, agreedPrice || effectivePrice, storeName)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Proceed with Deal (₹{agreedPrice?.toLocaleString('en-IN')}) & Add to Cart</span>
                </button>

                <button
                  onClick={onExploreOtherStores}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
                >
                  <span>Check Other Deals</span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                </button>

                <button
                  onClick={onClose}
                  className="py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-semibold text-xs transition active:scale-95"
                  title="Close and return to deals list"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between gap-2">
                <form onSubmit={handleCustomSubmit} className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Type counter offer (e.g. ₹650)..."
                    value={customOfferInput}
                    onChange={(e) => setCustomOfferInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isLoadingDeal}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow transition active:scale-95 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>Counter</span>
                  </button>
                </form>

                <button
                  onClick={onExploreOtherStores}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Other Stores
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
