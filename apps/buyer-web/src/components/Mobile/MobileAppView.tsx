import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, Sparkles, Bot, ShieldCheck, Trophy, Layers, SlidersHorizontal, ArrowRight, User, Compass, History, ShoppingBag, BatteryCharging, Zap, ExternalLink } from 'lucide-react';
import { PixelPet, PetEmotion } from '../Pet/PixelPet';
import { RankedProductData, NegotiationResult, SearchResponse, TransactionPassportData } from '../../services/api';

interface MobileAppViewProps {
  products: RankedProductData[];
  selectedProduct: RankedProductData | null;
  activeNegotiation: NegotiationResult | null;
  searchQuery: string;
  isSearching: boolean;
  isVoiceListening: boolean;
  isLight: boolean;
  onSearch: (q: string) => void;
  onVoiceTrigger: () => void;
  onSelectProduct: (p: RankedProductData) => void;
  onStartNegotiation: (p: RankedProductData) => void;
  onProceedToBuy: (p: RankedProductData) => void;
  onOpenPolicy: () => void;
  onOpenAuth: () => void;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  products,
  selectedProduct,
  activeNegotiation,
  searchQuery,
  isSearching,
  isVoiceListening,
  isLight,
  onSearch,
  onVoiceTrigger,
  onSelectProduct,
  onStartNegotiation,
  onProceedToBuy,
  onOpenPolicy,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'omni' | 'deals' | 'passport'>('discover');
  const [inputQuery, setInputQuery] = useState(searchQuery);

  const topProduct = products[0];

  return (
    <div className="w-full max-w-[390px] mx-auto min-h-[780px] max-h-[850px] rounded-[48px] border-[10px] border-slate-900 bg-[#070A11] text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between relative selection:bg-cyan-500">
      {/* Smartphone Dynamic Island / Speaker Notch */}
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[8px] font-mono text-slate-400">Omni AI</span>
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
      </div>

      {/* Top Mobile Status Header */}
      <div className="pt-8 px-4 pb-2 flex items-center justify-between border-b border-slate-800/80 bg-[#070A11]/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 flex items-center justify-center">
            <img src="/omni-pet.png" alt="Omni" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-mono font-black text-xs text-white">DEALMESH</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenPolicy}
            className="p-1.5 rounded-xl bg-slate-800 text-cyan-400 hover:bg-slate-700 transition"
            title="Policy Caps"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenAuth}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title="User Profile"
          >
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-4 no-scrollbar">
        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <>
            {/* Search & Voice Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(inputQuery);
              }}
              className="relative flex items-center"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask Omni or speak query..."
                className="w-full pl-9 pr-14 py-2.5 bg-[#0D1222] border border-slate-700/80 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                type="button"
                onClick={onVoiceTrigger}
                className={`absolute right-1.5 p-1.5 rounded-xl transition ${
                  isVoiceListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-cyan-400'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Top Recommended Holographic Card */}
            {topProduct && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="liquid-glass rounded-3xl p-3.5 border border-cyan-500/40 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                  <span className="font-extrabold text-cyan-400 font-mono uppercase">{topProduct.merchant_name}</span>
                  <span className="text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/20">
                    {topProduct.trust_score}/100 Trust
                  </span>
                </div>

                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#050812] mb-2.5 border border-slate-800 relative">
                  <img
                    src={topProduct.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&q=80'}
                    alt={topProduct.product_name}
                    className="w-full h-full object-cover"
                  />
                  {topProduct.negotiated_savings > 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] font-mono">
                      Saved ₹{topProduct.negotiated_savings}
                    </div>
                  )}
                </div>

                <h4 className="font-bold text-xs text-white line-clamp-1 mb-1.5">{topProduct.product_name}</h4>

                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs line-through text-slate-500 font-mono">₹{topProduct.original_price}</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">₹{topProduct.current_price}</span>
                </div>

                <div className="pt-2.5 flex gap-2">
                  <button
                    onClick={() => onStartNegotiation(topProduct)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-extrabold text-[11px] shadow-md flex items-center justify-center gap-1"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Negotiate AI Deal</span>
                  </button>
                  <button
                    onClick={() => onProceedToBuy(topProduct)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-[11px] shadow-md"
                  >
                    Buy
                  </button>
                </div>
              </motion.div>
            )}

            {/* Multi-Store Comparison Carousel */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                Scraped Stores ({products.length})
              </span>
              <div className="space-y-2">
                {products.slice(1, 4).map((p, idx) => (
                  <div
                    key={p.product_id || idx}
                    onClick={() => onSelectProduct(p)}
                    className="p-2.5 rounded-2xl bg-[#0B1020] border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between text-xs cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=100&q=80'}
                        alt={p.product_name}
                        className="w-10 h-10 object-cover rounded-lg shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 block truncate">{p.product_name}</span>
                        <span className="text-[10px] text-slate-400">{p.merchant_name}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="font-mono font-black text-cyan-300 block">₹{p.current_price}</span>
                      <span className="text-[9px] text-emerald-400">{p.trust_score}★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* OMNI AI PET TAB */}
        {activeTab === 'omni' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
            <div className="p-4 rounded-full bg-gradient-to-b from-cyan-500/20 to-transparent border border-cyan-500/30">
              <PixelPet emotion="HAPPY" state="LISTENING" speechText="Hey! I'm Omni" size="lg" />
            </div>

            <h3 className="text-base font-black text-white">Omni Mobile Companion</h3>
            <p className="text-xs text-slate-400 max-w-[240px]">
              Tap the mic or say "Hey Omni" to start an autonomous negotiation.
            </p>

            <button
              onClick={onVoiceTrigger}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                isVoiceListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>{isVoiceListening ? 'Listening...' : 'Say "Hey Omni"'}</span>
            </button>
          </div>
        )}

        {/* LIVE DEALS TAB */}
        {activeTab === 'deals' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono">Live DMCP Negotiation</h3>
            {activeNegotiation ? (
              <div className="p-3.5 rounded-2xl bg-[#0C1224] border border-cyan-500/40 text-xs space-y-2">
                <div className="flex justify-between font-bold text-white">
                  <span>TitanBot ↔ Omni</span>
                  <span className="text-emerald-400 font-mono">₹{activeNegotiation.final_price || 2299}</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                  <div>Initial Offer: ₹2,300</div>
                  <div>Counter: ₹2,600</div>
                  <div className="text-emerald-300 font-bold">Deal Locked: ₹2,299</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No active negotiation stream.</p>
            )}
          </div>
        )}

        {/* PASSPORT TAB */}
        {activeTab === 'passport' && (
          <div className="space-y-3 text-center py-4">
            <ShieldCheck className="w-8 h-8 text-cyan-400 mx-auto" />
            <h3 className="text-sm font-black text-white">Transaction Passport</h3>
            <p className="text-xs text-slate-400">Verifiable cryptographic proof sealed on checkout.</p>
          </div>
        )}
      </div>

      {/* Smartphone Bottom Floating Tab Dock */}
      <div className="px-3 pb-4 pt-2 bg-[#070A11]/95 border-t border-slate-800/80 backdrop-blur-md">
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#0A0F1D] rounded-2xl border border-slate-800 text-[10px] font-bold">
          {[
            { id: 'discover', label: 'Discover', icon: Compass },
            { id: 'omni', label: 'Omni Pet', icon: Bot },
            { id: 'deals', label: 'Live Bids', icon: Zap },
            { id: 'passport', label: 'Passport', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 rounded-xl transition flex flex-col items-center gap-0.5 ${
                  isSel ? 'bg-cyan-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
