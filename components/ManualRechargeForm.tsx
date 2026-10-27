
import React, { useState } from 'react';
import { submitManualDeposit } from '../adminFinanceStorage';

interface Props {
  onBack: () => void;
  onSubmit: (data: { amount: string; trxId: string; method: string; senderNumber: string }) => void;
}

const UpayLogo = () => (
  <div className="flex flex-col items-center justify-center w-full h-full pt-1">
    <svg viewBox="0 0 100 85" className="w-full h-auto" style={{ maxHeight: '70%' }}>
        <circle cx="20" cy="15" r="12.5" fill="#FFD200"/>
        <circle cx="80" cy="15" r="12.5" fill="#0056A3"/>
        <path d="M 20 40 A 30 30 0 0 0 50 70" fill="none" stroke="#FFD200" strokeWidth="25" strokeLinecap="round" />
        <path d="M 80 40 A 30 30 0 0 1 50 70" fill="none" stroke="#0056A3" strokeWidth="25" strokeLinecap="round" />
    </svg>
    <span className="text-black font-bold text-[10px] leading-none mt-0.5" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>উপায়</span>
  </div>
);

const NagadLogo = () => (
  <div className="w-full h-full flex flex-col items-center justify-center relative rounded-[22%] shadow-sm overflow-hidden" style={{
      background: 'linear-gradient(135deg, #FF5520 0%, #E81525 100%)'
  }}>
    <svg viewBox="0 0 100 100" className="w-[50%] h-[50%] fill-white mt-1 mb-[1px]">
        <path d="M 50 85 C 30 85, 15 70, 15 50 C 15 35, 25 22, 40 18 C 32 25, 28 35, 28 50 C 28 65, 38 75, 50 75 C 60 75, 68 68, 72 60 L 82 68 C 75 80, 62 85, 50 85 Z" />
        <path d="M 42 16 C 48 10, 58 10, 65 15 L 60 25 C 55 22, 50 22, 45 28 Z" />
        <path d="M 55 28 C 65 20, 75 22, 80 28 L 75 38 C 70 34, 62 32, 58 40 Z" />
        <path d="M 70 42 C 78 40, 85 45, 88 50 L 82 58 C 80 54, 75 50, 70 52 Z" />
    </svg>
    <span className="text-white font-bold text-[8px] leading-none pb-1.5 tracking-wide" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>নগদ</span>
  </div>
);

