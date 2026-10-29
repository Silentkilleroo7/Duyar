
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

const AdminSupport: React.FC<Props> = ({ onBack }) => {
  const [filter, setFilter] = useState<'Open' | 'Pending' | 'Resolved'>('Open');

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-x-hidden border-x border-white/5 shadow-2xl pb-10">
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-2xl p-6 pb-2 justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-primary flex size-11 shrink-0 items-center justify-center rounded-full glass border border-white/10 active:scale-90 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-primary text-xl font-black italic tracking-tighter uppercase italic flex-1 text-center pr-11">Command Center</h2>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-6 py-6 sticky top-[80px] z-40 bg-background-dark/80 backdrop-blur-xl">
        <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-white/5 p-1 border border-white/10 shadow-inner">
          {['Open', 'Pending', 'Resolved'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`flex-1 h-full rounded-xl text-[10px] font-black tracking-widest transition-all italic ${filter === tab ? 'bg-primary text-background-dark shadow-xl' : 'text-white/30 hover:text-white/50'}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-6 space-y-6 pb-32 no-scrollbar">
        {/* Active Ticket Expansion Preview */}
        <section className="glass rounded-[2.5rem] p-8 border border-primary/20 bg-primary/5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="absolute top-[-10%] right-[-10%] size-40 bg-primary/10 rounded-full blur-[60px]"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-primary text-background-dark italic shadow-lg">Active Case</span>
                <h3 className="text-white text-lg font-black italic tracking-tighter uppercase">#TK-842: Failure</h3>
              </div>
              <p className="text-white/40 text-[10px] font-bold mt-2 uppercase tracking-widest italic">User: Jane Cooper • <span className="text-red-500">High Priority</span></p>
            </div>
            <button className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/40"><span className="material-symbols-outlined">more_vert</span></button>
          </div>

          {/* Chat Thread Fragment */}
          <div className="space-y-6 mb-10 relative z-10">
            <div className="flex gap-4">
              <div className="size-10 rounded-2xl bg-slate-800 shrink-0 bg-cover bg-center border border-white/10" style={{backgroundImage: "url('')"}}></div>
              <div className="bg-white/5 border border-white/5 rounded-[1.5rem] rounded-tl-none p-4 text-xs font-medium text-white/90 leading-relaxed shadow-xl">
                I tried to upgrade my plan today but the transaction keeps failing. I've tried two different cards.
                <p className="text-[8px] text-white/20 font-black uppercase tracking-widest mt-2 italic text-right">12:45 PM</p>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <div className="bg-primary/10 border border-primary/20 rounded-[1.5rem] rounded-tr-none p-4 text-xs font-black italic text-primary leading-relaxed shadow-lg">
                <p className="text-[7px] font-black mb-1.5 opacity-60 uppercase tracking-widest">Internal Admin Note</p>
                Checking logs for CID-992... seems like a gateway timeout. Escalating.
                <p className="text-[8px] text-primary/40 font-black uppercase tracking-widest mt-2 italic text-right">12:50 PM</p>
              </div>
            </div>
          </div>

          {/* Admin Command Area */}
          <div className="space-y-4 relative z-10 border-t border-white/5 pt-8">
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="size-5 rounded-lg border-2 border-primary/20 group-hover:border-primary/50 transition-all flex items-center justify-center p-0.5">
                   <div className="size-full rounded-md bg-primary opacity-0 transition-opacity"></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors italic">Private Internal Note</span>
              </label>
              <span className="text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Awaiting Response</span>
            </div>
            <div className="relative">
              <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-white/10 focus:border-primary/50 focus:ring-0 outline-none transition-all resize-none shadow-inner" placeholder="Compose response..." rows={3}></textarea>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button className="h-14 bg-white/5 hover:bg-white/10 text-white/60 text-[9px] font-black uppercase tracking-widest italic rounded-2xl border border-white/10 transition-all">Assign</button>
              <button className="h-14 bg-primary/20 hover:bg-primary/30 text-primary text-[9px] font-black uppercase tracking-widest italic rounded-2xl border border-primary/30 transition-all">Escalate</button>
              <button className="h-14 bg-primary text-background-dark text-[9px] font-black uppercase tracking-[0.2em] italic rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">Resolve</button>
            </div>
          </div>
        </section>

        {/* List Feed Header */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-white text-base font-black italic uppercase tracking-widest border-l-4 border-primary pl-4">Pending Queue</h4>
            <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest italic">Sorted by Recency</span>
          </div>
          <div className="flex flex-col gap-3">
             {[
               { id: '#TK-841', label: 'Booking Change', user: 'Wade Warren', type: 'Booking', priority: 'Medium', pColor: 'text-yellow-500', bg: 'bg-yellow-500/10' },
               { id: '#TK-840', label: 'Login Issue', user: 'Esther Howard', type: 'Technical', priority: 'Low', pColor: 'text-primary', bg: 'bg-primary/10' }
             ].map((tk, i) => (
               <div key={i} className="glass p-5 rounded-[2rem] flex items-center justify-between border border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer group shadow-xl active:scale-98">
                  <div className="flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-all shadow-inner shrink-0">
                       <span className="material-symbols-outlined text-2xl font-black">confirmation_number</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                       <p className="text-white text-base font-black italic tracking-tighter uppercase leading-none truncate">{tk.id}: {tk.label}</p>
                       <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-2 italic">{tk.user} • {tk.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                     <div className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${tk.bg} ${tk.pColor} border-white/5`}>
                        {tk.priority}
                     </div>
                     <span className="text-[9px] text-white/20 font-black italic">Oct 24</span>
                  </div>
               </div>
             ))}
          </div>
        </section>
      </main>

      <style>{`
        .glass { background: rgba(16, 34, 32, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminSupport;
