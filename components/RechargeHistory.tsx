
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

interface Props {
  onBack: () => void;
  onItemClick: (data: any) => void;
  userProfile?: any;
}

const RechargeHistory: React.FC<Props> = ({ onBack, onItemClick, userProfile }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      let userId = userProfile?.id;
      const userPhone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);

      if (!userId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          userId = session?.user?.id;
        } catch (e) {}
      }

      // Gather local transactions stored for this user
      let localTxns: any[] = [];
      try {
        const raw = localStorage.getItem('duyar_transactions_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localTxns = parsed.filter((t: any) => {
              if (userId && t.user_id && t.user_id === userId) return true;
              if (userPhone && t.phone && t.phone === userPhone) return true;
              if (!t.user_id && !t.phone) return true; // session created
              return false;
            });
          }
        }
      } catch (e) {}

      // If user has a valid Supabase ID, fetch remote transactions
      let remoteTxns: any[] = [];
      if (userId) {
        try {
          let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (filter === 'Deposit') query = query.eq('type', 'deposit');
          if (filter === 'Withdraw') query = query.eq('type', 'withdraw');
          if (filter === 'Transfer') query = query.in('type', ['send', 'receive']);

          const { data } = await query;
          if (data && Array.isArray(data)) {
            remoteTxns = data;
          }
        } catch (e) {
          console.debug('Supabase transactions note:', e);
        }
      }

      // Combine local and remote, deduplicating by id
      const combined = [...remoteTxns, ...localTxns];
      const uniqueMap = new Map();
      combined.forEach(t => {
        const key = t.id || t.trx_id || `${t.amount}-${t.created_at}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, t);
        }
      });

      let finalTxns = Array.from(uniqueMap.values());

      // Apply filter to combined results
      if (filter === 'Deposit') finalTxns = finalTxns.filter(t => t.type === 'deposit');
      if (filter === 'Withdraw') finalTxns = finalTxns.filter(t => t.type === 'withdraw');
      if (filter === 'Transfer') finalTxns = finalTxns.filter(t => ['send', 'receive', 'transfer'].includes(t.type));

      // Sort by creation date descending
      finalTxns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // No mock data! Only real user transactions
      setTransactions(finalTxns);
    };

    fetchData();
  }, [filter, userProfile]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-white min-h-screen">
      <header className="sticky top-0 z-50 px-4 pt-6 pb-4 bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center justify-center size-10 rounded-full glass-effect hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-white text-[22px]">arrow_back_ios_new</span>
          </button>
          <h1 className="text-primary text-sm font-bold tracking-[0.1em] uppercase">Transaction History</h1>
          <div className="size-10"></div> 
        </div>
      </header>

      <main className="px-4 pb-20">
        <div className="flex gap-2 overflow-x-auto py-4 ios-scroll-hide">
          {['All', 'Deposit', 'Withdraw', 'Transfer'].map((f, i) => (
            <button 
              key={i} 
              onClick={() => setFilter(f)}
              className={`flex h-8 shrink-0 items-center justify-center rounded-lg px-5 transition-all ${filter === f ? 'bg-primary text-background-dark font-bold shadow-lg' : 'glass-effect text-white/70 font-medium'}`}
            >
              <p className="text-xs uppercase tracking-wider">{f}</p>
            </button>
          ))}
        </div>

        <div className="space-y-3 mt-2">
          {transactions.length > 0 ? transactions.map((txn) => (
            <div 
              key={txn.id} 
              onClick={() => onItemClick(txn)}
              className="glass-effect rounded-xl p-3 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center border overflow-hidden ${
                  txn.type === 'deposit' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                  txn.type === 'withdraw' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                  'bg-blue-500/20 border-blue-500/30 text-blue-400'
                }`}>
                  <span className="material-symbols-outlined text-xl">
                    {txn.type === 'deposit' ? 'add' : txn.type === 'withdraw' ? 'remove' : 'swap_horiz'}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight capitalize">{txn.description || txn.type}</p>
                  <p className="text-white/40 text-[11px] font-normal leading-normal mt-0.5">
                    {new Date(txn.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-bold">৳ {txn.amount}</p>
                <p className={`text-[10px] font-bold uppercase tracking-tighter mt-0.5 ${
                  txn.status === 'success' ? 'text-primary' : 
                  txn.status === 'pending' ? 'text-yellow-400' : 'text-red-500'
                }`}>
                  {txn.status}
                </p>
              </div>
            </div>
          )) : (
            <div className="py-20 flex flex-col items-center justify-center opacity-30">
              <span className="material-symbols-outlined text-6xl mb-4">history</span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Transactions Found</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-10 flex justify-center items-center pointer-events-none">
        <div className="w-32 h-1 bg-white/20 rounded-full"></div>
      </div>

      <style>{`
        .glass-effect {
            backdrop-filter: blur(12px) saturate(180%);
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .ios-scroll-hide::-webkit-scrollbar { display: none; }
        .ios-scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default RechargeHistory;
