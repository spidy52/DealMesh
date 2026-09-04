import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, X, CheckCircle2 } from 'lucide-react';
import { BuyerPolicyData, api } from '../../services/api';

interface PolicySettingsModalProps {
  isOpen: boolean;
  policy: BuyerPolicyData;
  onClose: () => void;
  onPolicyUpdated: (policy: BuyerPolicyData) => void;
}

export const PolicySettingsModal: React.FC<PolicySettingsModalProps> = ({
  isOpen,
  policy,
  onClose,
  onPolicyUpdated,
}) => {
  const [targetPrice, setTargetPrice] = useState(policy.target_price);
  const [autoCap, setAutoCap] = useState(policy.auto_negotiation_cap);
  const [absoluteMax, setAbsoluteMax] = useState(policy.absolute_max);
  const [categories, setCategories] = useState(policy.allowed_categories || 'watches,electronics,accessories');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updatePolicy({
        target_price: Number(targetPrice),
        auto_negotiation_cap: Number(autoCap),
        absolute_max: Number(absoluteMax),
        allowed_categories: categories,
      });
      onPolicyUpdated({
        ...policy,
        target_price: Number(targetPrice),
        auto_negotiation_cap: Number(autoCap),
        absolute_max: Number(absoluteMax),
        allowed_categories: categories,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#121826] border border-indigo-500/40 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Delegated Financial Authority</h3>
              <p className="text-xs text-slate-400">Configure your Buyer Agent's negotiation caps and safety ceilings.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 my-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Preferred Price (₹)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400">Target price your agent will proactively counter with.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Automatic Negotiation Cap (₹)
              </label>
              <input
                type="number"
                value={autoCap}
                onChange={(e) => setAutoCap(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <span className="text-[11px] text-slate-400">Agent can negotiate automatically up to this amount without interrupting you.</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Absolute Maximum Ceiling (₹)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    STRICTLY PRIVATE
                  </span>
                </label>
              </div>
              <input
                type="number"
                value={absoluteMax}
                onChange={(e) => setAbsoluteMax(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500 mb-1"
                required
              />
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> This ceiling is strictly server-side and is NEVER transmitted to merchants.
              </span>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Policy Limits</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
