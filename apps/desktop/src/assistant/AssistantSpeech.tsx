import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpeechMessage } from '../types/assistant';

interface AssistantSpeechProps {
  message: SpeechMessage | null;
  onActionClick?: (action: string) => void;
  onDismiss?: () => void;
}

export const AssistantSpeech: React.FC<AssistantSpeechProps> = ({
  message,
  onActionClick,
  onDismiss,
}) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!message) {
      setDisplayedText('');
      return;
    }

    // Typewriter effect
    let currentIndex = 0;
    const fullText = message.text;
    setDisplayedText('');

    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 20);

    // Auto dismiss
    let dismissTimer: any = null;
    if (message.durationMs && message.durationMs > 0) {
      dismissTimer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, message.durationMs);
    }

    return () => {
      clearInterval(interval);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [message, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative max-w-[240px] mb-2 z-30"
        >
          {/* Speech bubble box */}
          <div className="bg-[#181628]/95 backdrop-blur-md text-white border-2 border-[#e63946]/70 rounded-2xl px-3.5 py-2.5 shadow-2xl text-xs font-medium leading-relaxed">
            <p className="font-sans text-gray-100 break-words">{displayedText}</p>

            {/* Quick replies / Action chips */}
            {message.quickReplies && message.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
                {message.quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onActionClick) onActionClick(reply.action);
                    }}
                    className="px-2 py-1 bg-red-600/30 hover:bg-red-600/60 border border-red-500/40 hover:border-red-400 text-red-200 hover:text-white rounded-lg text-[11px] font-semibold transition-all"
                  >
                    {reply.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bubble tail pointing downwards to Omi */}
          <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#e63946]/70" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
