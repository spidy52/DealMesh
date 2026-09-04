import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Bot, ShieldCheck, TrendingUp, DollarSign, Users, Package,
  Sliders, FileText, CheckCircle2, AlertTriangle, Lock, Pause, Play,
  RefreshCw, ExternalLink, Flame, Sparkles, BarChart3, Check, X, Clock,
  ShoppingCart
} from 'lucide-react';
import {
  merchantApi,
  MerchantOverviewData,
  MerchantProductData,
  MerchantAgentData,
  MerchantNegotiationData,
  MerchantAnalyticsData
} from './services/api';
import { StorefrontView } from './components/StorefrontView';
import { CartDrawer, CartItem } from './components/CartDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'storefront' | 'overview' | 'products' | 'agent' | 'live' | 'analytics' | 'audit'>('storefront');
  const [overview, setOverview] = useState<MerchantOverviewData | null>(null);
  const [products, setProducts] = useState<MerchantProductData[]>([]);
  const [agentSettings, setAgentSettings] = useState<MerchantAgentData | null>(null);
  const [liveNegotiations, setLiveNegotiations] = useState<MerchantNegotiationData[]>([]);
  const [analytics, setAnalytics] = useState<MerchantAnalyticsData | null>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Selected product policy editing
  const [editingPolicyProduct, setEditingPolicyProduct] = useState<MerchantProductData | null>(null);
  const [prefPrice, setPrefPrice] = useState(2500);
  const [autoFloor, setAutoFloor] = useState(2400);
  const [absFloor, setAbsFloor] = useState(2299);
  const [approvalThreshold, setApprovalThreshold] = useState(2400);

  // Shopping Cart State & Persistence
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dealmesh_store_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dealmesh_store_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Read URL query params on mount (e.g. ?cart=open&product=Titan%20Watch&price=2000&original_price=2499&savings=499)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cartParam = params.get('cart');
    const productParam = params.get('product');
    const priceParam = params.get('price');
    const originalPriceParam = params.get('original_price');
    const savingsParam = params.get('savings');

    if (cartParam === 'open' || productParam) {
      if (productParam) {
        const pPrice = priceParam ? parseFloat(priceParam) : 2000;
        const pOrig = originalPriceParam ? parseFloat(originalPriceParam) : 2499;
        const pSavings = savingsParam ? parseFloat(savingsParam) : Math.max(0, pOrig - pPrice);

        setCart((prev) => {
          const existingIdx = prev.findIndex((i) => i.name.toLowerCase() === productParam.toLowerCase());
          if (existingIdx >= 0) {
            const copy = [...prev];
            copy[existingIdx] = {
              ...copy[existingIdx],
              price: pPrice,
              original_price: pOrig,
              savings: pSavings,
              is_negotiated: true,
            };
            return copy;
          }
          return [
            ...prev,
            {
              id: `cart-${Date.now()}`,
              name: productParam,
              brand: 'Titan',
              price: pPrice,
              original_price: pOrig,
              savings: pSavings,
              quantity: 1,
              is_negotiated: true,
              image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300&q=80',
            },
          ];
        });
      }
      setIsCartOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleAddToCart = (prod: MerchantProductData) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.id === prod.id || i.name.toLowerCase() === prod.name.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          brand: prod.brand,
          image_url: prod.image_url,
          price: prod.listed_price,
          original_price: prod.listed_price,
          quantity: 1,
          is_negotiated: false,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const loadData = async () => {
    try {
      const [ov, prods, ag, negs, an, aud] = await Promise.all([
        merchantApi.getOverview(),
        merchantApi.getProducts(),
        merchantApi.getAgentSettings(),
        merchantApi.getNegotiations(),
        merchantApi.getAnalytics(),
        merchantApi.getAuditTrail(),
      ]);
      setOverview(ov);
      setProducts(prods);
      setAgentSettings(ag);
      setLiveNegotiations(negs);
      setAnalytics(an);
      setAuditEvents(aud.audit_events || []);
    } catch (err) {
      console.error('Error loading merchant data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup real-time WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if ([
            'approval.required', 'negotiation.started', 'offer.created',
            'counter.received', 'negotiation.approved', 'negotiation.rejected',
            'deal.locked', 'titanbot.paused', 'titanbot.resumed', 'merchant.inventory_updated'
          ].includes(msg.type)) {
            loadData();
          }
        } catch (e) {}
      };
    } catch (err) {
      console.warn('WebSocket connection fallback:', err);
    }

    // Backup polling every 6 seconds
    const interval = setInterval(loadData, 6000);
    return () => {
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const handleTogglePause = async () => {
    if (!agentSettings) return;
    try {
      const res = await merchantApi.toggleAgentPause();
      setAgentSettings({ ...agentSettings, is_paused: res.is_paused });
    } catch (err) {
      console.error('Failed to toggle agent pause:', err);
    }
  };

  const handleDecision = async (negotiationId: string, decision: 'APPROVE' | 'REJECT', approvedPrice?: number) => {
    setActionInProgress(negotiationId);
    try {
      await merchantApi.decideNegotiation(negotiationId, decision, approvedPrice);
      await loadData();
    } catch (err) {
      console.error(`Failed to ${decision} negotiation:`, err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicyProduct) return;
    await merchantApi.updateProductPolicy(editingPolicyProduct.id, {
      preferred_price: Number(prefPrice),
      auto_negotiation_floor: Number(autoFloor),
      absolute_floor: Number(absFloor),
      human_approval_threshold: Number(approvalThreshold),
      max_discount_percent: 20.0,
    });
    setEditingPolicyProduct(null);
    loadData();
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    await merchantApi.updateInventory(productId, newStock);
    loadData();
  };

  const pendingApprovals = liveNegotiations.filter((n) => n.status === 'WAITING_FOR_APPROVAL');

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 flex flex-col justify-between selection:bg-blue-600">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0A0E1A]/95 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-600/20 flex items-center justify-center font-bold text-lg text-white">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">{overview?.store_name || 'Titan Store'}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                DMCP AI Enabled
              </span>
              {agentSettings?.is_paused && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                  TitanBot PAUSED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Merchant AI Control Center • Autonomous Selling & Dynamic Pricing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Pause / Resume Agent Toggle */}
          {agentSettings && (
            <button
              onClick={handleTogglePause}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-md ${
                agentSettings.is_paused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {agentSettings.is_paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{agentSettings.is_paused ? 'Resume TitanBot' : 'TitanBot Running'}</span>
            </button>
          )}

          {/* Shopping Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart</span>
            {cart.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-black animate-pulse">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </button>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition"
          >
            <span>Open Buyer Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#0D1222] border-b border-slate-800 px-6">
        <div className="max-w-6xl mx-auto flex gap-6 text-xs font-bold overflow-x-auto scrollbar-none">
          {[
            { id: 'storefront', label: 'Live E-Commerce Store', icon: Store },
            {
              id: 'cart_tab',
              label: `Cart (${cart.reduce((s, i) => s + i.quantity, 0)})`,
              icon: ShoppingCart,
              badge: cart.length > 0 ? `${cart.reduce((s, i) => s + i.quantity, 0)}` : undefined
            },
            { id: 'overview', label: 'Store Overview', icon: Store },
            { id: 'products', label: 'Products & Scarcity', icon: Package },
            { id: 'agent', label: 'TitanBot Policy & Control', icon: Sliders },
            {
              id: 'live',
              label: 'Live Negotiations',
              icon: TrendingUp,
              badge: pendingApprovals.length > 0 ? `${pendingApprovals.length} Approval` : undefined
            },
            { id: 'analytics', label: 'Revenue & AI Analytics', icon: BarChart3 },
            { id: 'audit', label: 'DMCP Audit Trail', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'cart_tab') {
                    setIsCartOpen(true);
                  } else {
                    setActiveTab(tab.id as any);
                  }
                }}
                className={`py-3.5 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1">
        {/* Human Approval Alert Banner */}
        {pendingApprovals.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 shadow-lg shadow-amber-500/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Human Approval Required ({pendingApprovals.length} Offer)
                </h4>
                <p className="text-xs text-slate-300">
                  Buyer offer is below TitanBot's auto floor (₹{pendingApprovals[0].autoFloor}) but meets store reservation limits.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={actionInProgress === pendingApprovals[0].id}
                onClick={() => handleDecision(pendingApprovals[0].id, 'APPROVE', pendingApprovals[0].buyerOffer)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md transition active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                Approve (₹{pendingApprovals[0].buyerOffer.toLocaleString('en-IN')})
              </button>
              <button
                disabled={actionInProgress === pendingApprovals[0].id}
                onClick={() => handleDecision(pendingApprovals[0].id, 'REJECT')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          </div>
        )}

        {/* LIVE E-COMMERCE STOREFRONT TAB */}
        {activeTab === 'storefront' && (
          <StorefrontView
            products={products}
            cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
            onOpenCart={() => setIsCartOpen(true)}
            onNegotiateOnDesktop={async (prod) => {
              try {
                await fetch('http://localhost:8000/api/voice/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: `can you arrange a negotiation with ${prod.name}`
                  }),
                });
              } catch (err) {
                console.warn('Voice chat trigger error:', err);
              }
            }}
            on1ClickBuy={(prod) => {
              handleAddToCart(prod);
            }}
          />
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="merchant-panel rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">AI Buyers Served</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">{overview?.metrics.ai_buyers_count || 42}</div>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Live DMCP Registry</span>
              </div>

              <div className="merchant-panel rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Negotiations</span>
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {analytics?.total_negotiations ?? overview?.metrics.total_negotiations ?? 0}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {analytics?.successful_deals ?? overview?.metrics.successful_deals ?? 0} deals closed
                </span>
              </div>

              <div className="merchant-panel rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">AI-Originated Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                  ₹{(analytics?.total_revenue ?? overview?.metrics.total_revenue ?? 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
                  {analytics?.orders_count || 0} orders settled
                </span>
              </div>

              <div className="merchant-panel rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">Deal Conversion Rate</span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {analytics?.conversion_rate ?? overview?.metrics.conversion_rate ?? 0}%
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Avg discount: {analytics?.average_discount_percent ?? overview?.metrics.average_discount_percent ?? 0}%
                </span>
              </div>
            </div>

            {/* Live Deals Preview */}
            <div className="merchant-panel rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Real Database Negotiations Feed</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Live DMCP Stream</span>
              </div>

              {liveNegotiations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No negotiations recorded yet. When Omni initiates a deal, it will appear here in real time.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {liveNegotiations.slice(0, 5).map((deal) => (
                    <div key={deal.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{deal.product}</span>
                          {deal.inventory <= 1 && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                              <Flame className="w-3 h-3" /> Scarcity Mode
                            </span>
                          )}
                          {deal.status === 'WAITING_FOR_APPROVAL' && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                              Approval Needed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Buyer: <strong className="text-slate-200">{deal.buyer}</strong> • Listed: ₹{deal.listed.toLocaleString('en-IN')} → Offer: ₹{deal.buyerOffer.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        {deal.status === 'WAITING_FOR_APPROVAL' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDecision(deal.id, 'APPROVE', deal.buyerOffer)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(deal.id, 'REJECT')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-300 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-extrabold text-emerald-400 font-mono">
                              {deal.finalAgreed ? `₹${deal.finalAgreed.toLocaleString('en-IN')} Agreed` : deal.status}
                            </div>
                            <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1 justify-end">
                              <Lock className="w-3 h-3" /> Private Floor: ₹{deal.privateFloor.toLocaleString('en-IN')}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS & SCARCITY TAB */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Catalog & Inventory Management</h3>
                <p className="text-xs text-slate-400">Manage stock and AI commerce negotiation policies per product.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((prod) => (
                <div key={prod.id} className="merchant-panel rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-800 mb-3 relative">
                      <img src={prod.image_url || 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&q=80'} alt={prod.name} className="w-full h-full object-cover" />
                      <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        prod.inventory <= 1 ? 'bg-rose-600 text-white animate-pulse' : 'bg-black/70 text-white'
                      }`}>
                        Stock: {prod.inventory}
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white line-clamp-1 mb-1">{prod.name}</h4>
                    <div className="text-xs text-slate-400 mb-3">{prod.brand} • Listed: <span className="font-mono text-white font-bold">₹{prod.listed_price.toLocaleString('en-IN')}</span></div>

                    {prod.policy && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1 mb-4">
                        <div className="flex justify-between text-slate-300">
                          <span>Preferred:</span>
                          <span className="font-mono text-white">₹{prod.policy.preferred_price.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Auto Floor:</span>
                          <span className="font-mono text-white">₹{prod.policy.auto_negotiation_floor.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-amber-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Absolute Floor:
                          </span>
                          <span className="font-mono">₹{prod.policy.absolute_floor.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPolicyProduct(prod);
                        if (prod.policy) {
                          setPrefPrice(prod.policy.preferred_price);
                          setAutoFloor(prod.policy.auto_negotiation_floor);
                          setAbsFloor(prod.policy.absolute_floor);
                          setApprovalThreshold(prod.policy.human_approval_threshold);
                        }
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                    >
                      Configure Policy
                    </button>
                    <button
                      onClick={() => handleUpdateStock(prod.id, prod.inventory === 1 ? 10 : 1)}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      title="Toggle Scarcity Stock (1 vs 10)"
                    >
                      {prod.inventory === 1 ? 'Restore Stock' : 'Set Stock=1'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AGENT POLICY AUTHORITY TAB */}
        {activeTab === 'agent' && agentSettings && (
          <div className="max-w-2xl mx-auto merchant-panel rounded-3xl p-8 border border-blue-500/30 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xl">
                  <Bot className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">TitanBot Control Plane</h3>
                  <p className="text-xs text-slate-400">Autonomous DMCP Seller Agent authority & circuit breaker.</p>
                </div>
              </div>

              <button
                onClick={handleTogglePause}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                  agentSettings.is_paused
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                }`}
              >
                {agentSettings.is_paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{agentSettings.is_paused ? 'Resume Agent' : 'Pause Agent'}</span>
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Agent Name & Personality</label>
                <input
                  type="text"
                  value={agentSettings.agent_name}
                  className="w-full px-3.5 py-2.5 bg-[#0A0E1A] border border-slate-700 rounded-xl text-white text-sm font-mono"
                  readOnly
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-white block mb-1">Autonomous Negotiation</span>
                  <span className="text-slate-400 block text-[11px] mb-3">Allows TitanBot to negotiate within policy bounds.</span>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                    agentSettings.is_paused ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {agentSettings.is_paused ? 'PAUSED' : 'ACTIVE'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="font-bold text-white block mb-1">Scarcity Defense Mode</span>
                  <span className="text-slate-400 block text-[11px] mb-3">Tighter margin curves when inventory &le; 1.</span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[11px]">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-amber-400 block mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Zero-Leakage Privacy Policy
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Your store's private reservation floor (e.g. ₹2,299) is strictly enforced on the server. The Buyer Agent and external APIs will NEVER receive or be able to query this floor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LIVE NEGOTIATIONS TAB */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Live Multi-Buyer DMCP Interactions</h3>
                <p className="text-xs text-slate-400">Real database transcript of Buyer Agents interacting with TitanBot.</p>
              </div>
              <button
                onClick={loadData}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Feed
              </button>
            </div>

            {liveNegotiations.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs merchant-panel rounded-2xl">
                No active negotiations yet. When Omni discovers Titan Store, live negotiation rounds will appear here.
              </div>
            ) : (
              <div className="space-y-4">
                {liveNegotiations.map((deal) => (
                  <div key={deal.id} className="merchant-panel rounded-2xl p-6 border border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${deal.status === 'AGREED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                        <h4 className="font-bold text-white text-sm">{deal.buyer} ↔ TitanBot</h4>
                        <span className="text-xs text-slate-400">• {deal.product}</span>
                        <span className="text-[11px] text-slate-500">({deal.time})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {deal.status === 'WAITING_FOR_APPROVAL' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                              Approval Required
                            </span>
                            <button
                              disabled={actionInProgress === deal.id}
                              onClick={() => handleDecision(deal.id, 'APPROVE', deal.buyerOffer)}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionInProgress === deal.id}
                              onClick={() => handleDecision(deal.id, 'REJECT')}
                              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-rose-900 text-slate-300 text-xs font-bold transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            deal.status === 'AGREED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {deal.status} • ₹{(deal.finalAgreed || deal.buyerOffer).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-4">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Listed Price</span>
                        <span className="font-mono text-white font-bold">₹{deal.listed.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">Buyer Offer</span>
                        <span className="font-mono text-slate-300">₹{deal.buyerOffer.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 block">TitanBot Counter</span>
                        <span className="font-mono text-slate-300">₹{deal.titanBotCounter.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                        <span className="text-amber-400 block font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Private Floor
                        </span>
                        <span className="font-mono text-amber-300 font-bold">₹{deal.privateFloor.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {deal.messages && deal.messages.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/60 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rounds Transcript:</span>
                        {deal.messages.map((m) => (
                          <div key={m.id} className="text-[11px] text-slate-300 flex items-center justify-between">
                            <span>
                              <strong className={m.sender_type === 'BUYER' ? 'text-cyan-400' : 'text-blue-400'}>{m.sender_name}</strong>: {m.message_text}
                            </span>
                            <span className="text-[10px] text-slate-500">{m.timestamp.slice(11, 19)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Real-Time Revenue & TitanBot Analytics</h3>
                <p className="text-xs text-slate-400">Computed live from SQLite orders, deals, and DMCP transactions.</p>
              </div>
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="merchant-panel rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase">AI Commerce Revenue</span>
                <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                  ₹{(analytics?.total_revenue || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">{analytics?.orders_count || 0} orders</span>
              </div>

              <div className="merchant-panel rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase">Average Order Value (AOV)</span>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  ₹{(analytics?.aov || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-400 mt-1 block">Live transaction avg</span>
              </div>

              <div className="merchant-panel rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase">Negotiation Conversion</span>
                <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
                  {analytics?.conversion_rate || 0}%
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">{analytics?.successful_deals || 0} of {analytics?.total_negotiations || 0}</span>
              </div>

              <div className="merchant-panel rounded-2xl p-5">
                <span className="text-xs font-bold text-slate-400 uppercase">Average Concession / Discount</span>
                <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
                  {analytics?.average_discount_percent || 0}%
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Within delegated margin</span>
              </div>
            </div>

            {/* TitanBot Decision Breakdown */}
            <div className="merchant-panel rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-3">TitanBot Autonomous Efficiency</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Autonomous Accepts</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {analytics?.agent_metrics.autonomous_acceptances || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Autonomous Counters</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">
                    {analytics?.agent_metrics.autonomous_counters || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Human Escalations</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {analytics?.agent_metrics.human_escalations || 0}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block">Human Approvals</span>
                  <span className="text-lg font-bold text-purple-400 font-mono">
                    {analytics?.agent_metrics.human_approvals || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="merchant-panel rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3">Revenue by Product</h4>
                {(!analytics?.revenue_by_product || analytics.revenue_by_product.length === 0) ? (
                  <div className="text-xs text-slate-500 py-4 text-center">No sales data yet.</div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {analytics.revenue_by_product.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-200 font-medium truncate max-w-xs">{item.name}</span>
                        <div className="text-right">
                          <span className="font-bold text-white font-mono block">₹{item.revenue.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-400">{item.orders} orders</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="merchant-panel rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3">Revenue by Buyer Agent</h4>
                {(!analytics?.revenue_by_buyer || analytics.revenue_by_buyer.length === 0) ? (
                  <div className="text-xs text-slate-500 py-4 text-center">No agent sales recorded yet.</div>
                ) : (
                  <div className="space-y-2 text-xs">
                    {analytics.revenue_by_buyer.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-200 font-bold">{item.agent}</span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400 font-mono block">₹{item.revenue.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-400">{item.deals} deals agreed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">DMCP Protocol Audit Trail</h3>
                <p className="text-xs text-slate-400">Tamper-evident log of all agent requests, counters, and reservations.</p>
              </div>
            </div>

            <div className="merchant-panel rounded-2xl overflow-hidden border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0D1222] text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Entity</th>
                    <th className="py-3.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-800 text-slate-300 font-mono">
                  {auditEvents.length > 0 ? (
                    auditEvents.map((ev, i) => (
                      <tr key={i} className="hover:bg-slate-900/60">
                        <td className="py-3 px-4 text-slate-400">{ev.timestamp.slice(11, 19)} UTC</td>
                        <td className="py-3 px-4 text-blue-400 font-bold">{ev.actor_type}</td>
                        <td className="py-3 px-4 text-emerald-400 font-semibold">{ev.action}</td>
                        <td className="py-3 px-4 text-slate-400">{ev.actor_id}</td>
                        <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{JSON.stringify(ev.details)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Policy Configuration Modal */}
      {editingPolicyProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="merchant-panel rounded-3xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Configure Negotiation Policy</h3>
            <p className="text-xs text-slate-400 mb-4">{editingPolicyProduct.name}</p>

            <form onSubmit={handleSavePolicy} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Preferred Selling Price (₹)</label>
                <input
                  type="number"
                  value={prefPrice}
                  onChange={(e) => setPrefPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Autonomous Floor (₹)</label>
                <input
                  type="number"
                  value={autoFloor}
                  onChange={(e) => setAutoFloor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-amber-400 font-semibold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Absolute Floor (Server-Private)
                </label>
                <input
                  type="number"
                  value={absFloor}
                  onChange={(e) => setAbsFloor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Human Approval Threshold (₹)</label>
                <input
                  type="number"
                  value={approvalThreshold}
                  onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPolicyProduct(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-in Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
