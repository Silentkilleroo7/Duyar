import React, { useState, useEffect } from 'react';
import { 
  getPayoutRequests, 
  updatePayoutStatus, 
  PayoutRequest, 
  PayoutStatus 
} from '../../payoutStorage';

interface Props {
  onBack: () => void;
}

const METHOD_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  bKash: { bg: 'bg-[#E2136E]/15', text: 'text-[#E2136E]', border: 'border-[#E2136E]/30' },
  Nagad: { bg: 'bg-[#FF5520]/15', text: 'text-[#FF5520]', border: 'border-[#FF5520]/30' },
  Upay: { bg: 'bg-[#0056A3]/20', text: 'text-[#38BDF8]', border: 'border-[#0056A3]/40' },
  Rocket: { bg: 'bg-[#8C3494]/15', text: 'text-[#C084FC]', border: 'border-[#8C3494]/30' }
};

const AdminPayouts: React.FC<Props> = ({ onBack }) => {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedReq, setSelectedReq] = useState<PayoutRequest | null>(null);
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PROCESSED'>('ALL');
  
  // Manual processing modal state
  const [processModalReq, setProcessModalReq] = useState<PayoutRequest | null>(null);
  const [adminTrxId, setAdminTrxId] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processingSubmit, setProcessingSubmit] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const data = await getPayoutRequests();
      setRequests(data);
    } catch (err) {
      console.error("Fetch Payouts Error:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCopy = (text: string, field: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleOpenProcessModal = (req: PayoutRequest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProcessModalReq(req);
    setAdminTrxId(`TRX${Math.floor(10000000 + Math.random() * 90000000)}`);
    setAdminNotes(`Manual payout completed via ${req.method} agent`);
  };

  const handleConfirmManualProcess = async () => {
    if (!processModalReq) return;
    setProcessingSubmit(true);

    try {
      await updatePayoutStatus(processModalReq.id, 'PROCESSED', {
        adminTrxId: adminTrxId.trim(),
        adminNotes: adminNotes.trim()
      });

      setRequests(prev => prev.map(r => 
        r.id === processModalReq.id 
          ? { ...r, status: 'PROCESSED', adminTrxId: adminTrxId.trim(), adminNotes: adminNotes.trim(), processed_at: new Date().toISOString() } 
          : r
      ));

      showToast(`Payout of ৳${processModalReq.amount} marked as Manually Paid via ${processModalReq.method}`, 'success');
      setProcessModalReq(null);
      setSelectedReq(null);
    } catch (err) {
      showToast('Failed to update payout status', 'error');
    } finally {
      setProcessingSubmit(false);
    }
  };

  const handleAction = async (id: string, action: PayoutStatus, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (action === 'PROCESSED') {
      const target = requests.find(r => r.id === id);
      if (target) {
        handleOpenProcessModal(target, e);
        return;
      }
    }

    try {
      await updatePayoutStatus(id, action);

      if (action === 'REJECTED') {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
        showToast('Payout Request Rejected', 'error');
      } else if (action === 'HOLD') {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'HOLD' } : r));
        showToast('Request put on Hold for verification', 'info');
      }
    } catch (err) {
      showToast('Action failed', 'error');
    }
    setSelectedReq(null);
  };

  const handleBatchRelease = async () => {
    const pendingList = requests.filter(r => r.status === 'PENDING');
    if (pendingList.length === 0) return;

    for (const r of pendingList) {
      await updatePayoutStatus(r.id, 'PROCESSED', {
        adminTrxId: `BATCH-${Date.now().toString().slice(-6)}`,
        adminNotes: 'Batch manual payout processed'
      });
    }

    setRequests(prev => prev.map(r => r.status === 'PENDING' ? { ...r, status: 'PROCESSED' } : r));
    showToast(`${pendingList.length} Payouts Marked as Processed`, 'success');
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pendingAmount = pendingRequests.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const displayedRequests = requests.filter(r => {
    if (filter === 'PENDING') return r.status === 'PENDING';
    if (filter === 'PROCESSED') return r.status === 'PROCESSED';
    return true;
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-x-hidden border-x border-white/5 shadow-2xl pb-32">
      <div className="absolute inset-0 map-overlay opacity-10 pointer-events-none"></div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[200] max-w-[90%] px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-primary/20 border-primary text-primary backdrop-blur-xl' : 
          toast.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-400 backdrop-blur-xl' :
          'bg-blue-500/20 border-blue-500 text-blue-400 backdrop-blur-xl'
        }`}>
          <span className="material-symbols-outlined text-lg font-black shrink-0">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'cancel' : 'info'}
          </span>
          <span className="text-xs font-bold leading-tight">{toast.msg}</span>
        </div>
      )}

      {/* Manual Processing Confirmation Modal */}
      {processModalReq && (
        <div className="fixed inset-0 z-[180] bg-background-dark/95 backdrop-blur-2xl flex flex-col justify-end max-w-[430px] mx-auto animate-in fade-in duration-200">
          <div className="p-6 bg-gradient-to-b from-[#152e2b] to-background-dark rounded-t-[2.5rem] border-t border-white/10 space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black">
                  <span className="material-symbols-outlined text-base">payments</span>
                </span>
                <h3 className="text-lg font-black italic uppercase tracking-tight">Manual Payment Proceed</h3>
              </div>
              <button 
                onClick={() => setProcessModalReq(null)}
                className="size-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Instruction box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-white/80 space-y-1">
              <p className="font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">info</span>
                Admin Action Required
              </p>
              <p>
                Open your <span className="text-white font-bold">{processModalReq.method}</span> business / merchant / agent app and manually transfer money to the destination number below.
              </p>
            </div>

            {/* Transfer details card with Copy */}
            <div className="p-5 rounded-2xl glass-card border border-white/10 space-y-3 bg-white/[0.02]">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-white/40 text-xs font-bold uppercase">Payment Option</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${
                  METHOD_STYLES[processModalReq.method]?.bg || 'bg-white/10'
                } ${METHOD_STYLES[processModalReq.method]?.text || 'text-white'} ${METHOD_STYLES[processModalReq.method]?.border || 'border-white/20'}`}>
                  {processModalReq.method}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/40 text-xs font-bold uppercase">Destination Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-primary">{processModalReq.accountNumber}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(processModalReq.accountNumber, 'num')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1"
                    title="Copy number"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedField === 'num' ? 'check' : 'content_copy'}
                    </span>
                    {copiedField === 'num' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/40 text-xs font-bold uppercase">Amount to Send</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white">৳ {processModalReq.amount.toLocaleString()}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(processModalReq.amount.toString(), 'amt')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedField === 'amt' ? 'check' : 'content_copy'}
                    </span>
                    {copiedField === 'amt' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                <span className="text-white/40 font-bold uppercase">Recipient</span>
                <span className="text-white font-bold">{processModalReq.user_name} ({processModalReq.user_phone})</span>
              </div>
            </div>

            {/* Inputs: TrxID and Note */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">
                  Manual Bank / App TrxID
                </label>
                <input 
                  type="text"
                  value={adminTrxId}
                  onChange={(e) => setAdminTrxId(e.target.value)}
                  placeholder="e.g. 9J29XLA891"
                  className="w-full h-12 px-4 rounded-xl glass-card border border-white/10 font-mono text-sm text-white focus:border-primary focus:ring-0 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 block mb-1">
                  Admin Resolution Note
                </label>
                <input 
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Sent via agent counter"
                  className="w-full h-12 px-4 rounded-xl glass-card border border-white/10 text-xs text-white focus:border-primary focus:ring-0 outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setProcessModalReq(null)}
                className="flex-1 h-14 rounded-2xl bg-white/10 text-white font-black uppercase tracking-wider text-xs hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingSubmit}
                onClick={handleConfirmManualProcess}
                className="flex-[2] h-14 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined font-black">check_circle</span>
                {processingSubmit ? 'SAVING...' : 'CONFIRM PAYMENT SENT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedReq && !processModalReq && (
        <div className="fixed inset-0 z-[150] bg-background-dark/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300 max-w-[430px] mx-auto">
          <div className="flex items-center justify-between p-6 pt-12 border-b border-white/5">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Withdrawal Audit</h2>
            <button onClick={() => setSelectedReq(null)} className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="glass-card rounded-[2rem] p-6 border border-white/10 bg-white/[0.02]">
               <div className="flex items-center gap-4 mb-6">
                  <div className="size-16 rounded-2xl bg-cover bg-center border-2 border-primary/20 shadow-lg flex items-center justify-center bg-primary/10 text-primary font-black text-xl">
                    {selectedReq.user_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                     <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">{selectedReq.user_name}</h3>
                     <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1.5">{selectedReq.user_phone}</p>
                     <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                           selectedReq.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
                           selectedReq.status === 'PROCESSED' ? 'bg-primary/10 border-primary/20 text-primary' : 
                           'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>{selectedReq.status}</span>
                        <span className="text-[10px] text-white/30 font-mono">
                          {new Date(selectedReq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div>
                     <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Requested Amount</p>
                     <p className="text-primary text-3xl font-black italic tracking-tight">৳ {selectedReq.amount.toLocaleString()}</p>
                  </div>
                  <div>
                     <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Destination Option & Number</p>
                     <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{selectedReq.method}:</span>
                          <span className="font-mono text-sm text-primary font-bold">{selectedReq.accountNumber}</span>
                        </div>
                        <button 
                          onClick={() => handleCopy(selectedReq.accountNumber, 'num_audit')}
                          className="text-[10px] uppercase font-bold text-white/60 hover:text-white"
                        >
                          {copiedField === 'num_audit' ? 'Copied' : 'Copy'}
                        </button>
                     </div>
                  </div>
                  {selectedReq.userNotes && (
                    <div>
                      <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">User Note</p>
                      <p className="text-xs text-white/70 bg-white/5 p-3 rounded-xl border border-white/5 italic">
                        "{selectedReq.userNotes}"
                      </p>
                    </div>
                  )}
                  {selectedReq.adminTrxId && (
                    <div>
                      <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Admin TrxID</p>
                      <p className="text-xs font-mono text-primary bg-primary/10 p-3 rounded-xl border border-primary/20">
                        {selectedReq.adminTrxId}
                      </p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-6 bg-gradient-to-t from-background-dark via-background-dark to-transparent flex gap-3 border-t border-white/5">
             <button onClick={() => handleAction(selectedReq.id, 'REJECTED')} className="flex-1 h-14 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-red-600/20 transition-all active:scale-95">
                <span className="material-symbols-outlined">block</span> Reject
             </button>
             <button onClick={() => handleAction(selectedReq.id, 'HOLD')} className="flex-1 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-orange-500/20 transition-all active:scale-95">
                <span className="material-symbols-outlined">pause</span> Hold
             </button>
             <button onClick={() => handleOpenProcessModal(selectedReq)} className="flex-[2] h-14 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95">
                <span className="material-symbols-outlined">payments</span> Manual Pay
             </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/85 backdrop-blur-2xl px-6 pt-10 pb-4 justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-primary flex size-11 shrink-0 items-center justify-center rounded-full glass hover:bg-white/5 transition-all active:scale-90 border border-white/10">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-primary text-base font-black italic tracking-widest uppercase leading-none">
              Withdrawal Console
            </h2>
            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mt-1 italic">
              Admin Manual Processing
            </p>
          </div>
        </div>
        <button 
          onClick={fetchPayouts}
          className="flex size-11 items-center justify-center rounded-full glass border border-white/10 text-primary active:scale-95 transition-all"
          title="Refresh"
        >
          <span className="material-symbols-outlined font-black">refresh</span>
        </button>
      </header>

      <main className="flex-1 px-4 space-y-6 mt-4">
        {/* Summary Bar */}
        <section className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2 rounded-[2rem] p-5 glass border border-primary/20 shadow-xl bg-primary/5">
            <div className="flex items-center justify-between">
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] italic">Pending Total</p>
              <span className="material-symbols-outlined text-primary text-lg">schedule</span>
            </div>
            <p className="text-white tracking-tighter text-2xl font-black italic">
              ৳ {pendingAmount.toLocaleString()}
            </p>
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider">
              {pendingRequests.length} to proceed
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-[2rem] p-5 glass border border-white/5 shadow-xl bg-white/[0.01]">
            <div className="flex items-center justify-between">
              <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Total Requests</p>
              <span className="material-symbols-outlined text-amber-400 text-lg">receipt_long</span>
            </div>
            <p className="text-white tracking-tighter text-2xl font-black italic">
              {requests.length} Requests
            </p>
            <p className="text-white/40 text-[9px] uppercase font-bold tracking-wider">
              {requests.filter(r => r.status === 'PROCESSED').length} completed
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="flex gap-2 p-1 rounded-2xl glass border border-white/5">
          {(['ALL', 'PENDING', 'PROCESSED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filter === tab ? 'bg-primary text-background-dark shadow' : 'text-white/50 hover:text-white'
              }`}
            >
              {tab === 'PENDING' ? `Pending (${pendingRequests.length})` : tab}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white text-xs font-black italic tracking-widest uppercase border-l-4 border-primary pl-3">
              Incoming Withdrawals
            </h3>
            <span className="text-[10px] text-white/40 font-bold uppercase">
              {displayedRequests.length} items
            </span>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="py-20 flex justify-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
              </div>
            ) : displayedRequests.length > 0 ? displayedRequests.map((req) => (
              <div 
                key={req.id} 
                onClick={() => setSelectedReq(req)} 
                className="flex flex-col glass rounded-[2rem] border border-white/5 overflow-hidden bg-white/[0.01] shadow-2xl animate-in fade-in duration-300 cursor-pointer group hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex gap-4 p-5 items-center">
                  <div className="size-14 rounded-2xl border border-white/10 flex items-center justify-center font-black text-primary bg-primary/10 shrink-0">
                    {req.user_name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex justify-between items-start">
                      <p className="text-white text-base font-black italic tracking-tight uppercase truncate leading-none">
                        {req.user_name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                        req.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                        req.status === 'PROCESSED' ? 'bg-primary/20 text-primary border-primary/30' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <p className="text-primary text-base font-black italic mt-1.5">
                      ৳ {req.amount.toLocaleString()}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold">
                      <span className={`px-1.5 py-0.5 rounded ${METHOD_STYLES[req.method]?.bg || 'bg-white/10'} ${METHOD_STYLES[req.method]?.text || 'text-white'}`}>
                        {req.method}
                      </span>
                      <span className="font-mono text-white/70">{req.accountNumber}</span>
                    </div>
                  </div>
                </div>
                
                {/* Inline Action Bar */}
                {req.status === 'PENDING' && (
                  <div className="flex gap-2 px-5 pb-5 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleOpenProcessModal(req, e)} 
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl h-12 bg-primary text-background-dark text-xs font-black uppercase tracking-wider italic transition-all active:scale-95 shadow-md shadow-primary/20 hover:brightness-110"
                    >
                      <span className="material-symbols-outlined text-lg font-black">payments</span>
                      Proceed Payment
                    </button>
                    <button 
                      onClick={(e) => handleAction(req.id, 'HOLD', e)} 
                      className="px-4 rounded-xl h-12 bg-white/5 border border-white/10 text-white font-black uppercase tracking-wider text-xs active:bg-white/10"
                      title="Hold"
                    >
                      <span className="material-symbols-outlined text-base">pause</span>
                    </button>
                    <button 
                      onClick={(e) => handleAction(req.id, 'REJECTED', e)} 
                      className="size-12 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 flex items-center justify-center active:scale-95 transition-all hover:bg-red-600/20"
                      title="Reject"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                )}

                {req.status === 'PROCESSED' && (
                  <div className="px-5 pb-4 pt-1 flex items-center justify-between text-[10px] text-white/40 border-t border-white/5">
                    <span>TrxID: <span className="font-mono text-primary">{req.adminTrxId || 'MANUAL-SENT'}</span></span>
                    <span>Processed</span>
                  </div>
                )}
              </div>
            )) : (
              <div className="py-16 flex flex-col items-center justify-center opacity-30">
                <span className="material-symbols-outlined text-5xl mb-3">inventory_2</span>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Withdrawal Requests Found</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Batch Release for pending items */}
      {pendingRequests.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-5 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-8 z-40">
          <button 
            onClick={handleBatchRelease} 
            className="w-full h-15 py-4 rounded-2xl bg-primary text-background-dark text-xs font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 shadow-[0_12px_35px_rgba(19,236,218,0.25)] transition-all active:scale-98"
          >
            <span className="material-symbols-outlined font-black">done_all</span>
            BATCH PROCESS ALL PENDING
            <span className="bg-background-dark text-primary px-2 py-0.5 rounded-lg text-[10px] font-black">
              {pendingRequests.length}
            </span>
          </button>
        </div>
      )}

      <style>{`
        .glass { background: rgba(40, 57, 55, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
      `}</style>
    </div>
  );
};

export default AdminPayouts;
