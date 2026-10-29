import React, { useState, useMemo } from 'react';
import { Provider } from '../types';
import { searchNearestProviders, RankedProvider } from '../proximityDispatcher';
import { haptics } from '../haptics';
import ProviderAvatar from './ProviderAvatar';

interface Props {
  serviceName: string;
  onBack: () => void;
  onSelect: (p: Provider) => void;
  userArea?: string;
}

const ProviderSelectionScreen: React.FC<Props> = ({ 
  serviceName, 
  onBack, 
  onSelect,
  userArea = 'Banani, Dhaka'
}) => {
  const [radiusFilter, setRadiusFilter] = useState<number>(2.0); // Default to 2.0 km nearest local zone
  const [selectedSort, setSelectedSort] = useState<'NEAREST' | 'TOP_RATED' | 'POPULAR'>('NEAREST');

  // Query proximity engine
  const searchResult = useMemo(() => {
    return searchNearestProviders({
      userArea,
      category: serviceName,
      radiusKm: radiusFilter
    });
  }, [userArea, serviceName, radiusFilter]);

  // Sort providers based on selected tab
  const displayedProviders = useMemo(() => {
    const list = radiusFilter >= 18 
      ? [...searchResult.allProvidersSorted] 
      : [...searchResult.providersWithinRadius];

    if (selectedSort === 'TOP_RATED') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (selectedSort === 'POPULAR') {
      return list.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
    }
    // Default NEAREST strictly sorts by proximity
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [searchResult, radiusFilter, selectedSort]);

  const handleSelect = (prov: RankedProvider) => {
    haptics.selection();
    // Map to Provider type
    const mapped: Provider = {
      id: prov.id,
      name: prov.name,
      rating: prov.rating,
      jobsDone: prov.jobsCompleted,
      location: `${prov.area} (📍 ${prov.distanceKm} km away)`,
      price: prov.priceRate,
      image: prov.avatar,
      online: prov.isOnline,
      category: prov.category
    };
    onSelect(mapped);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[480px] mx-auto bg-background-dark font-display text-white selection:bg-primary/30">
      {/* Header */}
      <header className="flex items-center p-6 pb-2 justify-between sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-white/5">
        <button 
          onClick={onBack} 
          className="flex size-11 items-center justify-center rounded-full glass-card hover:bg-white/10 transition-colors border border-white/10"
        >
          <span className="material-symbols-outlined text-white text-base">arrow_back</span>
        </button>
        <div className="text-center">
          <span className="text-[10px] font-black tracking-widest uppercase text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            Proximity Dispatch
          </span>
          <p className="text-[10px] text-white/40 mt-0.5 truncate max-w-[200px]">📍 {userArea}</p>
        </div>
        <div className="size-11 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl animate-pulse">radar</span>
        </div>
      </header>

      {/* Title */}
      <div className="px-6 pt-5">
        <h1 className="text-white text-2xl font-black uppercase italic tracking-tight">
          {serviceName} Specialists
        </h1>
        <p className="text-white/50 text-xs mt-1">
          Nearest service providers sorted by proximity on top priority.
        </p>
      </div>

      {/* Dynamic Radius Filter Pills (2km -> 5km -> 10km -> All Dhaka) */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/50 mb-2">
          <span>Search Range</span>
          <span className="text-primary">{displayedProviders.length} nearby</span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { label: '2.0 km (Priority)', km: 2.0 },
            { label: '5.0 km (Nearby)', km: 5.0 },
            { label: '10.0 km (Expanded)', km: 10.0 },
            { label: 'All Dhaka', km: 25.0 }
          ].map((item) => {
            const isActive = radiusFilter === item.km;
            return (
              <button
                type="button"
                key={item.km}
                onClick={() => {
                  haptics.selection();
                  setRadiusFilter(item.km);
                }}
                className={`flex h-9 shrink-0 items-center justify-center px-3.5 rounded-full text-xs font-bold transition-all border ${
                  isActive 
                    ? 'border-primary bg-primary text-black font-black shadow-[0_0_12px_rgba(19,236,218,0.35)] scale-105' 
                    : 'glass-card text-white/70 hover:text-white border-white/10'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort Chips */}
      <div className="flex gap-2 px-6 py-3 overflow-x-auto no-scrollbar">
        {[
          { key: 'NEAREST', label: '📍 Nearest First' },
          { key: 'TOP_RATED', label: '★ Top Rated' },
          { key: 'POPULAR', label: '⚡ Most Active' }
        ].map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => {
              haptics.selection();
              setSelectedSort(tab.key as any);
            }}
            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors border ${
              selectedSort === tab.key 
                ? 'bg-primary/20 text-primary border-primary/40' 
                : 'bg-white/5 text-white/50 border-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Providers List */}
      <div className="flex flex-col gap-3 px-4 pb-24">
        {displayedProviders.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white/[0.02] border border-white/10 space-y-3.5 mt-4">
            <span className="material-symbols-outlined text-primary text-4xl animate-pulse">cell_tower</span>
            <h3 className="text-white text-base font-bold">No registered specialists within {radiusFilter} km</h3>
            <p className="text-white/50 text-xs leading-relaxed">
              Broadcast your request to the live provider network or expand search radius across Dhaka.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  haptics.bookingConfirmed();
                  handleSelect({
                    id: `live-network-${Date.now()}`,
                    name: `${serviceName} Specialist`,
                    role: `${serviceName} • Live Network`,
                    category: serviceName as any,
                    subCategory: serviceName,
                    phone: '+880 1700-000000',
                    rating: 5.0,
                    reviewCount: 0,
                    jobsCompleted: 0,
                    area: userArea || 'Banani, Dhaka',
                    address: userArea || 'Banani, Dhaka',
                    lat: 23.7937,
                    lng: 90.4066,
                    distanceMeters: 0,
                    distanceKm: 0,
                    etaMinutes: 10,
                    priorityRank: 1,
                    priorityTier: 'TOP_PRIORITY_LOCAL',
                    priceRate: 'Standard Rate',
                    avatar: '',
                    isOnline: true,
                    badge: 'VERIFIED_SPECIALIST',
                    verifiedSince: '2024'
                  });
                }}
                className="w-full py-3 px-5 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-wider shadow-[0_0_15px_rgba(19,236,218,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm font-black">bolt</span>
                <span>Broadcast to Live Network</span>
              </button>
              {radiusFilter < 18.0 && (
                <button
                  type="button"
                  onClick={() => setRadiusFilter(18.0)}
                  className="w-full py-2.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold uppercase text-xs tracking-wider border border-white/10 active:scale-95 transition-all"
                >
                  Expand to Metro Range (18 km)
                </button>
              )}
            </div>
          </div>
        ) : (
          displayedProviders.map((p, idx) => {
            const isTopPriority = idx === 0 && selectedSort === 'NEAREST';
            return (
              <div 
                key={p.id} 
                onClick={() => handleSelect(p)} 
                className={`flex flex-col p-4 rounded-2xl cursor-pointer hover:bg-white/[0.06] transition-all border ${
                  isTopPriority 
                    ? 'bg-gradient-to-r from-primary/15 via-primary/[0.05] to-transparent border-primary/60 shadow-[0_0_20px_rgba(19,236,218,0.15)] ring-1 ring-primary/40' 
                    : 'glass-card bg-white/[0.02] border-white/5 hover:border-primary/30'
                }`}
              >
                {/* Priority Label for #1 */}
                {isTopPriority && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-primary/20">
                    <span className="text-[9.5px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">bolt</span>
                      #1 Top Priority Nearest Match
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      ETA ~{p.etaMinutes} mins
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3.5 justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ProviderAvatar 
                      name={p.name} 
                      category={p.category} 
                      role={p.role} 
                      image={p.avatar} 
                      size="lg" 
                      isOnline={p.isOnline} 
                      showOnlineDot={true} 
                    />

                    <div className="flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-sm font-black leading-tight uppercase truncate">{p.name}</p>
                        <span className="text-primary font-mono font-bold text-[10px] bg-primary/10 px-1.5 py-0.2 rounded shrink-0">
                          📍 {p.distanceKm} km
                        </span>
                      </div>

                      <p className="text-white/60 text-[11px] truncate mt-0.5">{p.role}</p>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-yellow-400 text-xs fill-1">star</span>
                        <p className="text-white/80 text-[11px] font-semibold">{p.rating} ({p.jobsCompleted}+ jobs)</p>
                        <span className="text-white/30 text-[10px]">•</span>
                        <p className="text-emerald-400 text-[10.5px] font-medium">~{p.etaMinutes}m away</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0 pl-2">
                    <p className="text-primary text-base font-extrabold leading-none">{p.priceRate}</p>
                    <div className="flex h-8 px-3 items-center justify-center rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider group-hover:brightness-110 active:scale-95 transition-all">
                      Select
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .fill-1 { font-variation-settings: 'FILL' 1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ProviderSelectionScreen;
