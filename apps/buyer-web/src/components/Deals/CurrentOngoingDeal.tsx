import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  ShoppingCart,
  Zap,
  ExternalLink,
  Globe,
  Loader2,
  CheckCircle2,
  FileText,
  TrendingDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getProductImage } from '../../utils/productImages';

interface CurrentOngoingDealProps {
  deal: {
    title: string;
    merchant_name: string;
    price: number;
    original_price?: number;
    image_url?: string;
    url?: string;
    savings?: number;
    discount_percent?: number;
    trust_score?: number;
  };
  isLight?: boolean;
  on1ClickBuy: () => void;
  onViewPassport?: () => void;
}

export const CurrentOngoingDeal: React.FC<CurrentOngoingDealProps> = ({
  deal,
  isLight,
  on1ClickBuy,
  onViewPassport,
}) => {
  const [isAutomatingCart, setIsAutomatingCart] = useState(false);
  const [cartStatus, setCartStatus] = useState<string | null>(null);

  const discount =
    deal.discount_percent ||
    (deal.original_price && deal.original_price > deal.price
      ? Math.round(((deal.original_price - deal.price) / deal.original_price) * 100)
      : 0);

  const savings =
    deal.savings ||
    (deal.original_price && deal.original_price > deal.price
      ? deal.original_price - deal.price
      : 0);

  const handleAutomateCart = async () => {
    setIsAutomatingCart(true);
    setCartStatus(`Launching browser automation to add item to your ${deal.merchant_name} cart...`);

    try {
      const resp = await fetch('http://localhost:8000/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `proceed with ${deal.merchant_name.toLowerCase()}`
        }),
      });

      if (resp.ok) {
        setCartStatus(`Browser navigated to ${deal.merchant_name} and added item to cart.`);
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
      } else if (deal.url) {
        window.open(deal.url, '_blank');
        setCartStatus(`Opened ${deal.merchant_name} store page.`);
      }
    } catch (err) {
      if (deal.url) window.open(deal.url, '_blank');
      setCartStatus(`Opened ${deal.merchant_name} store page.`);
    } finally {
      setIsAutomatingCart(false);
      setTimeout(() => setCartStatus(null), 6000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl p-6 border shadow-2xl relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-slate-200 text-slate-900'
          : 'bg-[#0A0A0A] border-[#1F1F1F] shadow-[0_0_50px_rgba(0,0,0,0.85)] text-white'
      }`}
    >
      {/* Top Header: Badge & Store Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#0E1508] text-lemon-400 border border-lemon-500/30">
            <span className="w-2 h-2 rounded-full bg-lemon-400 animate-pulse" />
            Active Deal Found
          </span>
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-lemon-400" />
            Live Web Verified
          </span>
        </div>

        {deal.url && (
          <a
            href={deal.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-lemon-400 hover:text-lemon-300 flex items-center gap-1 font-semibold transition"
          >
            <span>Visit {deal.merchant_name}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Main Deal Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Product Image / Visual */}
        <div className="md:col-span-3 flex justify-center">
          <div className="w-36 h-36 rounded-2xl bg-[#050505] border border-[#1C1C1C] flex items-center justify-center p-3 relative overflow-hidden group">
            <img
              src={getProductImage(deal.title, '', deal.image_url)}
              alt={deal.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {discount > 0 && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-lemon-500 text-black font-black text-[10px] flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3 text-black" />
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="md:col-span-5 space-y-2.5">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-lemon-400">
            {deal.merchant_name}
          </span>
          {deal.url ? (
            <a
              href={deal.url}
              target="_blank"
              rel="noreferrer"
              className="text-lg font-black line-clamp-2 leading-snug hover:text-lemon-400 transition flex items-center gap-1.5 group cursor-pointer"
            >
              <span>{deal.title}</span>
              <ExternalLink className="w-4 h-4 text-lemon-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>
          ) : (
            <h3 className="text-lg font-black line-clamp-2 leading-snug">
              {deal.title}
            </h3>
          )}
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-mono font-black text-white">
              ₹{deal.price.toLocaleString('en-IN')}
            </span>
            {deal.original_price && deal.original_price > deal.price && (
              <span className="text-sm text-slate-500 line-through font-mono">
                ₹{deal.original_price.toLocaleString('en-IN')}
              </span>
            )}
            {savings > 0 && (
              <span className="text-xs font-mono font-bold text-lemon-400 px-2 py-0.5 rounded bg-lemon-500/15 border border-lemon-500/30">
                Save ₹{savings.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="md:col-span-4 flex flex-col gap-2.5">
          {deal.url && (
            <button
              onClick={() => window.open(deal.url, '_blank')}
              className="w-full py-2.5 px-4 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(204,255,0,0.25)]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Product on {deal.merchant_name}</span>
            </button>
          )}

          <button
            onClick={handleAutomateCart}
            disabled={isAutomatingCart}
            className="w-full py-2.5 px-4 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#2B2B2B] text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isAutomatingCart ? (
              <Loader2 className="w-4 h-4 animate-spin text-lemon-400" />
            ) : (
              <ShoppingCart className="w-4 h-4 text-lemon-400" />
            )}
            <span>{isAutomatingCart ? 'Automating Browser...' : 'Automate Cart (Live Playwright)'}</span>
          </button>

          <button
            onClick={on1ClickBuy}
            className="w-full py-2.5 px-4 rounded-xl bg-[#181818] hover:bg-[#222222] border border-[#333333] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Zap className="w-4 h-4 fill-lemon-400 text-lemon-400" />
            <span>Instant Checkout</span>
          </button>

          {onViewPassport && (
            <button
              onClick={onViewPassport}
              className="w-full py-2 px-3 rounded-xl border border-[#222222] bg-[#0E0E0E] hover:bg-[#161616] text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-lemon-400" />
              <span>View Cryptographic Passport</span>
            </button>
          )}
        </div>
      </div>

      {/* Cart Automation Notice Banner */}
      {cartStatus && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-3 rounded-xl bg-[#0E1508] border border-lemon-500/40 text-lemon-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-lemon-400 shrink-0" />
          <span>{cartStatus}</span>
        </motion.div>
      )}
    </motion.div>
  );
};
