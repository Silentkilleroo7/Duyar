
import React, { useState, useEffect } from 'react';
import { 
  getStoredMaintenanceTickets, 
  acceptMaintenanceTicket, 
  releaseMaintenanceTicketToPending,
  subscribeToMaintenanceTickets, 
  MaintenanceTicket 
} from '../../maintenanceStorage';

interface Props {
  onBack: () => void;
  onSOS: () => void;
  userProfile?: any;
}

const SecurityGuardDashboard: React.FC<Props> = ({ onBack, onSOS, userProfile }) => {
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => getStoredMaintenanceTickets());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const guardName = userProfile?.full_name || 'Abdul Karim';
  const guardPhone = userProfile?.phone || '+880 1944-556677';

  useEffect(() => {
    const unsub = subscribeToMaintenanceTickets(() => {
      setTickets(getStoredMaintenanceTickets());
    });
    return unsub;
  }, []);

  const pendingGuards = tickets.filter(t => 
    t.status === 'PENDING' && (t.category === 'Security & CCTV' || t.title.toLowerCase().includes('security') || t.title.toLowerCase().includes('guard'))
  );

  const myActiveGuards = tickets.filter(t => 
    t.status === 'ACTIVE' && (t.technicianName === guardName || t.category === 'Security & CCTV' || t.title.toLowerCase().includes('security') || t.title.toLowerCase().includes('guard'))
  );

  const handleAccept = (ticketId: string) => {
    acceptMaintenanceTicket(ticketId, {
      name: guardName,
      role: 'Approved Security Officer • 5.0★',
      phone: guardPhone
    });
    setToastMessage(`Security assignment #${ticketId} accepted! Status is now ACTIVE.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReleasePriceMismatch = (ticketId: string) => {
    releaseMaintenanceTicketToPending(ticketId, 'Guard could not agree on price');
    setToastMessage(`Assignment #${ticketId} released due to price disagreement. Re-broadcasted to pending queue for other guards.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-background-dark font-display text-white overflow-x-hidden pb-10">
      <header className="sticky top-0 z-50 glass-header px-4 py-4 flex items-center justify-between backdrop-blur-xl bg-background-dark/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="size-11 rounded-full border-2 border-primary/40 overflow-hidden shadow-xl">
            <div className="h-full w-full bg-center bg-cover" style={{backgroundImage: `url("${userProfile?.avatar_url || ''}")`}}></div>
          </div>
          <div>
            <h1 className="text-sm font-black italic tracking-tight text-white uppercase leading-none">{guardName}</h1>
            <p className="text-[9px] text-primary uppercase tracking-[0.2em] font-black mt-1.5">Approved Security Guard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 shadow-[0_0_20px_rgba(19,236,218,0.1)]">
          <div className={`size-2 rounded-full ${isOnDuty ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400'}`}></div>
          <span className="text-[10px] font-black tracking-widest text-primary uppercase italic">{isOnDuty ? 'ON DUTY' : 'OFF DUTY'}</span>
          <button 
            onClick={() => setIsOnDuty(!isOnDuty)}
            className={`w-8 h-4 rounded-full relative ml-1 transition-all duration-300 ${isOnDuty ? 'bg-primary' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 size-3 bg-white rounded-full shadow-sm transition-all duration-300 ${isOnDuty ? 'right-0.5' : 'left-0.5'}`}></div>
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] animate-in fade-in duration-300">
          <div className="glass-card bg-[#0e211e]/95 border border-primary/40 rounded-2xl p-3 shadow-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl font-black">check_circle</span>
            <p className="text-white text-xs font-bold leading-snug">{toastMessage}</p>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 space-y-7 mt-2">
        {/* Pending Deployment Requests */}
        {pendingGuards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black italic uppercase tracking-tight flex items-center gap-2 text-amber-300">
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
                <span>Pending Resident Requests ({pendingGuards.length})</span>
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold uppercase">Awaiting Guard</span>
            </div>

            {pendingGuards.map((t) => (
              <div key={t.id} className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-tight">{t.title}</h4>
                    <p className="text-[10px] text-white/50 font-bold mt-0.5">📍 {t.address || t.area || 'Dhaka'}</p>
                  </div>
                  <span className="text-amber-300 font-black text-xs">{t.price}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAccept(t.id)}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20"
                >
                  <span className="material-symbols-outlined text-sm font-black">handshake</span>
                  <span>Accept Deployment Request</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* My Active Deployment Requests (Negotiating / Active) */}
        {myActiveGuards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black italic uppercase tracking-tight flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Active Assignments ({myActiveGuards.length})</span>
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase">In Negotiation</span>
            </div>

            {myActiveGuards.map((t) => (
              <div key={t.id} className="glass-card rounded-2xl p-4 border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-tight">{t.title}</h4>
                    <p className="text-[10px] text-white/50 font-bold mt-0.5">📍 {t.address || t.area || 'Dhaka'}</p>
                    <p className="text-[9px] text-white/40 mt-1">Customer: {t.customerName} ({t.customerPhone})</p>
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-black text-xs block">{t.price}</span>
                    <span className="text-[8px] uppercase tracking-wider text-emerald-400 font-bold">Active</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleReleasePriceMismatch(t.id)}
                    className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    title="If price negotiation does not meet, release request back to PENDING for other guards"
                  >
                    <span className="material-symbols-outlined text-sm font-black">sync_problem</span>
                    <span>Price Mismatch • Release to Other Guards</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card flex flex-col gap-1.5 p-4 rounded-2xl border-l-4 border-l-primary border border-white/5 bg-white/[0.02] shadow-xl">
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Current Shift</p>
            <p className="text-2xl font-black italic italic tracking-tighter">06:42</p>
          </div>
          <div className="glass-card flex flex-col gap-1.5 p-4 rounded-2xl border border-white/5 bg-white/[0.02] shadow-xl">
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Logged</p>
            <p className="text-2xl font-black italic italic tracking-tighter">142h</p>
          </div>
          <div className="glass-card flex flex-col gap-1.5 p-4 rounded-2xl border border-white/5 bg-white/[0.02] shadow-xl">
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">History</p>
            <p className="text-2xl font-black italic italic tracking-tighter">24</p>
          </div>
        </div>

        {/* Active Posting Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black italic uppercase tracking-tight flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-primary text-xl font-black">location_on</span>
              Active Posting
            </h3>
            <span className="text-[10px] text-primary font-black uppercase tracking-widest cursor-pointer hover:underline">View Map</span>
          </div>
          
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
            <div className="relative h-56 w-full bg-cover bg-center grayscale contrast-125" style={{backgroundImage: 'url("")'}}>
              <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-90"></div>
              <div className="absolute bottom-5 left-6">
                <div className="bg-primary/90 backdrop-blur-xl text-background-dark text-[9px] px-3 py-1 rounded-full uppercase font-black tracking-[0.2em] mb-2 shadow-xl inline-block">
                  Level 1 Secure Area
                </div>
                <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Residential Guard - Gulshan</h4>
              </div>
            </div>
            <div className="p-6 pt-2 space-y-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-white/60">
                  <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Shift ends at 08:00 AM <span className="text-white font-black">(01:18 Left)</span></p>
                </div>
                <div className="flex items-center gap-3 text-white/60">
                  <span className="material-symbols-outlined text-primary text-xl">security</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Station: Block A Main Gate</p>
                </div>
              </div>
              <button className="w-full h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] tracking-[0.2em] uppercase transition-all italic active:scale-95">
                <span className="material-symbols-outlined text-xl">description</span>
                File Incident Report
              </button>
            </div>
          </div>
        </div>

        {/* SOS Emergency Section */}
        <div className="px-2 pt-2">
          <div className="bg-red-600/10 border-2 border-red-600/30 rounded-[3rem] p-10 flex flex-col items-center gap-6 relative overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.1)]">
            <div className="absolute top-[-30%] left-[-20%] size-40 bg-red-600/10 rounded-full blur-[60px] animate-pulse"></div>
            <div className="relative group cursor-pointer active:scale-90 transition-transform duration-300" onClick={onSOS}>
              <div className="absolute -inset-6 bg-red-600 rounded-full blur-2xl opacity-20 animate-ping"></div>
              <div className="relative size-28 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white/20">
                <span className="material-symbols-outlined text-white text-5xl font-black">emergency_home</span>
                <span className="text-white text-[10px] font-black tracking-tighter uppercase mt-1">SOS</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-red-500 font-black uppercase tracking-[0.3em] text-sm italic">Emergency Alert</p>
              <p className="text-white/40 text-[10px] font-bold uppercase mt-2 italic tracking-widest">Hold to alert Duyar Command Center</p>
            </div>
          </div>
        </div>

        {/* Patrol/Checklist Actions */}
        <div className="grid grid-cols-2 gap-4 pb-12">
          <button className="glass-card p-5 rounded-3xl flex items-center gap-4 active:bg-white/10 transition-all border border-white/5 group">
            <div className="size-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-orange-500 text-2xl">flash_on</span>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Next Patrol</p>
              <p className="text-sm font-black italic uppercase italic tracking-tighter">07:15 AM</p>
            </div>
          </button>
          <button className="glass-card p-5 rounded-3xl flex items-center gap-4 active:bg-white/10 transition-all border border-white/5 group">
            <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-emerald-500 text-2xl">checklist</span>
            </div>
            <div className="text-left">
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Tasks Left</p>
              <p className="text-sm font-black italic uppercase italic tracking-tighter">03 LEFT</p>
            </div>
          </button>
        </div>
      </main>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default SecurityGuardDashboard;
