import React, { useState } from 'react';
import { haptics } from '../haptics';

interface Props {
  onBack: () => void;
  onSelect: (user: any) => void;
}

const SendMoneySearch: React.FC<Props> = ({ onBack, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract any actual transaction contacts from stored history or provide direct phone routing
  const cleanPhone = searchTerm.trim().replace(/[^0-9+]/g, '');
  const isValidPhone = cleanPhone.length >= 10;

  const handleSelectCustomPhone = () => {
    if (!cleanPhone) return;
    haptics.selection();
    onSelect({
      name: `User ${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      image: ''
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark max-w-md mx-auto overflow-x-hidden font-display selection:bg-primary/30">
      <div className="flex items-center p-6 pb-2 z-10 justify-between">
        <button 
          type="button"
          onClick={onBack} 
          className="flex size-11 items-center justify-center rounded-full glass-card text-white hover:bg-white/10 active:scale-95 transition-all border border-white/10"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          Wallet Transfer
        </span>
      </div>

      <div className="px-6 pt-5 pb-2 z-10">
        <h1 className="text-white text-2xl font-black tracking-tight uppercase italic">
          SEND MONEY
        </h1>
        <p className="text-white/50 text-xs mt-1">
          Instant P2P transfers via phone number or registered Duyar wallet.
        </p>
      </div>

      {/* Search / Phone Input */}
      <div className="px-6 py-4 z-10">
        <div className="flex w-full h-14 items-center rounded-2xl glass-card overflow-hidden px-4 border border-white/10 focus-within:border-primary/60 transition-colors">
          <div className="text-primary flex items-center justify-center mr-2">
            <span className="material-symbols-outlined text-xl">search</span>
          </div>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:outline-none text-white placeholder:text-white/40 text-sm font-medium" 
            placeholder="Enter 11-digit Phone (017...)"
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-white/40 hover:text-white size-6 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Direct Phone Transfer Action Card */}
      {isValidPhone && (
        <div className="px-6 mb-4 z-10">
          <div 
            onClick={handleSelectCustomPhone}
            className="p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/[0.05] to-transparent border border-primary/50 flex items-center justify-between cursor-pointer hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(19,236,218,0.2)]"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl bg-primary text-black flex items-center justify-center font-black text-base shadow-md">
                <span className="material-symbols-outlined">send</span>
              </div>
              <div>
                <p className="text-white font-black text-sm uppercase">Send to {cleanPhone}</p>
                <p className="text-primary text-[10px] font-bold uppercase tracking-wider mt-0.5">Instant Wallet Route</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
          </div>
        </div>
      )}

      {/* Clean Verified Instructions / Info */}
      <div className="flex-1 px-6 py-4 z-10 overflow-y-auto space-y-3">
        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-base">verified_user</span>
            <span>Real-time Secure Transfer</span>
          </div>
          <p className="text-white/60 text-xs leading-relaxed">
            Funds are transferred directly and permanently to the recipient&apos;s verified Duyar account balance. Ensure phone numbers match the receiver&apos;s registered profile.
          </p>
        </div>

        <div className="p-4 rounded-2xl glass-card border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-white/80 text-xs font-black uppercase tracking-wider">
            <span className="material-symbols-outlined text-base text-amber-400">shield</span>
            <span>No Transaction Fee</span>
          </div>
          <p className="text-white/50 text-xs leading-relaxed">
            Resident-to-resident and resident-to-specialist in-app transfers carry zero commission.
          </p>
        </div>
      </div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default SendMoneySearch;
