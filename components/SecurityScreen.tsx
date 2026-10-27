import React, { useState, useEffect } from 'react';
import { 
  BiometricType, 
  BiometricConfig, 
  getBiometricConfig, 
  saveBiometricConfig, 
  getSecurityPin, 
  setSecurityPin,
  playBiometricSuccessEffect,
  playBiometricErrorEffect
} from '../biometrics';
import { BiometricPromptModal } from './BiometricPromptModal';

interface Props {
  onBack: () => void;
}

const SecurityScreen: React.FC<Props> = ({ onBack }) => {
  const [config, setConfig] = useState<BiometricConfig>(getBiometricConfig());
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Security PIN state
  const [currentPin, setCurrentPin] = useState(getSecurityPin());
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  useEffect(() => {
    setConfig(getBiometricConfig());
    setCurrentPin(getSecurityPin());
  }, []);

  const handleToggleMasterBiometrics = () => {
    const updated = saveBiometricConfig({ enabled: !config.enabled });
    setConfig(updated);
    playBiometricSuccessEffect();
  };

  const handleChangeType = (type: BiometricType) => {
    const updated = saveBiometricConfig({ type });
    setConfig(updated);
    playBiometricSuccessEffect();
  };

  const handleToggleAppAccess = () => {
    const updated = saveBiometricConfig({ forAppAccess: !config.forAppAccess });
    setConfig(updated);
  };

  const handleToggleTransactions = () => {
    const updated = saveBiometricConfig({ forTransactions: !config.forTransactions });
    setConfig(updated);
  };

  const handleToggleAutoPrompt = () => {
    const updated = saveBiometricConfig({ autoPromptTransactions: !config.autoPromptTransactions });
    setConfig(updated);
  };

  const handleTestSensor = () => {
    setTestResult(null);
    setIsTestModalOpen(true);
  };

  const handleTestSuccess = () => {
    setIsTestModalOpen(false);
    setTestResult('Biometric sensor verified successfully! Platform authenticator is fully operational.');
    playBiometricSuccessEffect();
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      playBiometricErrorEffect();
      setPinMessage('PIN must be exactly 4 digits');
      return;
    }

    const success = setSecurityPin(newPin);
    if (success) {
      setCurrentPin(newPin);
      setIsChangingPin(false);
      setNewPin('');
      setPinMessage('Security PIN updated successfully!');
      playBiometricSuccessEffect();
      setTimeout(() => setPinMessage(null), 3000);
    }
  };

  const biometricLabel = config.type === 'face' ? 'Face ID' : 'Touch ID / Fingerprint';
  const biometricIcon = config.type === 'face' ? 'face' : 'fingerprint';

  return (
    <div className="relative min-h-screen bg-background-dark font-display text-white overflow-y-auto no-scrollbar">
      <div className="absolute inset-0 map-overlay opacity-5 pointer-events-none"></div>

      {/* Sensor Test Modal */}
      <BiometricPromptModal
        isOpen={isTestModalOpen}
        mode="test"
        title={`Testing ${biometricLabel}`}
        subtitle="Verifying hardware sensor alignment and encryption"
        onSuccess={handleTestSuccess}
        onCancel={() => setIsTestModalOpen(false)}
      />

      <main className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto px-4 pt-10 pb-16">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack} 
            className="flex items-center justify-center size-11 rounded-full glass-card hover:bg-primary/20 transition-all border border-white/10 active:scale-95 shadow-lg"
          >
            <span className="material-symbols-outlined text-white text-sm">arrow_back_ios_new</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="size-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Biometric Vault
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="mb-6">
          <h3 className="text-primary tracking-[0.2em] text-[11px] font-black uppercase mb-1 italic">
            Security & Authentication
          </h3>
          <h1 className="text-white tracking-tight text-2xl font-black uppercase italic leading-tight">
            BIOMETRIC ACCESS & PIN
          </h1>
          <p className="text-white/60 text-xs mt-1 leading-relaxed">
            Configure FaceID, Fingerprint, and fallback PIN verification for app unlock and instant transaction release.
          </p>
        </div>

        {/* Test Result Feedback Banner */}
        {testResult && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 animate-in fade-in duration-300">
            <span className="material-symbols-outlined text-emerald-400 text-xl shrink-0 mt-0.5">
              check_circle
            </span>
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Hardware Check Passed</p>
              <p className="text-[11px] text-white/80 mt-0.5">{testResult}</p>
            </div>
          </div>
        )}

        {/* MASTER BIOMETRICS CARD */}
        <div className="glass-card p-5 rounded-[2rem] border border-primary/30 shadow-[0_0_30px_rgba(19,236,218,0.1)] mb-5 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className="size-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-inner">
                <span className="material-symbols-outlined text-3xl">{biometricIcon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-black text-base uppercase italic tracking-tight">
                    Biometric Authentication
                  </h3>
                </div>
                <p className="text-white/50 text-xs">
                  {config.enabled ? 'Enabled and operational' : 'Disabled'}
                </p>
              </div>
            </div>

            {/* Main Switch */}
            <label className="relative flex h-[31px] w-[54px] cursor-pointer items-center rounded-full bg-white/10 p-0.5 transition-colors has-[:checked]:bg-primary">
              <input 
                checked={config.enabled} 
                className="invisible absolute peer" 
                type="checkbox" 
                onChange={handleToggleMasterBiometrics} 
              />
              <div className="h-full w-[27px] rounded-full bg-white shadow-xl transform transition-transform duration-200 peer-checked:translate-x-[23px]"></div>
            </label>
          </div>

          {/* Mode Selector (FaceID vs Fingerprint) */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-2.5">
              Select Biometric Sensor Type
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleChangeType('face')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  config.type === 'face'
                    ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(19,236,218,0.2)] font-bold'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-primary text-xl">face</span>
                <div>
                  <p className="text-xs font-bold leading-tight">Face ID</p>
                  <p className="text-[9px] text-white/40">Facial geometry</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleChangeType('fingerprint')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                  config.type === 'fingerprint'
                    ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(19,236,218,0.2)] font-bold'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-primary text-xl">fingerprint</span>
                <div>
                  <p className="text-xs font-bold leading-tight">Touch ID</p>
                  <p className="text-[9px] text-white/40">Fingerprint sensor</p>
                </div>
              </button>
            </div>
          </div>

          {/* Test Sensor Action Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleTestSensor}
              className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-primary/30 hover:border-primary text-primary font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-lg">sensors</span>
              <span>Test {biometricLabel} Sensor</span>
            </button>
          </div>
        </div>

        {/* SCOPE & USAGE POLICIES */}
        <div className="mb-5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-3 ml-2 italic">
            Protection Scope
          </p>

          <div className="space-y-2.5">
            {/* App Access Lock */}
            <div className="flex items-center gap-4 glass-card p-4 rounded-2xl justify-between border border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-11 border border-primary/20">
                  <span className="material-symbols-outlined text-2xl">lock_open</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">App Access & Quick Unlock</p>
                  <p className="text-white/50 text-[11px] mt-0.5">Unlock Duyar using {biometricLabel}</p>
                </div>
              </div>
              <label className="relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full bg-white/10 p-0.5 transition-colors has-[:checked]:bg-primary">
                <input 
                  checked={config.enabled && config.forAppAccess} 
                  disabled={!config.enabled}
                  className="invisible absolute peer" 
                  type="checkbox" 
                  onChange={handleToggleAppAccess} 
                />
                <div className="h-full w-[24px] rounded-full bg-white shadow-xl transform transition-transform duration-200 peer-checked:translate-x-[20px]"></div>
              </label>
            </div>

            {/* Secure Transactions Authorization */}
            <div className="flex items-center gap-4 glass-card p-4 rounded-2xl justify-between border border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-11 border border-primary/20">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">Secure Transactions</p>
                  <p className="text-white/50 text-[11px] mt-0.5">Authorize transfers & wallet payments</p>
                </div>
              </div>
              <label className="relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full bg-white/10 p-0.5 transition-colors has-[:checked]:bg-primary">
                <input 
                  checked={config.enabled && config.forTransactions} 
                  disabled={!config.enabled}
                  className="invisible absolute peer" 
                  type="checkbox" 
                  onChange={handleToggleTransactions} 
                />
                <div className="h-full w-[24px] rounded-full bg-white shadow-xl transform transition-transform duration-200 peer-checked:translate-x-[20px]"></div>
              </label>
            </div>

            {/* Auto-Prompt Biometrics on Transaction screens */}
            <div className="flex items-center gap-4 glass-card p-4 rounded-2xl justify-between border border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-11 border border-primary/20">
                  <span className="material-symbols-outlined text-2xl">bolt</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">Auto-Prompt Sensor</p>
                  <p className="text-white/50 text-[11px] mt-0.5">Prompt biometrics automatically on payment</p>
                </div>
              </div>
              <label className="relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full bg-white/10 p-0.5 transition-colors has-[:checked]:bg-primary">
                <input 
                  checked={config.enabled && config.autoPromptTransactions} 
                  disabled={!config.enabled}
                  className="invisible absolute peer" 
                  type="checkbox" 
                  onChange={handleToggleAutoPrompt} 
                />
                <div className="h-full w-[24px] rounded-full bg-white shadow-xl transform transition-transform duration-200 peer-checked:translate-x-[20px]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* SECURITY PIN MANAGEMENT (Fallback / Augment) */}
        <div className="mb-5">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-3 ml-2 italic">
            Fallback Security PIN
          </p>

          <div className="glass-card p-4 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-11 border border-primary/20">
                  <span className="material-symbols-outlined text-2xl">pin</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">4-Digit Security PIN</p>
                  <p className="text-white/50 text-[11px] mt-0.5">
                    Current PIN: <span className="font-mono font-bold text-primary">{currentPin}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-primary text-xs font-bold transition-colors border border-primary/20"
              >
                {isChangingPin ? 'Cancel' : 'Change PIN'}
              </button>
            </div>

            {pinMessage && (
              <p className="text-xs text-primary font-semibold mb-3 px-1">{pinMessage}</p>
            )}

            {isChangingPin && (
              <form onSubmit={handleSavePin} className="pt-3 border-t border-white/10 space-y-3">
                <p className="text-[11px] text-white/60">Enter new 4-digit PIN:</p>
                <div className="flex items-center gap-3">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-28 h-11 bg-white/5 border border-white/20 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:border-primary focus:ring-0 outline-none"
                  />
                  <button
                    type="submit"
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 text-background-dark font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                  >
                    Save PIN
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* 2FA & DEVICE SECURITY STATUS */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mb-3 ml-2 italic">
            Device Credentials
          </p>

          <div className="space-y-2.5">
            {/* 2FA Card */}
            <div className="flex items-center gap-4 glass-card p-4 rounded-2xl justify-between border border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="text-primary flex items-center justify-center rounded-xl bg-primary/10 shrink-0 size-11 border border-primary/20">
                  <span className="material-symbols-outlined text-2xl">shield_lock</span>
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-tight">Two-Factor Authentication</p>
                  <p className="text-white/50 text-[11px] mt-0.5">Biometric + SMS Fallback</p>
                </div>
              </div>
              <label className="relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full bg-white/10 p-0.5 transition-colors has-[:checked]:bg-primary">
                <input 
                  checked={twoFactorEnabled} 
                  className="invisible absolute peer" 
                  type="checkbox" 
                  onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} 
                />
                <div className="h-full w-[24px] rounded-full bg-white shadow-xl transform transition-transform duration-200 peer-checked:translate-x-[20px]"></div>
              </label>
            </div>

            {/* Authenticator Hardware Details */}
            <div className="glass-card p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Authenticator Model</span>
                <span className="font-bold text-white">{config.deviceName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Security Standard</span>
                <span className="font-bold text-primary">WebAuthn / FIDO2</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50">Hardware Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active & Enrolled
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STANDALONE ADMIN WEB DASHBOARD LAUNCHER */}
        <div className="mb-6">
          <div className="p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-emerald-500/10 to-transparent border border-primary/30 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                  <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                </div>
                <div>
                  <h4 className="text-white font-black text-xs uppercase tracking-tight">Admin Web Dashboard</h4>
                  <p className="text-[10px] text-primary font-bold">Autonomous Control Desk</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/20 text-primary border border-primary/30">
                Web Portal
              </span>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed">
              Launch the standalone desktop & tablet control dashboard to review provider approvals, live service dispatch tracking, and clear manual wallet deposits & withdrawals.
            </p>

            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('duyar_admin_portal_active', 'true');
                  const u = new URL(window.location.href);
                  u.searchParams.set('admin', 'true');
                  window.location.href = u.pathname + u.search;
                } catch (_) {
                  window.location.search = '?admin=true';
                }
              }}
              className="w-full h-12 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(19,236,218,0.4)] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base font-black">open_in_browser</span>
              <span>Launch Admin Web Portal</span>
            </button>
          </div>
        </div>

        {/* Bottom Support Note */}
        <div className="mt-auto text-center pt-2">
          <p className="text-white/40 text-xs">
            Duyar biometric keys are encrypted locally inside your device's Secure Enclave.
          </p>
        </div>
      </main>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default SecurityScreen;
