import React, { useState, useEffect, useMemo } from 'react';
import { 
  SavedPropertyItem, 
  getStoredSavedProperties, 
  removeSavedProperty, 
  subscribeToSavedProperties, 
  syncSavedPropertiesFromSupabase 
} from '../savedPropertiesStorage';
import { VerifiedBadge } from './VerifiedBadge';

interface Props {
  onBack: () => void;
  onPropertySelect?: (property: any) => void;
  onBrowse?: () => void;
}

const SavedPropertiesView: React.FC<Props> = ({ onBack, onPropertySelect, onBrowse }) => {
  const [activeTab, setActiveTab] = useState<'RENT' | 'SALE'>('RENT');
  const [savedProperties, setSavedProperties] = useState<SavedPropertyItem[]>(() => getStoredSavedProperties());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    // Initial load from storage
    setSavedProperties(getStoredSavedProperties());

    // Subscribe to any changes from PropertyDetails or elsewhere
    const unsubscribe = subscribeToSavedProperties((items) => {
      setSavedProperties(items);
    });

    // Try background sync with Supabase database if configured
    syncSavedPropertiesFromSupabase()
      .then((items) => {
        if (items && items.length > 0) {
          setSavedProperties(items);
        }
      })
      .catch(() => {});

    return unsubscribe;
  }, []);

  const rentCount = useMemo(() => savedProperties.filter(p => p.tag === 'RENT').length, [savedProperties]);
  const saleCount = useMemo(() => savedProperties.filter(p => p.tag === 'SALE').length, [savedProperties]);

  const filteredProperties = useMemo(() => {
    return savedProperties.filter(p => p.tag === activeTab);
  }, [savedProperties, activeTab]);

  const handleRemove = async (e: React.MouseEvent, prop: SavedPropertyItem) => {
    e.stopPropagation();
    setRemovingId(prop.id);
    setTimeout(async () => {
      await removeSavedProperty(prop.id);
      setToastMsg(`Removed from saved`);
      setRemovingId(null);
      setTimeout(() => setToastMsg(null), 2200);
    }, 150);
  };

  const handleCardClick = (prop: SavedPropertyItem) => {
    if (onPropertySelect) {
      onPropertySelect({
        id: prop.propertyId || prop.id,
        title: prop.title,
        price: prop.price,
        location: prop.location,
        beds: prop.beds,
        baths: prop.baths,
        sqft: prop.sqft || 1500,
        image: prop.image,
        tag: prop.tag === 'SALE' ? 'FOR SALE' : 'FOR RENT',
        availableMonth: prop.availableMonth || 'This Month'
      });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden p-4 bg-background-dark font-display text-white selection:bg-primary/30 max-w-[480px] mx-auto">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-background-dark/95 border border-white/20 text-white px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <span className="material-symbols-outlined text-rose-400 text-sm">favorite</span>
          <span className="text-xs font-black uppercase tracking-wider italic">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 pt-4 relative z-10">
        <button 
          onClick={onBack} 
          className="flex size-10 items-center justify-center rounded-full glass hover:bg-white/10 active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-white text-xl">arrow_back_ios_new</span>
        </button>
        <div className="flex flex-col items-center flex-1 pr-10">
          <h2 className="text-primary text-sm font-black tracking-[0.15em] uppercase text-center italic">Saved Properties</h2>
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
            {savedProperties.length} Total Saved
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-1 py-2 mb-4 relative z-10">
        <div className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('RENT')}
            className={`flex cursor-pointer h-full grow items-center justify-center rounded-xl px-2 text-[11px] font-black tracking-widest transition-all gap-1.5 ${
              activeTab === 'RENT' 
                ? 'bg-primary text-background-dark shadow-md font-black' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span>RENT</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'RENT' ? 'bg-background-dark/20 text-background-dark' : 'bg-white/10 text-white/50'
            }`}>
              {rentCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SALE')}
            className={`flex cursor-pointer h-full grow items-center justify-center rounded-xl px-2 text-[11px] font-black tracking-widest transition-all gap-1.5 ${
              activeTab === 'SALE' 
                ? 'bg-primary text-background-dark shadow-md font-black' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span>SALE</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'SALE' ? 'bg-background-dark/20 text-background-dark' : 'bg-white/10 text-white/50'
            }`}>
              {saleCount}
            </span>
          </button>
        </div>
      </div>

      {/* Property List */}
      <div className="flex flex-col gap-3 pb-24 relative z-10">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((p) => {
            const isBeingRemoved = removingId === p.id;
            return (
              <div 
                key={p.id} 
                onClick={() => handleCardClick(p)}
                className={`glass rounded-2xl p-3.5 flex items-center gap-4 border border-white/5 hover:border-white/20 transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                  isBeingRemoved ? 'opacity-0 scale-95 duration-200' : 'animate-in fade-in slide-in-from-bottom-2'
                }`}
              >
                {/* Image & Favorite Toggle Button */}
                <div className="relative shrink-0">
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-22 shadow-lg border border-white/10" 
                    style={{ backgroundImage: `url('${p.image}')` }}
                  />
                  <button
                    type="button"
                    title="Remove from saved"
                    onClick={(e) => handleRemove(e, p)}
                    className="absolute top-1 right-1 size-7 rounded-full bg-background-dark/80 backdrop-blur-md flex items-center justify-center border border-rose-500/40 text-rose-500 hover:bg-rose-500/20 active:scale-90 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      favorite
                    </span>
                  </button>
                  <div className="absolute bottom-1 left-1 bg-background-dark/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-primary border border-white/10">
                    {p.tag}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <VerifiedBadge property={p} variant="compact" size="xs" />
                    {Boolean(p.isFeatured || p.metadata?.featured) && (
                      <span className="inline-flex items-center gap-0.5 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-white text-sm font-black leading-snug truncate italic">{p.title}</p>
                  <p className="text-primary text-base font-black mt-0.5">{p.price}</p>
                  
                  <div className="flex items-center gap-1 mt-1 text-white/50 text-[11px]">
                    <span className="material-symbols-outlined text-[13px] shrink-0 text-white/40">location_on</span>
                    <p className="truncate font-medium">{p.location}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                      <span className="material-symbols-outlined text-primary text-[12px]">bed</span>
                      <span className="text-[10px] font-bold text-white/70">{p.beds} Bed</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                      <span className="material-symbols-outlined text-primary text-[12px]">bathtub</span>
                      <span className="text-[10px] font-bold text-white/70">{p.baths} Bath</span>
                    </div>
                    {p.sqft && (
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                        <span className="material-symbols-outlined text-primary text-[12px]">square_foot</span>
                        <span className="text-[10px] font-bold text-white/70">{p.sqft} sqft</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center glass rounded-3xl border border-white/10 mt-4">
            <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-4 shadow-xl">
              <span className="material-symbols-outlined text-3xl">favorite_border</span>
            </div>
            <h3 className="text-white text-base font-black uppercase tracking-wider italic">
              No Saved {activeTab === 'RENT' ? 'Rental' : 'Sale'} Properties
            </h3>
            <p className="text-white/40 text-xs mt-1.5 max-w-xs leading-relaxed">
              Tap the heart icon on any property details view to save listings here for fast access and booking.
            </p>
            {(onBrowse || onBack) && (
              <button
                type="button"
                onClick={onBrowse || onBack}
                className="mt-6 px-5 py-3 rounded-xl bg-primary text-background-dark font-black text-xs uppercase tracking-widest italic active:scale-95 transition-all shadow-[0_0_20px_rgba(19,236,218,0.3)] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm font-bold">search</span>
                <span>Browse All Properties</span>
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default SavedPropertiesView;
