
import React from 'react';

interface Props {
  plan: any;
  onBack: () => void;
  onPay: () => void;
}

const BoostPayment: React.FC<Props> = ({ plan, onBack, onPay }) => {
  return (
    <div className="bg-background-dark text-white min-h-screen font-display selection:bg-primary/30 relative">
      <div className="relative flex min-h-screen w-full flex-col max-w-[430px] mx-auto overflow-hidden pb-10">
        <div className="px-6 pt-12 pb-4">
          <button onClick={onBack} className="glass-button flex items-center justify-center size-12 rounded-full text-white transition-all active:scale-95">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
        </div>

        <div className="px-6 mb-8">
          <div className="glass-card p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 size-32 bg-primary/10 blur-3xl rounded-full"></div>
            <div>
              <p className="text-[#92c9c9] text-xs font-medium uppercase tracking-widest mb-1">Selected Plan</p>
              <h2 className="text-xl font-bold text-white">{plan?.title || 'Premium Boost Plan'}</h2>
            </div>
            <div className="flex items-end justify-between pt-2 border-t border-white/5">
              <div>
                <p className="text-[#92c9c9] text-sm">Total Amount</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-primary text-2xl font-extrabold tracking-tight">৳</span>
                  <span className="text-white text-3xl font-extrabold tracking-tight">{plan?.price || '1,250'}</span>
                </div>
              </div>
              <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1">
                Secured
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 mb-4">
          <h3 className="text-white text-lg font-bold leading-tight tracking-tight">Select Payment Method</h3>
        </div>

        <div className="px-6 flex flex-col gap-3 mb-8">
          <label className="glass-card flex items-center gap-4 rounded-xl p-4 flex-row cursor-pointer transition-all active:bg-white/5">
            <div className="size-10 rounded-lg bg-[#e2136e]/10 flex items-center justify-center border border-[#e2136e]/20">
              <div className="size-8 bg-center bg-no-repeat bg-contain" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBR8O2HhObfxpzmL98aCRGDeWC7SXsI8gN5IfRFsTWEfB7oyGXbU96OE1jfvD76r5K7lCq_fPzJMN2PcALczBW9l6U7Fk5_uVxQ3VBodaKHdsVXiYIT4igw0e2OXMFML18tMXRC3BBOyh9Ha-Rb7RUryLvXOFSe_nia9C6nIfsqpFio7aRXEdus2u6_OwkidOx_OaZRemklbg5y96BYX9dMv7-NeHqXO7m0o7DVvHLuSCcPT9zfjSzyt2r2Budstbh9l0FNdKHjf84')" }}></div>
            </div>
            <div className="flex grow flex-col">
              <p className="text-white text-base font-semibold">bKash</p>
              <p className="text-[#92c9c9] text-xs">Faster & simpler way to pay</p>
            </div>
            <input defaultChecked className="radio-custom h-5 w-5 border-2 border-white/20 bg-transparent text-transparent checked:border-primary focus:ring-0 rounded-full" name="payment_method" type="radio"/>
          </label>

          <label className="glass-card flex items-center gap-4 rounded-xl p-4 flex-row cursor-pointer transition-all active:bg-white/5">
            <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <span className="material-symbols-outlined text-white/70">credit_card</span>
            </div>
            <div className="flex grow flex-col">
              <p className="text-white text-base font-semibold">Credit/Debit Card</p>
              <p className="text-[#92c9c9] text-xs">Visa, Mastercard, AMEX</p>
            </div>
            <input className="radio-custom h-5 w-5 border-2 border-white/20 bg-transparent text-transparent checked:border-primary focus:ring-0 rounded-full" name="payment_method" type="radio"/>
          </label>
        </div>

        <div className="px-6 mb-12">
          <div className="flex items-center glass-card rounded-full p-1 pr-4">
            <div className="flex-1 flex items-center px-4 py-2">
              <span className="material-symbols-outlined text-primary text-xl mr-2">sell</span>
              <input className="bg-transparent border-none focus:ring-0 text-white placeholder-[#92c9c9] text-sm w-full p-0" placeholder="Promo Code" type="text"/>
            </div>
            <button className="text-primary text-sm font-bold tracking-tight uppercase px-2">Apply</button>
          </div>
        </div>

        <div className="px-6 mt-auto mb-10">
          <button onClick={onPay} className="bg-primary hover:bg-primary/90 text-[#102222] font-bold text-lg w-full h-16 rounded-full shadow-[0_0_20px_rgba(19,236,218,0.3)] transition-all active:scale-[0.98] uppercase tracking-wider flex items-center justify-center gap-2">
            Pay Now
            <span className="material-symbols-outlined font-bold">arrow_forward</span>
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

export default BoostPayment;
