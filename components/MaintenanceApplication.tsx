
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

const MaintenanceApplication: React.FC<Props> = ({ onBack, onSubmit }) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [certId, setCertId] = useState('');
  const [tools, setTools] = useState('');
  const [experience, setExperience] = useState('');

  const toggleSkill = (label: string) => {
    setSelectedSkills(prev => 
      prev.includes(label) 
        ? prev.filter(s => s !== label) 
        : [...prev, label]
    );
  };

  const handleFormSubmit = () => {
    if (selectedSkills.length === 0) {
      // Optional: Add a toast or alert here if needed, or just allow it for the mock
      // For better UX, we'll allow it but visually it's better if they selected something
    }
    onSubmit();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display text-white overflow-x-hidden max-w-[430px] mx-auto selection:bg-primary/30">
      <header className="px-5 pt-14 pb-6 flex items-center gap-4 relative z-10 bg-background-dark/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div>
          <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase">Specialist App</h1>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mt-1 leading-none italic">Maintenance Hub</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-40 no-scrollbar relative z-10">
        <div className="space-y-10">
           <section className="space-y-4">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Expertise Domain</h3>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { label: 'Electrical', icon: 'bolt' },
                   { label: 'Plumbing', icon: 'plumbing' },
                   { label: 'Appliances', icon: 'kitchen' },
                   { label: 'A/C Systems', icon: 'ac_unit' }
                 ].map((skill) => {
                   const isSelected = selectedSkills.includes(skill.label);
                   return (
                     <button 
                        key={skill.label} 
                        onClick={() => toggleSkill(skill.label)}
                        className={`glass-card p-6 rounded-[2rem] flex flex-col items-center gap-3 border transition-all group active:scale-95 shadow-xl ${isSelected ? 'bg-primary/10 border-primary/40' : 'border-white/5 bg-white/[0.01] hover:bg-primary/5 hover:border-primary/20'}`}
                     >
                        <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-background-dark' : 'bg-white/5 group-hover:bg-primary group-hover:text-background-dark'}`}>
                          <span className="material-symbols-outlined text-2xl">{skill.icon}</span>
                        </div>
                        <p className={`text-[11px] font-black uppercase tracking-widest italic ${isSelected ? 'text-primary' : 'text-white/60 group-hover:text-white'}`}>{skill.label}</p>
                     </button>
                   );
                 })}
              </div>
           </section>

           <section className="space-y-4">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Technical Profile</h3>
              <div className="glass-card rounded-[2.5rem] p-8 border border-white/5 bg-white/[0.01] space-y-6 shadow-2xl">
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Trade Certification ID</label>
                    <input 
                      value={certId}
                      onChange={(e) => setCertId(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all uppercase placeholder:text-white/20 text-white" 
                      placeholder="Enter certificate serial" 
                    />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Primary Tools Equipped</label>
                    <input 
                      value={tools}
                      onChange={(e) => setTools(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all placeholder:text-white/20 text-white" 
                      placeholder="e.g. Drilling, Multi-meter, etc." 
                    />
                 </div>
                 <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Years in Trade</label>
                    <input 
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all placeholder:text-white/20 text-white" 
                      placeholder="Years of experience" 
                      type="number" 
                    />
                 </div>
              </div>
           </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-20">
        <button onClick={handleFormSubmit} className="w-full h-18 bg-primary text-background-dark font-black rounded-[1.5rem] tracking-[0.2em] shadow-[0_15px_40px_rgba(19,236,218,0.3)] uppercase transition-all active:scale-95 text-xs italic">
          ONBOARD SPECIALIST ID
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

export default MaintenanceApplication;
