import React, { useState, useEffect } from 'react';
import { getActivePickDropRequest, DEFAULT_PICKDROP_REQUEST, PickDropRequest } from '../pickDropStorage';

interface Props {
  onHome: () => void;
  onTrack: () => void;
}

const PickDropSuccess: React.FC<Props> = ({ onHome, onTrack }) => {
  const [request, setRequest] = useState<PickDropRequest | null>(null);

  useEffect(() => {
    setRequest(getActivePickDropRequest() || DEFAULT_PICKDROP_REQUEST);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-6 overflow-hidden bg-background-dark font-display max-w-[430px] mx-auto">
      {/* Subtle Map Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-center bg-no-repeat bg-cover opacity-20 grayscale contrast-125" style={{backgroundImage: "url('')"}}></div>
        <div className="absolute inset-0 map-overlay"></div>
      </div>

      <div className="relative z-10 w-full flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500 py-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="relative flex items-center justify-center w-20 h-20 bg-primary rounded-full shadow-[0_0_40px_rgba(19,236,218,0.4)] border-4 border-background-dark">
            <span className="material-symbols-outlined text-background-dark text-5xl font-black">check</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-white tracking-tight text-2xl font-black leading-tight px-4 uppercase italic">
            Pick & <span className="text-primary">Drop Requested!</span>
          </h1>
          <p className="text-white/60 text-xs font-medium leading-relaxed px-4">
            Driver {request?.driverName || 'Assigned Logistics Pilot'} has been dispatched with item move details.
          </p>
        </div>

        <div className="w-full">
          <div className="glass rounded-[2rem] p-5 flex flex-col space-y-4 border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Tracking Number</p>
                <p className="text-white text-lg font-black">#{request?.id || 'PD-8821'}</p>
              </div>
              <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                <p className="text-primary text-[10px] font-black uppercase tracking-widest">
                  {request?.vehicle || 'MINI TRUCK'}
                </p>
              </div>
            </div>

            {/* Route */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-base mt-0.5">location_on</span>
                <div className="flex flex-col">
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Pickup Point</p>
                  <p className="text-white text-sm font-bold tracking-tight">{request?.pickupArea || 'Banani Block D, Dhaka'}</p>
                  <p className="text-white/50 text-[10px]">{request?.pickupAddress || 'House 12, Road 4'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-white/50 text-base mt-0.5">trip_origin</span>
                <div className="flex flex-col">
                  <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Destination</p>
                  <p className="text-white text-sm font-bold tracking-tight">{request?.dropArea || 'Uttara Sector 4, Dhaka'}</p>
                  <p className="text-white/50 text-[10px]">{request?.dropAddress || 'House 18, Road 7'}</p>
                </div>
              </div>
            </div>

            {/* Moving Item Details (Sent to Driver) */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">description</span>
                  Item Details Sent to Driver
                </span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                  Transmitted
                </span>
              </div>
              
              <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                <p className="text-xs text-white/90 italic font-medium leading-relaxed">
                  "{request?.itemDetails || 'Standard household items for moving.'}"
                </p>
              </div>

              {/* Special tags & floor info */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {request?.specialNotes?.map(tag => (
                  <span key={tag} className="bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 rounded border border-primary/30">
                    ⚡ {tag}
                  </span>
                ))}
                {request?.pickupFloor && (
                  <span className="bg-white/10 text-white/80 text-[9px] font-bold px-2 py-0.5 rounded">
                    🏢 {request.pickupFloor} ➔ {request.dropFloor}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col space-y-3 pt-2">
          <button 
            type="button"
            onClick={onTrack} 
            className="w-full bg-primary py-4 rounded-2xl font-black text-background-dark uppercase tracking-[0.2em] text-xs shadow-[0_15px_30px_rgba(19,236,218,0.25)] hover:opacity-90 active:scale-95 transition-all"
          >
            Track Shipment Live
          </button>
          <button 
            type="button"
            onClick={onHome} 
            className="w-full glass border border-white/10 py-4 rounded-2xl font-black text-white/70 uppercase tracking-[0.2em] text-xs hover:bg-white/5 active:scale-95 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>

      <style>{`
        .glass {
          background: rgba(25, 51, 51, 0.4);
          backdrop-filter: blur(12px);
        }
        .map-overlay {
          background: linear-gradient(to bottom, rgba(10, 18, 17, 0.85), rgba(10, 18, 17, 0.98));
        }
      `}</style>
    </div>
  );
};

export default PickDropSuccess;
