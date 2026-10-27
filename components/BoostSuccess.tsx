
import React from 'react';

interface Props {
  plan: any;
  onHome: () => void;
  onViewAds: () => void;
}

const BoostSuccess: React.FC<Props> = ({ plan, onHome, onViewAds }) => {
  return (
    <div className="text-white min-h-screen font-display bg-background-dark relative overflow-hidden">
      <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-hidden px-6">
        <div className="flex flex-col items-center justify-center pt-24 pb-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary blur-3xl opacity-20 rounded-full"></div>
            <div className="relative size-32 rounded-full border-4 border-primary/30 flex items-center justify-center bg-primary/10 shadow-[0_0_40px_rgba(19,236,236,0.2)]">
              <span className="material-symbols-outlined text-6xl text-white font-bold">check</span>
            </div>
          </div>
          <div className="text-center space-y-3 px-4">
            <h1 className="text-3xl font-extrabold tracking-tight">Payment Successful!</h1>
            <p className="text-[#92c9c9] text-base leading-relaxed">
              Your transaction was completed successfully. Your ad boost is now active.
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl mb-auto space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-[#92c9c9] text-sm font-medium">Transaction ID</span>
            <span className="text-white font-semibold">#PAY-88231</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <span className="text-[#92c9c9] text-sm font-medium">Amount Paid</span>
            <div className="flex items-center gap-1">
              <span className="text-primary font-bold">৳</span>
              <span className="text-white font-bold text-lg">{plan?.price || '1,250'}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#92c9c9] text-sm font-medium">Payment Method</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">bKash</span>
            </div>
          </div>
        </div>

        <div className="pb-12 space-y-4 pt-10">
          <button onClick={onViewAds} className="bg-primary hover:bg-primary/90 text-[#102222] font-bold text-lg w-full h-16 rounded-full shadow-[0_0_25px_rgba(19,236,218,0.3)] transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2">
            GO TO MY ADS
            <span className="material-symbols-outlined font-bold">arrow_forward</span>
          </button>
          <button onClick={onHome} className="glass-button w-full h-16 rounded-full text-white font-bold text-sm uppercase tracking-[0.15em] transition-all active:bg-white/5 flex items-center justify-center">
            BACK TO HOME
          </button>
        </div>
      </div>
      <style>{`
        .glass-card { background: rgba(25, 51, 51, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08) }
        .glass-button { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.15) }
      `}</style>
    </div>
  );
};

export default BoostSuccess;
