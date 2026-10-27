import React, { useState, useEffect } from 'react';
import { 
  createPayoutRequest, 
  PayoutMethod, 
  getUserBalance, 
  setUserBalance 
} from '../payoutStorage';

interface Props {
  onBack: () => void;
  userProfile?: any;
  onSuccess?: () => void;
}

const PAYMENT_METHODS: {
  id: PayoutMethod;
  name: string;
  bnName: string;
  color: string;
  borderColor: string;
  bgLight: string;
  badgeBg: string;
  desc: string;
  logo: 'bKash' | 'Nagad' | 'Upay' | 'Rocket';
}[] = [
  {
    id: 'bKash',
    name: 'bKash',
    bnName: 'বিকাশ',
    color: '#E2136E',
    borderColor: 'border-[#E2136E]/40',
    bgLight: 'bg-[#E2136E]/10',
    badgeBg: 'bg-[#E2136E]',
    desc: 'Personal or Merchant',
    logo: 'bKash'
  },
  {
    id: 'Nagad',
    name: 'Nagad',
    bnName: 'নগদ',
    color: '#FF5520',
    borderColor: 'border-[#FF5520]/40',
    bgLight: 'bg-[#FF5520]/10',
    badgeBg: 'bg-gradient-to-r from-[#FF5520] to-[#E81525]',
    desc: 'Personal Account',
    logo: 'Nagad'
  },
  {
    id: 'Upay',
    name: 'Upay',
    bnName: 'উপায়',
    color: '#0056A3',
    borderColor: 'border-[#FFD200]/40',
    bgLight: 'bg-[#0056A3]/15',
    badgeBg: 'bg-[#0056A3]',
    desc: 'UCB Mobile Banking',
    logo: 'Upay'
  },
  {
    id: 'Rocket',
    name: 'Rocket',
    bnName: 'রকেট',
    color: '#8C3494',
    borderColor: 'border-[#8C3494]/40',
    bgLight: 'bg-[#8C3494]/10',
    badgeBg: 'bg-[#8C3494]',
    desc: 'DBBL Mobile Banking',
    logo: 'Rocket'
  }
];

const UpayIcon = () => (
  <div className="flex flex-col items-center justify-center w-7 h-7">
    <svg viewBox="0 0 100 85" className="w-full h-auto">
      <circle cx="20" cy="15" r="14" fill="#FFD200" />
      <circle cx="80" cy="15" r="14" fill="#0056A3" />
      <path d="M 20 40 A 30 30 0 0 0 50 70" fill="none" stroke="#FFD200" strokeWidth="26" strokeLinecap="round" />
      <path d="M 80 40 A 30 30 0 0 1 50 70" fill="none" stroke="#0056A3" strokeWidth="26" strokeLinecap="round" />
    </svg>
  </div>
);

const NagadIcon = () => (
  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#FF5520] to-[#E81525] shadow-sm">
    <svg viewBox="0 0 100 100" className="w-4 h-4 fill-white">
      <path d="M 50 85 C 30 85, 15 70, 15 50 C 15 35, 25 22, 40 18 C 32 25, 28 35, 28 50 C 28 65, 38 75, 50 75 C 60 75, 68 68, 72 60 L 82 68 C 75 80, 62 85, 50 85 Z" />
      <path d="M 42 16 C 48 10, 58 10, 65 15 L 60 25 C 55 22, 50 22, 45 28 Z" />
      <path d="M 55 28 C 65 20, 75 22, 80 28 L 75 38 C 70 34, 62 32, 58 40 Z" />
    </svg>
  </div>
);

const BkashIcon = () => (
  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#E2136E] text-white font-black text-xs shadow-sm">
    <span className="font-serif italic font-bold">bK</span>
  </div>
);

const RocketIcon = () => (
  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#8C3494] text-white shadow-sm">
    <span className="material-symbols-outlined text-sm font-black">rocket_launch</span>
  </div>
);

