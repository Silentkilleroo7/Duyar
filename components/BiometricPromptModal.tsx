import React, { useState, useEffect } from 'react';
import { 
  BiometricType, 
  getBiometricConfig, 
  saveBiometricConfig, 
  playBiometricSuccessEffect, 
  playBiometricErrorEffect 
} from '../biometrics';

interface Props {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  amount?: string;
  recipientName?: string;
  recipientAvatar?: string;
  mode?: 'transaction' | 'app_access' | 'test';
  onSuccess: () => void;
  onCancel: () => void;
  onFallbackToPin?: () => void;
}

export const BiometricPromptModal: React.FC<Props> = ({
  isOpen,
  title,
  subtitle,
  amount,
  recipientName,
  recipientAvatar,
  mode = 'transaction',
  onSuccess,
  onCancel,
  onFallbackToPin
}) => {
  const [config, setConfig] = useState(getBiometricConfig());
  const [activeType, setActiveType] = useState<BiometricType>(config.type);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('scanning');
  const [statusMessage, setStatusMessage] = useState('Verifying identity...');

  useEffect(() => {
    if (!isOpen) {
      setScanState('idle');
      return;
    }

    const currentConf = getBiometricConfig();
    setConfig(currentConf);
    setActiveType(currentConf.type);
    startScan(currentConf.type);
  }, [isOpen]);

  const startScan = (typeToUse: BiometricType) => {
    setScanState('scanning');
    setStatusMessage(
      typeToUse === 'face' 
        ? 'Scanning face geometry...' 
        : 'Touch sensor or hold to scan...'
    );

    // Realistic scanning duration simulation for tactile feedback
    const timer = setTimeout(() => {
      setScanState('success');
      setStatusMessage(
        typeToUse === 'face' ? 'FaceID Verified!' : 'Fingerprint Matched!'
      );
      playBiometricSuccessEffect();

      const completeTimer = setTimeout(() => {
        onSuccess();
      }, 550);

      return () => clearTimeout(completeTimer);
    }, 1100);

    return () => clearTimeout(timer);
  };

  const handleManualScanTrigger = () => {
    if (scanState === 'scanning' || scanState === 'success') return;
    startScan(activeType);
  };

  const toggleSensorType = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newType: BiometricType = activeType === 'face' ? 'fingerprint' : 'face';
    setActiveType(newType);
    saveBiometricConfig({ type: newType });
    startScan(newType);
  };

  if (!isOpen) return null;

  const displayTitle = title || (
    activeType === 'face' ? 'Face ID Verification' : 'Biometric Sensor'
  );

  const displaySubtitle = subtitle || (
    mode === 'app_access' 
      ? 'Authenticate to unlock Duyar Super App' 
      : mode === 'test' 
        ? 'Testing platform biometric sensor' 
        : 'Confirm secure transaction authorization'
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onCancel}
      />

      {/* Sheet / Modal Container */}
      <div className="relative w-full max-w-[420px] bg-[#0c1817] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 text-white shadow-[0_-10px_40px_rgba(0,0,0,0.8)] sm:shadow-2xl overflow-hidden z-10 animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Glowing background ambient lights */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/20 blur-[60px] pointer-events-none rounded-full" />
        
        {/* Drag handle for mobile sheet */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">
              {config.deviceName || 'Device Authenticator'}
            </span>
          </div>

          {/* Toggle button between FaceID and Fingerprint */}
          <button 
            type="button"
            onClick={toggleSensorType}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 font-semibold transition-colors active:scale-95"
            title="Switch biometric method"
          >
            <span className="material-symbols-outlined text-xs text-primary">
              {activeType === 'face' ? 'fingerprint' : 'face'}
            </span>
            <span>Switch to {activeType === 'face' ? 'Fingerprint' : 'FaceID'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-black tracking-tight text-white uppercase italic">
            {displayTitle}
          </h3>
          <p className="text-white/60 text-xs mt-1 leading-relaxed px-4">
            {displaySubtitle}
          </p>

          {/* Transaction Context Card if Amount & Recipient present */}
          {(amount || recipientName) && (
            <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                {recipientAvatar ? (
                  <img 
                    src={recipientAvatar} 
                    alt="Recipient" 
                    className="size-10 rounded-full object-cover border border-primary/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/50 font-medium">Authorizing Transfer</p>
                  <p className="text-sm font-bold text-white truncate max-w-[170px]">
                    {recipientName || 'Verified Recipient'}
                  </p>
                </div>
              </div>

              {amount && (
                <div className="text-right pl-2">
                  <p className="text-[10px] font-bold text-primary tracking-wider uppercase">Amount</p>
                  <p className="text-base font-black text-white">৳ {amount}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Biometric Sensor Animation Stage */}
        <div className="flex flex-col items-center justify-center my-6">
          <div 
            onClick={handleManualScanTrigger}
            className={`relative size-32 rounded-3xl flex items-center justify-center cursor-pointer transition-all duration-300 select-none ${
              scanState === 'success' 
                ? 'bg-emerald-500/10 border-2 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.35)] scale-105' 
                : scanState === 'scanning'
                  ? 'bg-primary/10 border-2 border-primary shadow-[0_0_30px_rgba(19,236,218,0.25)]'
                  : 'bg-white/5 border border-white/10 hover:border-primary/40'
            }`}
          >
            {/* Concentric pulsing rings when scanning */}
            {scanState === 'scanning' && (
              <>
                <div className="absolute inset-0 rounded-3xl border border-primary/40 animate-ping opacity-40 pointer-events-none" />
                <div className="absolute -inset-2 rounded-[2rem] border border-primary/20 animate-pulse pointer-events-none" />
                {/* Scanning laser bar */}
                <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(19,236,218,1)] animate-bounce pointer-events-none" />
              </>
            )}

            {/* Sensor Icon & Visual State */}
            {scanState === 'success' ? (
              <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
                <span className="material-symbols-outlined text-5xl text-emerald-400 font-bold">
                  check_circle
                </span>
              </div>
            ) : activeType === 'face' ? (
              <div className="relative flex flex-col items-center">
                <span className={`material-symbols-outlined text-6xl transition-colors ${scanState === 'scanning' ? 'text-primary' : 'text-white/60'}`}>
                  face
                </span>
                {scanState === 'scanning' && (
                  <span className="material-symbols-outlined absolute -top-1 -right-1 text-primary text-base animate-pulse">
                    verified_user
                  </span>
                )}
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                <span className={`material-symbols-outlined text-6xl transition-colors ${scanState === 'scanning' ? 'text-primary' : 'text-white/60'}`}>
                  fingerprint
                </span>
              </div>
            )}
          </div>

          {/* Status Text under sensor */}
          <div className="mt-4 flex items-center gap-2">
            {scanState === 'scanning' && (
              <span className="size-2 rounded-full bg-primary animate-ping" />
            )}
            <p className={`text-xs font-bold tracking-wide transition-colors ${
              scanState === 'success' ? 'text-emerald-400' : 'text-primary'
            }`}>
              {statusMessage}
            </p>
          </div>

          <p className="text-[11px] text-white/40 mt-1">
            {scanState === 'scanning' ? 'Tap sensor again if scan pauses' : 'Tap sensor to re-verify'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5 pt-2">
          {onFallbackToPin && (
            <button
              type="button"
              onClick={onFallbackToPin}
              className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-base text-primary">pin</span>
              <span>Use 4-Digit PIN Instead</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="w-full h-11 rounded-xl text-white/50 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
