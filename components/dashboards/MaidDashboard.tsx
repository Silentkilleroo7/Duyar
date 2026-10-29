
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
  userProfile?: any;
}

const MaidDashboard: React.FC<Props> = ({ onBack, userProfile }) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => getStoredMaintenanceTickets());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const maidName = userProfile?.full_name || 'Fatima Begum';
  const maidPhone = userProfile?.phone || '+880 1733-445566';

  useEffect(() => {
    const unsub = subscribeToMaintenanceTickets(() => {
      setTickets(getStoredMaintenanceTickets());
    });
    return unsub;
  }, []);

  const pendingHousekeeping = tickets.filter(t => 
    t.status === 'PENDING' && (t.category === 'Maid & Housekeeping' || t.title.toLowerCase().includes('maid') || t.title.toLowerCase().includes('housekeeping'))
  );

  const myActiveHousekeeping = tickets.filter(t => 
    t.status === 'ACTIVE' && (t.technicianName === maidName || t.category === 'Maid & Housekeeping' || t.title.toLowerCase().includes('maid') || t.title.toLowerCase().includes('housekeeping'))
  );

  const handleAccept = (ticketId: string) => {
    acceptMaintenanceTicket(ticketId, {
      name: maidName,
      role: 'Approved Maid & Housekeeper • 4.9★',
      phone: maidPhone
    });
    setToastMessage(`Housekeeping request #${ticketId} accepted! Status is now ACTIVE.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReleasePriceMismatch = (ticketId: string) => {
    releaseMaintenanceTicketToPending(ticketId, 'Housekeeper could not agree on price');
    setToastMessage(`Request #${ticketId} released due to price disagreement. Re-broadcasted to pending queue for other housekeepers.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-background-dark font-display text-white overflow-x-hidden pb-12">
      <header className="sticky top-0 z-50 glass-header px-4 py-4 flex items-center justify-between backdrop-blur-xl bg-background-dark/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="size-11 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden shadow-lg">
            <div className="w-full h-full rounded-full bg-cover bg-center" style={{backgroundImage: `url("${userProfile?.avatar_url || ''}")`}}></div>
          </div>
          <div>
            <h1 className="text-sm font-black italic tracking-tight text-white uppercase leading-none">{maidName}</h1>
            <p className="text-[9px] text-primary uppercase tracking-[0.2em] font-black mt-1.5">Approved Housekeeper</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
          <div className={`size-2 rounded-full ${isAvailable ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(19,236,218,0.6)]' : 'bg-white/20'}`}></div>
          <span className="text-[10px] font-black tracking-widest text-white/80 uppercase italic">{isAvailable ? 'Available' : 'Off-Duty'}</span>
          <button 
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-8 h-4 rounded-full relative ml-1 transition-all duration-300 ${isAvailable ? 'bg-primary' : 'bg-white/10'}`}
          >
            <div className={`absolute top-0.5 size-3 bg-white rounded-full shadow-sm transition-all duration-300 ${isAvailable ? 'right-0.5' : 'left-0.5'}`}></div>
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
        {/* Pending Housekeeping Requests */}
        {pendingHousekeeping.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black italic uppercase tracking-tight flex items-center gap-2 text-amber-300">
                <span className="material-symbols-outlined text-base animate-spin">sync</span>
                <span>Pending Housekeeping Requests ({pendingHousekeeping.length})</span>
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold uppercase">Awaiting Maid</span>
            </div>

            {pendingHousekeeping.map((t) => (
              <div key={t.id} className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h4 className="text-white text-xs font-black uppercase tracking-tight">{t.title}</h4>
                    <p className="text-[10px] text-white/50 font-bold mt-0.5">📍 {t.address || t.area || 'Dhaka'}</p>
                    {t.scheduledTime && (
                      <p className="text-[10px] text-primary font-bold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{t.scheduledTime}</span>
                      </p>
                    )}
                    {t.description && (
                      <p className="text-[10px] text-white/70 italic mt-1 bg-white/5 p-2 rounded-xl border border-white/5 leading-relaxed">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-amber-300 font-black text-sm block">{t.price}</span>
                    <span className="text-[8px] uppercase tracking-wider text-amber-400/80 font-bold">Proposed Rate</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAccept(t.id)}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20"
                >
                  <span className="material-symbols-outlined text-sm font-black">handshake</span>
                  <span>Accept Housekeeping Request</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* My Active Housekeeping Assignments (Negotiating / Active) */}
        {myActiveHousekeeping.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black italic uppercase tracking-tight flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-base">verified_user</span>
                <span>Active Assignments ({myActiveHousekeeping.length})</span>
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase">In Negotiation</span>
            </div>

            {myActiveHousekeeping.map((t) => (
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
                    title="If price negotiation does not meet, release request back to PENDING for other housekeepers"
                  >
                    <span className="material-symbols-outlined text-sm font-black">sync_problem</span>
                    <span>Price Mismatch • Release to Other Housekeepers</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Status Hub */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center text-center border border-white/5 shadow-xl">
            <span className="material-symbols-outlined text-primary mb-2 text-2xl">calendar_today</span>
            <span className="text-xl font-black italic">4</span>
            <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1">Jobs</span>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center text-center border border-white/5 shadow-xl">
            <span className="material-symbols-outlined text-primary mb-2 text-2xl">payments</span>
            <span className="text-xl font-black italic">৳12.5k</span>
            <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1">Weekly</span>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center text-center border border-white/5 shadow-xl">
            <span className="material-symbols-outlined text-primary mb-2 text-2xl">star</span>
            <span className="text-xl font-black italic">4.8</span>
            <span className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1">Rating</span>
          </div>
        </div>

        {/* Active Duty Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-black italic tracking-tight uppercase">Active Duty</h2>
            <div className="px-2 py-0.5 bg-primary/10 rounded-lg">
              <span className="text-[8px] text-primary font-black uppercase tracking-widest">Next in 15 mins</span>
            </div>
          </div>
          <div className="glass-card rounded-[2rem] p-6 border-2 border-primary/20 bg-primary/5 relative overflow-hidden shadow-[0_0_40px_rgba(19,236,218,0.05)]">
            <div className="absolute top-[-20%] right-[-10%] size-32 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="relative z-10">
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2 leading-none italic">Current Location</p>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Banani, Block D</h3>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-2 italic">Road 12, House 45, Apt 4B</p>
              </div>
              <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20 shadow-xl">
                <span className="material-symbols-outlined text-primary text-2xl font-black">navigation</span>
              </div>
            </div>
            <button className="w-full bg-primary py-5 rounded-[1.5rem] text-background-dark font-black text-sm tracking-[0.3em] shadow-[0_0_20px_rgba(19,236,218,0.3)] active:scale-95 transition-all uppercase italic">
              START WORK
            </button>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="space-y-4">
          <h2 className="text-base font-black italic tracking-tight uppercase px-1">Today's Shifts</h2>
          <div className="space-y-3">
            {[
              { time: '9:00 AM', label: 'General Cleaning', desc: 'Standard Service • 3 Hours', status: 'DONE', icon: 'cleaning_services' },
              { time: '2:00 PM', label: 'Deep Cleaning', desc: 'Premium Service • 5 Hours', status: 'UPCOMING', icon: 'mop', active: true },
              { time: '7:30 PM', label: 'Post Party Clean', desc: 'Special Service • 2 Hours', status: 'PENDING', icon: 'auto_fix_high' },
              { time: '10:00 PM', label: 'Window Polishing', desc: 'Extra Care • 1 Hour', status: 'PENDING', icon: 'window' }
            ].map((shift, i) => (
              <div key={i} className={`glass-card rounded-2xl p-5 flex items-center justify-between border border-white/5 transition-all ${shift.active ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-60'}`}>
                <div className="flex items-center gap-4">
                  <div className={`size-14 rounded-2xl flex items-center justify-center border shadow-inner ${shift.active ? 'bg-primary/20 border-primary/20' : 'bg-white/5 border-white/10'}`}>
                    <span className={`material-symbols-outlined text-2xl ${shift.active ? 'text-primary' : 'text-white/40'}`}>{shift.icon}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-black italic tracking-tighter leading-none">{shift.time} - {shift.label}</p>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1.5 italic">{shift.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-black tracking-[0.2em] px-3 py-1 rounded-lg border ${
                    shift.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    shift.status === 'UPCOMING' ? 'bg-primary/20 text-primary border-primary/20 shadow-[0_0_10px_rgba(19,236,218,0.2)]' : 
                    'bg-white/5 text-white/30 border-white/10'
                  }`}>
                    {shift.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
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

export default MaidDashboard;
