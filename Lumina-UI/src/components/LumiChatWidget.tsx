'use client';

import React, { useState, useEffect, useRef } from 'react';
import LumiOrb from './LumiOrb';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  isEmergency?: boolean;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting-1',
  sender: 'bot',
  text: "Hi there! 👋\n\nI’m Lumi, your 24/7 Dental Care & Scheduling Assistant. How can I help you today?",
  timestamp: 'Just now',
};

const SUGGESTIONS = [
  'What are your clinic hours?',
  'How much is Laser Teeth Whitening?',
  'Do you accept Maxicare / Intellicare?',
  'Wisdom tooth extraction post-op care?',
  'Where are your clinic branches located?',
];

export default function LumiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Initialize unique session ID
  useEffect(() => {
    const existing = localStorage.getItem('lumina_chat_session_id');
    if (existing) {
      setSessionId(existing);
    } else {
      const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('lumina_chat_session_id', newId);
      setSessionId(newId);
    }
  }, []);

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const query = (queryText || inputQuery).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/concierge-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          session_id: sessionId || 'web-session',
        }),
      });

      const data = await res.json();
      const botReply =
        data.reply ||
        "I'm here to help with all questions regarding Lumina Dental Studio's services, pricing, HMO coverage, and recovery guidelines.";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: data.status === 'emergency',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('[LumiChat] Error fetching answer:', err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I apologize, I'm experiencing a brief connection delay. You can reach our front desk directly at (02) 8888-LUMI (5864) or +63 917 123 4567.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 1. Floating Trigger Orb Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Unread / Welcome Prompt Tooltip */}
          {hasUnread && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-teal-200/80 shadow-lg text-[13px] font-semibold text-slate-800 cursor-pointer hover:border-teal-400 transition-all hover:scale-102 group animate-bounce-subtle"
            >
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>Ask Lumi • 24/7 AI Concierge</span>
              <span className="text-slate-400 text-xs group-hover:text-teal-600">→</span>
            </div>
          )}

          {/* Glowing Orb Trigger Button */}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open Lumi AI Concierge Chat"
            className="group relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-[#073a46] via-[#0a5666] to-[#0d9488] p-1 shadow-[0_0_35px_rgba(13,148,136,0.45),0_10px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_0_45px_rgba(13,148,136,0.65),0_15px_40px_rgba(0,0,0,0.25)] hover:scale-108 active:scale-95 transition-all duration-300 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#073a46]/90 border border-teal-300/40">
              <LumiOrb size={54} />
            </div>

            {/* Online Status Dot */}
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white ring-2 ring-emerald-400/40" />
          </button>
        </div>
      )}

      {/* 2. Floating AI Chat Modal Window */}
      {isOpen && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[410px] h-[580px] sm:h-[650px] max-h-[92vh] bg-white rounded-[32px] border-2 border-cyan-400/40 shadow-[0_0_55px_rgba(6,182,212,0.35),0_25px_65px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95 font-sans"
        >
          {/* --- CURVED WAVE HEADER --- */}
          <div className="relative bg-gradient-to-br from-[#073a46] via-[#094d5a] to-[#0d9488] text-white pt-5 pb-8 px-5 flex-shrink-0">
            <div className="flex items-center justify-between relative z-10">
              {/* Header Left: Avatar & Title */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-cyan-300 via-teal-200 to-white shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#073a46] flex items-center justify-center">
                    <LumiOrb size={44} forcePlay={isTyping} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#073a46]" />
                </div>

                <div>
                  <h3 className="text-[19px] font-bold tracking-tight text-white leading-tight">
                    Lumi
                  </h3>
                  <p className="text-[11.5px] font-medium text-cyan-100/90 leading-tight">
                    Lumina AI Clinical Concierge
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-cyan-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                    <span className="text-cyan-300/60">•</span>
                    <span>Instant Clinic Knowledge</span>
                  </div>
                </div>
              </div>

              {/* Header Right: Window Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors backdrop-blur-xs text-sm font-bold"
                >
                  −
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors backdrop-blur-xs text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Bottom SVG Wave Curve */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
              <svg
                viewBox="0 0 500 60"
                preserveAspectRatio="none"
                className="w-full h-6 text-[#f8fafc] fill-current"
              >
                <path d="M0,0 C150,50 350,0 500,45 L500,60 L0,60 Z" />
              </svg>
            </div>
          </div>

          {/* --- MESSAGES THREAD BODY --- */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 space-y-4 bg-[#f8fafc]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Bot Avatar on Left */}
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5 border border-teal-300/40 shadow-xs bg-[#073a46]">
                    <LumiOrb size={32} forcePlay={isTyping} />
                  </div>
                )}

                {/* Speech Bubble */}
                <div className="flex flex-col space-y-1 max-w-[84%]">
                  <div
                    className={`px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#cffafe] text-slate-800 rounded-tr-sm border border-cyan-200/60'
                        : msg.isEmergency
                        ? 'bg-rose-50 text-rose-950 border border-rose-200 rounded-tl-sm'
                        : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/70'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] font-medium text-slate-400 px-1 flex items-center gap-1 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && (
                      <span className="text-teal-600 font-bold">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-teal-300/40 shadow-xs bg-[#073a46]">
                  <LumiOrb size={32} forcePlay={true} />
                </div>
                <div className="bg-white border border-slate-200/70 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* --- QUICK SUGGESTIONS CHIPS --- */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-3.5 py-2 bg-[#f8fafc] border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="whitespace-nowrap px-3 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-[11px] font-medium text-slate-700 hover:text-teal-800 transition-all shadow-2xs flex-shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* --- INPUT COMPOSER FOOTER --- */}
          <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <div className="flex-1 bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white border border-slate-200/90 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 rounded-full px-4 py-2 transition-all flex items-center shadow-inner">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                disabled={isTyping}
                className="w-full text-[13.5px] text-slate-800 placeholder:text-slate-400 bg-transparent outline-none disabled:opacity-60"
              />
            </div>

            {/* Send Action Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputQuery.trim() || isTyping}
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-[#008080] hover:bg-[#0d9488] active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-md flex-shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 translate-x-0.5"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
