
import React from 'react';

interface Props {
  onBack: () => void;
}

const AdminRevenue: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="relative min-h-screen max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-y-auto no-scrollbar pb-12 border-x border-white/5 shadow-2xl">
      {/* Intense Background Glow */}
      <div className="fixed top-0 left-0 w-full h-[60vh] bg-gradient-to-b from-primary/5 via-primary/[0.02] to-transparent pointer-events-none"></div>

      <header className="sticky top-0 z-50 glass-header border-b border-white/10 px-6 pt-12 pb-6 flex items-center justify-between bg-background-dark/80 backdrop-blur-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex size-11 items-center justify-center rounded-full glass border border-white/10 text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-primary">Revenue Center</h1>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mt-1 leading-none italic">Institutional Analytics</p>
          </div>
        </div>
        <button className="w-11 h-11 flex items-center justify-center rounded-full glass border border-white/10 text-white/60">
          <span className="material-symbols-outlined text-xl">ios_share</span>
        </button>
      </header>

      <main className="px-6 pt-8 space-y-7 relative z-10">
        {/* Timeframe Selector */}
        <section>
          <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em] mb-3 px-1 italic">Select Period</p>
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
             {['W', 'M', 'Q', 'Y'].map((t, i) => (
               <button key={i} className={`flex-1 h-10 rounded-xl text-[10px] font-black tracking-widest transition-all ${i === 0 ? 'bg-primary text-background-dark shadow-xl' : 'text-white/40'}`}>
                 {t}
               </button>
             ))}
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="glass-card p-5 rounded-[2rem] border border-white/5 bg-white/[0.01] shadow-xl">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 leading-none italic">Gross Revenue</p>
            <h3 className="text-2xl font-black italic tracking-tighter leading-none mt-2">৳ 0</h3>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="material-symbols-outlined text-primary text-[16px] font-black">trending_up</span>
              <span className="text-primary text-[10px] font-black">+0.0%</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-[2rem] border border-white/5 bg-white/[0.01] shadow-xl">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 leading-none italic">Commissions</p>
            <h3 className="text-2xl font-black italic tracking-tighter leading-none mt-2">৳ 0</h3>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="material-symbols-outlined text-primary text-[16px] font-black">trending_up</span>
              <span className="text-primary text-[10px] font-black">+0.0%</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-[2rem] border border-white/5 bg-white/[0.01] shadow-xl">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 leading-none italic">Ad Income</p>
            <h3 className="text-2xl font-black italic tracking-tighter leading-none mt-2">৳ 0</h3>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="material-symbols-outlined text-primary text-[16px] font-black">trending_up</span>
              <span className="text-primary text-[10px] font-black">+0.0%</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-[2rem] border-2 border-primary/30 bg-primary/5 shadow-[0_0_40px_rgba(19,236,218,0.1)]">
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1 leading-none italic">Net Profit</p>
            <h3 className="text-2xl font-black italic tracking-tighter leading-none mt-2 text-white">৳ 0</h3>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="material-symbols-outlined text-primary text-[16px] font-black">auto_awesome</span>
              <span className="text-primary text-[10px] font-black italic">Stable</span>
            </div>
          </div>
        </section>

        {/* SVG Trend Chart */}
        <section className="glass-card p-7 rounded-[2.5rem] border border-white/10 bg-black/40 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 px-1">
            <div>
              <h3 className="text-white text-xl font-black uppercase italic tracking-tighter leading-none">Yield Trend</h3>
              <p className="text-white/30 text-[10px] font-black uppercase mt-1 tracking-widest italic">Performance Audit</p>
            </div>
            <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined font-black">insights</span>
            </div>
          </div>
          
          <div className="relative h-44 w-full mt-2 flex items-center justify-center">
             <p className="text-white/20 font-black text-xs uppercase tracking-widest">No Data Available</p>
          </div>
          <div className="flex justify-between mt-6 px-1 border-t border-white/5 pt-4">
            {['MON', 'WED', 'FRI', 'SUN'].map((d, i) => (
              <span key={i} className={`text-[9px] font-black tracking-[0.2em] ${i === 2 ? 'text-primary' : 'text-white/20'}`}>{d}</span>
            ))}
          </div>
        </section>

        {/* Revenue Donut */}
        <section className="glass-card p-7 rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
          <h3 className="text-white text-base font-black uppercase tracking-widest italic mb-8 px-1">Global Sources</h3>
          <div className="flex items-center gap-10">
            <div className="relative size-32 flex items-center justify-center shrink-0">
              <div className="size-full rounded-full border-4 border-white/5"></div>
              <div className="absolute flex flex-col items-center leading-none">
                <span className="text-base font-black italic text-white/30">0%</span>
                <span className="text-[7px] uppercase text-white/30 font-black tracking-widest mt-1">Audit</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {[
                { label: 'Ad Placements', val: '0%', color: 'bg-white/10' },
                { label: 'Maintenance', val: '0%', color: 'bg-white/10' },
                { label: 'Pick & Drop', val: '0%', color: 'bg-white/10' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-white/40">{item.label}</span>
                    <span className="text-white/40">{item.val}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full">
                    <div className={`h-full ${item.color} rounded-full`} style={{width: '0%'}}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .glass-card { background: rgba(28, 39, 38, 0.4); backdrop-filter: blur(12px); }
        .glass-header { background: rgba(10, 17, 16, 0.85); }
      `}</style>
    </div>
  );
};

export default AdminRevenue;
