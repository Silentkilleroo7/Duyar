
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

const AdminAdPlacement: React.FC<Props> = ({ onBack }) => {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Promotions State
  const [activeSlots, setActiveSlots] = useState([
    { id: 'DY-8829', title: 'Luxury Penthouse', img: '', type: 'Platinum' },
    { id: 'DY-4412', title: 'Banani Commercial', img: '', type: 'Gold' }
  ]);

  // Pending Queue State
  const [queue, setQueue] = useState([
    { id: 'DY-9921', title: 'Downtown Loft', owner: 'alex_realty', price: '৳ 4,900', duration: '7 Days', plan: 'Gold Boost', img: '', paymentProof: '', trxId: 'TRX-7721-X' },
    { id: 'DY-3310', title: 'Villa w/ Pool', owner: 'estates_pro', price: '৳ 12,000', duration: '30 Days', plan: 'Platinum Boost', img: '', paymentProof: '', trxId: 'BKASH-992' },
    { id: 'DY-1102', title: 'Studio Flat', owner: 'shafi_k', price: '৳ 2,500', duration: '3 Days', plan: 'Silver Boost', img: '', paymentProof: '', trxId: 'NAGAD-110' }
  ]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (item: any, action: 'APPROVE' | 'REJECT') => {
    if (action === 'APPROVE') {
      if (activeSlots.length >= 4) {
        showToast('Slots Full! Remove an active ad first.', 'error');
        return;
      }
      setActiveSlots(prev => [...prev, { id: item.id, title: item.title, img: item.img, type: item.plan }]);
      setQueue(prev => prev.filter(i => i.id !== item.id));
      showToast('Boost Approved & Active', 'success');
    } else {
      setQueue(prev => prev.filter(i => i.id !== item.id));
      showToast('Request Rejected', 'error');
    }
    setSelectedAd(null);
  };

  const handleRemoveActive = (id: string) => {
    if (confirm('Stop this promotion?')) {
      setActiveSlots(prev => prev.filter(s => s.id !== id));
      showToast('Promotion Stopped', 'success');
    }
  };

  const filteredQueue = queue.filter(q => q.id.toLowerCase().includes(searchQuery.toLowerCase()) || q.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-hidden border-x border-white/5 shadow-2xl">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-primary/20 border-primary text-primary' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
          <span className="material-symbols-outlined text-lg font-black">{toast.type === 'success' ? 'check_circle' : 'cancel'}</span>
          <span className="text-xs font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      {/* Verification Modal */}
      {selectedAd && (
        <div className="absolute inset-0 z-[100] bg-background-dark/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-6 pt-12 border-b border-white/5">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Verify Boost</h2>
            <button onClick={() => setSelectedAd(null)} className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Ad Preview */}
            <div className="glass-card rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.02]">
              <div className="relative h-48 w-full">
                <img src={selectedAd.img} className="w-full h-full object-cover" alt="Ad" />
                <div className="absolute bottom-4 left-4 bg-primary text-background-dark px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">
                  {selectedAd.plan}
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black italic uppercase tracking-tight">{selectedAd.title}</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">ID: {selectedAd.id}</p>
                  <p className="text-primary text-sm font-black italic">{selectedAd.price} <span className="text-white/40 font-normal">/ {selectedAd.duration}</span></p>
                </div>
              </div>
            </div>

            {/* Payment Proof */}
            <div className="space-y-3">
              <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] ml-2">Payment Proof</h3>
              <div className="glass-card rounded-2xl p-4 border border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-white/40">receipt_long</span>
                    <div>
                      <p className="text-xs font-bold text-white">Transaction Screenshot</p>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">{selectedAd.trxId}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-500 text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-widest">Uploaded</span>
                </div>
                <div className="w-full h-48 bg-black/40 rounded-xl overflow-hidden border border-white/5 relative group cursor-pointer" onClick={() => window.open(selectedAd.paymentProof, '_blank')}>
                   <img src={selectedAd.paymentProof} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Proof" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-3xl">visibility</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent flex gap-4 border-t border-white/5">
            <button onClick={() => handleAction(selectedAd, 'REJECT')} className="flex-1 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95">
              <span className="material-symbols-outlined">close</span> Reject
            </button>
            <button onClick={() => handleAction(selectedAd, 'APPROVE')} className="flex-[2] h-14 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95">
              <span className="material-symbols-outlined">check_circle</span> Approve Boost
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-2xl p-6 pb-4 border-b border-primary/20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-primary flex size-11 shrink-0 items-center justify-center rounded-full glass hover:bg-white/10 transition-all border border-primary/20 active:scale-90">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-primary text-base font-black italic tracking-widest uppercase italic flex-1 text-center pr-11">Promotion Engine</h2>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
        {/* Search Context */}
        <section>
          <div className="flex w-full items-stretch rounded-2xl h-14 bg-black/40 border border-primary/20 focus-within:border-primary transition-all overflow-hidden shadow-inner">
            <div className="text-primary flex items-center justify-center pl-5">
              <span className="material-symbols-outlined font-black">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-white placeholder:text-primary/30 px-4 text-base font-bold italic" 
              placeholder="Lookup Ad ID..."
            />
          </div>
        </section>

        {/* Active Featured Slots */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] italic">Featured Inventory</h3>
            <span className="text-primary text-[9px] font-black px-3 py-1 rounded-full bg-primary/10 border border-primary/30 uppercase tracking-widest shadow-inner">{activeSlots.length} / 4 Active Slots</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {activeSlots.map((slot, i) => (
              <div key={slot.id} className="relative group aspect-square rounded-[2rem] overflow-hidden border-2 border-primary/40 shadow-[0_0_30px_rgba(19,236,218,0.15)] bg-cover bg-center flex flex-col justify-end p-5 transition-transform active:scale-98" style={{backgroundImage: `linear-gradient(0deg, rgba(16, 34, 32, 0.95) 0%, rgba(16, 34, 32, 0) 70%), url("${slot.img}")`}}>
                <div className="absolute top-4 right-4 bg-primary size-2.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(19,236,218,0.8)] border-2 border-background-dark"></div>
                <button onClick={(e) => { e.stopPropagation(); handleRemoveActive(slot.id); }} className="absolute top-4 left-4 text-red-500 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-sm font-black">close</span></button>
                <p className="text-primary text-xs font-black italic uppercase tracking-widest leading-none">Slot {i+1}: Active</p>
                <p className="text-white/50 text-[9px] font-bold tracking-widest uppercase mt-1.5 truncate">{slot.title}</p>
              </div>
            ))}

            {activeSlots.length < 4 && (
              <button className="aspect-square rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all group cursor-not-allowed opacity-50">
                <span className="material-symbols-outlined text-primary/40 text-4xl group-hover:scale-110 transition-transform">add_circle</span>
                <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em] italic">Empty Slot</p>
              </button>
            )}
          </div>
        </section>

        {/* Boost Queue */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                 <span className="material-symbols-outlined text-yellow-500 text-xl font-black">rocket_launch</span>
                 Boost Authorization
              </h3>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">{filteredQueue.length} Requests Queued</span>
           </div>
           
           <div className="space-y-3">
              {filteredQueue.length > 0 ? filteredQueue.map((item, i) => (
                <div key={item.id} onClick={() => setSelectedAd(item)} className="glass-card rounded-3xl p-4 flex items-center gap-5 border border-white/5 bg-white/[0.01] shadow-xl hover:bg-white/[0.03] transition-all cursor-pointer group active:scale-98">
                   <div className="size-16 rounded-2xl bg-cover bg-center border border-white/10 shadow-lg shrink-0 grayscale group-hover:grayscale-0 transition-all duration-500" style={{backgroundImage: `url("${item.img}")`}}></div>
                   <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-black italic uppercase tracking-tighter truncate leading-none">{item.title}</p>
                      <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mt-2 italic">User: {item.owner} • <span className="text-primary">{item.price}</span></p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedAd(item); }} className="size-11 rounded-xl bg-white/5 text-white/60 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined font-black">visibility</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleAction(item, 'APPROVE'); }} className="size-11 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary hover:text-background-dark transition-all">
                        <span className="material-symbols-outlined font-black">check</span>
                      </button>
                   </div>
                </div>
              )) : (
                <div className="py-12 flex flex-col items-center justify-center opacity-30">
                  <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Queue Empty</p>
                </div>
              )}
           </div>
        </section>
      </main>

      {/* Primary Action Sticky */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-50 flex gap-3">
         <button className="flex-1 h-18 rounded-[2.5rem] bg-primary text-background-dark text-sm font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-4 shadow-[0_15px_40px_rgba(19,236,218,0.3)] transition-all active:scale-98">
           <span className="material-symbols-outlined font-black">publish</span>
           Update Placement
         </button>
         <button className="size-18 rounded-[2.5rem] bg-white/5 border border-white/10 text-red-500 flex items-center justify-center active:scale-95 transition-all">
           <span className="material-symbols-outlined text-2xl font-black">delete</span>
         </button>
      </div>

      <style>{`
        .glass-card { background: rgba(40, 57, 55, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(19, 236, 218, 0.1); }
        .h-18 { height: 4.5rem; }
        .size-18 { width: 4.5rem; height: 4.5rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminAdPlacement;
