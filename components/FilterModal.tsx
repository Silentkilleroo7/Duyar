
import React, { useState, useEffect } from 'react';
import { SearchFilters } from '../types';
import { haptics } from '../haptics';
import { useSwipeDownDismiss } from './useSwipeDownDismiss';

export const AVAILABLE_PROPERTY_TAGS = [
  { id: 'Pet Friendly', labelEn: 'Pet Friendly', labelBn: 'পোষা প্রাণী অনুমোদিত', icon: 'pets' },
  { id: 'Balcony', labelEn: 'Balcony', labelBn: 'বারান্দা', icon: 'balcony' },
  { id: 'Parking', labelEn: 'Parking', labelBn: 'পার্কিং', icon: 'local_parking' },
  { id: 'Elevator', labelEn: 'Elevator', labelBn: 'লিফট / এলিভেটর', icon: 'elevator' },
  { id: 'Generator', labelEn: 'Generator Backup', labelBn: 'জেনারেটর ব্যাকআপ', icon: 'bolt' },
  { id: 'Gas Pipeline', labelEn: 'Gas Pipeline', labelBn: 'তিতাস গ্যাস সংযোগ', icon: 'propane_tank' },
  { id: 'Security Guard', labelEn: '24/7 Guard', labelBn: '২৪/৭ নিরাপত্তা প্রহরী', icon: 'shield' },
  { id: 'Gym', labelEn: 'Fitness Gym', labelBn: 'ফিটনেস জিম', icon: 'fitness_center' },
  { id: 'CCTV', labelEn: 'CCTV Security', labelBn: 'সিসিটিভি ক্যামেরা', icon: 'videocam' },
  { id: 'Furnished', labelEn: 'Furnished', labelBn: 'ফার্নিশড', icon: 'chair' },
  { id: 'Swimming Pool', labelEn: 'Swimming Pool', labelBn: 'সুইমিং পুল', icon: 'pool' },
  { id: 'WiFi', labelEn: 'High-Speed WiFi', labelBn: 'ওয়াইফাই', icon: 'wifi' }
];

interface Props {
  filters?: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onBack: () => void;
  lang?: 'EN' | 'BN';
}

