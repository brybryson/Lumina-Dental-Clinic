'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  LogOut,
  Search,
  ShieldCheck,
  RefreshCw,
  X,
  Stethoscope,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardList,
  BellRing,
  AlertTriangle,
  Users,
  UserPlus,
  Trash2,
  Lock,
  UserCheck,
  User,
  Settings,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

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

interface StaffUser {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'doctor' | 'front_desk';
  specialization?: string;
  license_number?: string | null;
  birthdate?: string;
  sex?: string;
  age?: number;
  location?: string;
  profile_completed?: boolean;
  status: 'active' | 'suspended';
  created_at: string;
}

// 2026 Philippine Official Holidays
const PH_HOLIDAYS_2026: Record<string, string> = {
  '2026-01-01': "New Year's Day",
  '2026-01-02': 'Special Non-Working Holiday',
  '2026-02-17': 'Chinese New Year',
  '2026-02-25': 'EDSA People Power Revolution',
  '2026-04-02': 'Maundy Thursday',
  '2026-04-03': 'Good Friday',
  '2026-04-04': 'Black Saturday',
  '2026-04-09': 'Araw ng Kagitingan',
  '2026-05-01': 'Labor Day',
  '2026-06-12': 'Independence Day',
  '2026-08-21': 'Ninoy Aquino Day',
  '2026-08-31': 'National Heroes Day',
  '2026-11-01': "All Saints' Day",
  '2026-11-02': "All Souls' Day",
  '2026-11-30': 'Bonifacio Day',
  '2026-12-08': 'Feast of the Immaculate Conception',
  '2026-12-24': 'Christmas Eve',
  '2026-12-25': 'Christmas Day',
  '2026-12-30': 'Rizal Day',
  '2026-12-31': "New Year's Eve",
};

// Formats YYYY-MM-DD into "August 26, 2026"
function formatLongDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {}
  return dateStr;
}

// Clean status badge formatter matching Supabase values
function formatStatusText(status?: string): string {
  if (!status) return 'Confirmed';
  switch (status.toLowerCase()) {
    case 'checked_in':
      return 'Checked In / In Lobby';
    case 'intake_submitted':
      return 'Intake Submitted';
    case 'lead_captured':
      return 'Lead Captured';
    case 'in_review':
      return 'In Review';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'Unattended Visit';
    case 'confirmed':
    default:
      return 'Confirmed';
  }
}

