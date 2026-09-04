import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Lock } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  productName: string;
  merchantName: string;
  offeredPrice: number;
  autoCap: number;
  absoluteMax: number;
  reason: string;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  productName,
  merchantName,
  offeredPrice,
  autoCap,
  absoluteMax,
  reason,
  onApprove,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#121826] border border-amber-500/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Delegated Authority Approval Required</h3>
              <p className="text-xs text-amber-300">Merchant counter exceeds your automatic negotiation limit.</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Product:</span>
                <span className="font-semibold text-white truncate max-w-[240px]">{productName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-semibold text-slate-200">{merchantName}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-amber-400 font-semibold">Merchant Counter Offer:</span>
                <span className="text-base font-extrabold text-amber-400 font-mono">₹{offeredPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Financial Policy Context */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Your Auto Cap</span>
                <span className="font-mono font-bold text-slate-200 text-sm">₹{autoCap.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Absolute Maximum</span>
                <span className="font-mono font-bold text-slate-200 text-sm flex items-center gap-1">
                  ₹{absoluteMax.toLocaleString('en-IN')} <Lock className="w-3 h-3 text-slate-500" />
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {reason || `The merchant offered ₹${offeredPrice.toLocaleString('en-IN')}, which is above your delegated auto cap of ₹${autoCap.toLocaleString('en-IN')}. Would you like to explicitly approve this purchase?`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onReject}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Reject Counter</span>
            </button>
            <button
              onClick={onApprove}
              className="py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve ₹{offeredPrice.toLocaleString('en-IN')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
