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
  text: "Hi there! 👋\nI’m Lumi, your 24/7 Dental Care & Scheduling Assistant. How can I help you today?",
  timestamp: 'Just now',
};

const SUGGESTIONS = [
  'Clinic hours & locations',
  'Laser Teeth Whitening cost',
  'HMO & Maxicare coverage',
  'Wisdom tooth extraction care',
];

/**
 * Helper to parse markdown text (bolding **text**, italics *text*, bullet points, [link](url), and raw URLs)
 * into styled React nodes with interactive clickable hyperlinks.
 */
function renderFormattedMessage(text: string) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1 text-[13px] leading-relaxed break-words overflow-hidden">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed);

        // Match markdown links [Text](URL) OR standalone URLs (https?://...)
        const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/[^\s<>)"]+)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = combinedRegex.exec(line)) !== null) {
          const textBefore = line.substring(lastIndex, match.index);
          if (textBefore) {
            parts.push(renderTextFormatting(textBefore, `tb-${lineIdx}-${lastIndex}`));
          }

          const linkUrl = match[2] || match[3] || '';
          const isInternal =
            linkUrl.startsWith('#') ||
            linkUrl.startsWith('/') ||
            linkUrl.includes('luminadentalcarestudio.vercel.app') ||
            linkUrl.includes('localhost');

          const displayLabel = match[1] || (linkUrl.includes('#booking') ? 'Schedule an appointment here' : linkUrl);

          const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (isInternal) {
              e.preventDefault();
              const isBooking = linkUrl.includes('booking');
              const isInquiry = linkUrl.includes('inquiry');

              if (isBooking || isInquiry) {
                const mode = isBooking ? 'booking' : 'inquiry';
                window.dispatchEvent(
                  new CustomEvent('lumina:select-service', {
                    detail: { mode },
                  })
                );
                window.location.hash = isBooking ? 'booking' : 'inquiry';
                const el = document.getElementById('booking-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              } else if (linkUrl.includes('#')) {
                const hashPart = linkUrl.split('#')[1];
                const el = document.getElementById(hashPart) || document.getElementById(`${hashPart}-section`);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              } else if (linkUrl.startsWith('/')) {
                window.location.href = linkUrl;
              }
            }
          };

          parts.push(
            <a
              key={`link-${lineIdx}-${match.index}`}
              href={linkUrl}
              onClick={handleClick}
              target={isInternal ? '_self' : '_blank'}
              rel={isInternal ? undefined : 'noopener noreferrer'}
              className="text-[#0f766e] hover:text-[#0d9488] font-bold underline underline-offset-2 transition-colors inline cursor-pointer"
            >
              {displayLabel}
            </a>
          );

          lastIndex = match.index + match[0].length;
        }

        const remainingText = line.substring(lastIndex);
        if (remainingText) {
          parts.push(renderTextFormatting(remainingText, `rem-${lineIdx}-${lastIndex}`));
        }

        return (
          <div
            key={lineIdx}
            className={`${isBullet ? 'pl-2 text-slate-800' : 'text-slate-800'}`}
          >
            {parts}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Handles bold **text** and italic *text* cleanly
 */
function renderTextFormatting(text: string, keyPrefix: string): React.ReactNode {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderItalics(text.substring(lastIndex, match.index), `${keyPrefix}-pre-${lastIndex}`));
    }
    parts.push(
      <strong key={`${keyPrefix}-b-${match.index}`} className="font-bold text-slate-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(renderItalics(text.substring(lastIndex), `${keyPrefix}-post-${lastIndex}`));
  }

  return parts.length > 0 ? parts : text;
}

