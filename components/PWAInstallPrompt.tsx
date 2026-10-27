import React, { useState, useEffect } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { haptics } from '../haptics';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('duyar_pwa_dismissed');
    if (isDismissed) {
      setDismissed(true);
    }

    // Listen for custom open requests from anywhere in the app
    const handleForceOpen = () => {
      setDismissed(false);
      if (isIOS) {
        setShowIOSGuide(true);
      } else if (isInstallable) {
        install();
      } else {
        setShowDesktopGuide(true);
      }
    };

    window.addEventListener('duyar_open_install_prompt', handleForceOpen);
    return () => {
      window.removeEventListener('duyar_open_install_prompt', handleForceOpen);
    };
  }, [isInstallable, isIOS, install]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('duyar_pwa_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    try {
      haptics.selection();
    } catch {}

    if (isInstallable) {
      const res = await install();
      if (!res) {
        setShowDesktopGuide(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  // If already running as an installed PWA or dismissed, don't show the top banner
  if (isInstalled || dismissed) {
    return (
      <>
        {/* iOS Guide Modal */}
        {showIOSGuide && (
          <div 
            id="pwa-ios-install-modal" 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          >
            <div className="w-full max-w-sm rounded-[2rem] bg-[#0a1211] border border-primary/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/pwa-192x192.png" 
                  alt="Duyar" 
                  className="size-12 rounded-2xl border border-primary/40 object-cover shadow-[0_0_20px_rgba(19,236,218,0.3)]" 
                />
                <div>
                  <h3 className="text-base font-black italic uppercase text-white tracking-tight">Install Duyar App</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Fast, native experience & always online</p>
                </div>
              </div>

              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/80 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                  <span>Tap the <strong className="text-white">Share</strong> button in Safari's bottom toolbar (<span className="material-symbols-outlined text-xs align-middle">ios_share</span>).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                  <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong> (<span className="material-symbols-outlined text-xs align-middle">add_box</span>).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                  <span>Tap <strong className="text-white">Add</strong> in the top-right corner to finish.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 rounded-xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Desktop / Browser Guide Modal */}
        {showDesktopGuide && (
          <div 
            id="pwa-desktop-install-modal" 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
          >
            <div className="w-full max-w-sm rounded-[2rem] bg-[#0a1211] border border-primary/40 p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/pwa-192x192.png" 
                  alt="Duyar" 
                  className="size-12 rounded-2xl border border-primary/40 object-cover shadow-[0_0_20px_rgba(19,236,218,0.3)]" 
                />
                <div>
                  <h3 className="text-base font-black italic uppercase text-white tracking-tight">Install Duyar App</h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Fast, native experience & always online</p>
                </div>
              </div>

              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/80 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                  <span>Look for the <strong className="text-white">Install</strong> icon (<span className="material-symbols-outlined text-xs align-middle">download</span> or ⊕) in your browser address bar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                  <span>Or open browser menu (⋮) and select <strong className="text-white">Install Duyar App</strong> / <strong className="text-white">Add to Home Screen</strong>.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDesktopGuide(false)}
                className="w-full py-3 rounded-xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div 
        id="pwa-install-banner"
        className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-[420px] bg-[#0a1211]/95 backdrop-blur-2xl border border-primary/40 p-2.5 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-3 duration-300"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <img 
              src="/pwa-192x192.png" 
              alt="Duyar App" 
              className="size-9 rounded-xl border border-primary/40 object-cover shadow-[0_0_15px_rgba(19,236,218,0.3)] shrink-0" 
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white tracking-wide truncate">Install Duyar App</span>
                <span className="size-1.5 rounded-full bg-primary animate-pulse shrink-0"></span>
              </div>
              <span className="text-[10px] text-white/60 truncate">
                Fast, native experience & always online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="pwa-install-action-btn"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-xl bg-primary text-background-dark font-black text-xs shadow-[0_0_15px_rgba(19,236,218,0.4)] active:scale-95 transition-transform flex items-center gap-1 hover:brightness-110 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[15px] font-black">
                {isIOS ? 'ios_share' : 'download'}
              </span>
              Install
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              title="Dismiss install prompt"
              className="size-7 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instruction Modal */}
      {showIOSGuide && (
        <div 
          id="pwa-ios-install-modal" 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-[2rem] bg-[#0a1211] border border-primary/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/pwa-192x192.png" 
                alt="Duyar" 
                className="size-12 rounded-2xl border border-primary/40 object-cover shadow-[0_0_20px_rgba(19,236,218,0.3)]" 
              />
              <div>
                <h3 className="text-base font-black italic uppercase text-white tracking-tight">Install Duyar App</h3>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Fast, native experience & always online</p>
              </div>
            </div>

            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/80 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                <span>Tap the <strong className="text-white">Share</strong> button in Safari's bottom toolbar (<span className="material-symbols-outlined text-xs align-middle">ios_share</span>).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                <span>Scroll down and tap <strong className="text-white">Add to Home Screen</strong> (<span className="material-symbols-outlined text-xs align-middle">add_box</span>).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">3</span>
                <span>Tap <strong className="text-white">Add</strong> in the top-right corner to finish.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 rounded-xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Browser Guide Modal */}
      {showDesktopGuide && (
        <div 
          id="pwa-desktop-install-modal" 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-[2rem] bg-[#0a1211] border border-primary/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/pwa-192x192.png" 
                alt="Duyar" 
                className="size-12 rounded-2xl border border-primary/40 object-cover shadow-[0_0_20px_rgba(19,236,218,0.3)]" 
              />
              <div>
                <h3 className="text-base font-black italic uppercase text-white tracking-tight">Install Duyar App</h3>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Fast, native experience & always online</p>
              </div>
            </div>

            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/80 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">1</span>
                <span>Look for the <strong className="text-white">Install</strong> icon (<span className="material-symbols-outlined text-xs align-middle">download</span> or ⊕) in your browser address bar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="size-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[11px]">2</span>
                <span>Or open browser menu (⋮) and select <strong className="text-white">Install Duyar App</strong> / <strong className="text-white">Add to Home Screen</strong>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="w-full py-3 rounded-xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