// Compact time badge formatter for Google Calendar style chips (e.g. "10am")
function formatCompactTime(slot: string): string {
  const start = slot.split('–')[0]?.trim() || slot;
  return start.toLowerCase().replace(':00', '').replace(/\s+/g, '');
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
    role: string;
    specialization?: string;
    profile_completed?: boolean;
  } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Settings & Logout Dropdown State
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'schedule' | 'calendar' | 'inquiries' | 'staff'>('schedule');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Inquiries Search & Filtering State
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [inquirySourceFilter, setInquirySourceFilter] = useState('all');

  // Staff Search & Filtering State
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffCurrentPage, setStaffCurrentPage] = useState(1);
  const STAFF_PER_PAGE = 9;
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  // Super Admin Staff Creation Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: 'doctor' as 'doctor' | 'front_desk' | 'super_admin',
    specialization: '',
    license_number: '',
    password: '',
  });
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // Schedule Filters (Default: 'today')
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar View State
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 7 = August
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [returnToCalendarDay, setReturnToCalendarDay] = useState<string | null>(null);

  // Modals State
  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [completionOutcome, setCompletionOutcome] = useState<'standard' | 'complication'>('standard');
  const [completionNotes, setCompletionNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const [viewingIntakeApt, setViewingIntakeApt] = useState<Appointment | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Dynamic Today Date in Manila PST (Locked to Clinical Date: August 26, 2026)
  const [todayManilaKey, setTodayManilaKey] = useState('2026-08-26');
  const [currentDateTimePST, setCurrentDateTimePST] = useState<{ date: string; time: string }>({
    date: 'Wednesday, Aug 26, 2026',
    time: '01:18:44 PM',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const manilaDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(now);
        if (manilaDateStr.startsWith('2026-08')) {
          setTodayManilaKey(manilaDateStr);
        } else {
          setTodayManilaKey('2026-08-26');
        }
      } catch {
        setTodayManilaKey('2026-08-26');
      }

      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      setCurrentDateTimePST({
        date: 'Wednesday, Aug 26, 2026',
        time: timeStr,
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Fetch Staff List (Super Admin only)
  const loadStaffData = async () => {
    if (currentUser?.role !== 'super_admin') return;
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      if (currentUser.role === 'super_admin') {
        loadStaffData();
      }
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

  // Fast Appointment Status Updater (Check-in, No-Show, etc.)
  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status: newStatus }),
      });
      if (res.ok) {
        setActionSuccessMsg(`Appointment status updated to "${formatStatusText(newStatus)}".`);
        loadDashboardData();
        setTimeout(() => setActionSuccessMsg(''), 5000);
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
    }
  };

  // Super Admin: Create Staff / Doctor Account with Auto-Capitalization & Password Hashing
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStaff(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account');

      setActionSuccessMsg(data.message || 'Staff account created successfully.');
      setShowAddStaffModal(false);
      setNewStaffForm({
        first_name: '',
        last_name: '',
        email: '',
        role: 'doctor',
        specialization: '',
        license_number: '',
        password: '',
      });
      loadStaffData();
      setTimeout(() => setActionSuccessMsg(''), 6000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating staff account');
    } finally {
      setIsSavingStaff(false);
    }
  };

  // Super Admin: Confirm and Delete Staff Account
  const handleConfirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    setIsDeletingStaff(true);
    try {
      const res = await fetch(`/api/admin/staff?id=${staffToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove staff');
      setActionSuccessMsg(data.message || 'Staff access removed.');
      setStaffToDelete(null);
      loadStaffData();
      setTimeout(() => setActionSuccessMsg(''), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing staff');
    } finally {
      setIsDeletingStaff(false);
    }
  };

  // Treatment Completion Handler (Triggers Workflow 3 with HITL gate)
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
          ? `Follow-up alert dispatched for ${completingApt.patients.first_name}. Automated sequence bypassed; Slack alert sent to the clinical care team.`
          : `Visit marked complete for ${completingApt.patients.first_name}. Post-Op Care Sequence scheduled.`
      );

      setCompletingApt(null);
      setCompletionNotes('');
      setCompletionOutcome('standard');
      setReturnToCalendarDay(null);
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

  // Calendar Month Helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleTodayMonth = () => {
    try {
      const [yr, mo] = todayManilaKey.split('-').map(Number);
      setCurrentYear(yr);
      setCurrentMonth(mo - 1);
    } catch {
      const now = new Date();
      setCurrentYear(now.getFullYear());
      setCurrentMonth(now.getMonth());
    }
  };

  // Build Calendar Days Grid with Trailing Previous & Next Month Days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Trailing previous month days
  const prevMonthDays = Array.from({ length: firstDayOfMonth }).map((_, i) => {
    const day = daysInPrevMonth - firstDayOfMonth + i + 1;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateKey = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return {
      dayNum: day,
      dateKey,
      isCurrentMonth: false,
    };
  });

  // Current month days
  const currentMonthDays = Array.from({ length: daysInCurrentMonth }).map((_, i) => {
    const day = i + 1;
    const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return {
      dayNum: day,
      dateKey,
      isCurrentMonth: true,
    };
  });

  // Leading next month days to complete 35 or 42 grid
  const totalSlots = prevMonthDays.length + currentMonthDays.length;
  const trailingCount = totalSlots <= 35 ? 35 - totalSlots : 42 - totalSlots;
  const nextMonthDays = Array.from({ length: trailingCount }).map((_, i) => {
    const day = i + 1;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateKey = `${nextYear}-${(nextMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return {
      dayNum: day,
      dateKey,
      isCurrentMonth: false,
    };
  });

  const fullCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen hero-wash flex items-center justify-center font-sans px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#0d9488]/30 border-t-[#0d9488] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Accessing Lumina Clinical Portal...</p>
        </div>
      </div>
    );
  }

  // Filter Appointments for Schedule Tab (Default: 'today' matching Manila timestamp & Calendar)
  // Arranged from latest date to oldest date across all filters
  const filteredAppointments = appointments
    .filter((apt) => {
      const todayStr = todayManilaKey;

      if (dateFilter === 'today') {
        if (apt.appointment_date !== todayStr) return false;
      } else if (dateFilter === 'this_week') {
        const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
        const targetDate = new Date(tYear, tMonth - 1, tDay);
        const dayOfWeek = targetDate.getDay();
        const startOfWeek = new Date(targetDate);
        startOfWeek.setDate(targetDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const startOfWeekStr = `${startOfWeek.getFullYear()}-${(startOfWeek.getMonth() + 1).toString().padStart(2, '0')}-${startOfWeek.getDate().toString().padStart(2, '0')}`;
        const endOfWeekStr = `${endOfWeek.getFullYear()}-${(endOfWeek.getMonth() + 1).toString().padStart(2, '0')}-${endOfWeek.getDate().toString().padStart(2, '0')}`;

        if (apt.appointment_date < startOfWeekStr || apt.appointment_date > endOfWeekStr) return false;
      } else if (dateFilter === 'this_month') {
        const currMonthPrefix = todayStr.substring(0, 7);
        if (!apt.appointment_date.startsWith(currMonthPrefix)) return false;
      }

      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const patientName = `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.toLowerCase();
        const email = (apt.patients?.email || '').toLowerCase();
        const service = (apt.service_name || '').toLowerCase();
        const notes = (apt.patient_notes || '').toLowerCase();
        return patientName.includes(q) || email.includes(q) || service.includes(q) || notes.includes(q);
      }

      return true;
    })
    .sort((a, b) => {
      // Latest date to oldest date (descending)
      if (a.appointment_date !== b.appointment_date) {
        return b.appointment_date.localeCompare(a.appointment_date);
      }
      return (a.time_slot || '').localeCompare(b.time_slot || '');
    });

  // Filter and Sort Inquiries & Leads (Latest to Oldest Date)
  const filteredInquiries = inquiries
    .filter((inq) => {
      if (inquiryStatusFilter !== 'all') {
        if (inquiryStatusFilter === 'pending' && (inq.status === 'converted' || inq.status === 'archived')) return false;
        if (inquiryStatusFilter === 'converted' && inq.status !== 'converted') return false;
        if (inquiryStatusFilter === 'archived' && inq.status !== 'archived') return false;
      }
      if (inquirySourceFilter !== 'all' && inq.source !== inquirySourceFilter) return false;
      if (inquirySearchQuery.trim()) {
        const q = inquirySearchQuery.toLowerCase();
        const name = `${inq.first_name || ''} ${inq.last_name || ''}`.toLowerCase();
        const email = (inq.email || '').toLowerCase();
        const phone = (inq.phone || '').toLowerCase();
        const service = (inq.service_of_interest || '').toLowerCase();
        const msg = (inq.message || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || service.includes(q) || msg.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  // Filter and Sort Staff Directory for Super Admin Tab (Latest to Oldest Date)
  const filteredStaffList = staffList
    .filter((s) => {
      if (staffRoleFilter !== 'all' && s.role !== staffRoleFilter) return false;
      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase();
        const name = (s.name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const spec = (s.specialization || '').toLowerCase();
        return name.includes(q) || email.includes(q) || spec.includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

  const totalStaffPages = Math.ceil(filteredStaffList.length / STAFF_PER_PAGE) || 1;
  const paginatedStaffList = filteredStaffList.slice(
    (staffCurrentPage - 1) * STAFF_PER_PAGE,
    staffCurrentPage * STAFF_PER_PAGE
  );

  // Top Metrics
  const totalCount = appointments.length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const flaggedComplicationsCount = appointments.filter((a) => a.flag_for_manual_followup).length;
  const pendingIntakeCount = appointments.filter((a) => !a.intake_completed_at && a.status === 'confirmed').length;

  const isProfileIncomplete = !currentUser?.profile_completed;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
      {/* Top Clinical Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <a href="/admin" className="inline-flex items-center gap-2.5 group cursor-pointer" aria-label="Lumina Dental Studio Admin Hub">
            <img
              src="/images/lumina-logo.png"
              alt="Lumina Dental Studio"
              className="h-7 sm:h-8.5 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <span className="block display font-extrabold text-[#0f172a] text-[15.5px] sm:text-[17.5px] leading-tight tracking-tight">
                Lumina Dental Studio
              </span>
              <span className="block text-[9.5px] sm:text-[10.5px] text-[#0d9488] font-bold tracking-[0.12em] uppercase">
                Clinical Operations &amp; Doctor Hub
              </span>
            </div>
          </a>
        </div>

        {/* Center Live PST Clock & Date (No Pulse) */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-[12px] text-slate-700 font-semibold shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
          <span>{currentDateTimePST.date}</span>
          <span className="text-slate-300">&bull;</span>
          <span className="font-bold text-[#0f172a]">{currentDateTimePST.time} PST</span>
        </div>

        {/* User Profile & Top-Right Settings Menu */}
        <div className="relative flex items-center gap-2 sm:gap-3" ref={settingsRef}>
          <div className="px-3.5 py-1.5 rounded-xl bg-teal-50/90 border border-[#0d9488]/20 text-left">
            <span className="block text-[13px] sm:text-[13.5px] font-extrabold text-[#0f172a] leading-tight">
              {currentUser?.name || 'Bryant Iverson Melliza'}
            </span>
            <span className="block text-[10.5px] sm:text-[11px] text-[#0d9488] font-bold tracking-tight">
              {currentUser?.specialization || (currentUser?.role === 'super_admin' ? 'Owner' : 'Lead Attending Dentist')}
            </span>
          </div>

          {/* Settings Gear Button with Exclamation Point Badge for First Login / Incomplete Profile */}
          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="relative p-2.5 rounded-xl text-slate-600 hover:text-[#0d9488] hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
            title="Account & Settings"
            aria-label="Account and Settings"
          >
            <Settings className="w-4.5 h-4.5" />
            {isProfileIncomplete && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs">
                !
              </span>
            )}
          </button>

          {/* Settings Dropdown Popover */}
          {showSettingsDropdown && (
            <div className="absolute right-0 top-12 z-50 w-64 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-xl animate-in fade-in zoom-in-95 space-y-1">
              <button
                onClick={() => {
                  setShowSettingsDropdown(false);
                  router.push('/admin/account');
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0d9488] flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0f172a] group-hover:text-[#0d9488] transition-colors">
                      My Account Profile
                    </p>
                    <p className="text-[11px] text-slate-500">Edit details &amp; password</p>
                  </div>
                </div>
                {isProfileIncomplete && (
                  <span className="w-4.5 h-4.5 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    !
                  </span>
                )}
              </button>

              <hr className="border-slate-100 my-1" />

              <button
                onClick={() => {
                  setShowSettingsDropdown(false);
                  setShowLogoutConfirmModal(true);
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-bold">Log Out</p>
                  <p className="text-[11px] text-red-400">End active session</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container — Extra Wide & Responsive */}
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-5 sm:py-7 space-y-6">
        {/* Executive Greeting Header */}
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-900 via-[#0f766e] to-[#0d9488] text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {currentUser?.name || 'Bryant Iverson Melliza'}
            </h1>
            <p className="text-teal-100 text-[13.5px] sm:text-[14px] font-medium">
              {currentUser?.specialization || 'Owner'} &bull; Lumina Dental Studio Clinic Suite
            </p>
          </div>
        </div>

        {/* Banner Alert Notice */}
        {actionSuccessMsg && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/90 border border-[#0d9488]/30 text-[#0f766e] text-[13px] sm:text-[13.5px] flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#0d9488] mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{actionSuccessMsg}</div>
            <button onClick={() => setActionSuccessMsg('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Uniform, Elegant Dashboard Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-lumina hover:border-[#0d9488]/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="eyebrow text-[10.5px] tracking-wider text-[#0f766e]">TOTAL VISITS</p>
              <p className="display text-3xl font-extrabold text-[#0f172a] tracking-tight">{totalCount}</p>
              <p className="text-[11.5px] font-semibold text-slate-500">Active Reservations</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50/90 text-[#0d9488] border border-[#0d9488]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-lumina hover:border-[#0d9488]/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="eyebrow text-[10.5px] tracking-wider text-[#0f766e]">COMPLETED</p>
              <p className="display text-3xl font-extrabold text-[#0f172a] tracking-tight">{completedCount}</p>
              <p className="text-[11.5px] font-semibold text-slate-500">Post-Op Dispatched</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50/90 text-[#0d9488] border border-[#0d9488]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-lumina hover:border-[#0d9488]/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="eyebrow text-[10.5px] tracking-wider text-[#0f766e]">INTAKES PENDING</p>
              <p className="display text-3xl font-extrabold text-[#0f172a] tracking-tight">{pendingIntakeCount}</p>
              <p className="text-[11.5px] font-semibold text-slate-500">Awaiting Form Submission</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50/90 text-[#0d9488] border border-[#0d9488]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-lumina hover:border-[#0d9488]/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <p className="eyebrow text-[10.5px] tracking-wider text-[#0f766e]">FOLLOW-UP ALERTS</p>
              <p className="display text-3xl font-extrabold text-[#0f172a] tracking-tight">{flaggedComplicationsCount}</p>
              <p className="text-[11.5px] font-semibold text-slate-500">Care Team Check-In</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50/90 text-[#0d9488] border border-[#0d9488]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <BellRing className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Including Super Admin Exclusive Staff Directory Tab) */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200/80 pb-2.5 overflow-x-auto flex-nowrap no-scrollbar">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-[12.5px] sm:text-[13.5px] font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Chairside Schedule
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-[12.5px] sm:text-[13.5px] font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Lumina Calendar
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`py-2 px-3.5 sm:px-4 rounded-xl text-[12.5px] sm:text-[13.5px] font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'inquiries'
                ? 'bg-[#0d9488] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inquiries &amp; Leads ({inquiries.length})
          </button>

          {/* Super Admin Exclusive Tab */}
          {currentUser?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-2 px-3.5 sm:px-4 rounded-xl text-[12.5px] sm:text-[13.5px] font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-[#0d9488] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff &amp; Doctor Directory ({staffList.length})
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CHAIRSIDE SCHEDULE & PATIENT CARDS                                */}
        {/* ========================================================================= */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lumina">
              <h2 className="display text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
                Chairside Treatment &amp; Daily Clinical Schedule
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#527078] mt-1">
                Real-time patient intake, check-in status, clinical notes, and post-op care triage.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-lumina">
              <div className="flex flex-wrap items-center gap-2">
                {/* Date Segments (Teal active state, no black buttons) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                  <button
                    onClick={() => setDateFilter('today')}
                    className={`py-1.5 px-3 rounded-lg text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer ${
                      dateFilter === 'today'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateFilter('this_week')}
                    className={`py-1.5 px-3 rounded-lg text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer ${
                      dateFilter === 'this_week'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => setDateFilter('this_month')}
                    className={`py-1.5 px-3 rounded-lg text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer ${
                      dateFilter === 'this_month'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`py-1.5 px-3 rounded-lg text-[12.5px] sm:text-[13px] font-bold transition-all cursor-pointer ${
                      dateFilter === 'all'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-xl text-[12.5px] sm:text-[13px] font-semibold border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="intake_submitted">Intake Submitted</option>
                  <option value="checked_in">In Lobby (Checked In)</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show (Unattended)</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <span className="text-[12px] text-slate-400 font-semibold">
                  Showing {filteredAppointments.length} of {appointments.length} visits
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patient, service, notes, allergy..."
                    className="w-full pl-9 pr-3 py-1.5 text-[12.5px] sm:text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
                <button
                  onClick={loadDashboardData}
                  disabled={isLoadingData}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                  title="Refresh Schedule"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Schedule Cards List (Restructured Clean Layout - No Initials Box) */}
            {filteredAppointments.length === 0 ? (
              <div className="p-10 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-lumina text-slate-500">
                <CalendarIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-[16px] font-bold text-[#0f172a]">No appointments found</p>
                <p className="text-[13px] text-slate-400 mt-1">
                  Try adjusting the date segment filter, status selector, or search term above.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-3.5">
                {filteredAppointments.map((apt) => {
                  const patient = apt.patients || {};
                  const intake = (apt.medical_intakes && apt.medical_intakes[0]) || null;
                  const hasAllergies = intake?.allergies && intake.allergies.length > 0;
                  const isCompleted = apt.status === 'completed';
                  const isCheckedIn = apt.status === 'checked_in';
                  const isNoShow = apt.status === 'no_show';
                  const isComplicated = apt.flag_for_manual_followup;
                  const isTodayApt = apt.appointment_date === todayManilaKey;
                  const isFutureApt = apt.appointment_date > todayManilaKey;

                  return (
                    <div
                      key={apt.id}
                      className={`p-5 sm:p-6 rounded-3xl bg-white border shadow-lumina flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all ${
                        isComplicated
                          ? 'border-red-300 bg-red-50/20'
                          : isCompleted
                          ? 'border-teal-200/80 bg-teal-50/15'
                          : isCheckedIn
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : isNoShow
                          ? 'border-slate-200/80 bg-slate-50/50 opacity-75'
                          : 'border-slate-200/90 hover:border-[#0d9488]/40'
                      }`}
                    >
                      <div className="space-y-2.5 flex-1">
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-[#0d9488]/20 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#0d9488]" />
                            {apt.time_slot}
                          </span>

                          <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            {formatLongDate(apt.appointment_date)}
                          </span>

                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0f766e] border border-[#0d9488]/20">
                              <Check className="w-3 h-3" /> COMPLETED
                            </span>
                          ) : isCheckedIn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <UserCheck className="w-3 h-3 text-emerald-600" /> IN CLINIC LOBBY
                            </span>
                          ) : isNoShow ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              NO SHOW
                            </span>
                          ) : apt.status === 'cancelled' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              CANCELLED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {formatStatusText(apt.status).toUpperCase()}
                            </span>
                          )}

                          {/* Medical Intake Verified / Pending Pill */}
                          {intake ? (
                            <button
                              onClick={() => setViewingIntakeApt(apt)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100/80 transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-[#0d9488]" />
                              Verified Intake {intake.hmo_provider ? `• ${intake.hmo_provider}` : ''}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Intake Pending
                            </span>
                          )}

                          {/* Allergy Alert */}
                          {hasAllergies && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              Allergy: {intake?.allergies?.join(', ')}
                            </span>
                          )}

                          {isComplicated && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              Complication Follow-Up Flagged
                            </span>
                          )}
                        </div>

                        {/* Patient Name & Clinical Service */}
                        <div>
                          <h4 className="display text-[17.5px] sm:text-[19px] font-extrabold text-[#0f172a] tracking-tight">
                            {patient.first_name} {patient.last_name}
                            {patient.sex_assigned_at_birth && (
                              <span className="text-[13px] font-normal text-slate-400 ml-2">
                                ({patient.sex_assigned_at_birth})
                              </span>
                            )}
                          </h4>
                          <p className="text-[13px] sm:text-[13.5px] font-semibold text-[#0d9488] mt-0.5">
                            {apt.service_name}
                          </p>
                        </div>

                        {/* Patient Notes */}
                        {apt.patient_notes && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[13px] text-slate-600 italic leading-relaxed">
                            &ldquo;{apt.patient_notes}&rdquo;
                          </div>
                        )}

                        {/* Contact Channels */}
                        <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-slate-600 pt-0.5">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`mailto:${patient.email}`} className="hover:text-[#0d9488] font-medium">{patient.email}</a>
                          </span>
                          {patient.mobile && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`tel:${patient.mobile}`} className="hover:text-[#0d9488] font-medium">{patient.mobile}</a>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {isNoShow ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Unattended
                          </span>
                        ) : isCompleted ? (
                          <button
                            onClick={() => {
                              setCompletingApt(apt);
                              setCompletionOutcome(isComplicated ? 'complication' : 'standard');
                              setCompletionNotes(apt.patient_notes || '');
                              setReturnToCalendarDay(null);
                            }}
                            className="py-2 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12.5px] font-semibold cursor-pointer text-center"
                          >
                            Edit Outcome
                          </button>
                        ) : isCheckedIn ? (
                          /* Patient arrived in lobby: Doctor can now mark treatment completed */
                          <button
                            onClick={() => {
                              setCompletingApt(apt);
                              setCompletionOutcome('standard');
                              setCompletionNotes('');
                              setReturnToCalendarDay(null);
                            }}
                            className="button-primary py-2 px-4 rounded-xl text-white font-bold text-[12.5px] cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete Visit
                          </button>
                        ) : apt.status !== 'cancelled' ? (
                          /* Explicit Check-In Action */
                          <button
                            onClick={() => handleUpdateAppointmentStatus(apt.id, 'checked_in')}
                            className="py-2 px-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-[12.5px] cursor-pointer flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02]"
                            title="Mark patient as arrived at the dental clinic"
                          >
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            Check In
                          </button>
                        ) : (
                          <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            Cancelled
                          </span>
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
        {/* TAB 2: INTERACTIVE CLINIC CALENDAR & PHILIPPINE HOLIDAYS                  */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lumina">
              <h2 className="display text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
                Lumina Calendar
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#527078] mt-1">
                Monthly clinical schedule, Philippine holiday tracking, and chairside reservations.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-lumina flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[14px] sm:text-[15px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 cursor-pointer"
                >
                  {monthNames.map((month, idx) => (
                    <option key={month} value={idx}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="py-2 px-3 rounded-xl border border-slate-200 bg-white font-bold text-[14px] sm:text-[15px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 cursor-pointer"
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTodayMonth}
                  className="py-2 px-3.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>

              <div className="text-[12.5px] text-slate-500 font-medium">
                Click any day cell to view daily clinical schedule.
              </div>
            </div>

            <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lumina overflow-x-auto thin-scrollbar">
              <div className="min-w-[800px] xl:min-w-0 space-y-3">
                <div className="grid grid-cols-7 text-center font-bold text-[12px] text-slate-400 uppercase tracking-wider pb-2.5 border-b border-slate-100">
                  <span className="text-red-400 font-extrabold">Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span className="text-red-400 font-extrabold">Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                  {fullCalendarDays.map(({ dayNum, dateKey, isCurrentMonth }, idx) => {
                    const isSunday = idx % 7 === 0;
                    const holidayName = PH_HOLIDAYS_2026[dateKey];
                    const dayAppointments = appointments.filter((a) => a.appointment_date === dateKey);
                    const isToday = dateKey === todayManilaKey;

                    return (
                      <div
                        key={`cell-${dateKey}-${idx}`}
                        onClick={() => !isSunday && setSelectedCalendarDay(dateKey)}
                        className={`min-h-[165px] sm:min-h-[190px] rounded-2xl p-2.5 sm:p-3 border transition-all flex flex-col justify-between group ${
                          isSunday
                            ? 'bg-slate-100/50 border-slate-200/50 cursor-not-allowed opacity-60'
                            : !isCurrentMonth
                            ? 'bg-slate-50/40 border-slate-100 opacity-50 hover:opacity-100 hover:border-slate-300 cursor-pointer'
                            : isToday
                            ? 'bg-teal-50/70 border-[#0d9488] ring-1.5 ring-[#0d9488]/40 shadow-xs cursor-pointer'
                            : holidayName
                            ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400 cursor-pointer'
                            : 'bg-white border-slate-200/80 hover:border-[#0d9488]/50 hover:bg-slate-50/60 cursor-pointer'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[13.5px] sm:text-[14px] font-bold ${
                                isToday
                                  ? 'w-6 h-6 rounded-full bg-[#0d9488] text-white flex items-center justify-center text-[12px] shadow-xs'
                                  : isSunday
                                  ? 'text-slate-400'
                                  : !isCurrentMonth
                                  ? 'text-slate-300'
                                  : 'text-slate-800'
                              }`}
                            >
                              {dayNum}
                            </span>
                          </div>

                          {holidayName && (
                            <div className="pt-0.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md leading-tight truncate w-full shadow-2xs">
                                🇵🇭 {holidayName}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto no-scrollbar max-h-[125px] sm:max-h-[145px]">
                          {dayAppointments.map((apt) => {
                            const isAptCompleted = apt.status === 'completed';
                            const isAptNoShow = apt.status === 'no_show';

                            return (
                              <div
                                key={apt.id}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium truncate transition-colors shadow-2xs ${
                                  isAptCompleted
                                    ? 'bg-teal-50 text-[#0f766e] border border-teal-200/60'
                                    : isAptNoShow
                                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                    : 'bg-[#e0f2fe] text-[#0369a1] hover:bg-[#bae6fd]'
                                }`}
                                title={`${apt.time_slot} - ${apt.patients.first_name} (${apt.service_name}) [${formatStatusText(apt.status)}]`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isAptCompleted
                                      ? 'bg-[#0d9488]'
                                      : isAptNoShow
                                      ? 'bg-slate-400'
                                      : 'bg-[#0284c7]'
                                  }`}
                                />
                                <span className="font-bold">{formatCompactTime(apt.time_slot)}</span>
                                <span className="truncate">
                                  [Lumina] {apt.service_name.split('&')[0]?.trim()} ({apt.patients.first_name})
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INQUIRIES & LEAD RECOVERY                                        */}
        {/* ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            {/* Header Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lumina">
              <h2 className="display text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
                Clinical Inquiries &amp; Abandoned Lead Recovery
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#527078] mt-1">
                Leads captured from the contact modal and Step 1 booking abandonments. Automated recovery powered by Workflow 5.
              </p>
            </div>

            {/* Filter & Search Bar for Inquiries */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-lumina">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-xl text-[12.5px] sm:text-[13px] font-semibold border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">New / Active Leads</option>
                  <option value="converted">Converted to Booking</option>
                  <option value="archived">Archived</option>
                </select>

                <select
                  value={inquirySourceFilter}
                  onChange={(e) => setInquirySourceFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-xl text-[12.5px] sm:text-[13px] font-semibold border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Sources</option>
                  <option value="contact_modal">Contact Form Modal</option>
                  <option value="booking_funnel_step1">Step 1 Funnel Drop-off</option>
                </select>

                <span className="text-[12px] text-slate-400 font-semibold">
                  Showing {filteredInquiries.length} of {inquiries.length} leads
                </span>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={inquirySearchQuery}
                  onChange={(e) => setInquirySearchQuery(e.target.value)}
                  placeholder="Search name, email, interest, message..."
                  className="w-full pl-9 pr-3 py-1.5 text-[12.5px] sm:text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                />
              </div>
            </div>

            {/* Inquiries Cards List */}
            {filteredInquiries.length === 0 ? (
              <div className="p-10 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/90 text-slate-500 shadow-lumina">
                <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-[16px] font-bold text-[#0f172a]">No inquiries match your filter</p>
                <p className="text-[13px] text-slate-400 mt-1">
                  Try adjusting the status filter, source selector, or search term above.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-3.5">
                {filteredInquiries.map((inq) => {
                  const isConverted = inq.status === 'converted';
                  const isArchived = inq.status === 'archived';
                  const isStep1Dropoff = inq.source === 'booking_funnel_step1';

                  const dateFormatted = new Date(inq.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <div
                      key={inq.id}
                      className={`p-5 sm:p-6 rounded-3xl bg-white border shadow-lumina flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all ${
                        isConverted
                          ? 'border-teal-200/80 bg-teal-50/15'
                          : isArchived
                          ? 'border-slate-200/80 bg-slate-50/50 opacity-75'
                          : 'border-slate-200/90 hover:border-[#0d9488]/40'
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        {/* Top Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            {dateFormatted}
                          </span>

                          {isConverted ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0f766e] border border-[#0d9488]/20">
                                <Check className="w-3 h-3" /> CONVERTED
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                ⚡ Automation Completed
                              </span>
                            </>
                          ) : isArchived ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              ARCHIVED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              NEW LEAD
                            </span>
                          )}

                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            {isStep1Dropoff ? 'Step 1 Funnel Drop-off' : 'Contact Form Inquiry'}
                          </span>
                        </div>

                        {/* Name & Specialization of Interest */}
                        <div>
                          <h4 className="display text-[17px] sm:text-[18.5px] font-extrabold text-[#0f172a] tracking-tight">
                            {inq.first_name} {inq.last_name || ''}
                          </h4>
                          <p className="text-[13px] sm:text-[13.5px] font-semibold text-[#0d9488] mt-0.5">
                            Interest: {inq.service_of_interest || 'General Clinical Consultation'}
                          </p>
                        </div>

                        {/* Inbound Message */}
                        {inq.message && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[13px] text-slate-600 italic leading-relaxed">
                            &ldquo;{inq.message}&rdquo;
                          </div>
                        )}

                        {/* Contact Channels */}
                        <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-slate-600 pt-1">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <a href={`mailto:${inq.email}`} className="hover:text-[#0d9488] font-medium">{inq.email}</a>
                          </span>
                          {inq.phone && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`tel:${inq.phone}`} className="hover:text-[#0d9488] font-medium">{inq.phone}</a>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {isConverted ? (
                          <div className="flex flex-col items-start md:items-end gap-1">
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0f766e] bg-teal-50 border border-teal-200/80 px-3.5 py-1.5 rounded-xl shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-[#0d9488]" />
                              Converted to Booking
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              Automation Completed &bull; {dateFormatted}
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleUpdateInquiryStatus(inq.id, 'converted')}
                              className="button-primary py-2 px-4 rounded-xl text-white text-[12.5px] font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark Converted
                            </button>

                            {!isArchived ? (
                              <button
                                onClick={() => handleUpdateInquiryStatus(inq.id, 'archived')}
                                className="py-1.5 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12px] font-semibold cursor-pointer transition-colors"
                              >
                                Archive
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateInquiryStatus(inq.id, 'in_review')}
                                className="py-1.5 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-[12px] font-semibold cursor-pointer transition-colors"
                              >
                                Restore to Active
                              </button>
                            )}
                          </>
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
        {/* TAB 4: SUPER ADMIN STAFF & DOCTOR DIRECTORY (CLEAN 3-COLUMN CARDS)        */}
        {/* ========================================================================= */}
        {activeTab === 'staff' && currentUser?.role === 'super_admin' && (
          <div className="space-y-4">
            {/* Staff Header & Actions */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lumina flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="display text-[18px] sm:text-[20px] font-bold text-[#0f172a] tracking-tight">
                  Staff &amp; Clinicians Access Directory
                </h2>
                <p className="text-[13px] sm:text-[14px] text-[#527078] mt-1">
                  Manage login accounts, assigned clinical specializations, and portal permissions for doctors and front desk staff.
                </p>
              </div>

              <button
                onClick={() => setShowAddStaffModal(true)}
                className="button-primary py-2.5 px-4.5 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                Add New Doctor / Staff
              </button>
            </div>

            {/* Filter & Search Bar for Staff Directory */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-lumina">
              <div className="flex items-center gap-2">
                <select
                  value={staffRoleFilter}
                  onChange={(e) => {
                    setStaffRoleFilter(e.target.value);
                    setStaffCurrentPage(1);
                  }}
                  className="py-1.5 px-3 rounded-xl text-[12.5px] sm:text-[13px] font-semibold border border-slate-200 bg-white text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admins</option>
                  <option value="doctor">Attending Doctors</option>
                  <option value="front_desk">Front Desk &amp; Staff</option>
                </select>

                <span className="text-[12px] text-slate-400 font-semibold">
                  Showing {paginatedStaffList.length} of {filteredStaffList.length} accounts
                </span>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => {
                    setStaffSearchQuery(e.target.value);
                    setStaffCurrentPage(1);
                  }}
                  placeholder="Search staff by name, email..."
                  className="w-full pl-9 pr-3 py-1.5 text-[12.5px] sm:text-[13px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                />
              </div>
            </div>

            {/* Staff Multi-Column Cards Grid (9 Cards Per Page) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {paginatedStaffList.map((staff) => {
                const isPrimaryOwner = staff.email === 'bryantiversonmelliza03@gmail.com';

                return (
                  <div
                    key={staff.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-lumina flex flex-col justify-between gap-4 hover:border-[#0d9488]/40 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] sm:text-[11.5px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0f766e] border border-[#0d9488]/20">
                          {staff.role === 'super_admin'
                            ? 'Super Admin'
                            : staff.role === 'doctor'
                            ? 'Attending Doctor'
                            : 'Front Desk & Staff'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      </div>

                      {/* Name & Specialization */}
                      <div>
                        <h3 className="display text-[18px] sm:text-[19px] font-extrabold text-[#0f172a] tracking-tight">
                          {staff.name}
                        </h3>
                        <p className="text-[13px] sm:text-[13.5px] font-semibold text-[#0d9488] mt-0.5">
                          {staff.specialization || 'Clinical Operations'}
                        </p>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Details List with Clean Icons */}
                      <div className="space-y-2 text-[12.5px] text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{staff.email}</span>
                        </div>

                        {staff.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[#0d9488] shrink-0" />
                            <span className="truncate">{staff.location}</span>
                          </div>
                        )}

                        {staff.license_number && (
                          <div className="flex items-center gap-2 font-mono text-slate-700">
                            <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>License: {staff.license_number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions & Profile Status */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      {staff.profile_completed ? (
                        <span className="text-[11.5px] font-semibold text-slate-400">Profile Verified</span>
                      ) : (
                        <span className="text-[11.5px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Profile Incomplete
                        </span>
                      )}

                      {!isPrimaryOwner ? (
                        <button
                          onClick={() => setStaffToDelete(staff)}
                          className="py-1.5 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Revoke portal access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Access
                        </button>
                      ) : (
                        <span className="text-[11.5px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          Owner Account
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls (Triggers when staff users exceed 9/10 cards) */}
            {filteredStaffList.length > 9 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-lumina">
                <span className="text-[12.5px] text-slate-500 font-semibold">
                  Showing {(staffCurrentPage - 1) * STAFF_PER_PAGE + 1} &ndash; {Math.min(staffCurrentPage * STAFF_PER_PAGE, filteredStaffList.length)} of {filteredStaffList.length} staff accounts (Page {staffCurrentPage} of {totalStaffPages})
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={staffCurrentPage === 1}
                    onClick={() => setStaffCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-[12.5px] font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalStaffPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setStaffCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                          staffCurrentPage === pageNum
                            ? 'bg-[#0d9488] text-white shadow-xs'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    disabled={staffCurrentPage === totalStaffPages}
                    onClick={() => setStaffCurrentPage((p) => Math.min(p + 1, totalStaffPages))}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-[12.5px] font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: DAILY CLINICAL SCHEDULE MODAL (CALENDAR DAY CLICK)               */}
      {/* ========================================================================= */}
      {selectedCalendarDay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-[760px] w-full min-h-[560px] max-h-[85vh] p-5 sm:p-7 shadow-2xl border border-slate-100 flex flex-col justify-between animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div>
                <p className="eyebrow">DAILY CLINICAL SCHEDULE</p>
                <h3 className="display text-[20px] sm:text-[22px] font-extrabold text-[#0f172a] tracking-tight">
                  {formatLongDate(selectedCalendarDay)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 py-4 my-1">
              {appointments.filter((a) => a.appointment_date === selectedCalendarDay).length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                  <p className="text-[15px] font-medium">No appointments booked for this date.</p>
                </div>
              ) : (
                appointments
                  .filter((a) => a.appointment_date === selectedCalendarDay)
                  .map((apt) => {
                    const isCompleted = apt.status === 'completed';
                    const isCheckedIn = apt.status === 'checked_in';
                    const isNoShow = apt.status === 'no_show';

                    return (
                      <div
                        key={apt.id}
                        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
                          isNoShow
                            ? 'bg-slate-50/80 border-slate-200 text-slate-500'
                            : isCompleted
                            ? 'bg-teal-50/20 border-teal-200/80'
                            : 'bg-white border-slate-200/90 hover:border-[#0d9488]/40'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-md border ${
                                isNoShow
                                  ? 'bg-slate-200/70 text-slate-600 border-slate-300'
                                  : 'bg-teal-50 text-[#0f766e] border-[#0d9488]/20'
                              }`}
                            >
                              {apt.time_slot}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                                isCompleted
                                  ? 'bg-teal-50 text-[#0f766e] border-teal-200'
                                  : isCheckedIn
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : isNoShow
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isNoShow ? 'No Show' : formatStatusText(apt.status)}
                            </span>
                          </div>
                          <h4
                            className={`display font-extrabold text-[16px] sm:text-[17px] tracking-tight ${
                              isNoShow ? 'text-slate-700' : 'text-[#0f172a]'
                            }`}
                          >
                            {apt.patients.first_name} {apt.patients.last_name}
                          </h4>
                          <p
                            className={`text-[13px] sm:text-[13.5px] font-semibold ${
                              isNoShow ? 'text-slate-500' : 'text-[#0d9488]'
                            }`}
                          >
                            {apt.service_name}
                          </p>
                        </div>

                        {/* Right Side: Strictly NO Action button if no_show */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isNoShow ? (
                            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Unattended
                            </span>
                          ) : isCompleted ? (
                            <button
                              onClick={() => {
                                const currentDay = selectedCalendarDay;
                                setSelectedCalendarDay(null);
                                setReturnToCalendarDay(currentDay);
                                setCompletingApt(apt);
                                setCompletionOutcome(apt.flag_for_manual_followup ? 'complication' : 'standard');
                                setCompletionNotes(apt.patient_notes || '');
                              }}
                              className="py-2 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[12.5px] font-semibold cursor-pointer text-center shrink-0"
                            >
                              Edit Outcome
                            </button>
                          ) : isCheckedIn ? (
                            /* Patient checked in: Doctor can perform treatment */
                            <button
                              onClick={() => {
                                const currentDay = selectedCalendarDay;
                                setSelectedCalendarDay(null);
                                setReturnToCalendarDay(currentDay);
                                setCompletingApt(apt);
                                setCompletionOutcome(apt.flag_for_manual_followup ? 'complication' : 'standard');
                                setCompletionNotes(apt.patient_notes || '');
                              }}
                              className="button-primary py-2 px-4 rounded-xl text-white text-[12.5px] sm:text-[13px] font-bold shadow-xs cursor-pointer shrink-0"
                            >
                              Action
                            </button>
                          ) : apt.status !== 'cancelled' ? (
                            /* Explicit Check-In Action */
                            <button
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'checked_in')}
                              className="py-2 px-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold text-[12px] cursor-pointer flex items-center gap-1 shadow-2xs transition-all hover:scale-[1.02]"
                              title="Mark patient as arrived in clinic lobby"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Check In
                            </button>
                          ) : (
                            <span className="text-[12px] font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="pt-3.5 border-t border-slate-100 text-right shrink-0">
              <button
                onClick={() => setSelectedCalendarDay(null)}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[13px] sm:text-[13.5px] hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHAIRSIDE TREATMENT MARK-OFF                                     */}
      {/* ========================================================================= */}
      {completingApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-[760px] w-full min-h-[560px] max-h-[85vh] p-5 sm:p-7 shadow-2xl border border-slate-100 flex flex-col justify-between animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 shrink-0">
              <div>
                <p className="eyebrow">CHAIRSIDE TREATMENT MARK-OFF</p>
                <h3 className="display text-[19px] sm:text-[21px] font-extrabold text-[#0f172a] tracking-tight">
                  Complete Procedure &mdash; {completingApt.patients.first_name} {completingApt.patients.last_name}
                </h3>
              </div>
              <button
                onClick={() => {
                  if (returnToCalendarDay) {
                    const backDay = returnToCalendarDay;
                    setCompletingApt(null);
                    setReturnToCalendarDay(null);
                    setSelectedCalendarDay(backDay);
                  } else {
                    setCompletingApt(null);
                  }
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="flex-1 overflow-y-auto thin-scrollbar pr-1.5 space-y-4 py-4 my-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[13px] sm:text-[13.5px] text-slate-700 space-y-1.5">
                  <p>
                    <strong className="text-slate-900">Treatment:</strong> {completingApt.service_name}
                  </p>
                  <p>
                    <strong className="text-slate-900">Slot:</strong> {formatLongDate(completingApt.appointment_date)} &bull; {completingApt.time_slot}
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#0f172a] mb-2">
                    Clinical Outcome &amp; Post-Op Sequence:
                  </label>
                  <div className="space-y-2.5">
                    <label
                      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
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
                        <span className="block font-bold text-[14px] sm:text-[14.5px] text-[#0f172a]">
                          Standard Visit &mdash; Normal Recovery
                        </span>
                        <span className="block text-[12.5px] sm:text-[13px] text-[#527078] mt-0.5 leading-relaxed">
                          Triggers standard aftercare instructions in 2 hours and schedules {currentUser?.name || 'Dr. Lumina'}’s morning comfort check-in.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
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
                        <span className="block font-bold text-[14px] sm:text-[14.5px] text-red-700">
                          Complication Encountered (Care Team Phone Check-in)
                        </span>
                        <span className="block text-[12.5px] sm:text-[13px] text-red-800/80 mt-0.5 leading-relaxed">
                          Bypasses automated emails and dispatches an urgent alert to the clinical Slack channel for personalized doctor/staff phone outreach.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">
                    Doctor / Staff Notes (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="e.g. Prescribed Amoxicillin 500mg. Scheduled for stitch removal."
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13px] sm:text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (returnToCalendarDay) {
                      const backDay = returnToCalendarDay;
                      setCompletingApt(null);
                      setReturnToCalendarDay(null);
                      setSelectedCalendarDay(backDay);
                    } else {
                      setCompletingApt(null);
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[13px] sm:text-[13.5px] hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCompleting}
                  className="button-primary py-2.5 px-5 sm:px-6 rounded-xl text-white font-bold text-[13px] sm:text-[13.5px] cursor-pointer shadow-xs disabled:opacity-70"
                >
                  {isCompleting ? 'Saving Outcome...' : 'Confirm & Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRE-VISIT MEDICAL INTAKE VIEWER                                */}
      {/* ========================================================================= */}
      {viewingIntakeApt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-[620px] w-full p-5 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <p className="eyebrow">PATIENT MEDICAL HEALTH RECORD</p>
                <h3 className="display text-[19px] sm:text-[21px] font-extrabold text-[#0f172a] tracking-tight">
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
              <div className="space-y-4 pt-4 text-[13px] sm:text-[13.5px]">
                {viewingIntakeApt.medical_intakes[0].allergies &&
                viewingIntakeApt.medical_intakes[0].allergies.length > 0 ? (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900">
                    <span className="font-extrabold text-[13.5px] sm:text-[14px] flex items-center gap-1.5 text-red-700 mb-1">
                      <AlertTriangle className="w-4 h-4" /> ALLERGY WARNING:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {viewingIntakeApt.medical_intakes[0].allergies.map((allergy, i) => (
                        <span
                          key={i}
                          className="py-1 px-3 rounded-lg bg-red-600 text-white font-bold text-[11.5px] sm:text-[12px]"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0f766e] text-[12.5px] sm:text-[13px] font-semibold">
                    No drug or environmental allergies reported.
                  </div>
                )}

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-[#0f172a] block text-[12.5px] sm:text-[13px]">
                    Pre-Existing Health Conditions:
                  </span>
                  {viewingIntakeApt.medical_intakes[0].medical_conditions &&
                  viewingIntakeApt.medical_intakes[0].medical_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {viewingIntakeApt.medical_intakes[0].medical_conditions.map((cond, i) => (
                        <span key={i} className="py-1 px-2.5 rounded-md bg-slate-200 text-slate-800 text-[11.5px] sm:text-[12px] font-semibold">
                          {cond}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[12.5px] sm:text-[13px]">None reported.</p>
                  )}
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-[#0f172a] block text-[12.5px] sm:text-[13px]">
                    Current Medications:
                  </span>
                  <p className="text-slate-700 font-medium">
                    {viewingIntakeApt.medical_intakes[0].current_medications || 'None'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] sm:text-[12.5px]">
                    <span className="font-bold text-[#0f172a] block mb-1">Emergency Contact:</span>
                    <p className="font-semibold text-slate-800">
                      {viewingIntakeApt.medical_intakes[0].emergency_contact_name || 'Not provided'}
                    </p>
                    <p className="text-slate-500">
                      {viewingIntakeApt.medical_intakes[0].emergency_contact_phone || ''}
                    </p>
                  </div>
                  <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[12px] sm:text-[12.5px]">
                    <span className="font-bold text-[#0f172a] block mb-1">HMO / Insurance:</span>
                    <p className="font-semibold text-slate-800">
                      {viewingIntakeApt.medical_intakes[0].hmo_provider || 'Private Pay'}
                    </p>
                    <p className="text-slate-500">
                      {viewingIntakeApt.medical_intakes[0].hmo_member_id || ''}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11.5px] sm:text-[12px] text-slate-400 gap-1">
                  <span className="flex items-center gap-1 font-semibold text-teal-700">
                    <ShieldCheck className="w-4 h-4 text-[#0d9488]" /> Digital Consent Verified
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
                className="button-primary w-full sm:w-auto py-2 px-5 rounded-xl text-white font-bold text-[13px] sm:text-[13.5px] cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SUPER ADMIN - ADD NEW DOCTOR / STAFF ACCESS                      */}
      {/* ========================================================================= */}
      {showAddStaffModal && currentUser?.role === 'super_admin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-[540px] w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0d9488]" />
                <h3 className="display text-[19px] sm:text-[20px] font-extrabold text-[#0f172a] tracking-tight">
                  Add Doctor or Staff Account
                </h3>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#0f172a] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.first_name}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, first_name: toTitleCase(e.target.value) })
                    }
                    placeholder="e.g. Maria"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#0f172a] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.last_name}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, last_name: toTitleCase(e.target.value) })
                    }
                    placeholder="e.g. Santos"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-[#0f172a] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  placeholder="doctor.santos@luminaclinic.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#0f172a] mb-1">
                    System Role &amp; Permission
                  </label>
                  <select
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 cursor-pointer"
                  >
                    <option value="doctor">Attending Doctor (Dentist)</option>
                    <option value="front_desk">Front Desk &amp; Receptionist</option>
                    <option value="super_admin">Super Admin (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-[#0f172a] mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.specialization}
                    onChange={(e) =>
                      setNewStaffForm({ ...newStaffForm, specialization: toTitleCase(e.target.value) })
                    }
                    placeholder="e.g. Cosmetic Dentistry"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[#0f172a] mb-1">
                    PRC License Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={newStaffForm.license_number}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, license_number: e.target.value })}
                    placeholder="PRC-123456"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-[#0f172a] mb-1">
                    Initial Practice Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewStaffPassword ? 'text' : 'password'}
                      value={newStaffForm.password}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                      placeholder="Default: LuminaStudio2026!"
                      className="w-full p-2.5 pr-9 rounded-xl border border-slate-200 text-[13px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingStaff}
                  className="button-primary py-2.5 px-5 rounded-xl text-white font-bold text-[13px] shadow-xs cursor-pointer disabled:opacity-70"
                >
                  {isSavingStaff ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONFIRM REMOVE STAFF ACCESS MODAL (NO BROWSER ALERT)             */}
      {/* ========================================================================= */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-[460px] w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="display text-[18px] sm:text-[19px] font-extrabold text-[#0f172a] tracking-tight">
                Revoke Staff Access?
              </h3>
              <p className="text-[13px] sm:text-[13.5px] text-slate-600 mt-1 leading-relaxed">
                Are you sure you want to remove portal access for <strong className="text-slate-900">{staffToDelete.name}</strong> ({staffToDelete.email})? They will no longer be able to log in to the Lumina clinical dashboard.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingStaff}
                onClick={handleConfirmDeleteStaff}
                className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] shadow-xs cursor-pointer disabled:opacity-70"
              >
                {isDeletingStaff ? 'Removing...' : 'Yes, Remove Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: LOGOUT CONFIRMATION MODAL                                        */}
      {/* ========================================================================= */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-[420px] w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0d9488] border border-[#0d9488]/20 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="display text-[18px] font-extrabold text-[#0f172a] tracking-tight">
                Log Out of Clinical Portal?
              </h3>
              <p className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                You are currently signed in as <strong className="text-slate-900">{currentUser?.name || 'Dr. Lumina'}</strong>. Are you sure you want to end your active session?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="button-primary py-2 px-5 rounded-xl text-white font-bold text-[13px] shadow-xs cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
