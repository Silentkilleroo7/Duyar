
import React from 'react';
// Import Property type for the property prop
import { Property } from '../types';

interface Props {
  onBack: () => void;
  onStartVisit: () => void;
  // Added property prop to fix type error in App.tsx
  property?: Property | null;
}

const PropertyArrivalView: React.FC<Props> = ({ onBack, onStartVisit, property }) => {
  const handleCallOwner = () => {
    window.location.href = 'tel:+8801700000000';
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto shadow-2xl font-display bg-background-dark">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-cover bg-center grayscale opacity-60" style={{backgroundImage: "url('')"}}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-background-dark/40 to-background-dark/95"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full px-6 pt-16 pb-12">
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 shadow-[0_0_30px_rgba(19,236,218,0.3)]">
            <span className="material-symbols-outlined text-primary text-5xl" style={{fontVariationSettings: "'FILL' 1"}}>home_pin</span>
          </div>
          <h1 className="text-white text-[32px] font-bold tracking-tight leading-tight">You Have Arrived!</h1>
          <div className="mt-4">
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/20 px-4 border border-primary/30">
              <span className="material-symbols-outlined text-primary text-base">schedule</span>
              <p className="text-primary text-sm font-semibold leading-normal">Scheduled: 10:30 AM</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="glass-card flex items-center gap-4 rounded-xl p-4 shadow-xl border border-white/10 bg-white/5">
            <div className="h-20 w-20 shrink-0 bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden border border-white/10" style={{backgroundImage: `url("${property?.image || ''}")`}}></div>
            <div className="flex flex-col gap-1 overflow-hidden">
              <p className="text-white text-lg font-bold leading-tight truncate">{property?.title || 'Modern 3BHK Luxury Flat'}</p>
              <p className="text-[#92c9c9] text-sm font-normal leading-tight">{property?.location || 'Banani Block D, Dhaka'}</p>
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={handleCallOwner}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-transform text-background-dark"
            >
              <span className="material-symbols-outlined font-bold text-2xl">call</span>
            </button>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Call Owner</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-transform text-background-dark">
              <span className="material-symbols-outlined font-bold text-2xl">chat_bubble</span>
            </button>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Message</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-transform text-background-dark">
              <span className="material-symbols-outlined font-bold text-2xl">my_location</span>
            </button>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Directions</p>
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={onStartVisit}
            className="w-full bg-primary hover:bg-[#10d4d4] text-background-dark text-lg font-bold py-4 rounded-xl shadow-[0_8px_30px_rgba(19,236,218,0.3)] transition-all active:scale-[0.98] uppercase tracking-widest"
          >
            START VISIT
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyArrivalView;
