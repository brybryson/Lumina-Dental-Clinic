'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Phone,
  Mail,
  LogOut,
  ExternalLink,
  Search,
  Filter,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  X,
  Stethoscope,
  Inbox,
  Activity,
  HeartPulse,
} from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  date_of_birth?: string;
  sex_assigned_at_birth?: string;
  last_visit_date?: string;
}

interface MedicalIntake {
  id: string;
  submitted_at: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string[];
  allergies?: string[];
  current_medications?: string;
  hmo_provider?: string;
  hmo_member_id?: string;
  consent_signed?: boolean;
}

interface Appointment {
  id: string;
  service_name: string;
  appointment_date: string;
  time_slot: string;
  patient_notes?: string;
  status: string;
  intake_token?: string;
  intake_completed_at?: string;
  flag_for_manual_followup?: boolean;
  google_calendar_event_id?: string;
  patients: Patient;
  medical_intakes?: MedicalIntake[];
}

interface Inquiry {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  service_of_interest?: string;
  message?: string;
  source: string;
  status: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Tab & Data State
  const [activeTab, setActiveTab] = useState<'schedule' | 'inquiries' | 'calendar'>('schedule');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | string>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Items for Modals
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [completionOutcome, setCompletionOutcome] = useState<'standard' | 'complication'>('standard');
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const [viewingIntakeApt, setViewingIntakeApt] = useState<Appointment | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Check auth session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth');
        const data = await res.json();
        if (res.ok && data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setIsAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Fetch appointments and inquiries
  const loadDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const [aptRes, inqRes] = await Promise.all([
        fetch('/api/admin/appointments'),
        fetch('/api/admin/inquiries'),
      ]);

      const aptData = await aptRes.json();
      const inqData = await inqRes.json();

      if (aptData.success) {
        setAppointments(aptData.appointments || []);
      }
      if (inqData.success) {
        setInquiries(inqData.inquiries || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch {
      router.push('/admin/login');
    }
  };

  // Treatment Completion Handler (Triggers Workflow 3 with HITL flag)
  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingApt) return;

    setIsCompleting(true);
    try {
      const isComplication = completionOutcome === 'complication';
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: completingApt.id,
          status: 'completed',
          flagForManualFollowup: isComplication,
          patientNotes: completionNotes || completingApt.patient_notes || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete appointment');

      setActionSuccessMsg(
        isComplication
          ? `⚠️ Treatment completed with Complication Alert for ${completingApt.patients.first_name}. Automated emails bypassed; Slack alert triggered for manual staff phone check-in.`
          : `✅ Treatment completed for ${completingApt.patients.first_name}. Standard Post-Op Care Sequence dispatched via Workflow 3.`
      );

      setCompletingApt(null);
      setCompletionNotes('');
      setCompletionOutcome('standard');
      loadDashboardData();

      setTimeout(() => setActionSuccessMsg(''), 8000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error completing treatment');
    } finally {
      setIsCompleting(false);
    }
  };

  // Inquiry Status Updater
  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId, status: newStatus }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error('Error updating inquiry:', err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen hero-wash flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#0d9488]/30 border-t-[#0d9488] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Authenticating Clinical Session...</p>
        </div>
      </div>
    );
  }

  // Filter Appointments
  const filteredAppointments = appointments.filter((apt) => {
    const todayStr = '2026-08-25';
    const tomorrowStr = '2026-08-26';

    if (dateFilter === 'today' && apt.appointment_date !== todayStr) return false;
    if (dateFilter === 'tomorrow' && apt.appointment_date !== tomorrowStr) return false;
    if (dateFilter !== 'all' && dateFilter !== 'today' && dateFilter !== 'tomorrow' && apt.appointment_date !== dateFilter) {
      return false;
    }

    if (statusFilter !== 'all' && apt.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const patientName = `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.toLowerCase();
      const email = (apt.patients?.email || '').toLowerCase();
      const service = (apt.service_name || '').toLowerCase();
      return patientName.includes(q) || email.includes(q) || service.includes(q);
    }

    return true;
  });

  // Metrics
  const totalCount = appointments.length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const flaggedComplicationsCount = appointments.filter((a) => a.flag_for_manual_followup).length;
  const pendingIntakeCount = appointments.filter((a) => !a.intake_completed_at && a.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-slate-50/70 text-[#0f172a]">
      {/* Top Clinic Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <a href="/" className="inline-flex items-center gap-2.5 group">
            <img
              src="/images/lumina-logo.png"
              alt="Lumina Logo"
              className="h-8 w-auto object-contain"
            />
            <div>
              <span className="block display font-extrabold text-[#0f172a] text-[17px] leading-tight">
                Lumina Dental Studio
              </span>
              <span className="block text-[10px] text-[#0d9488] font-bold tracking-[0.14em] uppercase">
                Clinical Admin &amp; Dentist Dashboard
              </span>
            </div>
          </a>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#0d9488]" />
            Google Calendar
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-teal-50/80 border border-[#0d9488]/20 rounded-xl">
            <Stethoscope className="w-4 h-4 text-[#0d9488]" />
            <div className="text-left">
              <span className="block text-[12.5px] font-bold text-[#0f766e] leading-tight">
                {currentUser?.name || 'Dr. Lumina'}
              </span>
              <span className="block text-[10px] text-[#0d9488] font-medium">
                {currentUser?.role || 'Attending Dentist'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
            title="Log Out of Clinic Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Banner Alert if any action was performed */}
        {actionSuccessMsg && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-[#0d9488]/30 text-[#0f766e] text-[14px] flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#0d9488] mt-0.5" />
            <div className="flex-1 font-medium">{actionSuccessMsg}</div>
            <button onClick={() => setActionSuccessMsg('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Total Appointments
            </p>
            <p className="display text-2xl sm:text-3xl font-extrabold text-[#0f172a]">{totalCount}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Treatments Completed
            </p>
            <p className="display text-2xl sm:text-3xl font-extrabold text-[#0d9488]">{completedCount}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pending Intakes
            </p>
            <p className="display text-2xl sm:text-3xl font-extrabold text-amber-600">{pendingIntakeCount}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Complications ⚠️
            </p>
            <p className="display text-2xl sm:text-3xl font-extrabold text-rose-600">{flaggedComplicationsCount}</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-4 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Chairside Schedule
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`py-2 px-4 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inquiries &amp; Leads ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-4 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            Google Calendar Sync
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SCHEDULE & CHAIRSIDE OPERATIONS                                  */}
        {/* ========================================================================= */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {/* Control Bar: Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`py-1.5 px-3 rounded-lg text-[13px] font-semibold border transition-all cursor-pointer ${
                    dateFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`py-1.5 px-3 rounded-lg text-[13px] font-semibold border transition-all cursor-pointer ${
                    dateFilter === 'today'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Today (Aug 25)
                </button>
                <button
                  onClick={() => setDateFilter('tomorrow')}
                  className={`py-1.5 px-3 rounded-lg text-[13px] font-semibold border transition-all cursor-pointer ${
                    dateFilter === 'tomorrow'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tomorrow (Aug 26)
                </button>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-lg text-[13px] font-semibold border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient, service..."
                    className="w-full pl-9 pr-3 py-1.5 text-[13px] rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
                  />
                </div>
                <button
                  onClick={loadDashboardData}
                  disabled={isLoadingData}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Refresh Schedule"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Schedule List / Table */}
            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500">
                <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-[15px] font-bold text-[#0f172a]">No appointments found</p>
                <p className="text-[13px] text-slate-400 mt-1">
                  Try adjusting your date or status filters above.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredAppointments.map((apt) => {
                  const patient = apt.patients || {};
                  const intake = (apt.medical_intakes && apt.medical_intakes[0]) || null;
                  const hasAllergies = intake?.allergies && intake.allergies.length > 0;
                  const hasConditions = intake?.medical_conditions && intake.medical_conditions.length > 0;
                  const isCompleted = apt.status === 'completed';
                  const isComplicated = apt.flag_for_manual_followup;

                  return (
                    <div
                      key={apt.id}
                      className={`p-5 rounded-2xl bg-white border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                        isComplicated
                          ? 'border-red-300 bg-red-50/20'
                          : isCompleted
                          ? 'border-teal-200 bg-teal-50/10'
                          : 'border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      {/* Left: Time & Patient Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[13px] bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                            {apt.appointment_date} &bull; {apt.time_slot}
                          </span>

                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-teal-100 text-[#0f766e] px-2.5 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : apt.status === 'cancelled' ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-md">
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md">
                              Confirmed Reservation
                            </span>
                          )}

                          {isComplicated && (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold bg-red-100 text-red-700 px-2.5 py-0.5 rounded-md">
                              <AlertTriangle className="w-3.5 h-3.5" /> Complication Flagged
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <h3 className="text-[17px] font-extrabold text-[#0f172a]">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          {patient.sex_assigned_at_birth && (
                            <span className="text-[12px] text-slate-400 font-medium">
                              ({patient.sex_assigned_at_birth})
                            </span>
                          )}
                        </div>

                        <p className="text-[13.5px] font-semibold text-[#0d9488]">
                          {apt.service_name}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-slate-500 pt-1">
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {patient.mobile}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {patient.email}
                          </span>
                          {apt.patient_notes && (
                            <span className="text-slate-600 italic bg-slate-50 px-2 py-0.5 rounded-sm">
                              &ldquo;{apt.patient_notes}&rdquo;
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Medical Intake Status Badges */}
                      <div className="flex flex-col gap-1.5 md:min-w-[200px]">
                        {intake ? (
                          <button
                            onClick={() => setViewingIntakeApt(apt)}
                            className="inline-flex items-center justify-between p-2 rounded-xl bg-teal-50 border border-teal-200 text-left hover:bg-teal-100/70 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0f766e]">
                              <FileText className="w-3.5 h-3.5" />
                              Intake Form Received
                            </div>
                            <span className="text-[11px] font-bold text-[#0d9488]">View &rarr;</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[12px] font-medium text-amber-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            Intake Pending Patient Fill
                          </div>
                        )}

                        {hasAllergies && (
                          <div className="px-2.5 py-1 rounded-lg bg-red-100/80 border border-red-200 text-red-800 text-[11.5px] font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            Allergy: {intake?.allergies?.join(', ')}
                          </div>
                        )}

                        {hasConditions && !hasAllergies && (
                          <div className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11.5px] font-medium">
                            Conditions: {intake?.medical_conditions?.join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                        {!isCompleted && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setCompletingApt(apt);
                              setCompletionOutcome('standard');
                              setCompletionNotes('');
                            }}
                            className="button-primary py-2.5 px-4 rounded-xl text-white font-bold text-[13.5px] cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete Treatment
                          </button>
                        )}
                        {isCompleted && (
                          <button
                            onClick={() => {
                              setCompletingApt(apt);
                              setCompletionOutcome(isComplicated ? 'complication' : 'standard');
                              setCompletionNotes(apt.patient_notes || '');
                            }}
                            className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[12.5px] font-semibold cursor-pointer"
                          >
                            Edit Outcome
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INQUIRIES & LEAD RECOVERY HUB                                    */}
        {/* ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <h2 className="display text-[19px] font-bold text-[#0f172a] mb-1">
                Clinical Inquiries &amp; Lead Recovery Hub
              </h2>
              <p className="text-[13.5px] text-[#527078]">
                Track prospective leads captured from contact inquiries and Step 1 booking abandonments. Automated by Workflow 5.
              </p>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-500">
                <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-[15px] font-bold text-[#0f172a]">No inquiries recorded yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {new Date(inq.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span
                          className={`text-[11.5px] font-bold px-2 py-0.5 rounded ${
                            inq.status === 'converted'
                              ? 'bg-teal-100 text-teal-800'
                              : inq.status === 'in_review'
                              ? 'bg-amber-100 text-amber-800'
                              : inq.status === 'archived'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {inq.status.toUpperCase()}
                        </span>
                        <span className="text-[11.5px] text-slate-400 font-medium">
                          Source: {inq.source}
                        </span>
                      </div>

                      <h4 className="text-[16px] font-extrabold text-[#0f172a]">
                        {inq.first_name} {inq.last_name || ''}
                      </h4>
                      <p className="text-[13px] font-semibold text-[#0d9488]">
                        Interest: {inq.service_of_interest || 'General Clinical Question'}
                      </p>
                      {inq.message && (
                        <p className="text-[13px] text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                          &ldquo;{inq.message}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-[12.5px] text-slate-500 pt-1">
                        <span>Email: {inq.email}</span>
                        {inq.phone && <span>Phone: {inq.phone}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {inq.status !== 'converted' && (
                        <button
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'converted')}
                          className="py-1.5 px-3 rounded-lg border border-teal-300 bg-teal-50 text-[#0f766e] text-[12.5px] font-bold hover:bg-teal-100"
                        >
                          Mark Converted
                        </button>
                      )}
                      {inq.status !== 'archived' && (
                        <button
                          onClick={() => handleUpdateInquiryStatus(inq.id, 'archived')}
                          className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-semibold hover:bg-slate-100"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GOOGLE CALENDAR & SYNC ENGINE                                    */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="display text-[20px] font-bold text-[#0f172a]">
                  Google Calendar &amp; Multi-Operatory Engine
                </h2>
                <p className="text-[14px] text-[#527078] mt-1">
                  Automated bidirectional appointment scheduling powered by n8n Workflow 6.
                </p>
              </div>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary py-2.5 px-5 rounded-xl text-white font-bold text-[13.5px] flex items-center gap-2"
              >
                Launch Google Calendar <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-teal-50/80 border border-teal-200">
                <span className="text-[11px] font-bold uppercase text-[#0d9488] block mb-1">
                  Real-Time Sync State
                </span>
                <span className="text-[16px] font-extrabold text-[#0f766e] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] animate-pulse" />
                  Active (Webhook Driven)
                </span>
                <p className="text-[12px] text-slate-600 mt-2">
                  Every website booking automatically creates a clinical event on the practice calendar.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Primary Calendar ID
                </span>
                <span className="text-[13.5px] font-mono font-bold text-slate-700 block truncate">
                  luminadentalclinic2026@gmail.com
                </span>
                <p className="text-[12px] text-slate-500 mt-2">
                  Google Workspace Calendar configured with timezone Asia/Manila (PST).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                  Operatory Capacity
                </span>
                <span className="text-[16px] font-extrabold text-slate-800 block">
                  3 Operatory Suites
                </span>
                <p className="text-[12px] text-slate-500 mt-2">
                  Automatic conflict prevention blocks double-booking on both calendar and website.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: TREATMENT COMPLETION & HITL COMPLICATION GATE (WORKFLOW 3)      */}
      {/* ========================================================================= */}
      {completingApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-[560px] w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <p className="eyebrow">CHAIRSIDE TREATMENT MARK-OFF</p>
                <h3 className="display text-[20px] font-bold text-[#0f172a]">
                  Complete Procedure &mdash; {completingApt.patients.first_name} {completingApt.patients.last_name}
                </h3>
              </div>
              <button
                onClick={() => setCompletingApt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-5 pt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] text-slate-700 space-y-1">
                <p>
                  <strong>Treatment:</strong> {completingApt.service_name}
                </p>
                <p>
                  <strong>Slot:</strong> {completingApt.appointment_date} &bull; {completingApt.time_slot}
                </p>
              </div>

              {/* Clinical Outcome Radio Options */}
              <div>
                <label className="block text-[13px] font-bold text-[#0f172a] mb-2">
                  Clinical Outcome &amp; Post-Op Trigger:
                </label>
                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      completionOutcome === 'standard'
                        ? 'border-[#0d9488] bg-teal-50/70 ring-1 ring-[#0d9488]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="standard"
                      checked={completionOutcome === 'standard'}
                      onChange={() => setCompletionOutcome('standard')}
                      className="mt-1 text-[#0d9488] focus:ring-[#0d9488]"
                    />
                    <div>
                      <span className="block font-bold text-[14px] text-[#0f172a]">
                        Standard Routine &mdash; No Complications ✅
                      </span>
                      <span className="block text-[12.5px] text-[#527078] mt-0.5">
                        Workflow 3 will wait 2 hours, send procedure-specific aftercare guidelines (Dos/Don&rsquo;ts), and schedule Dr. Lumina&rsquo;s 9 AM morning check-in.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      completionOutcome === 'complication'
                        ? 'border-red-500 bg-red-50/80 ring-1 ring-red-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value="complication"
                      checked={completionOutcome === 'complication'}
                      onChange={() => setCompletionOutcome('complication')}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="block font-bold text-[14px] text-red-700">
                        Complication Encountered ⚠️ (Manual Follow-up Required)
                      </span>
                      <span className="block text-[12.5px] text-red-800/80 mt-0.5">
                        <strong>Human-in-the-Loop Safeguard:</strong> Automated emails will be BYPASSED. An urgent alert card will be fired immediately to staff Slack <code>#clinical-alerts</code> with patient phone/email for direct doctor/staff phone check-in.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Staff Notes */}
              <div>
                <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                  Staff / Doctor Clinical Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Prescribed Amoxicillin 500mg. Patient reported mild sensitivity."
                  className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingApt(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[13.5px] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="button-primary py-2.5 px-6 rounded-xl text-white font-bold text-[13.5px] cursor-pointer shadow-xs disabled:opacity-70"
                >
                  {isCompleting ? 'Saving Outcome...' : 'Mark Completed & Trigger Post-Op'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRE-VISIT MEDICAL INTAKE VIEWER                                */}
      {/* ========================================================================= */}
      {viewingIntakeApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-[620px] w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <p className="eyebrow">PATIENT CLINICAL HEALTH HISTORY</p>
                <h3 className="display text-[20px] font-bold text-[#0f172a]">
                  {viewingIntakeApt.patients.first_name} {viewingIntakeApt.patients.last_name}
                </h3>
              </div>
              <button
                onClick={() => setViewingIntakeApt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewingIntakeApt.medical_intakes && viewingIntakeApt.medical_intakes.length > 0 ? (
              <div className="space-y-4 pt-4 text-[13.5px]">
                {/* Allergy Alert Section */}
                {viewingIntakeApt.medical_intakes[0].allergies &&
                viewingIntakeApt.medical_intakes[0].allergies.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900">
                    <span className="font-extrabold text-[14px] flex items-center gap-1.5 text-red-700 mb-1">
                      <AlertTriangle className="w-4 h-4" /> ALLERGY WARNING:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {viewingIntakeApt.medical_intakes[0].allergies.map((allergy, i) => (
                        <span
                          key={i}
                          className="py-1 px-3 rounded-lg bg-red-600 text-white font-bold text-[12px]"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0f766e] text-[13px] font-semibold">
                    ✅ No known drug or environmental allergies reported.
                  </div>
                )}

                {/* Medical Conditions */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-[#0f172a] block text-[13px]">
                    Pre-Existing Medical Conditions:
                  </span>
                  {viewingIntakeApt.medical_intakes[0].medical_conditions &&
                  viewingIntakeApt.medical_intakes[0].medical_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {viewingIntakeApt.medical_intakes[0].medical_conditions.map((cond, i) => (
                        <span key={i} className="py-1 px-2.5 rounded-md bg-slate-200 text-slate-800 text-[12px] font-semibold">
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[13px]">None reported.</p>
                  )}
                </div>

                {/* Medications */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-[#0f172a] block text-[13px]">
                    Current Prescribed Medications:
                  </span>
                  <p className="text-slate-700">
                    {viewingIntakeApt.medical_intakes[0].current_medications || 'None'}
                  </p>
                </div>

                {/* Emergency Contact & Insurance */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12.5px]">
                    <span className="font-bold text-[#0f172a] block mb-1">Emergency Contact:</span>
                    <p className="font-semibold text-slate-800">
                      {viewingIntakeApt.medical_intakes[0].emergency_contact_name || 'Not provided'}
                    </p>
                    <p className="text-slate-500">
                      {viewingIntakeApt.medical_intakes[0].emergency_contact_phone || ''}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12.5px]">
                    <span className="font-bold text-[#0f172a] block mb-1">HMO / Insurance:</span>
                    <p className="font-semibold text-slate-800">
                      {viewingIntakeApt.medical_intakes[0].hmo_provider || 'Private Pay / None'}
                    </p>
                    <p className="text-slate-500">
                      {viewingIntakeApt.medical_intakes[0].hmo_member_id || ''}
                    </p>
                  </div>
                </div>

                {/* Digital Consent Badge */}
                <div className="pt-2 flex items-center justify-between text-[12px] text-slate-400">
                  <span className="flex items-center gap-1 font-semibold text-teal-700">
                    <ShieldCheck className="w-4 h-4 text-[#0d9488]" /> Digital Consent Signed
                  </span>
                  <span>
                    Submitted on{' '}
                    {new Date(viewingIntakeApt.medical_intakes[0].submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>No intake form submitted yet for this reservation.</p>
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewingIntakeApt(null)}
                className="button-primary py-2 px-5 rounded-xl text-white font-bold text-[13.5px]"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
