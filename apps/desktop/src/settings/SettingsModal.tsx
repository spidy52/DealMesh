import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Sliders, Monitor, Volume2, ShieldCheck, Footprints, MousePointer } from 'lucide-react';
import { AssistantSettings } from '../types/assistant';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AssistantSettings;
  onClose: () => void;
  onSave: (newSettings: AssistantSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<AssistantSettings>({ ...settings });

  const handleChange = <K extends keyof AssistantSettings>(key: K, value: AssistantSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-full max-w-md bg-[#141221] border border-red-500/30 shadow-2xl rounded-2xl p-5 text-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-red-400" />
                <h2 className="font-bold text-base tracking-wide">Assistant Settings</h2>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Assistant Name</label>
                <input
                  type="text"
                  value={localSettings.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full bg-black/40 border border-white/15 focus:border-red-500/80 rounded-xl px-3 py-2 text-white outline-none"
                  placeholder="Omi"
                />
              </div>

              {/* Character Scale */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-gray-300 font-semibold">Scale / Size</label>
                  <span className="text-red-400 font-mono font-bold">{localSettings.scale}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.5"
                  value={localSettings.scale}
                  onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Compact (1x)</span>
                  <span>Normal (2x)</span>
                  <span>Large (3x)</span>
                </div>
              </div>

              {/* Personality */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Personality</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['friendly', 'sassy', 'hyper', 'stoic'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleChange('personality', p)}
                      className={`py-1.5 px-3 rounded-xl border text-center capitalize font-medium transition ${
                        localSettings.personality === p
                          ? 'bg-red-600/30 border-red-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10 my-3" />

              {/* Wandering */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="font-semibold text-gray-200">Autonomous Wandering</p>
                    <p className="text-[10px] text-gray-400">Let Omi roam your desktop when idle</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.wanderingEnabled}
                  onChange={(e) => handleChange('wanderingEnabled', e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Always on Top */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="font-semibold text-gray-200">Always on Top</p>
                    <p className="text-[10px] text-gray-400">Stay visible above other open applications</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.alwaysOnTop}
                  onChange={(e) => handleChange('alwaysOnTop', e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Click-through while sleeping */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="font-semibold text-gray-200">Click-through When Sleeping</p>
                    <p className="text-[10px] text-gray-400">Let mouse clicks pass directly to background apps</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.clickThroughWhileSleeping}
                  onChange={(e) => handleChange('clickThroughWhileSleeping', e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Start with Windows */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="font-semibold text-gray-200">Start With Windows</p>
                    <p className="text-[10px] text-gray-400">Auto-start companion upon system login</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.startWithWindows}
                  onChange={(e) => handleChange('startWithWindows', e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Reduce Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="font-semibold text-gray-200">Reduce Motion</p>
                    <p className="text-[10px] text-gray-400">Disable floating bobs and idle physics</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.reduceMotion}
                  onChange={(e) => handleChange('reduceMotion', e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="font-semibold text-gray-200">Sound Effects</p>
                    <p className="text-[10px] text-gray-400">Play pleasant chimes on wake/reactions</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.soundEnabled}
                  onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                  className="w-4 h-4 accent-red-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-red-900/50"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
