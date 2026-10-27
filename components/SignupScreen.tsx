import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { uploadImage } from '../cloudinary';
import { formatPhoneForSupabase } from '../sms';

interface Props {
  onBack: () => void;
  onSignup: (name: string, phone: string, avatarUrl: string | null) => void;
}

const SignupScreen: React.FC<Props> = ({ onBack, onSignup }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const url = await uploadImage(file);
    if (url) {
      setAvatarUrl(url);
    } else {
      setError('Image upload failed');
    }
    setIsUploading(false);
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const formattedPhone = formatPhoneForSupabase(phone);
      onSignup(fullName.trim(), formattedPhone, avatarUrl);
    } catch (err: any) {
      console.error('Signup Error:', err);
      setError(err.message || 'Sign up failed. Please check your information.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-start py-8 px-4 bg-background-dark font-display">
      <div className="absolute inset-0 map-overlay opacity-10 pointer-events-none"></div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      <div className="relative z-10 w-full max-w-md flex flex-col h-full">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between w-full mb-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-lg">arrow_back</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl overflow-hidden border border-primary/40 shadow-sm bg-[#07100f] shrink-0 p-0.5 flex items-center justify-center">
              <img
                src="/duyar-symbol.png"
                alt="Duyar"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="text-left">
              <h2 className="text-white text-base font-bold tracking-tight">Create Account</h2>
              <p className="text-[10px] font-semibold text-primary/70 tracking-wider">Join Duyar Real Estate</p>
            </div>
          </div>
          <div className="size-10"></div>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative cursor-pointer group" onClick={() => !isUploading && fileInputRef.current?.click()}>
            <div className="size-24 rounded-full border-2 border-primary/30 p-1">
              <div
                className="w-full h-full rounded-full bg-cover bg-center glass-card overflow-hidden flex items-center justify-center border border-white/10 relative"
                style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}}
              >
                {!avatarUrl && !isUploading && (
                  <span className="material-symbols-outlined text-white/30 text-4xl">add_a_photo</span>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background-dark/60 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary animate-spin">sync</span>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 bg-primary text-background-dark size-7 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined font-bold text-base">{avatarUrl ? 'edit' : 'add'}</span>
            </button>
          </div>
          <p className="text-[11px] text-white/40 mt-2">Optional Profile Photo</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSignup} className="glass-card rounded-2xl p-6 mb-5 border border-white/10 shadow-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/60 text-[10px] font-black ml-1 uppercase tracking-widest block">
              Full Name
            </label>
            <div className="flex w-full items-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-primary/40 transition-all">
              <span className="material-symbols-outlined text-primary mr-2.5 opacity-80 text-xl">person</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 text-sm w-full p-0 outline-none"
                placeholder="e.g. Zahid Anwar"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-white/60 text-[10px] font-black ml-1 uppercase tracking-widest block">
              Phone Number
            </label>
            <div className="flex w-full items-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-primary/40 transition-all">
              <span className="material-symbols-outlined text-primary mr-2.5 opacity-80 text-xl">call</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 text-sm w-full p-0 outline-none"
                placeholder="017 XXXX XXXX"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-white/60 text-[10px] font-black ml-1 uppercase tracking-widest block">
              Password / Security PIN
            </label>
            <div className="flex w-full items-center bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-primary/40 transition-all">
              <span className="material-symbols-outlined text-primary mr-2.5 opacity-80 text-xl">lock</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 text-sm w-full p-0 outline-none"
                placeholder="Create a password or 4-digit PIN"
                type="password"
                autoComplete="new-password"
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

          <button
            type="submit"
            disabled={isLoading || isUploading}
            className="w-full bg-primary hover:bg-primary/90 text-background-dark font-black text-xs tracking-[0.2em] py-4 rounded-xl shadow-[0_0_20px_rgba(19,236,218,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 uppercase italic"
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin">sync</span>
            ) : (
              <>
                <span>REGISTER & CONTINUE</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Navigation to Login */}
        <div className="text-center pt-2">
          <p className="text-white/50 text-xs">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onBack}
              className="text-primary font-bold hover:underline ml-1 uppercase tracking-wider text-xs"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupScreen;
