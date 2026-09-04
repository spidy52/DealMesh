import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ShieldCheck, Lock, ArrowRight, CheckCircle2, ExternalLink, Zap, User, Store, Globe } from 'lucide-react';
import { RankedProductData, NegotiationResult } from '../../services/api';
import { getProductImage } from '../../utils/productImages';

interface SplitBrowserViewProps {
  product: RankedProductData;
  negotiation: NegotiationResult | null;
  petName: string;
  onProceedToBuy: () => void;
  onNegotiateAgain?: () => void;
  onOpenArena?: () => void;
}

export const SplitBrowserView: React.FC<SplitBrowserViewProps> = ({
  product,
  negotiation,
  petName,
  onProceedToBuy,
  onNegotiateAgain,
  onOpenArena,
}) => {
  const listedPrice = product.original_price || product.current_price;
  const currentPrice = negotiation?.final_price || negotiation?.current_merchant_counter || product.current_price;
  const savings = Math.max(0, listedPrice - currentPrice);

  const isAiNative = product.is_ai_native;
  const directStoreUrl = product.url || `https://www.${product.merchant_name.toLowerCase().replace(/\s+/g, '')}.com`;

  // Real negotiation history if active negotiation happened, or empty if not an AI deal
  const history = negotiation?.history || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl overflow-hidden border border-[#1E1E1E] bg-[#0A0A0A] shadow-2xl font-sans"
    >
      {/* Browser Chrome Header */}
      <div className="bg-[#050505] px-5 py-3 border-b border-[#181818] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A2A2A] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A2A2A] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A2A2A] inline-block" />
          </div>
          <div className="px-3 py-1 bg-[#121212] rounded-lg text-xs text-slate-400 border border-[#222222] flex items-center gap-1.5 font-mono max-w-[460px] truncate">
            <Lock className="w-3 h-3 text-lemon-400 shrink-0" />
            <a
              href={directStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-lemon-400 truncate flex items-center gap-1 cursor-pointer"
            >
              <span className="truncate">{directStoreUrl}</span>
              <ExternalLink className="w-3 h-3 shrink-0 text-lemon-400" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isAiNative ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0E1508] text-lemon-400 border border-lemon-500/30 font-mono font-semibold text-[10px]">
              <Bot className="w-3 h-3" /> DMCP Protocol Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#121212] text-slate-300 border border-[#262626] font-mono font-semibold text-[10px]">
              <Globe className="w-3 h-3 text-lemon-400" /> Live Web Verified
            </span>
          )}
        </div>
      </div>

      {/* Split Grid: Left Webpage + Right Agent Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#181818]">
        {/* Left Pane: Human-Visible Merchant Webpage */}
        <div className="lg:col-span-6 p-6 bg-[#080808]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-mono font-bold text-lemon-400 uppercase tracking-wider">{product.merchant_name} Storefront</span>
            <span className="flex items-center gap-1 text-lemon-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated Merchant
            </span>
          </div>

          <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#050505] border border-[#1C1C1C] mb-4 relative group">
            <img
              src={getProductImage(product.product_name, '', product.image_url)}
              alt={product.product_name}
              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            />
            {savings > 0 && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-lemon-500 text-black font-mono font-bold text-xs">
                Save ₹{savings.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <h3 className="text-xl font-black text-white mb-1.5">{product.product_name}</h3>
          <p className="text-xs text-slate-400 mb-4">{product.merchant_name} • Live verified pricing</p>

          <div className="p-4 rounded-xl bg-[#111111] border border-[#1E1E1E] mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold font-mono">
                {isAiNative ? 'Store Listed Price' : 'Store MRP'}
              </div>
              <div className="text-sm line-through text-slate-500 font-mono">₹{listedPrice.toLocaleString('en-IN')}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-lemon-400 uppercase font-semibold font-mono">
                {isAiNative ? 'Negotiated Price' : 'Verified Selling Price'}
              </div>
              <div className="text-2xl font-black text-lemon-400 font-mono">₹{currentPrice.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-lemon-400" />
              <span>Direct merchant stock & live DOM verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-lemon-400" />
              <span>Official warranty and customer protection included</span>
            </div>
          </div>
        </div>

        {/* Right Pane: AI Native Negotiation Log OR Live Store Direct Purchase */}
        <div className="lg:col-span-6 p-6 bg-[#050505] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#181818]">
              <div className="flex items-center gap-2">
                {isAiNative ? (
                  <>
                    <Bot className="w-4 h-4 text-lemon-400" />
                    <h4 className="text-sm font-bold text-white">DMCP Autonomous Negotiation</h4>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 text-lemon-400" />
                    <h4 className="text-sm font-bold text-white">Live Store Checkout Details</h4>
                  </>
                )}
              </div>
              <div className="text-[10px] px-2 py-0.5 rounded bg-[#0E1508] text-lemon-400 border border-lemon-500/30 font-mono font-semibold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-lemon-400" />
                Zero-Leakage Privacy
              </div>
            </div>

            {isAiNative ? (
              <>
                {/* Privacy Badges */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-[#0C0C0C] border border-[#1A1A1A] text-[11px]">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold font-mono">Buyer Ceiling</span>
                    <span className="text-lemon-400 font-mono font-bold flex items-center gap-1.5 mt-0.5">
                      <Lock className="w-3 h-3 text-lemon-400" /> Hidden from Merchant
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0C0C0C] border border-[#1A1A1A] text-[11px]">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold font-mono">Merchant Floor</span>
                    <span className="text-lemon-400 font-mono font-bold flex items-center gap-1.5 mt-0.5">
                      <Lock className="w-3 h-3 text-lemon-400" /> Hidden from Buyer
                    </span>
                  </div>
                </div>

                {/* Negotiation Rounds Timeline */}
                {history.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {history.map((step, idx) => {
                      const isBuyer = step.sender.toLowerCase().includes('buyer') || step.sender.toLowerCase().includes('dealmesh') || step.sender.toLowerCase().includes('omni');
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: isBuyer ? -10 : 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex items-start gap-2.5 text-xs ${isBuyer ? 'justify-start' : 'justify-end'}`}
                        >
                          {isBuyer && (
                            <div className="w-6 h-6 rounded-lg bg-[#0E1508] border border-lemon-500/30 text-lemon-400 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-xl max-w-[80%] border ${
                              isBuyer
                                ? 'bg-[#0E1508] border-lemon-500/30 text-slate-200'
                                : 'bg-[#141414] border-[#242424] text-slate-200 text-right'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-slate-400 mb-0.5 font-mono">
                              {step.sender} • Round {Math.floor(idx / 2) + 1}
                            </div>
                            <div className="font-mono text-sm font-bold text-white">
                              ₹{step.price?.toLocaleString('en-IN')}
                            </div>
                          </div>
                          {!isBuyer && (
                            <div className="w-6 h-6 rounded-lg bg-[#181818] border border-[#2B2B2B] text-slate-300 flex items-center justify-center shrink-0">
                              <Store className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#0E1508] border border-lemon-500/30 mb-6 text-center space-y-2">
                    <p className="text-xs text-lemon-300 font-semibold">
                      This merchant supports autonomous AI price negotiation!
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Click below to let DealMesh AI negotiate concessions directly on your behalf.
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Live Web Store: Real Store Details (No fake negotiation rounds!) */
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[#222222] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Merchant:</span>
                    <span className="font-bold text-white">{product.merchant_name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Verified Price:</span>
                    <span className="font-mono font-bold text-lemon-400 text-base">₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Verification Source:</span>
                    <span className="text-xs text-slate-300 font-mono">Live Web DOM Verification</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0E1508] border border-lemon-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-lemon-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Direct Web Link Ready</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This deal is extracted directly from <strong>{product.merchant_name}</strong>. You can view the exact product page directly or proceed with automated checkout.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#181818] flex flex-wrap items-center gap-3">
            {product.url && (
              <button
                onClick={() => window.open(product.url, '_blank')}
                className="py-3 px-4 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(204,255,0,0.25)]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View Exact Product on {product.merchant_name}</span>
              </button>
            )}

            {isAiNative && onOpenArena && (
              <button
                onClick={onOpenArena}
                className="py-3 px-4 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-slate-300 hover:text-white border border-[#2B2B2B] font-bold text-xs flex items-center justify-center gap-2 transition"
                title="Open Bot Arena on Desktop"
              >
                <Zap className="w-4 h-4 text-lemon-400" />
                <span>Open Desktop Arena</span>
              </button>
            )}

            <button
              onClick={onProceedToBuy}
              className="flex-1 py-3 px-4 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#333333] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Instant Checkout at ₹{currentPrice.toLocaleString('en-IN')}</span>
              <ArrowRight className="w-4 h-4 text-lemon-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

