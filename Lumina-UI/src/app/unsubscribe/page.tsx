'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react';

function LuminaLogomark() {
  return (
    <div className="flex justify-center mb-8">
      <a href="/" className="inline-flex items-center gap-3 group" aria-label="Lumina Dental Studio home">
        <img
          src="/images/lumina-logo.png"
          alt="Lumina Dental Studio Logo"
          className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
        />
        <div className="text-left">
          <span className="block display font-extrabold text-[#0f172a] text-[19px] leading-tight tracking-tight">
            Lumina Dental Studio
          </span>
          <span className="block text-[11px] text-[#0d9488] font-bold tracking-[0.14em] uppercase">
            Clinical &amp; Aesthetic Dentistry
          </span>
        </div>
      </a>
    </div>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get('email');

  const [email, setEmail] = useState('');
  const [isLockedFromUrl, setIsLockedFromUrl] = useState(false);
  const [optOutBookingReminders, setOptOutBookingReminders] = useState(true);
  const [optOutRecallReminders, setOptOutRecallReminders] = useState(true);
  const [optOutNewsletters, setOptOutNewsletters] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (queryEmail) {
      const decoded = decodeURIComponent(queryEmail).trim();
      setEmail(decoded);
      setIsLockedFromUrl(true);
    }
  }, [queryEmail]);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          preferences: {
            bookingReminders: optOutBookingReminders,
            recallReminders: optOutRecallReminders,
            newsletters: optOutNewsletters,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Unable to update communication preferences.');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[580px] mx-auto">
      <LuminaLogomark />

      <div className="rounded-[28px] bg-white border border-slate-200/90 shadow-[0_24px_70px_rgba(15,62,74,0.08)] p-7 sm:p-10 transition-all">
        {isSuccess ? (
          <div>
            <div className="mb-6">
              <p className="eyebrow mb-2">PREFERENCES UPDATED</p>
              <h1 className="display text-[24px] sm:text-[28px] font-extrabold text-[#0f172a] leading-tight">
                You Have Been Unsubscribed
              </h1>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#527078]">
                Automated reminders and promotional communications for{' '}
                <strong className="text-[#0f172a] font-semibold">{email}</strong> have been turned off.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50/90 border border-slate-200/90 p-5 mb-8 text-[13.5px] leading-relaxed text-[#527078]">
              <span className="font-bold text-[#0f172a] block mb-1">
                Clinical Safety Guarantee
              </span>
              Direct appointment confirmations, intake documents, and urgent chairside notices for actively scheduled visits will continue to reach your inbox for medical record safety.
            </div>

            <div className="pt-2">
              <a
                href="/"
                className="button-primary w-full py-4 px-6 rounded-xl text-white text-center font-bold text-[15px] cursor-pointer block"
              >
                Return to Home
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="eyebrow mb-2">COMMUNICATION SETTINGS</p>
              <h1 className="display text-[24px] sm:text-[28px] font-extrabold text-[#0f172a] leading-tight">
                Email Preferences &amp; Opt-Out
              </h1>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#527078]">
                Manage your clinical reminders, preventive hygiene notices, and studio updates.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13.5px] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUnsubscribe} className="space-y-5">
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    required
                    readOnly={isLockedFromUrl}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-[14.5px] border transition-all ${
                      isLockedFromUrl
                        ? 'bg-slate-100/90 border-slate-200 text-[#0f172a] font-medium cursor-not-allowed select-all'
                        : 'bg-white border-slate-200 text-[#0f172a] focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20'
                    }`}
                  />
                </div>
                {isLockedFromUrl && (
                  <p className="text-[12px] text-slate-400 mt-1.5">
                    This email is locked to match the link from your message.
                  </p>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <span className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select communications to opt out from:
                </span>

                {/* Option 1 */}
                <label className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50/90 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutBookingReminders}
                    onChange={(e) => setOptOutBookingReminders(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488] cursor-pointer"
                  />
                  <div className="text-[13.5px]">
                    <span className="font-bold text-[#0f172a] block">
                      Incomplete Booking &amp; Inquiry Follow-ups
                    </span>
                    <span className="text-[#527078] text-[12.5px] leading-relaxed block mt-0.5">
                      Prompts to complete selecting a chairside slot when reserving online.
                    </span>
                  </div>
                </label>

                {/* Option 2 */}
                <label className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50/90 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutRecallReminders}
                    onChange={(e) => setOptOutRecallReminders(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488] cursor-pointer"
                  />
                  <div className="text-[13.5px]">
                    <span className="font-bold text-[#0f172a] block">
                      6-Month Hygiene &amp; Preventive Recalls
                    </span>
                    <span className="text-[#527078] text-[12.5px] leading-relaxed block mt-0.5">
                      Semi-annual routine dental exam and professional prophylaxis reminders.
                    </span>
                  </div>
                </label>

                {/* Option 3 */}
                <label className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50/90 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutNewsletters}
                    onChange={(e) => setOptOutNewsletters(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488] cursor-pointer"
                  />
                  <div className="text-[13.5px]">
                    <span className="font-bold text-[#0f172a] block">
                      Studio Updates &amp; Announcements
                    </span>
                    <span className="text-[#527078] text-[12.5px] leading-relaxed block mt-0.5">
                      Aesthetic dentistry news and seasonal clinical announcements.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button-primary w-full py-4 px-6 rounded-xl disabled:opacity-60 text-white font-bold text-[15px] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Preferences...
                    </>
                  ) : (
                    'Confirm Unsubscribe'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-400">
              <a href="/" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Lumina Home
              </a>
              <span>Lumina Dental Studio &copy; 2026</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen hero-wash py-12 px-4 sm:px-6 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-[#0d9488]/20 border-t-[#0d9488] rounded-full animate-spin mx-auto mb-3" />
            Loading preferences...
          </div>
        }
      >
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}
