'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
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
 * Parses markdown table strings into clean, structured bullet lists.
 */
function convertTableToBullets(text: string): string {
  const lines = text.split('\n');
  const resultLines: string[] = [];
  let inTable = false;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = line.startsWith('|') && line.endsWith('|');
    const isDividerRow = isTableRow && /^\|(\s*:?-+:?\s*\|)+$/.test(line);

    if (isTableRow) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim().replace(/<br\s*\/?>/gi, '\n'));

      if (!inTable) {
        inTable = true;
        headers = cells.map((h) => h.replace(/\*/g, '').trim());
        continue;
      }

      if (isDividerRow) {
        continue;
      }

      if (cells.length > 0 && cells.some((c) => c.length > 0)) {
        const title = cells[0];
        resultLines.push(`• **${title}**`);

        for (let c = 1; c < cells.length; c++) {
          const headerName = headers[c] || `Info`;
          const cellContent = cells[c];
          if (!cellContent) continue;

          const subLines = cellContent.split('\n').map((s) => s.trim()).filter(Boolean);
          if (subLines.length === 1) {
            resultLines.push(`  - **${headerName}:** ${subLines[0].replace(/^[•\-\*]\s*/, '')}`);
          } else {
            resultLines.push(`  - **${headerName}:**`);
            subLines.forEach((sl) => {
              resultLines.push(`    • ${sl.replace(/^[•\-\*]\s*/, '')}`);
            });
          }
        }
        resultLines.push('');
      }
    } else {
      if (inTable) {
        inTable = false;
        headers = [];
      }
      resultLines.push(line);
    }
  }

  return resultLines.join('\n');
}

/**
 * Pre-processes text to remove raw HTML breaks, wrapper brackets, tables, etc.
 */
function sanitizeMessageText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText;

  // 1. Convert <br> tags to standard newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // 2. Remove angle brackets wrapping markdown links: <[Text](url)> -> [Text](url)
  text = text.replace(/<(\[[^\]]+\]\([^)]+\))>/g, '$1');

  // 3. Remove angle brackets wrapping raw URLs: <https://...> -> https://...
  text = text.replace(/<(https?:\/\/[^>]+)>/g, '$1');

  // 4. Convert markdown tables if present
  if (text.includes('|') && /\|[ \t]*[-:]+[-| :]*\|/.test(text)) {
    text = convertTableToBullets(text);
  }

  // 5. Clean escaped asterisks
  text = text.replace(/\\\*/g, '*');

  return text.trim();
}

/**
 * Helper to parse markdown text (bolding **text**, italics *text*, bullet points, [link](url), and raw URLs)
 * into styled React nodes with interactive clickable hyperlinks and clean spacing.
 */
function renderFormattedMessage(rawText: string) {
  const sanitized = sanitizeMessageText(rawText);
  const lines = sanitized.split('\n');

  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed break-words overflow-hidden text-slate-800">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Horizontal divider
        if (/^---+$|^===+$/.test(trimmed)) {
          return <hr key={lineIdx} className="my-2 border-slate-200" />;
        }

        const isNestedBullet = /^(\s{2,}|\t)[•\-\*]/.test(line);
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
              className="inline-flex items-center gap-1 text-[#0f766e] hover:text-[#0d9488] font-bold underline underline-offset-3 decoration-[#0d9488]/50 hover:decoration-[#0d9488] transition-colors cursor-pointer"
            >
              <span>{displayLabel}</span>
              <span className="text-[11px] no-underline font-normal">↗</span>
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
            className={`${
              isNestedBullet
                ? 'pl-5 text-slate-700'
                : isBullet
                ? 'pl-2 text-slate-800'
                : 'text-slate-800'
            }`}
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
      <strong key={`${keyPrefix}-b-${match.index}`} className="font-bold text-slate-950">
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
  const italicRegex = /(?<!\*)\*([^*]+)\*(?!\*)/g;
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
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasUnread, setHasUnread] = useState(true);
  const [showTeaserPill, setShowTeaserPill] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-hide the "Ask Lumi • 24/7 AI Companion" teaser pill after 15 seconds of landing
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTeaserPill(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  // Hide chatbot on all admin side routes (/admin, /admin/login, /admin/account, etc.)
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

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
          {/* Unread / Welcome Prompt Tooltip (Auto-hides after 15 seconds) */}
          {hasUnread && showTeaserPill && (
            <div
              onClick={() => setIsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-200/80 shadow-md text-[12px] font-semibold text-slate-800 cursor-pointer hover:border-teal-400 transition-all duration-500 hover:scale-102 group animate-in fade-in slide-in-from-right-2"
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

      {/* Mobile Darkened Backdrop Overlay (Mobile Only) */}
      {isOpen && (
        <div
          onClick={handleMinimize}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] z-40 sm:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* 2. Floating AI Chat Modal Window (Mobile Floating Sheet & Desktop Floating Window) */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out font-sans ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-8 pointer-events-none'
        } max-sm:bottom-2.5 max-sm:left-2.5 max-sm:right-2.5 max-sm:top-12 max-sm:h-auto max-sm:max-h-[calc(100dvh-3.5rem)] sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:w-[380px] sm:h-[590px] sm:max-h-[85vh]`}
      >
        <div className="w-full h-full bg-white rounded-[24px] sm:rounded-[28px] border border-slate-200/90 shadow-[0_25px_60px_rgba(7,58,70,0.35)] overflow-hidden flex flex-col relative ring-1 ring-black/10">
          
          {/* --- CURVED WAVE HEADER --- */}
          <div className="relative bg-gradient-to-br from-[#073a46] via-[#094d5a] to-[#0d9488] text-white pt-4 pb-7 px-5 flex-shrink-0">
            <div className="flex items-center justify-between relative z-10">
              {/* Header Left: Avatar & Title */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-cyan-300 via-teal-200 to-white shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#073a46] flex items-center justify-center">
                    <LumiOrb size={40} />
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
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none -mb-0.5">
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
                    <LumiOrb size={28} />
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

          {/* --- QUICK SUGGESTIONS CHIPS (Compact & Slim, No Border Lines, No Scrollbar) --- */}
          {messages.length <= 3 && !isTyping && (
            <div className="px-3 py-1.5 bg-[#f8fafc] flex items-center gap-1.5 overflow-x-auto overflow-y-hidden no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-teal-50 border border-slate-200/90 hover:border-teal-300 text-[10px] font-medium text-slate-600 hover:text-teal-800 transition-all shadow-2xs flex-shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* --- INPUT COMPOSER FOOTER (Clean White Pill, No Separator Lines) --- */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white flex items-center gap-2"
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
