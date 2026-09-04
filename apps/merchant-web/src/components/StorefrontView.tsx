import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Store,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Search,
  Sparkles,
  Bot,
  Tag
} from 'lucide-react';
import { MerchantProductData } from '../services/api';

interface StorefrontViewProps {
  products: MerchantProductData[];
  cartCount?: number;
  onOpenCart?: () => void;
  onNegotiateOnDesktop: (product: MerchantProductData) => void;
  on1ClickBuy: (product: MerchantProductData) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  products,
  cartCount = 0,
  onOpenCart,
  onNegotiateOnDesktop,
  on1ClickBuy,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories = ['All', 'Watches', 'Formal', 'Sport', 'Minimalist'];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat =
      selectedCategory === 'All' ||
      (p.category || '').toLowerCase().includes(selectedCategory.toLowerCase()) ||
      p.name.toLowerCase().includes(selectedCategory.toLowerCase());

    return matchesSearch && matchesCat;
  });

  const handleTriggerNegotiate = async (p: MerchantProductData) => {
    setToastMessage(`Initiating autonomous desktop negotiation for "${p.name}"...`);
    setTimeout(() => setToastMessage(null), 5000);
    onNegotiateOnDesktop(p);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-amber-500 text-white font-bold text-xs shadow-2xl flex items-center gap-3 border border-white/20"
        >
          <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0B132B] via-[#1C2541] to-[#0B132B] border border-blue-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>AI-Native E-Commerce Storefront • TitanBot Active</span>
          </div>

          <h2 className="text-3xl font-black text-white tracking-tight">
            Titan Official E-Commerce Store
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Because generic third-party websites do not have AI agents in the wild yet, this merchant store represents our live catalog.
            Every item is represented by <strong>TitanBot</strong>, our autonomous seller agent. When you want to buy, TitanBot and Omni meet directly on your desktop screen to negotiate against market prices and shake hands!
          </p>
        </div>
      </div>

      {/* Controls & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search store catalog..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B1120] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Category Pills & Cart Trigger */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 shrink-0"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-emerald-800 text-[10px] font-black animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((p) => {
          const isLowStock = p.inventory <= 3 && p.inventory > 0;
          const isOutOfStock = p.inventory === 0;

          return (
            <div
              key={p.id}
              className="merchant-panel rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col group shadow-lg"
            >
              {/* Product Image */}
              <div className="aspect-[16/10] bg-slate-900 relative overflow-hidden">
                <img
                  src={p.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80'}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Stock Badge */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  <span>
                    {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${p.inventory} left (Scarcity)` : `In Stock (${p.inventory})`}
                  </span>
                </div>

                {/* Brand Tag */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-[10px] font-bold text-blue-300 font-mono">
                  {p.brand}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold">{p.rating}</span>
                    <span className="text-slate-500 text-[11px]">({p.review_count.toLocaleString('en-IN')})</span>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-2">{p.name}</h3>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Store Listed Price</span>
                      <span className="text-xl font-extrabold text-white font-mono">
                        ₹{p.listed_price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block font-mono">AI Floor (Protected)</span>
                      <span className="text-xs font-mono text-amber-300/80">Negotiable</span>
                    </div>
                  </div>
                </div>

                {/* AI Seller Badge */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="leading-tight">
                    <strong>TitanBot Active:</strong> Ready to negotiate autonomously with Omni on your desktop screen.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleTriggerNegotiate(p)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>🤝 Negotiate with TitanBot on Desktop</span>
                  </button>

                  <button
                    onClick={() => on1ClickBuy(p)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600/80 hover:text-white text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700/60 hover:border-emerald-500"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart (₹{p.listed_price.toLocaleString('en-IN')})</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
