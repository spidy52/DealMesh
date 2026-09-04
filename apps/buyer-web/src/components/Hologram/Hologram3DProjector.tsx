import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, ShieldCheck, Zap, RotateCw, Eye, ArrowRight, Check, Star, ExternalLink, Layers, Move } from 'lucide-react';
import { RankedProductData } from '../../services/api';

interface Hologram3DProjectorProps {
  products: RankedProductData[];
  petState: string;
  petName: string;
  onSelectProduct: (product: RankedProductData) => void;
  onStartNegotiation: (product: RankedProductData) => void;
  onProceedToBuy: (product: RankedProductData) => void;
}

export const Hologram3DProjector: React.FC<Hologram3DProjectorProps> = ({
  products,
  petState,
  petName,
  onSelectProduct,
  onStartNegotiation,
  onProceedToBuy,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isWireframeMode, setIsWireframeMode] = useState(true);

  const activeItem = products[selectedIndex] || products[0];

  // Continuous gentle 3D rotation of the holographic model
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 1) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  if (!activeItem) return null;

  return (
    <div className="relative w-full max-w-5xl mx-auto my-8 select-none">
      {/* Volumetric Hologram Stage Container */}
      <div className="relative min-h-[520px] rounded-3xl bg-gradient-to-b from-[#080D1A]/90 via-[#060912]/95 to-[#04060A] border border-cyan-500/40 p-6 md:p-8 shadow-[0_0_60px_rgba(56,189,248,0.15)] overflow-hidden flex flex-col justify-between">
        {/* Background Grid Floor with Perspective (Matching Reference Image) */}
        <div 
          className="absolute inset-x-0 bottom-0 h-48 opacity-35 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(56,189,248,0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(56,189,248,0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transform: 'perspective(400px) rotateX(65deg) scale(1.6)',
            transformOrigin: 'bottom center'
          }}
        />

        {/* Ambient Dark Nebula Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Telemetry Bar */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#38BDF8] animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-cyan-400 uppercase font-mono">
                  VOLUMETRIC HOLOGRAM PROJECTION SYSTEM
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  {products.length} Stores Scraped
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time 3D item telemetry • DMCP multi-agent pricing active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsWireframeMode(!isWireframeMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                isWireframeMode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isWireframeMode ? 'Wireframe Hologram' : 'Photorealistic'}</span>
            </button>
          </div>
        </div>

        {/* CENTER STAGE: 3D Hologram Beam & Hovering Model */}
        <div className="relative z-10 my-4 flex-1 flex flex-col items-center justify-center min-h-[300px]">
          {/* Glowing Volumetric Light Cone Ray Emitter (Direct Reference Aesthetic) */}
          <div className="absolute bottom-6 w-72 sm:w-96 h-64 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Volumetric Fan Ray Light Cone */}
            <div 
              className="w-full h-full opacity-70"
              style={{
                background: 'linear-gradient(0deg, rgba(56,189,248,0.85) 0%, rgba(56,189,248,0.4) 30%, rgba(129,140,248,0.15) 70%, transparent 100%)',
                clipPath: 'polygon(42% 100%, 58% 100%, 100% 0%, 0% 0%)',
                filter: 'drop-shadow(0 0 25px rgba(56,189,248,0.6))',
              }}
            />

            {/* Radiant Scanline Rays */}
            <div 
              className="absolute inset-0 opacity-50 animate-pulse"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(56,189,248,0.3) 0px, rgba(56,189,248,0.3) 2px, transparent 2px, transparent 12px)',
                clipPath: 'polygon(42% 100%, 58% 100%, 100% 0%, 0% 0%)',
              }}
            />
          </div>

          {/* Projector Emitter Base Disk */}
          <div className="absolute bottom-4 w-28 h-6 rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-indigo-600 p-0.5 shadow-[0_0_30px_#38BDF8] z-0">
            <div className="w-full h-full bg-[#070D1C] rounded-full flex items-center justify-center">
              <div className="w-16 h-2 rounded-full bg-cyan-400 blur-[2px] animate-pulse" />
            </div>
          </div>

          {/* HOVERING 3D HOLOGRAPHIC WATCH OBJECT IN MID-AIR */}
          <motion.div
            className="relative z-20 flex flex-col items-center cursor-grab active:cursor-grabbing"
            animate={{
              y: [-10, 10, -10],
              rotateY: rotationAngle,
            }}
            transition={{
              y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
            }}
            style={{ perspective: 1000 }}
          >
            {/* Hologram Luminous Glow Aura */}
            <div className="absolute -inset-8 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* 3D Holographic Model Container */}
            <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex items-center justify-center">
              {/* Product Visual / Wireframe Shader */}
              <div className="w-full h-full rounded-3xl overflow-hidden relative flex items-center justify-center p-3">
                <img
                  src={activeItem.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80'}
                  alt={activeItem.product_name}
                  className={`w-full h-full object-contain filter transition-all duration-300 ${
                    isWireframeMode
                      ? 'contrast-200 brightness-125 saturate-200 drop-shadow-[0_0_20px_#38BDF8] hue-rotate-[165deg]'
                      : 'drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]'
                  }`}
                  style={{
                    maskImage: isWireframeMode
                      ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 100%)'
                      : undefined,
                  }}
                />

                {/* Holographic Cyber Scanlines Overlay */}
                {isWireframeMode && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, rgba(56,189,248,0.4) 0px, rgba(56,189,248,0.4) 1px, transparent 1px, transparent 6px)',
                    }}
                  />
                )}

                {/* Rotating Holographic Bounding Box Ring */}
                <div
                  className="absolute inset-0 border border-cyan-400/50 rounded-2xl pointer-events-none animate-spin"
                  style={{ animationDuration: '24s' }}
                />
              </div>

              {/* Floating Live Scraped Price Callout Pin */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-3 -right-6 px-3 py-1.5 rounded-xl bg-[#090F1E]/95 border border-cyan-400 text-cyan-300 text-xs font-mono font-black shadow-[0_0_20px_rgba(56,189,248,0.4)] backdrop-blur-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>₹{activeItem.current_price.toLocaleString('en-IN')}</span>
              </motion.div>

              {/* Verified Trust Badge Pin */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 -left-6 px-3 py-1.5 rounded-xl bg-[#090F1E]/95 border border-emerald-400 text-emerald-300 text-xs font-mono font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] backdrop-blur-md flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeItem.trust_score}/100 Trust</span>
              </motion.div>
            </div>

            {/* Hologram Product Title & Brand */}
            <div className="text-center mt-3 relative z-30">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                {activeItem.product_name}
              </h3>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">
                {activeItem.merchant_name} • {activeItem.brand} • {activeItem.rating}★ ({activeItem.review_count.toLocaleString('en-IN')} reviews)
              </p>
            </div>
          </motion.div>
        </div>

        {/* BOTTOM MULTI-STORE COMPARISON NODES CAROUSEL */}
        <div className="relative z-20 pt-4 border-t border-cyan-500/20">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Multi-Merchant Holographic Nodes (Click to Inspect)
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Use arrow keys or click cards
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
                      ? 'bg-cyan-950/60 border border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.3)] scale-105 z-10'
                      : 'bg-[#090E1C]/80 hover:bg-[#0E1529] border border-slate-800/80 text-slate-300'
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
                      {item.trust_score}★
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

          {/* Action Row for Active Hologram Item */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="text-cyan-400 font-mono font-bold">Deal Status:</span>
              <span>{activeItem.is_ai_native ? 'Negotiable via DMCP Protocol' : 'Verified Fixed Price'}</span>
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
