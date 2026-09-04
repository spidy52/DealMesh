import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, ShieldCheck, Zap, X, ArrowRight, Check, Star, Layers, ExternalLink } from 'lucide-react';
import { RankedProductData } from '../../services/api';

interface EyeBeamGhostHologramProps {
  isOpen: boolean;
  onClose: () => void;
  products: RankedProductData[];
  onStartNegotiation: (product: RankedProductData) => void;
  onProceedToBuy: (product: RankedProductData) => void;
}

export const EyeBeamGhostHologram: React.FC<EyeBeamGhostHologramProps> = ({
  isOpen,
  onClose,
  products,
  onStartNegotiation,
  onProceedToBuy,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!isOpen || !products || products.length === 0) return null;

  const activeItem = products[selectedIdx] || products[0];

  return (
    <div className="relative flex flex-col items-center select-none pointer-events-auto">
      {/* 1. EYE-BEAM PROJECTION RAYS SHOOTING FROM PET'S VISOR */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        exit={{ opacity: 0, scaleY: 0 }}
        transition={{ duration: 0.3 }}
        className="w-80 sm:w-96 h-28 pointer-events-none origin-bottom relative -mb-2 overflow-hidden flex items-center justify-center"
      >
        {/* Volumetric Eye Beam Light Cone */}
        <div
          className="w-full h-full opacity-85"
          style={{
            background: 'linear-gradient(0deg, rgba(56,189,248,0.95) 0%, rgba(56,189,248,0.45) 45%, rgba(129,140,248,0.15) 85%, transparent 100%)',
            clipPath: 'polygon(44% 100%, 56% 100%, 100% 0%, 0% 0%)',
            filter: 'drop-shadow(0 0 25px rgba(56,189,248,0.7))',
          }}
        />
        {/* Rapid holographic scanline pulses */}
        <motion.div
          animate={{ y: [-15, 30] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="absolute w-full h-1 bg-cyan-300 opacity-75"
        />
      </motion.div>

      {/* 2. FLOATING GHOST WINDOW WITH FROSTED LIQUID GLASSMORPHISM */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        className="w-[92vw] max-w-2xl bg-[#080D1D]/90 backdrop-blur-3xl rounded-3xl p-5 sm:p-6 border border-cyan-400/60 shadow-[0_0_50px_rgba(56,189,248,0.25)] relative overflow-hidden"
      >
        {/* Ambient Top Cyber Glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Ghost Window Titlebar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#38BDF8] animate-pulse" />
            <span className="text-xs font-black text-cyan-300 font-mono tracking-wider uppercase">
              Omni Hologram • Eye Projector
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/40">
              {products.length} Stores Scraped
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
            title="Dismiss Hologram"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Projected Item Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mb-4">
          {/* Item Holographic Visual */}
          <div className="sm:col-span-5 aspect-[16/11] rounded-2xl overflow-hidden bg-[#050812] border border-cyan-500/40 relative flex items-center justify-center p-2 shadow-inner">
            <img
              src={activeItem.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&q=80'}
              alt={activeItem.product_name}
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]"
            />
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, rgba(56,189,248,0.3) 0px, rgba(56,189,248,0.3) 1px, transparent 1px, transparent 5px)',
              }}
            />
            {activeItem.negotiated_savings > 0 && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono text-[11px] font-black shadow-md">
                Saved ₹{activeItem.negotiated_savings.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Item Telemetry & Live Pricing */}
          <div className="sm:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-cyan-400 font-mono">{activeItem.merchant_name}</span>
              <span className="text-emerald-300 font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px]">
                {activeItem.trust_score}/100 Trust Score
              </span>
            </div>

            <h4 className="text-base font-bold text-white tracking-tight line-clamp-1">
              {activeItem.product_name}
            </h4>

            <div className="flex items-baseline gap-3 p-2.5 rounded-xl bg-[#050914] border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Agreed Price</span>
                <span className="text-xl font-black text-cyan-300 font-mono">
                  ₹{activeItem.current_price.toLocaleString('en-IN')}
                </span>
              </div>
              {activeItem.original_price > activeItem.current_price && (
                <div className="text-xs text-slate-500 line-through font-mono">
                  ₹{activeItem.original_price.toLocaleString('en-IN')}
                </div>
              )}
            </div>

            {/* Quick Action */}
            <div className="pt-1 flex gap-2">
              {activeItem.is_ai_native ? (
                <button
                  onClick={() => onStartNegotiation(activeItem)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Negotiate Deal</span>
                </button>
              ) : (
                <button
                  onClick={() => onProceedToBuy(activeItem)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Store Comparison Pills in Hologram */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" /> Compare Other Scraped Stores
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {products.slice(0, 5).map((item, idx) => {
              const isSelected = idx === selectedIdx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-3 py-2 rounded-xl text-left text-xs shrink-0 transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/80 border border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                      : 'bg-[#060A16] hover:bg-slate-800/60 border border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-300 text-[11px] truncate max-w-[120px] block">
                    {item.merchant_name}
                  </span>
                  <span className="font-mono text-cyan-300 font-extrabold text-xs mt-0.5">
                    ₹{item.current_price.toLocaleString('en-IN')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
