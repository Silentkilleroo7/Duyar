
import React from 'react';

interface Props {
  type?: string;
  onHome: () => void;
}

const ApplicationSubmitted: React.FC<Props> = ({ type = 'Provider', onHome }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background-dark font-display text-white overflow-hidden max-w-[430px] mx-auto border-x border-white/5 shadow-2xl">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] size-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] size-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="relative z-10 w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping blur-xl opacity-50"></div>
          <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-[0_0_60px_rgba(19,236,218,0.4)] border-4 border-background-dark">
            <span className="material-symbols-outlined text-background-dark text-6xl font-black">done_all</span>
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight uppercase italic text-primary text-center leading-tight px-4">
          Packet Transmitted!
        </h1>
        <p className="text-white/60 text-sm text-center mt-4 max-w-[280px] font-medium leading-relaxed italic">
          Your <span className="text-white font-black">{type}</span> application has been successfully queued for official verification.
        </p>

        <div className="w-full glass-card border border-white/5 rounded-[2.5rem] p-8 mt-12 space-y-6 bg-white/[0.01]">
          <div className="flex items-center gap-5">
            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <span className="material-symbols-outlined text-3xl font-black">confirmation_number</span>
            </div>
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic leading-none mb-2">Transmission ID</p>
              <p className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">#AP-88219-X</p>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic mb-2">Category</p>
                <p className="text-xs font-black text-primary uppercase italic">{type}</p>
             </div>
             <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic mb-2">Vetting Status</p>
                <div className="flex items-center gap-2">
                   <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                   <p className="text-xs font-black text-emerald-400 uppercase italic">In Queue</p>
                </div>
             </div>
          </div>
        </div>

        <div className="w-full space-y-4 mt-12">
          <button 
            onClick={onHome}
            className="w-full bg-primary text-background-dark font-black h-18 rounded-[1.5rem] shadow-[0_20px_40px_rgba(19,236,218,0.25)] tracking-[0.2em] uppercase transition-all active:scale-95 flex items-center justify-center gap-3 text-sm italic"
          >
            RETURN TO COMMAND
            <span className="material-symbols-outlined font-black">home</span>
          </button>
          <button 
            className="w-full glass border border-white/10 text-white/40 font-black h-18 rounded-[1.5rem] tracking-widest uppercase transition-all active:scale-95 hover:bg-white/5 text-[10px] italic"
          >
            DIAGNOSTIC STATUS
          </button>
        </div>
      </main>

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
};

export default ApplicationSubmitted;
