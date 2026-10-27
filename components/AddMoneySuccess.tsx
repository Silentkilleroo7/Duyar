
import React from 'react';

interface Props {
  amount: number;
  onWallet: () => void;
  onHome: () => void;
}

const AddMoneySuccess: React.FC<Props> = ({ amount, onWallet, onHome }) => {
  const referenceId = "#AM-" + Math.floor(10000 + Math.random() * 90000);
  const newBalance = 12450 + amount;

  return (
    <div className="bg-background-light dark:bg-background-dark text-white min-h-screen flex items-center justify-center p-6 selection:bg-primary selection:text-background-dark font-display overflow-hidden relative">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>

      <div className="relative w-full max-w-[480px] flex flex-col items-center animate-in fade-in zoom-in duration-500">
        {/* Success Indicator */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary text-background-dark shadow-xl glow-effect">
            <span className="material-symbols-outlined !text-5xl font-bold">check</span>
          </div>
        </div>

        {/* Heading & Subtext */}
        <div className="text-center space-y-3 mb-10 px-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Money Added Successfully!
          </h1>
          <p className="text-white/60 text-base font-medium leading-relaxed max-w-xs mx-auto">
            Your wallet has been topped up. You can now use your balance for ads and services.
          </p>
        </div>

        {/* Transaction Details Card */}
        <div className="w-full glass-card rounded-xl p-6 mb-12 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-white/40 text-sm font-semibold uppercase tracking-wider">Reference ID</p>
            <p className="text-white font-mono text-sm">{referenceId}</p>
          </div>
          <div className="h-px bg-white/10 w-full"></div>
          <div className="flex justify-between items-center">
            <p className="text-white/40 text-sm font-semibold uppercase tracking-wider">Amount Added</p>
            <p className="text-primary text-xl font-bold">৳ {amount.toLocaleString()}</p>
          </div>
          <div className="flex justify-between items-center pt-1">
            <p className="text-white/40 text-sm font-semibold uppercase tracking-wider">New Total Balance</p>
            <p className="text-white text-lg font-bold">৳ {newBalance.toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={onWallet}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-background-dark text-base font-extrabold rounded-full transition-all flex items-center justify-center tracking-wide uppercase shadow-lg shadow-primary/20 active:scale-95"
          >
            <span>View Wallet</span>
          </button>
          <button 
            onClick={onHome}
            className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-base font-bold rounded-full transition-all flex items-center justify-center tracking-wide uppercase active:scale-95"
          >
            <span>Back to Home</span>
          </button>
        </div>

        <div className="mt-12 w-32 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full opacity-50"></div>
      </div>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glow-effect {
            box-shadow: 0 0 40px 10px rgba(19, 236, 218, 0.2);
        }
      `}</style>
    </div>
  );
};

export default AddMoneySuccess;
