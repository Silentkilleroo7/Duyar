
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

const translations = {
  EN: {
    title: 'PENDING RECHARGES',
    totalPending: 'Total Pending',
    requestsToday: 'Requests Today',
    searchPlaceholder: 'Search by TrxID...',
    tabs: ['All Methods', 'Pending', 'Filter'],
    recentRequests: 'Recent Requests',
    checkTrx: 'Check TrxID',
    reject: 'REJECT',
    approve: 'APPROVE',
    rejectTitle: 'Reject Request',
    rejectDesc: 'Select a reason for rejection:',
    reasons: ['Invalid Transaction ID', 'Amount Mismatch', 'Incomplete Payment', 'Other'],
    cancel: 'Cancel',
    confirmReject: 'Confirm Reject'
  },
  BN: {
    title: 'অপেক্ষমান রিচার্জ',
    totalPending: 'মোট অপেক্ষমান',
    requestsToday: 'আজকের অনুরোধ',
    searchPlaceholder: 'TrxID দিয়ে খুঁজুন...',
    tabs: ['সব মাধ্যম', 'অপেক্ষমান', 'ফিল্টার'],
    recentRequests: 'সাম্প্রতিক অনুরোধ',
    checkTrx: 'TrxID চেক করুন',
    reject: 'বাতিল',
    approve: 'অনুমোদন',
    rejectTitle: 'অনুরোধ বাতিল করুন',
    rejectDesc: 'বাতিল করার কারণ নির্বাচন করুন:',
    reasons: ['ভুল ট্রানজেকশন আইডি', 'টাকার পরিমাণ অমিল', 'অসম্পূর্ণ পেমেন্ট', 'অন্যান্য'],
    cancel: 'ফিরে যান',
    confirmReject: 'নিশ্চিত বাতিল'
  }
};

const LOGOS: Record<string, string> = {
  bKash: 'https://freelogopng.com/images/all_img/1656234841bkash-icon-png.png',
  Nagad: 'https://freelogopng.com/images/all_img/1679248828nagad-app-logo.png',
  Rocket: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png',
  Upay: 'https://seeklogo.com/images/U/upay-logo-5C39A2C299-seeklogo.com.png'
};

