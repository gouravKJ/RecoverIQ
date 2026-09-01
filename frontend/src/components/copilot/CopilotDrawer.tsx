'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  X,
  Sparkles,
  Cpu,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  RefreshCw,
} from 'lucide-react';

interface SuggestedNavigation {
  label: string;
  url: string;
}

interface CopilotDataCard {
  transactionId?: string;
  cause?: string;
  aiRecommendation?: string;
  expectedValue?: string | number;
  finalDecision?: string;
  policyResult?: string;
  executionMode?: string;
  recoveredAmount?: string | number;
}

interface CopilotFact {
  label: string;
  value: string | number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  dataSource?: string;
  facts?: CopilotFact[];
  data?: CopilotDataCard;
  suggestedNavigation?: SuggestedNavigation[];
  timestamp: string;
  aiMode?: string;
}

const QUICK_PROMPTS = [
  'Where are we losing the most revenue?',
  'Why was the last recovery blocked?',
  'What are the biggest failure patterns?',
  'Kitna revenue recover hua?',
  'Kaunsa payment method sabse zyada fail ho raha hai?',
  'Why did txn_demo_s1_retry_success fail?',
];

export function CopilotDrawer({ initialTxnId }: { initialTxnId?: string }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTxnId, setActiveTxnId] = useState<string | undefined>(initialTxnId);
  const [aiStatus, setAiStatus] = useState({ mode: 'LLM', provider: 'Groq', model: 'openai/gpt-oss-20b' });
  const [conversationId] = useState(() => `session_${Date.now()}`);

  // Voice Web Speech API state
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Sync voiceLang when language state changes
  useEffect(() => {
    if (language === 'hi') {
      setVoiceLang('hi-IN');
    } else {
      setVoiceLang('en-IN');
    }
  }, [language]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    // Fetch Copilot AI status
    api<any>('/ai/status')
      .then((st) => {
        if (st) setAiStatus(st);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialTxnId) {
      setActiveTxnId(initialTxnId);
    }
  }, [initialTxnId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle Speech Recognition toggle
  const toggleVoice = () => {
    if (!speechSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputValue(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await api<any>('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: query,
          conversationId,
          context: { transactionId: activeTxnId },
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: res.message,
        sources: res.sources,
        dataSource: res.dataSource,
        facts: res.facts,
        data: res.data,
        suggestedNavigation: res.suggestedNavigation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiMode: res.aiMode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'RecoverIQ Copilot is temporarily operating in fallback mode. ' + (e instanceof Error ? e.message : 'Please try again.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiMode: 'DETERMINISTIC_FALLBACK',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bottom-Right Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-2xl shadow-indigo-500/40 border border-indigo-400/40 transition-all hover:scale-105"
      >
        <div className="relative">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span>{t.copilotLauncher}</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-mono text-blue-200">AI</span>
      </button>

      {/* Copilot Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-full max-w-md h-[580px] max-h-[80vh] rounded-3xl bg-[#080d1a] border border-indigo-500/40 shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-[#1e2d4a] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-extrabold text-white">{t.copilotTitle}</h3>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono border ${
                      aiStatus.mode === 'LLM'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    ● {aiStatus.mode === 'LLM' ? 'GROQ LLM ACTIVE' : 'DETERMINISTIC FALLBACK'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {t.copilotSub}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs scrollbar-thin">
            {messages.length === 0 ? (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                  <p className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.copilotWelcome}</span>
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {t.copilotWelcomeSub}
                  </p>
                </div>

                {activeTxnId && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 flex items-center justify-between">
                    <span>Context Active: <strong className="font-mono">{activeTxnId}</strong></span>
                    <button
                      onClick={() => handleSendMessage(`Explain transaction ${activeTxnId}`)}
                      className="text-[10px] font-bold underline hover:text-white"
                    >
                      Explain Txn →
                    </button>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{t.suggestedPrompts}</p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-left p-2.5 rounded-xl bg-[#0c1220] border border-[#1e2d4a] hover:border-indigo-500/40 text-slate-300 hover:text-white transition-colors text-[11px] flex items-center justify-between group"
                      >
                        <span>{prompt}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                        : 'bg-[#0c1220] border border-[#1e2d4a] text-slate-200 rounded-bl-none shadow-lg'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#1e2d4a]">
                        <span className="text-[9px] font-bold uppercase font-mono text-indigo-400 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> RecoverIQ Copilot
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Source: {msg.dataSource || (msg.sources && msg.sources.length > 0 ? msg.sources[0] : 'Database Analytics')}
                        </span>
                      </div>
                    )}

                    {/* Structured Facts / Data Insights Card */}
                    {msg.facts && msg.facts.length > 0 && (
                      <div className="mb-3 p-3 rounded-xl bg-[#131b2e] border border-indigo-500/30 text-[10px] space-y-1.5 font-mono shadow-inner">
                        <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-1 font-bold text-indigo-300 uppercase tracking-wider text-[9px]">
                          <span>DATA INSIGHTS</span>
                          <span className="text-emerald-400">VERIFIED DB FACTS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          {msg.facts.map((fact, fIdx) => (
                            <div key={fIdx} className="bg-[#0c1220]/70 p-1.5 rounded border border-[#1e2d4a]">
                              <span className="text-[9px] text-slate-400 block">{fact.label}</span>
                              <span className="font-bold text-white text-[10px]">{String(fact.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap text-[11px]">{msg.content}</p>

                    {/* Structured Data Card */}
                    {msg.data && (msg.data.transactionId || msg.data.cause || msg.data.finalDecision) && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#131b2e] border border-[#1e2d4a] text-[10px] space-y-1 font-mono">
                        {msg.data.transactionId && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Transaction</span>
                            <span className="font-bold text-white">{msg.data.transactionId}</span>
                          </div>
                        )}
                        {msg.data.cause && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Root Cause</span>
                            <span className="text-amber-300">{msg.data.cause}</span>
                          </div>
                        )}
                        {msg.data.aiRecommendation && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">AI Recommendation</span>
                            <span className="text-emerald-300">{msg.data.aiRecommendation}</span>
                          </div>
                        )}
                        {msg.data.finalDecision && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Final System Decision</span>
                            <span className="text-blue-300 font-bold">{msg.data.finalDecision}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Navigation Chips */}
                    {msg.suggestedNavigation && msg.suggestedNavigation.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedNavigation.map((nav, idx) => (
                          <Link
                            key={idx}
                            href={nav.url}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 transition-colors flex items-center gap-1"
                          >
                            <span>{nav.label}</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 px-1 font-mono">{msg.timestamp}</span>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0c1220] border border-[#1e2d4a] text-xs text-slate-400 w-max">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span className="font-mono text-[11px]">Copilot reasoning & querying context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice & Input Footer */}
          <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-t border-[#1e2d4a] space-y-2">
            {/* Voice Status & Language Selector */}
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                <span className="text-slate-400 font-mono">
                  {isListening ? 'Listening...' : speechSupported ? 'Voice Ready' : 'Speech Unsupported'}
                </span>
              </div>

              <div className="flex items-center gap-1 font-mono text-slate-400">
                <Globe className="w-3 h-3 text-slate-400" />
                <button
                  onClick={() => setVoiceLang('en-IN')}
                  className={`px-1.5 py-0.5 rounded ${voiceLang === 'en-IN' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-white'}`}
                >
                  EN
                </button>
                <span>/</span>
                <button
                  onClick={() => setVoiceLang('hi-IN')}
                  className={`px-1.5 py-0.5 rounded ${voiceLang === 'hi-IN' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-white'}`}
                >
                  HI
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isListening ? 'Listening to speech...' : t.copilotPlaceholder}
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-[#0c1220] border border-[#1e2d4a] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={toggleVoice}
                  title={isListening ? 'Stop Microphone' : 'Start Voice Input'}
                  className={`absolute right-2 p-1 rounded-lg transition-colors ${
                    isListening ? 'text-red-400 bg-red-500/20' : 'text-slate-400 hover:text-indigo-400'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
