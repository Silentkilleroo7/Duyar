
import React from 'react';
// Import Property type for the property prop
import { Property } from '../types';

interface Props {
  onHome: () => void;
  // Added property prop to fix type error in App.tsx
  property?: Property | null;
}

const RentalSuccess: React.FC<Props> = ({ onHome, property }) => {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 map-overlay opacity-10 pointer-events-none"></div>
      
      <div className="relative mb-12 flex items-center justify-center">
        <div className="absolute size-32 bg-primary/20 rounded-full animate-pulse blur-2xl"></div>
        <div className="relative size-24 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(19,236,218,0.5)]">
          <span className="material-symbols-outlined text-background-dark text-5xl font-black">check</span>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-white text-center mb-4 tracking-tight">Application Sent!</h1>
      <p className="text-white/60 text-center text-base max-w-xs leading-relaxed mb-12">
        Your rental application has been successfully submitted to the landlord. Expect a response within 48 hours.
      </p>

      <div className="w-full max-w-sm glass-card rounded-2xl p-6 mb-12">
        <div className="flex justify-between items-center mb-4">
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Ref ID</p>
          <p className="text-white text-sm font-bold">#RA-55291</p>
        </div>
        <div className="h-px bg-white/5 w-full mb-4"></div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">location_on</span>
          <div>
            <p className="text-white/40 text-[10px] font-bold uppercase">Property</p>
            <p className="text-white text-sm font-semibold">{property?.title || 'Modern 3BHK Luxury Flat'}</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <button onClick={onHome} className="w-full h-16 bg-primary text-background-dark font-black rounded-2xl tracking-widest uppercase transition-all active:scale-95 shadow-lg shadow-primary/20">
          BACK TO HOME
        </button>
        <button className="w-full h-16 border border-white/10 glass text-white font-bold rounded-2xl tracking-widest uppercase">
          TRACK APPLICATIONS
        </button>
      </div>
    </div>
  );
};

export default RentalSuccess;
