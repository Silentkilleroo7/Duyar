import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setJustCameOnline(true);
      const timer = setTimeout(() => setJustCameOnline(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !justCameOnline) {
    return null;
  }

  if (justCameOnline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/90 text-white text-xs font-semibold shadow-xl backdrop-blur-md border border-emerald-400/40 animate-bounce">
        <span className="material-symbols-outlined text-[16px]">cloud_done</span>
        <span>Back Online &bull; Syncing real-time updates</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-[9999] flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#102220]/95 backdrop-blur-xl border border-amber-500/40 shadow-2xl text-white">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-2 rounded-full bg-amber-400 animate-ping shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-300 tracking-wide uppercase">Offline Mode Active</p>
          <p className="text-[11px] text-[#92c9c9] truncate">Browsing cached properties & shell. Sync will resume when online.</p>
        </div>
      </div>
      <a
        href="/offline.html"
        className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
      >
        Offline Info
      </a>
    </div>
  );
};

export default OfflineIndicator;
