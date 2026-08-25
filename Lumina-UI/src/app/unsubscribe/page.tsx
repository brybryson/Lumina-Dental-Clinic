'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  BellOff,
  CalendarCheck,
  Check,
} from 'lucide-react';

function LuminaLogomark() {
  return (
    <div className="flex justify-center mb-6">
      <a href="/" className="inline-flex items-center gap-3 group" aria-label="Lumina Dental Studio home">
        <img
          src="/images/lumina-logo.png"
          alt="Lumina Dental Studio Logo"
          className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
        />
        <div className="text-left">
          <span className="block font-bold text-slate-900 text-lg leading-tight tracking-tight">
            Lumina Dental Studio
          </span>
          <span className="block text-[11px] text-teal-700 font-medium tracking-wide uppercase">
            Clinical &amp; Aesthetic Dentistry
          </span>
        </div>
      </a>
    </div>
  );
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState('');
  const [optOutBookingReminders, setOptOutBookingReminders] = useState(true);
  const [optOutRecallReminders, setOptOutRecallReminders] = useState(true);
  const [optOutNewsletters, setOptOutNewsletters] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (rawEmail) {
      setEmail(decodeURIComponent(rawEmail).trim());
    }
  }, [rawEmail]);

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
        throw new Error(data.error || 'Failed to update preferences.');
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <LuminaLogomark />

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/5 p-6 sm:p-10 transition-all">
        {isSuccess ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 border border-teal-200 text-teal-700 mb-5 shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              Subscription Preferences Updated
            </h1>

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              The email <strong className="text-slate-800 font-semibold">{email}</strong> has been successfully unsubscribed from automated booking follow-ups and routine recall reminders.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-8 text-left text-xs text-slate-600 space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Clinical Safety Guarantee:</strong> Direct notifications for any active confirmed appointments or emergency alerts will still be delivered.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Lumina Home
              </a>
              <a
                href="/#booking"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/70 text-teal-800 font-medium text-sm transition-colors"
              >
                <CalendarCheck className="w-4 h-4 text-teal-700" />
                Book an Appointment
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                <BellOff className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Email Preferences &amp; Opt-Out
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Manage your communication preferences for Lumina Dental Studio
                </p>
              </div>
            </div>

            <hr className="border-slate-100 my-5" />

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <span className="font-semibold block">Notice</span>
                  {errorMsg}
                </div>
              </div>
            )}

            <form onSubmit={handleUnsubscribe} className="space-y-6">
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2"
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Select communications to opt out from:
                </span>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutBookingReminders}
                    onChange={(e) => setOptOutBookingReminders(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 block">
                      Incomplete Booking &amp; Inquiry Follow-ups
                    </span>
                    <span className="text-slate-500 leading-normal">
                      Reminders when you begin booking or ask an inquiry on our website.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutRecallReminders}
                    onChange={(e) => setOptOutRecallReminders(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 block">
                      6-Month Routine Hygiene Recalls
                    </span>
                    <span className="text-slate-500 leading-normal">
                      Semi-annual checkup reminders to protect your preventive dental health.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={optOutNewsletters}
                    onChange={(e) => setOptOutNewsletters(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800 block">
                      Clinic Announcements &amp; Aesthetic Updates
                    </span>
                    <span className="text-slate-500 leading-normal">
                      Periodic seasonal announcements and aesthetic dentistry updates.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:opacity-60 text-white font-semibold text-sm shadow-md shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Preferences...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      Confirm Unsubscribe
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <a href="/" className="hover:text-teal-700 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 py-12 px-4 sm:px-6 flex items-center justify-center">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500 text-sm">
            <div className="w-6 h-6 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
            Loading preferences...
          </div>
        }
      >
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}
