
import React from 'react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const RentalStep1: React.FC<Props> = ({ onNext, onBack }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white px-6 pt-12 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="size-11 rounded-full glass flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <p className="text-primary font-bold text-sm tracking-widest uppercase">Step 1 of 3</p>
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">RENTAL INFO</h1>
      <p className="text-white/50 text-sm mb-10">Fill in your personal details to start.</p>

      <div className="space-y-6 flex-1">
        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-xs font-bold uppercase tracking-wider ml-1">Full Name</label>
          <input className="w-full h-14 rounded-2xl glass-card border-white/10 focus:border-primary px-5 text-white outline-none" placeholder="e.g. Ariful Islam" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-xs font-bold uppercase tracking-wider ml-1">Current Address</label>
          <input className="w-full h-14 rounded-2xl glass-card border-white/10 focus:border-primary px-5 text-white outline-none" placeholder="Street, Area, City" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-white/70 text-xs font-bold uppercase tracking-wider ml-1">Monthly Income</label>
          <div className="relative">
            <input className="w-full h-14 rounded-2xl glass-card border-white/10 focus:border-primary pl-10 px-5 text-white outline-none" placeholder="0.00" type="number" />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">৳</span>
          </div>
        </div>
      </div>

      <div className="py-10">
        <button onClick={onNext} className="w-full bg-primary text-background-dark font-black h-16 rounded-2xl shadow-lg shadow-primary/30 tracking-widest flex items-center justify-center gap-2">
          NEXT: VERIFICATION <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default RentalStep1;
