import React, { useState, useEffect } from 'react';
import {
  ComparisonProperty,
  getComparisonList,
  removeFromCompare,
  clearCompareList,
  subscribeToComparison,
  resetComparisonToDefault,
  parseNumericPrice
} from '../comparisonStorage';
import { VerifiedBadge } from './VerifiedBadge';

interface Props {
  onBack: () => void;
  onPropertySelect?: (property: any) => void;
  onBrowse?: () => void;
}

const PropertyComparisonView: React.FC<Props> = ({ onBack, onPropertySelect, onBrowse }) => {
  const [properties, setProperties] = useState<ComparisonProperty[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setProperties(getComparisonList());
    const unsub = subscribeToComparison((updated) => {
      setProperties(updated);
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleRemove = (e: React.MouseEvent, propId: string, title: string) => {
    e.stopPropagation();
    const updated = removeFromCompare(propId);
    setProperties(updated);
    showToast(`Removed "${title}" from comparison`);
  };

  const handleClearAll = () => {
    clearCompareList();
    setProperties([]);
    showToast('Comparison list cleared');
  };

  const handleResetSample = () => {
    const samples = resetComparisonToDefault();
    setProperties(samples);
    showToast('Loaded 2 sample properties for comparison');
  };

  const handleGoBrowse = () => {
    if (onBrowse) {
      onBrowse();
    } else {
      onBack();
    }
  };

  // Calculations across compared properties
  const minPrice = properties.length > 0 
    ? Math.min(...properties.map(p => p.numericPrice || parseNumericPrice(p.price)))
    : 0;

  const maxSize = properties.length > 0
    ? Math.max(...properties.map(p => p.sqft || 0))
    : 0;

  // Aggregate all unique amenities/tags from all compared properties
  const allAmenities = Array.from(
    new Set(
      properties.flatMap(p => p.tags || [])
    )
  );

  // Common amenities default list if none found
  const amenityKeys = allAmenities.length > 0
    ? allAmenities
    : ['Balcony', 'Parking', 'Elevator', 'Security Guard', 'Generator', 'Pet Friendly'];

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-28 bg-background-dark font-display text-white selection:bg-primary/30">
      {/* Real-time Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[90%] bg-primary text-background-dark px-4 py-2.5 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="material-symbols-outlined text-base font-black">sync</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-background-dark/85 backdrop-blur-xl border-b border-white/10 px-6 py-4 pt-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            id="compare-back-btn"
            onClick={onBack} 
            className="flex size-11 items-center justify-center rounded-2xl glass-button text-primary border border-primary/20 bg-primary/10 active:scale-95 transition-all shadow-inner"
            aria-label="Back to results"
          >
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Side-by-Side</span>
            </div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none text-white">
              Property Comparison
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {properties.length > 0 && (
            <button
              type="button"
              id="compare-clear-btn"
              onClick={handleClearAll}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 active:scale-95 transition-all"
              title="Clear all properties from comparison"
            >
              Clear All
            </button>
          )}

          <button
            type="button"
            id="compare-add-more-btn"
            onClick={handleGoBrowse}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-primary text-background-dark shadow-md shadow-primary/20 active:scale-95 transition-all"
            title="Browse results to add more properties"
          >
            <span className="material-symbols-outlined text-sm font-black">add</span>
            <span className="hidden sm:inline">Add Property</span>
          </button>
        </div>
      </header>

      {/* Sub-header status bar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
        <div>
          <p className="text-sm font-bold text-white/90">
            {properties.length === 0 && 'No properties selected'}
            {properties.length === 1 && '1 Property Selected'}
            {properties.length > 1 && `Comparing ${properties.length} Properties Side-by-Side`}
          </p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
            Persistent Comparison List • Stored in device state
          </p>
        </div>

        {properties.length > 0 && (
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
            {properties.length} of 4 slots
          </span>
        )}
      </div>

      {/* Main View Container */}
      <main className="flex-1 px-4 py-5 space-y-6">
        {/* EMPTY STATE */}
        {properties.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="size-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-[0_0_40px_rgba(19,236,218,0.15)]">
              <span className="material-symbols-outlined text-5xl">compare_arrows</span>
            </div>

            <h2 className="text-2xl font-black uppercase italic tracking-tight text-white mb-2">
              Comparison List is Empty
            </h2>
            <p className="text-sm text-white/50 max-w-md mb-8 font-sans leading-relaxed">
              Select properties from search results by tapping <strong className="text-primary font-bold">"Add to Compare"</strong> to inspect their pricing, specifications, and amenities side-by-side.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button
                type="button"
                id="btn-empty-browse-results"
                onClick={handleGoBrowse}
                className="flex-1 bg-primary text-background-dark py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base font-black">search</span>
                <span>Browse Results</span>
              </button>

              <button
                type="button"
                id="btn-empty-load-sample"
                onClick={handleResetSample}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base text-primary">auto_awesome</span>
                <span>Load 2 Samples</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* SINGLE PROPERTY NOTICE */}
            {properties.length === 1 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-400 text-xl">info</span>
                  <p className="text-xs text-amber-200/90 font-medium font-sans">
                    You have selected 1 property. Add at least 1 more property to view side-by-side differences.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGoBrowse}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-background-dark text-[10px] font-black uppercase tracking-wider shrink-0 active:scale-95 transition-all"
                >
                  + Add 2nd Property
                </button>
              </div>
            )}

            {/* SIDE-BY-SIDE PROPERTY COLUMNS */}
            <div className="overflow-x-auto no-scrollbar pb-2">
              <div className="min-w-[620px] space-y-4">
                {/* 1. PROPERTY HEADER CARDS ROW */}
                <div className="grid gap-3" style={{ gridTemplateColumns: `140px repeat(${properties.length}, minmax(220px, 1fr))` }}>
                  {/* Left Label Column */}
                  <div className="flex flex-col justify-end p-3 pb-4">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                      Properties
                    </span>
                    <span className="text-[11px] font-bold text-primary mt-1">
                      Side-by-Side Specs
                    </span>
                  </div>

                  {/* Property Card Columns */}
                  {properties.map((prop, idx) => {
                    const priceVal = prop.numericPrice || parseNumericPrice(prop.price);
                    const isLowestPrice = properties.length > 1 && priceVal > 0 && priceVal === minPrice;
                    const isLargestSize = properties.length > 1 && (prop.sqft || 0) === maxSize && maxSize > 0;

                    return (
                      <div 
                        key={prop.id || idx}
                        className="glass-card rounded-3xl p-4 border border-white/10 bg-white/[0.03] flex flex-col justify-between relative group hover:border-primary/40 transition-all shadow-xl"
                      >
                        {/* Remove from comparison button */}
                        <button
                          type="button"
                          id={`btn-remove-from-compare-${prop.propertyId || prop.id}`}
                          onClick={(e) => handleRemove(e, prop.propertyId || prop.id, prop.title)}
                          className="absolute top-3 right-3 size-8 rounded-full bg-black/60 hover:bg-rose-500/80 text-white/70 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/15 z-20 active:scale-90 transition-all shadow-md"
                          title="Remove from comparison"
                          aria-label={`Remove ${prop.title} from comparison`}
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>

                        <div>
                          {/* Image Thumbnail */}
                          <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden mb-3 border border-white/10 bg-black/40">
                            <img
                              src={prop.image}
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent" />
                            
                            {/* Verified / Featured tag */}
                            <div className="absolute bottom-2 left-2 flex items-center gap-1 flex-wrap">
                              <VerifiedBadge property={prop} variant="card" size="xs" />
                              <span className="bg-primary text-background-dark px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-md">
                                {prop.type || 'Flat'}
                              </span>
                            </div>
                          </div>

                          {/* Title & Location */}
                          <h3 className="text-sm font-black italic uppercase tracking-tight text-white line-clamp-1 group-hover:text-primary transition-colors">
                            {prop.title}
                          </h3>
                          <p className="text-[11px] text-white/50 flex items-center gap-1 mt-1 truncate">
                            <span className="material-symbols-outlined text-xs text-primary/80">location_on</span>
                            <span className="truncate">{prop.location}</span>
                          </p>

                          {/* Price Display */}
                          <div className="mt-3 flex items-baseline justify-between">
                            <div>
                              <p className="text-lg font-black text-primary tracking-tight">
                                {prop.price}
                                <span className="text-[10px] font-normal text-white/40">/mo</span>
                              </p>
                              {prop.sqft > 0 && priceVal > 0 && (
                                <p className="text-[9px] text-white/40 font-mono">
                                  ≈ ৳{Math.round(priceVal / prop.sqft)}/sqft
                                </p>
                              )}
                            </div>

                            {isLowestPrice && (
                              <span className="text-[9px] font-black uppercase bg-primary/20 text-primary border border-primary/40 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(19,236,218,0.3)]">
                                Best Value
                              </span>
                            )}
                            {!isLowestPrice && isLargestSize && (
                              <span className="text-[9px] font-black uppercase bg-white/10 text-white/80 border border-white/15 px-2 py-0.5 rounded-full">
                                Largest
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Property Action Button */}
                        <div className="mt-4 pt-3 border-t border-white/10">
                          {onPropertySelect ? (
                            <button
                              type="button"
                              onClick={() => onPropertySelect(prop)}
                              className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary hover:text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                            >
                              <span>View Details</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={onBack}
                              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-wider text-center"
                            >
                              In Comparison
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. SPECIFICATION COMPARISON MATRIX */}
                <div className="space-y-2 mt-6">
                  <div className="px-3 py-2">
                    <h4 className="text-xs font-black uppercase italic tracking-wider text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">tune</span>
                      <span>Key Specifications</span>
                    </h4>
                  </div>

                  {[
                    {
                      label: 'Rent / Month',
                      icon: 'payments',
                      getValue: (p: ComparisonProperty) => p.price,
                      isHighlight: (p: ComparisonProperty) => {
                        const priceVal = p.numericPrice || parseNumericPrice(p.price);
                        return properties.length > 1 && priceVal > 0 && priceVal === minPrice;
                      },
                      badgeText: 'Lowest Rent'
                    },
                    {
                      label: 'Price / sqft',
                      icon: 'calculate',
                      getValue: (p: ComparisonProperty) => {
                        const priceVal = p.numericPrice || parseNumericPrice(p.price);
                        return p.sqft > 0 && priceVal > 0 ? `৳${Math.round(priceVal / p.sqft)}/sqft` : 'N/A';
                      }
                    },
                    {
                      label: 'Area / Size',
                      icon: 'straighten',
                      getValue: (p: ComparisonProperty) => `${p.sqft || 0} sqft`,
                      isHighlight: (p: ComparisonProperty) => {
                        return properties.length > 1 && (p.sqft || 0) === maxSize && maxSize > 0;
                      },
                      badgeText: 'Largest Area'
                    },
                    {
                      label: 'Bedrooms',
                      icon: 'bed',
                      getValue: (p: ComparisonProperty) => `${p.beds} Beds`
                    },
                    {
                      label: 'Bathrooms',
                      icon: 'bathtub',
                      getValue: (p: ComparisonProperty) => `${p.baths} Baths`
                    },
                    {
                      label: 'Property Type',
                      icon: 'apartment',
                      getValue: (p: ComparisonProperty) => p.type || 'Flat'
                    },
                    {
                      label: 'Availability',
                      icon: 'calendar_month',
                      getValue: (p: ComparisonProperty) => p.availableMonth || 'Immediate'
                    },
                    {
                      label: 'Distance',
                      icon: 'near_me',
                      getValue: (p: ComparisonProperty) => {
                        return p.distance !== undefined ? `${p.distance.toFixed ? p.distance.toFixed(1) : p.distance} km away` : 'Within area';
                      }
                    }
                  ].map((row, rIdx) => (
                    <div 
                      key={row.label || rIdx} 
                      className="glass-card rounded-2xl p-3.5 grid items-center border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                      style={{ gridTemplateColumns: `140px repeat(${properties.length}, minmax(220px, 1fr))` }}
                    >
                      {/* Metric Title */}
                      <div className="flex items-center gap-2 pr-2">
                        <span className="material-symbols-outlined text-base text-primary/70">{row.icon}</span>
                        <span className="text-xs font-bold text-white/70">{row.label}</span>
                      </div>

                      {/* Values across properties */}
                      {properties.map((prop, pIdx) => {
                        const val = row.getValue(prop);
                        const isHigh = row.isHighlight ? row.isHighlight(prop) : false;

                        return (
                          <div key={prop.id || pIdx} className="px-3">
                            <p className={`text-xs font-bold ${isHigh ? 'text-primary' : 'text-white/90'}`}>
                              {val}
                            </p>
                            {isHigh && (
                              <span className="inline-block mt-1 text-[8px] font-black uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                                {row.badgeText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* 3. AMENITIES & FEATURES MATRIX */}
                <div className="space-y-2 mt-6">
                  <div className="px-3 py-2 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase italic tracking-wider text-primary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">checklist</span>
                      <span>Amenities & Features Check</span>
                    </h4>
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                      {amenityKeys.length} Features Evaluated
                    </span>
                  </div>

                  {amenityKeys.map((amenity, aIdx) => (
                    <div 
                      key={amenity || aIdx}
                      className="glass-card rounded-2xl p-3 grid items-center border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                      style={{ gridTemplateColumns: `140px repeat(${properties.length}, minmax(220px, 1fr))` }}
                    >
                      {/* Amenity Name */}
                      <div className="flex items-center gap-2 pr-2">
                        <span className="size-1.5 rounded-full bg-primary/70" />
                        <span className="text-xs font-medium text-white/80 truncate" title={amenity}>
                          {amenity}
                        </span>
                      </div>

                      {/* Feature check for each property */}
                      {properties.map((prop, pIdx) => {
                        const propTags = (prop.tags || []).map((t: any) => String(t).toLowerCase());
                        const hasFeature = propTags.includes(String(amenity).toLowerCase());

                        return (
                          <div key={prop.id || pIdx} className="px-3 flex items-center gap-1.5">
                            {hasFeature ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                <span className="material-symbols-outlined text-xs font-black">check</span>
                                <span>Included</span>
                              </div>
                            ) : (
                              <span className="text-white/20 text-xs font-mono pl-3">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* 4. SUMMARY DECISION BANNER */}
                {properties.length >= 2 && (
                  <div className="mt-8 p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-[#132c2a] to-primary/5 border border-primary/20 shadow-2xl">
                    <div className="flex items-start gap-3">
                      <div className="size-9 rounded-xl bg-primary text-background-dark flex items-center justify-center shrink-0 shadow-md">
                        <span className="material-symbols-outlined text-lg font-black">analytics</span>
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-black italic uppercase tracking-tight text-white">
                          Comparison Summary & Value Insight
                        </h5>
                        <p className="text-xs text-white/70 font-sans leading-relaxed">
                          <strong className="text-primary font-bold">
                            {properties.find(p => (p.numericPrice || parseNumericPrice(p.price)) === minPrice)?.title || properties[0].title}
                          </strong> offers the lowest monthly rent at ৳{minPrice.toLocaleString()}/mo, while <strong className="text-white font-bold">
                            {properties.find(p => (p.sqft || 0) === maxSize)?.title || properties[1].title}
                          </strong> provides the largest space ({maxSize} sqft) with expanded luxury amenities.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Bottom Quick Action Bar */}
      {properties.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-6 z-40 flex items-center justify-between gap-3 border-t border-white/5 backdrop-blur-xl">
          <button 
            type="button"
            id="compare-bottom-back-btn"
            onClick={onBack}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Back to Search</span>
          </button>

          <button
            type="button"
            id="compare-bottom-add-btn"
            onClick={handleGoBrowse}
            className="flex-1 bg-primary text-background-dark py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm font-black">add</span>
            <span>{properties.length < 4 ? 'Add Another' : 'Browse All'}</span>
          </button>
        </div>
      )}

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PropertyComparisonView;
