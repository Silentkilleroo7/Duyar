import React, { useState, useEffect } from 'react';
import { 
  getBiometricConfig, 
  verifySecurityPin, 
  playBiometricSuccessEffect, 
  playBiometricErrorEffect 
} from '../biometrics';
import { BiometricPromptModal } from './BiometricPromptModal';

interface Props {
  recipient?: any;
  amount?: string;
  onBack: () => void;
  onVerify: () => Promise<void>;
}

const PinVerification: React.FC<Props> = ({ recipient, amount, onBack, onVerify }) => {
  const [pin, setPin] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [config, setConfig] = useState(getBiometricConfig());

  useEffect(() => {
    const currentConf = getBiometricConfig();
    setConfig(currentConf);

    // Auto-prompt biometrics if enabled for transactions and user preference is on
    if (currentConf.enabled && currentConf.forTransactions && currentConf.autoPromptTransactions) {
      const timer = setTimeout(() => {
        setShowBiometricModal(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleKeypress = async (key: string) => {
    if (isProcessing) return;
    
    if (pin.length < 4) {
      const newPin = [...pin, key];
      setPin(newPin);
      
      if (newPin.length === 4) {
        setIsProcessing(true);
        setError(null);
        try {
          const pinStr = newPin.join('');
          const isValid = verifySecurityPin(pinStr);

          if (!isValid) {
            playBiometricErrorEffect();
            throw new Error("Incorrect Security PIN. Try again or use Biometrics.");
          }

          playBiometricSuccessEffect();
          await new Promise(resolve => setTimeout(resolve, 400));
          await onVerify();
        } catch (err: any) {
          console.error(err);
          setError(err.message || "Transaction Failed");
          setPin([]);
          setIsProcessing(false);
        }
      }
    }
  };

  const handleDelete = () => {
    if (!isProcessing) setPin(prev => prev.slice(0, -1));
  };

  const handleBiometricSuccess = async () => {
    setShowBiometricModal(false);
    setBiometricVerified(true);
    setIsProcessing(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      await onVerify();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Transaction Failed");
      setIsProcessing(false);
      setBiometricVerified(false);
    }
  };

  const isBiometricActive = config.enabled && config.forTransactions;
  const biometricLabel = config.type === 'face' ? 'Face ID' : 'Touch ID / Fingerprint';
  const biometricIcon = config.type === 'face' ? 'face' : 'fingerprint';

  return (
    <div className="bg-background-dark text-white min-h-screen flex flex-col relative font-display overflow-hidden">
      {/* Biometric Scan Modal */}
      <BiometricPromptModal
        isOpen={showBiometricModal}
        mode="transaction"
        title={`Authorize with ${biometricLabel}`}
        subtitle="Authenticate to securely release transaction funds"
        amount={amount}
        recipientName={recipient?.name}
        recipientAvatar={recipient?.image}
        onSuccess={handleBiometricSuccess}
        onCancel={() => setShowBiometricModal(false)}
        onFallbackToPin={() => setShowBiometricModal(false)}
      />

      {/* Processing or Biometric Verified Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
           {biometricVerified ? (
             <div className="flex flex-col items-center">
               <div className="size-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 animate-in zoom-in-75 duration-300 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                 <span className="material-symbols-outlined text-4xl font-bold">verified</span>
               </div>
               <p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-xs">Biometric Verified</p>
               <p className="text-white/60 text-xs mt-1">Releasing transaction funds...</p>
             </div>
           ) : (
             <>
               <div className="size-20 rounded-full border-4 border-t-primary border-primary/10 animate-spin mb-4"></div>
               <p className="text-primary font-black uppercase tracking-[0.2em] text-xs">Processing Transaction...</p>
             </>
           )}
        </div>
      )}

      {/* Ambient background glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#102220] via-[#0d1a19] to-black"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-md mx-auto w-full px-6 pt-10 pb-6">
        
        {/* Top bar with back button & security indicator */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack} 
            disabled={isProcessing} 
            className="glass size-11 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform border border-white/10 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              256-Bit SSL Secured
            </span>
          </div>
        </div>

        {/* Transaction Summary Header */}
        <div className="text-center mb-5">
          <h2 className="text-primary tracking-[0.2em] text-xl font-black mb-1 uppercase italic">
            SECURE VERIFICATION
          </h2>
          <p className="text-white/60 text-xs font-normal leading-relaxed">
            {isBiometricActive 
              ? `Use ${biometricLabel} or enter your 4-digit PIN` 
              : 'Enter your 4-digit security PIN to confirm'}
          </p>

          {/* Amount & Recipient Pill if provided */}
          {(amount || recipient?.name) && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/10 shadow-sm">
              <span className="material-symbols-outlined text-primary text-base">payments</span>
              <span className="text-xs text-white/70">Sending</span>
              <span className="text-sm font-black text-white">৳ {amount || '0'}</span>
              {recipient?.name && (
                <>
                  <span className="text-xs text-white/40">to</span>
                  <span className="text-xs font-bold text-primary truncate max-w-[120px]">{recipient.name}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Biometric Action Card (Augmenting PIN) */}
        {isBiometricActive && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowBiometricModal(true)}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/30 flex items-center justify-between transition-all group active:scale-[0.98] shadow-[0_0_20px_rgba(19,236,218,0.1)]"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">{biometricIcon}</span>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white text-xs font-black uppercase tracking-wider">
                      Verify with {biometricLabel}
                    </p>
                    <span className="size-1.5 rounded-full bg-primary animate-ping"></span>
                  </div>
                  <p className="text-white/50 text-[10px]">Instant 1-tap biometric release</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-lg group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        )}

        {/* PIN Input Dots */}
        <div className="flex justify-center gap-5 mb-5">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`size-12 rounded-full glass border-2 flex items-center justify-center transition-all ${
                pin.length === i ? 'border-primary glow-teal scale-105' : 'border-white/10'
              }`}
            >
              {pin[i] ? (
                <div className="size-3 bg-primary rounded-full animate-in zoom-in-50 duration-150 shadow-[0_0_10px_rgba(19,236,218,0.8)]"></div>
              ) : pin.length === i ? (
                <div className="w-1 h-5 bg-primary animate-pulse rounded-full"></div>
              ) : null}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 text-center animate-in fade-in slide-in-from-top-2">
             <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold tracking-wide">
               {error}
             </span>
          </div>
        )}

        {/* Sub-actions: Forgot PIN */}
        <div className="text-center mb-auto">
          <p className="text-[11px] text-white/40">
            Default Security PIN: <span className="text-primary font-mono font-bold">1234</span>
          </p>
        </div>

        {/* 3x4 Keypad with Biometric trigger button in slot (3,1) */}
        <div className="grid grid-cols-3 gap-y-3 gap-x-6 mb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button 
              key={num} 
              onClick={() => handleKeypress(num)} 
              disabled={isProcessing}
              className="h-14 flex items-center justify-center text-2xl font-semibold active:bg-white/10 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Bottom Left: Biometric trigger if active, or empty */}
          {isBiometricActive ? (
            <button 
              type="button"
              onClick={() => setShowBiometricModal(true)}
              disabled={isProcessing}
              className="h-14 flex flex-col items-center justify-center text-primary active:bg-primary/10 rounded-2xl transition-all active:scale-95 group border border-primary/20 bg-primary/5 hover:border-primary/40"
              title={`Verify with ${biometricLabel}`}
            >
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">
                {biometricIcon}
              </span>
              <span className="text-[8px] font-black uppercase tracking-tighter text-primary/80">
                {config.type === 'face' ? 'FaceID' : 'Bio'}
              </span>
            </button>
          ) : (
            <div className="h-14"></div>
          )}

          {/* Bottom Center: 0 */}
          <button 
            onClick={() => handleKeypress('0')} 
            disabled={isProcessing}
            className="h-14 flex items-center justify-center text-2xl font-semibold active:bg-white/10 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
          >
            0
          </button>

          {/* Bottom Right: Backspace */}
          <button 
            onClick={handleDelete} 
            disabled={isProcessing || pin.length === 0}
            className="h-14 flex items-center justify-center text-white/60 hover:text-white active:bg-white/10 rounded-2xl transition-all active:scale-95 disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-3xl">backspace</span>
          </button>
        </div>
      </div>

      <style>{`
        .glow-teal { box-shadow: 0 0 15px rgba(19, 236, 218, 0.35); }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); }
      `}</style>
    </div>
  );
};

export default PinVerification;
