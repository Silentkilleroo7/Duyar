import React from 'react';
import ProviderAvatar from '../ProviderAvatar';

interface Props {
  onBack: () => void;
  onSupport: () => void;
}

const AdminLiveTracking: React.FC<Props> = ({ onBack, onSupport }) => {
  return (
    <div className="relative flex h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-hidden border-x border-white/5 shadow-2xl">
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 w-full z-20 px-4 pt-12 pb-6 bg-gradient-to-b from-background-dark/95 via-background-dark/60 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full glass-panel text-white active:scale-90 transition-all border border-white/10">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </button>
            <div>
              <h2 className="text-white text-lg font-black leading-tight tracking-tight italic uppercase italic">#DY-8821</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(19,236,218,0.8)]"></span>
                <span className="text-primary text-[9px] font-black uppercase tracking-[0.2em] italic">Active Connection</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex size-11 items-center justify-center rounded-full glass-panel text-white active:scale-90 transition-all border border-white/10">
              <span className="material-symbols-outlined text-primary">center_focus_strong</span>
            </button>
            <button className="flex size-11 items-center justify-center rounded-full glass-panel text-white active:scale-90 transition-all border border-white/10">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Map Area */}
      <div className="relative flex-1 w-full bg-[#0a1514]">
        <div className="absolute inset-0 bg-cover bg-center opacity-60 brightness-50 contrast-125" style={{backgroundImage: 'url("")'}}></div>
        
        {/* Map Overlay Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          <button className="flex size-12 items-center justify-center rounded-2xl glass-panel text-primary shadow-[0_0_15px_rgba(19,236,218,0.2)] border border-primary/20 active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black">add</span>
          </button>
          <button className="flex size-12 items-center justify-center rounded-2xl glass-panel text-white active:scale-90 transition-all border border-white/5">
            <span className="material-symbols-outlined font-black">remove</span>
          </button>
          <button className="flex size-12 mt-4 items-center justify-center rounded-2xl glass-panel text-white active:scale-90 transition-all border border-white/5">
            <span className="material-symbols-outlined font-black">my_location</span>
          </button>
        </div>

        {/* Animated Provider Marker */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 size-16 bg-primary/20 rounded-full animate-ping opacity-40 blur-xl"></div>
            <div className="size-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(19,236,218,0.6)] border-4 border-background-dark relative z-10 transition-transform animate-bounce">
              <span className="material-symbols-outlined text-background-dark font-black text-4xl">local_shipping</span>
            </div>
          </div>
          <div className="mt-3 glass-panel px-4 py-1.5 rounded-full border border-primary/40 backdrop-blur-xl">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Field Specialist</span>
          </div>
        </div>
      </div>

      {/* Bottom Vitals Sheet */}
      <div className="absolute bottom-0 left-0 w-full z-30">
        <div className="flex flex-col items-stretch glass-panel rounded-t-[3rem] border-t border-white/10 overflow-hidden pb-12 bg-[#102220]/95 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex h-8 w-full items-center justify-center">
            <div className="h-1 w-12 rounded-full bg-white/10"></div>
          </div>

          <div className="flex px-8 py-4 items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <ProviderAvatar 
                name="Dispatched Specialist"
                category="Maintenance"
                size="lg"
                isOnline={true}
                showOnlineDot={true}
              />
              <div>
                <p className="text-white text-xl font-black italic tracking-tighter leading-tight uppercase">Dispatched Specialist</p>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Specialist ID: #99021</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[9px] uppercase font-black tracking-widest italic">Current Status</p>
              <p className="text-primary font-black text-sm uppercase italic">Moving • 45 km/h</p>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-3 gap-0.5 bg-white/5 px-4 py-6 border-b border-white/5">
            <div className="flex flex-col items-center justify-center p-3">
              <span className="material-symbols-outlined text-primary mb-2 text-2xl font-black">speed</span>
              <p className="text-white text-base font-black italic">45 <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest not-italic">km/h</span></p>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mt-1 italic">Vessel Speed</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 border-x border-white/10">
              <span className="material-symbols-outlined text-primary mb-2 text-2xl font-black">battery_charging_80</span>
              <p className="text-white text-base font-black italic">82%</p>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mt-1 italic">Battery Log</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <span className="material-symbols-outlined text-primary mb-2 text-2xl font-black">signal_cellular_alt</span>
              <p className="text-white text-base font-black italic uppercase">Excellent</p>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mt-1 italic">Signal Strength</p>
            </div>
          </div>

          {/* Customer / Destination Info */}
          <div className="px-8 py-6">
             <div className="flex justify-between items-end mb-4 px-1">
                <div className="flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                   <p className="text-xs font-black uppercase italic tracking-widest">En Route to Uttara</p>
                </div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Job Progress: 65%</p>
             </div>
             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-8 border border-white/5">
                <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(19,236,218,0.5)]" style={{width: '65%'}}></div>
             </div>

             <div className="flex gap-4">
                <a href="tel:+8801700000000" className="flex-1 h-16 rounded-2xl bg-primary text-background-dark font-black tracking-[0.2em] uppercase italic flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(19,236,218,0.25)] active:scale-95 transition-all text-xs">
                   <span className="material-symbols-outlined text-xl">call</span>
                   Direct Audio
                </a>
                <button onClick={onSupport} className="size-16 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-95 transition-all hover:bg-white/10">
                   <span className="material-symbols-outlined text-2xl font-black">chat_bubble</span>
                </button>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .glass-panel { background: rgba(16, 34, 32, 0.85); backdrop-filter: blur(12px); }
      `}</style>
    </div>
  );
};

export default AdminLiveTracking;
