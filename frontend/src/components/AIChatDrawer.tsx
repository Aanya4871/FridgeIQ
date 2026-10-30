import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Send, Bot, User as UserIcon, RefreshCw, Trash2, LogIn, Lock } from 'lucide-react';
import { api } from '../api/client';
import { User } from '../types';

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

interface ChatResponseData {
  reply: string;
  conversation_id?: number;
  suggested_actions?: string[];
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onOpenAuth: () => void;
  onAuthSuccess?: (user: User, token: string) => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onAuthSuccess,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hello! I'm FridgeAI, your intelligent Refrigerator Assistant powered by Gemini. I have real-time access to your fridge inventory, expiry dates, and recipe library. Ask me what to cook today or what items to use first!",
    },
  ]);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<string[]>([
    'What can I cook with my active ingredients today?',
    'What items are expiring soon?',
    'How should I store spinach to keep it fresh longer?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && user) {
      scrollToBottom();

      api.get<{ conversation_id?: number; messages: Array<{ role: string; content: string }> }>('/chat/history')
        .then((res) => {
          if (res.data?.conversation_id) {
            setConversationId(res.data.conversation_id);
          }
          if (res.data?.messages && res.data.messages.length > 0) {
            const loaded: Message[] = res.data.messages.map((m) => ({
              sender: m.role === 'user' ? 'user' : 'ai',
              text: m.content,
            }));
            setMessages(loaded);
          }
        })
        .catch(() => {

        });
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleQuickDemoLogin = async () => {
    setLoggingIn(true);
    try {
      const res = await api.post('/auth/login', {
        email: 'demo@example.com',
        password: 'demo1234',
      });
      if (onAuthSuccess) {
        onAuthSuccess(res.data.user, res.data.access_token);
      }
    } catch (e) {
      onOpenAuth();
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSend = async (messageText?: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    const newMessages: Message[] = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      const res = await api.post<ChatResponseData>('/chat', {
        message: textToSend,
        conversation_id: conversationId,
      });

      if (res.data.conversation_id) {
        setConversationId(res.data.conversation_id);
      }

      setMessages([...newMessages, { sender: 'ai', text: res.data.reply }]);

      if (res.data.suggested_actions && res.data.suggested_actions.length > 0) {
        setSuggestedActions(res.data.suggested_actions);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setMessages([
          ...newMessages,
          {
            sender: 'ai',
            text: '🔒 Your session is not authenticated or has expired. Please log in to continue chatting with FridgeAI.',
          },
        ]);
      } else {
        const errorMessage =
          err?.response?.data?.detail ||
          "I couldn't reach the AI service right now. Please try again in a moment.";
        setMessages([
          ...newMessages,
          {
            sender: 'ai',
            text: errorMessage,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setConversationId(undefined);
    setMessages([
      {
        sender: 'ai',
        text: "Started a new conversation! What would you like to cook or check in your fridge?",
      },
    ]);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] glass-panel bg-slate-950/95 border-l border-slate-700/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              FridgeAI
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium border border-emerald-500/30">
                Gemini Powered
              </span>
            </h3>
            <span className="text-[10px] text-slate-400">Context-aware cooking & inventory intelligence</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {user && (
            <button
              onClick={handleResetChat}
              title="Start new conversation"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!user && (
        <div className="p-4 bg-emerald-950/40 border-b border-emerald-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Sign In Required for Fridge AI</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            FridgeAI needs to read your authenticated inventory to suggest recipes and warn about expiry.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleQuickDemoLogin}
              disabled={loggingIn}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-[11px] rounded-lg shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-3 h-3" />
                  ⚡ 1-Click Demo Login
                </>
              )}
            </button>
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-lg transition-all"
            >
              Custom Sign In / Register
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 ${
              m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                m.sender === 'user'
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {m.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                m.sender === 'user'
                  ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 w-max animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            FridgeAI is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {suggestedActions && suggestedActions.length > 0 && user && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-1.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
            Suggested Prompts:
          </span>
          <div className="flex flex-col gap-1">
            {suggestedActions.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(prompt)}
                className="text-left text-[11px] text-slate-300 hover:text-emerald-300 bg-slate-900/80 hover:bg-slate-800 p-2 rounded-xl border border-slate-800 transition-all truncate disabled:opacity-50"
              >
                💡 {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder={
              user
                ? "Ask FridgeAI anything about your fridge..."
                : "Please sign in above to ask FridgeAI..."
            }
            className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-xl font-bold shadow-md shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
