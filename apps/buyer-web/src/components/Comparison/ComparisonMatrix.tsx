import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  CheckCircle2,
  Bot,
  ExternalLink,
  ShieldCheck,
  Star,
  Check,
  ArrowRight,
  TrendingDown,
  Clock,
  RotateCcw,
  Zap,
  Sparkles
} from 'lucide-react';
import { RankedProductData } from '../../services/api';
import { getProductImage } from '../../utils/productImages';

interface ComparisonMatrixProps {
  products: RankedProductData[];
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  onSelectProduct: (product: RankedProductData) => void;
  onStartNegotiation: (product: RankedProductData) => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  products,
  selectedStrategy,
  onStrategyChange,
  onSelectProduct,
  onStartNegotiation,
}) => {
  if (!products || products.length === 0) return null;

  const strategies = [
    { id: 'BEST_VALUE', label: 'Best Value', icon: Trophy },
    { id: 'CHEAPEST_TRUSTED', label: 'Verified Low Price', icon: ShieldCheck },
    { id: 'CHEAPEST', label: 'Lowest Price', icon: TrendingDown },
    { id: 'MOST_TRUSTED', label: 'Highest Trust', icon: Star },
    { id: 'FASTEST', label: 'Fastest Delivery', icon: Clock },
    { id: 'BEST_RETURNS', label: 'Best Return Policy', icon: RotateCcw },
  ];

  const topProduct = products[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Strategy Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#181818]">
        <div>
          <h3 className="text-lg font-black text-white">Market Comparison & Trust Ranking</h3>
          <p className="text-xs text-slate-400 font-mono">
            Autonomous multi-store evaluation across verified merchant platforms.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {strategies.map((strat) => {
            const Icon = strat.icon;
            const isSelected = selectedStrategy === strat.id;
            return (
              <button
                key={strat.id}
                onClick={() => onStrategyChange(strat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition font-mono ${
                  isSelected
                    ? 'bg-lemon-500 text-black font-extrabold shadow-md shadow-lemon-500/20'
                    : 'bg-[#111111] text-slate-300 hover:bg-[#1A1A1A] hover:text-white border border-[#222222]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-lemon-400'}`} />
                <span>{strat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Recommendation Highlight Box */}
      {topProduct && topProduct.win_explanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl bg-[#0E1508] border border-lemon-500/30 shadow-xl flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[#14200B] border border-lemon-500/40 text-lemon-400 flex items-center justify-center shrink-0 mt-0.5">
            <Trophy className="w-5 h-5 text-lemon-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-lemon-400 uppercase tracking-wider">
                Top Recommendation
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-lemon-500/20 text-lemon-300 border border-lemon-500/40 font-bold font-mono">
                RANK #1
              </span>
            </div>
            <p className="text-sm text-slate-200 mt-1 font-medium leading-relaxed">
              {topProduct.win_explanation}
            </p>
          </div>
        </motion.div>
      )}

      {/* Products Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((item, idx) => {
          const isWinner = idx === 0;
          return (
            <motion.div
              key={item.product_id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-3xl p-5 relative flex flex-col justify-between transition-all bg-[#0A0A0A] border ${
                isWinner ? 'border-lemon-500/50 shadow-2xl shadow-lemon-500/10' : 'border-[#1E1E1E] hover:border-[#333333]'
              }`}
            >
              {isWinner && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-lemon-500 text-black text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-md">
                  Rank #1 Choice
                </div>
              )}

              <div>
                {/* Store Header */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-slate-300 truncate">{item.merchant_name}</span>
                  {item.is_ai_native ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-lemon-500/15 text-lemon-300 border border-lemon-500/30 font-bold font-mono">
                      <Bot className="w-3 h-3" /> Negotiable
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Fixed DOM Price</span>
                  )}
                </div>

                {/* Image & Price */}
                <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#050505] border border-[#1A1A1A] mb-4 relative">
                  <img
                    src={getProductImage(item.product_name, '', item.image_url)}
                    alt={item.product_name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.negotiated_savings > 0 && item.original_price && item.original_price > item.current_price && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-lemon-500 text-black font-mono text-[10px] font-bold">
                      Saved ₹{item.negotiated_savings.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                <h4 className="text-base font-bold text-white mb-1 line-clamp-1">{item.product_name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                  <Star className="w-3.5 h-3.5 fill-lemon-400 text-lemon-400" />
                  <span className="font-semibold text-slate-200">{item.rating || 4.5}</span>
                  <span>{item.review_count && item.review_count > 0 ? `(${item.review_count.toLocaleString('en-IN')} reviews)` : 'Direct Merchant Verified'}</span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline justify-between mb-4 p-3 rounded-xl bg-[#111111] border border-[#1E1E1E]">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block font-mono">Price</span>
                    <span className="text-xl font-black text-white font-mono">
                      ₹{item.current_price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {item.original_price > item.current_price && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase block font-mono">Listed</span>
                      <span className="text-xs text-slate-500 line-through font-mono">
                        ₹{item.original_price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Trust Score & Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Trust Score:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        item.trust_score >= 90
                          ? 'bg-lemon-500/15 text-lemon-300 border border-lemon-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.trust_score}/100
                    </span>
                  </div>

                  {/* Trust reasons */}
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

              {/* Action Button */}
              <div className="pt-3 border-t border-[#181818] flex gap-2">
                {item.is_ai_native ? (
                  <button
                    onClick={() => onStartNegotiation(item)}
                    className="w-full py-2.5 px-3 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-extrabold text-xs shadow-md shadow-lemon-500/20 flex items-center justify-center gap-1.5 transition"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Negotiate with AI</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (item.url) {
                        window.open(item.url, '_blank');
                      }
                      onSelectProduct(item);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-white font-semibold text-xs border border-[#262626] flex items-center justify-center gap-1.5 transition"
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
