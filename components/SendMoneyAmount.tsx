
import React, { useState } from 'react';

interface Props {
  recipient: any;
  onBack: () => void;
  onConfirm: (amount: string) => void;
}

const SendMoneyAmount: React.FC<Props> = ({ recipient, onBack, onConfirm }) => {
  const [amount, setAmount] = useState('2,500');

  return (
    <div className="relative w-full h-screen bg-background-dark overflow-hidden flex flex-col font-display">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[30%] bg-primary/5 rounded-full blur-[80px]"></div>

      <div className="relative z-10 p-6 flex items-center">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center glass rounded-full hover:bg-white/10 transition-colors border border-white/10">
          <span className="material-symbols-outlined text-white">arrow_back_ios_new</span>
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 mt-4">
        <div className="glass-card rounded-2xl p-4 flex items-center gap-4 mb-12 bg-white/5 border border-white/10">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-cover bg-center border-2 border-primary/20" style={{ backgroundImage: `url("${recipient?.image}")` }}></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background-dark"></div>
          </div>
          <div className="flex flex-col">
            <h3 className="text-white font-semibold text-lg tracking-tight">{recipient?.name || 'Ariful Islam'}</h3>
            <p className="text-white/50 text-sm">{recipient?.phone || '+880 1712-XXXXXX'}</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="flex items-center gap-1">
            <span className="text-white/60 text-4xl font-light">৳</span>
            <div className="flex items-center">
              <span className="text-6xl font-bold tracking-tight">{amount}</span>
              <div className="w-[3px] h-12 bg-primary ml-1 animate-pulse rounded-full"></div>
            </div>
          </div>
          <p className="mt-4 text-white/40 text-sm font-medium tracking-wide">
            Available Balance: <span className="text-white/70">৳ 0.00</span>
          </p>
        </div>

        <div className="flex gap-3 py-6 overflow-x-auto no-scrollbar">
          {['100', '500', '1,000', '5,000'].map(val => (
            <button 
              key={val} 
              onClick={() => setAmount(val)}
              className={`flex h-11 shrink-0 items-center justify-center rounded-full glass px-6 transition-all ${amount === val ? 'bg-primary/20 border-primary text-primary font-bold' : 'border-white/10 text-white hover:border-primary/50'}`}
            >
              <p className="text-sm">৳ {val}</p>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3 px-5 py-4 glass-card rounded-2xl border border-white/10 focus-within:border-primary/40 transition-all">
            <span className="material-symbols-outlined text-white/30 text-xl">description</span>
            <input className="bg-transparent border-none p-0 focus:ring-0 text-white placeholder:text-white/20 text-base flex-1" placeholder="Add a note (Optional)" type="text"/>
          </div>
        </div>
      </div>

      <div className="relative z-10 p-6 pb-12">
        <button 
          onClick={() => onConfirm(amount)}
          className="w-full h-16 bg-primary rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(19,236,218,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <span className="text-background-dark font-black text-lg tracking-widest uppercase">SEND NOW</span>
          <span className="material-symbols-outlined text-background-dark font-bold">arrow_forward</span>
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default SendMoneyAmount;
