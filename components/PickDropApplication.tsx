
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

const PickDropApplication: React.FC<Props> = ({ onBack, onSubmit }) => {
  const [vehicleType, setVehicleType] = useState('Mini Truck');

  const vehicleOptions = [
    { label: 'Motorcycle', icon: 'moped' },
    { label: 'Mini Truck', icon: 'local_shipping' },
    { label: 'Heavy Truck', icon: 'airport_shuttle' }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display text-white overflow-x-hidden max-w-[430px] mx-auto selection:bg-primary/30">
      <header className="px-5 pt-14 pb-6 flex items-center gap-4 relative z-10 bg-background-dark/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div>
          <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase">Partner App</h1>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] leading-none mt-1">Logistics Portal</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-32 no-scrollbar relative z-10">
        <div className="space-y-10">
          <section className="space-y-4">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Select Fleet Unit</h3>
            <div className="grid grid-cols-3 gap-3">
              {vehicleOptions.map((opt) => (
                <div 
                  key={opt.label}
                  onClick={() => setVehicleType(opt.label)}
                  className={`flex flex-col items-center justify-center p-4 rounded-[2rem] glass-card border transition-all cursor-pointer active:scale-95 ${vehicleType === opt.label ? 'border-primary bg-primary/10 shadow-2xl shadow-primary/10' : 'border-white/5'}`}
                >
                  <div className={`size-12 rounded-2xl flex items-center justify-center mb-3 border ${vehicleType === opt.label ? 'bg-primary text-background-dark border-primary' : 'bg-white/5 text-white/30 border-white/10'}`}>
                    <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-widest text-center italic ${vehicleType === opt.label ? 'text-primary' : 'text-white/40'}`}>{opt.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Vehicle Logistics</h3>
             <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.01] space-y-6 shadow-2xl">
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Registration Number</label>
                   <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all uppercase" placeholder="DHAKA-METRO-KA-0000" />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Driver License Number</label>
                   <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" placeholder="Enter license number" />
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Document Pipelining</h3>
             <div className="w-full h-44 rounded-[2.5rem] border-2 border-dashed border-white/10 glass-card flex flex-col items-center justify-center p-8 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-primary text-3xl">badge</span>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] italic text-white">License Photo</p>
                <p className="text-[8px] text-white/30 mt-1.5 font-bold uppercase tracking-widest">Front & Back (Max 5MB)</p>
             </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-20">
        <button onClick={onSubmit} className="w-full h-18 bg-primary text-background-dark font-black rounded-[1.5rem] tracking-[0.2em] shadow-[0_15px_40px_rgba(19,236,218,0.3)] uppercase transition-all active:scale-95 text-xs italic">
          JOIN DUYAR FLEET
        </button>
      </div>

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .h-18 { height: 4.5rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default PickDropApplication;
