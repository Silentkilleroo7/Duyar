import React, { useState, useEffect, useMemo } from 'react';
import { 
  searchNearestProviders, 
  RankedProvider, 
  ProximitySearchResult,
  getNextRadius 
} from '../proximityDispatcher';
import { haptics } from '../haptics';
import ProviderAvatar from './ProviderAvatar';

interface ProximityRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceCategory: string; // 'Maintenance' | 'Maid & Housekeeping' | 'Pick & Drop' | 'Security & CCTV'
  serviceSubCategory?: string; // e.g. 'Electrical', 'Housekeeping', 'Pickup', 'Residential'
  userArea: string;
  userAddress?: string;
  userLat?: number;
  userLng?: number;
  onSelectProvider: (provider: RankedProvider) => void;
  onConfirmWithoutSpecificProvider?: () => void;
  lang?: 'EN' | 'BN';
}

export const ProximityRadarModal: React.FC<ProximityRadarModalProps> = ({
  isOpen,
  onClose,
  serviceCategory,
  serviceSubCategory = '',
  userArea,
  userAddress = '',
  userLat,
  userLng,
  onSelectProvider,
  onConfirmWithoutSpecificProvider,
  lang = 'EN'
}) => {
  const isBn = lang === 'BN';
  const [currentRadiusKm, setCurrentRadiusKm] = useState<number>(2.0);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [autoExpandCountdown, setAutoExpandCountdown] = useState<number>(5);
  const [selectedProvider, setSelectedProvider] = useState<RankedProvider | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Reset radius whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentRadiusKm(2.0);
      setIsScanning(true);
      setAutoExpandCountdown(5);
      setSelectedProvider(null);
      setIsDispatching(false);
      haptics.selection();
    }
  }, [isOpen]);

  // Compute search result based on current radius
  const searchResult: ProximitySearchResult = useMemo(() => {
    return searchNearestProviders({
      userArea,
      userAddress,
      userLat,
      userLng,
      category: serviceCategory,
      subCategory: serviceSubCategory,
      radiusKm: currentRadiusKm
    });
  }, [userArea, userAddress, userLat, userLng, serviceCategory, serviceSubCategory, currentRadiusKm]);

  // Auto-select nearest as default selection
  useEffect(() => {
    if (searchResult.topPriorityNearest && !selectedProvider) {
      setSelectedProvider(searchResult.topPriorityNearest);
    }
  }, [searchResult.topPriorityNearest, selectedProvider]);

  // Auto-expand countdown timer if current radius has 0 or 1 provider
  useEffect(() => {
    if (!isOpen) return;
    if (searchResult.totalNearbyCount >= 3) return; // Sufficient providers found in local range
    if (!searchResult.canExpand) return;

    const timer = setInterval(() => {
      setAutoExpandCountdown(prev => {
        if (prev <= 1) {
          // Trigger expansion
          const next = getNextRadius(currentRadiusKm);
          setCurrentRadiusKm(next);
          haptics.selection();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, currentRadiusKm, searchResult.totalNearbyCount, searchResult.canExpand]);

  const handleManualRadiusExpand = (newRadius: number) => {
    haptics.selection();
    setCurrentRadiusKm(newRadius);
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 600);
  };

  const handleDispatch = (provider: RankedProvider) => {
    haptics.success();
    setIsDispatching(true);
    setTimeout(() => {
      onSelectProvider(provider);
      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  const topPriority = searchResult.topPriorityNearest;
  const listToRender = searchResult.providersWithinRadius.length > 0 
    ? searchResult.providersWithinRadius 
    : searchResult.allProvidersSorted.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0a1211] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header & Close */}
        <div className="p-5 pb-3 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="relative size-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-xl animate-pulse">radar</span>
              <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {isBn ? 'নিকটতম অগ্রাধিকার' : 'NEAREST TOP PRIORITY'}
                </span>
                <span className="text-[10px] text-white/50 font-mono">
                  {currentRadiusKm} km range
                </span>
              </div>
              <h2 className="text-white text-lg font-black tracking-tight mt-0.5 uppercase italic">
                {serviceSubCategory || serviceCategory} Dispatch
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
          
          {/* User Location Bar */}
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-base shrink-0">home_pin</span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {isBn ? 'আপনার সার্ভিস লোকেশন' : 'Service Location'}
                </p>
                <p className="text-white font-bold text-xs truncate">
                  {userAddress || userArea}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded-lg shrink-0">
              {searchResult.userLocation.lat.toFixed(3)}, {searchResult.userLocation.lng.toFixed(3)}
            </span>
          </div>

          {/* Interactive Radar Visualizer */}
          <div className="relative rounded-3xl bg-gradient-to-b from-[#0d1a18] to-[#070d0c] border border-primary/20 p-5 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            {/* Radar Circular Grid */}
            <div className="relative size-52 flex items-center justify-center">
              {/* Concentric Range Rings */}
              <div className="absolute inset-0 rounded-full border border-primary/15"></div>
              <div className="absolute inset-8 rounded-full border border-primary/25"></div>
              <div className="absolute inset-16 rounded-full border border-primary/40 bg-primary/[0.02]"></div>

              {/* Crosshair axes */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-primary/15 -translate-y-1/2"></div>
              <div className="absolute inset-y-0 left-1/2 w-px bg-primary/15 -translate-x-1/2"></div>

              {/* Rotating Radar Sweep Beam */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(19, 236, 218, 0.25) 360deg)',
                  animation: 'radar-sweep 3s linear infinite'
                }}
              ></div>

              {/* Center User Pin */}
              <div className="relative z-10 size-7 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(19,236,218,0.8)]">
                <span className="material-symbols-outlined text-black text-sm font-black">my_location</span>
              </div>

              {/* Nearest Provider Blip #1 (Top Priority) */}
              {topPriority && (
                <div 
                  className="absolute z-20 flex flex-col items-center animate-bounce"
                  style={{ top: '24%', right: '28%' }}
                  title={`${topPriority.name} - ${topPriority.distanceKm} km away`}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute size-6 rounded-full bg-primary/40 animate-ping"></span>
                    <ProviderAvatar 
                      name={topPriority.name} 
                      category={topPriority.category} 
                      role={topPriority.role} 
                      image={topPriority.avatar} 
                      size="xs" 
                      showOnlineDot={false} 
                    />
                  </div>
                  <span className="text-[8px] font-black uppercase text-primary bg-black/80 px-1 py-0.2 rounded mt-0.5 border border-primary/40">
                    #1 {topPriority.distanceKm}km
                  </span>
                </div>
              )}

              {/* Second Provider Blip */}
              {listToRender[1] && (
                <div 
                  className="absolute z-10 flex flex-col items-center opacity-85"
                  style={{ bottom: '26%', left: '22%' }}
                >
                  <ProviderAvatar 
                    name={listToRender[1].name} 
                    category={listToRender[1].category} 
                    role={listToRender[1].role} 
                    image={listToRender[1].avatar} 
                    size="xs" 
                    showOnlineDot={false} 
                  />
                  <span className="text-[7.5px] font-bold text-white/70 bg-black/70 px-1 rounded mt-0.5">
                    {listToRender[1].distanceKm}km
                  </span>
                </div>
              )}

              {/* Third Provider Blip */}
              {listToRender[2] && (
                <div 
                  className="absolute z-10 flex flex-col items-center opacity-70"
                  style={{ top: '35%', left: '16%' }}
                >
                  <ProviderAvatar 
                    name={listToRender[2].name} 
                    category={listToRender[2].category} 
                    role={listToRender[2].role} 
                    image={listToRender[2].avatar} 
                    size="xs" 
                    showOnlineDot={false} 
                  />
                  <span className="text-[7px] font-bold text-white/50 bg-black/70 px-0.5 rounded mt-0.5">
                    {listToRender[2].distanceKm}km
                  </span>
                </div>
              )}
            </div>

            {/* Radar Status Footer */}
            <div className="mt-3 text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="size-2 rounded-full bg-primary animate-ping"></span>
                <p className="text-xs font-bold text-white tracking-wide">
                  {searchResult.totalNearbyCount > 0 
                    ? `${searchResult.totalNearbyCount} Verified Providers Found in ${currentRadiusKm} km`
                    : `No immediate providers in ${currentRadiusKm} km. Auto-expanding range...`}
                </p>
              </div>
              <p className="text-[10px] text-white/50 font-medium">
                Prioritizing the closest specialists to ensure fastest arrival time.
              </p>
            </div>
          </div>

          {/* Dynamic Radius Selector & Range Expansion Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-primary">linear_scale</span>
                Search Radius
              </span>
              {searchResult.canExpand && (
                <button
                  type="button"
                  onClick={() => handleManualRadiusExpand(getNextRadius(currentRadiusKm))}
                  className="text-primary hover:underline text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                >
                  <span>Expand to {searchResult.nextRadiusKm} km</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[2.0, 5.0, 10.0, 18.0].map((radius) => {
                const isActive = currentRadiusKm === radius;
                return (
                  <button
                    type="button"
                    key={radius}
                    onClick={() => handleManualRadiusExpand(radius)}
                    className={`py-2 px-1 rounded-xl text-center text-xs transition-all border ${
                      isActive 
                        ? 'bg-primary text-black font-black border-primary shadow-[0_0_12px_rgba(19,236,218,0.4)] scale-105' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <p className="text-[11px] font-extrabold">{radius} km</p>
                    <p className="text-[8px] opacity-75 uppercase tracking-tighter">
                      {radius === 2.0 ? 'Priority' : radius === 5.0 ? 'Nearby' : radius === 10.0 ? 'Expanded' : 'Metro'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Priority Nearest Provider Spotlight Card OR Live Network Broadcast */}
          {topPriority ? (
            <div className="relative rounded-2xl bg-gradient-to-r from-primary/10 via-primary/[0.05] to-transparent border-2 border-primary/60 p-4 space-y-3 shadow-[0_0_25px_rgba(19,236,218,0.15)] group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-400 text-sm">stars</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    #1 Top Priority Nearest Specialist
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <ProviderAvatar 
                  name={topPriority.name} 
                  category={topPriority.category} 
                  role={topPriority.role} 
                  image={topPriority.avatar} 
                  size="lg" 
                  showOnlineDot={false} 
                />

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-extrabold text-sm uppercase tracking-tight truncate">
                    {topPriority.name}
                  </h3>
                  <p className="text-white/70 text-[11px] truncate">
                    {topPriority.role}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      Approved Specialist
                    </span>
                    <span className="text-white/30 text-[10px]">•</span>
                    <span className="text-primary font-bold text-[11px]">
                      {topPriority.priceRate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distance & ETA Pills */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04]">
                  <span className="material-symbols-outlined text-primary text-base">near_me</span>
                  <div>
                    <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">Proximity</p>
                    <p className="text-white font-extrabold text-xs">{topPriority.distanceKm} km ({topPriority.area.split(',')[0]})</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04]">
                  <span className="material-symbols-outlined text-emerald-400 text-base">bolt</span>
                  <div>
                    <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">Est. Arrival</p>
                    <p className="text-emerald-300 font-extrabold text-xs">~{topPriority.etaMinutes} mins</p>
                  </div>
                </div>
              </div>

              {/* Primary Instant Dispatch Action */}
              <button
                type="button"
                onClick={() => handleDispatch(topPriority)}
                disabled={isDispatching}
                className="w-full py-3 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isDispatching ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin font-black">sync</span>
                    <span>DISPATCHING NEAREST SPECIALIST...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base font-black">electric_bolt</span>
                    <span>DISPATCH NEAREST SPECIALIST (PRIORITY #1)</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="relative rounded-2xl bg-gradient-to-r from-primary/15 via-primary/[0.05] to-transparent border-2 border-primary/50 p-4 space-y-3 shadow-[0_0_25px_rgba(19,236,218,0.2)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm animate-pulse">cell_tower</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    Real-Time Dispatch Radar
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Network Active
                </span>
              </div>

              <div>
                <h3 className="text-white font-extrabold text-sm uppercase tracking-tight">
                  Broadcast to {serviceCategory || 'Service'} Providers
                </h3>
                <p className="text-white/60 text-xs mt-1">
                  Your ticket will be broadcasted to all authorized on-call specialists in the {userArea || 'Dhaka'} zone. First available partner accepts immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptics.bookingConfirmed();
                  if (onConfirmWithoutSpecificProvider) {
                    onConfirmWithoutSpecificProvider();
                  } else {
                    onSelectProvider({
                      id: `live-queue-${Date.now()}`,
                      name: `${serviceCategory} Specialist`,
                      role: `${serviceSubCategory || serviceCategory} • Live Pool`,
                      category: serviceCategory as any,
                      subCategory: serviceSubCategory,
                      phone: '+880 1700-000000',
                      rating: 5.0,
                      reviewCount: 0,
                      jobsCompleted: 0,
                      area: userArea || 'Banani, Dhaka',
                      address: userAddress || userArea || 'Banani, Dhaka',
                      lat: userLat || 23.7937,
                      lng: userLng || 90.4066,
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
                  }
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-primary text-black font-black uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base font-black">bolt</span>
                <span>BROADCAST TO LIVE PROVIDER NETWORK</span>
              </button>
            </div>
          )}

          {/* Other Nearby Providers in Range */}
          {listToRender.length > 1 && (
            <div className="space-y-2.5">
              <h4 className="text-white/60 text-[10px] font-black uppercase tracking-wider flex items-center justify-between px-1">
                <span>Other Verified Candidates in Radius</span>
                <span className="text-white/40">{listToRender.length - 1} Specialists</span>
              </h4>

              <div className="space-y-2">
                {listToRender.slice(1).map((prov) => (
                  <div
                    key={prov.id}
                    onClick={() => handleDispatch(prov)}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-primary/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ProviderAvatar 
                        name={prov.name} 
                        category={prov.category} 
                        role={prov.role} 
                        image={prov.avatar} 
                        size="md" 
                        showOnlineDot={false} 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-white font-bold text-xs truncate group-hover:text-primary transition-colors">
                            {prov.name}
                          </h5>
                          <span className="text-[9px] font-mono font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10">
                            {prov.distanceKm} km
                          </span>
                        </div>
                        <p className="text-white/50 text-[10px] truncate">{prov.role}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">
                            ★ {prov.rating}
                          </span>
                          <span className="text-white/30">•</span>
                          <span className="text-emerald-400 font-medium">ETA ~{prov.etaMinutes}m</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-primary font-bold text-xs">{prov.priceRate}</p>
                      <span className="text-[10px] text-primary/80 group-hover:text-primary font-black uppercase tracking-wider flex items-center justify-end gap-0.5 mt-1">
                        <span>Select</span>
                        <span className="material-symbols-outlined text-xs group-hover:translate-x-0.5 transition-transform">chevron_right</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold uppercase text-xs tracking-wider transition-colors"
          >
            Cancel
          </button>

          {onConfirmWithoutSpecificProvider && (
            <button
              type="button"
              onClick={() => {
                onConfirmWithoutSpecificProvider();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase text-xs tracking-wider transition-colors"
            >
              Broadcast Queue
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes radar-sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .fill-1 {
          font-variation-settings: 'FILL' 1;
        }
      `}</style>
    </div>
  );
};

export default ProximityRadarModal;
