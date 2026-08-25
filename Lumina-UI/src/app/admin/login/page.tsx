'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('doctor@luminaclinic.com');
  const [password, setPassword] = useState('LuminaStudio2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      window.location.href = '/admin';
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const setPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('LuminaStudio2026!');
    setErrorMsg('');
  };

  return (
    <main className="min-h-screen hero-wash py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-[480px] mx-auto">
        {/* Header Logomark */}
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
                Clinical Staff &amp; Doctor Portal
              </span>
            </div>
          </a>
        </div>

        {/* Login Card */}
        <div className="rounded-[28px] bg-white border border-slate-200/90 shadow-[0_24px_70px_rgba(15,62,74,0.08)] p-7 sm:p-10 transition-all">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[#0d9488]" />
              <p className="eyebrow">RESTRICTED CLINICAL ACCESS</p>
            </div>
            <h1 className="display text-[24px] sm:text-[26px] font-extrabold text-[#0f172a] leading-tight">
              Dentist &amp; Staff Login
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#527078]">
              Sign in with your practice credentials to access daily schedules, review medical health histories, and manage treatments.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13.5px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5" htmlFor="admin-email">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@luminaclinic.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-[14px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5" htmlFor="admin-password">
                Practice Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-[14px] text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials Selector */}
            <div className="pt-1">
              <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Quick Role Presets:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreset('doctor@luminaclinic.com')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-[12px] font-semibold border transition-all text-center ${
                    email === 'doctor@luminaclinic.com'
                      ? 'bg-teal-50 border-[#0d9488] text-[#0f766e]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Dr. Lumina (Dentist)
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('admin@luminaclinic.com')}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-[12px] font-semibold border transition-all text-center ${
                    email === 'admin@luminaclinic.com'
                      ? 'bg-teal-50 border-[#0d9488] text-[#0f766e]'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Front Desk Staff
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="button-primary w-full py-3.5 px-6 rounded-xl text-white font-bold text-[14.5px] cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing into Clinical Hub...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Sign In to Lumina Portal
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-400">
            <span>Lumina Dental Studio &copy; 2026</span>
            <a href="/" className="hover:text-[#0d9488] transition-colors font-medium">
              Return to Public Site &rarr;
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
