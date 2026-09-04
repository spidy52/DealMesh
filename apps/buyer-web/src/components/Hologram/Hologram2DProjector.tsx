import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, ShieldCheck, Zap, Eye, ArrowRight, Check, Star, ExternalLink, Layers, Radio, Tag, Clock } from 'lucide-react';
import { RankedProductData } from '../../services/api';

interface Hologram2DProjectorProps {
  products: RankedProductData[];
  petState: string;
  petName: string;
  onSelectProduct: (product: RankedProductData) => void;
  onStartNegotiation: (product: RankedProductData) => void;
  onProceedToBuy: (product: RankedProductData) => void;
}

export const Hologram2DProjector: React.FC<Hologram2DProjectorProps> = ({
  products,
  petState,
  petName,
  onSelectProduct,
  onStartNegotiation,
  onProceedToBuy,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeItem = products[selectedIndex] || products[0];

  if (!activeItem) return null;

  return (
    <div className="relative w-full max-w-5xl mx-auto my-6 select-none">
      {/* 2D Volumetric Hologram Stage Container (Aesthetic match to user reference image) */}
      <div className="relative min-h-[500px] rounded-3xl bg-[#060A14] border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_50px_rgba(56,189,248,0.18)] overflow-hidden flex flex-col justify-between">
        {/* Background Dark Textured Floor & Perspective Grid */}
        <div
          className="absolute inset-x-0 bottom-0 h-44 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56,189,248,0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56,189,248,0.25) 1px, transparent 1px)
            `,
            backgroundSize: '36px 36px',
            transform: 'perspective(300px) rotateX(60deg)',
            transformOrigin: 'bottom center',
          }}
        />

        {/* Ambient Dark Cyan Nebula Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Telemetry Header */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#38BDF8] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono">
                  HOLOGRAM MULTI-STORE COMPARISON
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  {products.length} Stores Scraped
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Live DMCP agent dialogue and scraped prices projected in real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Stream Active</span>
          </div>
        </div>

        {/* CENTER STAGE: 2D Volumetric Hologram Light Ray Cone & Floating Item */}
        <div className="relative z-10 my-4 flex-1 flex flex-col items-center justify-center min-h-[290px]">
          {/* Volumetric Glowing Light Fountain (Exact Reference Match) */}
          <div className="absolute bottom-6 w-80 sm:w-[420px] h-60 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Cyan Light Cone Fountain Beam */}
            <div
              className="w-full h-full opacity-80"
              style={{
                background: 'linear-gradient(0deg, rgba(56,189,248,0.95) 0%, rgba(56,189,248,0.45) 35%, rgba(129,140,248,0.15) 75%, transparent 100%)',
                clipPath: 'polygon(40% 100%, 60% 100%, 100% 0%, 0% 0%)',
                filter: 'drop-shadow(0 0 30px rgba(56,189,248,0.7))',
              }}
            />
            {/* Luminous ray lines */}
            <div
              className="absolute inset-0 opacity-40 animate-pulse"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(56,189,248,0.4) 0px, rgba(56,189,248,0.4) 2px, transparent 2px, transparent 10px)',
                clipPath: 'polygon(40% 100%, 60% 100%, 100% 0%, 0% 0%)',
              }}
            />
          </div>

          {/* Projector Base Disk on Ground */}
          <div className="absolute bottom-4 w-32 h-6 rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-indigo-600 p-0.5 shadow-[0_0_35px_#38BDF8] z-0">
            <div className="w-full h-full bg-[#050914] rounded-full flex items-center justify-center">
              <div className="w-20 h-2 rounded-full bg-cyan-400 blur-[2px] animate-pulse" />
            </div>
          </div>

          {/* FLOATING 2D HOLOGRAPHIC ITEM HOVERING IN THE LIGHT CONE */}
          <motion.div
            className="relative z-20 flex flex-col items-center"
            animate={{
              y: [-8, 8, -8],
            }}
            transition={{
              repeat: Infinity,
              duration: 3.5,
              ease: 'easeInOut',
            }}
          >
            {/* Hologram Glow Aura */}
            <div className="absolute -inset-6 bg-cyan-400/25 rounded-full blur-2xl pointer-events-none" />

            {/* 2D Hologram Visual Card */}
            <div className="relative w-48 h-44 sm:w-56 sm:h-48 flex items-center justify-center">
              <div className="w-full h-full rounded-2xl overflow-hidden relative flex items-center justify-center p-2 bg-[#090F1E]/80 border border-cyan-400/60 shadow-[0_0_30px_rgba(56,189,248,0.4)] backdrop-blur-md">
                <img
                  src={activeItem.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&q=80'}
                  alt={activeItem.product_name}
                  className="w-full h-full object-contain filter drop-shadow-[0_0_16px_rgba(56,189,248,0.8)]"
                />

                {/* Holographic 2D Scanline Shader */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-50 mix-blend-screen"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, rgba(56,189,248,0.35) 0px, rgba(56,189,248,0.35) 1px, transparent 1px, transparent 5px)',
                  }}
                />

                {/* Holographic Glowing Border Corners */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
              </div>

              {/* Floating Scraped Price Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 -right-4 px-3 py-1 rounded-xl bg-[#090F1E] border border-cyan-400 text-cyan-300 text-xs font-mono font-black shadow-[0_0_15px_rgba(56,189,248,0.5)] flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>₹{activeItem.current_price.toLocaleString('en-IN')}</span>
              </motion.div>

              {/* Trust Score Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -left-4 px-3 py-1 rounded-xl bg-[#090F1E] border border-emerald-400 text-emerald-300 text-xs font-mono font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeItem.trust_score}/100 Trust</span>
              </motion.div>
            </div>

            {/* Hologram Product Title & Store */}
            <div className="text-center mt-3 relative z-30">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                {activeItem.product_name}
              </h3>
              <p className="text-xs text-cyan-300 font-mono mt-0.5 flex items-center justify-center gap-1">
                <span>{activeItem.merchant_name}</span>
                <span>•</span>
                <span>{activeItem.brand}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{activeItem.rating}</span>
                </span>
                <span>({activeItem.review_count.toLocaleString('en-IN')} reviews)</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM MULTI-STORE COMPARISON NODES CAROUSEL */}
        <div className="relative z-20 pt-4 border-t border-cyan-500/20">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Compare Across Stores (Click to Project in Hologram)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Live prices scraped from 12 merchants
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {products.slice(0, 6).map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.product_id || idx}
                  onClick={() => {
                    setSelectedIndex(idx);
                    onSelectProduct(item);
                  }}
                  className={`p-2.5 rounded-2xl text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-950/70 border border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.35)] scale-105 z-10'
                      : 'bg-[#090E1C]/80 hover:bg-[#0E1529] border border-slate-800 text-slate-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38BDF8]" />
                  )}

                  <div className="text-[10px] font-bold text-slate-400 truncate mb-1">
                    {item.merchant_name}
                  </div>

                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-mono text-xs font-extrabold text-white">
                      ₹{item.current_price.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        item.trust_score >= 90
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {item.trust_score}
                    </span>
                  </div>

                  {item.negotiated_savings > 0 && (
                    <div className="text-[9px] text-emerald-400 font-mono font-bold mt-1">
                      Saved ₹{item.negotiated_savings}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row for Active Item */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="text-cyan-400 font-mono font-bold">Deal Authority:</span>
              <span>{activeItem.is_ai_native ? 'Autonomous DMCP AI Bidding' : 'Fixed Retail Checkout'}</span>
            </div>

            <div className="flex items-center gap-2">
              {activeItem.is_ai_native ? (
                <button
                  onClick={() => onStartNegotiation(activeItem)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Negotiate at ₹{activeItem.current_price.toLocaleString('en-IN')}</span>
                </button>
              ) : (
                <button
                  onClick={() => onProceedToBuy(activeItem)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition"
                >
                  <span>Buy Now at ₹{activeItem.current_price.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
