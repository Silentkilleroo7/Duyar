
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (option: string) => void;
  lang?: 'EN' | 'BN';
}

const translations = {
  EN: {
    title: "Sort By",
    apply: "Apply Sort",
    options: [
      { id: 'low-high', label: 'Price: Low to High', icon: 'payments' },
      { id: 'high-low', label: 'Price: High to Low', icon: 'currency_exchange' },
      { id: 'newest', label: 'Newest First', icon: 'calendar_today' },
      { id: 'popularity', label: 'Popularity', icon: 'trending_up' },
      { id: 'nearest', label: 'Nearest to Me', icon: 'near_me' }
    ]
  },
  BN: {
    title: "সাজান",
    apply: "প্রয়োগ করুন",
    options: [
      { id: 'low-high', label: 'দাম: কম থেকে বেশি', icon: 'payments' },
      { id: 'high-low', label: 'দাম: বেশি থেকে কম', icon: 'currency_exchange' },
      { id: 'newest', label: 'সবচেয়ে নতুন আগে', icon: 'calendar_today' },
      { id: 'popularity', label: 'জনপ্রিয়তা', icon: 'trending_up' },
      { id: 'nearest', label: 'আমার সবচেয়ে কাছে', icon: 'near_me' }
    ]
  }
};

const SortModal: React.FC<Props> = ({ isOpen, onClose, onApply, lang = 'EN' }) => {
  const [selected, setSelected] = React.useState('newest');
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Bottom Sheet */}
      <div className="relative w-full glass-panel rounded-t-[2.5rem] shadow-2xl border-t border-white/10 animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="h-1.5 w-12 rounded-full bg-white/20"></div>
        </div>

        <div className="px-6 pt-4 pb-2 text-center">
          <h3 className="text-primary tracking-[0.2em] text-sm font-extrabold uppercase">{t.title}</h3>
        </div>

        <div className="px-6 py-4 flex flex-col gap-3">
          {t.options.map((opt) => (
            <label 
              key={opt.id}
              className={`flex items-center justify-between gap-4 rounded-2xl p-4 cursor-pointer transition-all border ${
                selected === opt.id 
                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(19,236,218,0.1)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined text-[20px] ${selected === opt.id ? 'text-primary' : 'text-white/50'}`}>
                  {opt.icon}
                </span>
                <p className={`text-[15px] font-semibold tracking-tight ${selected === opt.id ? 'text-primary' : 'text-white'}`}>
                  {opt.label}
                </p>
              </div>
              <input 
                type="radio" 
                name="sort_option"
                checked={selected === opt.id}
                onChange={() => setSelected(opt.id)}
                className="w-6 h-6 border-2 border-white/20 bg-transparent text-primary focus:ring-0 checked:border-primary transition-all rounded-full"
              />
            </label>
          ))}
        </div>

        <div className="px-6 pt-2 pb-10">
          <button 
            onClick={() => { onApply(selected); onClose(); }}
            className="w-full h-14 bg-primary text-background-dark text-base font-extrabold tracking-wider rounded-2xl shadow-[0_0_20px_rgba(19,236,218,0.3)] active:scale-[0.97] transition-all uppercase"
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortModal;
