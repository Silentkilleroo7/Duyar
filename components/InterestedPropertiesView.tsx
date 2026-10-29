import React, { useState } from 'react';
import { getStoredSavedProperties } from '../savedPropertiesStorage';

interface Props {
  onBack: () => void;
  onViewProperty?: (property: any) => void;
}

const InterestedPropertiesView: React.FC<Props> = ({ onBack, onViewProperty }) => {
  const [filter, setFilter] = useState<'YES' | 'MAYBE'>('YES');
  const savedProperties = getStoredSavedProperties();

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-hidden bg-background-dark font-display text-white selection:bg-primary/30">
      <div className="flex items-center px-4 pt-6 pb-2 justify-between">
        <button 
          type="button"
          onClick={onBack} 
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          Interested Pool
        </span>
      </div>

      <div className="px-4 pt-6 pb-3">
        <h1 className="text-primary tracking-tighter text-[32px] font-extrabold leading-none uppercase italic">
          Interested Listings
        </h1>
        <p className="text-white/50 text-xs mt-1">
          Your bookmarked and prioritized properties for scheduling visits.
        </p>
      </div>

      <div className="flex px-4 py-3">
        <div className="flex h-11 flex-1 items-center justify-center rounded-xl glass-card p-1 border border-white/5 bg-white/5">
          <button 
            type="button"
            onClick={() => setFilter('YES')}
            className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-[11px] font-black tracking-widest transition-all ${filter === 'YES' ? 'bg-primary text-background-dark shadow-sm' : 'text-white/40'}`}
          >
            <span>ACTIVE ({savedProperties.length})</span>
          </button>
          <button 
            type="button"
            onClick={() => setFilter('MAYBE')}
            className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-[11px] font-black tracking-widest transition-all ${filter === 'MAYBE' ? 'bg-primary text-background-dark shadow-sm' : 'text-white/40'}`}
          >
            <span>REVIEW</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-3 no-scrollbar">
        {savedProperties.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-card border border-white/5 space-y-3 mt-6">
            <span className="material-symbols-outlined text-primary text-4xl">favorite_border</span>
            <h3 className="text-white font-bold text-base">No Saved Properties</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              Explore the home feed and tap the bookmark icon on any residential listing to add it to your interested list.
            </p>
          </div>
        ) : (
          savedProperties.map((item) => (
            <div 
              key={item.id} 
              className="glass-card flex gap-3 p-3 rounded-xl items-center border border-white/5 bg-white/5 hover:border-primary/30 transition-colors"
            >
              <div className="relative shrink-0">
                {item.image && !item.image.includes('aida-public') ? (
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[84px] shadow-lg border border-white/10" 
                    style={{backgroundImage: `url('${item.image}')`}}
                  />
                ) : (
                  <div className="size-[84px] rounded-lg bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/30 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-3xl">apartment</span>
                  </div>
                )}
                <div className="absolute -top-1 -left-1 bg-primary text-background-dark text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                  {item.tag || 'VERIFIED'}
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center min-w-0">
                <p className="text-white text-sm font-bold leading-tight truncate">{item.title}</p>
                <p className="text-primary text-[11px] font-black leading-normal mt-0.5">
                  {item.price} • {item.beds} Beds • {item.sqft ? `${item.sqft} sqft` : item.location}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="material-symbols-outlined text-white/30 text-[12px]">location_on</span>
                  <p className="text-white/40 text-[10px] font-bold leading-none uppercase tracking-tighter truncate">
                    {item.location}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <button 
                  type="button"
                  onClick={() => onViewProperty?.(item)}
                  className="flex min-w-[70px] cursor-pointer items-center justify-center rounded-lg h-9 px-3 bg-primary text-background-dark text-[10px] font-black leading-normal uppercase shadow-lg shadow-primary/20 active:scale-95 transition-transform tracking-widest"
                >
                  VIEW
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default InterestedPropertiesView;
