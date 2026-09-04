import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RefreshCw, Zap, Navigation, Radio, Activity, Eye } from 'lucide-react';
import { AssistantState, Direction, EmotionType, Position, ScreenBounds } from '../types/assistant';
import { ALL_DIRECTIONS, ALL_EMOTIONS } from '../assistant/assetLoader';
import { triggerSimulatedAiEvent } from '../events/AssistantEventBus';

interface DebugPanelProps {
  isOpen: boolean;
  state: AssistantState;
  emotion: EmotionType;
  direction: Direction;
  position: Position;
  bounds: ScreenBounds;
  alwaysOnTop: boolean;
  onClose: () => void;
  onSetState: (state: AssistantState, emotion?: EmotionType) => void;
  onSetEmotion: (emotion: EmotionType) => void;
  onSetDirection: (direction: Direction) => void;
  onTriggerWander: () => void;
  onSpeak: (text: string, duration?: number) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  isOpen,
  state,
  emotion,
  direction,
  position,
  bounds,
  alwaysOnTop,
  onClose,
  onSetState,
  onSetEmotion,
  onSetDirection,
  onTriggerWander,
  onSpeak,
}) => {
  const [testSpeech, setTestSpeech] = useState("Hey there! I'm Omi, your desktop assistant!");

  const STATES: AssistantState[] = [
    'IDLE',
    'WALKING',
    'SLEEPING',
    'WAKING',
    'LISTENING',
    'THINKING',
    'WORKING',
    'SUCCESS',
    'ERROR',
    'DRAGGING',
    'INTERACTING',
  ];

  const AI_EVENTS = [
    { label: 'Deal Found', event: 'assistant.deal_found', msg: '🔥 50% discount detected on Mechanical Keyboards!' },
    { label: 'Approval Required', event: 'assistant.approval_required', msg: 'Should I checkout this order for you?' },
    { label: 'Payment Started', event: 'assistant.payment_started', msg: 'Processing secure transaction...' },
    { label: 'Payment Failed', event: 'assistant.payment_failed', msg: 'Payment failed: Card declined.' },
    { label: 'Search Query', event: 'assistant.searching', msg: 'Searching deals across Amazon & BestBuy...' },
  ];

  const handleFireAiEvent = (item: { label: string; event: string; msg: string }) => {
    triggerSimulatedAiEvent(item.event, { query: item.label });
    onSpeak(item.msg, 4500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="w-full max-w-2xl bg-[#100f1c] border border-red-500/40 shadow-2xl rounded-2xl p-5 text-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-base tracking-wide">Developer Debug Console</h2>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Telemetry / Diagnostics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 bg-black/40 p-3 rounded-xl border border-white/10 text-xs font-mono">
              <div>
                <span className="text-gray-400 block text-[10px]">CURRENT STATE</span>
                <span className="text-red-400 font-bold">{state}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">CURRENT EMOTION</span>
                <span className="text-emerald-400 font-bold">{emotion}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">POSITION (X, Y)</span>
                <span className="text-cyan-400">{Math.round(position.x)}, {Math.round(position.y)}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">ALWAYS ON TOP</span>
                <span className={alwaysOnTop ? 'text-green-400' : 'text-gray-500'}>
                  {alwaysOnTop ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            </div>

            {/* State Switchers */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-red-400" />
                Trigger State Machine State
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5">
                {STATES.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSetState(s)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition text-left ${
                      state === s
                        ? 'bg-red-600/30 border-red-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Direction Rotation Manual Test */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                8-Directional Rotation
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
                {ALL_DIRECTIONS.map((dir) => (
                  <button
                    key={dir}
                    onClick={() => onSetDirection(dir)}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition text-center capitalize ${
                      direction === dir
                        ? 'bg-sky-600/40 border-sky-400 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {dir.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Test All 34 Emotion Sprite Sets */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                Test All 34 Emotion Presets ({ALL_EMOTIONS.length})
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 max-h-36 overflow-y-auto p-1 bg-black/20 rounded-xl border border-white/5">
                {ALL_EMOTIONS.map((emo) => (
                  <button
                    key={emo}
                    onClick={() => onSetEmotion(emo)}
                    className={`px-2 py-1 rounded border text-[11px] font-medium transition truncate text-left ${
                      emotion === emo
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title={emo}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Event Simulation */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Simulate Future AI Events
              </h3>
              <div className="flex flex-wrap gap-2">
                {AI_EVENTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFireAiEvent(item)}
                    className="px-2.5 py-1.5 bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-700/40 hover:border-yellow-500 rounded-lg text-xs font-medium text-yellow-200 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Test Custom Speech */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Test Speech Bubble
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testSpeech}
                  onChange={(e) => setTestSpeech(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/15 focus:border-red-500/80 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  placeholder="Enter message..."
                />
                <button
                  onClick={() => onSpeak(testSpeech, 4000)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  Speak
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-3 border-t border-white/10">
              <button
                onClick={onTriggerWander}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 rounded-xl text-xs font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Random Wander Step
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
