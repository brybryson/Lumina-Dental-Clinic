'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock3,
  FileText,
  HeartPulse,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  ScanLine,
  Send,
  Star,
  User,
  X,
  MessageCircleQuestion,
  Sparkles,
  MessageSquare,
  Microscope,
  ShieldCheck,
  HeartHandshake,
  ClipboardCheck,
} from 'lucide-react';

type Service = {
  name: string;
  copy: string;
};

const services: Service[] = [
  {
    name: 'Dental Cleaning & Routine Checkup',
    copy: 'Gentle ultrasonic plaque debridement, comprehensive clinical exam, precision polishing, and remineralizing enamel glaze.',
  },
  {
    name: 'Laser Teeth Whitening',
    copy: 'Sensitivity-controlled in-office laser treatment providing immediate, high-impact aesthetic brightness in one session.',
  },
  {
    name: 'Clear Aligners & Braces (Orthodontics)',
    copy: 'Custom transparent aligners and modern orthodontic solutions for comfortable, discreet smile alignment.',
  },
  {
    name: 'Porcelain Veneers & Smile Design',
    copy: 'Handcrafted ultra-thin ceramic veneers designed for transformative smile symmetry, contouring, and natural luster.',
  },
  {
    name: 'Tooth Fillings & Ceramic Crowns',
    copy: 'Durable composite restorations and custom porcelain crowns matched precisely to your natural tooth enamel.',
  },
  {
    name: 'Gentle Root Canal Therapy',
    copy: 'Advanced micro-endodontic therapy designed to eliminate acute nerve pain and infection while saving your natural tooth.',
  },
  {
    name: 'Wisdom Teeth & Tooth Extractions',
    copy: 'Minimally invasive 3D-guided surgical extractions with automated post-treatment care and rapid recovery protocols.',
  },
  {
    name: 'Dental Implants & Restoration',
    copy: 'Permanent biocompatible titanium implants engineered to restore 100% natural bite strength and aesthetics.',
  },
  {
    name: 'Deep Gum Cleaning & Periodontal Care',
    copy: 'Targeted subgingival root scaling to halt gum bleeding, reverse periodontal inflammation, and restore oral tissue.',
  },
];

const organizedCareCategories = [
  {
    category: 'Preventive & Cosmetic Care',
    items: [
      {
        name: 'Dental Cleaning & Routine Checkup',
        badge: '45 Mins • Semi-Annual Clean',
        desc: 'Ultrasonic plaque removal, exam, and remineralizing fluoride polish.',
      },
      {
        name: 'Laser Teeth Whitening',
        badge: '60 Mins • Zero Sensitivity',
        desc: 'Instant aesthetic brightness with zero tooth dehydration.',
      },
      {
        name: 'Clear Aligners & Braces (Orthodontics)',
        badge: '3D Scan • Custom Trays',
        desc: 'Computer-mapped alignment with clear aligners or modern braces.',
      },
      {
        name: 'Porcelain Veneers & Smile Design',
        badge: 'Custom Ceramic • Cosmetic',
        desc: 'Ultra-thin porcelain veneers for customized cosmetic smile makeover.',
      },
      {
        name: 'Deep Gum Cleaning & Periodontal Care',
        badge: 'Deep Root Planing',
        desc: 'Subgingival therapy to halt gum recession and restore tissue health.',
      },
    ],
  },
  {
    category: 'Restorative & Surgical Dentistry',
    items: [
      {
        name: 'Tooth Fillings & Ceramic Crowns',
        badge: 'Exact Enamel Match',
        desc: 'Durable composite fillings and custom porcelain ceramic crowns.',
      },
      {
        name: 'Gentle Root Canal Therapy',
        badge: 'Acute Pain Relief',
        desc: 'Micro-endodontics designed to save your natural tooth painlessly.',
      },
      {
        name: 'Wisdom Teeth & Tooth Extractions',
        badge: '3D Guided • Safe',
        desc: 'Minimally invasive extractions with gentle anesthesia and recovery care.',
      },
      {
        name: 'Dental Implants & Restoration',
        badge: 'Permanent Replacement',
        desc: 'Biocompatible titanium implants for natural strength and lifetime function.',
      },
    ],
  },
];

const bookingServices = [
  'Dental Cleaning & Routine Checkup',
  'Laser Teeth Whitening',
  'Clear Aligners & Braces (Orthodontics)',
  'Porcelain Veneers & Smile Design',
  'Tooth Fillings & Ceramic Crowns',
  'Gentle Root Canal Therapy',
  'Wisdom Teeth & Tooth Extractions',
  'Dental Implants & Restoration',
  'Deep Gum Cleaning & Periodontal Care',
];

const weekdayTimeSlots = [
  '09:00 AM – 10:00 AM',
  '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM',
  '12:00 PM – 01:00 PM',
  '01:00 PM – 02:00 PM',
  '02:00 PM – 03:00 PM',
  '03:00 PM – 04:00 PM',
  '04:00 PM – 05:00 PM',
];

const saturdayTimeSlots = [
  '09:00 AM – 10:00 AM',
  '10:00 AM – 11:00 AM',
  '11:00 AM – 12:00 PM',
  '12:00 PM – 01:00 PM',
  '01:00 PM – 02:00 PM',
  '02:00 PM – 03:00 PM',
];

const timeSlots = weekdayTimeSlots;

function getTimeSlotsForDate(dateStr: string): string[] {
  if (!dateStr) return weekdayTimeSlots;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return weekdayTimeSlots;
  if (d.getDay() === 6) {
    return saturdayTimeSlots;
  }
  return weekdayTimeSlots;
}

