import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Lock,
  Sparkles,
  Package,
  RotateCcw
} from 'lucide-react';

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  image_url?: string;
  price: number;
  original_price?: number;
  savings?: number;
  quantity: number;
  is_negotiated?: boolean;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderRef, setOrderRef] = useState<string>('');

  const subtotal = cart.reduce((sum, item) => sum + (item.original_price || item.price) * item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalSavings = Math.max(0, subtotal - total);

  const handleStartCheckout = () => {
    setCheckoutStep('payment');
  };

  const handlePayNow = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessing(false);
    const generatedOrder = `DM-TITAN-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderRef(generatedOrder);
    setCheckoutStep('success');
  };

  const handleReset = () => {
    onClearCart();
    setCheckoutStep('cart');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-md bg-[#0D1322] border-l border-slate-800 text-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 bg-gradient-to-r from-[#10182E] to-[#0D1322] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                    <span>Titan Shopping Cart</span>
                    {cart.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold border border-blue-500/40">
                        {cart.reduce((s, i) => s + i.quantity, 0)} items
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400">DealMesh AI Storefront • Official Direct Checkout</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {checkoutStep === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 border border-slate-700">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-300">Your Cart is Empty</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                          When TitanBot negotiates a deal for you on your desktop, your item will be added here automatically!
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                      >
                        Explore Titan Catalog
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => {
                        const itemSavings = (item.original_price || item.price) - item.price;
                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition flex gap-3.5 relative group"
                          >
                            {/* Thumbnail */}
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 relative">
                              <img
                                src={item.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300&q=80'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                                    {item.brand || 'Titan'}
                                  </span>
                                  {item.is_negotiated && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30 flex items-center gap-0.5">
                                      <Zap className="w-2.5 h-2.5 fill-amber-300" /> AI Negotiated
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                              </div>

                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-base font-black text-emerald-400 font-mono">
                                  ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                {item.original_price && item.original_price > item.price && (
                                  <span className="text-xs line-through text-slate-500 font-mono">
                                    ₹{item.original_price.toLocaleString('en-IN')}
                                  </span>
                                )}
                                {itemSavings > 0 && (
                                  <span className="text-[10px] text-amber-400 font-bold">
                                    (Save ₹{itemSavings.toLocaleString('en-IN')})
                                  </span>
                                )}
                              </div>

                              {/* Quantity & Remove controls */}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-0.5">
                                  <button
                                    onClick={() => onUpdateQuantity(item.id, -1)}
                                    className="text-slate-400 hover:text-white text-xs"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-bold font-mono px-1">{item.quantity}</span>
                                  <button
                                    onClick={() => onUpdateQuantity(item.id, 1)}
                                    className="text-slate-400 hover:text-white text-xs"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  onClick={() => onRemoveItem(item.id)}
                                  className="text-slate-500 hover:text-rose-400 text-xs transition p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* PAYMENT STEP */}
              {checkoutStep === 'payment' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Payment Gateway</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                        Razorpay Secure
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                          paymentMethod === 'card'
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Credit / Debit</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                          paymentMethod === 'upi'
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>Instant UPI</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Address:</span>
                      <span className="text-white font-medium">Home • Express 24h</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Shipping Fee:</span>
                      <span className="text-emerald-400 font-bold">FREE</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>TitanBot Discount:</span>
                      <span className="text-amber-400 font-bold">-₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>DMCP Smart Policy Guaranteed: Zero hidden markups or price tampering.</span>
                  </div>
                </div>
              )}

              {/* SUCCESS STEP */}
              {checkoutStep === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Order Confirmed!</h3>
                    <p className="text-xs text-slate-400">Thank you for your purchase on Titan Official Store!</p>
                  </div>

                  <div className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order Reference:</span>
                      <span className="font-mono font-bold text-white">{orderRef}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Paid:</span>
                      <span className="font-mono font-black text-emerald-400">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Net Savings:</span>
                      <span className="font-mono font-bold text-amber-400">₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Delivery:</span>
                      <span className="text-slate-200">Tomorrow by 5:00 PM</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition"
                  >
                    Done & Return to Store
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary & Action Bar */}
            {cart.length > 0 && checkoutStep !== 'success' && (
              <div className="p-5 border-t border-slate-800 bg-[#0A0F1D] space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-300">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Negotiated AI Savings
                      </span>
                      <span className="font-mono">-₹{totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                    <span>Total Amount</span>
                    <span className="font-mono text-emerald-400">₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {checkoutStep === 'cart' ? (
                  <button
                    onClick={handleStartCheckout}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition active:scale-95"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled={isProcessing}
                    onClick={handlePayNow}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 transition active:scale-95 disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isProcessing ? 'Verifying with Razorpay...' : `Pay ₹${total.toLocaleString('en-IN')} Now`}</span>
                  </button>
                )}

                <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> 256-Bit SSL
                  </span>
                  <span>•</span>
                  <span>Razorpay Verified</span>
                  <span>•</span>
                  <span>Official Titan Warranty</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
