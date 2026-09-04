import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  Search,
  Check
} from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  last_message?: string | null;
  message_count: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface ChatMessage {
  id: string;
  session_id?: string;
  sender: string;
  message: string;
  deal_query?: string | null;
  deal_data?: any;
  status: string;
  created_at?: string;
}

interface ChatHistoryFeedProps {
  isLight?: boolean;
  onSelectDeal?: (dealData: any, query: string) => void;
}

export const ChatHistoryFeed: React.FC<ChatHistoryFeedProps> = ({ isLight, onSelectDeal }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all sessions
  const fetchSessions = async (autoSelectLatest = true) => {
    setIsLoadingSessions(true);
    try {
      const resp = await fetch('http://localhost:8000/api/voice/sessions');
      if (resp.ok) {
        const data = await resp.json();
        setSessions(data);
        if (autoSelectLatest && data.length > 0 && !activeSessionId) {
          setActiveSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load chat sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch messages whenever activeSessionId changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }

    const fetchSessionMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const resp = await fetch(`http://localhost:8000/api/voice/sessions/${activeSessionId}/messages`);
        if (resp.ok) {
          const msgs = await resp.json();
          setMessages(msgs);
        }
      } catch (err) {
        console.warn('Failed to load session messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchSessionMessages();
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create a brand new chat session
  const handleNewChat = async () => {
    try {
      const resp = await fetch('http://localhost:8000/api/voice/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      if (resp.ok) {
        const newSession = await resp.json();
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // Delete a chat session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:8000/api/voice/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Send message in current active session
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputText.trim();
    if (!query || isSending) return;

    setInputText('');
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: Math.random().toString(),
      session_id: activeSessionId || undefined,
      sender: 'user',
      message: query,
      status: 'SENT',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const resp = await fetch('http://localhost:8000/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          session_id: activeSessionId || undefined,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const serverSessionId = data.session_id || activeSessionId;

        if (serverSessionId && serverSessionId !== activeSessionId) {
          setActiveSessionId(serverSessionId);
        }

        const botMsg: ChatMessage = {
          id: Math.random().toString(),
          session_id: serverSessionId,
          sender: 'omni',
          message: data.reply,
          deal_query: data.product_query,
          deal_data: data.deal_data,
          status: data.action === 'show_deal_overlay' ? 'VERIFIED_LIVE' : 'REPLIED',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
        fetchSessions(false);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div
      className={`flex h-[600px] w-full max-w-5xl rounded-3xl overflow-hidden border shadow-2xl transition-colors font-sans ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/40'
          : 'bg-[#0A0A0A] border-[#1E1E1E] text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.85)]'
      }`}
    >
      {/* Sessions Sidebar */}
      <div
        className={`w-72 flex-shrink-0 flex flex-col border-r ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050505] border-[#181818]'
        }`}
      >
        {/* New Chat Button */}
        <div className={`p-3.5 border-b ${isLight ? 'border-slate-200' : 'border-[#181818]'}`}>
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            New Deal Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          <div className={`px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider font-mono ${
            isLight ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Sessions ({sessions.length})
          </div>

          {isLoadingSessions && sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-mono">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-mono">No sessions found.</div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => setActiveSessionId(sess.id)}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? isLight
                        ? 'bg-slate-200/90 border border-slate-300 text-slate-900 font-bold shadow-sm'
                        : 'bg-[#0E1508] border border-lemon-500/30 text-lemon-300 font-semibold'
                      : isLight
                      ? 'hover:bg-slate-100 text-slate-600'
                      : 'hover:bg-[#111111] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <MessageSquare
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? isLight ? 'text-slate-900' : 'text-lemon-400'
                          : isLight ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate font-medium">
                        <span className="truncate">{sess.title}</span>
                        {sess.status === 'COMPLETED' && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider bg-emerald-500/20 text-emerald-700 font-bold border border-emerald-500/30 flex-shrink-0">
                            Completed
                          </span>
                        )}
                      </div>
                      {sess.last_message && (
                        <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          {sess.last_message}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    title="Delete Session"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className={`flex-1 flex flex-col h-full ${isLight ? 'bg-[#FAFAFA]' : 'bg-[#080808]'}`}>
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0A0A0A] border-[#181818]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isLight ? 'bg-slate-100 border border-slate-300 text-slate-800' : 'bg-[#0E1508] border border-lemon-500/30 text-lemon-400'
            }`}>
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-bold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activeSession?.title || 'Live Negotiation & Search Feed'}
                </h2>
                {activeSession?.status === 'COMPLETED' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Deal Concluded
                  </span>
                )}
              </div>
              <p className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {messages.length} events logged • Direct Live Web Link
              </p>
            </div>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoadingMessages ? (
            <div className={`flex items-center justify-center h-full text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Loading session log...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isLight ? 'bg-slate-100 border border-slate-300 text-slate-700' : 'bg-[#0E1508] border border-lemon-500/30 text-lemon-400'
              }`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Live Deal Assistant</h3>
                <p className={`text-xs max-w-sm mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ask to scan e-commerce stores, compare authentic live prices, or start autonomous negotiations.
                </p>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                      isLight ? 'bg-slate-200 border border-slate-300 text-slate-700' : 'bg-[#0E1508] border border-lemon-500/30 text-lemon-400'
                    }`}>
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[78%] space-y-2">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? isLight
                            ? 'bg-slate-900 text-white rounded-tr-none shadow-sm'
                            : 'bg-[#181818] border border-[#2B2B2B] text-white rounded-tr-none shadow-md'
                          : isLight
                          ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                          : 'bg-[#0E1508] border border-lemon-500/20 text-slate-200 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {m.message}
                    </div>

                    {/* Embedded Multi-Store Deal Card if available */}
                    {m.deal_data && m.deal_data.stores && (
                      <div className={`p-3.5 rounded-2xl text-white shadow-lg space-y-2.5 ${
                        isLight ? 'bg-white border border-slate-200 text-slate-900 shadow-md' : 'bg-[#0A0A0A] border border-[#222222] text-white'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className={`truncate ${isLight ? 'text-slate-900' : 'text-lemon-300'}`}>
                            {m.deal_data.title || m.deal_query}
                          </span>
                          <span className={`font-mono ${isLight ? 'text-emerald-700 font-extrabold' : 'text-white'}`}>
                            ₹{Number(m.deal_data.basePrice || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {m.deal_data.stores.slice(0, 3).map((st: any, sIdx: number) => (
                            <div
                              key={sIdx}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] ${
                                isLight ? 'bg-slate-50 border border-slate-100 text-slate-800' : 'bg-[#121212] text-slate-200'
                              }`}
                            >
                              <span className="font-medium">{st.name}</span>
                              <div className="flex items-center gap-2 font-mono">
                                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                  ₹{Number(st.price).toLocaleString('en-IN')}
                                </span>
                                {st.url && (
                                  <a
                                    href={st.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${isLight ? 'text-blue-600 hover:text-blue-700' : 'text-lemon-400 hover:text-lemon-300'}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 ${
                      isLight ? 'bg-slate-800 text-white' : 'bg-[#1E1E1E] border border-[#2F2F2F] text-slate-300'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-4 border-t ${isLight ? 'bg-white border-slate-200' : 'bg-[#0A0A0A] border-[#181818]'}`}>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message or query..."
              className={`flex-1 px-4 py-2.5 rounded-xl text-xs border focus:outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-lemon-500'
                  : 'bg-[#050505] border-[#222222] text-white placeholder-slate-500 focus:border-lemon-400'
              }`}
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="p-2.5 rounded-xl bg-lemon-500 hover:bg-lemon-400 text-black font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-lemon-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