const ManualRechargeForm: React.FC<Props> = ({ onBack, onSubmit }) => {
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay'>('bKash');
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const RECHARGE_NUMBER = '01611347402';
  const DISPLAY_NUMBER = '01611-347402';

  const LOGOS: Record<string, string> = {
    bKash: 'https://freelogopng.com/images/all_img/1656234841bkash-icon-png.png',
    Nagad: '', // Uses component
    Rocket: 'https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png',
    Upay: '' // Uses component
  };

  const handleCopy = () => {
    const onCopySuccess = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(RECHARGE_NUMBER)
        .then(onCopySuccess)
        .catch(() => fallbackCopy(RECHARGE_NUMBER, onCopySuccess));
    } else {
      fallbackCopy(RECHARGE_NUMBER, onCopySuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess?: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Ensure it's part of DOM but hidden from view in a way that allows selection
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful && onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    
    document.body.removeChild(textArea);
  };

  const getMethodColor = (m: string) => {
    switch(m) {
      case 'bKash': return 'bg-[#E2136E]';
      case 'Nagad': return 'bg-[#F7941D]';
      case 'Rocket': return 'bg-[#8C3494]';
      case 'Upay': return 'bg-[#0082C5]';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="relative flex h-screen w-full max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark font-display text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Top App Bar / Navigation */}
      <div className="flex items-center bg-transparent p-6 pb-2 justify-between">
        <div onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-white/5 dark:bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-white text-[24px]">arrow_back_ios_new</span>
        </div>
        <div className="flex-1 text-center pr-10">
          <h2 className="text-primary text-sm font-extrabold leading-tight tracking-[0.1em] uppercase">Recharge Wallet</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 space-y-6">
        {/* Toggle Payment Method */}
        <div className="grid grid-cols-4 gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
           {['bKash', 'Nagad', 'Rocket', 'Upay'].map((m) => (
             <button 
               key={m}
               onClick={() => setMethod(m as any)} 
               className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${method === m ? `${getMethodColor(m)} text-white shadow-lg` : 'text-white/40 hover:bg-white/5'}`}
             >
               {m}
             </button>
           ))}
        </div>

        {/* Payment Method Card (Glassmorphism) */}
        <div className={`glass-card p-5 rounded-xl flex items-center justify-between border-l-4 ${method === 'bKash' ? 'border-l-[#E2136E]' : method === 'Nagad' ? 'border-l-[#F7941D]' : method === 'Rocket' ? 'border-l-[#8C3494]' : 'border-l-[#0082C5]'}`}>
          <div className="flex flex-col gap-1">
            <p className="text-white text-xl font-bold leading-tight">{method}</p>
            <p className="text-[#9db9b7] text-sm font-normal">Personal Account</p>
          </div>
          <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center border border-white/5 overflow-hidden p-1.5 shadow-inner">
             {method === 'Upay' ? <UpayLogo /> : method === 'Nagad' ? <NagadLogo /> : <img src={LOGOS[method]} alt={method} className="w-full h-full object-contain" />}
          </div>
        </div>

        {/* Account Info List Item */}
        <div className="glass-card flex items-center gap-4 px-5 py-4 rounded-xl justify-between">
          <div className="flex items-center gap-4">
            <div className="text-primary flex items-center justify-center rounded-full bg-primary/10 shrink-0 size-11">
              <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            </div>
            <div className="flex flex-col">
              <p className="text-white text-lg font-bold tracking-wider leading-none">{DISPLAY_NUMBER}</p>
              <p className="text-[#9db9b7] text-xs font-medium uppercase tracking-tighter mt-1">Personal Number</p>
            </div>
          </div>
          <button 
            onClick={handleCopy} 
            className={`flex items-center justify-center rounded-lg h-9 px-4 text-xs font-bold leading-normal transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-primary text-background-dark'}`}
          >
            {copied ? (
              <div className="flex items-center gap-1 animate-in zoom-in duration-300">
                <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                <span>COPIED</span>
              </div>
            ) : (
              <span>COPY</span>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="px-1">
          <p className="text-[#9db9b7] text-sm font-normal leading-relaxed text-center italic">
            Please <strong>Send Money</strong> to the above number using your {method} app before filling the form below.
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 pt-2">
          {/* Amount Field */}
          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-semibold ml-1">Amount Sent</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-primary font-bold">৳</span>
              <input 
                className="form-input flex w-full rounded-xl text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-white/10 bg-white/5 focus:border-primary h-14 placeholder:text-[#9db9b7]/50 pl-9 pr-4 text-base font-medium" 
                placeholder="Enter Amount Sent" 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Sender Number Field */}
          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-semibold ml-1">Sender Number</label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-[#9db9b7]">call</span>
              <input 
                className="form-input flex w-full rounded-xl text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-white/10 bg-white/5 focus:border-primary h-14 placeholder:text-[#9db9b7]/50 pl-12 pr-4 text-base font-medium" 
                placeholder="017xxxxxxxx" 
                type="tel" 
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Transaction ID Field */}
          <div className="flex flex-col gap-2">
            <label className="text-white/70 text-sm font-semibold ml-1">Transaction ID (TrxID)</label>
            <input 
              className="form-input flex w-full rounded-xl text-white focus:outline-0 focus:ring-1 focus:ring-primary border border-white/10 bg-white/5 focus:border-primary h-14 placeholder:text-[#9db9b7]/50 px-4 text-base font-medium uppercase" 
              placeholder="e.g. 8N70XDPL" 
              type="text" 
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 pb-10">
        <button 
          onClick={() => { 
            if(amount && trxId && senderNumber) {
              const userPhone = localStorage.getItem('duyar_user_phone') || senderNumber;
              try {
                submitManualDeposit({
                  amount,
                  trxId,
                  method,
                  senderNumber,
                  userPhone,
                  userName: 'App Resident'
                });
              } catch (e) {}
              onSubmit({ amount, trxId, method, senderNumber }); 
            }
          }}
          disabled={!amount || !trxId || !senderNumber}
          className="glow-button flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-16 bg-primary text-background-dark text-base font-extrabold leading-normal tracking-wide transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
        >
          SUBMIT FOR VERIFICATION
        </button>
      </div>
      
      {/* Bottom Home Indicator Area (iOS Padding) */}
      <div className="h-5 bg-transparent"></div>

      <style>{`
        .glass-card {
            background: rgba(28, 39, 38, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(59, 84, 82, 0.3);
        }
        .glow-button {
            box-shadow: 0 0 20px rgba(19, 236, 218, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ManualRechargeForm;
