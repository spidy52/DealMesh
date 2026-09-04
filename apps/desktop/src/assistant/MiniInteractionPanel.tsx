import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Moon, Settings, Wrench, Send, X, Sparkles, Bot, User } from 'lucide-react';
import { AssistantState } from '../types/assistant';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface MiniInteractionPanelProps {
  isOpen: boolean;
  name: string;
  accentColor?: string;
  state: AssistantState;
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onToggleVoice: () => void;
  onSleep: () => void;
  onOpenSettings: () => void;
  onOpenDebug: () => void;
}

export const MiniInteractionPanel: React.FC<MiniInteractionPanelProps> = ({
  isOpen,
  name = 'Omni',
  accentColor = '#00F0FF',
  state,
  onClose,
  onSendMessage,
  onToggleVoice,
  onSleep,
  onOpenSettings,
  onOpenDebug,
}) => {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hai! I'm ${name || 'Omni'}, your AI companion. How can I help you today?`,
      time: 'Just now',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Trigger Omni's voice & state engine
    onSendMessage(query);

    // Compute dynamic response for chat panel
    const textLower = query.toLowerCase();
    let reply = '';

    if (textLower.includes('watch') || textLower.includes('titan')) {
      reply = `Titan Neo Quartz is available at ₹2,299 at Titan store, saving ₹500!`;
    } else if (textLower.includes('deal') || textLower.includes('discount') || textLower.includes('offer')) {
      reply = `I found 24 verified deals across 12 stores with up to 25% discount.`;
    } else if (textLower.includes('hello') || textLower.includes('hi') || textLower.includes('hey')) {
      reply = `Konnichiwa! Great to chat with you. What's on your mind?`;
    } else if (textLower.includes('joke')) {
      reply = `Why do programmers prefer dark mode? Because light attracts bugs! Hehe~`;
    } else if (textLower.includes('who are you')) {
      reply = `I am Omni, your desktop AI companion!`;
    } else {
      reply = `I understand! Let me know if you want me to search deals or assist you with anything.`;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          sender: 'bot',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 400);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-80 max-h-[360px] flex flex-col bg-[#12111d]/95 backdrop-blur-xl shadow-2xl rounded-2xl p-3.5 text-white z-40 mb-3"
          style={{
            border: `1.5px solid ${accentColor}55`,
            boxShadow: `0 12px 35px -8px ${accentColor}33, 0 4px 20px rgba(0,0,0,0.85)`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`
                }}
              />
              <h3 className="font-bold text-xs tracking-wide text-gray-100">{name || 'Omni'} Chatbot</h3>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full uppercase font-mono tracking-wider font-semibold"
                style={{
                  backgroundColor: `${accentColor}1F`,
                  color: accentColor,
                  border: `1px solid ${accentColor}55`
                }}
              >
                {state}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenDebug}
                title="Developer Debug Panel"
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <Wrench className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenSettings}
                title="Settings"
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                title="Close"
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Thread */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2.5 max-h-[160px] text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-1.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${accentColor}25`,
                      border: `1px solid ${accentColor}55`
                    }}
                  >
                    <Bot className="w-3 h-3" style={{ color: accentColor }} />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-2.5 py-1.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'rounded-br-none shadow-md'
                      : 'bg-white/10 text-gray-200 border border-white/10 rounded-bl-none'
                  }`}
                  style={
                    m.sender === 'user'
                      ? {
                          backgroundColor: accentColor,
                          color: '#0a0a0a',
                          fontWeight: 600,
                          boxShadow: `0 2px 8px ${accentColor}40`
                        }
                      : {}
                  }
                >
                  <p>{m.text}</p>
                </div>
                {m.sender === 'user' && (
                  <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSubmit} className="relative mb-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`Ask ${name || 'Omni'} anything...`}
              autoFocus
              className="w-full bg-black/40 rounded-xl px-3 py-1.5 pr-8 text-xs text-gray-100 placeholder-gray-500 outline-none transition"
              style={{
                border: isFocused ? `1.5px solid ${accentColor}CC` : '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: isFocused ? `0 0 12px ${accentColor}40` : 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg transition disabled:text-gray-600 disabled:hover:text-gray-600 hover:opacity-80"
              style={inputText.trim() ? { color: accentColor } : {}}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleVoice}
              className="flex items-center justify-center gap-1 py-1 px-1.5 bg-white/5 border rounded-xl text-[11px] font-medium text-gray-300 transition hover:bg-white/10"
              style={{
                borderColor: `${accentColor}33`
              }}
            >
              <Mic className="w-3 h-3" style={{ color: accentColor }} />
              <span>Voice</span>
            </button>
            <button
              type="button"
              onClick={() => onSendMessage('Find me deals on tech gear')}
              className="flex items-center justify-center gap-1 py-1 px-1.5 bg-white/5 hover:bg-yellow-600/20 border border-white/10 hover:border-yellow-500/40 rounded-xl text-[11px] font-medium text-gray-300 hover:text-yellow-300 transition"
            >
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Deals</span>
            </button>
            <button
              type="button"
              onClick={onSleep}
              className="flex items-center justify-center gap-1 py-1 px-1.5 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/40 rounded-xl text-[11px] font-medium text-gray-300 hover:text-indigo-300 transition"
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Sleep</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
