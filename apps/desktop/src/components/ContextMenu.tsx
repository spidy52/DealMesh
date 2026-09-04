import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Compass, Move, Settings, Wrench, Power, MessageSquare, Zap } from 'lucide-react';
import { AssistantState, EmotionType } from '../types/assistant';
import { Heart, Sparkles, Smile, Flame, Eye } from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  state: AssistantState;
  wanderingEnabled: boolean;
  name?: string;
  accentColor?: string;
  onClose: () => void;
  onWake: () => void;
  onSleep: () => void;
  onToggleWander: () => void;
  onMoveToCenter: () => void;
  onOpenInteract: () => void;
  onOpenSettings: () => void;
  onOpenDebug: () => void;
  onOpenArena?: () => void;
  onSetEmotion?: (emotion: EmotionType) => void;
  onExit: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  state,
  wanderingEnabled,
  name = 'Omni',
  accentColor = '#00F0FF',
  onClose,
  onWake,
  onSleep,
  onToggleWander,
  onMoveToCenter,
  onOpenInteract,
  onOpenSettings,
  onOpenDebug,
  onOpenArena,
  onSetEmotion,
  onExit,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            borderColor: `${accentColor}40`,
            boxShadow: `0 10px 30px -5px ${accentColor}25, 0 4px 20px rgba(0,0,0,0.8)`
          }}
          className="fixed z-50 w-52 bg-[#12111d]/95 backdrop-blur-xl border rounded-xl py-1.5 text-xs text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick status */}
          <div className="px-3 py-1 text-[10px] uppercase font-mono text-gray-400 border-b border-white/10 mb-1 flex items-center justify-between">
            <span>{name || 'Omni'} Assistant</span>
            <span className="font-semibold" style={{ color: accentColor }}>{state}</span>
          </div>

          {state === 'SLEEPING' ? (
            <button
              onClick={() => {
                onWake();
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-red-600/25 hover:text-white transition text-left text-red-300"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Wake Up</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onSleep();
                onClose();
              }}
              className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 hover:text-white transition text-left"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Go to Sleep</span>
            </button>
          )}

          <button
            onClick={() => {
              onOpenInteract();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 hover:text-white transition text-left"
          >
            <MessageSquare className="w-3.5 h-3.5 text-red-400" />
            <span>Interact / Talk</span>
          </button>

          <button
            onClick={() => {
              onOpenArena?.();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-amber-500/20 text-amber-300 hover:text-white transition text-left font-bold"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Dual-Bot Arena (🤝 Handshake)</span>
          </button>

          <button
            onClick={() => {
              onToggleWander();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 hover:text-white transition text-left"
          >
            <Compass className={`w-3.5 h-3.5 ${wanderingEnabled ? 'text-green-400' : 'text-gray-500'}`} />
            <span>Wandering: {wanderingEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              onMoveToCenter();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 hover:text-white transition text-left"
          >
            <Move className="w-3.5 h-3.5 text-sky-400" />
            <span>Center on Screen</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* Quick Emotion Showcase */}
          {onSetEmotion && (
            <div className="px-3 py-1.5">
              <div className="text-[9px] uppercase tracking-wider font-mono text-gray-400 mb-1.5 font-bold">
                Show Expression
              </div>
              <div className="grid grid-cols-5 gap-1">
                <button
                  onClick={() => {
                    onSetEmotion('HeartEyes');
                    onClose();
                  }}
                  title="Heart Eyes (Cute)"
                  className="p-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/40 border border-pink-500/40 text-center transition flex items-center justify-center text-xs"
                >
                  💖
                </button>
                <button
                  onClick={() => {
                    onSetEmotion('Angry');
                    onClose();
                  }}
                  title="Angry (Sharp Eyes & 💢)"
                  className="p-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-center transition flex items-center justify-center text-xs"
                >
                  💢
                </button>
                <button
                  onClick={() => {
                    onSetEmotion('StarStruck');
                    onClose();
                  }}
                  title="Star Struck"
                  className="p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-center transition flex items-center justify-center text-xs"
                >
                  ⭐
                </button>
                <button
                  onClick={() => {
                    onSetEmotion('Wink');
                    onClose();
                  }}
                  title="Playful Wink"
                  className="p-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/40 text-center transition flex items-center justify-center text-xs"
                >
                  😉
                </button>
                <button
                  onClick={() => {
                    onSetEmotion('Happy');
                    onClose();
                  }}
                  title="Joyful Smiling"
                  className="p-1 rounded-lg bg-green-500/20 hover:bg-green-500/40 border border-green-500/40 text-center transition flex items-center justify-center text-xs"
                >
                  😊
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 hover:text-white transition text-left"
          >
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              onOpenDebug();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-white/10 hover:text-white transition text-left"
          >
            <Wrench className="w-3.5 h-3.5 text-yellow-400" />
            <span>Debug Panel</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              onExit();
              onClose();
            }}
            className="w-full px-3 py-1.5 flex items-center gap-2.5 hover:bg-red-700/40 text-red-400 hover:text-red-200 transition text-left"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Exit Application</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