function trackEvent(event: string, detail?: Record<string, string>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('lumina:analytics', { detail: { event, ...detail } }));
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[analytics] ${event}`, detail ?? {});
    }
  }
}

function scrollToId(id: string) {
  if (typeof document !== 'undefined') {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5 group" data-testid="link-logo" aria-label="Lumina Dental Clinic home">
      <img
        src="/images/lumina-logo.png"
        alt="Lumina Dental Clinic Logo"
        className="h-8.5 w-auto object-contain group-hover:scale-105 transition-transform"
      />
      <span className="display text-[16px] font-extrabold tracking-[-.03em] text-[#0f172a]">
        Lumina <span className="font-semibold text-[#0d9488]">Dental Clinic</span>
      </span>
    </a>
  );
}

function Nav({ onEmergency }: { onEmergency: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 280);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 px-4 sm:px-6 pt-3 sm:pt-4 transition-all duration-500 ease-out pointer-events-none ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-8 pointer-events-none'
      }`}
    >
      <div className={`mx-auto max-w-[1320px] rounded-2xl bg-white/90 backdrop-blur-xl shadow-[0_10px_35px_-10px_rgba(15,23,42,0.1)] border border-slate-200/80 px-5 py-3 transition-all duration-300 ${
        isVisible ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        <div className="flex items-center justify-between">
          <Logo />

          {/* Navigation Links (Responsive at 1024px+ and compact gaps) */}
          <nav aria-label="Primary navigation" className="hidden items-center gap-4 lg:gap-6 xl:gap-7 lg:flex">
            <button
              onClick={() => go('treatments')}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              Treatments
            </button>
            <button
              onClick={() => go('standards')}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              Our Standard
            </button>
            <button
              onClick={() => go('stories')}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              Stories
            </button>
            <button
              onClick={() => go('faq')}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <button
              onClick={() => {
                setOpen(false);
                window.location.href = '/intake';
              }}
              className="text-[13px] font-semibold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
              data-testid="nav-link-intake"
            >
              Digital Intake
            </button>
          </nav>

          {/* Right Action Group */}
          <div className="hidden items-center gap-2 sm:gap-2.5 lg:gap-3 md:flex">
            <button
              className="text-[12px] sm:text-[12.5px] font-bold text-rose-800 bg-rose-50/90 hover:bg-rose-100 border border-rose-200/80 px-2.5 sm:px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              onClick={onEmergency}
              data-testid="button-emergency-care"
            >
              <Phone size={13} className="text-rose-600" />
              <span>Emergency care</span>
            </button>
            <button
              className="button-primary flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-4.5 py-2.5 text-[12.5px] sm:text-[13px] font-bold shadow-xs cursor-pointer shrink-0"
              onClick={() => {
                trackEvent('cta_clicked', { location: 'nav' });
                go('booking-section');
              }}
              data-testid="button-nav-reserve"
            >
              Inquire & Book <ArrowRight size={14} />
            </button>
          </div>

          {/* Mobile Menu Button (Visible below lg breakpoint) */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 lg:hidden cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
            data-testid="button-mobile-menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile / Tablet Dropdown */}
        {open && (
          <div className="mt-3 border-t border-slate-100 pt-3 lg:hidden">
            <div className="flex flex-col gap-2">
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700"
                onClick={() => go('treatments')}
              >
                Treatments
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700"
                onClick={() => go('standards')}
              >
                Our Standard
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700"
                onClick={() => go('stories')}
              >
                Stories
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700"
                onClick={() => go('faq')}
              >
                FAQ
              </button>
              <button
                className="text-left py-1.5 text-sm font-semibold text-slate-700 hover:text-[#0d9488] cursor-pointer"
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
                  className="flex items-center justify-between rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800"
                  onClick={() => {
                    setOpen(false);
                    onEmergency();
                  }}
                >
                  <span>Emergency care</span>
                  <Phone size={14} className="text-rose-600" />
                </button>
                <button
                  className="button-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"
                  onClick={() => go('booking-section')}
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

function Hero({ onEmergency }: { onEmergency: () => void }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-[76px] pb-10 sm:pt-[84px] sm:pb-20 lg:pt-[104px] lg:pb-28 sm:min-h-[90vh] flex items-center bg-[#f8fafc]"
      aria-labelledby="hero-title"
    >
      {/* Full HD Indoor Dental Operatory Cover */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-operatory.png"
          alt="Lumina Dental Studio Operatory Suite"
          className="h-full w-full object-cover object-right md:object-center scale-[1.01]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/95 to-[#f8fafc]/40 sm:from-[#f8fafc] sm:via-[#f8fafc]/80 sm:via-52% sm:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f8fafc] to-transparent" />
      </div>

      {/* Architectural Line Grid & Precision Dot Pattern */}
      <div className="absolute inset-0 bg-grid-tech opacity-70 pointer-events-none" />

      {/* Luxury Ambient Atmospheric Light Blooms */}
      <div className="absolute top-1/4 -left-24 w-[480px] h-[480px] rounded-full bg-teal-200/25 blur-[130px] pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full bg-teal-100/35 blur-[110px] pointer-events-none -z-10" />

      {/* Subtle Clinical Cross Grid Decorative Markers */}
      <div className="absolute top-28 right-16 text-teal-600/20 font-mono text-sm tracking-widest hidden xl:block select-none pointer-events-none">
        + &nbsp; + &nbsp; +
      </div>
      <div className="absolute bottom-24 left-16 text-teal-600/20 font-mono text-sm tracking-widest hidden xl:block select-none pointer-events-none">
        + &nbsp; + &nbsp; +
      </div>

      <div className="relative z-10 w-full max-w-[1440px] pl-5 sm:pl-8 md:pl-10 lg:pl-12 xl:pl-16 pr-5 sm:pr-8 mx-auto">
        <div className="reveal hero-copy max-w-[880px]">
          <div className="mb-3.5 sm:mb-5 inline-flex items-center rounded-full bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-1 sm:py-1.5 border border-teal-200/90 shadow-xs text-[11px] sm:text-[11.5px] font-bold uppercase tracking-[.12em] text-[#0d9488]">
            Modern Dental Studio • Accepting New Patients
          </div>

          <h1
            id="hero-title"
            className="display text-[clamp(2.35rem,6vw,5.25rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#0f172a]"
          >
            Precision dentistry,<br />
            <span className="text-[#0d9488]">complete comfort.</span>
          </h1>

          <p className="mt-3.5 sm:mt-6 max-w-[580px] text-[15px] sm:text-[18px] leading-[1.65] sm:leading-[1.75] text-[#475569]">
            A calmer kind of dental care for routine checkups, confident smile design, and gentle treatments without the wait.
          </p>

          {/* Responsive Hero CTA buttons */}
          <div className="mt-5 sm:mt-8 grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:items-center sm:gap-3.5">
            <button
              className="col-span-2 button-primary flex items-center justify-center gap-2.5 rounded-xl py-3.5 px-6 text-[14px] sm:text-[14.5px] font-bold shadow-md cursor-pointer"
              onClick={() => {
                trackEvent('cta_clicked', { location: 'hero' });
                scrollToId('booking-section');
              }}
              data-testid="button-hero-schedule"
            >
              Start an Inquiry <ArrowRight className="arrow" size={17} />
            </button>
            <button
              className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white/95 backdrop-blur-md py-3 px-3 sm:px-6 text-[12.5px] sm:text-[14.5px] font-bold text-[#334155] transition-colors hover:border-[#0d9488] hover:text-[#0d9488] shadow-xs cursor-pointer"
              onClick={() => scrollToId('treatments')}
              data-testid="button-hero-treatments"
            >
              Explore <span className="hidden sm:inline">treatments</span> <ChevronDown size={15} />
            </button>
            <button
              onClick={onEmergency}
              className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/95 backdrop-blur-md py-3 px-3 sm:px-5 text-[12.5px] sm:text-[13.5px] font-bold text-rose-900 transition-colors hover:bg-rose-100 cursor-pointer"
              data-testid="button-hero-emergency-inline"
            >
              <Phone size={14} className="text-rose-600" /> Urgent Care
            </button>
          </div>

          {/* Hero Trust Bar: 1 horizontal row on mobile & desktop with clean readable font */}
          <div className="hero-proof mt-6 sm:mt-12 grid grid-cols-3 gap-2 sm:gap-6 border-t border-slate-300/80 pt-4 sm:pt-8 max-w-[840px]">
            <div className="flex flex-col gap-0.5 sm:gap-1 text-center items-center sm:text-left sm:items-start">
              <span className="text-[13.5px] sm:text-[15px] font-extrabold text-[#0f172a]">Pain-Managed</span>
              <span className="text-[11px] sm:text-[12.5px] text-slate-600 font-medium leading-tight">
                <span className="sm:hidden">Gentle & anxiety-free</span>
                <span className="hidden sm:inline">Gentle care & anxiety-free comfort</span>
              </span>
            </div>

            <div className="flex flex-col gap-0.5 sm:gap-1 text-center items-center sm:text-left sm:items-start">
              <span className="text-[13.5px] sm:text-[15px] font-extrabold text-[#0f172a]">100% Digital</span>
              <span className="text-[11px] sm:text-[12.5px] text-slate-600 font-medium leading-tight">
                <span className="sm:hidden">Zero wait time</span>
                <span className="hidden sm:inline">No paper clipboards or wait times</span>
              </span>
            </div>

            <div className="flex flex-col gap-0.5 sm:gap-1 text-center items-center sm:text-left sm:items-start">
              <span className="text-[13.5px] sm:text-[15px] font-extrabold text-[#0f172a]">Insurance</span>
              <span className="text-[11px] sm:text-[12.5px] text-slate-600 font-medium leading-tight">
                <span className="sm:hidden">HMOs accepted</span>
                <span className="hidden sm:inline">All major HMOs & health plans accepted</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Treatments() {
  const [showAll, setShowAll] = useState(false);

  const selectService = (name: string) => {
    trackEvent('treatment_selected', { treatment: name });
    window.dispatchEvent(new CustomEvent('lumina:select-service', { detail: { service: name } }));
    scrollToId('booking-section');
  };

  const initialServices = services.slice(0, 6);
  const remainingServices = services.slice(6, 9);

  return (
    <section id="treatments" className="relative bg-[#f8fafc] py-20 lg:py-32 border-t border-slate-200/80 overflow-hidden" aria-labelledby="treatments-title">
      {/* Precision Dot Matrix & Light Accents */}
      <div className="absolute inset-0 bg-dots-precision opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[550px] h-[550px] rounded-full bg-teal-100/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-cyan-100/20 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1440px] px-4 sm:px-8 md:px-12 lg:px-16 mx-auto">
        <div className="reveal flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-[620px]">
            <p className="eyebrow">Specialized care</p>
            <h2 id="treatments-title" className="display mt-2 sm:mt-3 text-[clamp(1.9rem,3.8vw,3.2rem)] font-extrabold leading-[1.08] text-[#0f172a]">
              Comprehensive dentistry under one roof.
            </h2>
          </div>
          <p className="max-w-[420px] text-[14px] sm:text-[16px] leading-relaxed text-[#527078] md:text-right md:pb-1">
            Clinical expertise meets restorative comfort.<br className="hidden sm:inline" />
            Select a service to reserve your preferred appointment.
          </p>
        </div>

        {/* 2 cards per row on mobile (grid-cols-2), 3 on desktop (lg:grid-cols-3) */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {initialServices.map((service, index) => (
            <div
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:border-[#0d9488]/60 hover:shadow-[0_16px_36px_rgba(13,148,136,0.12)] hover:-translate-y-0.5 transition-all duration-300"
              key={service.name}
              data-testid={`card-treatment-${index}`}
            >
              <div>
                <span className="display text-[12px] sm:text-[13px] font-extrabold text-[#0d9488]">
                  0{index + 1}
                </span>

                <h3 className="display mt-2 sm:mt-3 text-[14.5px] sm:text-[17.5px] font-extrabold leading-snug text-[#0f172a]">
                  {service.name}
                </h3>

                <p className="mt-2 sm:mt-2.5 text-[12px] sm:text-[13.5px] leading-relaxed text-slate-600 line-clamp-3 sm:line-clamp-none">
                  {service.copy}
                </p>
              </div>

              <button
                className="mt-3.5 sm:mt-6 pt-2.5 sm:pt-3.5 border-t border-slate-100 flex items-center justify-between text-[12px] sm:text-[13px] font-bold text-[#0d9488] group-hover:text-[#0f766e] transition-colors cursor-pointer"
                onClick={() => selectService(service.name)}
                data-testid={`button-select-treatment-${index}`}
              >
                <span className="sm:hidden">Select Service</span>
                <span className="hidden sm:inline">Select & Inquire This Service</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {showAll && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-3 sm:pt-6 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {remainingServices.map((service, index) => {
                  const actualIndex = index + 6;
                  return (
                    <div
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:border-[#0d9488]/60 hover:shadow-[0_16px_36px_rgba(13,148,136,0.12)] hover:-translate-y-0.5 transition-all duration-300"
                      key={service.name}
                      data-testid={`card-treatment-${actualIndex}`}
                    >
                      <div>
                        <span className="display text-[12px] sm:text-[13px] font-extrabold text-[#0d9488]">
                          0{actualIndex + 1}
                        </span>

                        <h3 className="display mt-2 sm:mt-3 text-[14.5px] sm:text-[17.5px] font-extrabold leading-snug text-[#0f172a]">
                          {service.name}
                        </h3>

                        <p className="mt-2 sm:mt-2.5 text-[12px] sm:text-[13.5px] leading-relaxed text-slate-600 line-clamp-3 sm:line-clamp-none">
                          {service.copy}
                        </p>
                      </div>

                      <button
                        className="mt-3.5 sm:mt-6 pt-2.5 sm:pt-3.5 border-t border-slate-100 flex items-center justify-between text-[12px] sm:text-[13px] font-bold text-[#0d9488] group-hover:text-[#0f766e] transition-colors cursor-pointer"
                        onClick={() => selectService(service.name)}
                        data-testid={`button-select-treatment-${actualIndex}`}
                      >
                        <span className="sm:hidden">Select Service</span>
                        <span className="hidden sm:inline">Select & Inquire This Service</span>
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <button
            onClick={() => {
              const next = !showAll;
              setShowAll(next);
              if (!next) {
                scrollToId('treatments');
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-[13.5px] font-bold text-slate-700 shadow-xs hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-slate-50 transition-all cursor-pointer"
            data-testid="button-toggle-services"
          >
            {showAll ? (
              <>
                View less <ChevronUp size={16} />
              </>
            ) : (
              <>
                View more <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

function Standards() {
  const features = [
    {
      number: '01',
      icon: Microscope,
      title: 'Microscopic precision & zero guesswork',
      copy: 'High-definition intraoral scanners capture 6,000 frames per second for exact restorations without impression putty.',
    },
    {
      number: '02',
      icon: ShieldCheck,
      title: 'Sensitivity-managed comfort standards',
      copy: 'Computer-controlled local anesthesia delivery ensures targeted, gentle numbing with zero residual facial heaviness.',
    },
    {
      number: '03',
      icon: HeartHandshake,
      title: 'Automated post-care recovery',
      copy: 'Customized instructions, dietary guidelines, and direct provider check-ins sent automatically after your procedure.',
    },
  ];
  return (
    <section id="standards" className="relative bg-gradient-to-b from-[#f0f8f7] via-[#e6f4f2] to-[#edf7f6] py-24 lg:py-32 overflow-hidden" aria-labelledby="standards-title">
      {/* Precision Stripes Pattern Overlay */}
      <div className="absolute inset-0 bg-stripes-subtle opacity-75 pointer-events-none" />

      {/* Ambient Lighting */}
      <div className="absolute top-10 left-1/3 w-[600px] h-[400px] rounded-full bg-teal-200/25 blur-[140px] pointer-events-none" />

      {/* Decorative Wave Flow Lines */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-24 text-white/40 pointer-events-none" viewBox="0 0 1440 96" fill="none" preserveAspectRatio="none">
        <path d="M0,32 C320,96 640,0 960,48 C1200,80 1360,16 1440,32 L1440,96 L0,96 Z" fill="currentColor" />
      </svg>

      <div className="section-shell relative z-10">
        <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-[600px]">
            <p className="eyebrow">The Lumina standard</p>
            <h2 id="standards-title" className="display mt-3 text-[clamp(2rem,3.8vw,3.2rem)] font-extrabold leading-[1.08] text-[#0f172a]">
              Quiet technology.<br />
              Visible care.
            </h2>
          </div>
          <p className="max-w-[420px] text-[15px] sm:text-[16px] leading-relaxed text-[#527078] md:text-right md:pb-1">
            Every detail is designed to give you more information,<br className="hidden sm:inline" />
            more control, and less to worry about.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                className={`reveal reveal-delay-${index + 1} relative rounded-2xl bg-white/85 backdrop-blur-md border border-teal-200/70 p-7 sm:p-8 shadow-[0_4px_20px_rgba(13,148,136,0.04)] hover:bg-white hover:border-[#0d9488]/50 hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
                key={feature.number}
                data-testid={`feature-standard-${index}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="display text-[14px] font-extrabold text-[#0d9488]">{feature.number}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-[#0d9488]">
                      <Icon size={20} strokeWidth={1.75} />
                    </div>
                  </div>
                  <h3 className="display mt-8 text-[20px] sm:text-[21px] font-extrabold text-[#0f172a] leading-snug">{feature.title}</h3>
                  <p className="mt-3.5 text-[14px] leading-[1.65] text-[#527078]">{feature.copy}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AnimatedStarRating({ rating, outOf = 5 }: { rating: number; outOf?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex items-center gap-1" aria-label={`${rating} out of ${outOf} stars`}>
      {Array.from({ length: outOf }).map((_, i) => {
        const starNumber = i + 1;
        const isFilled = starNumber <= Math.floor(rating);
        const isHalf = !isFilled && starNumber - 0.5 <= rating;

        return (
          <span
            key={i}
            className="relative inline-flex items-center justify-center transition-all duration-500 ease-out"
            style={{
              transitionDelay: `${i * 120}ms`,
              transform: inView ? 'scale(1) rotate(0deg)' : 'scale(0.55) rotate(-20deg)',
              opacity: inView ? 1 : 0.25,
            }}
          >
            {isFilled ? (
              <Star
                size={16}
                className="text-amber-400 fill-amber-400 filter drop-shadow-[0_1px_2px_rgba(251,191,36,0.35)]"
              />
            ) : isHalf ? (
              <span className="relative inline-block h-4 w-4">
                <Star size={16} className="text-slate-300 fill-slate-100" />
                <span className="absolute inset-0 overflow-hidden w-[52%]">
                  <Star
                    size={16}
                    className="text-amber-400 fill-amber-400 filter drop-shadow-[0_1px_2px_rgba(251,191,36,0.35)]"
                  />
                </span>
              </span>
            ) : (
              <Star size={16} className="text-slate-300 fill-slate-100/60 stroke-[1.75]" />
            )}
          </span>
        );
      })}
    </div>
  );
}

function Stories() {
  const stories = [
    {
      name: 'Marcus V.',
      service: 'Routine Prophylaxis',
      rating: 5.0,
      date: 'Sept 2025',
      quote: 'I avoided dental visits for years due to severe anxiety. Dr. Vance and the team explained every instrument beforehand, and the digital intake meant I walked straight into the suite.',
    },
    {
      name: 'Elena R.',
      service: 'Laser Whitening',
      rating: 4.5,
      date: 'Oct 2025',
      quote: 'Booked online in under 60 seconds. The laser whitening took under an hour with zero tooth sensitivity, and the results for my wedding were flawless.',
    },
    {
      name: 'David K.',
      service: 'Emergency Endodontics',
      rating: 4.0,
      date: 'Nov 2025',
      quote: 'Woke up with acute tooth pain. Secured an emergency slot online, was in the chair by noon, and had a root canal completed with absolute comfort.',
    },
  ];

  return (
    <section id="stories" className="relative bg-[#f8fafc] py-24 lg:py-32 border-t border-slate-200/80 overflow-hidden" aria-labelledby="stories-title">
      {/* Precision Tech Grid Pattern */}
      <div className="absolute inset-0 bg-grid-tech opacity-45 pointer-events-none" />

      {/* Ambient Lighting */}
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-teal-100/25 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-cyan-100/20 blur-[130px] pointer-events-none" />

      <div className="section-shell relative z-10">
        <div className="reveal flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 id="stories-title" className="display mt-1 text-[clamp(2rem,3.8vw,3.2rem)] font-extrabold leading-[1.1] text-[#0f172a]">
              Trusted by Over<br />
              2,500 Local Smiles
            </h2>
          </div>
          <p className="max-w-[360px] text-[15.5px] sm:text-[16.5px] leading-relaxed text-[#527078] md:text-right md:pb-1">
            Verified experiences from patients who wanted modern, pain-managed dental care.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stories.map((story, index) => (
            <article
              key={story.name}
              className={`reveal reveal-delay-${index + 1} relative overflow-hidden flex flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white/95 backdrop-blur-md p-7 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-lg hover:-translate-y-1 hover:border-teal-300/80 transition-all duration-300 ease-out`}
              data-testid={`card-story-${index}`}
            >
              {/* Header with stars & date (Top of card, fully clear of watermark) */}
              <div className="relative z-10 border-b border-slate-100 pb-3.5 flex items-center justify-between">
                <AnimatedStarRating rating={story.rating} />
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-full">
                  {story.date}
                </span>
              </div>

              {/* Body Text with enlarged editorial watermark placed behind paragraph */}
              <div className="relative z-10 mt-4">
                <span className="pointer-events-none select-none absolute -left-2 -top-7 sm:-top-9 text-[130px] sm:text-[150px] font-serif leading-none text-[#0d9488]/15 -z-10 select-none">
                  “
                </span>
                <p className="relative z-10 text-[14.5px] leading-[1.75] text-[#334155]">
                  {story.quote}
                </p>
              </div>

              <div className="relative z-10 mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-extrabold text-[#0f172a]">{story.name}</p>
                  <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[.08em] text-[#0d9488]">{story.service}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-[#0d9488]">
                  <User size={14} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomCalendar({
  selectedDate,
  onSelectDate,
  bookedSchedule,
  allSlots,
}: {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  bookedSchedule: Record<string, string[]>;
  allSlots: string[];
}) {
  // Base view month starting at August 2026
  const [viewDate, setViewDate] = useState<Date>(new Date(2026, 7, 1));
  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const monthName = format(viewDate, 'MMMM yyyy');
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const blankDays = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Allow navigation: min month is August 2026, can navigate forward to future months
  const minMonth = new Date(2026, 7, 1);
  const isAtMinMonth = year === minMonth.getFullYear() && month <= minMonth.getMonth();

  const handlePrevMonth = () => {
    if (!isAtMinMonth) {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Baseline today comparison (Aug 25, 2026)
  const todayKey = 20260825;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-[#0d9488]" />
          <span className="text-[14px] font-extrabold text-[#0f172a]">{monthName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isAtMinMonth}
            onClick={handlePrevMonth}
            className={`p-1.5 rounded-lg transition-colors ${
              isAtMinMonth
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer'
            }`}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 pt-3 text-center text-[11px] font-bold text-slate-400 uppercase">
        {daysOfWeek.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 pt-1 text-center">
        {Array.from({ length: blankDays }).map((_, i) => (
          <div key={`blank-${i}`} className="h-9 w-full" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNumber = i + 1;
          const dayDate = new Date(year, month, dayNumber);
          const dayKey = year * 10000 + (month + 1) * 100 + dayNumber;
          const dayOfWeek = dayDate.getDay();
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;
          const isPastOrToday = dayKey <= todayKey;
          const dateString = format(dayDate, 'MMM dd, yyyy');
          const isSelected = selectedDate === dateString;

          const daySlots = isSaturday ? saturdayTimeSlots : weekdayTimeSlots;
          const bookedSlotsForDay = bookedSchedule[dateString] || [];
          const isFullyBooked = bookedSlotsForDay.length >= daySlots.length;
          const isDisabled = isPastOrToday || isSunday || isFullyBooked;

          return (
            <button
              key={`day-${year}-${month}-${dayNumber}`}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateString)}
              data-testid={`calendar-day-${dayNumber}`}
              title={
                isFullyBooked
                  ? 'Fully booked — All appointment slots occupied for this date'
                  : isSunday
                  ? 'Closed on Sundays (Staff Rest Day)'
                  : isPastOrToday
                  ? 'Past Date'
                  : isSaturday
                  ? 'Available (Saturday 9:00 AM – 3:00 PM)'
                  : 'Available for Booking'
              }
              className={`relative h-9 w-full rounded-xl text-[13px] font-bold transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-[#0d9488] text-white shadow-xs ring-2 ring-[#0d9488]/40 scale-105 z-10'
                  : isFullyBooked
                  ? 'bg-rose-100/90 border border-rose-300/90 text-rose-600 cursor-not-allowed'
                  : isDisabled
                  ? 'text-slate-300 cursor-not-allowed bg-transparent'
                  : 'text-slate-700 hover:bg-teal-50 hover:text-[#0d9488] cursor-pointer'
              }`}
            >
              <span>{dayNumber}</span>
            </button>
          );
        })}
      </div>

      {/* Calendar Availability Legend */}
      <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#0d9488]" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>Fully Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span>Closed (Sun) / Past</span>
        </div>
      </div>
    </div>
  );
}

function DobDatePicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (dateStr: string) => void;
  error?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const initialDate = value ? new Date(value) : null;
  const [viewYear, setViewYear] = useState<number>(
    initialDate && !isNaN(initialDate.getTime()) ? initialDate.getFullYear() : 2000
  );
  const [viewMonth, setViewMonth] = useState<number>(
    initialDate && !isNaN(initialDate.getTime()) ? initialDate.getMonth() : 0
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const currentYear = new Date().getFullYear();
  const startYear = 1920;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowMonthMenu(false);
        setShowYearMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant non-animated placement at viewYear (e.g. 1988, 2008) or 2000 when opened
  useLayoutEffect(() => {
    if (showYearMenu && yearListRef.current) {
      const activeEl = (yearListRef.current.querySelector('[data-active="true"]') ||
        yearListRef.current.querySelector('[data-year="2000"]')) as HTMLElement | null;
      if (activeEl) {
        yearListRef.current.scrollTop = Math.max(0, activeEl.offsetTop - 6);
      }
    }
  }, [showYearMenu]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewYear === currentYear && viewMonth >= new Date().getMonth()) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${mStr}-${dStr}`;
    onChange(formatted);
    setIsOpen(false);
    setShowMonthMenu(false);
    setShowYearMenu(false);
  };

  const displayFormatted = (val: string) => {
    if (!val) return '';
    const parts = val.split('-');
    if (parts.length !== 3) return val;
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const parts = value.split('-');
    if (parts.length !== 3) return false;
    return (
      Number(parts[0]) === viewYear &&
      Number(parts[1]) === viewMonth + 1 &&
      Number(parts[2]) === day
    );
  };

  const isFuture = (day: number) => {
    const checkDate = new Date(viewYear, viewMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  return (
    <div className="relative z-50" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowMonthMenu(false);
          setShowYearMenu(false);
        }}
        className={`w-full flex items-center justify-between rounded-xl border bg-slate-50/70 pl-10 pr-3.5 py-3.5 text-[14.5px] transition-all text-left cursor-pointer focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
          error ? 'border-rose-400 bg-rose-50/50 text-slate-900' : 'border-slate-200 text-slate-900'
        }`}
        data-testid="button-dob-picker"
        aria-expanded={isOpen}
      >
        <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>
          {value ? displayFormatted(value) : 'Select date of birth'}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#0d9488]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-2 w-full sm:w-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_25px_60px_rgba(15,23,42,0.28)] animate-in fade-in zoom-in-95 duration-150">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-1 pb-3 border-b border-slate-100 relative">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Custom Month Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthMenu(!showMonthMenu);
                    setShowYearMenu(false);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-[12.5px] font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span>{months[viewMonth]}</span>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform ${showMonthMenu ? 'rotate-180' : ''}`} />
                </button>

                {showMonthMenu && (
                  <div className="absolute left-0 top-full z-[110] mt-1 w-[130px] max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                    {months.map((m, idx) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setViewMonth(idx);
                          setShowMonthMenu(false);
                        }}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-colors cursor-pointer ${
                          viewMonth === idx ? 'bg-[#0d9488] text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Year Dropdown (12-year visible window starting around 2000) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowYearMenu(!showYearMenu);
                    setShowMonthMenu(false);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-[12.5px] font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span>{viewYear}</span>
                  <ChevronDown size={13} className={`text-slate-400 transition-transform ${showYearMenu ? 'rotate-180' : ''}`} />
                </button>

                {showYearMenu && (
                  <div
                    ref={yearListRef}
                    className="absolute right-0 top-full z-[110] mt-1 w-[105px] max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
                  >
                    {years.map((y) => (
                      <button
                        key={y}
                        data-year={y}
                        data-active={viewYear === y ? 'true' : 'false'}
                        type="button"
                        onClick={() => {
                          setViewYear(y);
                          setShowYearMenu(false);
                        }}
                        className={`w-full text-left rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-colors cursor-pointer ${
                          viewYear === y ? 'bg-[#0d9488] text-white' : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={viewYear === currentYear && viewMonth >= new Date().getMonth()}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 pt-2.5 text-center text-[11px] font-bold text-slate-400">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1 text-center">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`dob-blank-${i}`} className="h-8 w-full" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const disabled = isFuture(day);

              return (
                <button
                  key={`dob-day-${day}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-full rounded-lg text-[12.5px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                    selected
                      ? 'bg-[#0d9488] text-white shadow-2xs ring-2 ring-[#0d9488]/40'
                      : disabled
                      ? 'text-slate-300 cursor-not-allowed bg-transparent'
                      : 'text-slate-700 hover:bg-teal-50 hover:text-[#0d9488]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Booking() {
  const [mode, setMode] = useState<'inquiry' | 'booking'>('inquiry');

  // Inquiry Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryService, setInquiryService] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryErrors, setInquiryErrors] = useState<Record<string, string>>({});
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);

  // Booking Flow State
  const [step, setStep] = useState(1);
  const [bookingFirstName, setBookingFirstName] = useState('');
  const [bookingLastName, setBookingLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<'Female' | 'Male' | ''>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [intakeToken, setIntakeToken] = useState<string | null>(null);
  const [capturedInquiryId, setCapturedInquiryId] = useState<string | null>(null);
  const bookingRef = useRef<HTMLElement>(null);

  // Live clinic appointment schedule with booked slots & fully booked days
  const [bookedSchedule, setBookedSchedule] = useState<Record<string, string[]>>({
    'Aug 13, 2026': ['09:00 AM – 10:00 AM', '11:00 AM – 12:00 PM', '02:00 PM – 03:00 PM'],
    'Aug 14, 2026': [
      '09:00 AM – 10:00 AM',
      '10:00 AM – 11:00 AM',
      '11:00 AM – 12:00 PM',
      '12:00 PM – 01:00 PM',
      '01:00 PM – 02:00 PM',
      '02:00 PM – 03:00 PM',
      '03:00 PM – 04:00 PM',
      '04:00 PM – 05:00 PM',
    ], // FULLY BOOKED DAY
    'Aug 18, 2026': ['10:00 AM – 11:00 AM', '01:00 PM – 02:00 PM', '04:00 PM – 05:00 PM'],
    'Aug 20, 2026': [
      '09:00 AM – 10:00 AM',
      '10:00 AM – 11:00 AM',
      '11:00 AM – 12:00 PM',
      '12:00 PM – 01:00 PM',
      '01:00 PM – 02:00 PM',
      '02:00 PM – 03:00 PM',
      '03:00 PM – 04:00 PM',
      '04:00 PM – 05:00 PM',
    ], // FULLY BOOKED DAY
    'Aug 25, 2026': ['09:00 AM – 10:00 AM', '03:00 PM – 04:00 PM'],
    'Aug 27, 2026': [
      '09:00 AM – 10:00 AM',
      '10:00 AM – 11:00 AM',
      '11:00 AM – 12:00 PM',
      '12:00 PM – 01:00 PM',
      '01:00 PM – 02:00 PM',
      '02:00 PM – 03:00 PM',
      '03:00 PM – 04:00 PM',
      '04:00 PM – 05:00 PM',
    ], // FULLY BOOKED DAY
  });

  // Fetch live confirmed bookings from Supabase database so calendar reflects real-time lockouts
  useEffect(() => {
    async function loadLiveSchedule() {
      try {
        const res = await fetch('/api/appointments');
        const data = await res.json();
        if (res.ok && data.schedule) {
          setBookedSchedule((prev) => {
            const merged = { ...prev };
            for (const [rawDate, slots] of Object.entries(data.schedule as Record<string, string[]>)) {
              let dateKey = rawDate;
              // Normalize ISO YYYY-MM-DD to MMM d, yyyy if necessary
              if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
                try {
                  const [y, m, d] = rawDate.split('-').map(Number);
                  dateKey = format(new Date(y, m - 1, d), 'MMM d, yyyy');
                } catch {}
              }
              const currentSlots = merged[dateKey] || [];
              merged[dateKey] = Array.from(new Set([...currentSlots, ...slots]));
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn('[Booking] Could not fetch live schedule from database:', err);
      }
    }
    loadLiveSchedule();
  }, []);

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.toLowerCase();
      if (hash === '#booking' || hash === '#booking-section') {
        setMode('booking');
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
      } else if (hash === '#inquiry') {
        setMode('inquiry');
        document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    const onService = (event: Event) => {
      const custom = event as CustomEvent<{ service?: string; mode?: 'inquiry' | 'booking' }>;
      const source = (custom.detail?.service || '').toLowerCase();

      const match =
        bookingServices.find((s) => s.toLowerCase() === source) ||
        (source.includes('prophylaxis') || source.includes('cleaning')
          ? bookingServices[0]
          : source.includes('whitening')
          ? bookingServices[1]
          : source.includes('aligner') || source.includes('orthodontic') || source.includes('brace')
          ? bookingServices[2]
          : source.includes('veneer')
          ? bookingServices[3]
          : source.includes('crown') || source.includes('filling') || source.includes('restorative')
          ? bookingServices[4]
          : source.includes('root canal') || source.includes('endodontic')
          ? bookingServices[5]
          : source.includes('wisdom') || source.includes('extraction')
          ? bookingServices[6]
          : source.includes('implant') || source.includes('graft')
          ? bookingServices[7]
          : source.includes('periodontal') || source.includes('scaling') || source.includes('gum')
          ? bookingServices[8]
          : bookingServices[0]);

      setSelectedServices([match]);
      setInquiryService(match);
      setMode(custom.detail?.mode || 'booking');
      setStep(1);
    };
    window.addEventListener('lumina:select-service', onService);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('lumina:select-service', onService);
    };
  }, []);

  const formatPhoneNumber = (val: string) => {
    // Standard Philippine Mobile Format: 09XX XXX XXXX (11 digits)
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

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (firstName.trim().length < 2) next.firstName = 'Enter your first name (at least 2 letters).';
    if (lastName.trim().length < 2) next.lastName = 'Enter your last name (at least 2 letters).';
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inquiryEmail.trim())) {
      next.inquiryEmail = 'Enter a valid email address (e.g. name@example.com).';
    }
    if (inquiryPhone.trim()) {
      const rawInqPhone = inquiryPhone.replace(/\D/g, '');
      if (!rawInqPhone.startsWith('09') || rawInqPhone.length !== 11) {
        next.inquiryPhone = 'Enter a valid 11-digit PH mobile number starting with 09 (e.g. 0917 123 4567).';
      }
    }
    if (inquiryMessage.trim().length < 10) {
      next.inquiryMessage = 'Please describe your inquiry or questions (at least 10 characters).';
    }

    if (Object.keys(next).length > 0) {
      setInquiryErrors(next);
      return;
    }

    setIsInquirySubmitting(true);
    setInquiryErrors({});
    trackEvent('inquiry_submitted', { service: inquiryService, email: inquiryEmail });

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: inquiryEmail.trim(),
        phone: inquiryPhone.trim() || undefined,
        service: inquiryService || undefined,
        message: inquiryMessage.trim(),
      }),
    })
      .catch((err) => console.warn('[Inquiry] Backend notification:', err))
      .finally(() => {
        setIsInquirySubmitting(false);
        setInquirySubmitted(true);
      });
  };

  const validateContact = () => {
    const next: Record<string, string> = {};
    const trimmedFirst = bookingFirstName.trim();
    const trimmedLast = bookingLastName.trim();

    if (trimmedFirst.length < 2) {
      next.bookingFirstName = 'Please enter your first name (at least 2 letters).';
    } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedFirst)) {
      next.bookingFirstName = 'First name can only contain letters.';
    }

    if (trimmedLast.length < 2) {
      next.bookingLastName = 'Please enter your last name (at least 2 letters).';
    } else if (!/^[a-zA-Z\s'-]+$/.test(trimmedLast)) {
      next.bookingLastName = 'Last name can only contain letters.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      next.email = 'Enter a valid email address (e.g. name@example.com).';
    }

    const rawMobile = mobile.replace(/\D/g, '');
    if (!rawMobile.startsWith('09')) {
      next.mobile = 'Mobile number must start with 09 (e.g. 0917 123 4567).';
    } else if (rawMobile.length !== 11) {
      next.mobile = 'Mobile number must be 11 digits (e.g. 0917 123 4567).';
    }

    if (!dob) {
      next.dob = 'Please select your date of birth.';
    } else {
      const birthDate = new Date(dob);
      const today = new Date();
      if (isNaN(birthDate.getTime()) || birthDate >= today) {
        next.dob = 'Please select a valid past date of birth.';
      }
    }

    if (!sex) {
      next.sex = 'Please select your sex assigned at birth.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextFromContact = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateContact()) return;
    trackEvent('booking_step_completed', { step: 'contact' });

    // Background capture of Step 1 lead so abandoner recovery automation can follow up if unfinished
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: bookingFirstName.trim(),
        lastName: bookingLastName.trim(),
        email: email.trim(),
        phone: mobile.trim() || undefined,
        source: 'booking_funnel_step1',
        status: 'lead_captured',
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (data.inquiryId) {
          setCapturedInquiryId(data.inquiryId);
        }
      })
      .catch((err) => console.warn('[Lead Capture] Background notification:', err));

    setStep(2);
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    );
    if (errors.service) setErrors((prev) => ({ ...prev, service: '' }));
  };

  const nextFromService = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedServices.length === 0) {
      setErrors({ service: 'Please select at least one treatment to continue.' });
      return;
    }
    trackEvent('booking_step_completed', { step: 'service', count: String(selectedServices.length) });
    setErrors({});
    setStep(3);
  };

  const submitBooking = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!selectedDate) next.date = 'Choose a preferred date.';
    if (!selectedTime) next.time = 'Choose a time slot.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    const joinedServices = selectedServices.join(', ');
    trackEvent('booking_submitted', { service: joinedServices, date: selectedDate });

    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: bookingFirstName.trim(),
        lastName: bookingLastName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        dob,
        sex,
        service: joinedServices,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim() || undefined,
        sourceInquiryId: capturedInquiryId || undefined,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (data.intakeToken) {
          setIntakeToken(data.intakeToken);
        }
      })
      .catch((err) => console.warn('[Booking] Backend notification:', err))
      .finally(() => {
        // Register booked slot in schedule so it immediately locks out
        setBookedSchedule((prev) => ({
          ...prev,
          [selectedDate]: [...(prev[selectedDate] || []), selectedTime],
        }));
        setIsSubmitting(false);
        setStep(4);
      });
  };

  const reset = () => {
    setStep(1);
    setBookingFirstName('');
    setBookingLastName('');
    setEmail('');
    setMobile('');
    setDob('');
    setSex('');
    setSelectedDate('');
    setSelectedTime('');
    setSelectedServices([]);
    setNotes('');
    setErrors({});
    setIntakeToken(null);
    setCapturedInquiryId(null);
  };

  useEffect(() => {
    if (inquirySubmitted) {
      const t = setTimeout(() => {
        setInquirySubmitted(false);
        setFirstName('');
        setLastName('');
        setInquiryEmail('');
        setInquiryPhone('');
        setInquiryMessage('');
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [inquirySubmitted]);

  return (
    <section
      id="booking-section"
      ref={bookingRef}
      className="relative z-30 bg-gradient-to-b from-[#f8fafc] via-[#f1f7f6] to-[#eaf5f4] py-20 sm:py-28 overflow-visible"
      aria-labelledby="booking-title"
    >
      {/* Background Ambience & Lighting Blobs */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] rounded-full bg-teal-100/30 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full bg-cyan-100/25 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1280px] px-5 sm:px-8 mx-auto">
        <div className="reveal text-center max-w-[840px] mx-auto">
          <h2 id="booking-title" className="display text-[clamp(2.25rem,4.4vw,3.6rem)] font-extrabold leading-[1.08] text-[#0f172a]">
            Start with what feels&nbsp;comfortable.
          </h2>
          <p className="mt-3 text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#527078] max-w-none">
            Have a question before scheduling? Send a clinical inquiry directly to our studio team.
          </p>

          <div className="mt-7 inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              data-testid="tab-inquiry"
              onClick={() => {
                setMode('inquiry');
                setInquirySubmitted(false);
              }}
              className={`rounded-lg px-5 py-2 text-[13px] font-bold transition-all cursor-pointer ${
                mode === 'inquiry'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0d9488]'
              }`}
            >
              Send an Inquiry
            </button>
            <button
              type="button"
              data-testid="tab-booking"
              onClick={() => setMode('booking')}
              className={`rounded-lg px-5 py-2 text-[13px] font-bold transition-all cursor-pointer ${
                mode === 'booking'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#0d9488]'
              }`}
            >
              Book an Appointment
            </button>
          </div>
        </div>

        {/* MODE 1: Send a Direct Clinical Inquiry */}
        {mode === 'inquiry' && (
          <div className="mt-10 max-w-[960px] mx-auto rounded-[28px] border border-white bg-white p-7 sm:p-10 shadow-[0_20px_60px_rgba(15,62,74,0.09)] transition-all duration-300">
            {inquirySubmitted ? (
              <div className="py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#0d9488]">
                  <Check size={28} strokeWidth={2.5} />
                </div>
                <h3 className="display mt-5 text-[24px] sm:text-[28px] font-extrabold text-[#0f172a]">
                  Thank you, {firstName || 'there'}!
                </h3>
                <p className="mx-auto mt-2 max-w-[480px] text-[14.5px] leading-relaxed text-[#527078]">
                  Our clinical team is on it and will follow up with you directly at <strong className="text-[#0f172a]">{inquiryEmail}</strong> within 2 business hours.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    className="button-primary rounded-xl py-2.5 px-6 text-[13.5px] font-bold cursor-pointer w-full sm:w-auto"
                    onClick={() => {
                      setInquirySubmitted(false);
                      setFirstName('');
                      setLastName('');
                      setInquiryEmail('');
                      setInquiryPhone('');
                      setInquiryMessage('');
                    }}
                  >
                    Send Another Inquiry
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 bg-white py-2.5 px-6 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer w-full sm:w-auto"
                    onClick={() => setMode('booking')}
                  >
                    Book an Appointment
                  </button>
                </div>
                <p className="mt-4 text-[12px] text-slate-400">
                  Returning to form in a few seconds...
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} noValidate className="space-y-6">
                <div>
                  <h3 className="display text-[22px] font-extrabold text-[#0f172a]">General & Clinical Inquiries</h3>
                  <p className="mt-1 text-[13.5px] text-slate-500">Ask us about treatment options, insurance coverage, or personalized pricing estimates.</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first-name" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      First name
                    </label>
                    <input
                      id="first-name"
                      type="text"
                      value={firstName}
                      placeholder="Eleanor"
                      onChange={(e) => {
                        const letters = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                        setFirstName(letters);
                        if (inquiryErrors.firstName) setInquiryErrors((p) => ({ ...p, firstName: '' }));
                      }}
                      className={`w-full rounded-xl border bg-slate-50/70 px-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                        inquiryErrors.firstName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    {inquiryErrors.firstName && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {inquiryErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="last-name" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Last name
                    </label>
                    <input
                      id="last-name"
                      type="text"
                      value={lastName}
                      placeholder="Vance"
                      onChange={(e) => {
                        const letters = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                        setLastName(letters);
                        if (inquiryErrors.lastName) setInquiryErrors((p) => ({ ...p, lastName: '' }));
                      }}
                      className={`w-full rounded-xl border bg-slate-50/70 px-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                        inquiryErrors.lastName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    {inquiryErrors.lastName && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {inquiryErrors.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="inquiry-email" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="inquiry-email"
                        type="email"
                        value={inquiryEmail}
                        placeholder="eleanor@example.com"
                        onChange={(e) => {
                          setInquiryEmail(e.target.value);
                          if (inquiryErrors.inquiryEmail) setInquiryErrors((p) => ({ ...p, inquiryEmail: '' }));
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-10 pr-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                          inquiryErrors.inquiryEmail ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {inquiryErrors.inquiryEmail && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {inquiryErrors.inquiryEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="inquiry-phone" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Mobile phone <span className="text-slate-400 font-normal">(PH: 09XX XXX XXXX)</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="inquiry-phone"
                        type="tel"
                        value={inquiryPhone}
                        placeholder="0917 123 4567"
                        maxLength={13}
                        onFocus={() => {
                          if (!inquiryPhone) setInquiryPhone('09');
                        }}
                        onBlur={() => {
                          if (inquiryPhone.trim() === '09') setInquiryPhone('');
                        }}
                        onChange={(e) => setInquiryPhone(formatPhoneNumber(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
                      />
                    </div>
                    {inquiryErrors.inquiryPhone && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {inquiryErrors.inquiryPhone}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="inquiry-service" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Primary treatment of interest <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <select
                      id="inquiry-service"
                      value={inquiryService}
                      onChange={(e) => setInquiryService(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-[14px] text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
                    >
                      <option value="">General Inquiry / Not Sure Yet</option>
                      {bookingServices.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="inquiry-message" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Your inquiry or question
                    </label>
                    <textarea
                      id="inquiry-message"
                      value={inquiryMessage}
                      onChange={(e) => {
                        setInquiryMessage(e.target.value);
                        if (inquiryErrors.inquiryMessage) setInquiryErrors((p) => ({ ...p, inquiryMessage: '' }));
                      }}
                      placeholder="e.g. I’d like to understand what my dental insurance covers for teeth whitening, and whether you offer weekend appointments."
                      rows={4}
                      className={`w-full resize-none rounded-xl border bg-slate-50/70 p-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                        inquiryErrors.inquiryMessage ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                      }`}
                    />
                    {inquiryErrors.inquiryMessage && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {inquiryErrors.inquiryMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    className="button-primary flex w-full sm:w-auto sm:min-w-[280px] mx-auto items-center justify-center gap-2 rounded-xl py-3.5 px-8 text-[14.5px] font-bold shadow-md cursor-pointer"
                    type="submit"
                    data-testid="button-inquiry-submit"
                    disabled={isInquirySubmitting}
                  >
                    {isInquirySubmitting ? 'Transmitting Inquiry...' : (
                      <>
                        <Send size={15} /> Send Inquiry to Studio Concierge
                      </>
                    )}
                  </button>
                  <p className="mt-6 text-center text-[12.5px] text-slate-400">
                    Direct email dispatch to <strong className="text-slate-600">luminadentalclinic2026@gmail.com</strong>. We reply within 2 business hours.
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: Integrated Full-Width Direct Booking Form */}
        {mode === 'booking' && (
          <div className="mt-10 max-w-[960px] mx-auto rounded-[28px] border border-white bg-white p-7 sm:p-10 shadow-[0_20px_60px_rgba(15,62,74,0.09)] transition-all duration-300">
            {!isSubmitting && step < 4 && (
              <div className="mb-8 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0d9488] text-white text-[11px] font-extrabold shadow-2xs">
                      {step}
                    </span>
                    <span className="text-[#0f172a] text-[14px]">
                      {step === 1 ? 'Step 1: Your Personal & Health Details' : step === 2 ? 'Step 2: Choose Your Treatment' : 'Step 3: Date & 1-Hour Time Slot'}
                    </span>
                  </div>
                  <span className="text-slate-400 font-semibold text-[11.5px] uppercase tracking-wider">
                    Step {step} of 3
                  </span>
                </div>
                <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0d9488] to-[#0f766e] transition-all duration-400"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {isSubmitting && (
              <div className="py-16 sm:py-20 text-center" aria-label="Submitting booking">
                <div className="mx-auto flex h-14 w-14 items-center justify-center">
                  <div className="h-10 w-10 rounded-full border-3 border-slate-200 border-t-[#0d9488] animate-spin" />
                </div>
                <h3 className="display mt-5 text-[20px] sm:text-[22px] font-bold text-[#0f172a]">
                  Reserving Your Appointment...
                </h3>
                <p className="mt-1.5 text-[13.5px] text-slate-500 max-w-md mx-auto">
                  Please wait while we confirm your appointment details.
                </p>
              </div>
            )}

            {/* STEP 1: Personal Details */}
            {!isSubmitting && step === 1 && (
              <form onSubmit={nextFromContact} noValidate className="space-y-6">
                <div>
                  <h3 className="display text-[22px] font-extrabold text-[#0f172a]">Let’s start with you.</h3>
                  <p className="mt-1 text-[13.5px] text-slate-500">We’ll only use these clinical details to reserve your appointment and prepare your chart.</p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="booking-first-name" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      First name
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="booking-first-name"
                        type="text"
                        value={bookingFirstName}
                        placeholder="Eleanor"
                        onChange={(e) => {
                          const lettersOnly = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                          setBookingFirstName(lettersOnly);
                          if (errors.bookingFirstName) setErrors((prev) => ({ ...prev, bookingFirstName: '' }));
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-10 pr-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                          errors.bookingFirstName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                        data-testid="input-first-name"
                      />
                    </div>
                    {errors.bookingFirstName && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {errors.bookingFirstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="booking-last-name" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Last name
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="booking-last-name"
                        type="text"
                        value={bookingLastName}
                        placeholder="Vance"
                        onChange={(e) => {
                          const lettersOnly = e.target.value.replace(/[^a-zA-Z\s'-]/g, '');
                          setBookingLastName(lettersOnly);
                          if (errors.bookingLastName) setErrors((prev) => ({ ...prev, bookingLastName: '' }));
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-10 pr-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                          errors.bookingLastName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                        data-testid="input-last-name"
                      />
                    </div>
                    {errors.bookingLastName && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {errors.bookingLastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        placeholder="you@example.com"
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-10 pr-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                          errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                        data-testid="input-email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="mobile" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Mobile phone <span className="text-slate-400 font-normal">(PH: 09XX XXX XXXX)</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="mobile"
                        type="tel"
                        value={mobile}
                        placeholder="0917 123 4567"
                        maxLength={13}
                        onFocus={() => {
                          if (!mobile) setMobile('09');
                        }}
                        onBlur={() => {
                          if (mobile.trim() === '09') setMobile('');
                        }}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setMobile(formatted);
                          if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: '' }));
                        }}
                        className={`w-full rounded-xl border bg-slate-50/70 pl-10 pr-3.5 py-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] ${
                          errors.mobile ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                        data-testid="input-mobile"
                      />
                    </div>
                    {errors.mobile && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {errors.mobile}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Date of birth
                    </label>
                    <DobDatePicker
                      value={dob}
                      onChange={(val) => {
                        setDob(val);
                        if (errors.dob) setErrors((p) => ({ ...p, dob: '' }));
                      }}
                      error={errors.dob}
                    />
                    {errors.dob && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {errors.dob}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-slate-700">
                      Sex assigned at birth
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {(['Female', 'Male'] as const).map((option) => {
                        const isSelected = sex === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setSex(option);
                              if (errors.sex) setErrors((prev) => ({ ...prev, sex: '' }));
                            }}
                            className={`flex items-center justify-center rounded-xl py-3.5 px-3 border text-[13.5px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#0d9488] bg-[#0d9488] text-white shadow-xs ring-1 ring-[#0d9488]'
                                : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                            }`}
                            data-testid={`button-sex-${option.toLowerCase()}`}
                          >
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.sex && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <CircleAlert size={13} /> {errors.sex}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    className="button-primary flex w-full sm:w-auto sm:min-w-[280px] mx-auto items-center justify-center gap-2 rounded-xl py-3.5 px-8 text-[14.5px] font-bold shadow-md cursor-pointer"
                    type="submit"
                    data-testid="button-booking-contact-continue"
                  >
                    Continue to Treatment <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Treatment Selection (Multi-select enabled) */}
            {!isSubmitting && step === 2 && (
              <form onSubmit={nextFromService} noValidate className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="display text-[22px] font-extrabold text-[#0f172a]">Select your clinical treatment(s).</h3>
                      {selectedServices.length > 0 && (
                        <span className="rounded-full bg-teal-100 text-[#0d9488] px-2.5 py-0.5 text-[11.5px] font-extrabold shadow-2xs">
                          {selectedServices.length} selected
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13.5px] text-slate-500">Pick one or more dental procedures you would like to reserve chairside time for.</p>
                  </div>
                  <button
                    type="button"
                    className="text-[12.5px] font-bold text-slate-500 hover:text-[#0d9488] cursor-pointer self-start sm:self-auto transition-colors"
                    onClick={() => setStep(1)}
                    data-testid="button-booking-back-contact"
                  >
                    ← Back to personal details
                  </button>
                </div>

                <div className="space-y-6">
                  {organizedCareCategories.map((group) => (
                    <div key={group.category} className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <span className="h-2 w-2 rounded-full bg-[#0d9488]" />
                        <h4 className="text-[12.5px] font-extrabold uppercase tracking-wider text-slate-700">
                          {group.category}
                        </h4>
                      </div>
                      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((item) => {
                          const isSelected = selectedServices.includes(item.name);
                          return (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => toggleService(item.name)}
                              className={`group flex flex-col justify-between rounded-2xl p-4.5 text-left transition-all border cursor-pointer ${
                                isSelected
                                  ? 'border-[#0d9488] bg-gradient-to-br from-[#f0faf9] via-white to-teal-50/50 text-[#0f172a] shadow-sm ring-2 ring-[#0d9488]/40 -translate-y-0.5'
                                  : 'border-slate-200/90 bg-white hover:border-teal-300 hover:bg-slate-50/80 hover:shadow-[0_8px_20px_-6px_rgba(13,148,136,0.12)] hover:-translate-y-0.5 text-slate-700'
                              }`}
                              data-testid={`service-card-${item.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2.5">
                                  <span className={`text-[14.5px] font-bold leading-snug transition-colors ${
                                    isSelected ? 'text-[#0f172a]' : 'text-slate-800 group-hover:text-[#0d9488]'
                                  }`}>
                                    {item.name}
                                  </span>
                                  <span
                                    className={`flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                                      isSelected
                                        ? 'border-[#0d9488] bg-[#0d9488] text-white shadow-2xs'
                                        : 'border-slate-300 bg-slate-50 group-hover:border-teal-400'
                                    }`}
                                  >
                                    {isSelected && <Check size={13} strokeWidth={3} />}
                                  </span>
                                </div>
                                <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500 line-clamp-2">
                                  {item.desc}
                                </p>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 mt-3.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md border w-fit transition-colors ${
                                isSelected
                                  ? 'text-[#0d9488] bg-teal-100/70 border-teal-200'
                                  : 'text-slate-600 bg-slate-100 border-slate-200/70 group-hover:bg-teal-50 group-hover:text-[#0d9488] group-hover:border-teal-200/60'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-[#0d9488]' : 'bg-slate-400 group-hover:bg-[#0d9488]'}`} />
                                {item.badge}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {errors.service && (
                  <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                    <CircleAlert size={13} /> {errors.service}
                  </p>
                )}

                <div>
                  <label htmlFor="booking-notes" className="mb-1.5 block text-[12px] font-bold text-slate-700">
                    Special requests or symptoms <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="booking-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Sensitivity in upper molar, dental anxiety, or insurance preference"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-[13.5px] text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e]"
                    data-testid="input-booking-notes"
                  />
                </div>

                <div className="pt-2">
                  <button
                    className="button-primary flex w-full sm:w-auto sm:min-w-[280px] mx-auto items-center justify-center gap-2 rounded-xl py-3.5 px-8 text-[14.5px] font-bold shadow-md cursor-pointer"
                    type="submit"
                    data-testid="button-booking-service-continue"
                  >
                    Continue to Schedule <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Customized Interactive Calendar & 1-Hour Time Slots */}
            {!isSubmitting && step === 3 && (
              <form onSubmit={submitBooking} noValidate className="space-y-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="display text-[22px] font-extrabold text-[#0f172a]">Find your best appointment time.</h3>
                    <p className="mt-1 text-[13.5px] text-slate-500">Choose a calendar date and 1-hour appointment slot.</p>
                  </div>
                  <button
                    type="button"
                    className="text-[12.5px] font-bold text-slate-500 hover:text-[#0d9488] cursor-pointer self-start sm:self-auto"
                    onClick={() => setStep(2)}
                    data-testid="button-booking-back-service"
                  >
                    ← Back to treatment selection
                  </button>
                </div>

                <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] items-start">
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-slate-700">
                      <CalendarIcon size={15} className="text-[#0d9488]" /> Select Date
                    </label>
                    <CustomCalendar
                      selectedDate={selectedDate}
                      onSelectDate={(date) => {
                        setSelectedDate(date);
                        setSelectedTime('');
                        setErrors((curr) => ({ ...curr, date: '', time: '' }));
                      }}
                      bookedSchedule={bookedSchedule}
                      allSlots={timeSlots}
                    />
                    {errors.date && (
                      <p className="mt-1.5 text-[11px] font-semibold text-rose-600">{errors.date}</p>
                    )}
                  </div>

                  <div>
                    {(() => {
                      const isSelectedSaturday = selectedDate ? new Date(selectedDate).getDay() === 6 : false;
                      const activeSlots = getTimeSlotsForDate(selectedDate);

                      return (
                        <>
                          <div className="mb-2 flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-[12.5px] font-bold text-slate-700">
                              <Clock3 size={15} className="text-[#0d9488]" />
                              {isSelectedSaturday
                                ? 'Saturday Hours (9:00 AM – 3:00 PM)'
                                : '1-Hour Time Slots (9:00 AM – 5:00 PM)'}
                            </label>
                            {isSelectedSaturday && (
                              <span className="text-[10.5px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                                Saturday (Until 3 PM)
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {activeSlots.map((slot, index) => {
                              const isSelected = selectedTime === slot;
                              const isBooked = (bookedSchedule[selectedDate] || []).includes(slot);

                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={isBooked}
                                  onClick={() => {
                                    if (isBooked) return;
                                    setSelectedTime(slot);
                                    setErrors((curr) => ({ ...curr, time: '' }));
                                  }}
                                  title={isBooked ? 'This time slot is already booked' : 'Available for appointment'}
                                  className={`flex flex-col justify-between rounded-xl p-3 text-left transition-all border ${
                                    isBooked
                                      ? 'border-dashed border-rose-200 bg-rose-50/40 text-slate-400 cursor-not-allowed opacity-75'
                                      : isSelected
                                      ? 'border-[#0d9488] bg-[#0d9488] text-white shadow-xs ring-2 ring-[#0d9488]/40 cursor-pointer'
                                      : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 cursor-pointer'
                                  }`}
                                  data-testid={`radio-time-${index}`}
                                >
                                  {isBooked ? (
                                    <div className="flex items-center justify-between w-full mb-1">
                                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                        Booked
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end w-full mb-1">
                                      <span
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                                          isSelected
                                            ? 'border-white bg-white text-[#0d9488]'
                                            : 'border-slate-300 bg-white'
                                        }`}
                                      >
                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                      </span>
                                    </div>
                                  )}
                                  <span className={`text-[12.5px] font-bold tracking-tight ${isBooked ? 'line-through text-slate-400' : ''}`}>
                                    {slot}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                    {errors.time && (
                      <p className="mt-2 text-[11px] font-semibold text-rose-600">{errors.time}</p>
                    )}

                    {selectedDate && selectedTime && (
                      <div className="mt-5 rounded-2xl bg-gradient-to-br from-teal-50/90 via-white to-teal-50/60 border border-teal-200/90 p-4 sm:p-5 text-[13px] text-[#0f3440] shadow-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Patient</span>
                          <strong className="text-[#0f172a] text-[14px]">{bookingFirstName} {bookingLastName}</strong>
                        </div>
                        <div className="border-t border-teal-100/90 pt-2 flex flex-col gap-1.5">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                            Selected Care ({selectedServices.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedServices.map((svc) => (
                              <span key={svc} className="text-[12px] font-semibold text-[#0d9488] bg-teal-100/70 px-2.5 py-0.5 rounded-md border border-teal-200/60">
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="border-t border-teal-100/90 pt-2 flex items-center justify-between">
                          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Appointment Slot</span>
                          <strong className="text-[#0f172a] text-[13.5px]">{selectedDate} at {selectedTime}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {submitError && (
                  <p className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-[12.5px] text-rose-700">
                    {submitError}
                  </p>
                )}

                <div className="pt-4 border-t border-slate-100">
                  <button
                    className="button-primary flex w-full sm:w-auto sm:min-w-[300px] mx-auto items-center justify-center gap-2 rounded-xl py-4 px-8 text-[15px] font-bold shadow-md cursor-pointer"
                    type="submit"
                    data-testid="button-confirm-booking"
                  >
                    Confirm & Reserve Appointment
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success Screen */}
            {!isSubmitting && step === 4 && (
              <div className="py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-200" role="status" data-testid="status-booking-success">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#0d9488]">
                  <Check size={28} strokeWidth={2.5} />
                </div>

                <h3 className="display mt-5 text-[24px] sm:text-[28px] font-extrabold text-[#0f172a]">
                  Thank you, {bookingFirstName || 'there'}!
                </h3>

                <p className="mx-auto mt-2 max-w-[480px] text-[14.5px] leading-relaxed text-[#527078]">
                  Your appointment request has been reserved for <strong className="text-[#0f172a]">{selectedDate} ({selectedTime})</strong>. We’ve sent your confirmation to <strong className="text-[#0f172a]">{email}</strong>.
                </p>

                <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {intakeToken && (
                    <a
                      href={`/intake?token=${intakeToken}`}
                      className="button-primary flex items-center justify-center rounded-xl py-3.5 px-6 text-[13.5px] font-bold shadow-md cursor-pointer"
                      data-testid="button-complete-intake-step4"
                    >
                      Complete Pre-Visit Medical Intake
                    </a>
                  )}
                  <button
                    className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-[13.5px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={reset}
                    data-testid="button-book-another"
                  >
                    Book Another Visit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function FAQ() {
  const questions = [
    {
      q: 'How does the digital appointment booking work?',
      a: 'Choose your care, select a preferred time, and send a request in under a minute. We confirm availability in real time, then email your confirmation and calendar invite attachment.',
    },
    {
      q: 'Do you accept health insurance and HMO plans?',
      a: 'Yes. We work with participating network providers and offer hassle-free direct billing wherever your plan allows. Our team will confirm benefits before your appointment.',
    },
    {
      q: 'What if I need to cancel or reschedule?',
      a: 'Use the one-click rescheduling link in your confirmation email. If you need help, call the studio and a human will take care of it immediately.',
    },
    {
      q: 'What sterilization and safety protocols are followed?',
      a: 'We use hospital-grade autoclave sterilization, surgical air filtration, and single-use barrier standards throughout the studio.',
    },
    {
      q: 'Do you offer pain-free anesthesia & sedation options?',
      a: 'Yes. We utilize computer-controlled local anesthetic delivery (The Wand) for virtually painless numbing, plus gentle nitrous oxide sedation for patients with dental anxiety.',
    },
    {
      q: 'How does transparent treatment pricing work?',
      a: 'We provide exact itemized estimates chairside before starting any procedure. No surprise billing or hidden lab fees ever.',
    },
  ];

  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative z-10 bg-white py-24 lg:py-32 border-t border-slate-200/80 overflow-hidden" aria-labelledby="faq-title">
      {/* Precision Dot Matrix & Ambient Lighting */}
      <div className="absolute inset-0 bg-dots-precision opacity-40 pointer-events-none" />
      <div className="absolute top-10 right-10 w-[450px] h-[450px] rounded-full bg-teal-50/60 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-cyan-50/50 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[1280px] px-5 sm:px-8 mx-auto">
        <div className="reveal text-center max-w-[800px] mx-auto">
          <h2 id="faq-title" className="display mt-3 text-[clamp(2.1rem,4vw,3.4rem)] font-extrabold leading-[1.1] text-[#0f172a] sm:whitespace-nowrap">
            Frequently asked questions.
          </h2>
          <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-[#527078] sm:whitespace-nowrap max-w-none">
            Everything you need to know about our digital flow, insurance coverage, and comfort standards.
          </p>
        </div>

        <div className="reveal mt-12 max-w-[860px] mx-auto space-y-2.5">
          {questions.map((item, index) => {
            const isOpen = open === index;
            return (
              <div
                key={item.q}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#0d9488]/40 bg-[#fbfdfe] shadow-2xs'
                    : 'border-slate-200/90 bg-white hover:border-slate-300'
                }`}
                data-testid={`faq-item-${index}`}
              >
                <button
                  className={`flex w-full items-center justify-between gap-4 px-5 sm:px-6 text-left cursor-pointer group transition-all ${
                    isOpen ? 'pt-4 pb-1.5' : 'py-4'
                  }`}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  data-testid={`button-faq-${index}`}
                >
                  <span className={`text-[16px] sm:text-[17px] font-bold pr-2 leading-snug transition-colors ${isOpen ? 'text-[#0d9488]' : 'text-[#0f172a] group-hover:text-[#0f766e]'}`}>
                    {item.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'text-[#0d9488] rotate-180'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-3.5 sm:px-6 pt-0">
                        <p className="text-[14.5px] sm:text-[15px] leading-[1.65] text-slate-600">
                          {item.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DigitalIntakeSection() {
  return (
    <section id="digital-intake" className="relative z-20 py-16 sm:py-20 bg-gradient-to-b from-white via-[#f0f9f8] to-[#e4f4f2] border-t border-slate-200/90 overflow-hidden">
      <div className="section-shell">
        <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-br from-[#0b242c] via-[#0f3e4a] to-[#134956] p-7 sm:p-11 lg:p-14 text-white shadow-[0_25px_70px_rgba(15,62,74,0.16)] border border-[#1d4f5c]">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-[#0d9488]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#2dd4bf]/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
            {/* Left Content Column */}
            <div className="space-y-4 max-w-[660px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#235865] bg-[#143e49]/80 backdrop-blur-md px-3.5 py-1 text-[12px] font-bold text-[#8ce0db]">
                <ClipboardCheck size={14} className="text-[#8ce0db]" /> Express Digital Intake Portal
              </div>
              <h2 className="text-[26px] sm:text-[32px] lg:text-[35px] font-extrabold tracking-tight leading-[1.2] text-white">
                Already have a scheduled visit? Complete your medical intake.
              </h2>
              <p className="text-[14.5px] sm:text-[15.5px] leading-relaxed text-[#c2dcde]">
                Skip clipboard paperwork in our lounge. Securely submit your drug allergies, systemic health history, and dental insurance verification in under 2 minutes.
              </p>

              {/* Feature Pill Highlights */}
              <div className="flex flex-wrap gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#b7ece8]">
                  <ShieldCheck size={14} className="text-[#8ce0db]" /> HIPAA Encrypted
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#b7ece8]">
                  <HeartHandshake size={14} className="text-[#8ce0db]" /> Drug Allergy & Anesthesia Safety
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#b7ece8]">
                  <Sparkles size={14} className="text-[#8ce0db]" /> Instant Chart Sync
                </span>
              </div>
            </div>

            {/* Right Action Column */}
            <div className="shrink-0 flex flex-col items-center sm:items-start lg:items-center justify-center gap-2.5">
              <a
                href="/intake"
                className="button-primary inline-flex items-center justify-center gap-2.5 rounded-xl py-4 px-8 text-[15px] font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer w-full sm:w-auto"
                data-testid="link-open-intake-portal"
              >
                <span>Open Patient Intake Portal</span>
                <ArrowRight size={17} />
              </a>
              <span className="text-[12px] text-[#8eb0b6] font-medium text-center">
                Direct access for all new & returning patients
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type LegalTab = 'privacy' | 'terms' | 'hipaa' | 'accessibility';

function LegalDialog({
  initialTab = 'privacy',
  onClose,
}: {
  initialTab: LegalTab;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<LegalTab>(initialTab);

  const tabs: { id: LegalTab; label: string }[] = [
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms of Service' },
    { id: 'hipaa', label: 'HIPAA Compliance' },
    { id: 'accessibility', label: 'Accessibility' },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-title"
    >
      <div className="relative w-full max-w-[720px] max-h-[85vh] flex flex-col rounded-[28px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.24)] border border-slate-100 animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:px-8 border-b border-slate-100 shrink-0">
          <div>
            <h3 id="legal-title" className="display text-[22px] sm:text-[24px] font-extrabold text-[#0f172a]">
              Legal & Clinical Compliance
            </h3>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Lumina Dental Studio operational policies and patient data protection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close legal dialog"
            data-testid="button-close-legal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/60 px-6 sm:px-8 gap-2 overflow-x-auto shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-3.5 px-3 text-[13px] font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                tab === t.id
                  ? 'border-[#0d9488] text-[#0d9488]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              data-testid={`tab-legal-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-[14px] leading-relaxed text-slate-600">
          {tab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-[#0f172a] text-[16.5px]">Patient Privacy Notice &amp; Data Governance</h4>
                <p className="text-[13px] text-[#527078] mt-0.5">Last updated: August 2026 • Policy Version 2.4</p>
              </div>

              <p>
                Lumina Dental Studio LLC is committed to uncompromising privacy standards. All digital intake submissions, personal contact details, and appointment inquiries submitted through this platform are protected under end-to-end TLS 1.3 encryption in transit and AES-256 encryption at rest.
              </p>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">1. Information We Collect</h5>
                <p>
                  To provide clinical dental care, verify insurance eligibility, and maintain accurate health records, we collect:
                </p>
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-[13.5px]">
                  <li><strong>Personal Identification:</strong> Legal name, date of birth, contact phone number, residential address, and email.</li>
                  <li><strong>Clinical &amp; Health History:</strong> Medical conditions, active medications, allergy profiles, and previous dental history submitted via pre-visit digital intake.</li>
                  <li><strong>Payment &amp; Insurance:</strong> HMO/PPO plan names, policy member IDs, group numbers, and billing details.</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">2. Purpose of Processing &amp; Zero-Sale Guarantee</h5>
                <p>
                  Your information is processed exclusively for clinical scheduling, insurance verification, electronic chart maintenance, and direct appointment notifications. <strong>We do not sell, rent, or monetize patient information under any circumstances.</strong>
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">3. Authorized Third-Party Disclosures</h5>
                <p>
                  Disclosures are strictly limited to HIPAA-covered clinical laboratory partners (custom crown and aligner fabrication), diagnostic imaging specialists, electronic prescription networks, and your designated insurance carrier for direct claims adjudication.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">4. Your Rights &amp; Preference Controls</h5>
                <p>
                  You have the right to request copies of your health chart, amend inaccuracies, or manage reminder subscriptions via our <a href="/unsubscribe" className="text-[#0d9488] underline font-medium">Email Preferences</a> portal. For record transfer or privacy inquiries, contact our Privacy Officer at <strong className="text-slate-900">luminadentalclinic2026@gmail.com</strong>.
                </p>
              </div>
            </div>
          )}

          {tab === 'terms' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-[#0f172a] text-[16.5px]">Terms of Clinical Service &amp; Studio Policies</h4>
                <p className="text-[13px] text-[#527078] mt-0.5">Clinical Practice Guidelines • Patient Agreement</p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">1. Provisional Reservations &amp; Scheduling</h5>
                <p>
                  Online booking selections reserve a provisional chairside time slot. Appointments are confirmed upon concierge intake review and verification of insurance or payment method.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">2. 24-Hour Rescheduling &amp; Cancellation Policy</h5>
                <p>
                  Because chairside time and custom sterilization suites are reserved exclusively for each patient, we request at least <strong>24 hours advance notice</strong> for cancellations or rescheduling. This allows urgent triage and emergency patients access to available openings.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">3. Clinical Estimates &amp; Financial Responsibility</h5>
                <p>
                  Treatment fees displayed online or provided during inquiry triage represent initial clinical estimates. Final treatment plans, necessary radiographs, and out-of-pocket copayments are finalized following an in-person comprehensive diagnostic evaluation by your treating dentist. Patients remain responsible for any balances not covered by insurance.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">4. Doctor-Patient Relationship Scope</h5>
                <p>
                  Submitting an online form or utilizing our digital intake triage does not establish a formal doctor-patient relationship until an in-person clinical examination has been conducted by a licensed Lumina Dental clinician.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">5. Acute Emergency Protocol</h5>
                <p>
                  Online triage forms and booking tools are not monitored for real-time emergency dispatch. If you are experiencing severe oral-facial trauma, uncontrollable hemorrhaging, or swelling that impairs swallowing or respiration, call <strong>911</strong> or visit the nearest emergency medical facility immediately.
                </p>
              </div>
            </div>
          )}

          {tab === 'hipaa' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-[#0f172a] text-[16.5px]">HIPAA Health Information Privacy Notice</h4>
                <p className="text-[13px] text-[#527078] mt-0.5">45 CFR § 164.520 Compliance Notice</p>
              </div>

              <p>
                Lumina Dental Studio strictly adheres to the Health Insurance Portability and Accountability Act (HIPAA) of 1996 and the Health Information Technology for Economic and Clinical Health (HITECH) Act standards for Protected Health Information (PHI).
              </p>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">1. Electronic PHI (ePHI) Safeguards</h5>
                <p>
                  All clinical records, intraoral diagnostic radiographs (2D panoramic &amp; 3D CBCT scans), periodontal charts, and medical histories are stored in SOC-2 Type II certified cloud electronic health record (EHR) infrastructure with multi-factor authentication and role-based staff permissions.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">2. Business Associate Agreements (BAAs)</h5>
                <p>
                  Every third-party technology provider, cloud backup system, and dental laboratory operating within our workflow is bound by signed, enforceable Business Associate Agreements to guarantee statutory data protections.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">3. Right to Inspect &amp; Request Records</h5>
                <p>
                  Under 45 CFR § 164.524, patients have the legal right to inspect and obtain certified electronic copies of their complete dental chart, radiographs, and billing records within 30 days of written submission to <strong className="text-slate-900">luminadentalclinic2026@gmail.com</strong>.
                </p>
              </div>
            </div>
          )}

          {tab === 'accessibility' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-[#0f172a] text-[16.5px]">Digital Accessibility Standards</h4>
                <p className="text-[13px] text-[#527078] mt-0.5">WCAG 2.1 Level AA &amp; ADA Title III Compliance</p>
              </div>

              <p>
                Lumina Dental Studio is committed to providing an inclusive, barrier-free digital healthcare experience for all patients, including those with visual, auditory, cognitive, and motor impairments.
              </p>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">1. Technical Accessibility Features</h5>
                <ul className="list-disc pl-5 space-y-1 text-[13.5px]">
                  <li>Semantic HTML5 landmarks and structured heading hierarchy for assistive screen-reader devices.</li>
                  <li>Full keyboard navigability for appointment funnels, date pickers, and intake questionnaires.</li>
                  <li>High-contrast color ratios exceeding 4.5:1 for enhanced visual readability.</li>
                  <li>Dynamic text scaling and full responsiveness across mobile, tablet, and desktop viewports.</li>
                </ul>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">2. Facility Accessibility</h5>
                <p>
                  Our Northbridge dental studio features step-free ground entrance access, wide operatory corridors, ADA-compliant patient restrooms, and ergonomic dental treatment chairs designed for transfer accessibility.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-[#0f172a] text-[14.5px] mb-1">3. Feedback &amp; Assistance</h5>
                <p>
                  If you encounter any accessibility difficulty while navigating our website or scheduling an appointment, contact our patient accessibility team directly at <strong className="text-slate-900">(415) 555-0142</strong> or email <strong className="text-slate-900">luminadentalclinic2026@gmail.com</strong>. We will promptly provide personalized support.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
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

function Footer({ onOpenLegal }: { onOpenLegal: (tab: LegalTab) => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b242c] py-14 text-[#d4e4e6] border-t border-[#1a444e]" aria-labelledby="footer-title">
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
            <a
              href="/unsubscribe"
              className="hover:text-white transition-colors cursor-pointer"
            >
              Email Preferences
            </a>
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

        {/* Studio Direct Contact Info Display */}
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
          <button
            className="button-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 px-8 text-[15.5px] font-bold shadow-md cursor-pointer"
            onClick={() => {
              onClose();
              window.dispatchEvent(
                new CustomEvent('lumina:select-service', {
                  detail: { service: 'Gentle Root Canal Therapy', mode: 'booking' },
                })
              );
              scrollToId('booking-section');
            }}
            data-testid="button-emergency-online-slot"
          >
            Hold emergency appointment slot online →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ open: boolean; tab: LegalTab }>({
    open: false,
    tab: 'privacy',
  });
  useReveal();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      if (window.location.hash) {
        const targetId = window.location.hash.replace('#', '');
        const elem = document.getElementById(targetId);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        window.scrollTo(0, 0);
      }
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc]">
      <Nav onEmergency={() => setEmergencyOpen(true)} />
      <main>
        <Hero onEmergency={() => setEmergencyOpen(true)} />
        <Treatments />
        <Standards />
        <Stories />
        <Booking />
        <FAQ />
        <DigitalIntakeSection />
      </main>
      <Footer onOpenLegal={(tab) => setLegalModal({ open: true, tab })} />
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
