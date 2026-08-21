'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  HeartPulse,
  AlertCircle,
  Pill,
  UserCheck,
  CreditCard,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Lock,
  Phone,
  User,
  Activity,
} from 'lucide-react';

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

interface AppointmentInfo {
  id: string;
  appointment_date: string;
  time_slot: string;
  service_name: string;
  patients: {
    first_name: string;
    last_name: string;
    email: string;
    mobile: string;
    date_of_birth: string | null;
  };
}

function IntakeFormContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
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
  const [submitted, setSubmitted] = useState(false);

  // Fetch appointment metadata using token
  useEffect(() => {
    async function loadAppointment() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/intake?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.appointment) {
          setAppointment(data.appointment);
          if (data.appointment.patients?.date_of_birth) {
            setDateOfBirth(data.appointment.patients.date_of_birth);
          }
        } else {
          setErrorMsg(data.error || 'Invalid or expired intake token.');
        }
      } catch {
        setErrorMsg('Unable to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadAppointment();
  }, [token]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentSigned) {
      alert('Please check the digital consent checkbox before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intakeToken: token || 'preview-demo-token',
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
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit intake. Please try again.');
      }
    } catch {
      setErrorMsg('An unexpected error occurred while saving your intake.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#0d9488] border-t-transparent" />
          <p className="text-[14px] font-medium text-slate-500">Loading your confidential patient intake...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-[680px] py-12 px-4 sm:px-6">
        <div className="overflow-hidden rounded-[28px] border border-[#a2dfd9] bg-white p-8 sm:p-12 shadow-[0_20px_60px_rgba(15,62,74,0.09)] text-center animate-in zoom-in-95 duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-[#0d9488]">
            <CheckCircle2 size={36} strokeWidth={2.4} />
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-[12px] font-bold text-[#0d9488]">
            <ShieldCheck size={14} /> Intake Received & Chart Synced
          </span>
          <h1 className="mt-3 text-[26px] sm:text-[30px] font-extrabold text-[#0f172a] tracking-[-0.02em]">
            Medical History Successfully Verified
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed text-[#527078]">
            Thank you, <strong className="text-slate-800">{appointment?.patients?.first_name || 'Patient'}</strong>. Your clinical alerts, drug allergies, and emergency contact have been encrypted and linked directly to your chairside dental chart.
          </p>

          <div className="mt-7 rounded-2xl bg-slate-50 border border-slate-100 p-5 text-left text-[13.5px] space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold">Scheduled Visit:</span>
              <span className="font-bold text-[#0f172a]">{appointment?.appointment_date || 'Confirmed Reservation'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold">Reserved Slot:</span>
              <span className="font-bold text-[#0d9488]">{appointment?.time_slot || '1-Hour Slot'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold">Clinical Service:</span>
              <span className="font-bold text-[#0f172a] truncate max-w-[280px]">{appointment?.service_name || 'Specialized Care'}</span>
            </div>
          </div>

          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f3e4a] px-7 py-3.5 text-[14.5px] font-bold text-white shadow-md hover:bg-[#144f5e] transition-all"
            >
              Return to Studio Home <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[840px] py-10 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-3 mb-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3.5 py-1 text-[12px] font-bold text-[#0d9488]">
          <ShieldCheck size={14} /> HIPAA-Compliant Digital Intake
        </div>
        <h1 className="text-[30px] sm:text-[36px] font-black text-[#0f172a] tracking-tight">
          Pre-Visit Clinical Health History
        </h1>
        <p className="text-[15px] text-[#527078] max-w-[620px] mx-auto leading-relaxed">
          Please complete your pre-appointment health intake. This enables our clinical team to manage local anesthetics, prevent drug interactions, and ensure gentle chairside care.
        </p>
      </div>

      {/* Appointment Overview Bar */}
      {appointment && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0f3e4a] to-[#16505e] p-5 sm:p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#a2dfd9]">Patient Chart</span>
            <h2 className="text-[18px] font-extrabold flex items-center gap-2">
              <User size={18} className="text-[#a2dfd9]" />
              {appointment.patients.first_name} {appointment.patients.last_name}
            </h2>
            <p className="text-[13px] text-[#c2dcde]">{appointment.service_name}</p>
          </div>
          <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-[13px] text-[#d4e4e6]">
            <div className="flex items-center gap-1.5 font-semibold">
              <Calendar size={14} className="text-[#8ce0db]" /> {appointment.appointment_date}
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <Clock size={14} className="text-[#8ce0db]" /> {appointment.time_slot}
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-[14px] text-rose-800 flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-8 rounded-[28px] border border-slate-200/90 bg-white p-6 sm:p-10 shadow-[0_20px_60px_rgba(15,62,74,0.06)]">
        {/* Section 1: Patient Identity & DOB */}
        <div className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <UserCheck size={19} className="text-[#0d9488]" /> 1. Patient Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="intake-dob" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                id="intake-dob"
                data-testid="input-intake-dob"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="intake-phone" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Primary Contact Number
              </label>
              <input
                id="intake-phone"
                data-testid="input-intake-phone"
                type="tel"
                placeholder="(415) 555-0142"
                defaultValue={appointment?.patients?.mobile || ''}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 2: Medical Conditions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
              <HeartPulse size={19} className="text-[#0d9488]" /> 2. Systemic & Clinical Health Conditions
            </h3>
            <span className="text-[12px] font-semibold text-slate-400">Select all that apply</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMON_CONDITIONS.map((cond, idx) => {
              const isChecked = selectedConditions.includes(cond);
              return (
                <label
                  key={cond}
                  data-testid={`checkbox-condition-${idx}`}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-[#0d9488] bg-teal-50/70 text-[#0f3e4a] font-bold ring-1 ring-[#0d9488]'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCondition(cond)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488]"
                  />
                  <span className="text-[13.5px]">{cond}</span>
                </label>
              );
            })}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 3: Drug & Material Allergies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
              <Activity size={19} className="text-rose-500" /> 3. Drug & Material Allergies
            </h3>
            <span className="text-[12px] font-semibold text-rose-500">Crucial for anesthesia safety</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMON_ALLERGIES.map((allergy, idx) => {
              const isChecked = selectedAllergies.includes(allergy);
              return (
                <label
                  key={allergy}
                  data-testid={`checkbox-allergy-${idx}`}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-rose-400 bg-rose-50/80 text-rose-950 font-bold ring-1 ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleAllergy(allergy)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[13.5px]">{allergy}</span>
                </label>
              );
            })}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 4: Current Medications */}
        <div className="space-y-3">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <Pill size={19} className="text-[#0d9488]" /> 4. Current Medications & Supplements
          </h3>
          <textarea
            data-testid="textarea-medications"
            rows={2}
            value={currentMedications}
            onChange={(e) => setCurrentMedications(e.target.value)}
            placeholder="List any daily prescription drugs, blood thinners, herbal supplements, or vitamins..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-[14px] text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <hr className="border-slate-100" />

        {/* Section 5: Emergency Contact */}
        <div className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <Phone size={19} className="text-[#0d9488]" /> 5. Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergency-name" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Contact Full Name
              </label>
              <input
                id="emergency-name"
                data-testid="input-emergency-name"
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Jonathan Vane"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="emergency-phone" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Contact Phone Number
              </label>
              <input
                id="emergency-phone"
                data-testid="input-emergency-phone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="(415) 555-9988"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 6: Insurance & HMO Details */}
        <div className="space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <CreditCard size={19} className="text-[#0d9488]" /> 6. Dental Insurance / HMO Provider (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="hmo-provider" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Insurance Carrier / HMO
              </label>
              <input
                id="hmo-provider"
                data-testid="input-hmo-provider"
                type="text"
                value={hmoProvider}
                onChange={(e) => setHmoProvider(e.target.value)}
                placeholder="e.g. Delta Dental Premier, Cigna, MetLife"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="hmo-member-id" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Member ID / Group Number
              </label>
              <input
                id="hmo-member-id"
                data-testid="input-hmo-member-id"
                type="text"
                value={hmoMemberId}
                onChange={(e) => setHmoMemberId(e.target.value)}
                placeholder="e.g. DD-992140"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Section 7: HIPAA & Digital Consent */}
        <div className="rounded-2xl bg-teal-50/60 border border-teal-200/80 p-5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              data-testid="checkbox-intake-consent"
              checked={consentSigned}
              onChange={(e) => setConsentSigned(e.target.checked)}
              required
              className="mt-1 h-4.5 w-4.5 rounded border-teal-300 text-[#0d9488] focus:ring-[#0d9488]"
            />
            <span className="text-[13px] text-slate-700 leading-relaxed font-medium">
              I certify that the clinical health information provided above is accurate and complete to the best of my knowledge. I authorize Lumina Dental Studio to utilize this confidential record in planning my clinical diagnostic and restorative treatment under HIPAA standards.
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            data-testid="button-submit-intake"
            disabled={submitting}
            className="button-primary flex w-full items-center justify-center gap-2.5 rounded-xl py-4 px-8 text-[15.5px] font-bold shadow-lg cursor-pointer"
          >
            {submitting ? (
              <>Encrypting & Saving Health Chart...</>
            ) : (
              <>
                <Lock size={16} /> Submit Confidential Medical Intake <Sparkles size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MedicalIntakePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#0d9488] border-t-transparent" />
        </div>
      }
    >
      <IntakeFormContent />
    </Suspense>
  );
}
