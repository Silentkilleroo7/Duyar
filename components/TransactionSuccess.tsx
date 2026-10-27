
import React from 'react';

interface Props {
  recipient: any;
  amount: string;
  onHome: () => void;
}

const TransactionSuccess: React.FC<Props> = ({ recipient, amount, onHome }) => {
  return (
    <div className="bg-background-dark font-display text-white overflow-hidden min-h-screen relative flex items-center justify-center">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-6">
        <div className="mb-8 relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 shadow-[0_0_40px_10px_rgba(19,236,218,0.2)] border border-primary/30">
            <span className="material-symbols-outlined text-primary text-5xl font-bold">check</span>
          </div>
        </div>

        <div className="text-center mb-2">
          <h1 className="text-white tracking-tight text-3xl font-bold">Transfer Successful!</h1>
        </div>
        <div className="text-center mb-10">
          <p className="text-white/60 text-base font-normal leading-relaxed px-4">
            Your money has been successfully sent to <span className="text-white font-medium">{recipient?.name || 'Ariful Islam'}</span>.
          </p>
        </div>

        <div className="glass-card w-full rounded-2xl p-6 mb-10 bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Transaction ID</p>
              <p className="text-white text-sm font-semibold">#TX-77421</p>
            </div>
            <div className="h-[1px] w-full bg-white/5"></div>
            <div className="flex justify-between items-center">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Amount Sent</p>
              <p className="text-primary text-xl font-black">৳ {amount}</p>
            </div>
            <div className="h-[1px] w-full bg-white/5"></div>
            <div className="flex justify-between items-center">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Recipient</p>
              <div className="text-right">
                <p className="text-white text-sm font-semibold">{recipient?.name}</p>
                <p className="text-white/40 text-[11px]">{recipient?.phone}</p>
              </div>
            </div>
            <div className="h-[1px] w-full bg-white/5"></div>
            <div className="flex justify-between items-center">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">New Balance</p>
              <p className="text-white text-sm font-semibold">৳ 0.00</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full gap-4">
          <button className="flex h-14 w-full items-center justify-center rounded-full bg-primary px-8 text-background-dark text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            VIEW RECEIPT
          </button>
          <button onClick={onHome} className="flex h-14 w-full items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-8 text-white text-sm font-black uppercase tracking-widest hover:bg-white/10 active:scale-[0.98] transition-all">
            BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionSuccess;
