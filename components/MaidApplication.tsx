
import React from 'react';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

const MaidApplication: React.FC<Props> = ({ onBack, onSubmit }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display text-white overflow-x-hidden max-w-[430px] mx-auto selection:bg-primary/30">
      <header className="px-5 pt-14 pb-6 flex items-center gap-4 relative z-10 bg-background-dark/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div>
          <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase">Partner App</h1>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mt-1 leading-none italic">Maid Marketplace</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-40 no-scrollbar relative z-10">
        <div className="space-y-10">
           <section className="space-y-4">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Skill Spectrum</h3>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { label: 'Cleaning', icon: 'mop' },
                   { label: 'Cooking', icon: 'restaurant' },
                   { label: 'Laundry', icon: 'local_laundry_service' },
                   { label: 'Full House', icon: 'home_repair_service' }
                 ].map((skill) => (
                   <button key={skill.label} className="glass-card p-6 rounded-[2rem] flex flex-col items-center gap-3 border border-white/5 bg-white/[0.01] hover:bg-primary/5 hover:border-primary/20 transition-all group active:scale-95 shadow-xl">
                      <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-background-dark transition-all">
                        <span className="material-symbols-outlined text-2xl">{skill.icon}</span>
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/60 group-hover:text-white italic">{skill.label}</p>
                   </button>
                 ))}
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Engagement Metrics</h3>
              <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.01] space-y-6 shadow-2xl">
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Preferred Shift</label>
                    <div className="relative">
                       <select className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none appearance-none cursor-pointer">
                          <option className="bg-background-dark">Morning (8 AM - 1 PM)</option>
                          <option className="bg-background-dark">Evening (2 PM - 7 PM)</option>
                          <option className="bg-background-dark">Full Time (Live-in)</option>
                       </select>
                       <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">expand_more</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Experience History</label>
                    <input className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" placeholder="Enter years of experience" type="number" />
                 </div>
              </div>
           </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-20">
        <button onClick={onSubmit} className="w-full h-18 bg-primary text-background-dark font-black rounded-[1.5rem] tracking-[0.2em] shadow-[0_15px_40px_rgba(19,236,218,0.3)] uppercase transition-all active:scale-95 text-xs italic">
          REGISTER PARTNER ID
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

export default MaidApplication;
