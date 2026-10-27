
import React from 'react';

interface Props {
  role: string;
  onBack: () => void;
  userProfile?: any;
}

const ApplicationStatusScreen: React.FC<Props> = ({ role, onBack, userProfile }) => {
  const applicantName = userProfile?.full_name || 'Verified Applicant';
  const phone = userProfile?.phone || '';

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark font-display text-white overflow-hidden max-w-[430px] mx-auto border-x border-white/5 shadow-2xl">
      <header className="px-5 pt-14 pb-6 flex items-center gap-4 relative z-10 bg-background-dark/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div>
          <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase leading-none">Application Status</h1>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mt-1 leading-none italic">Partner Verification</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-32 no-scrollbar relative z-10">
        <div className="space-y-8">
           {/* Summary Diagnostic Card */}
           <div className="glass-card rounded-[2.5rem] p-8 border-l-4 border-l-primary border-white/5 bg-primary/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <span className="material-symbols-outlined text-[100px] font-black">shield_person</span>
              </div>
              <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="relative">
                    <div className="size-16 rounded-[1.5rem] bg-primary/10 border-2 border-primary/30 shadow-xl flex items-center justify-center text-primary font-black text-2xl">
                      {applicantName.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 size-5 bg-primary rounded-full border-4 border-background-dark animate-pulse"></div>
                 </div>
                 <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none text-white">{applicantName}</h3>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-2">{role} Verification Hub</p>
                    {phone && <p className="text-[9px] text-white/40 font-mono mt-0.5">{phone}</p>}
                 </div>
              </div>
              
              <div className="h-px bg-white/5 w-full mb-6 relative z-10"></div>
              
              <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                    <span className="text-white/40">Verification Stage</span>
                    <span className="text-primary italic">Document Review In Progress</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(19,236,218,0.5)]" style={{width: '65%'}}></div>
                 </div>
              </div>
           </div>

           {/* Detailed Step-by-Step History */}
           <section className="space-y-6">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2 italic">Verification Lifecycle</h3>
              
              <div className="flex flex-col gap-0 px-2">
                <TimelineStep status="COMPLETED" label="Identity & Form Received" desc="Information submitted securely" time="Step 1 Completed" />
                <TimelineStep status="ACTIVE" label="Admin Review" desc="Identity documents undergoing validation" time="Underway" />
                <TimelineStep status="PENDING" label="Hub Activation" desc="Granting access permissions to provider workspace" />
                <TimelineStep status="PENDING" label="Ready for Operations" desc="Profile visible to clients across Dhaka" last />
              </div>
           </section>

           {/* Notice card */}
           <div className="glass-card rounded-2xl p-5 border border-white/5 bg-white/[0.02] flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-2xl">verified_user</span>
             <p className="text-xs text-white/60 leading-relaxed">
               Our onboarding specialists review new applications promptly. You will be notified via SMS as soon as your account is approved.
             </p>
           </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-20">
        <button onClick={onBack} className="w-full h-18 bg-white/5 border border-white/10 text-white font-black rounded-[1.5rem] tracking-[0.2em] uppercase transition-all active:scale-95 text-xs italic">
          DISMISS LOG VIEW
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

const TimelineStep = ({ status, label, desc, time, last }: any) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`flex size-8 items-center justify-center rounded-full border shadow-xl transition-all duration-500 ${
        status === 'COMPLETED' ? 'bg-primary text-background-dark border-primary' : 
        status === 'ACTIVE' ? 'bg-primary/20 border-primary animate-pulse text-primary' : 
        'bg-white/5 border-white/10 text-white/20'
      }`}>
        <span className="material-symbols-outlined text-lg font-black">{status === 'COMPLETED' ? 'check' : status === 'ACTIVE' ? 'sync' : 'circle'}</span>
      </div>
      {!last && <div className={`w-[2px] h-12 transition-colors duration-500 ${status === 'COMPLETED' ? 'bg-primary' : 'bg-white/10'}`}></div>}
    </div>
    <div className="flex flex-col py-1 overflow-hidden">
      <p className={`text-sm font-black italic uppercase tracking-tighter leading-none ${status === 'PENDING' ? 'text-white/20' : 'text-white'}`}>{label}</p>
      <p className={`text-[10px] font-bold mt-1.5 uppercase tracking-widest ${status === 'ACTIVE' ? 'text-primary animate-pulse' : 'text-white/40'}`}>{desc}</p>
      {time && <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mt-1 italic">{time}</p>}
    </div>
  </div>
);

export default ApplicationStatusScreen;
