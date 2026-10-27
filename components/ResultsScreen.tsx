
import React, { useState, useMemo, useEffect } from 'react';
import { Property, SearchFilters } from '../types';
import { isPropertySaved, toggleSaveProperty, subscribeToSavedProperties } from '../savedPropertiesStorage';
import { 
  getComparisonList, 
  toggleCompareProperty, 
  isInCompare, 
  subscribeToComparison, 
  clearCompareList,
  ComparisonProperty 
} from '../comparisonStorage';
import SortModal from './SortModal';
import NotifyMeModal from './NotifyMeModal';
import { findExistingAlertForFilters, subscribeToSearchAlerts, SearchAlert } from '../searchAlertStorage';
import { haptics } from '../haptics';
import { supabase } from '../supabase';
import { getPostedProperties } from '../postedPropertiesStorage';
import { VerifiedBadge } from './VerifiedBadge';

interface Props {
  onBack: () => void;
  onFilter: () => void;
  onPropertySelect: (property: Property) => void;
  onCompare?: () => void;
  filters?: SearchFilters;
  onUpdateFilters?: (filters: SearchFilters) => void;
  lang?: 'EN' | 'BN';
}

const PROPERTY_COORDS: Record<string, { lat: number; lng: number }> = {
  '1': { lat: 23.7937, lng: 90.4066 }, // Banani
  '2': { lat: 23.7950, lng: 90.4130 }, // Gulshan 2
  '3': { lat: 23.8069, lng: 90.3685 }, // Mirpur 10
  '4': { lat: 23.8759, lng: 90.3795 }, // Uttara
  '5': { lat: 23.7509, lng: 90.3732 }, // Dhanmondi
};

const TAG_ICONS: Record<string, string> = {
  'Pet Friendly': 'pets',
  'Balcony': 'balcony',
  'Parking': 'local_parking',
  'Elevator': 'elevator',
  'Generator': 'bolt',
  'Gas Pipeline': 'propane_tank',
  'Security Guard': 'shield',
  'Gym': 'fitness_center',
  'CCTV': 'videocam',
  'Furnished': 'chair',
  'Swimming Pool': 'pool',
  'WiFi': 'wifi'
};

