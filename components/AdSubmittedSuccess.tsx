
import React from 'react';

interface Props {
  onHome: () => void;
  onViewAds: () => void;
  adTitle: string;
}

const AdSubmittedSuccess: React.FC<Props> = ({ onHome, onViewAds, adTitle }) => {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-white font-display relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 map-pattern opacity-10 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]"></div>

      <main className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Success Icon Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping blur-xl"></div>
          <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-[0_0_60px_rgba(19,236,218,0.4)] border-4 border-background-dark animate-in zoom-in duration-700">
            <span className="material-symbols-outlined text-background-dark text-6xl font-black">done_all</span>
          </div>
        </div>

        {/* Textual Result */}
        <div className="text-center space-y-3 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-primary">Success!</h1>
          <p className="text-white/60 text-sm max-w-[300px] mx-auto leading-relaxed font-medium">
            Your advertisement for <span className="text-white font-bold">{adTitle || 'Modern Luxury Apartment'}</span> has been sent for final verification.
          </p>
        </div>

        {/* Preview Card */}
        <div className="w-full glass-card border border-primary/20 rounded-[32px] p-5 flex gap-5 mb-8 animate-in slide-in-from-bottom-8 duration-700 delay-200 bg-primary/5">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl">domain</span>
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Verifying Ad</span>
            </div>
            <h4 className="font-bold text-lg truncate leading-none mb-1">{adTitle || 'Modern 3BHK Luxury Flat'}</h4>
            <div className="flex items-center text-white font-black text-xl mb-1">
              <span className="text-xs text-primary mr-1">৳</span>
              <span>45,000</span>
              <span className="text-[10px] text-white/40 ml-1 font-bold">/ MO</span>
            </div>
            <div className="flex items-center text-white/30 text-[10px] uppercase font-black tracking-wider">
              <span className="material-symbols-outlined text-xs mr-1">near_me</span>
              <span className="truncate">Gulshan, Dhaka</span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="w-full space-y-4 mb-12 animate-in fade-in duration-1000 delay-400">
          <div className="flex items-center gap-4 px-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></div>
              <div className="w-0.5 h-6 bg-primary/30"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Submission Received</p>
          </div>
          <div className="flex items-center gap-4 px-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-white/10 ring-4 ring-transparent"></div>
              <div className="w-0.5 h-6 bg-white/5"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Security Review</p>
          </div>
          <div className="flex items-center gap-4 px-4">
            <div className="w-3 h-3 rounded-full bg-white/10"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Public Listing Live</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="w-full space-y-3.5 animate-in slide-in-from-bottom-4 duration-700 delay-500">
          <button 
            onClick={onHome}
            className="w-full bg-primary text-background-dark font-black h-18 rounded-[24px] shadow-[0_20px_40px_rgba(19,236,218,0.25)] tracking-[0.2em] uppercase transition-all active:scale-95 flex items-center justify-center gap-2.5 italic text-sm"
          >
            <span className="material-symbols-outlined font-black text-xl">explore</span>
            <span>VIEW LIVE PIN ON MAP</span>
          </button>
          <button 
            onClick={onViewAds}
            className="w-full glass border border-white/10 text-white/80 font-black h-16 rounded-[24px] tracking-widest uppercase transition-all active:scale-95 hover:bg-white/5 flex items-center justify-center gap-2 text-xs"
          >
            <span>Manage My Ads</span>
            <span className="material-symbols-outlined text-sm font-black">arrow_right_alt</span>
          </button>
        </div>

        <p className="mt-8 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em]">
          Duyar Verification Service v1.0.2
        </p>
      </main>

      <style>{`
        .map-pattern {
          background-image: radial-gradient(circle at 2px 2px, rgba(19, 236, 218, 0.1) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
};

export default AdSubmittedSuccess;
