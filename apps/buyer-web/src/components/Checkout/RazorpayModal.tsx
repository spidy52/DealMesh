import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CreditCard, Lock, Sparkles, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';

interface RazorpayModalProps {
  isOpen: boolean;
  dealId: string;
  productName: string;
  merchantName: string;
  originalPrice: number;
  finalPrice: number;
  onClose: () => void;
  onSuccess: (dealId: string) => void;
  onFailureTriggered: (dealId: string) => void;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  dealId,
  productName,
  merchantName,
  originalPrice,
  finalPrice,
  onClose,
  onSuccess,
  onFailureTriggered,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const savings = Math.max(0, originalPrice - finalPrice);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    setIsProcessing(true);
    try {
      const res = await api.simulateCheckout(dealId, simulateFailure);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        onSuccess(dealId);
      } else {
        onFailureTriggered(dealId);
      }
    } catch (err) {
      onFailureTriggered(dealId);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#101726] border border-indigo-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 border-b border-slate-800 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Razorpay Test Mode
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Firewall Verified
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">Complete DealMesh Payment</h3>
            <p className="text-xs text-slate-300 truncate mt-0.5">{productName} • {merchantName}</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Price Summary Breakdown */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Original Listed Price:</span>
                <span className="line-through font-mono">₹{originalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                <span>Negotiated Savings:</span>
                <span className="font-mono">- ₹{savings.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Final Settlement:</span>
                <span className="text-xl font-extrabold text-indigo-400 font-mono">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Test Payment Method</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition ${
                    paymentMethod === 'card'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>Test Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold transition ${
                    paymentMethod === 'upi'
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Test UPI / NetBank</span>
                </button>
              </div>
            </div>

            {/* Demo Simulation Toggle */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Simulate Payment Failure</span>
                <span className="text-[10px] text-slate-400">Trigger Autonomous 2-Step Recovery Agent test</span>
              </div>
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handlePayNow}
              disabled={isProcessing}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition ${
                simulateFailure
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-amber-600/20'
                  : 'bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 shadow-indigo-600/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Contacting Razorpay Gateway...</span>
                </>
              ) : simulateFailure ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Simulate Payment Failure (Test Recovery)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay ₹{finalPrice.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
