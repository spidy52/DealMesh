import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Trophy, Sparkles, Star, Truck, RotateCcw, Bot, ArrowRight, Check, Eye, Lock, Zap, DollarSign, Award, CheckCircle2, TrendingDown } from 'lucide-react';
import { RankedProductData } from '../../services/api';
import { getProductImage } from '../../utils/productImages';

interface HologramProjectionProps {
  products: RankedProductData[];
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  onSelectProduct: (product: RankedProductData) => void;
  onStartNegotiation: (product: RankedProductData) => void;
}

export const HologramProjection: React.FC<HologramProjectionProps> = ({
  products,
  selectedStrategy,
  onStrategyChange,
  onSelectProduct,
  onStartNegotiation,
}) => {
  if (!products || products.length === 0) return null;

  const strategies = [
    { id: 'BEST_VALUE', label: 'Best Value', icon: Trophy },
    { id: 'CHEAPEST_TRUSTED', label: 'Trusted 80+', icon: ShieldCheck },
    { id: 'CHEAPEST', label: 'Lowest Price', icon: TrendingDown },
    { id: 'MOST_TRUSTED', label: 'Highest Rated', icon: Star },
    { id: 'FASTEST', label: 'Fastest Delivery', icon: Zap },
    { id: 'BEST_RETURNS', label: '30-Day Returns', icon: RotateCcw },
  ];

  const topProduct = products[0];

  return (
    <div className="space-y-6 relative font-sans">
      {/* Strategy Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#181818]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-lemon-400 flex items-center gap-1.5">
              <span>Multi-Merchant Comparison Matrix</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0E1508] text-lemon-400 border border-lemon-500/30">
              Verified Web Stores
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 tracking-tight">
            Live Market Price & Trust Evaluation
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {strategies.map((strat) => {
            const Icon = strat.icon;
            const isSelected = selectedStrategy === strat.id;
            return (
              <button
                key={strat.id}
                onClick={() => onStrategyChange(strat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-lemon-500 text-black font-extrabold shadow-md shadow-lemon-500/20'
                    : 'bg-[#111111] text-slate-300 hover:text-white border border-[#222222]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-lemon-400'}`} />
                <span>{strat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Winner Rationale Box */}
      {topProduct && topProduct.win_explanation && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 border border-lemon-500/30 bg-[#0E1508] relative overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#14200B] border border-lemon-500/40 text-lemon-400 flex items-center justify-center shrink-0 mt-0.5">
              <Trophy className="w-5 h-5 text-lemon-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-lemon-400 uppercase tracking-widest">
                  Autonomous Recommendation
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lemon-500/20 text-lemon-300 font-bold border border-lemon-500/40 flex items-center gap-1">
                  <Award className="w-3 h-3 text-lemon-400" />
                  <span>OPTIMAL MATCH</span>
                </span>
              </div>
              <p className="text-sm text-slate-200 mt-1 font-medium leading-relaxed">
                {topProduct.win_explanation}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((item, idx) => {
          const isWinner = idx === 0;
          return (
            <motion.div
              key={item.product_id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className={`rounded-3xl p-5 relative flex flex-col justify-between transition-all group overflow-hidden bg-[#0A0A0A] border ${
                isWinner ? 'border-lemon-500/50 shadow-[0_0_30px_rgba(204,255,0,0.1)]' : 'border-[#1E1E1E] hover:border-[#333333]'
              }`}
            >
              {/* Top Winner Ribbon */}
              {isWinner && (
                <div className="absolute top-0 right-0 px-3.5 py-1 rounded-bl-2xl bg-lemon-500 text-black text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Best Choice</span>
                </div>
              )}

              <div>
                {/* Store Scrape Header */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-slate-300 truncate pr-2">{item.merchant_name}</span>
                  {item.is_ai_native ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-lemon-500/20 text-lemon-300 border border-lemon-500/40 font-mono font-bold shrink-0">
                      <Bot className="w-3 h-3" /> AI DMCP
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono font-medium shrink-0">Verified Web</span>
                  )}
                </div>

                {/* Product Visual */}
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#050505] border border-[#1A1A1A] mb-4 relative">
                  <img
                    src={getProductImage(item.product_name, '', item.image_url)}
                    alt={item.product_name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.negotiated_savings > 0 && item.original_price && item.original_price > item.current_price && (
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-lemon-500 text-black font-mono text-xs font-extrabold shadow-lg flex items-center gap-1">
                      <span>Saved ₹{item.negotiated_savings.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>In Stock</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mb-1 line-clamp-1 tracking-tight">{item.product_name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                  <Star className="w-3.5 h-3.5 fill-lemon-400 text-lemon-400" />
                  <span className="font-bold text-slate-200">{item.rating || 4.5}</span>
                  <span>{item.review_count && item.review_count > 0 ? `(${item.review_count.toLocaleString('en-IN')} reviews)` : 'Direct Merchant Verified'}</span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline justify-between mb-4 p-3.5 rounded-2xl bg-[#111111] border border-[#1E1E1E]">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono block">Verified Price</span>
                    <span className="text-2xl font-black text-white font-mono">
                      ₹{item.current_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {item.original_price > item.current_price && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Listed</span>
                      <span className="text-xs text-slate-500 line-through font-mono">
                        ₹{item.original_price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Trust Score Meter */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-lemon-400" />
                      <span>Trust & Authenticity:</span>
                    </span>
                    <span
                      className={`font-mono font-bold px-2.5 py-0.5 rounded-lg text-xs ${
                        item.trust_score >= 90
                          ? 'bg-lemon-500/15 text-lemon-300 border border-lemon-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.trust_score} / 100
                    </span>
                  </div>

                  {/* Reasons pills */}
                  <div className="space-y-1">
                    {item.trust_reasons.slice(0, 2).map((reason, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <Check className="w-3 h-3 text-lemon-400 shrink-0" />
                        <span className="truncate">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#181818] flex gap-2">
                {item.is_ai_native ? (
                  <button
                    onClick={() => onStartNegotiation(item)}
                    className="w-full py-3 px-4 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-extrabold text-xs shadow-lg shadow-lemon-500/20 flex items-center justify-center gap-2 transition"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Negotiate with AI Agent</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (item.url) {
                        window.open(item.url, '_blank');
                      }
                      onSelectProduct(item);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-white font-bold text-xs border border-[#262626] flex items-center justify-center gap-2 transition"
                  >
                    <span>View Deal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
