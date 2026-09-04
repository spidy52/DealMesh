import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Bot, Store, Sparkles, AlertCircle, Clock, Activity } from 'lucide-react';
import { SearchResponse } from '../../services/api';

interface SearchVisualizerProps {
  isSearching: boolean;
  searchResponse: SearchResponse | null;
  query: string;
}

export const SearchVisualizer: React.FC<SearchVisualizerProps> = ({
  isSearching,
  searchResponse,
  query,
}) => {
  if (!isSearching && !searchResponse) return null;

  const storeReports = searchResponse?.store_reports || [];
  const storesChecked = searchResponse?.stores_checked || (isSearching ? 1 : storeReports.length);
  const productsFound = searchResponse?.products_found || 0;
  const aiMerchantsCount = searchResponse?.ai_merchants_count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 border border-[#1E1E1E] bg-[#0A0A0A] shadow-2xl font-sans"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-[#181818]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-lemon-400">
              Multi-Merchant Discovery Engine
            </span>
            {isSearching && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0E1508] text-lemon-400 border border-lemon-500/30">
                <Activity className="w-3 h-3 animate-pulse" /> Scanning Active
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {isSearching ? `Scanning live web for "${query || 'products'}"...` : `Discovery Complete: ${storesChecked} Stores Verified`}
          </h2>
        </div>

        {/* Real Metrics Counter */}
        <div className="flex items-center gap-3 font-mono">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#111111] border border-[#222222] text-center">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Stores</div>
            <div className="text-base font-bold text-white">{storesChecked}</div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#111111] border border-[#222222] text-center">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Matches</div>
            <div className="text-base font-bold text-lemon-400">{productsFound}</div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0E1508] border border-lemon-500/30 text-center">
            <div className="text-[10px] text-lemon-400/80 uppercase font-semibold">AI Native</div>
            <div className="text-base font-bold text-lemon-400">{aiMerchantsCount}</div>
          </div>
        </div>
      </div>

      {/* Grid of Stores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {storeReports.map((store, idx) => (
          <motion.div
            key={store.merchant_name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.04 }}
            className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
              store.is_ai_native
                ? 'bg-[#0E1508] border-lemon-500/30 text-white'
                : 'bg-[#111111] border-[#1E1E1E] text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold truncate pr-1" title={store.merchant_name}>
                {store.merchant_name}
              </span>
              {store.is_ai_native ? (
                <span className="inline-flex items-center text-[10px] px-1.5 py-0.2 rounded bg-lemon-500/20 text-lemon-300 border border-lemon-500/30 font-bold shrink-0 font-mono">
                  AI DMCP
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Fixed</span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-[#1C1C1C]">
              <div className="flex items-center gap-1 font-mono">
                {isSearching ? (
                  <Clock className="w-3 h-3 text-lemon-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-lemon-400" />
                )}
                <span>{isSearching ? 'Checking' : 'Queried'}</span>
              </div>
              <span className="font-mono text-slate-400">{store.product_count || 1} items</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
