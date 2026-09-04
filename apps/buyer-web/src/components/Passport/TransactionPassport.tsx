import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Lock, Sparkles, FileText, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import { TransactionPassportData } from '../../services/api';

interface TransactionPassportProps {
  passport: TransactionPassportData;
  onBackToHome: () => void;
}

export const TransactionPassport: React.FC<TransactionPassportProps> = ({
  passport,
  onBackToHome,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold font-mono">
            SEALED • {passport.deal_ref}
          </span>
        </div>
      </div>

      {/* Main Passport Document Card */}
      <div className="glass-panel rounded-3xl p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Passport Title */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">DealMesh Commerce Protocol</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">DMCP-v1.0</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1">Verifiable Transaction Passport</h2>
            <p className="text-xs text-slate-400 mt-0.5">Cryptographically signed auditable trace from user intent to settlement.</p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-[#121826] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Store Listed Price</span>
            <span className="text-lg font-bold text-slate-400 line-through font-mono">
              ₹{passport.original_price.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold block">Negotiated Savings</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              ₹{passport.savings.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30">
            <span className="text-[11px] text-indigo-300 uppercase font-semibold block">Final Settled Price</span>
            <span className="text-2xl font-extrabold text-white font-mono">
              ₹{passport.final_price.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Zero-Leakage Privacy Assurances */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-8 space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Zero-Leakage Privacy Firewall Report</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{passport.buyer_privacy_guarantee}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{passport.merchant_privacy_guarantee}</span>
            </div>
          </div>
        </div>

        {/* Auditable Timeline */}
        <div>
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Immutable Execution Timeline</span>
          </h4>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {passport.timeline.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="relative flex items-start gap-4 pl-1"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0 z-10">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white">{step.title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{step.timestamp.slice(11, 19)} UTC</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.details}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
