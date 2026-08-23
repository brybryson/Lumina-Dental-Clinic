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
  ArrowRight,
  Phone,
  User,
  Activity,
  Menu,
  X,
  Mail,
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

type LegalTab = 'privacy' | 'terms' | 'hipaa' | 'accessibility';

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

function IntakeNav({ onEmergency }: { onEmergency: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 pt-3 sm:pt-4 transition-all duration-300">
      <div
        className={`mx-auto max-w-[1320px] rounded-2xl border transition-all duration-300 px-5 py-3 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-[0_10px_35px_-10px_rgba(15,23,42,0.1)] border-slate-200/80'
            : 'bg-white/90 backdrop-blur-md shadow-xs border-slate-200/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 group" data-testid="link-logo" aria-label="Lumina Dental Clinic home">
            <img
              src="/images/lumina-logo.png"
              alt="Lumina Dental Clinic Logo"
              className="h-8.5 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="display text-[16px] font-extrabold tracking-[-.03em] text-[#0f172a]">
              Lumina <span className="font-semibold text-[#0d9488]">Dental Clinic</span>
            </span>
          </a>

          {/* Navigation Links */}
          <nav aria-label="Primary navigation" className="hidden items-center gap-7 md:flex">
            <button
              onClick={() => { window.location.href = '/#treatments'; }}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              Treatments
            </button>
            <button
              onClick={() => { window.location.href = '/#standards'; }}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              Our Standard
            </button>
            <button
              onClick={() => { window.location.href = '/#stories'; }}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              Stories
            </button>
            <button
              onClick={() => { window.location.href = '/#faq'; }}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => { window.location.href = '/intake'; }}
              className="text-[13px] font-semibold text-[#0d9488] transition-colors cursor-pointer"
              data-testid="nav-link-intake"
            >
              Digital Intake
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              className="text-[12.5px] font-bold text-rose-800 bg-rose-50/90 hover:bg-rose-100 border border-rose-200/80 px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              onClick={onEmergency}
              data-testid="button-emergency-care"
            >
              <Phone size={13} className="text-rose-600" />
              Emergency care
            </button>
            <button
              className="button-primary flex items-center gap-2 rounded-xl px-4.5 py-2.5 text-[13px] font-bold shadow-xs cursor-pointer"
              onClick={() => { window.location.href = '/#booking-section'; }}
              data-testid="button-nav-reserve"
            >
              Inquire & Book <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 md:hidden cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            data-testid="button-mobile-menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {open && (
          <div className="mt-3 border-t border-slate-100 pt-3 md:hidden">
            <div className="flex flex-col gap-2">
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700 hover:text-[#0d9488] cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/#treatments';
                }}
              >
                Treatments
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700 hover:text-[#0d9488] cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/#standards';
                }}
              >
                Our Standard
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700 hover:text-[#0d9488] cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/#stories';
                }}
              >
                Stories
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700 hover:text-[#0d9488] cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/#faq';
                }}
              >
                FAQ
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-[#0d9488] cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/intake';
                }}
                data-testid="mobile-link-intake"
              >
                Digital Intake
              </button>
              <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-slate-100">
                <button
                  className="flex items-center justify-between rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800 cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    onEmergency();
                  }}
                >
                  <span>Emergency care</span>
                  <Phone size={14} className="text-rose-600" />
                </button>
                <button
                  className="button-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = '/#booking-section';
                  }}
                >
                  Inquire & Book <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function IntakeFooter({ onOpenLegal }: { onOpenLegal: (tab: LegalTab) => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b242c] py-14 text-[#d4e4e6] border-t border-[#1a444e] mt-16" aria-labelledby="footer-title">
      <div className="section-shell">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#1c4b57]">
          {/* Logo & Tagline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/lumina-logo.png"
                alt="Lumina Dental Clinic Logo"
                className="h-8.5 w-auto object-contain brightness-110"
              />
              <span id="footer-title" className="display text-[16.5px] font-extrabold text-white">
                Lumina <span className="text-[#8ce0db] font-semibold">Dental Clinic</span>
              </span>
            </div>
            <p className="text-[13.5px] text-[#9fbcc1] max-w-[420px]">
              Modern, pain-managed dental care, restorative aesthetics, and digital diagnostics.
            </p>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 text-[13px] text-[#c2dcde]">
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-[#8ce0db] shrink-0" />
              <a href="tel:+14155550142" className="font-bold hover:text-white transition-colors" data-testid="link-footer-phone">
                (415) 555-0142
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-[#8ce0db] shrink-0" />
              <a href="mailto:luminadentalclinic2026@gmail.com" className="hover:text-white transition-colors" data-testid="link-footer-email">
                luminadentalclinic2026@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic System Year & Legal */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#7699a0]">
          <p>© {currentYear} Lumina Dental Clinic, LLC. All rights reserved.</p>
          <div className="flex flex-wrap gap-5 text-[#9fbcc1]">
            <a
              href="/intake"
              className="text-[#8ce0db] font-semibold hover:text-white transition-colors"
              data-testid="link-footer-intake"
            >
              Patient Medical Intake
            </a>
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('hipaa')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              HIPAA Compliance
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('accessibility')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Accessibility
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function EmergencyDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
    >
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-[30px] bg-white p-8 sm:p-11 shadow-[0_30px_90px_rgba(15,23,42,0.24)] border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-4">
          <h2 id="emergency-title" className="display text-[26px] sm:text-[30px] font-extrabold text-[#0f172a] leading-tight">
            Experiencing acute dental pain?
          </h2>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close emergency care dialog"
            data-testid="button-close-emergency"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-3.5 text-[15.5px] leading-relaxed text-[#527078]">
          Our clinical team reserves same-day emergency slots daily for trauma, acute nerve pain, and infections.
        </p>

        <div className="mt-7 rounded-2xl bg-slate-50/90 border border-slate-200 p-6 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[14.5px]">
            <span className="font-semibold text-slate-500 flex items-center gap-2.5">
              <Phone size={17} className="text-[#0d9488] shrink-0" /> Emergency Direct Line
            </span>
            <span className="font-bold text-[#0f172a] text-[15px] select-all">(415) 555-0142</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-slate-200/80 pt-4 text-[14.5px]">
            <span className="font-semibold text-slate-500 flex items-center gap-2.5">
              <Mail size={17} className="text-[#0d9488] shrink-0" /> Clinical Triage Email
            </span>
            <span className="font-bold text-[#0f172a] text-[15px] select-all">luminadentalclinic2026@gmail.com</span>
          </div>
        </div>

        <div className="mt-7">
          <a
            href="/#booking-section"
            className="button-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 px-8 text-[15.5px] font-bold shadow-md cursor-pointer text-center"
            onClick={onClose}
            data-testid="button-emergency-online-slot"
          >
            Hold emergency appointment slot online →
          </a>
        </div>
      </div>
    </div>
  );
}

function LegalDialog({ initialTab, onClose }: { initialTab: LegalTab; onClose: () => void }) {
  const [tab, setTab] = useState<LegalTab>(initialTab);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-title"
    >
      <div className="relative w-full max-w-[760px] max-h-[85vh] flex flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)] border border-slate-100 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:px-8 shrink-0">
          <h3 id="legal-title" className="display text-[20px] font-extrabold text-[#0f172a]">
            Legal & Compliance Notices
          </h3>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-5 sm:px-8 gap-2 overflow-x-auto bg-slate-50/50 shrink-0">
          {[
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms of Service' },
            { id: 'hipaa', label: 'HIPAA Notice' },
            { id: 'accessibility', label: 'Accessibility' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as LegalTab)}
              className={`py-3 px-3.5 text-[13px] font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                tab === t.id
                  ? 'border-[#0d9488] text-[#0d9488]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-8 overflow-y-auto text-[13.5px] leading-relaxed text-[#475569] space-y-4">
          {tab === 'privacy' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-[#0f172a] text-[16px]">Privacy Practices & Data Protection</h4>
              <p>
                Lumina Dental Studio is committed to safeguarding your personal and medical information. All digital intake forms, contact details, and appointment inquiries submitted through this platform are encrypted in transit using 256-bit SSL encryption.
              </p>
              <h5 className="font-bold text-[#0f172a] text-[14.5px] pt-1">Information Collection</h5>
              <p>
                We collect patient identification, insurance information, clinical concerns, and contact preferences strictly for triage and care coordination. We never sell or share patient information with third-party advertisers.
              </p>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-[#0f172a] text-[16px]">Terms & Conditions of Service</h4>
              <p>
                By scheduling an appointment or submitting a triage request with Lumina Dental Studio, you agree to our studio policies regarding clinical consultations, confirmed reservation holds, and insurance verification.
              </p>
              <h5 className="font-bold text-[#0f172a] text-[14.5px] pt-1">Cancellation & Rescheduling</h5>
              <p>
                We kindly request at least 24 hours advance notice for rescheduling or cancellations to allow emergency triage patients access to reserved chairside times.
              </p>
            </div>
          )}

          {tab === 'hipaa' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-[#0f172a] text-[16px]">HIPAA Health Information Privacy</h4>
              <p>
                Lumina Dental Studio strictly adheres to the Health Insurance Portability and Accountability Act (HIPAA) standards for Protected Health Information (PHI).
              </p>
              <p>
                Your clinical records, diagnostic digital radiographs (CBCT/2D), and medical histories are stored in HIPAA-compliant, SOC-2 certified cloud dental infrastructure with role-based access control.
              </p>
            </div>
          )}

          {tab === 'accessibility' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-[#0f172a] text-[16px]">Digital Accessibility Standards</h4>
              <p>
                We believe healthcare should be accessible to everyone. Lumina Dental Studio is designed in compliance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and Section 508 standards.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:px-8 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="button-primary rounded-xl py-2 px-6 text-[13.5px] font-bold cursor-pointer"
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
}

function IntakeFormContent({
  onEmergency,
}: {
  onEmergency: () => void;
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState<boolean>(Boolean(token));
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
          const rawPatients = data.appointment.patients;
          const patientObj = Array.isArray(rawPatients) ? rawPatients[0] : rawPatients;
          const normalizedApt = { ...data.appointment, patients: patientObj };
          setAppointment(normalizedApt);
          if (patientObj?.date_of_birth) {
            setDateOfBirth(patientObj.date_of_birth);
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
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="relative mx-auto w-full max-w-[440px] rounded-3xl border border-teal-100/80 bg-white/95 p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,62,74,0.08)] backdrop-blur-xl text-center animate-in fade-in duration-300">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-[#0d9488]">
            <div className="absolute inset-0 rounded-2xl border-2 border-[#0d9488]/30 animate-ping opacity-30" />
            <ShieldCheck size={32} className="relative z-10 text-[#0d9488]" />
          </div>
          <h3 className="mt-5 text-[18px] font-extrabold text-[#0f172a]">
            Accessing Patient Portal
          </h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
            Securely decrypting session and loading your confidential health chart...
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce [animation-delay:-0.3s]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce [animation-delay:-0.15s]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce" />
          </div>
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
        <div className="mb-8 rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/90 via-[#f0fcfb] to-teal-50/90 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#0d9488]">Patient Chart</span>
              <h2 className="text-[18px] font-extrabold flex items-center gap-2 text-[#0f172a]">
                <User size={18} className="text-[#0d9488]" />
                {appointment.patients?.first_name} {appointment.patients?.last_name}
              </h2>
            </div>
            <div className="flex flex-wrap gap-4 text-[13px] text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold">
                <Calendar size={15} className="text-[#0d9488]" />
                <span>{appointment.appointment_date}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Clock size={15} className="text-[#0d9488]" />
                <span>{appointment.time_slot}</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold">
                <Activity size={15} className="text-[#0d9488]" />
                <span>{appointment.service_name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-[14px] font-semibold text-rose-800">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Verification & Demographics */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <UserCheck size={20} className="text-[#0d9488]" />
            1. Patient Identification & Date of Birth
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
                Confirm Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="intake-phone"
                data-testid="input-intake-phone"
                type="tel"
                placeholder="(415) 000-0000"
                defaultValue={appointment?.patients?.mobile || ''}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Medical Conditions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
              <HeartPulse size={20} className="text-[#0d9488]" />
              2. Medical History & Systemic Conditions
            </h3>
            <span className="text-[12px] font-semibold text-slate-400">Select all that apply</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {COMMON_CONDITIONS.map((cond, idx) => {
              const selected = selectedConditions.includes(cond);
              return (
                <button
                  type="button"
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  data-testid={`checkbox-condition-${idx}`}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-[13.5px] transition-all cursor-pointer ${
                    selected
                      ? 'border-[#0d9488] bg-teal-50/70 text-[#0f3e4a] font-bold ring-1 ring-[#0d9488]'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <span>{cond}</span>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      selected ? 'border-[#0d9488] bg-[#0d9488] text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selected && <CheckCircle2 size={13} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Drug Allergies */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
              <AlertCircle size={20} className="text-rose-600" />
              3. Known Drug & Material Allergies
            </h3>
            <span className="text-[12px] font-semibold text-rose-500">Crucial for anesthesia safety</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {COMMON_ALLERGIES.map((allergy, idx) => {
              const selected = selectedAllergies.includes(allergy);
              return (
                <button
                  type="button"
                  key={allergy}
                  onClick={() => toggleAllergy(allergy)}
                  data-testid={`checkbox-allergy-${idx}`}
                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left text-[13.5px] transition-all cursor-pointer ${
                    selected
                      ? 'border-rose-400 bg-rose-50/80 text-rose-950 font-bold ring-1 ring-rose-400'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100/80 font-medium'
                  }`}
                >
                  <span>{allergy}</span>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      selected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selected && <CheckCircle2 size={13} strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Current Medications */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <Pill size={20} className="text-[#0d9488]" />
            4. Current Prescription Medications & Dosages
          </h3>
          <div>
            <textarea
              id="intake-medications"
              data-testid="textarea-medications"
              rows={3}
              placeholder="e.g. Lisinopril 10mg daily, Metformin 500mg, Daily Multivitamin (or type 'None')"
              value={currentMedications}
              onChange={(e) => setCurrentMedications(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Section 5: Emergency Contact */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <Phone size={20} className="text-[#0d9488]" />
            5. Designated Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergency-name" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Contact Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="emergency-name"
                data-testid="input-emergency-name"
                type="text"
                placeholder="e.g. Marcus Vance"
                required
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="emergency-phone" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                id="emergency-phone"
                data-testid="input-emergency-phone"
                type="tel"
                placeholder="(415) 000-0000"
                required
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Dental Insurance & HMO Carrier */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <h3 className="text-[17px] font-extrabold text-[#0f172a] flex items-center gap-2">
            <CreditCard size={20} className="text-[#0d9488]" />
            6. Dental Benefit & Insurance Carrier (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="intake-insurance" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Insurance Carrier / HMO Provider
              </label>
              <input
                id="intake-insurance"
                data-testid="input-hmo-provider"
                type="text"
                placeholder="e.g. Delta Dental Premier / MetLife"
                value={hmoProvider}
                onChange={(e) => setHmoProvider(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="intake-member-id" className="block text-[13px] font-bold text-slate-700 mb-1.5">
                Member ID / Subscriber #
              </label>
              <input
                id="intake-member-id"
                data-testid="input-hmo-member-id"
                type="text"
                placeholder="e.g. DLT-8849201"
                value={hmoMemberId}
                onChange={(e) => setHmoMemberId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[14px] font-medium text-slate-800 focus:border-[#0d9488] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Legal Consent & Signature Checkbox */}
        <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5 sm:p-6">
          <label className="flex items-start gap-3.5 cursor-pointer">
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
            {submitting ? 'Encrypting & Saving Health Chart...' : 'Submit Confidential Medical Intake'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MedicalIntakePage() {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ open: boolean; tab: LegalTab }>({
    open: false,
    tab: 'privacy',
  });

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#f8fafc]">
      <div>
        <IntakeNav onEmergency={() => setEmergencyOpen(true)} />
        <main>
          <Suspense
            fallback={
              <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
                <div className="relative mx-auto w-full max-w-[440px] rounded-3xl border border-teal-100/80 bg-white/95 p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,62,74,0.08)] backdrop-blur-xl text-center">
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-[#0d9488]">
                    <div className="absolute inset-0 rounded-2xl border-2 border-[#0d9488]/30 animate-ping opacity-30" />
                    <ShieldCheck size={32} className="relative z-10 text-[#0d9488]" />
                  </div>
                  <h3 className="mt-5 text-[18px] font-extrabold text-[#0f172a]">
                    Accessing Patient Portal
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
                    Initializing encrypted patient session...
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2.5 w-2.5 rounded-full bg-[#0d9488] animate-bounce" />
                  </div>
                </div>
              </div>
            }
          >
            <IntakeFormContent onEmergency={() => setEmergencyOpen(true)} />
          </Suspense>
        </main>
      </div>

      <IntakeFooter onOpenLegal={(tab) => setLegalModal({ open: true, tab })} />

      {emergencyOpen && <EmergencyDialog onClose={() => setEmergencyOpen(false)} />}
      {legalModal.open && (
        <LegalDialog
          initialTab={legalModal.tab}
          onClose={() => setLegalModal((p) => ({ ...p, open: false }))}
        />
      )}
    </div>
  );
}
