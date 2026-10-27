
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onSuccess: (amount: number) => void;
}

const AddMoney: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<string>('bkash');
  const currentBalance = 0;

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="relative flex h-screen w-full flex-col map-bg max-w-md mx-auto font-sans text-white selection:bg-primary/30 antialiased overflow-x-hidden">
      <header className="flex items-center p-6 pb-2 justify-between z-10">
        <button 
          onClick={onBack}
          className="flex size-11 shrink-0 items-center justify-center rounded-full glass-effect text-white cursor-pointer hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 className="text-primary text-base font-extrabold leading-tight tracking-[0.2em] flex-1 text-center pr-11 uppercase">ADD MONEY</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32 z-10">
        <div className="mb-8">
          <label className="text-[#92c9c5] text-[10px] font-bold uppercase tracking-widest mb-3 block opacity-70">Enter Amount</label>
          <div className="glass-effect rounded-2xl p-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-primary text-3xl font-bold">৳</span>
              <input 
                className="bg-transparent border-none text-white text-5xl font-extrabold focus:ring-0 w-full text-center placeholder-white/20" 
                placeholder="0" 
                type="number" 
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {quickAmounts.map((amt) => (
                <button 
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`px-4 py-2 rounded-full border transition-all text-xs font-bold ${amount === amt ? 'border-primary/40 bg-primary/10 text-primary' : 'glass-effect text-white/70 hover:border-primary/50'}`}
                >
                  ৳ {amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-white text-sm font-bold leading-tight tracking-tight mb-4">Select Payment Method</h3>
          <div className="flex flex-col gap-3">
            <PaymentOption 
              id="bkash" 
              label="bKash" 
              selected={paymentMethod === 'bkash'} 
              colorClass="border-l-pink-600" 
              iconBg="bg-pink-600" 
              onSelect={() => setPaymentMethod('bkash')} 
            />
            <PaymentOption 
              id="nagad" 
              label="Nagad" 
              selected={paymentMethod === 'nagad'} 
              colorClass="border-l-orange-500" 
              iconBg="bg-orange-600" 
              onSelect={() => setPaymentMethod('nagad')} 
            />
            <PaymentOption 
              id="card" 
              label="Credit / Debit Card" 
              selected={paymentMethod === 'card'} 
              colorClass="border-l-[#1a1f71]" 
              icon="credit_card" 
              onSelect={() => setPaymentMethod('card')} 
            />
          </div>
        </div>

        <div className="glass-effect rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[#92c9c5] text-[11px] font-medium opacity-80 uppercase tracking-tight">Current Balance</span>
            <span className="text-white text-xs font-bold">৳ {currentBalance.toLocaleString()}.00</span>
          </div>
          <div className="h-[1px] bg-white/5 w-full"></div>
          <div className="flex justify-between items-center">
            <span className="text-primary text-[11px] font-bold uppercase tracking-tight">New Balance After Deposit</span>
            <span className="text-primary text-xs font-extrabold">৳ {(currentBalance + amount).toLocaleString()}.00</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent z-20">
        <button 
          onClick={() => onSuccess(amount)}
          className="w-full bg-primary py-4 rounded-2xl text-background-dark font-black text-sm tracking-widest glow-button hover:brightness-110 active:scale-[0.98] transition-all uppercase"
        >
          PROCEED TO PAYMENT
        </button>
      </div>

      <style>{`
        .glass-effect {
          background: rgba(25, 51, 49, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(146, 201, 197, 0.15);
        }
        .glow-button {
          box-shadow: 0 0 20px rgba(19, 236, 218, 0.3);
        }
        .map-bg {
          background-image: linear-gradient(rgba(16, 34, 32, 0.94), rgba(16, 34, 32, 0.94)), url(https://lh3.googleusercontent.com/aida-public/AB6AXuBnaecYE6aQhp-IeydS94ypS2d6s3wcjzskt238wb6N5PUnkPeRjUAbDQHKFYv_HQOQ4BOzzxT02TJvpOpaZ151hkNzZpEcm4oMPTP-A19SSGf956t-86Eu3JScoHY_c-LUqm4LqM8RQEU_oVPkgRyGWp6Q-W3kSGNHW7ANSVXIrc4A_kcCuVMGlsRnp2QKgx-qKnQ-sy-0iNf7EX27_SmPfmxqP3xlmGPf_4jrZU3JtvNpgNbAPZ-9DI9ULsuY8w5TEYBJunRUMDE);
          background-size: cover;
          background-position: center;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

interface PaymentOptionProps {
  id: string;
  label: string;
  selected: boolean;
  colorClass: string;
  iconBg?: string;
  icon?: string;
  onSelect: () => void;
}

const PaymentOption: React.FC<PaymentOptionProps> = ({ label, selected, colorClass, iconBg, icon, onSelect }) => (
  <label 
    onClick={onSelect}
    className={`flex items-center justify-between p-4 rounded-xl glass-effect border-l-4 cursor-pointer hover:bg-white/5 transition-all ${colorClass} ${selected ? 'bg-white/5' : ''}`}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
        {iconBg ? (
          <div className={`${iconBg} w-full h-full flex items-center justify-center font-bold text-[10px]`}>{label}</div>
        ) : (
          <span className="material-symbols-outlined text-white/60 text-xl">{icon}</span>
        )}
      </div>
      <span className="text-sm font-bold">{label}</span>
    </div>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? 'border-primary' : 'border-white/20'}`}>
      {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-in zoom-in duration-200"></div>}
    </div>
  </label>
);

export default AddMoney;