function renderItalics(text: string, keyPrefix: string): React.ReactNode {
  const italicRegex = /\*([^*]+)\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = italicRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <em key={`${keyPrefix}-em-${match.index}`} className="italic text-slate-700">
        {match[1]}
      </em>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

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
        "I'm here to help with all questions regarding Lumina Dental Studio's services, pricing, HMO coverage, and recovery guidelines. [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmergency: data.status === 'emergency' || data.status === 'security_blocked',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('[LumiChat] Error:', err);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: "I apologize, I'm experiencing a brief connection delay. Please call our clinic desk at **(02) 8888-LUMI (5864)** or [Schedule an appointment here](https://luminadentalcarestudio.vercel.app/#booking).",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Minimize: Retains conversation
  const handleMinimize = () => {
    setIsOpen(false);
  };

  // Close: Resets conversation to initial greeting
  const handleClose = () => {
    setIsOpen(false);
    setMessages([INITIAL_GREETING]);
    setInputQuery('');
  };

  return (
    <>
      {/* 1. Floating Trigger Orb Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5">
          {/* Unread / Welcome Prompt Tooltip */}
          {hasUnread && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-200/80 shadow-md text-[12px] font-semibold text-slate-800 cursor-pointer hover:border-teal-400 transition-all hover:scale-102 group"
            >
              <span>Ask Lumi • 24/7 AI Companion</span>
              <span className="text-teal-600 text-xs font-bold transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          )}

          {/* Clean Glowing Orb Trigger Button */}
          <button
            onClick={() => setIsOpen(true)}
            data-testid="lumi-trigger-btn"
            aria-label="Open Lumi AI Companion Chat"
            className="group relative w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-[#073a46] via-[#0a5666] to-[#0d9488] p-0.5 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer"
          >
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#073a46]">
              <LumiOrb size={56} />
            </div>
          </button>
        </div>
      )}

      {/* 2. Floating AI Chat Modal Window (Mobile Floating Sheet & Desktop Floating Window) */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out font-sans ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-8 pointer-events-none'
        } max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:h-[65vh] max-sm:max-h-[520px] sm:bottom-6 sm:right-6 sm:left-auto sm:w-[380px] sm:h-[590px] sm:max-h-[85vh]`}
      >
        <div className="w-full h-full bg-white rounded-[26px] sm:rounded-[28px] border border-slate-200/90 shadow-[0_20px_50px_rgba(7,58,70,0.25)] overflow-hidden flex flex-col relative ring-1 ring-black/5">
          
          {/* --- CURVED WAVE HEADER --- */}
          <div className="relative bg-gradient-to-br from-[#073a46] via-[#094d5a] to-[#0d9488] text-white pt-4 pb-7 px-5 flex-shrink-0">
            <div className="flex items-center justify-between relative z-10">
              {/* Header Left: Avatar & Title */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-cyan-300 via-teal-200 to-white shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#073a46] flex items-center justify-center">
                    <LumiOrb size={40} forcePlay={isTyping} />
                  </div>
                </div>

                <div>
                  <h3 className="text-[18px] font-bold tracking-tight text-white leading-tight">
                    Lumi
                  </h3>
                  <p className="text-[11.5px] font-medium text-cyan-100/90 leading-tight">
                    24/7 AI Dental Companion
                  </p>
                </div>
              </div>

              {/* Header Right: Window Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleMinimize}
                  data-testid="lumi-minimize-btn"
                  title="Minimize (Keep conversation)"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
                >
                  −
                </button>
                <button
                  onClick={handleClose}
                  data-testid="lumi-close-btn"
                  title="Close & Reset Conversation"
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Bottom SVG Wave Curve */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
              <svg
                viewBox="0 0 500 50"
                preserveAspectRatio="none"
                className="w-full h-5 text-[#f8fafc] fill-current"
              >
                <path d="M0,0 C150,40 350,0 500,35 L500,50 L0,50 Z" />
              </svg>
            </div>
          </div>

          {/* --- MESSAGES THREAD BODY --- */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pt-2 pb-3 space-y-3 bg-[#f8fafc] scrollbar-thin scrollbar-thumb-slate-300">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Bot Avatar on Left */}
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5 border border-teal-300/40 bg-[#073a46]">
                    <LumiOrb size={28} forcePlay={isTyping} />
                  </div>
                )}

                {/* Speech Bubble */}
                <div className="flex flex-col space-y-0.5 max-w-[84%]">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#cffafe] text-slate-800 rounded-tr-xs border border-cyan-200/60'
                        : msg.isEmergency
                        ? 'bg-rose-50 text-rose-950 border border-rose-200 rounded-tl-xs'
                        : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/70'
                    }`}
                  >
                    {renderFormattedMessage(msg.text)}
                  </div>

                  {/* Timestamp */}
                  <div
                    className={`text-[9.5px] font-medium text-slate-400 px-1 ${
                      msg.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-teal-300/40 bg-[#073a46]">
                  <LumiOrb size={28} forcePlay={true} />
                </div>
                <div className="bg-white border border-slate-200/70 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* --- QUICK SUGGESTIONS CHIPS (Compact & Slim) --- */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden no-scrollbar">
              {SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="whitespace-nowrap px-2 py-0.5 rounded-full bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-[10px] font-medium text-slate-600 hover:text-teal-800 transition-all shadow-2xs flex-shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* --- INPUT COMPOSER FOOTER (Clean White Pill, No Greyout Box) --- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <div className="flex-1 bg-white border border-slate-200 hover:border-slate-300 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/15 rounded-full px-3.5 py-1.5 transition-all flex items-center">
              <input
                ref={inputRef}
                type="text"
                data-testid="lumi-input"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Type your message..."
                disabled={isTyping}
                className="lumi-input-clean w-full text-[13px] text-slate-800 placeholder:text-slate-400 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 appearance-none disabled:opacity-60"
                style={{
                  outline: 'none',
                  border: 'none',
                  boxShadow: 'none',
                  backgroundColor: 'transparent',
                }}
              />
            </div>

            {/* Send Action Button */}
            <button
              type="submit"
              data-testid="lumi-send-btn"
              aria-label="Send message"
              className={`w-9 h-9 rounded-full bg-[#008080] hover:bg-[#0d9488] active:scale-95 text-white flex items-center justify-center transition-all shadow-sm flex-shrink-0 cursor-pointer ${
                !inputQuery.trim() || isTyping ? 'opacity-40 pointer-events-auto' : 'opacity-100'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 translate-x-0.5"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
