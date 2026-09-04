import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, Mic, Volume2, ShieldCheck, Settings, Bot, ChevronRight, X } from 'lucide-react';
import { PetData, api } from '../../services/api';
import { wsClient } from '../../services/websocket';

interface DesktopPetProps {
  pet: PetData;
  onPetUpdate: (pet: PetData) => void;
  onVoiceTrigger: () => void;
  onOpenPolicy: () => void;
}

export const DesktopPet: React.FC<DesktopPetProps> = ({
  pet,
  onPetUpdate,
  onVoiceTrigger,
  onOpenPolicy,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(pet.name);
  const [editSpecies, setEditSpecies] = useState(pet.species);
  const [editPersonality, setEditPersonality] = useState(pet.personality);

  // Sync WebSocket state
  useEffect(() => {
    const unsubState = wsClient.on('pet.state_changed', (data: any) => {
      onPetUpdate({ ...pet, state: data.state, current_thought: data.current_thought || pet.current_thought });
    });
    const unsubSearch = wsClient.on('search.started', () => {
      onPetUpdate({ ...pet, state: 'SEARCHING', current_thought: 'Searching 12 stores concurrently across the market...' });
    });
    const unsubSearchEnd = wsClient.on('search.completed', () => {
      onPetUpdate({ ...pet, state: 'COMPARING', current_thought: 'Evaluating trust and ranking market offers...' });
    });
    const unsubNegot = wsClient.on('negotiation.started', () => {
      onPetUpdate({ ...pet, state: 'NEGOTIATING', current_thought: 'Autonomous DMCP negotiation with TitanBot in progress...' });
    });
    const unsubApproval = wsClient.on('approval.required', (data: any) => {
      onPetUpdate({ ...pet, state: 'WAITING_FOR_APPROVAL', current_thought: `Offer ₹${data.merchant_counter} exceeds automatic cap. Waiting for your approval!` });
    });
    const unsubPay = wsClient.on('payment.started', () => {
      onPetUpdate({ ...pet, state: 'PAYING', current_thought: 'Executing secure Razorpay Test Mode settlement...' });
    });
    const unsubSuccess = wsClient.on('payment.succeeded', () => {
      onPetUpdate({ ...pet, state: 'COMPLETED', current_thought: 'Deal completed & verified in Transaction Passport!' });
      setTimeout(() => {
        onPetUpdate({ ...pet, state: 'SLEEPING', current_thought: 'Zzz... dreaming of great deals' });
      }, 6000);
    });
    const unsubRecover = wsClient.on('recovery.started', (data: any) => {
      onPetUpdate({ ...pet, state: 'RECOVERING', current_thought: `Autonomous Recovery Agent diagnosing failure (Attempt ${data.attempt})...` });
    });

    return () => {
      unsubState();
      unsubSearch();
      unsubSearchEnd();
      unsubNegot();
      unsubApproval();
      unsubPay();
      unsubSuccess();
      unsubRecover();
    };
  }, [pet, onPetUpdate]);

  const toggleSleep = async () => {
    const nextState = pet.state === 'SLEEPING' ? 'LISTENING' : 'SLEEPING';
    const nextThought = nextState === 'SLEEPING' ? 'Zzz... resting until your next request' : 'Ready! What should I find for you?';
    await api.updatePetState(nextState, nextThought);
    onPetUpdate({ ...pet, state: nextState, current_thought: nextThought });
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await api.updatePet({
      name: editName,
      species: editSpecies,
      personality: editPersonality,
    });
    onPetUpdate({
      ...pet,
      name: editName,
      species: editSpecies,
      personality: editPersonality,
    });
    setIsEditing(false);
  };

  // State badge styling
  const getStateBadge = () => {
    switch (pet.state) {
      case 'SLEEPING':
        return { label: 'Sleeping', icon: <Moon className="w-3.5 h-3.5 text-blue-400" />, bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'LISTENING':
        return { label: 'Listening', icon: <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'SEARCHING':
        return { label: 'Searching 12 Stores', icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />, bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'NEGOTIATING':
        return { label: 'AI Negotiating', icon: <Bot className="w-3.5 h-3.5 text-orange-400 animate-bounce" />, bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' };
      case 'COMPARING':
        return { label: 'Ranking Trust & Value', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'WAITING_FOR_APPROVAL':
        return { label: 'Approval Required', icon: <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-ping" />, bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'PAYING':
        return { label: 'Razorpay Checkout', icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />, bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'RECOVERING':
        return { label: 'Auto Recovery', icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400 animate-pulse" />, bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'COMPLETED':
        return { label: 'Deal Completed', icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />, bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: pet.state, icon: <Bot className="w-3.5 h-3.5" />, bg: 'bg-slate-700 text-slate-300' };
    }
  };

  const badge = getStateBadge();

  return (
    <div className="relative">
      {/* Pet Card */}
      <motion.div
        className="glass-panel rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Glow ambient */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Animated Pet Avatar SVG */}
            <motion.div
              className="relative cursor-pointer select-none"
              onClick={toggleSleep}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-orange-500/20">
                <div className="w-full h-full bg-[#121826] rounded-[14px] flex items-center justify-center relative overflow-hidden">
                  {/* SVG Fox Graphic */}
                  <motion.svg
                    viewBox="0 0 100 100"
                    className="w-12 h-12"
                    animate={
                      pet.state === 'SLEEPING'
                        ? { scale: [0.95, 1, 0.95] }
                        : pet.state === 'NEGOTIATING' || pet.state === 'SEARCHING'
                        ? { y: [0, -3, 0], rotate: [0, 2, -2, 0] }
                        : { y: [0, -2, 0] }
                    }
                    transition={{ repeat: Infinity, duration: pet.state === 'SLEEPING' ? 3.5 : 2 }}
                  >
                    {/* Ears */}
                    <polygon points="20,40 10,15 40,28" fill="#F97316" />
                    <polygon points="80,40 90,15 60,28" fill="#F97316" />
                    <polygon points="22,38 15,20 36,30" fill="#FEF08A" />
                    <polygon points="78,38 85,20 64,30" fill="#FEF08A" />
                    {/* Face Base */}
                    <ellipse cx="50" cy="55" rx="35" ry="30" fill="#EA580C" />
                    <polygon points="50,75 22,45 78,45" fill="#FFFFFF" />
                    {/* Eyes */}
                    {pet.state === 'SLEEPING' ? (
                      <>
                        <path d="M 32 50 Q 38 56 44 50" stroke="#1E293B" strokeWidth="3" fill="transparent" strokeLinecap="round" />
                        <path d="M 56 50 Q 62 56 68 50" stroke="#1E293B" strokeWidth="3" fill="transparent" strokeLinecap="round" />
                      </>
                    ) : (
                      <>
                        <ellipse cx="38" cy="48" rx="4" ry="5" fill="#0F172A" />
                        <ellipse cx="62" cy="48" rx="4" ry="5" fill="#0F172A" />
                        <circle cx="39.5" cy="46.5" r="1.5" fill="#FFFFFF" />
                        <circle cx="63.5" cy="46.5" r="1.5" fill="#FFFFFF" />
                      </>
                    )}
                    {/* Nose */}
                    <polygon points="50,72 45,64 55,64" fill="#0F172A" />
                  </motion.svg>
                </div>
              </div>

              {/* Status Dot */}
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#121826] ${
                  pet.state === 'SLEEPING' ? 'bg-blue-400' : 'bg-emerald-400 animate-pulse'
                }`}
              />
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{pet.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {pet.species} • {pet.personality}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-500 hover:text-indigo-400 p-1 rounded-md transition"
                  title="Rename Pet / Customize"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* State Badge */}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
                  {badge.icon}
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onVoiceTrigger}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition text-xs font-semibold shadow-sm"
              title="Voice Request"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={toggleSleep}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-xs font-semibold"
            >
              {pet.state === 'SLEEPING' ? 'Wake' : 'Sleep'}
            </button>
          </div>
        </div>

        {/* Live Thought Bubble */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-300">
          <span className="text-indigo-400 font-bold">Thought:</span>
          <span className="italic text-slate-300/90 font-mono flex-1">{pet.current_thought || 'Watching the market for great deals...'}</span>
        </div>
      </motion.div>

      {/* Edit Pet Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121826] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">Customize Your AI Pet</h3>
              <p className="text-xs text-slate-400 mb-5">
                Personalize your autonomous buyer agent's identity and demeanor.
              </p>

              <form onSubmit={handleSavePet} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pet Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Omni, Mochi, Milo, Nova, Kiko"
                    className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Species</label>
                    <select
                      value={editSpecies}
                      onChange={(e) => setEditSpecies(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Fox">🦊 Fox</option>
                      <option value="Cat">🐱 Cat</option>
                      <option value="Dog">🐶 Dog</option>
                      <option value="Owl">🦉 Owl</option>
                      <option value="Dragon">🐲 Dragon</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Personality</label>
                    <select
                      value={editPersonality}
                      onChange={(e) => setEditPersonality(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Playful">Playful & Dynamic</option>
                      <option value="Sharp">Sharp & Analytical</option>
                      <option value="Protective">Cautious & Protective</option>
                      <option value="Calm">Calm & Minimalist</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                  >
                    Save Identity
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
