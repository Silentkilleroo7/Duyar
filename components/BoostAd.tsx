
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
  onSelectPlan: (plan: any) => void;
}

const BoostAd: React.FC<Props> = ({ onBack, onSelectPlan }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<'basic' | 'premium' | 'ultra'>('premium');

  const plans = [
    { id: 'basic', title: 'Basic Boost', price: '500', duration: '3 Days' },
    { id: 'premium', title: 'Premium Boost', price: '1,000', duration: '7 Days', featured: true },
    { id: 'ultra', title: 'Ultra Boost', price: '2,000', duration: '15 Days', desc: 'Top search placement' }
  ];

  const handleActivate = () => {
    const plan = plans.find(p => p.id === selectedPlanId);
    onSelectPlan(plan);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-gradient-to-b from-background-dark to-black pb-10 font-display selection:bg-primary/30">
      <div className="flex items-center p-6 pb-2 justify-between sticky top-0 z-50">
        <button 
          onClick={onBack}
          className="glass-button text-white size-12 flex items-center justify-center rounded-full transition-transform active:scale-95 shadow-lg"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="px-6 pt-6">
        <h1 className="text-primary tracking-tight text-[32px] font-extrabold leading-tight uppercase">
          Boost Your Ad
        </h1>
        <p className="text-[#92c9c9] text-sm mt-1 opacity-80">Get up to 10x more views by boosting</p>
      </div>

      <div className="px-6 py-4">
        <div className="glass-card flex items-stretch justify-between gap-4 rounded-xl p-4 shadow-xl border border-white/5">
          <div className="flex flex-col justify-center gap-1 flex-[2_2_0px]">
            <p className="text-white text-base font-bold leading-tight">Modern 3BHK Apartment</p>
            <p className="text-primary text-sm font-semibold leading-normal">৳ 45,000</p>
            <div className="flex items-center gap-1 mt-1 text-[#92c9c9] text-[10px] uppercase tracking-wider">
              <span className="material-symbols-outlined text-[12px]">location_on</span>
              <span>Gulshan, Dhaka</span>
            </div>
          </div>
          <div 
            className="w-28 h-28 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-lg flex-none border border-primary/30 flex items-center justify-center text-primary"
          >
            <span className="material-symbols-outlined text-4xl">rocket_launch</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6 py-4">
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1 px-1">Select a Plan</p>
        {plans.map((plan) => (
          <label 
            key={plan.id}
            className={`flex items-center gap-4 rounded-xl border border-solid p-4 transition-all cursor-pointer group glass-card relative overflow-hidden ${
              selectedPlanId === plan.id ? 'border-primary bg-primary/10' : 'border-[#326767]'
            }`}
          >
            {plan.featured && (
              <div className="absolute top-0 right-0 bg-primary text-background-dark text-[10px] font-extrabold px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                Best Value
              </div>
            )}
            <input 
              className="h-6 w-6 border-2 border-[#326767] bg-transparent text-transparent checked:border-primary checked:bg-primary/10 focus:outline-none focus:ring-0 transition-all" 
              name="boost-plan" 
              type="radio"
              checked={selectedPlanId === plan.id}
              onChange={() => setSelectedPlanId(plan.id as any)}
            />
            <div className="flex grow flex-col">
              <p className="text-white text-base font-bold leading-tight">{plan.title}</p>
              <div className="flex items-center gap-2">
                <p className={`${selectedPlanId === plan.id ? 'text-primary' : 'text-[#92c9c9]'} text-sm font-extrabold`}>৳ {plan.price}</p>
                <span className="text-white/40 text-[10px] uppercase font-bold">• {plan.duration}</span>
              </div>
              {plan.desc && <p className="text-primary/70 text-[10px] font-semibold uppercase mt-1">{plan.desc}</p>}
            </div>
          </label>
        ))}
      </div>

      <div className="px-6 py-4 mt-2">
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 px-1">What's Included</p>
        <div className="glass-card rounded-xl p-2 px-4 border border-white/5">
          <div className="flex gap-x-3 py-3 items-center">
            <span className="material-symbols-outlined text-primary text-[20px] font-bold">check_circle</span>
            <p className="text-white text-sm font-medium leading-normal">Higher Search Ranking</p>
          </div>
          <div className="flex gap-x-3 py-3 border-t border-white/5 items-center">
            <span className="material-symbols-outlined text-primary text-[20px] font-bold">check_circle</span>
            <p className="text-white text-sm font-medium leading-normal">Featured Badge</p>
          </div>
        </div>
      </div>

      <div className="mt-auto px-6 pt-6 pb-8">
        <button 
          onClick={handleActivate}
          className="w-full bg-primary hover:bg-primary/90 text-background-dark font-extrabold text-lg py-4 rounded-full shadow-[0_8px_30px_rgba(19,236,218,0.3)] transition-transform active:scale-[0.98] uppercase tracking-wider"
        >
          Select Payment
        </button>
      </div>

      <style>{`
        .glass-card { background: rgba(25, 51, 51, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(50, 103, 103, 0.5) }
        .glass-button { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.1) }
      `}</style>
    </div>
  );
};

export default BoostAd;