const translations = {
  EN: {
    title: "Search Results",
    compare: "Compare",
    compareNow: "Compare Now",
    selected: "Property Selected",
    mo: "/mo",
    bed: "Bed",
    bath: "Bath",
    sqft: "sqft",
    availableFrom: "Available from",
    noFoundTitle: "No Properties Found",
    noFoundDesc: "We couldn't find any properties matching your current filters. Try removing some tags or expanding your search area.",
    changeFilters: "Adjust Filters",
    clearTags: "Clear Tag Filters",
    activeTags: "Active Tags:",
    clearAll: "Clear all",
    propertiesFound: "Properties Found",
    tagMatches: "Matching selected features",
    notifyMe: "Notify Me",
    notifyMeActive: "Alert Active",
    notifyMeBanner: "Get notified when new matching properties are posted",
    notifyMeSub: "Instant email & app notifications for this search",
    notifyMeActiveDesc: "You will receive email & app alerts for new matches",
    manageAlert: "Manage Alert",
    setAlert: "Set Alert",
    notifyMeCardTitle: "Don't Miss Future Matches",
    notifyMeCardDesc: "Can't find what you need right now? Enable 'Notify Me' to get instant email and app alerts the moment a landlord posts a property matching these criteria.",
    notifyMeBtn: "Notify Me on New Matches",
    updateAlertBtn: "Update Search Alert",
    nav: { explore: "Explore", saved: "Saved", compare: "Compare", profile: "Profile" }
  },
  BN: {
    title: "অনুসন্ধানের ফলাফল",
    compare: "তুলনা করুন",
    compareNow: "এখনই তুলনা করুন",
    selected: "টি প্রপার্টি নির্বাচিত",
    mo: "/মাস",
    bed: "বেড",
    bath: "বাথ",
    sqft: "বর্গফুট",
    availableFrom: "উপলব্ধ",
    noFoundTitle: "কোনো প্রপার্টি পাওয়া যায়নি",
    noFoundDesc: "আপনার বর্তমান ফিল্টারের সাথে মিলে এমন কোনো প্রপার্টি খুঁজে পাওয়া যায়নি। কিছু ট্যাগ বাদ দিন বা এলাকা বাড়ান।",
    changeFilters: "ফিল্টার পরিবর্তন করুন",
    clearTags: "ট্যাগ ফিল্টার মুছুন",
    activeTags: "সক্রিয় ট্যাগ:",
    clearAll: "সব মুছুন",
    propertiesFound: "টি প্রপার্টি পাওয়া গেছে",
    tagMatches: "নির্বাচিত সুবিধা অনুযায়ী",
    notifyMe: "আমাকে জানান",
    notifyMeActive: "বিজ্ঞপ্তি চালু রয়েছে",
    notifyMeBanner: "নতুন প্রপার্টি পোস্ট হলে সাথে সাথে নোটিফিকেশন পান",
    notifyMeSub: "এই ফিল্টারের জন্য তাত্ক্ষণিক ইমেইল ও অ্যাপ সতর্কতা",
    notifyMeActiveDesc: "নতুন ম্যাচিং প্রপার্টি এলে আপনি নোটিফিকেশন পাবেন",
    manageAlert: "বিজ্ঞপ্তি পরিচালনা",
    setAlert: "বিজ্ঞপ্তি চালু করুন",
    notifyMeCardTitle: "ভবিষ্যতের নতুন প্রপার্টি মিস করবেন না",
    notifyMeCardDesc: "এখন মনের মতো প্রপার্টি পাচ্ছেন না? 'আমাকে জানান' সক্রিয় রাখুন; কোনো বাড়িওয়ালা এই ক্রাইটেরিয়ার প্রপার্টি পোস্ট করলেই সাথে সাথে ইমেইল ও অ্যাপ নোটিফিকেশন পাবেন।",
    notifyMeBtn: "নতুন প্রপার্টির তথ্য পেতে জানান",
    updateAlertBtn: "অনুসন্ধান বিজ্ঞপ্তি পরিবর্তন করুন",
    nav: { explore: "অন্বেষণ", saved: "সংরক্ষিত", compare: "তুলনা", profile: "প্রোফাইল" }
  }
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

const ResultsScreen: React.FC<Props> = ({ 
  onBack, 
  onFilter, 
  onPropertySelect, 
  onCompare, 
  filters, 
  onUpdateFilters,
  lang = 'EN' 
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isNotifyMeOpen, setIsNotifyMeOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [compareList, setCompareList] = useState<ComparisonProperty[]>(() => getComparisonList());
  const [compareToast, setCompareToast] = useState<{ message: string } | null>(null);
  const compareIds = useMemo(() => compareList.map(item => String(item.propertyId || item.id)), [compareList]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [, setFavVersion] = useState(0);
  const [currentAlert, setCurrentAlert] = useState<SearchAlert | undefined>(undefined);
  const t = translations[lang];
  const isBn = lang === 'BN';

  useEffect(() => {
    setCompareList(getComparisonList());
    const unsub = subscribeToComparison((updated) => {
      setCompareList(updated);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (filters) {
      setCurrentAlert(findExistingAlertForFilters(filters));
    }
  }, [filters]);

  useEffect(() => {
    const unsub = subscribeToSearchAlerts(() => {
      if (filters) {
        setCurrentAlert(findExistingAlertForFilters(filters));
      }
    });
    return unsub;
  }, [filters]);

  useEffect(() => {
    const unsub = subscribeToSavedProperties(() => {
      setFavVersion(v => v + 1);
    });
    return unsub;
  }, []);

  const handleFavoriteClick = async (e: React.MouseEvent, prop: any) => {
    e.stopPropagation();
    await toggleSaveProperty(prop);
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Location access denied or error:", error);
          setUserLocation({ lat: 23.7937, lng: 90.4066 }); 
        }
      );
    }
  }, []);

  const [dbProperties, setDbProperties] = useState<any[]>([]);

  useEffect(() => {
    const fetchDbProperties = async () => {
      const local = getPostedProperties();
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*');
        let dbMapped: any[] = [];
        if (!error && Array.isArray(data)) {
          dbMapped = data.map((p: any) => ({
            id: p.id,
            title: p.title || 'Property',
            price: p.price || '৳ 0',
            location: p.location || 'Dhaka',
            beds: Number(p.beds) || 2,
            baths: Number(p.baths) || 2,
            sqft: Number(p.sqft) || 1000,
            distance: 2,
            availableMonth: p.available_month || 'Immediate',
            image: p.image_url || p.image || '',
            tag: p.tag || 'FOR RENT',
            type: p.type || 'Family',
            isVerified: Boolean(p.is_verified || p.status === 'APPROVED'),
            isFeatured: Boolean(p.is_featured),
            tags: p.amenities || ['Parking', 'Elevator', 'Security Guard', 'Generator'],
            lat: Number(p.latitude ?? p.lat ?? 23.7937),
            lng: Number(p.longitude ?? p.lng ?? 90.4066)
          }));
        }

        const mapById = new Map<string, any>();
        local.forEach(p => mapById.set(p.id, {
          ...p,
          tags: p.amenities || ['Parking', 'Elevator', 'Security Guard']
        }));
        dbMapped.forEach(p => {
          if (!mapById.has(p.id)) {
            mapById.set(p.id, p);
          }
        });

        setDbProperties(Array.from(mapById.values()));
      } catch {
        setDbProperties(local.map(p => ({ ...p, tags: p.amenities || ['Parking', 'Elevator'] })));
      }
    };
    fetchDbProperties();
  }, []);

  const parsePrice = (priceStr: string) => {
    const numPart = priceStr.replace(/[^0-9]/g, '');
    return parseInt(numPart) || 0;
  };

  // Enhance properties with coordinates and dynamic distance
  const enhancedProperties = useMemo(() => {
    return dbProperties.map(p => {
      let dynamicDistance = p.distance || 2;
      if (userLocation && p.lat && p.lng) {
        dynamicDistance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, p.lat, p.lng);
      }
      return {
        ...p,
        dynamicDistance
      };
    });
  }, [dbProperties, userLocation]);

  // Filter properties by budget, radius, bedrooms, property type, and TAGS (e.g. Pet Friendly, Balcony, Parking)
  const filteredProperties = useMemo(() => {
    let result = [...enhancedProperties];
    
    if (filters) {
      result = result.filter(prop => {
        // Price limit
        const priceVal = parsePrice(prop.price);
        const matchesPrice = filters.maxBudget ? priceVal <= filters.maxBudget : true;
        
        // Distance radius
        const matchesRadius = filters.radius ? (prop.dynamicDistance || 0) <= filters.radius : true;

        // Bedrooms
        let matchesBeds = true;
        if (filters.beds && filters.beds !== 'Any') {
          if (filters.beds === '4+') {
            matchesBeds = prop.beds >= 4;
          } else {
            matchesBeds = prop.beds === parseInt(filters.beds);
          }
        }

        // Property type (Flat, House, Room, etc.)
        let matchesType = true;
        if (filters.propertyType && filters.propertyType !== 'All') {
          if (prop.type) {
            matchesType = prop.type.toLowerCase() === filters.propertyType.toLowerCase();
          }
        }

        // Tag-based filtering:
        // A property matches if it contains ALL active selected tags
        let matchesTags = true;
        if (filters.tags && filters.tags.length > 0) {
          const propTags = (prop.tags || []).map(t => t.toLowerCase());
          matchesTags = filters.tags.every(tag => 
            propTags.includes(tag.toLowerCase())
          );
        }

        return matchesPrice && matchesRadius && matchesBeds && matchesType && matchesTags;
      });
    }
    
    return result.sort((a, b) => {
      if (sortBy === 'low-high') return parsePrice(a.price) - parsePrice(b.price);
      if (sortBy === 'high-low') return parsePrice(b.price) - parsePrice(a.price);
      if (sortBy === 'nearest') return (a.dynamicDistance || 0) - (b.dynamicDistance || 0);
      return b.id.localeCompare(a.id);
    });
  }, [filters, enhancedProperties, sortBy]);

  const showCompareFeedback = (msg: string) => {
    setCompareToast({ message: msg });
    setTimeout(() => {
      setCompareToast(null);
    }, 3000);
  };

  const handleToggleCompare = (e: React.MouseEvent, prop: any) => {
    e.stopPropagation();
    const res = toggleCompareProperty(prop);
    setCompareList(res.list);
    if (res.added) {
      showCompareFeedback(
        isBn 
          ? `"${prop.title}" তুলনায় যুক্ত করা হয়েছে (${res.list.length}টি নির্বাচিত)` 
          : `Added "${prop.title}" to Comparison (${res.list.length} selected)`
      );
    } else {
      if (res.reason) {
        showCompareFeedback(res.reason);
      } else {
        showCompareFeedback(
          isBn
            ? `"${prop.title}" তুলনা থেকে সরানো হয়েছে`
            : `Removed "${prop.title}" from Comparison`
        );
      }
    }
  };

  const handleClearCompare = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearCompareList();
    setCompareList([]);
    showCompareFeedback(isBn ? 'তুলনা তালিকা খালি করা হয়েছে' : 'Comparison list cleared');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    haptics.selection();
    if (!filters || !onUpdateFilters) return;
    const newTags = (filters.tags || []).filter(t => t !== tagToRemove);
    onUpdateFilters({
      ...filters,
      tags: newTags
    });
  };

  const handleClearAllTags = () => {
    haptics.medium();
    if (!filters || !onUpdateFilters) return;
    onUpdateFilters({
      ...filters,
      tags: []
    });
  };

  const handleToggleTagFilter = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    haptics.selection();
    if (!filters || !onUpdateFilters) return;
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onUpdateFilters({
      ...filters,
      tags: newTags
    });
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-display overflow-x-hidden relative">
      {/* Compare Notification Toast */}
      {compareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-[92%] bg-primary text-background-dark px-4 py-2.5 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="material-symbols-outlined text-base font-black">compare_arrows</span>
          <span className="truncate flex-1">{compareToast.message}</span>
          {compareList.length >= 2 && onCompare && (
            <button
              type="button"
              id="toast-compare-now-btn"
              onClick={onCompare}
              className="ml-1 px-2.5 py-1 bg-background-dark text-primary rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 active:scale-95 transition-transform shadow-sm"
            >
              Compare
            </button>
          )}
        </div>
      )}
      <header className="fixed top-0 inset-x-0 z-50 glass px-6 pt-12 pb-4 flex flex-col gap-3 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              id="results-back-btn"
              onClick={onBack} 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 transition-transform"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-white">chevron_left</span>
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                {filteredProperties.length} {t.propertiesFound}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              type="button"
              id="results-set-alert-btn"
              onClick={() => setIsNotifyMeOpen(true)} 
              className={`h-10 px-3 rounded-full flex items-center gap-1.5 border active:scale-95 transition-all relative ${
                currentAlert && currentAlert.isActive
                  ? 'bg-primary text-background-dark font-black border-primary shadow-[0_0_15px_rgba(19,236,218,0.4)]' 
                  : 'bg-white/5 border-white/10 text-primary hover:bg-primary/10'
              }`}
              title="Set Alert: Notify me in-app if price drops below current filter criteria or matches are found"
              aria-label="Set Alert for current filter criteria"
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentAlert && currentAlert.isActive ? 'notifications_active' : 'notification_add'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                {currentAlert && currentAlert.isActive ? t.notifyMeActive : t.setAlert}
              </span>
              {currentAlert && currentAlert.isActive && (
                <span className="size-2 rounded-full bg-background-dark animate-ping"></span>
              )}
            </button>
            <button 
              type="button"
              id="results-sort-btn"
              onClick={() => setIsSortOpen(true)} 
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 transition-transform relative"
              aria-label="Sort options"
            >
              <span className="material-symbols-outlined text-white">swap_vert</span>
              {sortBy === 'nearest' && <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>}
            </button>
            <button 
              type="button"
              id="results-filter-btn"
              onClick={() => {
                haptics.filterApplied();
                onFilter();
              }} 
              className={`w-10 h-10 rounded-full flex items-center justify-center border active:scale-95 transition-transform relative ${
                filters?.tags && filters.tags.length > 0 
                  ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(19,236,218,0.3)]' 
                  : 'bg-white/5 border-white/10 text-white'
              }`}
              aria-label="Open filters"
            >
              <span className="material-symbols-outlined">tune</span>
              {Boolean(filters?.tags && filters.tags.length > 0) && (
                <span className="absolute -top-1 -right-1 size-5 bg-primary text-background-dark font-black text-[10px] rounded-full flex items-center justify-center shadow-md">
                  {filters?.tags?.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Tag Filter Bar */}
        {Boolean(filters?.tags && filters.tags.length > 0) && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
            <span className="text-[10px] text-white/40 font-black uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <span className="material-symbols-outlined text-xs text-primary">filter_alt</span>
              {t.activeTags}
            </span>
            <button
              type="button"
              id="tag-bar-notify-me-btn"
              onClick={() => setIsNotifyMeOpen(true)}
              className="bg-primary/20 text-primary border border-primary/40 hover:border-primary rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Set notification alert for these tags"
            >
              <span className="material-symbols-outlined text-xs">notifications_active</span>
              <span>{currentAlert && currentAlert.isActive ? t.notifyMeActive : t.notifyMe}</span>
            </button>
            {filters?.tags?.map(tag => (
              <button
                key={`active-tag-${tag}`}
                type="button"
                id={`active-tag-${tag.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => handleRemoveTag(tag)}
                className="bg-primary/20 text-primary border border-primary/40 hover:border-primary rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 flex items-center gap-1.5 transition-all group active:scale-95 shadow-sm"
                title={`Remove ${tag} filter`}
              >
                <span className="material-symbols-outlined text-xs">
                  {TAG_ICONS[tag] || 'sell'}
                </span>
                <span>{tag}</span>
                <span className="material-symbols-outlined text-xs group-hover:rotate-90 transition-transform">close</span>
              </button>
            ))}
            <button
              type="button"
              id="clear-all-tags-btn"
              onClick={handleClearAllTags}
              className="text-[10px] text-white/40 hover:text-white underline shrink-0 px-1 font-bold ml-1"
            >
              {t.clearAll}
            </button>
          </div>
        )}
      </header>

      <main className={`pb-44 px-4 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen ${
        filters?.tags && filters.tags.length > 0 ? 'pt-40' : 'pt-32'
      }`}>
        {/* Notify Me & Price Drop Alert inline banner */}
        <div className="glass-card rounded-2xl p-3.5 flex items-center justify-between border border-primary/20 bg-primary/5 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-lg">
                {currentAlert && currentAlert.isActive ? 'notifications_active' : 'trending_down'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white text-xs font-bold truncate">
                  {currentAlert && currentAlert.isActive ? (isBn ? 'মূল্য ও ম্যাচ অ্যালার্ট সক্রিয়' : 'Price Alert Active') : (isBn ? 'মূল্য কমার অ্যালার্ট সেট করুন' : 'Price Drop & Match Alert')}
                </p>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {filters?.maxBudget ? `≤ ৳${filters.maxBudget}k` : 'Criteria'}
                </span>
              </div>
              <p className="text-white/50 text-[10px] truncate">
                {currentAlert && currentAlert.isActive 
                  ? (isBn ? 'বাজেটের নিচে দাম কমলে ইন-অ্যাপ নোটিফিকেশন পাবেন' : 'In-app notification if price drops below your criteria')
                  : (isBn ? 'ভাড়া আপনার ফিল্টার বাজেটের নিচে কমলে তাৎক্ষণিক নোটিফিকেশন পাবেন' : 'Notify me in-app if price drops below current filter criteria')}
              </p>
            </div>
          </div>
          <button 
            type="button"
            id="set-alert-btn"
            data-testid="set-alert-button"
            onClick={() => setIsNotifyMeOpen(true)}
            className="bg-primary hover:bg-primary/90 text-background-dark text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all active:scale-95 shrink-0 ml-2 shadow-sm flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs font-black">
              {currentAlert && currentAlert.isActive ? 'tune' : 'notification_add'}
            </span>
            <span>{currentAlert && currentAlert.isActive ? (isBn ? 'ম্যানেজ' : 'Manage Alert') : (isBn ? 'অ্যালার্ট সেট' : 'Set Alert')}</span>
          </button>
        </div>

        {filteredProperties.length > 0 ? (
          filteredProperties.map((prop) => (
            <div 
              key={prop.id} 
              id={`property-card-${prop.id}`}
              onClick={() => onPropertySelect(prop as any)} 
              className="glass-card rounded-3xl overflow-hidden flex flex-col border border-white/5 shadow-2xl transition-all active:scale-[0.98] group cursor-pointer"
            >
              <div className="relative h-64 w-full">
                <img alt={prop.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src={prop.image} />
                <div className="absolute top-4 right-4 flex flex-col gap-3 items-end">
                  <button 
                    type="button"
                    onClick={(e) => handleFavoriteClick(e, prop)}
                    title={isPropertySaved(prop.id, prop.title) ? "Remove from saved" : "Save property"}
                    className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-90 ${
                      isPropertySaved(prop.id, prop.title)
                        ? 'bg-rose-500/30 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                        : 'bg-black/30 border-white/20 text-white/80 hover:text-white'
                    }`}
                  >
                    <span 
                      className="material-symbols-outlined text-[20px]"
                      style={{ fontVariationSettings: isPropertySaved(prop.id, prop.title) ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                  </button>
                  <button 
                    type="button"
                    id={`badge-compare-${prop.id}`}
                    onClick={(e) => handleToggleCompare(e, prop)} 
                    className={`flex items-center gap-1.5 backdrop-blur-md border px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 shadow-md ${
                      compareIds.includes(String(prop.id))
                        ? 'bg-primary text-background-dark border-primary font-black shadow-[0_0_12px_rgba(19,236,218,0.4)]'
                        : 'bg-black/50 hover:bg-black/70 border-white/20 text-white'
                    }`}
                    title={compareIds.includes(String(prop.id)) ? "Remove from comparison list" : "Add to comparison list"}
                  >
                    <span className="material-symbols-outlined text-xs font-black">
                      {compareIds.includes(String(prop.id)) ? 'check' : 'compare_arrows'}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">
                      {compareIds.includes(String(prop.id)) ? (isBn ? 'যুক্ত আছে' : 'Added') : t.compare}
                    </span>
                  </button>
                </div>
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                  <VerifiedBadge property={prop} variant="card" size="sm" lang={lang} />
                  {Boolean(prop.isFeatured || (prop as any).metadata?.featured) && (
                    <span className="inline-flex items-center gap-1 bg-amber-400/90 text-background-dark backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-lg">
                      <span className="material-symbols-outlined text-[12px] font-black">auto_awesome</span>
                      Featured
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 bg-primary text-background-dark px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">{prop.tag}</div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="text-lg font-bold truncate flex-1">{prop.title}</h2>
                  <p className="text-primary font-extrabold text-lg">{prop.price}<span className="text-xs font-normal text-white/40"> {t.mo}</span></p>
                </div>
                
                <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="truncate flex-1">{prop.location}</span>
                  {prop.dynamicDistance !== undefined && (
                    <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/80 shrink-0 border border-white/5">
                      {prop.dynamicDistance.toFixed(1)} km
                    </span>
                  )}
                </div>

                {/* Property specs (Beds / Baths / Sqft) */}
                <div className="flex items-center gap-4 text-xs font-medium text-white/60 py-2 border-y border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-white/40">bed</span>
                    <span>{prop.beds} {t.bed}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-white/40">bathtub</span>
                    <span>{prop.baths} {t.bath}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-white/40">straighten</span>
                    <span>{prop.sqft} {t.sqft}</span>
                  </div>
                </div>

                {/* Property Feature Tags (e.g. Pet Friendly, Balcony, Parking) */}
                {Boolean(prop.tags && prop.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-1">
                    {prop.tags?.map((tag) => {
                      const isFilteredTag = filters?.tags?.includes(tag);
                      return (
                        <button 
                          key={`prop-${prop.id}-tag-${tag}`}
                          type="button"
                          onClick={(e) => handleToggleTagFilter(e, tag)}
                          title={isFilteredTag ? `Active filter: click to remove ${tag}` : `Click to filter by ${tag}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                            isFilteredTag 
                              ? 'bg-primary text-background-dark font-black shadow-[0_0_12px_rgba(19,236,218,0.4)] border border-primary' 
                              : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5 hover:border-white/20'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[12px] ${isFilteredTag ? 'text-background-dark' : 'text-primary'}`}>
                            {TAG_ICONS[tag] || 'sell'}
                          </span>
                          <span>{tag}</span>
                          {isFilteredTag && (
                            <span className="material-symbols-outlined text-[10px] font-black">check</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Dedicated Action Row: Add to Compare & View Details */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    id={`btn-add-compare-${prop.id}`}
                    onClick={(e) => handleToggleCompare(e, prop)}
                    className={`flex-1 py-2.5 px-3 rounded-2xl border text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      compareIds.includes(String(prop.id))
                        ? 'bg-primary/20 hover:bg-primary/25 border-primary/40 text-primary shadow-[0_0_15px_rgba(19,236,218,0.25)] ring-1 ring-primary/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                    }`}
                    title={compareIds.includes(String(prop.id)) ? "Remove from comparison list" : "Add to comparison list"}
                  >
                    <span className={`material-symbols-outlined text-base ${compareIds.includes(String(prop.id)) ? 'font-black text-primary' : 'text-primary'}`}>
                      {compareIds.includes(String(prop.id)) ? 'check_circle' : 'compare_arrows'}
                    </span>
                    <span>
                      {compareIds.includes(String(prop.id)) 
                        ? (isBn ? 'তুলনায় যুক্ত আছে' : 'Added to Compare') 
                        : (isBn ? 'তুলনায় যুক্ত করুন' : 'Add to Compare')}
                    </span>
                  </button>

                  <button
                    type="button"
                    id={`btn-view-details-${prop.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPropertySelect(prop as any);
                    }}
                    className="py-2.5 px-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-all"
                    title="View property details"
                  >
                    <span>Details</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center pt-16">
            <div className="glass-card rounded-[2.5rem] p-8 w-full max-w-sm relative overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
               <div className="flex flex-col items-center text-center space-y-5">
                 <div className="size-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-primary/40 shadow-2xl">
                    <span className="material-symbols-outlined text-4xl">search_off</span>
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-white text-xl font-black uppercase italic tracking-tight">{t.noFoundTitle}</h2>
                    <p className="text-white/40 text-xs leading-relaxed font-medium">{t.noFoundDesc}</p>
                 </div>

                 {Boolean(filters?.tags && filters.tags.length > 0) && (
                   <div className="w-full bg-white/5 rounded-2xl p-3 border border-white/5">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
                       {isBn ? 'সক্রিয় ফিল্টার ট্যাগ:' : 'Filtered tags:'}
                     </p>
                     <div className="flex flex-wrap justify-center gap-1.5">
                       {filters?.tags?.map(tag => (
                         <span key={tag} className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-lg border border-primary/30">
                           {tag}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Notify Me in Empty State */}
                 <div className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 text-left space-y-2">
                   <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                     <span className="material-symbols-outlined text-base">notifications_active</span>
                     <span>{t.notifyMeCardTitle}</span>
                   </div>
                   <p className="text-white/70 text-xs leading-relaxed">
                     {t.notifyMeCardDesc}
                   </p>
                   <button
                     type="button"
                     id="empty-notify-me-btn"
                     onClick={() => setIsNotifyMeOpen(true)}
                     className="w-full h-11 bg-primary text-background-dark font-black text-xs tracking-wider rounded-xl uppercase italic shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-2 active:scale-95 transition-transform"
                   >
                     <span className="material-symbols-outlined text-base font-black">notification_add</span>
                     <span>{currentAlert ? t.updateAlertBtn : t.notifyMeBtn}</span>
                   </button>
                 </div>

                 <div className="w-full pt-2 space-y-2.5">
                    {Boolean(filters?.tags && filters.tags.length > 0) && (
                      <button 
                        type="button"
                        id="empty-clear-tags-btn"
                        onClick={handleClearAllTags} 
                        className="w-full h-12 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-black text-xs tracking-wider rounded-2xl uppercase italic transition-all flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                        <span>{t.clearTags}</span>
                      </button>
                    )}
                    <button 
                      type="button"
                      id="empty-change-filters-btn"
                      onClick={onFilter} 
                      className="w-full h-12 bg-primary text-background-dark font-black text-xs tracking-[0.2em] rounded-2xl uppercase italic shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm font-black">tune</span>
                      <span>{t.changeFilters}</span>
                    </button>
                    <button 
                      type="button"
                      id="empty-back-btn"
                      onClick={onBack} 
                      className="w-full h-10 glass border border-white/10 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all"
                    >
                      Back to Explore
                    </button>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {compareIds.length > 0 && (
        <div className="fixed bottom-28 inset-x-4 sm:inset-x-6 z-40 animate-in slide-in-from-bottom-6 duration-300">
          <div className="glass-panel rounded-2xl py-3 px-4 sm:px-5 flex items-center justify-between border border-primary/40 shadow-[0_0_35px_rgba(19,236,218,0.25)] bg-[#102220]/95 backdrop-blur-xl ring-1 ring-primary/20">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center text-background-dark font-black text-xs shadow-md">
                {compareIds.length}
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-white">
                  {compareIds.length} {compareIds.length === 1 ? 'Property Selected' : 'Properties Selected'}
                </p>
                <p className="text-[9px] text-white/50 uppercase tracking-widest font-semibold">
                  Side-by-side comparison ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-floating-clear-compare"
                onClick={handleClearCompare}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-wider transition-all"
                title="Clear comparison list"
              >
                Clear
              </button>
              <button 
                type="button"
                id="btn-floating-compare-now"
                onClick={onCompare} 
                className="bg-primary hover:bg-primary/90 text-background-dark px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all shadow-md shadow-primary/25 flex items-center gap-1.5"
              >
                <span>{t.compareNow}</span>
                <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <SortModal isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} onApply={(opt) => setSortBy(opt)} lang={lang} />

      <NotifyMeModal
        isOpen={isNotifyMeOpen}
        onClose={() => setIsNotifyMeOpen(false)}
        filters={filters || { propertyType: 'Flat', maxBudget: 50, beds: '2', tenantType: 'Family', radius: 12 }}
        lang={lang}
        onViewProperty={(p) => onPropertySelect(p)}
      />

      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/5 px-8 pt-4 pb-10 flex items-center justify-between backdrop-blur-3xl bg-background-dark/80">
        <button onClick={onBack} className="flex flex-col items-center gap-1 text-primary active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
          <span className="text-[10px] font-bold uppercase tracking-tight">{t.nav.explore}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/40 opacity-50"><span className="material-symbols-outlined text-[24px]">favorite</span><span className="text-[10px] font-bold uppercase tracking-tight">{t.nav.saved}</span></button>
        <button 
          type="button"
          id="nav-compare-button"
          onClick={onCompare} 
          className="flex flex-col items-center gap-1 text-white/70 hover:text-primary active:scale-95 transition-all relative group"
        >
          <div className="relative">
            <span className="material-symbols-outlined text-[24px] group-hover:text-primary transition-colors">compare_arrows</span>
            {compareIds.length > 0 && (
              <span className="absolute -top-1 -right-2 size-4 rounded-full bg-primary text-background-dark font-black text-[9px] flex items-center justify-center shadow-md">
                {compareIds.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-tight group-hover:text-primary transition-colors">{t.nav.compare}</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/40 opacity-50"><span className="material-symbols-outlined text-[24px]">person</span><span className="text-[10px] font-bold uppercase tracking-tight">{t.nav.profile}</span></button>
      </nav>

      <style>{`
        .glass-panel { background: rgba(16, 34, 32, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(19, 236, 218, 0.1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ResultsScreen;

