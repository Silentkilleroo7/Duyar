
import React, { useState, useEffect } from 'react';
import { 
  getStoredApplications, 
  subscribeToApplications, 
  approveProviderApplication, 
  rejectProviderApplication, 
  ProviderRoleKey,
  ProviderApplication
} from '../../providerApplicationsStorage';

interface Props {
  onBack: () => void;
}

const AdminApprovals: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<ProviderRoleKey>('Landlords');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Load applications from persistent storage with real-time sync
  const [data, setData] = useState<Record<ProviderRoleKey, ProviderApplication[]>>(() => getStoredApplications());

  useEffect(() => {
    const unsub = subscribeToApplications((updated) => {
      setData(updated);
    });
    return unsub;
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'APPROVE') {
      approveProviderApplication(id);
      if (activeTab === 'Landlords') {
        showToast('Landlord Verified & All Properties Marked Verified on Map!', 'success');
      } else if (activeTab === 'Ads') {
        showToast('Ad Approved & Verified Badge Activated on Map!', 'success');
      } else {
        showToast(`${activeTab} Partner Approved! Broadcasted Requests Unlocked`, 'success');
      }
    } else {
      rejectProviderApplication(id);
      showToast('Application Rejected', 'error');
    }
    
    setSelectedItem(null);
  };

  const currentItems = data[activeTab];

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-hidden border-x border-white/5 shadow-2xl">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-primary/20 border-primary text-primary' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
          <span className="material-symbols-outlined text-lg font-black">{toast.type === 'success' ? 'check_circle' : 'cancel'}</span>
          <span className="text-xs font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      {/* Document Modal */}
      {selectedItem && (
        <div className="absolute inset-0 z-[100] bg-background-dark/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-6 pt-12">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Document View</h2>
            <button onClick={() => setSelectedItem(null)} className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/10">
              <div className="size-16 rounded-xl bg-cover bg-center border border-white/10" style={{backgroundImage: `url("${selectedItem.img}")`}}></div>
              <div>
                <h3 className="text-lg font-black uppercase italic leading-none">{selectedItem.name}</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">{selectedItem.role}</p>
                <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-2">{selectedItem.id}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white/40 text-xs font-black uppercase tracking-[0.2em] ml-2">Submitted Documents</h3>
              {selectedItem.docs.map((doc: string, i: number) => (
                <div key={i} className="glass-card rounded-2xl p-4 border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-white/40">description</span>
                      <p className="text-sm font-bold">{doc}</p>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-500 text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-widest">Scanned</span>
                  </div>
                  <div className="w-full h-40 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 relative overflow-hidden group">
                     {/* Mock Doc Image */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                        <span className="material-symbols-outlined text-4xl mb-2">image</span>
                        <span className="text-[10px] uppercase tracking-widest">Preview Unavailable</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-t from-background-dark to-transparent flex gap-4">
            <button onClick={() => handleAction(selectedItem.id, 'REJECT')} className="flex-1 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95">
              <span className="material-symbols-outlined">close</span> Reject
            </button>
            <button onClick={() => handleAction(selectedItem.id, 'APPROVE')} className="flex-[2] h-14 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95">
              <span className="material-symbols-outlined">check_circle</span> Approve
            </button>
          </div>
        </div>
      )}

      {/* Main Screen Content */}
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center p-6 pb-2 justify-between">
          <button onClick={onBack} className="flex size-11 shrink-0 items-center justify-center rounded-full glass border border-white/10 active:scale-90 transition-all text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-primary text-xl font-black italic tracking-tighter uppercase italic flex-1 text-center pr-12">Approval Desk</h2>
          <div className="size-11"></div>
        </div>

        <div className="px-6 mt-4">
          <div className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-2">
            {['Landlords', 'Maids', 'Security', 'Maintenance', 'PickDrop', 'Locators', 'Ads'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex flex-col items-center justify-center pb-2 pt-2 whitespace-nowrap transition-all group ${activeTab === tab ? 'text-primary' : 'text-white/30 hover:text-white/60'}`}
              >
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${activeTab === tab ? 'opacity-100 scale-105' : 'opacity-80'}`}>
                  {tab === 'PickDrop' ? 'Logistics' : tab}
                </p>
                <div className={`h-1 w-full rounded-full bg-primary mt-2 shadow-[0_0_10px_rgba(19,236,218,0.6)] transition-all duration-300 transform ${activeTab === tab ? 'scale-100' : 'scale-0 opacity-0'}`}></div>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-12">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {currentItems.length > 0 ? currentItems.map((item: any) => (
            <div key={item.id} className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 bg-white/[0.01] shadow-2xl relative">
              <div className="p-6 flex gap-5 items-center">
                <div className="relative shrink-0">
                  <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-[1.5rem] h-20 w-20 border-2 border-primary/20 shadow-2xl" style={{backgroundImage: `url("${item.img}")`}}></div>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-background-dark rounded-full size-7 flex items-center justify-center border-4 border-background-dark shadow-lg">
                    <span className="material-symbols-outlined text-[14px] font-black">verified</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white text-lg font-black italic tracking-tighter uppercase leading-none truncate">{item.name}</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${item.tag === 'NEW' ? 'bg-primary/20 text-primary border-primary/20' : 'bg-red-600/10 text-red-500 border-red-600/20 shadow-[0_0_10px_rgba(220,38,38,0.2)] animate-pulse'}`}>{item.tag}</span>
                  </div>
                  <p className="text-primary text-[9px] font-black uppercase tracking-widest mb-1 italic">{item.role}</p>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-relaxed">Docs: {item.docs.length} Attached</p>
                  <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-1.5 italic">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {item.date}
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button 
                  onClick={() => setSelectedItem(item)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-2xl h-14 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all border border-white/10 active:scale-95"
                >
                  VIEW DOCUMENTS
                </button>
                <button 
                  onClick={() => handleAction(item.id, 'APPROVE')}
                  className="flex-[1.2] bg-primary text-background-dark hover:brightness-110 rounded-2xl h-14 text-[10px] font-black uppercase tracking-[0.2em] italic shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                  APPROVE {activeTab === 'Ads' ? 'AD' : 'PARTNER'}
                </button>
                <button 
                  onClick={() => handleAction(item.id, 'REJECT')}
                  className="size-14 rounded-2xl bg-red-600/10 text-red-500 border border-red-600/20 flex items-center justify-center active:scale-95 transition-all hover:bg-red-600/20"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
          )) : (
             <div className="py-20 flex flex-col items-center justify-center opacity-30">
                <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Pending Requests</p>
             </div>
          )}
        </div>
      </main>

      <style>{`
        .glass-card { background: rgba(28, 39, 38, 0.4); backdrop-filter: blur(12px); }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminApprovals;
