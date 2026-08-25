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
          className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
        />
        <div className="text-left">
          <span className="block font-bold text-slate-900 text-lg leading-tight tracking-tight">
            Lumina Dental Studio
          </span>
          <span className="block text-[10.5px] text-teal-800 font-semibold tracking-wider uppercase">
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
      setErrorMsg('Please provide a valid email address.');
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
    <div className="w-full max-w-lg mx-auto">
      <LuminaLogomark />

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-lg shadow-slate-900/4 p-7 sm:p-9 transition-all">
        {isSuccess ? (
          <div className="text-left">
            <div className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold tracking-wide mb-4">
              Preferences Updated
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 tracking-tight">
              You Have Been Unsubscribed
            </h1>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Automated reminders and promotional communications for{' '}
              <strong className="text-slate-900 font-semibold">{email}</strong> have been turned off.
            </p>

            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 mb-7 text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800 block mb-1">
                Clinical Safety Guarantee
              </span>
              Direct notifications, time-sensitive confirmations, and intake forms for actively confirmed chairside visits will continue to reach your inbox.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href="/"
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-center font-medium text-sm transition-colors cursor-pointer shadow-sm"
              >
                Return to Lumina Home
              </a>
              <a
                href="/#booking"
                className="w-full sm:flex-1 py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-center font-medium text-sm transition-colors cursor-pointer"
              >
                Book an Appointment
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Email Preferences &amp; Opt-Out
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage your clinical communication and reminder settings
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUnsubscribe} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="email-input"
                    className="text-xs font-semibold text-slate-700 uppercase tracking-wider"
                  >
                    Email Address
                  </label>
                  {isLockedFromUrl && (
                    <span className="text-[11px] font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                      Auto-detected
                    </span>
                  )}
                </div>

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
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all ${
                      isLockedFromUrl
                        ? 'bg-slate-100/80 border-slate-200 text-slate-700 cursor-not-allowed font-medium'
                        : 'bg-white border-slate-200 text-slate-900 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
                    }`}
                  />
                </div>
                {isLockedFromUrl && (
                  <p className="text-[11.5px] text-slate-400 mt-1.5">
                    This address was automatically loaded from your email notification.
                  </p>
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select communications to opt out from:
                </span>

                {/* Option 1 */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutBookingReminders}
                    onChange={(e) => setOptOutBookingReminders(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 block">
                      Incomplete Booking &amp; Inquiry Follow-ups
                    </span>
                    <span className="text-slate-500 leading-normal block mt-0.5">
                      Prompts to finish selecting a slot when reserving online.
                    </span>
                  </div>
                </label>

                {/* Option 2 */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutRecallReminders}
                    onChange={(e) => setOptOutRecallReminders(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 block">
                      6-Month Hygiene &amp; Preventive Recalls
                    </span>
                    <span className="text-slate-500 leading-normal block mt-0.5">
                      Semi-annual routine dental checkup and cleaning reminders.
                    </span>
                  </div>
                </label>

                {/* Option 3 */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50/80 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutNewsletters}
                    onChange={(e) => setOptOutNewsletters(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 block">
                      Studio Updates &amp; Announcements
                    </span>
                    <span className="text-slate-500 leading-normal block mt-0.5">
                      Aesthetic dentistry news and seasonal clinical announcements.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
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

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <a href="/" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </a>
              <span>Lumina Dental Studio</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-teal-700/20 border-t-teal-700 rounded-full animate-spin mx-auto mb-3" />
            Loading preferences...
          </div>
        }
      >
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}
