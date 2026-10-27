
import React from 'react';

interface Props {
  onBack: () => void;
  onRechargeApproval: () => void;
  onPayouts?: () => void;
}

const AdminWallet: React.FC<Props> = ({ onBack, onRechargeApproval, onPayouts }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-x-hidden border-x border-white/5 shadow-2xl pb-12">
      <header className="sticky top-0 z-50 glass-header bg-background-dark/80 backdrop-blur-2xl p-6 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-white flex size-12 shrink-0 items-center justify-center cursor-pointer glass border border-white/10 rounded-full active:scale-90 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-primary text-lg font-black italic leading-tight tracking-widest uppercase flex-1 text-center pr-12">Wallet Auditor</h2>
          <div className="size-12"></div>
        </div>
      </header>

      <main className="flex flex-col gap-6 p-6">
        {/* User Search Context */}
        <div className="relative">
          <div className="flex w-full items-stretch rounded-2xl h-14 glass border border-white/10 focus-within:border-primary/50 transition-all overflow-hidden bg-white/[0.02]">
            <div className="text-primary flex items-center justify-center pl-5">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input className="flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-white placeholder:text-white/20 px-4 text-base font-bold italic" placeholder="Search user ID or phone..." defaultValue="John Doe"/>
          </div>
        </div>

        {/* Quick Action Navigation Banners */}
        <div className="grid grid-cols-1 gap-3">
          {/* Pending Recharges Banner */}
          <button onClick={onRechargeApproval} className="flex items-center justify-between p-4 rounded-[1.8rem] bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 shadow-lg shadow-primary/5 active:scale-98 transition-all">
             <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-2xl bg-primary flex items-center justify-center text-background-dark shadow-lg">
                   <span className="material-symbols-outlined text-xl font-black">pending_actions</span>
                </div>
                <div className="text-left">
                   <p className="text-primary font-black uppercase italic text-sm tracking-wide">Manual Recharges (Deposit)</p>
                   <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-0.5">Audit Incoming Deposits</p>
                </div>
             </div>
             <div className="size-7 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
             </div>
          </button>

          {/* Pending Withdrawals Banner */}
          {onPayouts && (
            <button onClick={onPayouts} className="flex items-center justify-between p-4 rounded-[1.8rem] bg-gradient-to-r from-amber-500/20 to-amber-500/5 border border-amber-500/20 shadow-lg shadow-amber-500/5 active:scale-98 transition-all">
               <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-2xl bg-amber-400 text-background-dark flex items-center justify-center shadow-lg">
                     <span className="material-symbols-outlined text-xl font-black">payments</span>
                  </div>
                  <div className="text-left">
                     <p className="text-amber-300 font-black uppercase italic text-sm tracking-wide">Withdrawals (Manual Payouts)</p>
                     <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-0.5">bKash • Nagad • Upay • Rocket</p>
                  </div>
               </div>
               <div className="size-7 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
               </div>
            </button>
          )}
        </div>

        {/* User Profile Card */}
        <section className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex w-full flex-col gap-5 glass p-6 rounded-[2.5rem] border border-primary/20 relative overflow-hidden bg-primary/5 shadow-2xl">
            <div className="absolute top-[-20%] right-[-10%] size-32 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="flex gap-5 relative z-10">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-[1.5rem] h-20 w-20 border-4 border-[#0d1a19] shadow-2xl shrink-0" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAxIJ43AYNz6jYU9mgP6A_cYGqyNM8ijytCDVVyZGee-7l6GGauDhMcWoF0M9NXIptNoMlootVyAMZEykkVHk3xSwJiazRdnJ1n5ZQhbINOA10J09Ybu19amEg0kFwqvT0lAB_VOG0yI4ZvswGeLevUN_ToDSiha7ZWaVnmXgSFYM7jvwFCQ32IiheOfZeMTj_OUbpf4eymBXS3B8mmlzNUK9gdKeBq7lTqdn_Kbb3lq0ZMkF8uzMwR4DanBPXECi_kBB7SGBQ0Yy8")'}}></div>
              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-2xl font-black italic tracking-tighter uppercase truncate leading-none">John Doe</p>
                  <span className="bg-primary/20 text-primary text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-primary/20 shadow-inner">Verified</span>
                </div>
                <p className="text-white/40 text-[11px] font-bold tracking-widest uppercase mt-3 italic">+1 234 567 8900</p>
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">UID: 8829103</p>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 mt-2">
               <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1 italic px-1">Current Balance</p>
               <p className="text-primary text-4xl font-black italic tracking-tighter">৳ 0.00</p>
            </div>
          </div>
        </section>

        {/* Manual Recharge Tool */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-white text-base font-black italic uppercase tracking-widest border-l-4 border-primary pl-4">Update Balance</h3>
            <span className="material-symbols-outlined text-white/20 text-xl">help</span>
          </div>
          <div className="glass rounded-[2rem] p-8 space-y-6 border border-white/5 bg-white/[0.01] shadow-2xl">
            <div className="flex flex-col gap-2">
              <label className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] ml-2 italic">Recharge Amount (৳)</label>
              <input className="bg-black/40 border border-white/10 rounded-2xl text-white text-3xl font-black italic tracking-tighter focus:ring-primary focus:border-primary/50 px-6 h-16 transition-all placeholder:text-white/10 shadow-inner" placeholder="0.00" type="number"/>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] ml-2 italic">Reference / Auth Reason</label>
              <textarea className="bg-black/40 border border-white/10 rounded-2xl text-white text-sm focus:ring-primary focus:border-primary/50 p-6 placeholder:text-white/10 resize-none transition-all font-medium leading-relaxed" placeholder="e.g. Promotional reward, Customer correction..." rows={3}></textarea>
            </div>
            <button className="w-full bg-primary text-background-dark font-black h-18 rounded-[1.5rem] hover:brightness-110 transition-all flex items-center justify-center gap-4 shadow-[0_15px_35px_rgba(19,236,218,0.25)] uppercase tracking-[0.2em] italic active:scale-98">
              <span className="material-symbols-outlined font-black">bolt</span>
              Apply Adjustment
            </button>
          </div>
        </section>

        {/* Activity Log Context */}
        <section className="space-y-4 pt-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-white text-base font-black italic uppercase tracking-widest">Adjustment History</h3>
              <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">View Global</button>
           </div>
           <div className="flex flex-col gap-3 pb-20 items-center justify-center py-10 opacity-30">
              <span className="material-symbols-outlined text-4xl mb-2">history_edu</span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Recent Activity</p>
           </div>
        </section>
      </main>

      <style>{`
        .glass { background: rgba(40, 57, 55, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
};

export default AdminWallet;
