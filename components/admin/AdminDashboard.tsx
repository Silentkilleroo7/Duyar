
import React, { useState, useEffect } from 'react';
import { Screen } from '../../types';
import { supabase } from '../../supabase';

interface Props {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
}

const AdminDashboard: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [urgentItems, setUrgentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricTimeframe, setMetricTimeframe] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');

  useEffect(() => {
    fetchUrgentTasks();
  }, []);

  const fetchUrgentTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('admin_tasks').select('*');
      if (error) throw error;
      setUrgentItems(data || []);
    } catch (err) {
      console.error("Fetch Tasks Error:", err);
      setUrgentItems([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (id: string, action: 'APPROVE' | 'REJECT', e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Optimistic UI Update
    setUrgentItems(prev => prev.filter(item => item.id !== id));
    setSelectedItem(null);

    if (action === 'APPROVE') {
      showToast('Approved Successfully', 'success');
      // Fire DB update in background
      // supabase.from('admin_tasks').delete().eq('id', id);
    } else {
      showToast('Request Rejected', 'error');
    }
  };

  const metrics = {
    DAILY: [
      { label: 'Approved Properties', value: 8, target: 15, color: 'bg-emerald-500' },
      { label: 'New User Signups', value: 24, target: 40, color: 'bg-blue-500' },
      { label: 'Successful Txns', value: 15, target: 20, color: 'bg-primary' }
    ],
    WEEKLY: [
      { label: 'Approved Properties', value: 45, target: 60, color: 'bg-emerald-500' },
      { label: 'New User Signups', value: 180, target: 250, color: 'bg-blue-500' },
      { label: 'Successful Txns', value: 112, target: 150, color: 'bg-primary' }
    ],
    MONTHLY: [
      { label: 'Approved Properties', value: 185, target: 200, color: 'bg-emerald-500' },
      { label: 'New User Signups', value: 850, target: 1000, color: 'bg-blue-500' },
      { label: 'Successful Txns', value: 540, target: 600, color: 'bg-primary' }
    ]
  };

  const currentMetrics = metrics[metricTimeframe];

  return (
    <div className="bg-background-dark font-display text-white min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden border-x border-white/5 shadow-2xl relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-primary/20 border-primary text-primary' : 'bg-red-500/20 border-red-500 text-red-500'}`}>
          <span className="material-symbols-outlined text-lg font-black">{toast.type === 'success' ? 'check_circle' : 'cancel'}</span>
          <span className="text-xs font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedItem && (
        <div className="absolute inset-0 z-[150] bg-background-dark/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-6 pt-12 border-b border-white/5">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Urgent Review</h2>
            <button onClick={() => setSelectedItem(null)} className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/10 bg-white/[0.02]">
              <div className="size-20 rounded-2xl bg-cover bg-center border border-white/10" style={{backgroundImage: `url("${selectedItem.img || 'https://via.placeholder.com/150'}")`}}></div>
              <div>
                <h3 className="text-lg font-black uppercase italic leading-none">{selectedItem.name}</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">{selectedItem.role}</p>
                <div className="mt-2 inline-block px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest">
                  {selectedItem.reason}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white/40 text-xs font-black uppercase tracking-[0.2em] ml-2">Documents Submitted</h3>
              {(selectedItem.docs || []).map((doc: string, i: number) => (
                <div key={i} className="glass-card rounded-2xl p-4 border border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center">
                       <span className="material-symbols-outlined text-white/40">description</span>
                    </div>
                    <p className="text-sm font-bold">{doc}</p>
                  </div>
                  <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">View</button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent flex gap-4 border-t border-white/5">
            <button onClick={() => handleAction(selectedItem.id, 'REJECT')} className="flex-1 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all active:scale-95">
              <span className="material-symbols-outlined">close</span> Reject
            </button>
            <button onClick={() => handleAction(selectedItem.id, 'APPROVE')} className="flex-[2] h-14 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95">
              <span className="material-symbols-outlined">check_circle</span> Approve
            </button>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 glass-panel border-b border-white/5 bg-background-dark/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg bg-primary/10 text-primary active:scale-95 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Duyar Admin</h1>
            <p className="text-[10px] text-primary uppercase tracking-widest font-semibold">Command Center</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onNavigate(Screen.ADMIN_NOTIFICATIONS)} className="relative p-2 rounded-full glass-card hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-white">notifications</span>
            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
          </button>
          <button onClick={() => onNavigate(Screen.ADMIN_ACTIVITY_LOG)} className="p-2 rounded-full glass-card hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-white">receipt_long</span>
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-4 pb-32">
        {/* Stats Summary Horizontal Scroll */}
        <section className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          <div onClick={() => onNavigate(Screen.ADMIN_LIVE_TRACKING)} className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 glass-card cursor-pointer border border-white/5 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-primary text-sm">local_shipping</span>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Active Jobs</p>
            <div className="flex items-end justify-between">
              <p className="text-white text-2xl font-bold leading-none">42</p>
              <p className="text-primary text-[10px] font-bold">+5%</p>
            </div>
          </div>
          <div onClick={() => onNavigate(Screen.ADMIN_APPROVALS)} className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 glass-card cursor-pointer border border-white/5 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-amber-400 text-sm">pending_actions</span>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Pending</p>
            <div className="flex items-end justify-between">
              <p className="text-white text-2xl font-bold leading-none">{urgentItems.length + 12}</p>
              <p className="text-primary text-[10px] font-bold">+12%</p>
            </div>
          </div>
          <div onClick={() => onNavigate(Screen.ADMIN_REVENUE)} className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 glass-card cursor-pointer border border-white/5 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-emerald-400 text-sm">account_balance_wallet</span>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Revenue</p>
            <div className="flex items-end justify-between">
              <p className="text-white text-2xl font-bold leading-none">৳ 120k</p>
              <p className="text-red-400 text-[10px] font-bold">-2%</p>
            </div>
          </div>
        </section>

        {/* Key Metrics Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white text-sm font-bold uppercase tracking-widest italic">Key Metrics</h3>
            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
              {['DAILY', 'WEEKLY', 'MONTHLY'].map((t) => (
                <button
                  key={t}
                  onClick={() => setMetricTimeframe(t as any)}
                  className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${metricTimeframe === t ? 'bg-primary text-background-dark' : 'text-white/40 hover:text-white'}`}
                >
                  {t[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-[1.5rem] p-5 border border-white/5 bg-white/[0.01] space-y-4">
            {currentMetrics.map((m, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{m.label}</p>
                  <p className="text-xs font-black text-white">{m.value} <span className="text-[8px] text-white/20 font-normal">/ {m.target}</span></p>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${m.color} rounded-full transition-all duration-500`} 
                    style={{ width: `${(m.value / m.target) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Tracking Map Preview */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary rounded-full"></span>
              <h3 className="text-white text-sm font-bold uppercase tracking-widest italic">Live Tracking Preview</h3>
            </div>
            <button onClick={() => onNavigate(Screen.ADMIN_LIVE_TRACKING)} className="text-primary text-[10px] font-black uppercase tracking-widest">Detail View</button>
          </div>
          <div onClick={() => onNavigate(Screen.ADMIN_LIVE_TRACKING)} className="relative w-full aspect-video rounded-3xl overflow-hidden glass-card border border-white/10 cursor-pointer group active:scale-98 transition-all">
            <div className="w-full h-full bg-center bg-no-repeat bg-cover opacity-60 transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: 'url("")'}}></div>
            <div className="absolute top-4 left-4 p-2 glass-panel rounded-lg text-[9px] font-black uppercase tracking-widest flex gap-2 items-center border border-primary/20">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(19,236,218,0.6)]"></span> 12 Providers Online
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-primary text-background-dark p-1.5 rounded-lg shadow-2xl animate-bounce">
                <span className="material-symbols-outlined text-sm font-black">local_shipping</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="grid grid-cols-3 gap-3">
          <button onClick={() => onNavigate(Screen.ADMIN_PAYOUTS)} className="flex flex-col items-start gap-2 p-4 rounded-2xl glass-card border-l-4 border-l-amber-400 border-white/5 hover:bg-white/5 transition-all group active:scale-95">
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400 group-hover:bg-amber-400 group-hover:text-background-dark transition-all">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase italic leading-none">Payouts</p>
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mt-1">Manual Cashout</p>
            </div>
          </button>
          <button onClick={() => onNavigate(Screen.ADMIN_WALLET)} className="flex flex-col items-start gap-2 p-4 rounded-2xl glass-card border-l-4 border-l-primary border-white/5 hover:bg-white/5 transition-all group active:scale-95">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background-dark transition-all">
              <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase italic leading-none">Recharge</p>
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mt-1">Manual Deposit</p>
            </div>
          </button>
          <button onClick={() => onNavigate(Screen.ADMIN_AD_PLACEMENT)} className="flex flex-col items-start gap-2 p-4 rounded-2xl glass-card border-l-4 border-l-white/20 border-white/5 hover:bg-white/5 transition-all group active:scale-95">
            <div className="p-2.5 rounded-xl bg-white/5 text-white/70 group-hover:bg-white group-hover:text-background-dark transition-all">
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase italic leading-none">Promote</p>
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-widest mt-1">Ad Placement</p>
            </div>
          </button>
        </section>

        {/* Urgent Feed */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white text-sm font-bold uppercase tracking-widest italic">Urgent Approvals</h3>
            {urgentItems.length > 0 && <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{urgentItems.length} Pending</span>}
          </div>
          <div className="flex flex-col gap-3">
            {loading ? (
                <div className="py-12 flex justify-center opacity-50">
                    <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                </div>
            ) : urgentItems.length > 0 ? urgentItems.map((item) => (
              <div key={item.id} onClick={() => setSelectedItem(item)} className="flex items-center gap-4 glass-card p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/5 transition-all cursor-pointer group active:scale-98">
                <div className="h-14 w-14 rounded-2xl border-2 border-primary/20 bg-cover bg-center shrink-0 shadow-lg" style={{backgroundImage: `url("${item.img || 'https://via.placeholder.com/150'}")`}}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-black uppercase italic truncate">{item.name}</p>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1.5">{item.role}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => handleAction(item.id, 'APPROVE', e)}
                    className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/20 hover:bg-primary hover:text-background-dark transition-all"
                  >
                    <span className="material-symbols-outlined text-lg font-black">check</span>
                  </button>
                  <button 
                    onClick={(e) => handleAction(item.id, 'REJECT', e)}
                    className="size-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-lg font-black">close</span>
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-12 flex flex-col items-center justify-center opacity-30 border border-white/5 rounded-2xl glass-card">
                <span className="material-symbols-outlined text-4xl mb-2">task_alt</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">All Clear</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Admin Panel Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto glass-panel border-t border-white/10 px-6 py-4 flex justify-between items-center z-[100] bg-background-dark/90 backdrop-blur-2xl">
        <button onClick={() => onNavigate(Screen.ADMIN_DASHBOARD)} className="flex flex-col items-center gap-1 text-primary active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl font-black">monitoring</span>
          <span className="text-[10px] font-black uppercase tracking-tighter italic">Live</span>
        </button>
        <button onClick={() => onNavigate(Screen.ADMIN_APPROVALS)} className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl">verified_user</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Queue</span>
        </button>
        <div className="relative -top-8">
          <button onClick={() => onNavigate(Screen.ADMIN_SUPPORT)} className="bg-primary text-background-dark h-16 w-16 rounded-[2rem] shadow-[0_0_30px_rgba(19,236,218,0.4)] flex items-center justify-center border-4 border-background-dark active:scale-90 transition-all group">
            <span className="material-symbols-outlined font-black text-3xl group-hover:rotate-12 transition-transform">headset_mic</span>
          </button>
        </div>
        <button onClick={() => onNavigate(Screen.ADMIN_PAYOUTS)} className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Payouts</span>
        </button>
        <button onClick={() => onNavigate(Screen.ADMIN_MODERATION)} className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-2xl">gavel</span>
          <span className="text-[10px] font-black uppercase tracking-tighter">Mods</span>
        </button>
      </nav>

      <style>{`
        .glass-panel { background: rgba(16, 34, 32, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
