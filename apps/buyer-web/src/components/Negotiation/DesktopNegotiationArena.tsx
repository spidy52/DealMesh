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
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
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
  onClose: () => void;
  onProceedToCart: (productName: string, agreedPrice: number, store: string) => void;
  onExploreOtherStores: () => void;
}

export const DesktopNegotiationArena: React.FC<DesktopNegotiationArenaProps> = ({
  isOpen,
  productName = 'Titan Neo Workwear Classic Formal Watch',
  listedPrice = 2799,
  storeName = 'Titan Store',
  stores = [],
  onClose,
  onProceedToCart,
  onExploreOtherStores,
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

  const effectivePrice = listedPrice || 199;

  // Real backend live negotiation runner
  const runRealNegotiation = async (customOffer?: number) => {
    try {
      setIsLoadingDeal(true);
      const resp = await fetch('http://localhost:8000/api/negotiations/live-arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_name: productName,
          listed_price: effectivePrice,
          store_name: storeName,
          stores: stores && stores.length > 0 ? stores : undefined,
          custom_buyer_offer: customOffer,
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
        setAgreedPrice(finalPrice);
        setIsHandshaking(true);

        // Confetti burst
        confetti({
          particleCount: 80,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#38BDF8', '#F59E0B', '#10B981'],
        });

        // USER CHOICE: Do NOT auto-redirect to checkout. Let user review and decide!
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
      setIsOmniTalking(true);
      setIsMerchantTalking(false);
      setTranscript([]);
      runRealNegotiation();
    } else {
      setRound(1);
      setAgreedPrice(null);
      setIsHandshaking(false);
      setIsOmniTalking(false);
      setIsMerchantTalking(false);
      setTranscript([]);
    }
  }, [isOpen, productName, listedPrice]);

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0B101E] border border-blue-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        >
          {/* Top Arena Header */}
          <div className="px-6 py-4 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between">
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
          <div className="bg-[#090D18] px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px]">
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

          {/* Both Chatbots Arena Floor */}
          <div className="px-6 py-6 bg-gradient-to-b from-[#0B101E] to-[#080B14] relative overflow-hidden flex flex-col items-center">
            {/* Arena Ring Graphics */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-96 h-96 rounded-full border border-blue-500/30 animate-pulse" />
              <div className="w-64 h-64 rounded-full border border-amber-500/20 absolute" />
            </div>

            {/* Avatars Facing Each Other */}
            <div className="w-full flex items-center justify-between relative z-10 px-6 sm:px-12 my-2">
              {/* Omni (Buyer Agent) on Left */}
              <motion.div
                animate={{
                  x: isHandshaking ? 80 : 0,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-400/40 p-2 flex items-center justify-center shadow-lg shadow-sky-500/10">
                  <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow">
                    <circle cx="50" cy="50" r="40" fill="#0284C7" opacity="0.2" />
                    <rect x="25" y="25" width="50" height="40" rx="12" fill="#0369A1" stroke="#38BDF8" strokeWidth="2.5" />
                    <circle cx="40" cy="42" r="5" fill="#38BDF8" />
                    <circle cx="60" cy="42" r="5" fill="#38BDF8" />
                    <path d="M 40 55 Q 50 62 60 55" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <rect x="35" y="68" width="30" height="24" rx="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="mt-2 text-center">
                  <span className="font-bold text-xs text-sky-400 block font-mono">OMNI</span>
                  <span className="text-[10px] text-slate-400">Your Buyer Agent</span>
                </div>
              </motion.div>

              {/* Handshake Center Badge */}
              <div className="flex flex-col items-center justify-center">
                {isHandshaking ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1.2, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center text-3xl">
                      🤝
                    </div>
                    <span className="mt-2 text-xs font-extrabold text-emerald-400 font-mono tracking-wider animate-bounce">
                      DEAL SEALED!
                    </span>
                  </motion.div>
                ) : (
                  <div className="text-center px-4 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-amber-400 font-bold block">DMCP Negotiation</span>
                    <span>Round {round} of 2</span>
                  </div>
                )}
              </div>

              {/* TitanBot (Merchant Agent) on Right */}
              <motion.div
                animate={{
                  x: isHandshaking ? -80 : 0,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="flex flex-col items-center"
              >
                <MerchantBotAvatar
                  scale={1.3}
                  isTalking={isMerchantTalking}
                  isHandshaking={isHandshaking}
                  storeName={storeName}
                />
                <div className="mt-2 text-center">
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
                className="mt-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center text-xs text-emerald-300 font-semibold"
              >
                Mutual agreement reached: TitanBot conceded from ₹{effectivePrice.toLocaleString('en-IN')} to{' '}
                <strong className="text-white font-mono text-sm">₹{agreedPrice?.toLocaleString('en-IN')}</strong> (saving ₹{dealSavings.toLocaleString('en-IN')}) while
                securing merchant margin ({profitMargin}% net margin) and locking priority dispatch.
              </motion.div>
            )}
          </div>

          {/* Transcript Feed */}
          <div className="px-6 py-4 bg-[#090D18] flex-1 overflow-y-auto space-y-3 max-h-48 border-t border-slate-800/80 text-xs">
            {transcript.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl border ${
                  msg.sender === 'OMNI'
                    ? 'bg-blue-950/30 border-blue-500/30 mr-8 text-slate-200'
                    : 'bg-amber-950/30 border-amber-500/30 ml-8 text-slate-200 text-right'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-[10px] font-bold font-mono">
                  <span className={msg.sender === 'OMNI' ? 'text-sky-400' : 'text-amber-400'}>
                    {msg.sender === 'OMNI' ? 'DealMesh AI (Buyer Agent)' : `TitanBot (${storeName})`}
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
          <div className="p-4 bg-[#0F172A] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {isHandshaking ? (
              <div className="w-full flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => onProceedToCart(productName, agreedPrice || effectivePrice, storeName)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition active:scale-95"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Proceed with Deal (₹{agreedPrice?.toLocaleString('en-IN')})</span>
                </button>

                <button
                  onClick={onExploreOtherStores}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Back to Deals List</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={onClose}
                  className="py-3 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 font-semibold text-xs transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <form onSubmit={handleCustomSubmit} className="flex-1 flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Type counter offer (e.g. ₹650)..."
                    value={customOfferInput}
                    onChange={(e) => setCustomOfferInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isLoadingDeal}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Send Counter</span>
                  </button>
                </form>

                <button
                  onClick={onExploreOtherStores}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Walk Away / Search Other Stores
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
