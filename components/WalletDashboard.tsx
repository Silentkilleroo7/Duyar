import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import { getUserBalance, getPayoutRequests, PayoutRequest } from '../payoutStorage';
import { ExpenditureDonutChart } from './ExpenditureDonutChart';
import { 
  getMonthlyBreakdown, 
  getAvailableMonths, 
  EXPENDITURES_UPDATED_EVENT 
} from '../expenditureStorage';

interface Props {
  onBack: () => void;
  onAdd: () => void;
  onWithdraw: () => void;
  onSend?: () => void;
  onHistory?: () => void;
  userProfile?: any;
  onNavigate?: (screen: Screen) => void;
  lang?: 'EN' | 'BN';
}

const WalletDashboard: React.FC<Props> = ({ 
  onBack, 
  onAdd, 
  onWithdraw, 
  onHistory, 
  userProfile, 
  onNavigate, 
  lang = 'EN' 
}) => {
  const userId = userProfile?.id || 'guest-user';
  const [balance, setBalance] = useState<number>(() => {
    return getUserBalance(userId, userProfile?.balance ?? 0);
  });

  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<PayoutRequest[]>([]);

  // Monthly Expenditures Breakdown State
  const availableMonths = useMemo(() => getAvailableMonths(), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return availableMonths[0]?.value || '2026-10';
  });
  const [breakdown, setBreakdown] = useState(() => getMonthlyBreakdown(selectedMonth));

  useEffect(() => {
    setBreakdown(getMonthlyBreakdown(selectedMonth));
  }, [selectedMonth]);

  useEffect(() => {
    const handleUpdate = () => {
      setBreakdown(getMonthlyBreakdown(selectedMonth));
    };
    window.addEventListener(EXPENDITURES_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(EXPENDITURES_UPDATED_EVENT, handleUpdate);
    };
  }, [selectedMonth]);

  useEffect(() => {
    // 1. Refresh live balance
    const currentBal = getUserBalance(userId, userProfile?.balance ?? 0);
    setBalance(currentBal);

    // 2. Fetch pending withdrawals for this user
    getPayoutRequests().then((reqs) => {
      const myReqs = reqs.filter(r => 
        (r.user_id === userId || (userProfile?.phone && r.user_phone === userProfile.phone)) &&
        r.status === 'PENDING'
      );
      setPendingPayouts(myReqs);
    }).catch(() => {});

    // 3. Fetch recent transactions for this user
    const fetchRecent = async () => {
      let localTxns: any[] = [];
      const userPhone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);
      try {
        const raw = localStorage.getItem('duyar_transactions_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localTxns = parsed.filter((t: any) => {
              if (userProfile?.id && t.user_id && t.user_id === userProfile.id) return true;
              if (userPhone && t.phone && t.phone === userPhone) return true;
              if (!t.user_id && !t.phone) return true;
              return false;
            });
          }
        }
      } catch (e) {}

      let remoteTxns: any[] = [];
      if (userProfile?.id) {
        try {
          const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false })
            .limit(4);
          if (data && Array.isArray(data)) {
            remoteTxns = data;
          }
        } catch (e) {
          // fallback to local
        }
      }

      const combined = [...remoteTxns, ...localTxns];
      const unique = Array.from(new Map(combined.map(item => [item.id || item.trx_id || item.created_at, item])).values());
      unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentTxns(unique.slice(0, 4));
    };
    fetchRecent();
  }, [userProfile, userId]);

  const isBn = lang === 'BN';

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark text-white font-display overflow-x-hidden max-w-[430px] mx-auto select-none">
      <div className="absolute inset-0 map-overlay opacity-10 pointer-events-none"></div>
      
      <header className="flex items-center p-6 pb-2 justify-between relative z-10">
        <button 
          onClick={onBack} 
          className="flex size-11 items-center justify-center rounded-full glass hover:bg-white/10 transition-colors active:scale-95"
          title="Back"
        >
          <span className="material-symbols-outlined text-white">chevron_left</span>
        </button>
        <h2 className="text-primary text-base font-extrabold leading-tight tracking-[0.2em]">
          {isBn ? 'আমার ওয়ালেট ও তহবিল' : 'MY WALLET'}
        </h2>
        <div className="size-11"></div>
      </header>

      <main className="flex-1 px-4 py-4 pb-32 relative z-10 overflow-y-auto no-scrollbar">
        {/* Balance Card */}
        <div className="rounded-[2rem] p-7 glass-card border border-primary/25 relative overflow-hidden mb-6 shadow-2xl bg-gradient-to-br from-primary/10 via-white/[0.02] to-transparent">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-primary/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#92c9c5] text-xs font-black uppercase tracking-widest opacity-80">
              {isBn ? 'মোট ব্যালেন্স / তহবিল' : 'Total Balance'}
            </p>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black tracking-widest border border-primary/30">
              {isBn ? 'বিডিটি অ্যাকাউন্ট' : 'BDT ACCOUNT'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-primary text-4xl font-black italic tracking-tight">
              ৳ {balance.toLocaleString()}
            </span>
          </div>
          <p className="text-white/40 text-[10px] mt-2 font-medium">
            {isBn ? 'সেবা বুকিং, বাসা ভাড়া ও নগদ উত্তোলনের জন্য ব্যবহারের উপযোগী' : 'Available for services, rentals, and cash withdrawals'}
          </p>
        </div>

        {/* 2 Primary Options: Deposit and Withdraw */}
        <div className="mb-6">
          <p className="text-white/50 text-xs font-black uppercase tracking-widest px-2 mb-3">
            {isBn ? 'ওয়ালেট কার্যক্রম' : 'Wallet Actions'}
          </p>
          <div className="grid grid-cols-2 gap-3.5">
            {/* 1. Deposit Option */}
            <button 
              type="button" 
              onClick={onAdd} 
              className="flex flex-col justify-between p-5 rounded-[1.8rem] glass-card border border-white/10 hover:border-primary/40 bg-white/[0.02] active:scale-95 transition-all text-left group shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-primary text-background-dark flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl font-black">add_circle</span>
                </div>
                <span className="material-symbols-outlined text-white/30 group-hover:text-primary transition-colors text-lg">
                  arrow_forward
                </span>
              </div>
              <div>
                <h4 className="text-white text-base font-black italic tracking-tight leading-none mb-1">
                  {isBn ? 'টাকা জমা / রিচার্জ' : 'Deposit'}
                </h4>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  {isBn ? 'বিকাশ • নগদ • ব্যাংক' : 'bKash • Nagad • Bank'}
                </p>
              </div>
            </button>

            {/* 2. Withdraw Option */}
            <button 
              type="button" 
              onClick={onWithdraw} 
              className="flex flex-col justify-between p-5 rounded-[1.8rem] glass-card border border-white/10 hover:border-primary/40 bg-white/[0.02] active:scale-95 transition-all text-left group shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl font-black">north_east</span>
                </div>
                <span className="material-symbols-outlined text-white/30 group-hover:text-primary transition-colors text-lg">
                  arrow_forward
                </span>
              </div>
              <div>
                <h4 className="text-white text-base font-black italic tracking-tight leading-none mb-1">
                  {isBn ? 'টাকা উত্তোলন' : 'Withdraw'}
                </h4>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                  {isBn ? 'বিকাশ • নগদ • রকেট' : 'bKash • Nagad • Upay • Rocket'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Visual Monthly Rental & Service Expenditures Donut Chart */}
        <ExpenditureDonutChart
          breakdown={breakdown}
          selectedMonth={selectedMonth}
          availableMonths={availableMonths}
          onMonthChange={setSelectedMonth}
          lang={lang}
        />

        {/* Pending Withdrawals Notification Banner (if any) */}
        {pendingPayouts.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-amber-400 text-xs font-black uppercase tracking-widest px-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400 animate-ping"></span>
              {isBn ? 'অ্যাডমিন পর্যালোচনার অপেক্ষায়' : 'Awaiting Admin Manual Processing'}
            </p>
            {pendingPayouts.map(p => (
              <div 
                key={p.id}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">hourglass_top</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xs">{p.method} ({p.accountNumber})</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black uppercase">
                        {isBn ? 'অপেক্ষমাণ' : 'PENDING'}
                      </span>
                    </div>
                    <p className="text-white/40 text-[10px] mt-0.5">
                      {isBn ? 'অ্যাডমিন ম্যানুয়াল যাচাইকরণ চলছে' : 'Admin manual review in progress'}
                    </p>
                  </div>
                </div>
                <span className="text-amber-300 font-black text-sm">৳ {p.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Transaction History Header */}
        <div className="flex justify-between items-center px-2 mb-4">
           <h3 className="text-white text-base font-black uppercase tracking-wider">
             {isBn ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}
           </h3>
           <button 
             type="button" 
             onClick={onHistory} 
             className="text-primary text-xs font-bold uppercase tracking-widest hover:underline active:scale-95 transition-all"
           >
             {isBn ? 'সব দেখুন' : 'View All'}
           </button>
        </div>
        
        {/* Recent Transactions List */}
        <div className="space-y-3">
          {recentTxns.length > 0 ? recentTxns.map((txn, i) => (
            <div 
              key={txn.id || i} 
              onClick={onHistory}
              className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 cursor-pointer hover:border-primary/20 transition-all active:scale-[0.99] bg-white/[0.01]"
            >
               <div className="flex items-center gap-3">
                  <div className={`size-11 rounded-xl flex items-center justify-center ${
                    txn.type === 'deposit' || txn.type === 'receive' 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-red-500/15 text-red-400 border border-red-500/20'
                  }`}>
                     <span className="material-symbols-outlined text-xl">
                       {txn.type === 'deposit' || txn.type === 'receive' ? 'south_west' : 'north_east'}
                     </span>
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                       <p className="text-white text-sm font-bold capitalize">
                         {txn.type === 'withdraw' ? 'Withdrawal' : txn.type}
                       </p>
                       {txn.status === 'pending' && (
                         <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                           Pending
                         </span>
                       )}
                     </div>
                     <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">
                       {txn.description || new Date(txn.created_at || Date.now()).toLocaleDateString()}
                     </p>
                  </div>
               </div>
               <p className={`text-base font-black ${txn.type === 'deposit' || txn.type === 'receive' ? 'text-emerald-400' : 'text-white'}`}>
                 {txn.type === 'deposit' || txn.type === 'receive' ? '+' : '-'}৳ {txn.amount}
               </p>
            </div>
          )) : (
            <div className="py-8 flex flex-col items-center justify-center opacity-30">
              <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
              <p className="text-[10px] font-black uppercase tracking-widest">
                {isBn ? 'কোন লেনদেন নেই' : 'No Recent Transactions'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Module Tab (Home Menu Bar) with activeTab="WALLET" */}
      {onNavigate && <BottomNav activeTab="WALLET" onNavigate={onNavigate} lang={lang} />}

      <style>{`
        .glass {
            background: rgba(16, 34, 32, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
};

export default WalletDashboard;
