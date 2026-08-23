'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Phone,
  User,
  HeartPulse,
  Pill,
  CreditCard,
  Check,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const COMMON_CONDITIONS = [
  'Hypertension (High Blood Pressure)',
  'Dental Anxiety / Phobia',
  'Diabetes (Type 1 / Type 2)',
  'Heart Disease / Pacemaker',
  'Asthma / Respiratory Conditions',
  'Bleeding / Clotting Disorders',
  'Currently Pregnant / Nursing',
  'Joint Replacement / Implants',
];

const COMMON_ALLERGIES = [
  'Penicillin / Amoxicillin',
  'Latex Products',
  'Local Dental Anesthetics (Lidocaine/Epi)',
  'Sulfa Drugs',
  'Aspirin / NSAIDs',
  'Codeine / Opioids',
];

type PageState = 'loading' | 'invalid' | 'expired' | 'completed' | 'valid';

interface AppointmentInfo {
  id: string;
  appointment_date: string;
  time_slot: string;
  service_name: string;
  status: string;
  patients: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    date_of_birth: string | null;
  } | null;
}

function LuminaLogomark({ size = 'large' }: { size?: 'large' | 'small' }) {
  return (
    <div className="flex justify-center mb-6">
      <a href="/" className="inline-flex items-center gap-2.5 group" aria-label="Lumina Dental Studio home">
        <img
          src="/images/lumina-logo.png"
          alt="Lumina Dental Studio"
          className={`${
            size === 'large' ? 'h-16 sm:h-20' : 'h-11 sm:h-12'
          } w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-xs`}
        />
      </a>
    </div>
  );
}

