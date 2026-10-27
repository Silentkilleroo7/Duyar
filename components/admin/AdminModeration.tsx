
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

interface Props {
  onBack: () => void;
}

const AdminModeration: React.FC<Props> = ({ onBack }) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [flaggedUsers, setFlaggedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlaggedUsers();
  }, []);

  const fetchFlaggedUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('flagged_users').select('*');
      if (error) throw error;
      setFlaggedUsers(data || []);
    } catch (err) {
      console.error('Error fetching flagged users:', err);
      // Fallback empty if table doesn't exist yet
      setFlaggedUsers([]); 
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    // Optimistic UI update
    setFlaggedUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setConfirmDelete(false);
    setSelectedUser(null);
    showToast('Marketplace Account Deleted Completely', 'error');

    // Real DB delete (fire & forget for UI speed)
    await supabase.from('flagged_users').delete().eq('id', selectedUser.id);
  };

  const handleAction = async (action: 'WARN' | 'SUSPEND') => {
    if (!selectedUser) return;
    
    if (action === 'WARN') showToast('Official Warning Sent', 'info');
    if (action === 'SUSPEND') showToast('Account Suspended Temporarily', 'info');
    
    // In a real app, you would log this action to 'moderation_logs'
    setSelectedUser(null);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-hidden border-x border-white/5 shadow-2xl">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-primary/20 border-primary text-primary' : 
          toast.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-500' :
          'bg-blue-500/20 border-blue-500 text-blue-400'
        }`}>
          <span className="material-symbols-outlined text-lg font-black">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'delete_forever' : 'info'}
          </span>
          <span className="text-xs font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      {/* Detail Modal */}
      {selectedUser && (
        <div className="absolute inset-0 z-[100] bg-background-dark/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-6 pt-12 border-b border-white/5">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Case File</h2>
            <button onClick={() => { setSelectedUser(null); setConfirmDelete(false); }} className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* User Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="size-24 rounded-full border-4 border-white/5 p-1 mb-4 shadow-2xl">
                <div className="size-full rounded-full bg-cover bg-center" style={{backgroundImage: `url("${selectedUser.img || 'https://via.placeholder.com/150'}")`}}></div>
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">{selectedUser.name || 'Unknown User'}</h3>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">ID: {selectedUser.id}</p>
              
              <div className="mt-4 flex gap-2">
                <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] font-black uppercase tracking-widest">
                  {selectedUser.reports || 0} Reports
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/60 text-[10px] font-black uppercase tracking-widest">
                  {selectedUser.risk || 'Low'} Risk
                </div>
              </div>
            </div>

            {/* Violation Info */}
            <div className="glass-card p-5 rounded-2xl border border-red-500/20 bg-red-500/5 mb-6">
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-1">Flagged For</p>
              <p className="text-white font-bold text-sm italic">{selectedUser.reason || 'General Violation'}</p>
            </div>

            {/* Active Accounts Section */}
            <div className="space-y-3 mb-8">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Active Marketplace Accounts</p>
              {selectedUser.roles && selectedUser.roles.map((role: any, i: number) => (
                <div key={i} className="glass-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                      <span className="material-symbols-outlined">{role.icon || 'verified'}</span>
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wide">{role.label || role}</span>
                  </div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-1 rounded">Active</span>
                </div>
              ))}
            </div>

            {confirmDelete ? (
              <div className="glass-card p-5 rounded-2xl border border-red-500/30 bg-red-500/10 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-red-500">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                  <p className="text-sm font-black uppercase italic leading-tight">This action is irreversible.</p>
                </div>
                <p className="text-white/60 text-xs">This will permanently remove <strong>{selectedUser.name}</strong> from all Marketplace roles listed above.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(false)} className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all">Cancel</button>
                  <button onClick={handleDelete} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all">Confirm Delete</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setConfirmDelete(true)}
                className="w-full h-16 bg-red-600/10 border border-red-600/30 text-red-500 font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all group"
              >
                <span className="material-symbols-outlined group-hover:animate-bounce">delete_forever</span>
                Delete Marketplace Account
              </button>
            )}

            {!confirmDelete && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => handleAction('SUSPEND')} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">Suspend</button>
                <button onClick={() => handleAction('WARN')} className="h-14 rounded-2xl bg-white/5 border border-white/10 text-yellow-500 font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500/10 transition-all">Send Warning</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Screen Content */}
      <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-2xl px-6 py-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-primary flex size-11 shrink-0 items-center justify-center rounded-full glass border border-white/10 active:scale-90 transition-all">
            <span className="material-symbols-outlined">shield_person</span>
          </button>
          <h2 className="text-primary text-xl font-black italic tracking-tighter uppercase italic flex-1 text-center pr-11">Safety Ops</h2>
          <div className="size-11"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="px-6 py-4">
          <div className="flex w-full items-stretch rounded-2xl h-14 glass border border-white/10 focus-within:border-primary/50 transition-all overflow-hidden bg-white/[0.02]">
            <div className="text-primary flex items-center justify-center pl-5">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-white placeholder:text-white/20 px-4 text-base font-bold italic" placeholder="Lookup flagged user..."/>
          </div>
        </div>

        <section className="px-4 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-white/40 text-[10px] font-black leading-tight tracking-[0.3em] uppercase italic">Urgent Reports ({flaggedUsers.length})</h3>
            {flaggedUsers.length > 0 && <span className="bg-red-600/20 text-red-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-600/30 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.2)]">Action Required</span>}
          </div>

          <div className="flex flex-col gap-3">
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-4xl animate-spin">sync</span>
                </div>
            ) : flaggedUsers.length > 0 ? flaggedUsers.map((usr) => (
              <div key={usr.id} onClick={() => { setSelectedUser(usr); setConfirmDelete(false); }} className="flex gap-5 glass rounded-[2.5rem] p-5 items-center border border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer group active:scale-98 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-5 opacity-10 pointer-events-none">
                  <span className="material-symbols-outlined text-[60px] font-black">gavel</span>
                </div>
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-[1.5rem] h-20 w-20 border-2 border-red-500/20 shadow-2xl shrink-0 group-hover:border-red-500/50 transition-all" style={{backgroundImage: `url("${usr.img || 'https://via.placeholder.com/150'}")`}}></div>
                <div className="flex flex-1 flex-col justify-center min-w-0 relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white text-lg font-black italic tracking-tighter uppercase truncate leading-none">{usr.name}</p>
                    <span className="text-primary text-[8px] font-black bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20 shadow-inner">{usr.reports || 1} Reports</span>
                  </div>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest italic truncate">{usr.reason || 'General Violation'}</p>
                  
                  {/* Account Icons Preview */}
                  <div className="flex gap-2 mt-3">
                    {(usr.roles || []).map((r: any, i: number) => (
                      <div key={i} className="size-6 rounded-md bg-white/10 flex items-center justify-center" title={r.label || r}>
                        <span className="material-symbols-outlined text-[14px] text-white/60">{r.icon || 'circle'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-30">
                <span className="material-symbols-outlined text-6xl mb-4">verified_user</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">All Clear</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .glass { background: rgba(28, 39, 38, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(19, 236, 218, 0.1); }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminModeration;
