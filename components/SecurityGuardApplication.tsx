
import React from 'react';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

const SecurityGuardApplication: React.FC<Props> = ({ onBack, onSubmit }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display text-white overflow-x-hidden max-w-[430px] mx-auto selection:bg-primary/30">
      <header className="px-5 pt-14 pb-6 flex items-center gap-4 relative z-10 bg-background-dark/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div>
          <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase">Guard App</h1>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] leading-none mt-1">Official Enrollment</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-40 no-scrollbar relative z-10">
        <div className="space-y-10">
          <section className="space-y-4">
             <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Physical Vitals</h3>
             <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.01] space-y-6 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Height (ft)</label>
                      <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none" placeholder="5'11\" />
                   </div>
                   <div className="flex flex-col gap-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Weight (kg)</label>
                      <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none" placeholder="75" type="number" />
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Age</label>
                   <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none" placeholder="28" type="number" />
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Professional Shield</h3>
             <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.01] space-y-6 shadow-2xl">
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Service Speciality</label>
                   <div className="flex flex-wrap gap-2 mt-2">
                      {['Armed', 'Unarmed', 'Event', 'Bodyguard', 'Residential'].map(tag => (
                        <button key={tag} type="button" className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 bg-white/5 text-white/40 hover:bg-primary/20 hover:text-primary transition-all">
                           {tag}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Experience Years</label>
                   <select className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none appearance-none cursor-pointer">
                      <option className="bg-background-dark">Select years</option>
                      <option className="bg-background-dark">1-2 Years</option>
                      <option className="bg-background-dark">3-5 Years</option>
                      <option className="bg-background-dark">5+ Years</option>
                   </select>
                </div>
             </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-20">
        <button onClick={onSubmit} className="w-full h-18 bg-primary text-background-dark font-black rounded-[1.5rem] tracking-[0.2em] shadow-[0_15px_40px_rgba(19,236,218,0.3)] uppercase transition-all active:scale-95 text-xs italic">
          ACTIVATE SECURITY AGENT
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

export default SecurityGuardApplication;
