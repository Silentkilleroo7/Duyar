
import React from 'react';
// Import Property type for the property prop
import { Property } from '../types';

interface Props {
  onHome: () => void;
  onTrack: () => void;
  // Added property prop to fix type error in App.tsx
  property?: Property | null;
}

const VisitScheduledSuccess: React.FC<Props> = ({ onHome, onTrack, property }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark overflow-hidden font-display">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-center bg-no-repeat bg-cover" style={{backgroundImage: "url('')"}}></div>
      </div>
      
      <div className="relative z-10 flex flex-col h-full px-6 pt-20 pb-10 items-center justify-center flex-1">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-24 h-24 bg-primary/20 rounded-full animate-pulse"></div>
            <div className="relative w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(19,236,218,0.3)]">
              <span className="material-symbols-outlined text-background-dark text-4xl font-bold">check</span>
            </div>
          </div>
          <h1 className="text-white text-[32px] font-extrabold leading-tight tracking-tight mb-4">Visit Scheduled!</h1>
          <p className="text-[#92c9c9] text-base font-normal leading-relaxed px-4 mb-10">
            Your request to visit the property has been sent to the landlord. You will receive a confirmation shortly.
          </p>
        </div>

        <div className="glass-card rounded-xl p-5 mb-10 w-full border border-white/10 bg-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-cover bg-center" style={{backgroundImage: `url("${property?.image || ''}")`}}></div>
            <div>
              <p className="text-[#92c9c9] text-xs font-semibold uppercase tracking-widest mb-1">Property</p>
              <p className="text-white text-lg font-bold leading-tight">{property?.title || 'Modern 3BHK Luxury Flat'}</p>
            </div>
          </div>
          <div className="h-[1px] bg-white/10 w-full mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                <p className="text-xs font-semibold uppercase tracking-wider">Date</p>
              </div>
              <p className="text-white text-base font-medium">Oct 25, 2023</p>
            </div>
            <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <p className="text-xs font-semibold uppercase tracking-wider">Time</p>
              </div>
              <p className="text-white text-base font-medium">10:30 AM</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full gap-4">
          <button onClick={onTrack} className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-full transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
            VIEW MY VISITS
          </button>
          <button onClick={onHome} className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-4 rounded-full border border-white/10 transition-all backdrop-blur-sm uppercase tracking-widest">
            BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitScheduledSuccess;