function IntakeContent() {
  const searchParams = useSearchParams();
  const token = (searchParams.get('token') || '').trim();

  const [state, setState] = useState<PageState>('loading');
  const [completedAt, setCompletedAt] = useState<string>('');
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);

  // Form Fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [currentMedications, setCurrentMedications] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [hmoProvider, setHmoProvider] = useState('');
  const [hmoMemberId, setHmoMemberId] = useState('');
  const [consentSigned, setConsentSigned] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 1. Token Verification on Mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setState('invalid');
        return;
      }

      try {
        const res = await fetch(`/api/intake?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.status === 'expired') {
          setState('expired');
        } else if (data.status === 'completed') {
          setCompletedAt(data.completed_at || new Date().toISOString());
          setState('completed');
        } else if (data.status === 'valid' && data.appointment) {
          setAppointment(data.appointment);

          // Restore draft from sessionStorage if available
          const draftKey = `intake_draft_${token}`;
          const savedDraft = typeof window !== 'undefined' ? sessionStorage.getItem(draftKey) : null;
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              setDateOfBirth(parsed.dateOfBirth || data.appointment.patients?.date_of_birth || '');
              setSelectedConditions(parsed.selectedConditions || []);
              setSelectedAllergies(parsed.selectedAllergies || []);
              setCurrentMedications(parsed.currentMedications || '');
              setEmergencyContactName(parsed.emergencyContactName || '');
              setEmergencyContactPhone(parsed.emergencyContactPhone || '');
              setHmoProvider(parsed.hmoProvider || '');
              setHmoMemberId(parsed.hmoMemberId || '');
              setConsentSigned(Boolean(parsed.consentSigned));
            } catch {
              if (data.appointment.patients?.date_of_birth) {
                setDateOfBirth(data.appointment.patients.date_of_birth);
              }
            }
          } else if (data.appointment.patients?.date_of_birth) {
            setDateOfBirth(data.appointment.patients.date_of_birth);
          }

          setState('valid');
        } else {
          // 'invalid' or unhandled error -> State 1 Restricted Access
          setState('invalid');
        }
      } catch {
        setState('invalid');
      }
    }

    verifyToken();
  }, [token]);

  // 2. Draft Persistence to sessionStorage (State 4 only)
  useEffect(() => {
    if (state !== 'valid' || !token) return;

    const draftKey = `intake_draft_${token}`;
    const draftPayload = {
      dateOfBirth,
      selectedConditions,
      selectedAllergies,
      currentMedications,
      emergencyContactName,
      emergencyContactPhone,
      hmoProvider,
      hmoMemberId,
      consentSigned,
    };

    try {
      sessionStorage.setItem(draftKey, JSON.stringify(draftPayload));
    } catch {}
  }, [
    state,
    token,
    dateOfBirth,
    selectedConditions,
    selectedAllergies,
    currentMedications,
    emergencyContactName,
    emergencyContactPhone,
    hmoProvider,
    hmoMemberId,
    consentSigned,
  ]);

  const toggleCondition = (item: string) => {
    setSelectedConditions((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item]
    );
  };

  const toggleAllergy = (item: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const formatPhPhone = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits === '0') return '09';
    if (!digits.startsWith('09')) {
      if (digits.startsWith('9')) {
        digits = '0' + digits;
      } else if (digits.startsWith('639')) {
        digits = '0' + digits.slice(2);
      } else if (!digits.startsWith('0')) {
        digits = '09' + digits;
      }
    }
    digits = digits.slice(0, 11);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentSigned) {
      alert('Please check the digital consent checkbox before submitting.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeToken: token,
          dateOfBirth,
          emergencyContactName,
          emergencyContactPhone,
          medicalConditions: selectedConditions,
          allergies: selectedAllergies,
          currentMedications,
          hmoProvider,
          hmoMemberId,
          consentSigned,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Clear sessionStorage draft
        if (token && typeof window !== 'undefined') {
          sessionStorage.removeItem(`intake_draft_${token}`);
        }
        setCompletedAt(data.completed_at || new Date().toISOString());
        setState('completed');
      } else {
        setSubmitError(data.error || 'Failed to submit medical intake. Please try again.');
      }
    } catch {
      setSubmitError('An unexpected network error occurred while saving your intake.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCompletedDate = (isoStr: string) => {
    try {
      return format(parseISO(isoStr), 'MMMM dd, yyyy');
    } catch {
      return 'Recently';
    }
  };

  // ----------------------------------------------------
  // LOADING STATE
  // ----------------------------------------------------
  if (state === 'loading') {
    return (
      <div className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/95 p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,62,74,0.09)] backdrop-blur-xl text-center animate-in fade-in duration-200">
        <LuminaLogomark size="large" />
        <h2 className="display text-[24px] sm:text-[26px] font-extrabold text-[#0f172a] mb-2">Verifying Patient Portal</h2>
        <p className="text-[14.5px] leading-relaxed text-[#527078]">
          Securely validating session and loading confidential medical intake...
        </p>
        <div className="mt-7 flex items-center justify-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 1 — NO TOKEN / INVALID TOKEN -> RESTRICTED ACCESS
  // ----------------------------------------------------
  if (state === 'invalid') {
    return (
      <div className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/95 p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,62,74,0.09)] backdrop-blur-xl text-center animate-in fade-in zoom-in-95 duration-200" data-testid="state-restricted-access">
        <LuminaLogomark size="large" />
        <h1 className="display text-[26px] sm:text-[28px] font-extrabold text-[#0f172a] tracking-tight mb-3">
          Restricted Access
        </h1>
        <p className="text-[14.5px] leading-relaxed text-[#527078] mb-8">
          This page can only be accessed through the secure link sent to your email after booking. If you&apos;ve lost your link, please contact us and we&apos;ll resend it.
        </p>
        <div className="space-y-4">
          <a
            href="/"
            className="button-primary inline-flex w-full items-center justify-center rounded-xl py-3.5 px-6 text-[14.5px] font-bold shadow-md cursor-pointer"
            data-testid="button-return-home"
          >
            Return to Homepage
          </a>
          <div>
            <a
              href="mailto:luminadentalclinic2026@gmail.com"
              className="text-[13px] font-semibold text-slate-500 hover:text-[#0d9488] transition-colors"
              data-testid="link-contact-us"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 2 — EXPIRED TOKEN -> LINK EXPIRED
  // ----------------------------------------------------
  if (state === 'expired') {
    return (
      <div className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/95 p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,62,74,0.09)] backdrop-blur-xl text-center animate-in fade-in zoom-in-95 duration-200" data-testid="state-link-expired">
        <LuminaLogomark size="large" />
        <h1 className="display text-[26px] sm:text-[28px] font-extrabold text-[#0f172a] tracking-tight mb-3">
          This Link Has Expired
        </h1>
        <p className="text-[14.5px] leading-relaxed text-[#527078] mb-8">
          For your security, intake links expire 14 days after booking. Please contact us and we&apos;ll send you a new one.
        </p>
        <div className="space-y-4">
          <a
            href="/"
            className="button-primary inline-flex w-full items-center justify-center rounded-xl py-3.5 px-6 text-[14.5px] font-bold shadow-md cursor-pointer"
            data-testid="button-return-home"
          >
            Return to Homepage
          </a>
          <div>
            <a
              href="mailto:luminadentalclinic2026@gmail.com"
              className="text-[13px] font-semibold text-slate-500 hover:text-[#0d9488] transition-colors"
              data-testid="link-contact-us"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 3 — ALREADY COMPLETED -> INTAKE ALREADY SUBMITTED
  // ----------------------------------------------------
  if (state === 'completed') {
    return (
      <div className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/95 p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,62,74,0.09)] backdrop-blur-xl text-center animate-in fade-in zoom-in-95 duration-200" data-testid="state-already-completed">
        <LuminaLogomark size="large" />
        <h1 className="display text-[26px] sm:text-[28px] font-extrabold text-[#0f172a] tracking-tight mb-3">
          You&apos;re All Set!
        </h1>
        <p className="text-[14.5px] leading-relaxed text-[#527078] mb-8">
          We already have your medical intake on file for this appointment, submitted on <strong className="font-bold text-[#0f172a]">{formatCompletedDate(completedAt)}</strong>. No further action needed — we&apos;ll see you at your visit.
        </p>
        <a
          href="/"
          className="button-primary inline-flex w-full items-center justify-center rounded-xl py-3.5 px-6 text-[14.5px] font-bold shadow-md cursor-pointer"
          data-testid="button-return-home"
        >
          Return to Homepage
        </a>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 4 — VALID, UNEXPIRED, NOT YET COMPLETED -> SHOW FORM
  // ----------------------------------------------------
  const patient = appointment?.patients;

  return (
    <div className="w-full max-w-[760px] rounded-[28px] border border-white/80 bg-white p-6 sm:p-10 shadow-[0_20px_60px_rgba(15,62,74,0.09)] animate-in fade-in duration-200" data-testid="state-intake-form">
      <LuminaLogomark size="small" />

      {/* Header Banner */}
      <div className="text-center border-b border-slate-100 pb-7 mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3.5 py-1 text-[12px] font-bold text-[#0d9488] border border-teal-200/60 mb-3">
          <FileCheck2 size={13} /> Pre-Visit Digital Health Intake
        </span>
        <h1 className="display text-[26px] sm:text-[30px] font-extrabold text-[#0f172a] tracking-tight">
          Pre-Visit Clinical Health History
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-[#527078] max-w-xl mx-auto">
          Please complete your medical background and consent before arriving so our dentists can prepare your personalized chart.
        </p>

        {/* Patient Appointment Overview */}
        {appointment && (
          <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4.5 text-left grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            <div>
              <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider block">Patient</span>
              <strong className="text-[#0f172a] font-bold text-[14px]">
                {patient ? `${patient.first_name} ${patient.last_name}` : 'Registered Patient'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider block">Treatment</span>
              <strong className="text-[#0f172a] font-bold text-[14px] truncate block">
                {appointment.service_name}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider block">Scheduled Slot</span>
              <strong className="text-[#0d9488] font-bold text-[14px]">
                {appointment.appointment_date} &middot; {appointment.time_slot}
              </strong>
            </div>
          </div>
        )}
      </div>

      {submitError && (
        <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 text-[13.5px] text-rose-700 flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Actual Medical Intake Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Section 1: Date of Birth */}
        <div>
          <label htmlFor="intake-dob" className="block text-[13px] font-bold text-slate-700 mb-1.5">
            Date of Birth <span className="text-rose-500">*</span>
          </label>
          <div className="relative max-w-sm">
            <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="intake-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 py-3 text-[14px] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
              data-testid="input-intake-dob"
              required
            />
          </div>
        </div>

        {/* Section 2: Medical Conditions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HeartPulse size={16} className="text-[#0d9488]" />
            <h3 className="text-[14px] font-bold text-[#0f172a]">Medical Conditions</h3>
          </div>
          <p className="text-[12.5px] text-[#527078] mb-3">
            Select any active or past medical conditions that apply to you:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {COMMON_CONDITIONS.map((cond, idx) => {
              const checked = selectedConditions.includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => toggleCondition(cond)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-[13px] transition-all cursor-pointer ${
                    checked
                      ? 'border-[#0d9488] bg-teal-50/70 text-[#0f172a] font-bold ring-1 ring-[#0d9488]'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                  data-testid={`checkbox-condition-${idx}`}
                >
                  <span>{cond}</span>
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      checked ? 'border-[#0d9488] bg-[#0d9488] text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <Check size={11} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Drug Allergies */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Pill size={16} className="text-[#0d9488]" />
            <h3 className="text-[14px] font-bold text-[#0f172a]">Drug & Material Allergies</h3>
          </div>
          <p className="text-[12.5px] text-[#527078] mb-3">
            Please indicate any allergies to medications or dental materials:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {COMMON_ALLERGIES.map((allergy, idx) => {
              const checked = selectedAllergies.includes(allergy);
              return (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-[13px] transition-all cursor-pointer ${
                    checked
                      ? 'border-[#0d9488] bg-teal-50/70 text-[#0f172a] font-bold ring-1 ring-[#0d9488]'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                  data-testid={`checkbox-allergy-${idx}`}
                >
                  <span>{allergy}</span>
                  <span
                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border transition-all ${
                      checked ? 'border-[#0d9488] bg-[#0d9488] text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {checked && <Check size={11} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Current Medications */}
        <div>
          <label htmlFor="textarea-medications" className="block text-[13px] font-bold text-slate-700 mb-1.5">
            Current Prescriptions & Supplements <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="textarea-medications"
            rows={2}
            value={currentMedications}
            onChange={(e) => setCurrentMedications(e.target.value)}
            placeholder="e.g. Blood pressure medication, daily vitamins, aspirin"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
            data-testid="textarea-medications"
          />
        </div>

        {/* Section 5: Emergency Contact */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Phone size={16} className="text-[#0d9488]" />
            <h3 className="text-[14px] font-bold text-[#0f172a]">Emergency Contact</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-emergency-name" className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Contact Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-emergency-name"
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  data-testid="input-emergency-name"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="input-emergency-phone" className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Mobile Phone <span className="text-rose-500">*</span> <span className="font-normal text-slate-400">(PH: 09XX...)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-emergency-phone"
                  type="tel"
                  value={emergencyContactPhone}
                  onFocus={() => {
                    if (!emergencyContactPhone) setEmergencyContactPhone('09');
                  }}
                  onBlur={() => {
                    if (emergencyContactPhone.trim() === '09') setEmergencyContactPhone('');
                  }}
                  onChange={(e) => setEmergencyContactPhone(formatPhPhone(e.target.value))}
                  placeholder="0917 123 4567"
                  maxLength={13}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
                  data-testid="input-emergency-phone"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Insurance / HMO Info */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-[#0d9488]" />
            <h3 className="text-[14px] font-bold text-[#0f172a]">Dental HMO & Insurance <span className="font-normal text-slate-400 text-[12px]">(optional)</span></h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-hmo-provider" className="block text-[12px] font-bold text-slate-700 mb-1.5">
                HMO / Insurance Provider
              </label>
              <input
                id="input-hmo-provider"
                type="text"
                value={hmoProvider}
                onChange={(e) => setHmoProvider(e.target.value)}
                placeholder="e.g. Maxicare, Intellicare, Medicard"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
                data-testid="input-hmo-provider"
              />
            </div>
            <div>
              <label htmlFor="input-hmo-member-id" className="block text-[12px] font-bold text-slate-700 mb-1.5">
                Member / Policy ID
              </label>
              <input
                id="input-hmo-member-id"
                type="text"
                value={hmoMemberId}
                onChange={(e) => setHmoMemberId(e.target.value)}
                placeholder="e.g. MC-8829104"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
                data-testid="input-hmo-member-id"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Consent Checkbox */}
        <div className="rounded-2xl border border-teal-200/80 bg-teal-50/60 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentSigned}
              onChange={(e) => setConsentSigned(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488] cursor-pointer"
              data-testid="checkbox-intake-consent"
            />
            <span className="text-[13px] leading-relaxed text-slate-700 font-medium">
              I certify that the health information provided above is accurate to the best of my knowledge, and I authorize Lumina Dental Studio to review my clinical records for treatment planning and chairside care.
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="button-primary inline-flex w-full items-center justify-center rounded-xl py-4 px-6 text-[15px] font-bold shadow-md cursor-pointer disabled:opacity-60"
            data-testid="button-submit-intake"
          >
            {submitting ? 'Encrypting & Saving Health Chart...' : 'Submit Confidential Medical Intake'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MedicalIntakePage() {
  return (
    <main className="relative min-h-[100dvh] w-full bg-gradient-to-b from-[#f8fafc] via-[#f1f7f6] to-[#eaf5f4] flex flex-col items-center justify-center p-4 sm:p-6 sm:py-12 overflow-hidden">
      {/* Background Ambience & Lighting Blobs */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] rounded-full bg-teal-100/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-cyan-100/25 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-[460px] rounded-[28px] border border-white/80 bg-white/95 p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,62,74,0.09)] backdrop-blur-xl text-center">
              <LuminaLogomark size="large" />
              <h2 className="display text-[24px] sm:text-[26px] font-extrabold text-[#0f172a] mb-2">Verifying Patient Portal</h2>
              <p className="text-[14.5px] leading-relaxed text-[#527078]">
                Initializing encrypted session...
              </p>
            </div>
          }
        >
          <IntakeContent />
        </Suspense>
      </div>
    </main>
  );
}
