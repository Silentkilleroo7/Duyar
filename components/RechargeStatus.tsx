
import React from 'react';

interface Props {
  status: 'pending' | 'success' | 'rejected';
  amount: string;
  trxId: string;
  reason?: string;
  method?: string;
  onBack: () => void;
  onContactSupport?: () => void;
}

const RechargeStatus: React.FC<Props> = ({ status, amount, trxId, reason, method = 'bKash', onBack, onContactSupport }) => {
  if (status === 'success') {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display text-white overflow-hidden min-h-screen relative flex items-center justify-center">
        {/* Background Content: Recent Activity Blur */}
        <div className="absolute inset-0 flex flex-col bg-background-dark overflow-hidden brightness-[0.3] blur-sm z-0">
           {/* Mock Background Pattern */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#102220_0%,_#0a1211_100%)]"></div>
        </div>

        {/* Notification Overlay Layer */}
        <div className="relative z-50 flex items-center justify-center w-full p-6">
          {/* Success Notification Card */}
          <div className="glass-card w-full max-w-sm rounded-xl p-8 flex flex-col items-center text-center shadow-2xl border border-primary/20">
            {/* Glowing Success Icon */}
            <div className="icon-glow bg-primary size-16 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-background-dark text-4xl font-bold">check</span>
            </div>
            
            {/* Content */}
            <h2 className="text-white text-2xl font-bold leading-tight tracking-tight mb-3">Wallet Recharged!</h2>
            <p className="text-[#9db9b7] text-base font-normal leading-relaxed mb-6">
                Your recharge of <span className="text-white font-medium">৳ {amount}</span> has been approved and added to your wallet.
            </p>
            
            {/* Balance Highlight */}
            <div className="bg-primary/10 rounded-lg px-6 py-3 mb-8 w-full border border-primary/20">
              <p className="text-primary text-lg font-semibold tracking-wide">
                  New Balance: <span className="teal-glow">৳ {(0 + parseInt(amount)).toLocaleString()}</span>
              </p>
            </div>
            
            {/* Action Button */}
            <button onClick={onBack} className="w-full h-12 flex items-center justify-center bg-primary rounded-lg text-background-dark font-bold text-sm tracking-widest hover:brightness-110 transition-all active:scale-95">
                VIEW WALLET
            </button>
            <button onClick={onBack} className="mt-4 text-[#9db9b7] text-sm font-medium hover:text-white transition-colors">
                Dismiss
            </button>
          </div>
        </div>
        <style>{`
            .glass-card { background: rgba(28, 39, 38, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(157, 185, 183, 0.2); }
            .teal-glow { text-shadow: 0 0 10px rgba(19, 236, 218, 0.4); }
            .icon-glow { box-shadow: 0 0 20px rgba(19, 236, 218, 0.3); }
        `}</style>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display text-white min-h-screen relative flex items-center justify-center">
        {/* Mock Background Blur */}
        <div className="absolute inset-0 bg-background-dark/90 backdrop-blur-sm z-0"></div>

        {/* Glassmorphism Modal Overlay */}
        <div className="relative z-50 w-full max-w-sm p-6">
          <div className="glass-card rounded-xl p-6 shadow-2xl flex flex-col items-center border border-white/10 bg-[#1a1f1e]">
            {/* Bottom Sheet Handle */}
            <div className="h-1 w-9 rounded-full bg-white/20 mb-6"></div>
            
            {/* Warning Icon */}
            <div className="size-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 border border-orange-500/20">
              <span className="material-symbols-outlined text-orange-500 text-4xl">warning</span>
            </div>
            
            {/* Headline */}
            <h3 className="text-white tracking-tight text-2xl font-bold leading-tight text-center pb-2">
              Recharge Failed
            </h3>
            
            {/* Body Text */}
            <p className="text-white/80 text-base font-normal leading-relaxed pb-6 text-center">
              Your recharge request for <span className="font-bold text-white">৳ {amount}</span> has been rejected by the admin.
            </p>
            
            {/* Reason Box */}
            <div className="w-full bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-orange-500 text-sm mt-0.5">info</span>
                <div>
                  <p className="text-orange-500 text-sm font-bold uppercase tracking-wider">Reason</p>
                  <p className="text-white text-sm">{reason || 'Invalid Transaction ID'}</p>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <p className="text-white/60 text-sm text-center mb-8 px-2">
              Please check your bKash/Nagad statement and try again.
            </p>
            
            {/* Actions */}
            <div className="w-full flex flex-col gap-4">
              <button onClick={onBack} className="w-full h-12 bg-primary text-background-dark font-bold text-sm tracking-widest rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity active:scale-95">
                TRY AGAIN
              </button>
              <button onClick={onContactSupport} className="w-full py-2 flex items-center justify-center gap-2 text-primary font-medium text-sm hover:underline">
                <span className="material-symbols-outlined text-lg">support_agent</span>
                CONTACT SUPPORT
              </button>
            </div>
          </div>
        </div>
        <style>{`
            .glass-card { background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
        `}</style>
      </div>
    );
  }

  // Pending State
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-white min-h-screen flex flex-col items-stretch">
        <div className="flex items-center p-4 pt-6 justify-between">
            <div onClick={onBack} className="text-white flex size-12 shrink-0 items-center justify-start cursor-pointer">
                <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Recharge Status</h2>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="relative flex items-center justify-center mb-8">
                <div className="size-32 rounded-full glass-card flex items-center justify-center border-primary/20 bg-white/5">
                    <div className="size-24 rounded-full bg-yellow-500/10 flex items-center justify-center glow-yellow border border-yellow-500/30">
                        <span className="material-symbols-outlined text-yellow-500 text-[48px]">hourglass_empty</span>
                    </div>
                </div>
            </div>
            
            <h2 className="text-white tracking-tight text-[28px] font-bold leading-tight text-center pb-3">
                Verification Pending
            </h2>
            
            <p className="text-[#9db9b7] text-base font-normal leading-relaxed text-center mb-8 max-w-sm">
                Your recharge request of <span className="text-white font-semibold">৳ {amount}</span> via {method} is being verified by our admin team. This usually takes 15-30 minutes.
            </p>
            
            <div className="w-full glass-card rounded-xl p-5 space-y-4 bg-white/5 border border-white/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className="text-[#9db9b7] text-sm font-medium">TrxID</p>
                    <p className="text-white text-sm font-mono font-semibold">{trxId}</p>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className="text-[#9db9b7] text-sm font-medium">Amount</p>
                    <p className="text-white text-base font-bold">৳ {amount}</p>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-[#9db9b7] text-sm font-medium">Status</p>
                    <div className="flex items-center gap-2">
                        <span className="size-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        <p className="text-yellow-500 text-sm font-bold uppercase tracking-wider">Processing</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="p-6 pb-10">
            <button onClick={onBack} className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98]">
                BACK TO WALLET
            </button>
        </div>
        
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] size-64 bg-primary/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-[10%] -right-[10%] size-80 bg-primary/5 blur-[120px] rounded-full"></div>
        </div>
        <style>{`
            .glow-yellow { filter: drop-shadow(0 0 15px rgba(234, 179, 8, 0.4)); }
        `}</style>
    </div>
  );
};

export default RechargeStatus;
