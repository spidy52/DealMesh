import React from 'react';
import { motion } from 'framer-motion';
import { PetConfig, PetSpecies, PetPersonality } from '../state/petStore';
import { X, Settings as SettingsIcon, Play, Shield, Wifi, Sparkles } from 'lucide-react';

interface SettingsProps {
  config: PetConfig;
  onUpdateConfig: (newConfig: PetConfig) => void;
  onClose: () => void;
  onTriggerDemo: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  config,
  onUpdateConfig,
  onClose,
  onTriggerDemo,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-96 bg-[#090E1D]/98 backdrop-blur-3xl rounded-3xl p-5 border border-cyan-500/40 shadow-2xl text-slate-200 text-xs select-none pointer-events-auto z-50 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white text-sm">Omni Settings</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 1. PET IDENTITY */}
      <div className="space-y-3 pb-3 border-b border-slate-800">
        <div className="font-mono font-bold text-cyan-300 text-[11px] uppercase">Pet Identity</div>
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Pet Name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => onUpdateConfig({ ...config, name: e.target.value })}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Species</label>
            <select
              value={config.species}
              onChange={(e) => onUpdateConfig({ ...config, species: e.target.value as PetSpecies })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="Fox">Fox (Default)</option>
              <option value="Cat">Cat</option>
              <option value="Dog">Dog</option>
              <option value="Custom">Custom Robot</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Personality</label>
            <select
              value={config.personality}
              onChange={(e) => onUpdateConfig({ ...config, personality: e.target.value as PetPersonality })}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="Playful">Playful</option>
              <option value="Professional">Professional</option>
              <option value="Friendly">Friendly</option>
              <option value="Minimal">Minimal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Size</label>
          <div className="flex gap-2">
            {(['Small', 'Medium', 'Large'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onUpdateConfig({ ...config, size: s })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  config.size === s
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. BEHAVIOR */}
      <div className="space-y-2.5 py-3 border-b border-slate-800">
        <div className="font-mono font-bold text-cyan-300 text-[11px] uppercase">Desktop Behavior</div>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-slate-300">Always on Top</span>
          <input
            type="checkbox"
            checked={config.alwaysOnTop}
            onChange={(e) => onUpdateConfig({ ...config, alwaysOnTop: e.target.checked })}
            className="w-4 h-4 accent-cyan-500"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-slate-300">Click-through while Sleeping</span>
          <input
            type="checkbox"
            checked={config.allowClickThroughWhileSleeping}
            onChange={(e) =>
              onUpdateConfig({ ...config, allowClickThroughWhileSleeping: e.target.checked })
            }
            className="w-4 h-4 accent-cyan-500"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-slate-300">Start with Windows</span>
          <input
            type="checkbox"
            checked={config.startWithWindows}
            onChange={(e) => onUpdateConfig({ ...config, startWithWindows: e.target.checked })}
            className="w-4 h-4 accent-cyan-500"
          />
        </label>
      </div>

      {/* 3. DEMO MODE & DIAGNOSTICS */}
      <div className="pt-3 space-y-2">
        <div className="font-mono font-bold text-cyan-300 text-[11px] uppercase">Test & Demo</div>
        <button
          onClick={() => {
            onTriggerDemo();
            onClose();
          }}
          className="w-full py-2 px-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/25 active:scale-95 transition"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Demo: Find Watch (₹2,299)</span>
        </button>
      </div>
    </motion.div>
  );
};