const WithdrawFunds: React.FC<Props> = ({ onBack, userProfile, onSuccess }) => {
  const userId = userProfile?.id || 'guest-user';
  const initialBalance = userProfile?.balance ?? 5000;
  
  const [currentBalance, setCurrentBalance] = useState<number>(() => {
    return getUserBalance(userId, initialBalance);
  });

  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedReq, setSubmittedReq] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync profile phone as default suggestion if available
  useEffect(() => {
    if (userProfile?.phone && !accountNumber) {
      const cleanPhone = userProfile.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 11) {
        setAccountNumber(cleanPhone.slice(-11));
      }
    }
  }, [userProfile]);

  const handleQuickAmount = (val: number) => {
    const capped = Math.min(val, currentBalance);
    setAmount(capped.toString());
    setError(null);
  };

  const handleUseMyPhone = () => {
    if (userProfile?.phone) {
      const clean = userProfile.phone.replace(/[^0-9]/g, '');
      setAccountNumber(clean.slice(-11));
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);

    if (!val || isNaN(val) || val <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }

    if (val < 50) {
      setError('Minimum withdrawal amount is ৳ 50.');
      return;
    }

    if (val > currentBalance) {
      setError(`Insufficient balance. You currently have ৳ ${currentBalance.toLocaleString()}.`);
      return;
    }

    const cleanNum = accountNumber.replace(/[^0-9]/g, '');
    if (cleanNum.length < 11) {
      setError(`Please enter a valid 11-digit ${selectedMethod} mobile number.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create persistent request
      const req = await createPayoutRequest({
        user_id: userId,
        user_name: userProfile?.full_name || 'Resident User',
        user_phone: userProfile?.phone || accountNumber,
        method: selectedMethod,
        accountNumber: cleanNum,
        amount: val,
        userNotes: note.trim() || undefined,
        user_avatar: userProfile?.avatar_url
      });

      // 2. Deduct user's balance locally
      const updatedBalance = currentBalance - val;
      setCurrentBalance(updatedBalance);
      setUserBalance(userId, updatedBalance);
      if (userProfile) {
        userProfile.balance = updatedBalance;
      }

      setSubmittedReq(req);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err?.message || 'Failed to submit withdrawal request. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS VIEW
  if (submittedReq) {
    return (
      <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-x-hidden border-x border-white/5 shadow-2xl p-6 justify-between">
        <div className="absolute inset-0 map-overlay opacity-10 pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center pt-12 pb-6 relative z-10 text-center">
          <div className="relative mb-6">
            <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_50px_rgba(19,236,218,0.4)] border-2 border-primary/40 animate-in zoom-in-75 duration-300">
              <span className="material-symbols-outlined text-5xl font-black">hourglass_top</span>
            </div>
            <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-primary text-background-dark flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-base font-black">check</span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
            Request Sent to Admin
          </span>
          <h2 className="text-2xl font-black italic tracking-tight uppercase">
            Withdrawal Requested
          </h2>
          <p className="text-white/60 text-xs mt-2 max-w-[320px] leading-relaxed">
            Your manual payout request has been sent to our administrator team. Admin will process and send money to your account shortly.
          </p>
        </div>

        {/* Receipt Details Card */}
        <div className="glass-card rounded-[2rem] p-6 border border-white/10 relative z-10 space-y-4 bg-white/[0.02]">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Request ID</p>
              <p className="text-white font-mono font-bold text-sm">{submittedReq.id}</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400">
              PENDING ADMIN
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs font-semibold">Payment Option</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-sm">{submittedReq.method}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs font-semibold">Destination Number</span>
            <span className="text-primary font-mono font-bold text-sm">{submittedReq.accountNumber}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs font-semibold">Requested Amount</span>
            <span className="text-white text-xl font-black tracking-tight">৳ {submittedReq.amount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/40 text-xs font-semibold">Remaining Balance</span>
            <span className="text-white/60 font-bold text-sm">৳ {currentBalance.toLocaleString()}</span>
          </div>

          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center gap-2.5 text-amber-400 text-[11px] bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <span className="material-symbols-outlined text-base">support_agent</span>
              <p className="leading-tight">
                Our admin team manually reviews and sends payouts to {submittedReq.method}. You will receive an SMS confirmation once dispatched.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 relative z-10 space-y-3">
          <button 
            type="button"
            onClick={() => {
              if (onSuccess) onSuccess();
              onBack();
            }}
            className="w-full h-14 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-[0.2em] italic text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined font-black">account_balance_wallet</span>
            Back to Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto bg-background-dark font-display text-white overflow-x-hidden border-x border-white/5 shadow-2xl">
      <div className="absolute inset-0 map-overlay opacity-10 pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/85 backdrop-blur-2xl px-6 pt-10 pb-4 justify-between border-b border-white/5">
        <button 
          onClick={onBack} 
          className="size-11 rounded-full glass flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          title="Back"
        >
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <div className="text-center">
          <h1 className="text-primary text-base font-black italic tracking-widest uppercase leading-none">
            Withdraw Funds
          </h1>
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1">
            Manual Admin Payout
          </p>
        </div>
        <div className="size-11 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary/60 text-xl">payments</span>
        </div>
      </header>

      <form onSubmit={handleWithdrawSubmit} className="flex-1 px-5 py-6 space-y-6 relative z-10 pb-36 overflow-y-auto no-scrollbar">
        {/* Available Balance Banner */}
        <div className="rounded-[2rem] p-6 glass-card border border-primary/30 relative overflow-hidden shadow-2xl bg-gradient-to-br from-primary/10 via-white/[0.02] to-transparent">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-primary/15 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#92c9c5] text-xs font-black uppercase tracking-widest">
              Available to Withdraw
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-black tracking-widest border border-primary/30">
              VERIFIED WALLET
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-primary text-4xl font-black italic tracking-tight">
              ৳ {currentBalance.toLocaleString()}
            </span>
          </div>
          <p className="text-white/40 text-[10px] mt-2 font-medium">
            Min withdrawal: ৳ 50 • Admin processing fee: ৳ 0 (Free)
          </p>
        </div>

        {/* Step 1: Select Payment Option */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">1</span>
              Select Payment Option
            </label>
            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
              {selectedMethod} Selected
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((m) => {
              const isSelected = selectedMethod === m.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    setSelectedMethod(m.id);
                    setError(null);
                  }}
                  className={`relative flex items-center gap-3.5 p-4 rounded-2xl border transition-all text-left active:scale-95 ${
                    isSelected 
                      ? `${m.bgLight} ${m.borderColor} border-2 shadow-lg shadow-black/40 ring-1 ring-white/10` 
                      : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="shrink-0">
                    {m.logo === 'bKash' && <BkashIcon />}
                    {m.logo === 'Nagad' && <NagadIcon />}
                    {m.logo === 'Upay' && <UpayIcon />}
                    {m.logo === 'Rocket' && <RocketIcon />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-white leading-none">{m.name}</p>
                    </div>
                    <p className="text-[10px] text-white/40 font-medium truncate mt-1">{m.desc}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 size-4 rounded-full bg-primary text-background-dark flex items-center justify-center">
                      <span className="material-symbols-outlined text-[11px] font-black">check</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Account Number */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">2</span>
              {selectedMethod} Mobile Number
            </label>
            {userProfile?.phone && (
              <button
                type="button"
                onClick={handleUseMyPhone}
                className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
              >
                Use My Number
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl glass-card border border-white/10 focus-within:border-primary/60 transition-all bg-white/[0.02]">
            <div className="flex items-center gap-2 border-r border-white/10 pr-3 shrink-0">
              <span className="text-sm">🇧🇩</span>
              <span className="text-white/60 font-mono text-xs font-bold">+880</span>
            </div>
            <input 
              type="tel"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setError(null);
              }}
              placeholder="01XXXXXXXXX"
              maxLength={12}
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-white font-mono text-base font-bold placeholder:text-white/20"
            />
            {accountNumber.replace(/[^0-9]/g, '').length >= 11 && (
              <span className="material-symbols-outlined text-primary text-lg font-black shrink-0">
                check_circle
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/30 px-1 font-medium">
            Make sure your {selectedMethod} personal/agent account is active and can receive cash.
          </p>
        </div>

        {/* Step 3: Withdraw Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2">
              <span className="size-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">3</span>
              Withdraw Amount (৳)
            </label>
            <span className="text-[10px] text-white/40 font-mono">
              Max: ৳ {currentBalance.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl glass-card border border-white/10 focus-within:border-primary/60 transition-all bg-white/[0.02]">
            <span className="text-2xl font-black text-primary">৳</span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0"
              min="50"
              max={currentBalance}
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-white text-3xl font-black tracking-tight placeholder:text-white/20"
            />
          </div>

          {/* Quick Amount Chips */}
          <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
            {[500, 1000, 2000, 5000].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => handleQuickAmount(val)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black tracking-wider transition-all shrink-0 active:scale-95"
              >
                ৳ {val.toLocaleString()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleQuickAmount(currentBalance)}
              className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-black tracking-wider transition-all shrink-0 active:scale-95"
            >
              All (৳ {currentBalance.toLocaleString()})
            </button>
          </div>
        </div>

        {/* Step 4: Optional Notes */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-white/70 flex items-center gap-2 px-1">
            <span className="size-5 rounded-full bg-white/10 text-white/70 text-[10px] flex items-center justify-center font-bold">4</span>
            Note for Admin (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="e.g. Please send to personal bKash, emergency cashout..."
            className="w-full p-4 rounded-2xl glass-card border border-white/10 focus:border-primary/50 focus:ring-0 outline-none text-white text-xs placeholder:text-white/20 resize-none bg-white/[0.02]"
          />
        </div>

        {/* Admin Manual Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
          <span className="material-symbols-outlined text-amber-400 text-xl shrink-0 mt-0.5">
            admin_panel_settings
          </span>
          <div className="text-[11px] text-white/80 leading-relaxed">
            <p className="font-black text-amber-300 uppercase tracking-wider mb-0.5">
              Manual Admin Processing
            </p>
            When submitted, your withdrawal request is forwarded to our admin team. Admin will manually send <span className="text-white font-bold">৳ {amount ? parseFloat(amount) || 0 : 0}</span> to your <span className="text-primary font-bold">{selectedMethod}</span> number ({accountNumber || 'your number'}) and approve the transaction.
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 animate-in fade-in">
            <span className="material-symbols-outlined text-red-400">error</span>
            <p className="text-red-400 text-xs font-bold">{error}</p>
          </div>
        )}

        {/* Fixed Submit Button in Drawer */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-5 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-8 z-40">
          <button 
            type="submit"
            disabled={loading || currentBalance < 50}
            className="w-full h-15 py-4 rounded-2xl bg-primary text-background-dark font-black uppercase tracking-[0.18em] italic text-xs flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(19,236,218,0.3)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin font-black">sync</span>
                SENDING REQUEST TO ADMIN...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined font-black">send</span>
                REQUEST WITHDRAWAL TO ADMIN
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WithdrawFunds;
