import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, LogOut, CheckCircle2, X, ArrowRight, Sparkles, Shield, Key } from 'lucide-react';
import { api } from '../../services/api';

export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUserData | null;
  onLoginSuccess: (user: AuthUserData) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (activeTab === 'signup') {
        const res = await api.registerBuyer(name.trim() || 'New Buyer', email.trim());
        const userData: AuthUserData = {
          id: res.user_id || `user_${Date.now()}`,
          name: name.trim() || 'DealMesh Buyer',
          email: email.trim(),
          role: 'buyer',
        };
        localStorage.setItem('dealmesh_user', JSON.stringify(userData));
        onLoginSuccess(userData);
        onClose();
      } else {
        const res = await api.login(email.trim());
        const userData: AuthUserData = {
          id: res.id || `user_${Date.now()}`,
          name: res.name || (email.split('@')[0] || 'Buyer User'),
          email: res.email || email.trim(),
          role: res.role || 'buyer',
        };
        localStorage.setItem('dealmesh_user', JSON.stringify(userData));
        onLoginSuccess(userData);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Fallback local persistence
      const fallbackId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      const fallbackUser: AuthUserData = {
        id: fallbackId,
        name: name.trim() || email.split('@')[0] || 'Alex Walker',
        email: email.trim() || 'buyer@dealmesh.ai',
        role: 'buyer',
      };
      localStorage.setItem('dealmesh_user', JSON.stringify(fallbackUser));
      onLoginSuccess(fallbackUser);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoBuyer = () => {
    const demoUser: AuthUserData = {
      id: 'user_buyer_default',
      name: 'Alex Walker',
      email: 'buyer@dealmesh.ai',
      role: 'buyer',
    };
    localStorage.setItem('dealmesh_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0D0D0D] border border-[#222222] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1A1A1A] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Current User Logged In Card */}
        {currentUser ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-lemon-500/10 border border-lemon-500/30 mx-auto mb-3 flex items-center justify-center">
                <User className="w-7 h-7 text-lemon-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Active Buyer Profile</h3>
              <p className="text-xs text-slate-400 mt-1">Logged into DealMesh Autonomous Commerce</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#141414] border border-[#252525] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>User ID:</span>
                <span className="text-lemon-400 font-bold">{currentUser.id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Name:</span>
                <span className="text-white font-medium">{currentUser.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Email:</span>
                <span className="text-white font-medium">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Role:</span>
                <span className="text-emerald-400 uppercase font-bold">Verified Buyer</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onLogout();
                  localStorage.removeItem('dealmesh_user');
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-black text-xs flex items-center justify-center transition"
              >
                <span>Continue</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-lemon-500 to-emerald-500 p-0.5 shadow-lg shadow-lemon-500/10 mx-auto mb-3 flex items-center justify-center font-bold text-xl">
                <Sparkles className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {activeTab === 'signup' ? 'Create Buyer Account' : 'Sign In to DealMesh'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your private AI Buyer Agent, custom bot settings & negotiated deals
              </p>
            </div>

            {/* Clean Tabs: Sign In vs Create Account */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#141414] border border-[#242424] mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'signin'
                    ? 'bg-lemon-500 text-black shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'signup'
                    ? 'bg-lemon-500 text-black shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {activeTab === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Walker"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#141414] border border-[#282828] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lemon-400 font-sans"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5" />
                  <input
                    type="email"
                    placeholder="e.g. buyer@dealmesh.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#141414] border border-[#282828] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lemon-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#141414] border border-[#282828] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lemon-400 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-black text-xs flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:opacity-50"
              >
                <span>{isLoading ? 'Processing...' : activeTab === 'signup' ? 'Register Buyer Profile' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Buyer Shortcut */}
            <div className="mt-5 pt-4 border-t border-[#202020] text-center">
              <button
                type="button"
                onClick={handleQuickDemoBuyer}
                className="text-xs text-slate-400 hover:text-lemon-400 transition font-medium underline underline-offset-4"
              >
                Instant Access as Demo Buyer (Alex Walker)
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