const FilterModal: React.FC<Props> = ({ filters, onApply, onBack, lang = 'EN' }) => {
  const [propertyType, setPropertyType] = useState(filters?.propertyType || 'Bachelor');
  const [priceRange, setPriceRange] = useState(filters?.maxBudget || 50);
  const [beds, setBeds] = useState(filters?.beds || '2');
  const [tenantType, setTenantType] = useState(filters?.tenantType || 'Family');
  const [radius, setRadius] = useState(filters?.radius || 12);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters?.tags || []);

  const isBn = lang === 'BN';
  const propertyTypeLabels: Record<string, { en: string; bn: string }> = {
    'Bachelor': { en: 'Bachelor', bn: 'ব্যাচেলর' },
    'Sub-let': { en: 'Sub-let', bn: 'সাবলেট' },
    'Family': { en: 'Family', bn: 'ফ্যামিলি' },
    'Flat / Apartment': { en: 'Flat / Apartment', bn: 'ফ্ল্যাট' },
    'Commercial': { en: 'Commercial', bn: 'বাণিজ্যিক' }
  };

  const tenantOptionLabels: Record<string, { en: string; bn: string }> = {
    'Family': { en: 'Family', bn: 'ফ্যামিলি' },
    'Bachelor': { en: 'Bachelor', bn: 'ব্যাচেলর' },
    'Female Only': { en: 'Female Only', bn: 'শুধু নারী / ছাত্রী' },
    'Any': { en: 'Any', bn: 'যেকোনো' },
    'Shop': { en: 'Shop', bn: 'দোকান' },
    'Office': { en: 'Office', bn: 'অফিস' },
    'Warehouse': { en: 'Warehouse', bn: 'গুদাম' },
    'Showroom': { en: 'Showroom', bn: 'শোরুম' }
  };

  const bedLabels: Record<string, { en: string; bn: string }> = {
    'Any': { en: 'Any', bn: 'যেকোনো' },
    '1': { en: '1', bn: '১' },
    '2': { en: '2', bn: '২' },
    '3': { en: '3', bn: '৩' },
    '4+': { en: '4+', bn: '৪+' }
  };

  const isCommercial = propertyType === 'Commercial';
  const residentialOptions = ['Family', 'Bachelor', 'Female Only', 'Any'];
  const commercialOptions = ['Shop', 'Office', 'Warehouse', 'Showroom'];
  
  useEffect(() => {
    if (isCommercial) {
      if (!commercialOptions.includes(tenantType)) setTenantType('Shop');
    } else {
      if (!residentialOptions.includes(tenantType)) setTenantType('Family');
    }
  }, [propertyType]);

  const toggleTag = (tagId: string) => {
    haptics.selection();
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleApply = () => {
    haptics.filterApplied();
    onApply({ 
      propertyType, 
      maxBudget: priceRange, 
      beds, 
      tenantType, 
      radius,
      tags: selectedTags
    });
  };

  const handleReset = () => {
    haptics.medium();
    setPropertyType('Flat'); 
    setPriceRange(50); 
    setBeds('2'); 
    setTenantType('Family'); 
    setRadius(12);
    setSelectedTags([]);
  };

  const {
    containerRef: swipeRef,
    style: swipeStyle,
    handleTouchProps: swipeHandleProps,
    isDragging: isSwipeDragging,
    offsetY: swipeOffsetY
  } = useSwipeDownDismiss({
    onDismiss: onBack,
    threshold: 80,
    resistance: 0.75,
    enabled: true
  });

  return (
    <div className="fixed inset-0 z-[100] bg-background-dark/95 backdrop-blur-md overflow-y-auto font-display">
      <div className="relative min-h-screen w-full flex flex-col justify-end">
        <div 
          ref={swipeRef}
          style={swipeStyle}
          className="bg-background-dark w-full rounded-t-[2.5rem] flex flex-col border-t border-white/10 shadow-2xl max-w-[430px] mx-auto relative"
        >
          <div className="absolute top-6 right-6 z-10">
             <button 
               type="button"
               id="close-filter-modal-btn"
               onClick={onBack} 
               className="flex size-10 items-center justify-center rounded-full bg-white/5 text-white/60 hover:text-white transition-all active:scale-90"
               aria-label="Close"
             >
                <span className="material-symbols-outlined text-[26px]">close</span>
             </button>
          </div>
          
          {/* Top Grab Handle for Swipe-Down-To-Dismiss */}
          <div 
            {...swipeHandleProps}
            className="w-full pt-3 pb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group"
            title="Swipe down to dismiss"
          >
            <div className={`h-1.5 w-14 mx-auto rounded-full transition-all duration-200 ${
              isSwipeDragging || swipeOffsetY > 0 
                ? 'bg-primary scale-x-110 shadow-[0_0_10px_rgba(19,236,218,0.5)]' 
                : 'bg-white/30 group-hover:bg-white/60'
            }`}></div>
            <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold mt-1">
              {isSwipeDragging ? 'Release to close' : 'Swipe down to dismiss'}
            </span>
          </div>
          
          <div className="flex items-center justify-between px-6 pt-2 pb-4 border-b border-white/5">
            <h1 className="text-white text-lg font-bold tracking-tight uppercase italic">
              {isBn ? 'ফিল্টার পরিবর্তন করুন' : 'Refine Search'}
            </h1>
            <button 
              type="button"
              id="reset-filter-modal-btn"
              onClick={handleReset} 
              className="text-primary text-[10px] font-black uppercase tracking-widest bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg mr-12 active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              <span>{isBn ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>

          <div className="px-6 py-6 space-y-10 pb-44">
            {/* Property Type Segmented Control */}
            <section>
              <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1 italic">
                {isBn ? 'প্রপার্টি টাইপ' : 'Listing Type'}
              </h3>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['Bachelor', 'Sub-let', 'Family', 'Flat / Apartment', 'Commercial'].map((type) => (
                  <button 
                    key={type} 
                    type="button"
                    id={`filter-type-${type.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => {
                      haptics.selection();
                      setPropertyType(type);
                    }} 
                    className={`flex h-11 shrink-0 items-center justify-center rounded-xl px-4 border transition-all ${propertyType === type ? 'bg-primary border-primary text-background-dark font-black shadow-[0_0_15px_rgba(19,236,218,0.3)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">{isBn ? (propertyTypeLabels[type]?.bn || type) : (propertyTypeLabels[type]?.en || type)}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Budget Slider */}
            <section>
              <div className="flex justify-between items-end mb-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] ml-1 italic">
                    {isBn ? 'সর্বোচ্চ বাজেট' : 'Max Budget'}
                  </h3>
                  <p className="text-[10px] text-white/20 font-bold uppercase">
                    {isBn ? 'মাসিক ভাড়া সীমা' : 'Monthly cost limit'}
                  </p>
                </div>
                <div className="flex items-baseline gap-1 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                  <span className="text-primary text-[10px] font-bold">৳</span>
                  <span className="text-primary text-lg font-black italic">{priceRange}k</span>
                </div>
              </div>
              <div className="relative h-6 flex items-center">
                <div className="absolute w-full h-1.5 bg-white/5 rounded-full"></div>
                <div 
                  className="absolute h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,218,0.4)]" 
                  style={{ width: `${(priceRange - 5) / (200 - 5) * 100}%` }}
                ></div>
                <input 
                  type="range" 
                  min="5" 
                  max="200" 
                  step="5" 
                  value={priceRange} 
                  onChange={(e) => {
                    haptics.selection();
                    setPriceRange(Number(e.target.value));
                  }} 
                  className="absolute w-full h-6 appearance-none bg-transparent cursor-pointer z-10 accent-white slider-thumb" 
                />
              </div>
              <div className="flex justify-between mt-3 px-1">
                <span className="text-[9px] font-black text-white/20 tracking-widest">5K</span>
                <span className="text-[9px] font-black text-white/20 tracking-widest">200K+</span>
              </div>
            </section>

            {/* Bedrooms Segmented Control */}
            <section>
              <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1 italic">
                {isBn ? 'বেডরুম' : 'Bedrooms'}
              </h3>
              <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                {['Any', '1', '2', '3', '4+'].map((opt) => (
                  <button 
                    key={opt}
                    type="button"
                    id={`filter-beds-${opt.toLowerCase()}`}
                    onClick={() => {
                      haptics.selection();
                      setBeds(opt);
                    }}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${beds === opt ? 'bg-primary text-background-dark shadow-lg' : 'text-white/40 hover:text-white/60'}`}
                  >
                    {isBn ? (bedLabels[opt]?.bn || opt) : opt}
                  </button>
                ))}
              </div>
            </section>

            {/* Tenant Type Segmented Control */}
            <section>
              <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1 italic">
                {isBn ? 'পছন্দের ভাড়াটিয়া' : 'Preferred Tenant'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(isCommercial ? commercialOptions : residentialOptions).map((opt) => (
                  <button 
                    key={opt}
                    type="button"
                    id={`filter-tenant-${opt.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => {
                      haptics.selection();
                      setTenantType(opt);
                    }}
                    className={`h-12 rounded-xl flex items-center justify-center border transition-all ${tenantType === opt ? 'bg-white text-background-dark border-white font-black' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{isBn ? (tenantOptionLabels[opt]?.bn || opt) : opt}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Tag-based Filtering System (e.g. Pet Friendly, Balcony, Parking) */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] ml-1 italic">
                    {isBn ? 'ট্যাগ ও সুবিধা অনুযায়ী ফিল্টার' : 'Features & Tags'}
                  </h3>
                  <p className="text-[10px] text-white/40 font-medium ml-1">
                    {isBn ? 'নির্দিষ্ট সুবিধা অনুযায়ী প্রপার্টি খুঁজুন' : 'Filter by tags like Pet Friendly, Balcony, Parking'}
                  </p>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full border border-primary/30 animate-in zoom-in duration-200">
                      {selectedTags.length} {isBn ? 'নির্বাচিত' : 'Selected'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedTags([])}
                      className="text-white/40 hover:text-white text-[9px] font-bold underline cursor-pointer"
                    >
                      {isBn ? 'মুছুন' : 'Clear'}
                    </button>
                  </div>
                )}
              </div>

              {/* Popular Tags Quick Preset */}
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar py-1">
                <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider shrink-0 mr-1">
                  {isBn ? 'জনপ্রিয়:' : 'Popular:'}
                </span>
                {['Pet Friendly', 'Balcony', 'Parking'].map(popTag => {
                  const isSelected = selectedTags.includes(popTag);
                  return (
                    <button
                      key={`pop-${popTag}`}
                      type="button"
                      onClick={() => toggleTag(popTag)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-primary/20 border-primary text-primary' 
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px]">
                        {popTag === 'Pet Friendly' ? 'pets' : popTag === 'Balcony' ? 'balcony' : 'local_parking'}
                      </span>
                      {popTag}
                      {isSelected && <span className="material-symbols-outlined text-[11px] font-black">check</span>}
                    </button>
                  );
                })}
              </div>

              {/* All Tags Grid */}
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_PROPERTY_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      id={`tag-filter-${tag.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      onClick={() => toggleTag(tag.id)}
                      className={`h-12 px-3 rounded-2xl flex items-center justify-between border transition-all active:scale-95 group ${
                        isSelected
                          ? 'bg-primary text-background-dark border-primary font-black shadow-[0_0_15px_rgba(19,236,218,0.25)]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden text-left">
                        <span className={`material-symbols-outlined text-lg shrink-0 transition-transform group-hover:scale-110 ${
                          isSelected ? 'text-background-dark' : 'text-primary'
                        }`}>
                          {tag.icon}
                        </span>
                        <span className="text-[11px] font-bold truncate">
                          {isBn ? tag.labelBn : tag.labelEn}
                        </span>
                      </div>
                      <div className={`size-4 rounded-full flex items-center justify-center shrink-0 border transition-all ml-1 ${
                        isSelected 
                          ? 'bg-background-dark text-primary border-background-dark' 
                          : 'border-white/20 group-hover:border-white/40'
                      }`}>
                        {isSelected ? (
                          <span className="material-symbols-outlined text-[11px] font-black">check</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Radius Slider */}
            <section>
              <div className="flex justify-between items-end mb-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] ml-1 italic">
                    {isBn ? 'অনুসন্ধানের পরিধি' : 'Search Radius'}
                  </h3>
                  <p className="text-[10px] text-white/20 font-bold uppercase">
                    {isBn ? 'বর্তমান অবস্থান থেকে দূরত্ব' : 'Distance from current point'}
                  </p>
                </div>
                <div className="text-white text-xs font-black bg-white/5 px-3 py-1 rounded-lg border border-white/10 uppercase tracking-widest">
                  {radius} KM
                </div>
              </div>
              <div className="relative h-6 flex items-center">
                <div className="absolute w-full h-1 bg-white/10 rounded-full"></div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={radius} 
                  onChange={(e) => setRadius(Number(e.target.value))} 
                  className="absolute w-full h-6 appearance-none bg-transparent cursor-pointer z-10 accent-primary slider-thumb" 
                />
              </div>
            </section>
          </div>

          {/* Action Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-background-dark/90 backdrop-blur-xl border-t border-white/10 z-20">
            <button 
              type="button"
              id="apply-filter-modal-btn"
              onClick={handleApply} 
              className="w-full bg-primary hover:bg-primary/90 text-background-dark font-black h-18 rounded-3xl text-[14px] shadow-[0_15px_30px_rgba(19,236,218,0.3)] uppercase tracking-[0.2em] italic active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>{isBn ? 'ফিল্টার প্রয়োগ করুন' : 'Apply Filter'}</span>
              {selectedTags.length > 0 && (
                <span className="bg-background-dark/20 text-background-dark text-xs px-2 py-0.5 rounded-full font-black">
                  {selectedTags.length}
                </span>
              )}
              <span className="material-symbols-outlined font-black">filter_list</span>
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .slider-thumb {
          -webkit-appearance: none;
        }
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #ffffff;
          border: 4px solid #13ecda;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(19, 236, 218, 0.5);
          transition: all 0.2s ease;
        }
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .h-18 { height: 4.5rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default FilterModal;

