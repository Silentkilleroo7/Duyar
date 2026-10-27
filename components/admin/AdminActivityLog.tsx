
import React from 'react';

interface Props {
  onBack: () => void;
}

const AdminActivityLog: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-x-hidden border-x border-white/5 bg-background-dark font-display text-white selection:bg-primary/30 shadow-2xl">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass bg-background-dark/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center p-6 pb-2 justify-between">
          <button onClick={onBack} className="text-primary flex size-11 shrink-0 items-center justify-center rounded-full glass hover:bg-white/10 transition-all active:scale-90 border border-white/10">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-primary text-sm font-black leading-tight tracking-[0.3em] flex-1 text-center uppercase italic">Audit Trail</h2>
          <button className="flex items-center justify-center size-11 rounded-xl glass text-white/60">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { icon: 'person', label: 'All Admins' },
            { icon: 'shield_person', label: 'Approvals', active: true },
            { icon: 'calendar_today', label: 'Past 24h' }
          ].map((chip, i) => (
            <button key={i} className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-2xl border px-5 transition-all ${chip.active ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
              <span className="material-symbols-outlined text-[18px]">{chip.icon}</span>
              <p className="text-[10px] font-black uppercase tracking-widest italic">{chip.label}</p>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 pb-32">
        {/* Security Alerts Banner */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[#ff5c5c] text-[10px] font-black leading-normal tracking-[0.3em] uppercase italic px-1">Security Pulse</h4>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-[#ff5c5c]/50 to-transparent ml-4 opacity-30"></div>
          </div>
          <div className="glass rounded-[2rem] border-red-500/20 bg-red-500/5 p-6 mb-8 shadow-[0_0_50px_rgba(239,68,68,0.05)] relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-10%] size-24 bg-red-600/10 rounded-full blur-2xl"></div>
            <div className="flex items-start justify-between gap-5 relative z-10">
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-[#ff5c5c] text-[9px] font-black uppercase tracking-[0.3em] italic">Critical Action Detected</p>
                <p className="text-white text-base font-black italic tracking-tighter uppercase mt-2">Mass Action: 15 Bans Processed</p>
                <p className="text-white/30 text-[10px] font-bold mt-2 uppercase tracking-widest">Operator: John Doe • 2m ago</p>
              </div>
              <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 text-red-500 shadow-xl border border-red-500/20 active:scale-90 transition-all">
                <span className="material-symbols-outlined font-black">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Latest Activity Feed */}
        <div className="px-6">
          <h3 className="text-white text-lg font-black italic uppercase tracking-tighter mb-1 px-1">Global Audit Feed</h3>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest px-1 italic">Real-time logging enabled</p>
        </div>

        <div className="flex flex-col gap-4 p-6">
          {/* Detailed Log Card with Diff */}
          <div className="glass p-6 rounded-[2.5rem] flex flex-col gap-5 border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-center bg-cover border-2 border-primary/30 shadow-xl" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA1IMWrFm2E0mw2t6EKr9DRd71tVe-75TC3XRaQXVZHUas3KnPIgGBAL8cQvm7bZMpyLElFfgwEkp2EUH7X8tIS8Y_1ZNPzl9UyMllfZQufQronJjv7fxzANUsjQpj4wV8eXLZuNcGBQztNZ4etVJ3Sxnxdi6ACS7tKr09GgbX9SRcKEDWUgeHaJ_kDnuF3j9UlJ7OVkwAJ6dTyUllk4Vcvy_Emf9OZf6Pbr86kgT8K3MimqToCPk8uJwsSXPq4YXg4bLG9lOq8W_k')"}}></div>
                <div>
                  <p className="text-white text-sm font-black uppercase italic tracking-tighter leading-none">Mike Ross</p>
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mt-1.5 italic">Finance Manager</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] font-mono leading-none italic">13:45:12</p>
                <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mt-1">Status: Logged</p>
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-primary text-sm font-black italic uppercase tracking-tighter">Updated Payout Milestone</p>
              <div className="mt-5 bg-black/50 backdrop-blur-3xl rounded-3xl p-6 border border-white/5 shadow-inner">
                <div className="flex flex-col gap-3 font-mono text-[10px]">
                  <div className="grid grid-cols-1 gap-2">
                    <span className="text-red-400/80 line-through">- status: "pending"</span>
                    <span className="text-emerald-400 font-bold">+ status: "completed"</span>
                  </div>
                  <div className="h-px bg-white/5 w-full my-1"></div>
                  <div className="grid grid-cols-1 gap-2">
                    <span className="text-red-400/80 line-through">- amount: 450.00</span>
                    <span className="text-emerald-400 font-bold">+ amount: 475.00</span>
                  </div>
                  <div className="text-white/20 italic pt-2 mt-2 border-t border-white/5">
                    // Auth: Adjustment for gateway fee
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 relative z-10">
              <div className="flex gap-4">
                <span className="text-[9px] text-white/30 font-mono italic">IP: 45.12.89.231</span>
                <span className="text-[9px] text-white/30 font-mono italic">Client: iOS 17.4</span>
              </div>
              <span className="bg-primary/90 backdrop-blur-xl text-background-dark text-[9px] font-black px-3 py-1 rounded-lg uppercase italic shadow-lg">Verified Session</span>
            </div>
          </div>

          {/* Simple Log Card */}
          <div className="glass p-5 rounded-[2rem] flex flex-col gap-4 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer group active:scale-98 shadow-xl animate-in fade-in duration-700 delay-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-center bg-cover border border-white/10 grayscale group-hover:grayscale-0 transition-all shadow-lg" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCzWZmwfWO9M_6tr0k8WqUOLAfGAWP2YA4Du4-86MZbeiYiQowjHvuF_k_OyoeKkYyJRz3Bnw21fMfRkXwMWLrPE2H8d8kBaOQC-Pdh5bXQ82IcF0gZQn6SAElVTnHSe877baibqO3onPJ36aolZrxmB31mTypo5uJZsYXRZhvJgHslpHzqHsej8xeyY9hy0WRmYMrvTqKjk82hvA2CCHovawhXaSbdP1_ygP8Y0_eRgOMYiBpa2Wld5_Yc50CSGdWwNVrJizA4Lf4')"}}></div>
                <div>
                  <p className="text-white text-xs font-black uppercase italic tracking-tighter">Sarah Jenkins</p>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] italic">Senior Mod</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/30 text-[9px] font-mono italic">14:22:01</p>
              </div>
            </div>
            <div>
              <p className="text-primary text-sm font-black italic tracking-tighter uppercase">Approved Landlord Application</p>
              <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-2">Target ID: <span className="text-white/70 font-mono not-italic">USR-882-X9</span></p>
            </div>
            <div className="flex justify-end pt-2 border-t border-white/5">
              <button className="text-primary text-[10px] font-black italic uppercase tracking-widest flex items-center gap-1.5 hover:brightness-110">
                FULL LOG <span className="material-symbols-outlined text-[14px]">unfold_more</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .glass { background: rgba(16, 34, 32, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminActivityLog;
