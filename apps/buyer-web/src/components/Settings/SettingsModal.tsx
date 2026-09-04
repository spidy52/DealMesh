import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Palette,
  Monitor,
  Volume2,
  User,
  Shield,
  X,
  Check,
  RotateCcw,
  Save,
  Play,
  LogOut,
  Sparkles,
  Compass,
  Key,
  Sliders,
  ArrowRight
} from 'lucide-react';
import { PixelPet } from '../Pet/PixelPet';
import { ACCENT_COLOR_PRESETS } from '../Pet/BotCustomizerModal';
import { api, UserSettingsData, BuyerPolicyData } from '../../services/api';
import { AuthUserData } from '../Auth/AuthModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUserData | null;
  onUserUpdate: (user: AuthUserData | null) => void;
  currentSettings: UserSettingsData;
  onSettingsUpdate: (updated: UserSettingsData) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  currentSettings,
  onSettingsUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'position' | 'voice' | 'account' | 'policy'>('appearance');

  // Appearance state
  const [accentColor, setAccentColor] = useState(currentSettings?.accent_color || '#00F0FF');

  // Position state
  const [coords, setCoords] = useState<{ xPercent: number; yPercent: number }>({
    xPercent: currentSettings?.dock_x_percent ?? 0.85,
    yPercent: currentSettings?.dock_y_percent ?? 0.82,
  });

  // Voice state
  const [voiceName, setVoiceName] = useState(currentSettings?.voice_name || 'default');
  const [pitch, setPitch] = useState(currentSettings?.voice_pitch ?? 1.0);
  const [rate, setRate] = useState(currentSettings?.voice_rate ?? 1.0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Account state
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Policy state
  const [targetPrice, setTargetPrice] = useState(2000);
  const [autoCap, setAutoCap] = useState(2700);
  const [absMax, setAbsMax] = useState(3000);

  // Save / status states
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Dragging on virtual monitor
  const monitorRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync incoming settings
  useEffect(() => {
    if (currentSettings) {
      setAccentColor(currentSettings.accent_color || '#00F0FF');
      setCoords({
        xPercent: currentSettings.dock_x_percent ?? 0.85,
        yPercent: currentSettings.dock_y_percent ?? 0.82,
      });
      setVoiceName(currentSettings.voice_name || 'default');
      setPitch(currentSettings.voice_pitch ?? 1.0);
      setRate(currentSettings.voice_rate ?? 1.0);
    }
  }, [currentSettings, isOpen]);

  // Load available speech synthesis voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices();
        setAvailableVoices(v.filter((x) => x.lang.startsWith('en')));
      }
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Fetch policy
  useEffect(() => {
    if (!isOpen) return;
    const fetchPolicy = async () => {
      try {
        const p = await api.getPolicy();
        if (p) {
          setTargetPrice(p.target_price);
          setAutoCap(p.auto_negotiation_cap);
          setAbsMax(p.absolute_max);
        }
      } catch (e) {}
    };
    fetchPolicy();
  }, [isOpen, currentUser?.id]);

  if (!isOpen) return null;

  // Modal Close: discard unsaved edits and reset to saved settings
  const handleModalClose = () => {
    if (currentSettings) {
      setAccentColor(currentSettings.accent_color || '#00F0FF');
      setCoords({
        xPercent: currentSettings.dock_x_percent ?? 0.85,
        yPercent: currentSettings.dock_y_percent ?? 0.82,
      });
      setVoiceName(currentSettings.voice_name || 'default');
      setPitch(currentSettings.voice_pitch ?? 1.0);
      setRate(currentSettings.voice_rate ?? 1.0);
    }
    onClose();
  };

  // Virtual monitor pointer drag logic (preview only until saved)
  const updateFromPointer = (clientX: number, clientY: number) => {
    if (!monitorRef.current) return;
    const rect = monitorRef.current.getBoundingClientRect();
    const x = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    const y = Math.max(0.05, Math.min(0.92, (clientY - rect.top) / rect.height));
    const newCoords = { xPercent: parseFloat(x.toFixed(3)), yPercent: parseFloat(y.toFixed(3)) };
    setCoords(newCoords);
    return newCoords;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Test Speech Synthesis
  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Greetings! I am Omni, your autonomous AI commerce companion.");
    u.pitch = pitch;
    u.rate = rate;
    if (voiceName !== 'default') {
      const match = availableVoices.find((v) => v.name === voiceName);
      if (match) u.voice = match;
    }
    setIsPlayingVoice(true);
    u.onend = () => setIsPlayingVoice(false);
    u.onerror = () => setIsPlayingVoice(false);
    window.speechSynthesis.speak(u);
  };

  // Save Settings - EXPLICIT COMMIT TO DATABASE & REAL-TIME BROADCAST TO COMPANIONS
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const userId = currentUser?.id || 'user_buyer_default';
      const payload: UserSettingsData = {
        user_id: userId,
        accent_color: accentColor,
        eye_color: accentColor,
        voice_name: voiceName,
        voice_pitch: pitch,
        voice_rate: rate,
        dock_x_percent: coords.xPercent,
        dock_y_percent: coords.yPercent,
      };

      // 1. Commit appearance & voice settings to backend (broadcasts to desktop bot & web via WS)
      await api.updateSettings(payload, userId);

      // 2. Commit dock coordinates
      await fetch('http://localhost:8000/api/pet/dock-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_percent: coords.xPercent,
          y_percent: coords.yPercent,
          user_id: userId,
        }),
      });

      // 3. Update policy
      await api.updatePolicy({
        target_price: targetPrice,
        auto_negotiation_cap: autoCap,
        absolute_max: absMax,
      });

      // 4. Update parent app state
      onSettingsUpdate(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (authTab === 'signup') {
        const res = await api.registerBuyer(authName.trim() || 'Buyer', authEmail.trim());
        const user: AuthUserData = {
          id: res.user_id || `user_${Date.now()}`,
          name: authName.trim() || 'New Buyer',
          email: authEmail.trim(),
          role: 'buyer',
        };
        localStorage.setItem('dealmesh_user', JSON.stringify(user));
        onUserUpdate(user);
      } else {
        const res = await api.login(authEmail.trim());
        const user: AuthUserData = {
          id: res.id || `user_${Date.now()}`,
          name: res.name || (authEmail.split('@')[0] || 'Buyer User'),
          email: res.email || authEmail.trim(),
          role: res.role || 'buyer',
        };
        localStorage.setItem('dealmesh_user', JSON.stringify(user));
        onUserUpdate(user);
      }
    } catch (e) {
      console.error('Auth error:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-4xl bg-[#0C0C0C] border border-[#222222] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Left Sidebar Tabs */}
        <div className="w-full md:w-64 bg-[#080808] border-b md:border-b-0 md:border-r border-[#1C1C1C] p-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* Brand / Header */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300"
                style={{
                  borderColor: `${accentColor}55`,
                  backgroundColor: `${accentColor}15`,
                  boxShadow: `0 0 15px ${accentColor}25`,
                }}
              >
                <Settings className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <h3 className="text-base font-black text-white tracking-tight">Settings Hub</h3>
                <p className="text-[11px] font-mono text-slate-400">DealMesh Engine</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'appearance'
                    ? 'bg-[#181818] text-white border border-[#2A2A2A]'
                    : 'text-slate-400 hover:text-white hover:bg-[#121212]'
                }`}
              >
                <Palette className="w-4 h-4" style={{ color: accentColor }} />
                <span>Bot Appearance</span>
                <span
                  className="w-2 h-2 rounded-full ml-auto"
                  style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
                />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('position')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'position'
                    ? 'bg-[#181818] text-white border border-[#2A2A2A]'
                    : 'text-slate-400 hover:text-white hover:bg-[#121212]'
                }`}
              >
                <Monitor className="w-4 h-4 text-lemon-400" />
                <span>Screen Position</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'voice'
                    ? 'bg-[#181818] text-white border border-[#2A2A2A]'
                    : 'text-slate-400 hover:text-white hover:bg-[#121212]'
                }`}
              >
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Voice & Speech</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'account'
                    ? 'bg-[#181818] text-white border border-[#2A2A2A]'
                    : 'text-slate-400 hover:text-white hover:bg-[#121212]'
                }`}
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span>User Account</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('policy')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'policy'
                    ? 'bg-[#181818] text-white border border-[#2A2A2A]'
                    : 'text-slate-400 hover:text-white hover:bg-[#121212]'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Policy Firewall</span>
              </button>
            </nav>
          </div>

          {/* User Badge in Sidebar */}
          <div className="pt-4 border-t border-[#1C1C1C] space-y-2">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Profile</div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <div className="w-6 h-6 rounded-full bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[10px] text-lemon-400 font-mono">
                {currentUser?.name?.slice(0, 1) || 'U'}
              </div>
              <span className="truncate">{currentUser?.name || 'Guest User'}</span>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto">
          <div>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[#1C1C1C] mb-6">
              <div>
                <h4 className="text-lg font-black text-white capitalize tracking-tight">
                  {activeTab === 'appearance' && 'Bot Appearance & Accent Color'}
                  {activeTab === 'position' && 'Desktop Bot Screen Dock Position'}
                  {activeTab === 'voice' && 'Voice Personality & Audio Synthesis'}
                  {activeTab === 'account' && 'Account Profiles & User IDs'}
                  {activeTab === 'policy' && 'Autonomous Negotiation Policy'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeTab === 'appearance' && 'Changes reflect on both floating Desktop Bot and Web Companion in real-time'}
                  {activeTab === 'position' && 'Drag Omni to your preferred resting dock spot on screen'}
                  {activeTab === 'voice' && 'Configure speech synthesizer voice, pitch and rate'}
                  {activeTab === 'account' && 'Each user has separated settings and custom preferences stored per User ID'}
                  {activeTab === 'policy' && 'Hard spending guardrails enforced autonomously by your buyer agent'}
                </p>
              </div>

              <button
                onClick={handleModalClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#1C1C1C] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB 1: APPEARANCE */}
            {activeTab === 'appearance' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Live 3D Bot Preview */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#090909] border border-[#1F1F1F] relative overflow-hidden">
                  <div
                    className="absolute -inset-4 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-500"
                    style={{ background: accentColor }}
                  />
                  <div className="py-2">
                    <PixelPet
                      emotion="HAPPY"
                      state="SEARCHING"
                      speechText="Custom visual matrix!"
                      size="lg"
                      accentColor={accentColor}
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-xs font-bold text-white block">Omni Companion</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Metallic Titanium Shell • {accentColor} Visor
                    </span>
                  </div>
                </div>

                {/* Color Selection */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
                      Eye LEDs & Visor Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">{accentColor}</span>
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {ACCENT_COLOR_PRESETS.map((preset) => {
                      const isSelected = accentColor.toLowerCase() === preset.hex.toLowerCase();
                      return (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setAccentColor(preset.hex)}
                          className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                            isSelected
                              ? 'border-white bg-[#1A1A1A] shadow-md'
                              : 'border-[#202020] bg-[#121212] hover:bg-[#181818]'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border shadow-sm shrink-0"
                            style={{
                              backgroundColor: preset.hex,
                              borderColor: isSelected ? '#FFFFFF' : preset.hex,
                              boxShadow: `0 0 10px ${preset.hex}`,
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{preset.name.split(' ')[0]}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: POSITION */}
            {activeTab === 'position' && (
              <div className="space-y-6">
                {/* Virtual Desktop Monitor Display */}
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-xl rounded-2xl bg-slate-900 border-2 border-slate-700 p-2 shadow-2xl">
                    <div
                      ref={monitorRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="relative w-full h-56 bg-[#040813] rounded-xl overflow-hidden cursor-crosshair border border-slate-800 touch-none select-none"
                    >
                      {/* Grid guidelines */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25" />

                      {/* Screen Bezel & Taskbar Indicator */}
                      <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-950/80 border-t border-slate-800 flex items-center px-2">
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Windows Taskbar Dock</span>
                      </div>

                      {/* Mini Virtual Omni Character on Screen */}
                      <div
                        className="absolute flex flex-col items-center pointer-events-none transition-all duration-100 ease-out"
                        style={{
                          left: `${coords.xPercent * 100}%`,
                          top: `${coords.yPercent * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div
                          className="w-7 h-6 rounded-md bg-white border flex items-center justify-center shadow-lg"
                          style={{ borderColor: accentColor }}
                        >
                          <div className="w-5 h-3 rounded bg-slate-950 flex items-center justify-center gap-1">
                            <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                            <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                          </div>
                        </div>
                        <div
                          className="w-8 h-1 rounded-full mt-1"
                          style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-lemon-400" />
                    Quick Dock Presets
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { name: 'Bottom Right (Taskbar)', x: 0.88, y: 0.84 },
                      { name: 'Bottom Left', x: 0.12, y: 0.84 },
                      { name: 'Center Right', x: 0.88, y: 0.50 },
                      { name: 'Floating Center', x: 0.50, y: 0.50 },
                      { name: 'Top Right', x: 0.88, y: 0.15 },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setCoords({ xPercent: p.x, yPercent: p.y })}
                        className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                          coords.xPercent === p.x && coords.yPercent === p.y
                            ? 'bg-lemon-500 text-black border-lemon-400 font-bold'
                            : 'bg-[#141414] text-slate-300 border-[#222222] hover:bg-[#1A1A1A]'
                        }`}
                      >
                        {p.name.split(' ')[0]} {p.name.split(' ')[1] || ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VOICE */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Voice Synthesis Model</span>
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    disabled={isPlayingVoice}
                    className="px-3 py-1.5 rounded-xl bg-lemon-500/10 border border-lemon-500/30 hover:bg-lemon-500/20 text-lemon-400 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-lemon-400" />
                    <span>{isPlayingVoice ? 'Speaking...' : 'Test Voice Audio'}</span>
                  </button>
                </div>

                <div>
                  <select
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#141414] border border-[#262626] rounded-xl text-white text-xs focus:outline-none focus:border-lemon-400 font-mono"
                  >
                    <option value="default">System Default (Natural Conversational)</option>
                    {availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Voice Pitch</span>
                      <span className="text-white font-bold">{pitch.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.4"
                      step="0.05"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full accent-lemon-400 h-2 bg-[#202020] rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>Speaking Speed / Rate</span>
                      <span className="text-white font-bold">{rate.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-full accent-lemon-400 h-2 bg-[#202020] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {currentUser ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-[#141414] border border-[#222222] space-y-2.5 font-mono text-xs">
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
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onUserUpdate(null);
                          localStorage.removeItem('dealmesh_user');
                        }}
                        className="py-2.5 px-4 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-2 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out Profile</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#141414] border border-[#242424]">
                      <button
                        type="button"
                        onClick={() => setAuthTab('signin')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          authTab === 'signin' ? 'bg-lemon-500 text-black font-black' : 'text-slate-400'
                        }`}
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Sign In</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthTab('signup')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          authTab === 'signup' ? 'bg-lemon-500 text-black font-black' : 'text-slate-400'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Create Account</span>
                      </button>
                    </div>

                    <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                      {authTab === 'signup' && (
                        <div>
                          <label className="block text-slate-400 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="e.g. Alex Walker"
                            className="w-full px-3.5 py-2.5 bg-[#141414] border border-[#282828] rounded-xl text-white focus:outline-none focus:border-lemon-400 font-sans"
                            required
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-slate-400 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="e.g. buyer@dealmesh.ai"
                          className="w-full px-3.5 py-2.5 bg-[#141414] border border-[#282828] rounded-xl text-white focus:outline-none focus:border-lemon-400 font-mono"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="w-full py-3 px-4 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-black text-xs transition"
                      >
                        {isAuthLoading ? 'Processing...' : authTab === 'signup' ? 'Register Account' : 'Sign In'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: POLICY */}
            {activeTab === 'policy' && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Target Ideal Price</span>
                    <span className="text-emerald-400 font-bold">₹{targetPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseInt(e.target.value, 10))}
                    className="w-full accent-emerald-400 h-2 bg-[#202020] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Auto-Negotiation Cap (Max automated consent)</span>
                    <span className="text-lemon-400 font-bold">₹{autoCap.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="6000"
                    step="100"
                    value={autoCap}
                    onChange={(e) => setAutoCap(parseInt(e.target.value, 10))}
                    className="w-full accent-lemon-400 h-2 bg-[#202020] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Absolute Maximum Floor (Hard reject if exceeded)</span>
                    <span className="text-rose-400 font-bold">₹{absMax.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="8000"
                    step="100"
                    value={absMax}
                    onChange={(e) => setAbsMax(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-400 h-2 bg-[#202020] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="mt-8 pt-4 border-t border-[#1C1C1C] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setAccentColor('#00F0FF');
                setCoords({ xPercent: 0.85, yPercent: 0.82 });
                setVoiceName('default');
                setPitch(1.0);
                setRate(1.0);
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 rounded-xl border border-[#282828] text-slate-300 hover:text-white text-xs font-bold transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-black text-xs flex items-center gap-2 transition shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Applied Everywhere!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
