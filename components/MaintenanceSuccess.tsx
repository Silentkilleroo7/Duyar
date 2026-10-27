
import React from 'react';

interface Props {
  serviceName: string;
  onHome: () => void;
  onTrack: () => void;
}

const MaintenanceSuccess: React.FC<Props> = ({ serviceName, onHome, onTrack }) => {
  const getDisplayTitle = () => {
    if (serviceName.toLowerCase().includes('maid')) return 'Maid Service Booked!';
    if (serviceName.toLowerCase().includes('security')) return 'Security Guard Secured!';
    return `${serviceName} Request Sent!`;
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-display flex flex-col items-center justify-center p-6 relative overflow-hidden max-w-[430px] mx-auto">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      <main className="relative z-10 w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping blur-xl opacity-50"></div>
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(19,236,218,0.4)] border-4 border-background-dark">
            <span className="material-symbols-outlined text-background-dark text-5xl font-black">check_circle</span>
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tight uppercase italic text-primary text-center leading-tight px-4">
          {getDisplayTitle()}
        </h1>
        <p className="text-white/60 text-sm text-center mt-4 max-w-[280px] font-medium leading-relaxed">
          Your request has been received by our verified partners. A {serviceName.toLowerCase()} specialist will reach out to confirm arrival.
        </p>

        <div className="w-full glass-card border border-white/5 rounded-[2.5rem] p-6 mt-12 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <span className="material-symbols-outlined text-2xl">confirmation_number</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Booking ID</p>
              <p className="text-base font-bold text-white">#SRV-{Math.floor(1000 + Math.random() * 9000)}</p>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Type</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary uppercase">{serviceName}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-emerald-400">Processing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full space-y-4 mt-12">
          <button 
            onClick={onTrack}
            className="w-full bg-primary text-background-dark font-black h-18 rounded-3xl shadow-[0_20px_40px_rgba(19,236,218,0.25)] tracking-[0.2em] uppercase transition-all active:scale-95 flex items-center justify-center gap-3 text-sm"
          >
            MANAGE SUBMISSION
            <span className="material-symbols-outlined font-black">history</span>
          </button>
          <button 
            onClick={onHome}
            className="w-full glass border border-white/10 text-white font-black h-18 rounded-3xl tracking-widest uppercase transition-all active:scale-95 hover:bg-white/5 text-sm"
          >
            BACK TO HOME
          </button>
        </div>
      </main>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
};

export default MaintenanceSuccess;
