import React from 'react';

interface Props {
  onHome: () => void;
  ratingData?: {
    providerName?: string;
    providerRole?: string;
    providerImage?: string;
    serviceCategory?: string;
    rating?: number;
    tags?: string[];
  } | null;
}

const RatingSuccess: React.FC<Props> = ({ onHome, ratingData }) => {
  const providerName = ratingData?.providerName || 'Specialist';
  const providerRole = ratingData?.providerRole || 'Verified Partner';
  const providerImage = ratingData?.providerImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaX6sDjQxpvUGeB_0Not7GzlTANyX0X71oCtAQZnlfX-kNT3gwtoOBsEs1UeWpAm1ath0eBsxXu5SwYrJt0xkZt--1UO42wIRyfJiY1FbTZm_4n6S6LEOmFKpTF-fwJLpQVvN2yMO8iKFMIaVhmTdA2gkLZWk0SwOMa0Wi8KmJ2TnMkZo9Sql6FCefcWPX7V5nrbVNpjksJVtryOenL8Z38OAV6uzzy9zr7Z20NN-5foEcNq_zB9akXMpZrujmbxb0WY3foZr7iTA';
  const serviceCategory = ratingData?.serviceCategory || 'Service';
  const ratingScore = ratingData?.rating || 5;

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center overflow-x-hidden font-display relative text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12 flex flex-col items-center text-center">
        <div className="mb-8 relative">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(19,236,218,0.3)]">
            <span className="material-symbols-outlined text-background-dark text-4xl font-black">check</span>
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full border border-primary/30 scale-125 animate-pulse"></div>
        </div>

        <div className="mb-2">
          <h1 className="text-white text-3xl font-black tracking-tight leading-tight px-4 uppercase italic">
            Feedback <br/><span className="text-primary">Submitted!</span>
          </h1>
        </div>

        <div className="mb-8">
          <p className="text-white/50 text-xs font-medium leading-relaxed px-6 italic">
            Your verified review helps us maintain high standards and recognizes {providerName}&apos;s dedicated service.
          </p>
        </div>

        <div className="w-full mb-8">
          <div className="glass rounded-[2rem] p-5 flex items-center gap-4 text-left border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl">
            <div 
              className="w-16 h-16 rounded-2xl bg-center bg-cover border-2 border-primary/30 shrink-0" 
              style={{ backgroundImage: `url('${providerImage}')` }}
            />
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-white text-base font-black leading-tight uppercase italic tracking-tight truncate">
                {providerName}
              </p>
              <p className="text-primary text-[10px] font-bold uppercase tracking-wider mt-1 truncate">
                {serviceCategory}
              </p>
              <p className="text-white/40 text-[9px] font-medium uppercase tracking-wider mb-2 truncate">
                {providerRole}
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <span 
                    key={s} 
                    className={`material-symbols-outlined text-[15px] ${s <= ratingScore ? 'text-primary' : 'text-white/20'}`} 
                    style={{ fontVariationSettings: `'FILL' ${s <= ratingScore ? 1 : 0}` }}
                  >
                    star
                  </span>
                ))}
                <span className="ml-2 text-white/70 text-[10px] font-black uppercase tracking-tighter">
                  {ratingScore}.0 RATED
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <button 
            type="button"
            onClick={onHome} 
            className="flex items-center justify-center w-full h-14 bg-primary text-background-dark rounded-[1.2rem] font-black text-xs tracking-[0.2em] shadow-lg shadow-primary/20 active:scale-[0.98] transition-all uppercase"
          >
            Back to Home
          </button>
        </div>
      </div>
      <style>{`
        .glass {
          background: rgba(25, 51, 51, 0.4);
          backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default RatingSuccess;
