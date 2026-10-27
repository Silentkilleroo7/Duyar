
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

const LocatorApplication: React.FC<Props> = ({ onBack, onSubmit }) => {
  const [expertise, setExpertise] = useState('Rent Specialist');

  const expertiseOptions = [
    { label: 'Rent Specialist', icon: 'key' },
    { label: 'Sale Specialist', icon: 'sell' },
    { label: 'Commercial Expert', icon: 'apartment' }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display text-white overflow-x-hidden max-w-[430px] mx-auto selection:bg-primary/30">
      <header className="px-5 pt-14 pb-6 flex items-center gap-4 relative z-10 bg-background-dark/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div>
          <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase">Locator App</h1>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] leading-none mt-1">Join the network</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-32 no-scrollbar relative z-10">
        <div className="space-y-10">
          <section className="space-y-4">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Select Your Domain</h3>
            <div className="flex flex-col gap-3">
              {expertiseOptions.map((opt) => (
                <label 
                  key={opt.label}
                  className={`flex items-center justify-between p-5 rounded-[2rem] glass-card cursor-pointer border transition-all active:scale-[0.98] ${expertise === opt.label ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/5' : 'border-white/5'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-2xl flex items-center justify-center border ${expertise === opt.label ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-white/30 border-white/10'}`}>
                      <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                    </div>
                    <p className={`text-base font-black italic uppercase tracking-tight ${expertise === opt.label ? 'text-white' : 'text-white/50'}`}>{opt.label}</p>
                  </div>
                  <input 
                    type="radio" 
                    className="hidden" 
                    checked={expertise === opt.label} 
                    onChange={() => setExpertise(opt.label)}
                  />
                  {expertise === opt.label && <span className="material-symbols-outlined text-primary text-2xl font-black animate-in zoom-in duration-300">check_circle</span>}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Professional Profile</h3>
            <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.01] space-y-6 shadow-2xl">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Primary Operating Area</label>
                <div className="relative">
                  <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" placeholder="e.g. Banani, Gulshan 2" />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">near_me</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Experience (Years)</label>
                <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" placeholder="Enter years of experience" type="number" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">About Your Expertise</label>
                <textarea className="w-full h-32 rounded-2xl bg-white/5 border border-white/10 p-5 text-sm font-bold focus:border-primary/40 outline-none transition-all resize-none" placeholder="Briefly describe your success rate and area knowledge..." />
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-20">
        <button onClick={onSubmit} className="w-full h-18 bg-primary text-background-dark font-black rounded-[1.5rem] tracking-[0.2em] shadow-[0_15px_40px_rgba(19,236,218,0.3)] uppercase transition-all active:scale-95 text-xs italic">
          ACTIVATE LOCATOR AGENT
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

export default LocatorApplication;
