'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Clock,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

const CLINIC_BRANCHES = [
  'Bonifacio Global City, Taguig (Flagship Studio)',
  'Makati CBD, Metro Manila (Ayala Triangle Studio)',
  'Ortigas Center, Pasig City (San Antonio Studio)',
  'Alabang, Muntinlupa City (Filinvest City Branch)',
  'Cebu IT Park, Cebu City (Visayas Hub)',
];

export default function AdminAccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Top Bar User & Settings State
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
    role: string;
    specialization?: string;
    profile_completed?: boolean;
  } | null>(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Manila PST Clock
  const [currentDateTimePST, setCurrentDateTimePST] = useState<{ date: string; time: string }>({
    date: 'Wednesday, Aug 26, 2026',
    time: '01:40:00 AM',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTimePST({
        date: now.toLocaleDateString('en-US', {
          timeZone: 'Asia/Manila',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close settings dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    specialization: '',
    license_number: '',
    birthdate: '',
    sex: '',
    age: '',
    location: CLINIC_BRANCHES[0],
    profile_completed: false,
  });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Load current user & profile with Strict Authentication Check
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/admin/profile');
        const data = await res.json();
        if (res.ok && data.success && data.profile) {
          const p = data.profile;
          setCurrentUser({
            email: p.email,
            name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
            role: p.role,
            specialization: p.specialization,
            profile_completed: Boolean(p.profile_completed),
          });
          setFormData({
            first_name: p.first_name || '',
            last_name: p.last_name || '',
            email: p.email || '',
            role: p.role || 'doctor',
            specialization: p.specialization || '',
            license_number: p.license_number || '',
            birthdate: p.birthdate || '',
            sex: p.sex || '',
            age: p.age ? String(p.age) : '',
            location: p.location || CLINIC_BRANCHES[0],
            profile_completed: Boolean(p.profile_completed),
          });
        } else {
          // Direct to login if unauthorized
          router.push('/admin/login');
        }
      } catch {
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
    } catch {
      router.push('/admin/login');
    }
  };

  // Handle Birthdate change to auto-compute age
  const handleBirthdateChange = (dateVal: string) => {
    let computedAge = '';
    if (dateVal) {
      const birth = new Date(dateVal);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age >= 0 && age < 120) {
        computedAge = String(age);
      }
    }
    setFormData((prev) => ({
      ...prev,
      birthdate: dateVal,
      age: computedAge || prev.age,
    }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      setIsSaving(false);
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      setIsSaving(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        specialization: formData.specialization,
        license_number: formData.license_number,
        birthdate: formData.birthdate,
        sex: formData.sex,
        age: formData.age,
        location: formData.location,
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update account profile');

      setSuccessMsg('Account profile updated successfully! Redirecting to clinical hub...');
      setFormData((prev) => ({
        ...prev,
        profile_completed: Boolean(data.profile_completed),
      }));

      // Redirect to /admin dashboard
      setTimeout(() => {
        router.push('/admin');
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error updating profile');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen hero-wash flex items-center justify-center font-sans px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#0d9488]/30 border-t-[#0d9488] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Accessing Account Settings...</p>
        </div>
      </div>
    );
  }

  const isProfileIncomplete = !formData.birthdate || !formData.sex || !formData.age || !formData.location;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans">
      {/* Top Clinical Navigation Bar (Identical to /admin) */}
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

        {/* Center Live PST Clock & Date */}
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

          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="relative p-2.5 rounded-xl text-slate-600 hover:text-[#0d9488] hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
            title="Account & Settings"
            aria-label="Account and Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>

          {/* Settings Dropdown Popover */}
          {showSettingsDropdown && (
            <div className="absolute right-0 top-12 z-50 w-64 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-xl animate-in fade-in zoom-in-95 space-y-1">
              <button
                onClick={() => {
                  setShowSettingsDropdown(false);
                  router.push('/admin/account');
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-teal-50/80 text-[#0f766e] font-bold transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0d9488] flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0f766e]">My Account Profile</p>
                  <p className="text-[11px] text-[#0d9488]">Active editing</p>
                </div>
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

      {/* Main Container — Extra Wide matching /admin */}
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-5 sm:py-7 space-y-6">
        {/* Back Link */}
        <div>
          <button
            onClick={() => router.push('/admin')}
            className="inline-flex items-center gap-2 text-[13px] sm:text-[13.5px] font-bold text-slate-600 hover:text-[#0d9488] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clinical Operations Hub
          </button>
        </div>

        {/* Banner Alert for First Time / Incomplete Profile */}
        {isProfileIncomplete && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5 shadow-2xs">
              !
            </div>
            <div>
              <h4 className="font-extrabold text-[14.5px] text-amber-950">
                Action Required: Complete Your Staff Account Information
              </h4>
              <p className="text-[13px] text-amber-800 mt-0.5 leading-relaxed">
                Please complete your date of birth, sex assigned at birth, age, and assigned clinic branch to ensure accurate clinical logging and security verification.
              </p>
            </div>
          </div>
        )}

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-[#0d9488]/40 text-[#0f766e] flex items-center gap-3 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#0d9488]" />
            <span className="text-[13.5px] font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 shadow-xs animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span className="text-[13.5px] font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Profile Card & Form */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-lumina overflow-hidden">
          {/* Header Card (Clean - No BM circle, No stars) */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-teal-900 via-[#0f766e] to-[#0d9488] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="display text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formData.first_name} {formData.last_name}
              </h1>
              <p className="text-teal-100 text-[13.5px] font-medium mt-0.5">
                {formData.specialization || 'Clinical Operations'} &bull; Lumina Dental Studio
              </p>
            </div>

            <div className="self-start sm:self-center">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[12px] font-bold text-white uppercase tracking-wider">
                {formData.role === 'super_admin' ? 'Super Admin' : formData.role === 'doctor' ? 'Attending Doctor' : 'Front Desk Staff'}
              </span>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-8">
            {/* Section 1: Personal & Clinical Identity */}
            <div className="space-y-4">
              <div>
                <p className="eyebrow text-[#0d9488]">SECTION 1</p>
                <h2 className="display text-[18px] font-extrabold text-[#0f172a] tracking-tight">
                  Personal &amp; Clinical Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: toTitleCase(e.target.value) })
                    }
                    placeholder="e.g. Bryant Iverson"
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: toTitleCase(e.target.value) })
                    }
                    placeholder="e.g. Melliza"
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    Staff Email Address (Read-Only)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[13.5px] text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    Clinical Specialization / Department
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({ ...formData, specialization: toTitleCase(e.target.value) })
                    }
                    placeholder="e.g. Cosmetic Dentistry, Owner"
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30"
                  />
                </div>
              </div>

              {formData.role === 'doctor' && (
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    PRC Medical / Dental License Number
                  </label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    placeholder="e.g. PRC-098234"
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-mono"
                  />
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Section 2: Demographics & Assigned Clinic Location Dropdown */}
            <div className="space-y-4">
              <div>
                <p className="eyebrow text-[#0d9488]">SECTION 2</p>
                <h2 className="display text-[18px] font-extrabold text-[#0f172a] tracking-tight">
                  Demographics &amp; Clinic Branch Location
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.birthdate}
                    onChange={(e) => handleBirthdateChange(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    Sex Assigned at Birth
                  </label>
                  <select
                    required
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 cursor-pointer"
                  >
                    <option value="">Select Option</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g. 26"
                    className="w-full p-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-mono"
                  />
                </div>
              </div>

              {/* Assigned Location Dropdown */}
              <div>
                <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                  Assigned Clinic Location / Branch
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0d9488]" />
                  <select
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-[13.5px] text-[#0f172a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 cursor-pointer"
                  >
                    {CLINIC_BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Section 3: Password & Security */}
            <div className="space-y-4">
              <div>
                <p className="eyebrow text-[#0d9488]">SECTION 3</p>
                <h2 className="display text-[18px] font-extrabold text-[#0f172a] tracking-tight">
                  Update Practice Password
                </h2>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Leave these fields blank if you do not wish to change your password.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-bold text-[#0f172a] mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-[13.5px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="py-3 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13.5px] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="button-primary py-3 px-7 rounded-xl text-white font-bold text-[13.5px] shadow-sm cursor-pointer disabled:opacity-70 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  'Save Account Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
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
