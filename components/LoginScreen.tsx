import React, { useState, useEffect } from 'react';
import { formatPhoneForSupabase } from '../sms';
import { getBiometricConfig, playBiometricSuccessEffect } from '../biometrics';
import { BiometricPromptModal } from './BiometricPromptModal';
import { isSupabaseConfigured, setRuntimeSupabaseConfig, supabaseUrl, supabaseKey } from '../supabase';

interface Props {
  onLogin: (phone: string) => void;
  onSignup: () => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin, onSignup }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricConfig, setBiometricConfig] = useState(getBiometricConfig());
  const [savedPhone, setSavedPhone] = useState<string | null>(null);

  // Runtime Supabase configuration modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputUrl, setInputUrl] = useState(supabaseUrl || '');
  const [inputKey, setInputKey] = useState(supabaseKey || '');

  useEffect(() => {
    const config = getBiometricConfig();
    setBiometricConfig(config);

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('duyar_user_phone');
      if (stored) {
        setSavedPhone(stored);
        setPhone(stored.replace(/^\+880/, '0'));
      }
    }
  }, []);

  const handleBiometricLoginSuccess = () => {
    setShowBiometricModal(false);
    playBiometricSuccessEffect();
    setIsLoading(true);

    if (savedPhone) {
      onLogin(savedPhone);
    } else if (phone.trim().length >= 8) {
      const formatted = formatPhoneForSupabase(phone);
      onLogin(formatted);
    } else {
      setError('Please enter your phone number to pair with your fingerprint.');
      setIsLoading(false);
    }
  };

  const handleFingerprintClick = async () => {
    setError(null);
    if (!savedPhone && phone.trim().length < 8) {
      setError('Please enter your phone number first to authenticate with fingerprint.');
      return;
    }
    setShowBiometricModal(true);
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneForSupabase(phone);
      onLogin(formattedPhone);
    } catch (err: any) {
      console.error('Login Error:', err);
      setError(err.message || 'Login failed. Please check your phone number.');
      setIsLoading(false);
    }
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      alert('Please provide both Supabase URL and Anon Public Key.');
      return;
    }
    setRuntimeSupabaseConfig(inputUrl.trim(), inputKey.trim());
  };

  const biometricLabel = biometricConfig.type === 'face' ? 'Face ID' : 'Touch ID / Fingerprint';
  const biometricIcon = biometricConfig.type === 'face' ? 'face' : 'fingerprint';

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background-dark overflow-y-auto font-display">
      <div className="absolute inset-0 map-overlay pointer-events-none opacity-10"></div>

      {/* Biometric Scan Prompt Modal */}
      <BiometricPromptModal
        isOpen={showBiometricModal}
        mode="app_access"
        title={`Unlock with ${biometricLabel}`}
        subtitle="Authenticate your biometric credential to access your Duyar account"
        recipientName={savedPhone ? `Account (${savedPhone})` : phone ? `Account (${phone})` : 'Registered Resident'}
        onSuccess={handleBiometricLoginSuccess}
        onCancel={() => setShowBiometricModal(false)}
      />

      {/* Quick Supabase Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#102220] border border-white/10 rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl">database</span>
              <h3 className="text-white text-lg font-bold">Connect Supabase Database</h3>
            </div>
            <p className="text-white/60 text-xs mb-4">
              Connect your live Supabase project. These keys can also be set permanently in your environment variables as <code className="text-primary font-mono text-[11px]">VITE_SUPABASE_URL</code> and <code className="text-primary font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code>.
            </p>
            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3.5">
              <div>
                <label className="block text-white/60 text-[10px] font-black uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzprojectid.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-white/60 text-[10px] font-black uppercase tracking-wider mb-1">
                  Supabase Anon (Public) Key
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-[11px] outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-background-dark font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="w-full max-w-[420px] z-10 animate-in fade-in duration-500 py-6 sm:py-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group mb-3">
            <div className="absolute inset-0 bg-[#13ecda]/25 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>
            <button
              type="button"
              onClick={() => {
                setPhone('01977347402');
                setError(null);
              }}
              title="Click to fill Master Admin (+8801977347402)"
              className="relative w-24 h-24 flex items-center justify-center p-0 active:scale-95 transition-transform cursor-pointer bg-transparent border-none outline-none"
            >
              <img
                src="/duyar-symbol.png"
                alt="Duyar Emblem"
                className="w-full h-full object-contain pointer-events-none transition-transform duration-500 group-hover:scale-105 filter drop-shadow-[0_8px_24px_rgba(19,236,218,0.35)]"
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl font-black tracking-tight">Duyar</h1>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              Verified
            </span>
          </div>
          <p className="text-primary/90 text-[10px] font-bold tracking-widest uppercase mt-1">Real Estate & Super App</p>
        </div>

        {/* Main Authentication Card */}
        <div className="glass-card rounded-[2rem] p-6 sm:p-7 border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-6">
            <h2 className="text-white text-xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-white/50 text-xs mt-1">Sign in to manage properties, services & wallet</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Phone Number Field */}
            <div>
              <label className="block text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 ml-1">
                Phone Number
              </label>
              <div className="flex w-full items-center rounded-xl overflow-hidden border border-white/10 bg-white/5 focus-within:border-primary/50 transition-all">
                <div className="flex items-center pl-3.5 pr-2">
                  <span className="material-symbols-outlined text-primary text-xl">call</span>
                </div>
                <input
                  className="flex w-full bg-transparent text-white border-none focus:ring-0 h-12 placeholder:text-white/30 p-3 text-sm font-medium outline-none"
                  placeholder="017 XXXX XXXX"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Password / PIN Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                  Password / PIN
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/40 hover:text-white/70 text-[10px] font-semibold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="flex w-full items-center rounded-xl overflow-hidden border border-white/10 bg-white/5 focus-within:border-primary/50 transition-all">
                <div className="flex items-center pl-3.5 pr-2">
                  <span className="material-symbols-outlined text-primary text-xl">lock</span>
                </div>
                <input
                  className="flex w-full bg-transparent text-white border-none focus:ring-0 h-12 placeholder:text-white/30 p-3 text-sm font-medium outline-none"
                  placeholder="Enter your password or PIN"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-400 text-[11px] font-bold tracking-wide text-center">{error}</p>
              </div>
            )}

            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-background-dark font-black text-xs tracking-[0.2em] h-13 rounded-xl transition-all duration-200 shadow-md shadow-primary/20 uppercase italic flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin">sync</span>
              ) : (
                <>
                  <span>LOGIN</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative bg-background-dark px-3 text-[10px] uppercase font-bold text-white/40 tracking-widest">
              OR
            </span>
          </div>

          {/* FINGERPRINT / BIOMETRIC OPTION BUTTON */}
          <button
            type="button"
            onClick={handleFingerprintClick}
            disabled={isLoading}
            className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-primary/40 hover:border-primary text-white transition-all flex items-center justify-center gap-3 group active:scale-[0.98] shadow-sm"
          >
            <div className="size-9 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl font-bold">
                {biometricIcon}
              </span>
            </div>
            <div className="text-left">
              <p className="text-white text-xs font-black uppercase tracking-wider group-hover:text-primary transition-colors">
                Sign in with {biometricLabel}
              </p>
              <p className="text-white/40 text-[10px]">
                {savedPhone ? `Saved session: ${savedPhone}` : 'Fast biometric access'}
              </p>
            </div>
          </button>
        </div>

        {/* Register Navigation Option */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-white/50 text-xs font-medium">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSignup}
              className="text-primary font-bold hover:underline ml-1 uppercase tracking-wider text-xs"
            >
              Register Now
            </button>
          </p>



          {!isSupabaseConfigured && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowConfigModal(true)}
                className="text-[11px] text-white/30 hover:text-white/70 transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-xs">database</span>
                <span>Connect Database</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
