import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Volume2, Mic, RotateCcw, Check, Sparkles, X, Sliders, Play, Save } from 'lucide-react';
import { PixelPet } from './PixelPet';
import { api, UserSettingsData } from '../../services/api';

interface BotCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentSettings: UserSettingsData;
  onSettingsSaved: (updated: UserSettingsData) => void;
}

export const ACCENT_COLOR_PRESETS = [
  { name: 'Cyber Cyan (Default)', hex: '#00F0FF', description: 'Original DealMesh Holographic Glow' },
  { name: 'Matrix Lemon', hex: '#CCFF00', description: 'Electric High-Contrast Cyber Lime' },
  { name: 'Hyper Violet', hex: '#A855F7', description: 'Deep Neon Ultraviolet' },
  { name: 'Crimson Rose', hex: '#F43F5E', description: 'Warm Vibrant Pulse' },
  { name: 'Solar Amber', hex: '#F59E0B', description: 'Golden Horizon Luminescence' },
  { name: 'Emerald Neo', hex: '#10B981', description: 'Sleek Cybernetic Green' },
];

export const BotCustomizerModal: React.FC<BotCustomizerModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentSettings,
  onSettingsSaved,
}) => {
  const [accentColor, setAccentColor] = useState(currentSettings?.accent_color || '#00F0FF');
  const [voiceName, setVoiceName] = useState(currentSettings?.voice_name || 'default');
  const [pitch, setPitch] = useState(currentSettings?.voice_pitch ?? 1.0);
  const [rate, setRate] = useState(currentSettings?.voice_rate ?? 1.0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (currentSettings) {
      setAccentColor(currentSettings.accent_color || '#00F0FF');
      setVoiceName(currentSettings.voice_name || 'default');
      setPitch(currentSettings.voice_pitch ?? 1.0);
      setRate(currentSettings.voice_rate ?? 1.0);
    }
  }, [currentSettings, isOpen]);

  // Load browser speech synthesis voices
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

  if (!isOpen) return null;

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const phrase = `Greetings! I am Omni, your autonomous deal agent. Visual accents set to ${
      ACCENT_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === accentColor.toLowerCase())?.name || 'custom color'
    }. All systems ready!`;
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.pitch = pitch;
    utterance.rate = rate;

    if (voiceName !== 'default') {
      const match = availableVoices.find((v) => v.name === voiceName);
      if (match) utterance.voice = match;
    }

    setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetToDefault = () => {
    setAccentColor('#00F0FF');
    setVoiceName('default');
    setPitch(1.0);
    setRate(1.0);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedPayload: UserSettingsData = {
        user_id: userId,
        accent_color: accentColor,
        eye_color: accentColor,
        voice_name: voiceName,
        voice_pitch: pitch,
        voice_rate: rate,
        dock_x_percent: currentSettings?.dock_x_percent ?? 0.85,
        dock_y_percent: currentSettings?.dock_y_percent ?? 0.82,
      };

      await api.updateSettings(updatedPayload, userId);
      onSettingsSaved(updatedPayload);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to save bot settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-[#0B0B0B] border border-[#222222] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1A1A1A] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300"
            style={{
              borderColor: `${accentColor}55`,
              backgroundColor: `${accentColor}15`,
              boxShadow: `0 0 20px ${accentColor}25`,
            }}
          >
            <Palette className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Bot Customizer (Omni)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                User: {userId}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Customize bot eye colors, LED accent highlights, and speech voice personality.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Live 3D Bot Preview */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#121212] border border-[#202020] relative overflow-hidden">
            <div
              className="absolute -inset-4 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
              style={{ background: accentColor }}
            />

            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
              Live Visual Preview
            </span>

            <div className="py-2">
              <PixelPet
                emotion="HAPPY"
                state="SEARCHING"
                speechText="Looking sharp!"
                size="lg"
                accentColor={accentColor}
              />
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs font-bold text-white block">Omni Autonomous Companion</span>
              <span className="text-[10px] font-mono text-slate-400">
                Body: Classic Titanium / Eyes: {accentColor}
              </span>
            </div>
          </div>

          {/* Right Column: Customization Controls */}
          <div className="md:col-span-7 space-y-6">
            {/* 1. Eye & Visor Accent Colors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  Eye & LED Accent Glow
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">{accentColor}</span>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    title="Choose custom hex color"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ACCENT_COLOR_PRESETS.map((preset) => {
                  const isSelected = accentColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setAccentColor(preset.hex)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'border-white bg-[#1C1C1C] shadow-sm'
                          : 'border-[#222222] bg-[#141414] hover:bg-[#1A1A1A]'
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
                        <p className="text-[11px] font-bold text-white truncate">{preset.name.split(' ')[0]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Voice Personality & Sliders */}
            <div className="space-y-3 pt-2 border-t border-[#202020]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-lemon-400" />
                  Bot Voice Personality
                </label>
                <button
                  type="button"
                  onClick={handleTestVoice}
                  disabled={isPlayingVoice}
                  className="px-2.5 py-1 rounded-lg bg-lemon-500/10 border border-lemon-500/30 hover:bg-lemon-500/20 text-lemon-400 text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-lemon-400" />
                  <span>{isPlayingVoice ? 'Testing...' : 'Test Voice'}</span>
                </button>
              </div>

              {/* Voice Selector */}
              <div>
                <select
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-xl text-white text-xs focus:outline-none focus:border-lemon-400 font-mono"
                >
                  <option value="default">System Default Voice (Optimal Natural)</option>
                  {availableVoices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Voice Pitch</span>
                  <span>{pitch.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-lemon-400 h-1.5 bg-[#202020] rounded-lg cursor-pointer"
                />
              </div>

              {/* Rate / Speed Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Speech Speed</span>
                  <span>{rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-lemon-400 h-1.5 bg-[#202020] rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-[#202020] flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-mono px-3 py-2 rounded-xl hover:bg-[#161616]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#2A2A2A] text-slate-300 hover:text-white hover:bg-[#181818] text-xs font-bold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-black text-xs flex items-center gap-2 transition shadow-[0_0_20px_rgba(204,255,0,0.2)] disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
