
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

interface Props {
  phone: string;
  expectedOtp: string;
  onVerify: () => void;
  onResend: () => void;
}

const OTPScreen: React.FC<Props> = ({ phone, expectedOtp, onVerify, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (val: string, index: number) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setError(null);
    
    if (val && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // If we have an expectedOtp (direct flow), compare it
      if (expectedOtp && token !== expectedOtp) {
        throw new Error('Invalid verification code');
      }

      // If bypassing backend verification, we simulate a successful login
      // In a production app, you'd use supabase.auth.setSession here if you had one
      console.log("Direct verification successful");
      onVerify(); 
    } catch (err: any) {
      console.error("Verification Error:", err);
      setError(err.message || 'Invalid code. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setTimeLeft(45);
    setOtp(['', '', '', '', '', '']);
    onResend();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background-dark p-0 m-0 overflow-hidden font-display">
      <div className="absolute inset-0 z-0 bg-background-dark">
        <div className="absolute inset-0 map-overlay opacity-5"></div>
      </div>
      
      {isVerifying && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark/60 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-black/60 border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center gap-6 shadow-2xl">
              <span className="material-symbols-outlined text-primary text-5xl animate-spin">sync</span>
              <p className="text-primary text-xs font-black uppercase tracking-[0.3em]">Establishing Session...</p>
           </div>
        </div>
      )}

      <main className="relative z-10 w-full max-w-[430px] h-full min-h-screen flex flex-col justify-between px-6 pt-20 pb-12">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 mb-8 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20">
            <span className="material-symbols-outlined text-primary text-4xl">shield_lock</span>
          </div>
          <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight text-center italic uppercase">
            Verify Identity
          </h1>
          <div className="flex flex-col items-center gap-1 mt-4">
            <p className="text-white/40 text-sm font-medium text-center">
              Enter the 6-digit code sent to
            </p>
            <div className="flex items-center gap-2">
              <span className="text-primary font-black tracking-widest">{phone}</span>
              <button onClick={() => window.location.reload()} className="text-[10px] font-bold text-white/30 hover:text-white underline uppercase">Change</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-12 mb-auto">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="number"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className={`flex h-14 w-12 text-center text-2xl font-black rounded-xl border-2 transition-all duration-300 outline-none ${digit ? 'border-primary bg-primary/10 text-primary' : error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5 text-white focus:border-primary/50'}`}
                maxLength={1}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mt-6">
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider text-center">{error}</p>
            </div>
          )}

          <div className="mt-12 flex flex-col items-center gap-4">
            {timeLeft > 0 ? (
              <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.2em]">
                Resend available in <span className="text-white font-bold">00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
              </p>
            ) : (
              <button onClick={handleResend} className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-125 transition-all">
                Resend Verification Code
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={handleVerify}
            className="w-full h-14 bg-primary text-background-dark text-xs font-black tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/25 uppercase italic transition-all hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Verify OTP & Continue</span>
            <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default OTPScreen;
