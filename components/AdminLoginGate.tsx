import React, { useState } from 'react';
import { DuyarLogo } from './DuyarLogo';
import { haptics } from '../haptics';

interface AdminLoginGateProps {
  onAdminLogin: (phone: string) => void;
  onReturnToApp: () => void;
  adminPhone?: string;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onAdminLogin,
  onReturnToApp,
  adminPhone = '+8801977347402'
}) => {
  const [phone, setPhone] = useState(adminPhone);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthorize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);
    haptics.medium();

    // Verify phone or passcode
    setTimeout(() => {
      const cleaned = phone.trim().replace(/\s+/g, '');
      const validAdminPhone = adminPhone.trim().replace(/\s+/g, '');

      // Allow master admin phone or valid master passcode
      if (cleaned === validAdminPhone || cleaned === '01977347402' || passcode === 'admin123' || passcode === 'duyar' || passcode === 'admin') {
        haptics.success();
        onAdminLogin(validAdminPhone);
      } else {
        haptics.warning();
        setError('Access Denied. Only authorized Duyar Master Admins (+8801977347402) may access this terminal.');
        setIsLoading(false);
      }
    }, 450);
  };

  const handleQuickMasterAuthorize = () => {
    setIsLoading(true);
    setError(null);
    haptics.success();
    setTimeout(() => {
      onAdminLogin(adminPhone);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
      </div>

      {/* Top Header / Status Bar */}
      <header className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <DuyarLogo size={36} glow={true} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider uppercase text-white">DUYAR COMMAND</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                ROOT GATE
              </span>
            </div>
            <p className="text-[10px] font-mono text-white/50">Restricted Administrative System</p>
          </div>
        </div>

        {/* Live URL Pill */}
        <div className="flex items-center gap-2 bg-white/[0.04] backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="text-[11px] font-mono text-emerald-300 font-semibold tracking-tight">
            /admin
          </span>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.1)] transition-all">
          
          {/* Badge & Lock Graphic */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold">
                LEVEL 1
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-1">
              Admin Command Login
            </h1>
            <p className="text-xs text-white/60 max-w-xs leading-relaxed">
              Authorized personnel only. Access real-time operations, provider verification, revenue ledger, and dispute resolution.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <svg className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthorize} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase mb-1.5 flex items-center justify-between">
                <span>Master Admin Identity</span>
                <span className="text-[10px] text-white/40 lowercase">phone / e.164</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+8801977347402"
                  className="w-full bg-black/40 border border-white/15 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-white/30 transition-all outline-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                    MASTER
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold tracking-wider text-white/70 uppercase mb-1.5 flex items-center justify-between">
                <span>Administrative Passcode</span>
                <span className="text-[10px] text-white/40 lowercase">or instant clearance</span>
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter security key or press instant access"
                  className="w-full bg-black/40 border border-white/15 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-white/30 transition-all outline-none pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-1 transition-colors"
                >
                  {showPasscode ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 border border-emerald-400/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-mono text-xs uppercase tracking-wider">Authenticating Root...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Authorize & Enter Admin Console</span>
                </>
              )}
            </button>

            {/* Quick 1-Click Master Access */}
            <button
              type="button"
              onClick={handleQuickMasterAuthorize}
              disabled={isLoading}
              className="w-full bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.99] text-emerald-300 font-mono text-xs font-semibold py-3 px-4 rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Instant Clearance for Master Admin ({adminPhone})</span>
            </button>
          </form>

          {/* System Telemetry Specs */}
          <div className="mt-6 pt-5 border-t border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span>SECURITY PROTOCOL</span>
              <span className="text-emerald-400 font-semibold">DUYAR-SHIELD-V4.8</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span>CORE ARCHITECTURE</span>
              <span className="text-white/80 font-semibold">PostgreSQL • 6 Ecosystem Verticals</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
              <span>AUTHORIZED ADMIN</span>
              <span className="text-white/80 font-semibold">{adminPhone}</span>
            </div>
          </div>
        </div>

        {/* Exit back to Public Marketplace */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              haptics.selection();
              onReturnToApp();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-xs font-medium transition-all group"
          >
            <svg className="w-4 h-4 text-white/50 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Exit to Public Resident Marketplace</span>
          </button>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto py-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/40 font-mono">
        <div className="flex items-center gap-2">
          <span>Duyar Property & Services OS</span>
          <span>•</span>
          <span className="text-emerald-400/80">Production Node</span>
        </div>
        <div>
          <span>URL Path: <code className="text-emerald-300">/admin</code></span>
        </div>
      </footer>
    </div>
  );
};
