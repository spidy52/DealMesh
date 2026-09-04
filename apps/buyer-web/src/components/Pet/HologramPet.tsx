import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, Mic, Volume2, ShieldCheck, Settings, Bot, ChevronRight, X, Radio, Eye, Zap, Layers } from 'lucide-react';
import { PetData, api } from '../../services/api';
import { wsClient } from '../../services/websocket';

interface HologramPetProps {
  pet: PetData;
  onPetUpdate: (pet: PetData) => void;
  onVoiceTrigger: () => void;
  onOpenPolicy: () => void;
  isHologramActive: boolean;
  onToggleHologram: () => void;
}

export const HologramPet: React.FC<HologramPetProps> = ({
  pet,
  onPetUpdate,
  onVoiceTrigger,
  onOpenPolicy,
  isHologramActive,
  onToggleHologram,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pet.name);
  const [editPersonality, setEditPersonality] = useState(pet.personality);

  // Sync WebSocket state
  useEffect(() => {
    const unsubState = wsClient.on('pet.state_changed', (data: any) => {
      onPetUpdate({ ...pet, state: data.state, current_thought: data.current_thought || pet.current_thought });
    });
    const unsubSearch = wsClient.on('search.started', () => {
      onPetUpdate({ ...pet, state: 'SEARCHING', current_thought: 'Projecting 12-store multi-market scan...' });
    });
    const unsubSearchEnd = wsClient.on('search.completed', () => {
      onPetUpdate({ ...pet, state: 'COMPARING', current_thought: 'Holographic trust matrix rendered!' });
    });
    const unsubNegot = wsClient.on('negotiation.started', () => {
      onPetUpdate({ ...pet, state: 'NEGOTIATING', current_thought: 'Autonomous DMCP negotiation with TitanBot engaged...' });
    });
    const unsubPay = wsClient.on('payment.started', () => {
      onPetUpdate({ ...pet, state: 'PAYING', current_thought: 'Encrypting Razorpay Test Mode payload...' });
    });
    const unsubSuccess = wsClient.on('payment.succeeded', () => {
      onPetUpdate({ ...pet, state: 'COMPLETED', current_thought: 'Transaction Passport sealed & verified!' });
    });

    return () => {
      unsubState();
      unsubSearch();
      unsubSearchEnd();
      unsubNegot();
      unsubPay();
      unsubSuccess();
    };
  }, [pet, onPetUpdate]);

  const toggleSleep = async () => {
    const nextState = pet.state === 'SLEEPING' ? 'LISTENING' : 'SLEEPING';
    const nextThought = nextState === 'SLEEPING' ? 'Zzz... standing by for your next query' : 'Hologram projector online! How can I assist?';
    await api.updatePetState(nextState, nextThought);
    onPetUpdate({ ...pet, state: nextState, current_thought: nextThought });
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updatePet({ name: editName, personality: editPersonality });
    onPetUpdate({ ...pet, name: editName, personality: editPersonality });
    setIsEditing(false);
  };

  return (
    <div className="relative z-30 flex flex-col items-center">
      {/* Hologram Projection Cone (When Active) */}
      <AnimatePresence>
        {isHologramActive && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.4 }}
            className="w-80 h-36 hologram-beam pointer-events-none origin-bottom relative -mb-4 flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 hologram-grid opacity-30 animate-pulse" />
            <motion.div
              animate={{ y: [-20, 40] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Pet Pod Card (Bottom-Middle Luxury Dock) */}
      <motion.div
        className="liquid-glass-glow rounded-3xl p-4 sm:px-6 sm:py-4 shadow-2xl relative overflow-hidden flex items-center gap-4 sm:gap-6 iridescent-border"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Ambient background glow */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Reference Image Robot Pet with Hover Physics */}
        <motion.div
          onClick={toggleSleep}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          className="relative cursor-pointer shrink-0 select-none group"
        >
          {/* Energy Ring */}
          <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 blur-md group-hover:from-cyan-400 group-hover:to-purple-500 transition-all" />

          {/* Character Container */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0C111F]/90 border border-cyan-500/40 flex items-center justify-center p-2 relative overflow-hidden shadow-inner">
            <motion.img
              src="/omni-pet.png"
              alt="Omni AI Pet"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] [image-rendering:pixelated]"
              animate={
                pet.state === 'SLEEPING'
                  ? { y: [0, 2, 0], opacity: 0.75 }
                  : { y: [0, -6, 0], rotate: [0, 1.5, -1.5, 0] }
              }
              transition={{ repeat: Infinity, duration: pet.state === 'SLEEPING' ? 3.5 : 2.2, ease: 'easeInOut' }}
            />

            {/* Glowing Eye Visor Overlay Effect */}
            {pet.state !== 'SLEEPING' && (
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="absolute top-4 left-5 right-5 h-3 bg-cyan-400/20 blur-sm rounded-full pointer-events-none"
              />
            )}
          </div>

          {/* Status Indicator Pip */}
          <span
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0C111F] ${
              pet.state === 'SLEEPING' ? 'bg-slate-400' : 'bg-cyan-400 shadow-[0_0_10px_#38BDF8] animate-pulse'
            }`}
          />
        </motion.div>

        {/* Pet Dialogue & Information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>{pet.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
                {pet.state}
              </span>
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="text-slate-400 hover:text-cyan-400 p-1 rounded transition"
              title="Configure Persona"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-300 font-mono italic truncate mt-1">
            "{pet.current_thought || 'Scanning commerce network...'}"
          </p>

          {/* Controls */}
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={onToggleHologram}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isHologramActive
                  ? 'bg-cyan-500 text-[#070A11] shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isHologramActive ? 'Hologram Active' : 'Show Hologram'}</span>
            </button>

            <button
              onClick={onVoiceTrigger}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice</span>
            </button>

            <button
              onClick={toggleSleep}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold"
            >
              {pet.state === 'SLEEPING' ? 'Wake' : 'Sleep'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Persona Customizer Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="liquid-glass rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-cyan-500/40"
            >
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">Customize Your AI Agent</h3>
              <p className="text-xs text-slate-400 mb-5">Configure persona identity & autonomous speech tone.</p>

              <form onSubmit={handleSavePet} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Agent Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080C16] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Demeanor & Tone</label>
                  <select
                    value={editPersonality}
                    onChange={(e) => setEditPersonality(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#080C16] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Playful">Playful Sci-Fi Companion</option>
                    <option value="Sharp">Sharp & Analytical Strategist</option>
                    <option value="Protective">Cautious & Protective Negotiator</option>
                    <option value="Minimalist">Minimalist Precision Engine</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20"
                  >
                    Save Persona
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