const AdminManualRecharge: React.FC<Props> = ({ onBack }) => {
  const [lang, setLang] = useState<'EN' | 'BN'>('EN');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Initial Empty State
  const [requests, setRequests] = useState<any[]>([]);

  const t = translations[lang];

  const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = (id: string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
    showToast('Recharge Request Approved', 'success');
  };

  const handleRejectClick = (req: any) => {
    setSelectedRequest(req);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (selectedRequest) {
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setShowRejectModal(false);
      setSelectedRequest(null);
      showToast('Request Rejected', 'error');
    }
  };

  const handleCheckTrx = (trxId: string) => {
    // Simulate API verification
    showToast(`TrxID ${trxId} Verified on Gateway`, 'info');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen relative flex flex-col max-w-[430px] mx-auto border-x border-white/5 overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
          toast.type === 'success' ? 'bg-primary/20 border-primary text-primary' : 
          toast.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-500' :
          'bg-blue-500/20 border-blue-500 text-blue-400'
        }`}>
          <span className="material-symbols-outlined text-lg font-black">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'cancel' : 'info'}
          </span>
          <span className="text-xs font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center p-4 justify-between">
          <button onClick={onBack} className="text-primary flex size-10 shrink-0 items-center justify-center cursor-pointer rounded-full hover:bg-white/5 transition-all">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-primary text-base font-bold leading-tight tracking-wider text-center">{t.title}</h2>
            <div 
              className="flex items-center gap-0 bg-slate-200 dark:bg-white/10 rounded-full p-0.5 mt-1.5 cursor-pointer" 
              onClick={() => setLang(prev => prev === 'EN' ? 'BN' : 'EN')}
            >
                <div className={`px-3 py-0.5 rounded-full text-[9px] font-bold transition-all ${lang === 'EN' ? 'bg-white dark:bg-primary text-slate-800 dark:text-background-dark shadow-sm' : 'text-slate-500 dark:text-white/40'}`}>EN</div>
                <div className={`px-3 py-0.5 rounded-full text-[9px] font-bold transition-all ${lang === 'BN' ? 'bg-white dark:bg-primary text-slate-800 dark:text-background-dark shadow-sm' : 'text-slate-500 dark:text-white/40'}`}>BN</div>
            </div>
          </div>

          <div className="flex w-10 items-center justify-end">
            <button className="relative flex items-center justify-center p-2 text-slate-400 dark:text-white">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full border border-background-dark"></span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
        {/* Stats Summary */}
        <div className="flex gap-3 p-4">
          <div className="flex-1 glass-card rounded-xl p-4 flex flex-col gap-1 border-l-4 border-l-primary bg-primary/5">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{t.totalPending}</p>
            <p className="text-white text-xl font-bold">৳ {requests.reduce((acc, curr) => acc + parseInt(curr.amount.replace(/,/g, '')), 0).toLocaleString()}</p>
          </div>
          <div className="flex-1 glass-card rounded-xl p-4 flex flex-col gap-1 border-l-4 border-l-slate-500 bg-white/5">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{t.requestsToday}</p>
            <p className="text-white text-xl font-bold">{requests.length}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 space-y-3">
          <label className="flex flex-col w-full">
            <div className="flex w-full items-stretch rounded-lg h-11 bg-white dark:bg-[#283937] border border-slate-200 dark:border-white/5">
              <div className="text-slate-400 flex items-center justify-center pl-4">
                <span className="material-symbols-outlined text-xl">search</span>
              </div>
              <input className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-500 text-sm px-3" placeholder={t.searchPlaceholder}/>
            </div>
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {t.tabs.map((f, i) => (
              <button key={i} className="flex h-9 shrink-0 items-center gap-x-1 rounded-full bg-white dark:bg-[#283937] px-4 border border-slate-200 dark:border-white/5 hover:bg-white/10 transition-colors">
                <span className="text-slate-700 dark:text-white text-xs font-semibold">{f}</span>
                {i === 2 && <span className="material-symbols-outlined text-sm">filter_list</span>}
                {i !== 2 && <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div className="px-4 py-2">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.recentRequests}</h3>
        </div>

        {/* Recharge List */}
        <div className="px-4 space-y-3">
          {requests.length > 0 ? requests.map((req, i) => (
            <div key={req.id} className={`glass-card rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] transition-all animate-in fade-in slide-in-from-bottom-2`}>
              <div className="p-4 border-b border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{req.name}</p>
                      <p className="text-slate-400 text-xs">{req.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-bold text-lg leading-none">৳ {req.amount}</p>
                    <p className="text-slate-500 text-[10px] mt-1 font-medium">{req.time}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded bg-white p-0.5 flex items-center justify-center shadow-sm">
                       <img src={LOGOS[req.method]} alt={req.method} className="h-full w-full object-contain" />
                    </div>
                    <div className="font-mono text-xs text-slate-300">{req.trxId}</div>
                  </div>
                  <button 
                    onClick={() => handleCheckTrx(req.trxId)}
                    className="text-primary text-[11px] font-bold underline decoration-primary/40 flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {t.checkTrx}
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </button>
                </div>
              </div>
              <div className="flex p-2 gap-2 bg-black/10">
                <button 
                  onClick={() => handleRejectClick(req)}
                  className="flex-1 h-10 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                  {t.reject}
                </button>
                <button 
                  onClick={() => handleApprove(req.id)}
                  className="flex-[1.5] h-10 rounded-lg bg-primary text-background-dark text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {t.approve}
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-[#1a1f1e] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h4 className="text-white font-bold text-lg mb-4">{t.rejectTitle}</h4>
            <p className="text-slate-400 text-sm mb-4">{t.rejectDesc}</p>
            <div className="space-y-2">
              {t.reasons.map((reason, idx) => (
                <button key={idx} className="w-full text-left p-3 rounded-lg bg-white/5 text-white text-sm hover:bg-white/10 border border-white/5 transition-colors focus:bg-red-500/20 focus:border-red-500/50">
                  {reason}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 h-11 rounded-lg bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-colors">{t.cancel}</button>
              <button onClick={confirmReject} className="flex-1 h-11 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">{t.confirmReject}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .glass-card { background: rgba(40, 57, 55, 0.4); backdrop-filter: blur(12px); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default AdminManualRecharge;
