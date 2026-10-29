
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getReviewsForProperty } from '../visitStorage';
import { isPropertySaved, toggleSaveProperty, subscribeToSavedProperties } from '../savedPropertiesStorage';
import {
  ComparisonProperty,
  getComparisonList,
  isInCompare,
  addToCompare,
  toggleCompareProperty,
  removeFromCompare,
  clearCompareList,
  subscribeToComparison,
  parseNumericPrice,
  resetComparisonToDefault
} from '../comparisonStorage';
import { VisitReview, PropertyMetadata } from '../types';
import { supabase } from '../supabase';
import VirtualTour360 from './VirtualTour360';
import { haptics } from '../haptics';
import { useSwipeDownDismiss } from './useSwipeDownDismiss';
import { getListingProviderVerification } from '../providerApplicationsStorage';
import { VerifiedBadge } from './VerifiedBadge';

interface PropertyDetailsProps {
  onBack: () => void;
  onBook: () => void;
  onApply: () => void;
  onRate?: () => void;
  onCompare?: () => void;
  property?: any;
}

const ALL_KEY_AMENITIES = [
  { key: 'parking', label: 'Dedicated Parking', icon: 'local_parking' },
  { key: 'elevator', label: 'High-speed Elevator', icon: 'elevator' },
  { key: 'generator', label: 'Standby Generator', icon: 'bolt' },
  { key: 'security', label: '24/7 Security Guard', icon: 'security' },
  { key: 'cctv', label: 'CCTV Surveillance', icon: 'videocam' },
  { key: 'balcony', label: 'Private Balcony', icon: 'balcony' },
  { key: 'gas', label: 'Gas Supply Connection', icon: 'propane' },
  { key: 'pet', label: 'Pet Friendly', icon: 'pets' },
  { key: 'gym', label: 'Fitness Gym', icon: 'fitness_center' },
  { key: 'pool', label: 'Swimming Pool', icon: 'pool' },
];

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ onBack, onBook, onApply, onRate, onCompare, property }) => {
  const isSale = property?.tag?.toLowerCase().includes('sale');
  const title = property?.title || "Modern 3BHK Luxury Flat";
  const price = property?.price || "৳ 45,000";
  const location = property?.location || "Block D, Banani";
  const availableMonth = property?.availableMonth || "November";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  
  const [isSaved, setIsSaved] = useState<boolean>(() => isPropertySaved(property?.id, title));
  const [inCompare, setInCompare] = useState<boolean>(() => isInCompare(property?.id));
  const [compareList, setCompareList] = useState<ComparisonProperty[]>(() => getComparisonList());
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [isAnimatingCompare, setIsAnimatingCompare] = useState<boolean>(false);
  const [isVirtualTourModalOpen, setIsVirtualTourModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAnimatingFav, setIsAnimatingFav] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<'VERIFIED' | 'FEATURED' | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Swipe-down-to-dismiss gesture for fluid navigation back to Home / Search Results
  const {
    containerRef: swipeContainerRef,
    style: swipeStyle,
    handleTouchProps: swipeHandleProps,
    isDragging: isSwipeDragging,
    offsetY: swipeOffsetY
  } = useSwipeDownDismiss({
    onDismiss: onBack,
    threshold: 85,
    resistance: 0.75,
    enabled: true
  });

  // Database metadata state for real-time synchronization
  const [dbPropertyData, setDbPropertyData] = useState<{
    metadata?: PropertyMetadata;
    isVerified?: boolean;
    isFeatured?: boolean;
  } | null>(null);

  // Fetch real-time metadata from Supabase if property ID exists
  useEffect(() => {
    if (!property?.id) return;
    let isMounted = true;
    const fetchDbMetadata = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', property.id)
          .maybeSingle();

        if (!error && data && isMounted) {
          const rawMeta = data.metadata || {};
          const isVfd = Boolean(data.is_verified ?? data.verified ?? rawMeta.verified ?? (data.verification_status === 'VERIFIED') ?? (data.status === 'APPROVED'));
          const isFtd = Boolean(data.is_featured ?? data.featured ?? rawMeta.featured ?? data.tag?.toLowerCase().includes('featured') ?? data.tag?.toLowerCase().includes('boost'));
          setDbPropertyData({
            metadata: rawMeta,
            isVerified: isVfd,
            isFeatured: isFtd
          });
        }
      } catch (err) {
        // Fall back gracefully to passed properties
      }
    };
    fetchDbMetadata();
    return () => { isMounted = false; };
  }, [property?.id]);

  // Combine database metadata with passed property metadata
  const effectiveMetadata: PropertyMetadata = useMemo(() => {
    return {
      ...(property?.metadata || {}),
      ...(dbPropertyData?.metadata || {})
    };
  }, [property?.metadata, dbPropertyData?.metadata]);

  const isVerified: boolean = useMemo(() => {
    if (dbPropertyData?.isVerified !== undefined) return dbPropertyData.isVerified;
    const baseCheck = Boolean(
      property?.isVerified ||
      property?.is_verified ||
      property?.verified ||
      effectiveMetadata.verified ||
      effectiveMetadata.is_verified ||
      property?.verification_status === 'VERIFIED'
    );
    if (baseCheck) return true;
    return getListingProviderVerification({ ...property, metadata: effectiveMetadata }).isVerified;
  }, [dbPropertyData?.isVerified, property, effectiveMetadata]);

  // Comprehensive Provider Verification Info (Landlord vs Locator vs Duyar Inspection)
  const vInfo = useMemo(() => {
    return getListingProviderVerification({
      ...property,
      metadata: effectiveMetadata,
      isVerified: isVerified
    });
  }, [property, effectiveMetadata, isVerified]);

  const isFeatured: boolean = useMemo(() => {
    if (dbPropertyData?.isFeatured !== undefined) return dbPropertyData.isFeatured;
    return Boolean(
      property?.isFeatured ||
      property?.is_featured ||
      property?.featured ||
      effectiveMetadata.featured ||
      effectiveMetadata.is_featured ||
      property?.tag?.toLowerCase().includes('featured') ||
      property?.tag?.toLowerCase().includes('boost')
    );
  }, [dbPropertyData?.isFeatured, property, effectiveMetadata]);

  // Derived metadata values for badge & modal display
  const verificationDetails = useMemo(() => {
    const rawCert = effectiveMetadata.verificationCertificateId || `DYR-VFD-${String(property?.id || '8492').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`;
    return {
      certificateId: rawCert,
      verifiedBy: vInfo.verifiedBy || effectiveMetadata.verifiedBy || "Duyar Field Inspection Team",
      verificationDate: effectiveMetadata.verificationDate || "August 14, 2026",
      inspectionScore: effectiveMetadata.inspectionScore || 98,
      legalClearance: effectiveMetadata.legalClearance !== false,
      physicalInspection: effectiveMetadata.physicalInspection !== false,
      ownershipVerified: effectiveMetadata.ownershipVerified !== false,
      featuredTier: effectiveMetadata.featuredTier || "Premier Spotlight",
      featuredUntil: effectiveMetadata.featuredUntil || "Active Season",
      providerRole: vInfo.role,
      badgeLabel: vInfo.badgeLabel,
      badgeSubtext: vInfo.badgeSubtext,
    };
  }, [effectiveMetadata, property?.id, vInfo]);

  const effectiveAmenities: string[] = useMemo(() => {
    if (Array.isArray(property?.amenities) && property.amenities.length > 0) {
      return property.amenities;
    }
    if (Array.isArray(property?.tags) && property.tags.length > 0) {
      return property.tags;
    }
    return ['Dedicated Parking', 'High-speed Elevator', 'Standby Generator', '24/7 Security Guard', 'CCTV Surveillance', 'Private Balcony', 'Gas Supply Connection', 'Pet Friendly'];
  }, [property]);

  useEffect(() => {
    setIsSaved(isPropertySaved(property?.id, title));
    const unsubscribe = subscribeToSavedProperties(() => {
      setIsSaved(isPropertySaved(property?.id, title));
    });
    return unsubscribe;
  }, [property?.id, title]);

  useEffect(() => {
    setInCompare(isInCompare(property?.id));
    setCompareList(getComparisonList());
    const unsubscribe = subscribeToComparison((updated) => {
      setInCompare(isInCompare(property?.id));
      setCompareList(updated);
    });
    return unsubscribe;
  }, [property?.id]);

  const handleToggleCompare = () => {
    setIsAnimatingCompare(true);
    setTimeout(() => setIsAnimatingCompare(false), 500);

    const propId = property?.id || 'curr-prop';
    const res = toggleCompareProperty({
      id: propId,
      propertyId: propId,
      title,
      price,
      numericPrice: property?.numericPrice || parseNumericPrice(price),
      location,
      beds: property?.beds || 3,
      baths: property?.baths || 3,
      sqft: property?.sqft || 1650,
      image: images[0],
      tag: isSale ? 'FOR SALE' : 'FOR RENT',
      tags: effectiveAmenities,
      availableMonth,
      distance: property?.distance || 2.4,
      isVerified,
      isFeatured
    });

    setInCompare(res.added);
    setCompareList(res.list);

    if (res.added) {
      setToastMessage(`Saved to Compare List (${res.list.length}/4)`);
    } else if (res.reason) {
      setToastMessage(res.reason);
    } else {
      setToastMessage('Removed from Compare List');
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleFavorite = async () => {
    setIsAnimatingFav(true);
    setTimeout(() => setIsAnimatingFav(false), 500);

    const res = await toggleSaveProperty({
      id: property?.id,
      title,
      price,
      location,
      beds: property?.beds || 3,
      baths: property?.baths || 2,
      sqft: property?.sqft || 1650,
      image: images[0],
      tag: isSale ? 'FOR SALE' : 'FOR RENT',
      availableMonth
    });

    setIsSaved(res.isSaved);
    setToastMessage(res.isSaved ? "Saved to Favorites" : "Removed from Favorites");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      if (property?.id) {
        url.searchParams.set('propertyId', String(property.id));
      }
      return url.toString();
    } catch {
      return window.location.href;
    }
  }, [property?.id]);

  const shareText = `Check out this property on Duyar: ${title} in ${location} for ${price}!`;

  const triggerNativeShare = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData = {
          title: `${title} | Duyar`,
          text: shareText,
          url: shareUrl || window.location.href
        };
        await navigator.share(shareData);
        setToastMessage("Shared successfully!");
        setTimeout(() => setToastMessage(null), 2500);
        setIsShareModalOpen(false);
        return true;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User intentionally cancelled the native share sheet
          return true;
        }
        // Permission denied (e.g. within an iframe) or unsupported payload
        console.warn("Native share error, activating fallback:", err);
        return false;
      }
    }
    return false;
  };

  const handleShare = async () => {
    // Attempt native mobile share sheet first
    const shared = await triggerNativeShare();
    if (!shared) {
      // Fallback: Open social apps share sheet for WhatsApp, Facebook, Telegram, etc.
      setIsShareModalOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      const targetUrl = shareUrl || window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const input = document.createElement('input');
        input.value = targetUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setToastMessage("Copied! Link ready to share");
      setTimeout(() => setCopiedLink(false), 2500);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e) {
      setToastMessage("Failed to copy link");
      setTimeout(() => setToastMessage(null), 2000);
    }
  };
  
  const propertyCoords: [number, number] = useMemo(() => {
    return property?.lat && property?.lng ? [property.lat, property.lng] : [23.794, 90.4043];
  }, [property]);

  const images = [
    property?.image || "",
    ""
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reviews: VisitReview[] = useMemo(() => {
    return getReviewsForProperty(property?.id, title);
  }, [property?.id, title]);

  const avgRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return '4.9';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const index = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (leafletInstance.current) {
      leafletInstance.current.remove();
      leafletInstance.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(propertyCoords, 16);

    leafletInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class='marker-pin'></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });
    L.marker(propertyCoords, { icon }).addTo(map);

    return () => { 
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      } 
    };
  }, [propertyCoords]);

  return (
    <div 
      ref={swipeContainerRef}
      style={swipeStyle}
      className="relative flex min-h-screen w-full flex-col max-w-[480px] mx-auto overflow-x-hidden pb-32 bg-background-dark font-display text-white selection:bg-primary/30"
    >
      {/* Swipe Down To Dismiss Pull Bar Header */}
      <div 
        {...swipeHandleProps}
        className="sticky top-0 left-0 right-0 z-40 w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none bg-background-dark/85 backdrop-blur-md border-b border-white/5 group hover:bg-white/[0.04] transition-colors shrink-0"
        title="Swipe down to dismiss property details"
      >
        <div className={`w-14 h-1.5 rounded-full transition-all duration-200 ${
          isSwipeDragging || swipeOffsetY > 0 
            ? 'bg-primary scale-x-110 shadow-[0_0_12px_rgba(19,236,218,0.6)]' 
            : 'bg-white/40 group-hover:bg-white/70'
        }`} />
        <span className="text-[8px] uppercase tracking-[0.25em] font-extrabold text-white/40 mt-1">
          {isSwipeDragging ? 'Release to close' : 'Swipe down to close'}
        </span>
      </div>

      <div className="relative w-full h-[45vh] overflow-hidden">
        <div ref={scrollRef} onScroll={handleScroll} className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {images.map((img, idx) => (
            <div key={idx} className="relative min-w-full h-full snap-center">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-6 left-4 right-4 flex justify-between items-start z-20">
          <button onClick={onBack} className="glass-circle size-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-2">
            <button 
              id="property-compare-button"
              onClick={handleToggleCompare} 
              title={inCompare ? "Remove from Compare List" : "Add Property to Compare List"}
              aria-label="Toggle compare property"
              className={`glass-circle size-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg relative ${
                inCompare 
                  ? 'bg-primary/25 border-primary/50 text-primary shadow-[0_0_25px_rgba(19,236,218,0.45)]' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              } ${isAnimatingCompare ? 'scale-125' : ''}`}
            >
              <span className="material-symbols-outlined text-xl">compare_arrows</span>
              {compareList.length > 0 && (
                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-background-dark text-[9px] font-black flex items-center justify-center shadow">
                  {compareList.length}
                </span>
              )}
            </button>
            <button 
              id="property-favorite-button"
              onClick={handleToggleFavorite} 
              title={isSaved ? "Remove from Saved Properties" : "Save Property to Favorites"}
              className={`glass-circle size-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg ${
                isSaved 
                  ? 'bg-rose-500/25 border-rose-500/50 text-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.45)]' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              } ${isAnimatingFav ? 'scale-125' : ''}`}
            >
              <span 
                className="material-symbols-outlined transition-all text-xl"
                style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
            </button>
            <button 
              id="property-share-button"
              onClick={handleShare}
              title="Share property via mobile apps"
              aria-label="Share property"
              className="glass-circle size-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg hover:bg-white/10 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
            <button 
              id="property-copy-link-button"
              onClick={handleCopyLink}
              title={copiedLink ? "Link Copied!" : "Copy Property Link"}
              aria-label="Copy Property Link"
              className={`glass-circle size-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg cursor-pointer ${
                copiedLink 
                  ? 'bg-primary/30 border-primary/60 text-primary shadow-[0_0_20px_rgba(22,231,110,0.4)]' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {copiedLink ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Floating Toast notification */}
        {toastMessage && (
          <div 
            id="property-details-toast"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-background-dark/95 border border-white/20 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-none"
          >
            <span 
              className={`material-symbols-outlined text-base ${
                toastMessage.toLowerCase().includes('copi') || toastMessage.toLowerCase().includes('link')
                  ? 'text-primary' 
                  : (isSaved ? 'text-rose-500' : 'text-primary')
              }`}
              style={{
                fontVariationSettings: (!toastMessage.toLowerCase().includes('copi') && !toastMessage.toLowerCase().includes('link') && isSaved) ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              {toastMessage.toLowerCase().includes('copi') || toastMessage.toLowerCase().includes('link') ? 'check_circle' : 'favorite'}
            </span>
            <span className="text-xs font-black tracking-wider uppercase italic">{toastMessage}</span>
          </div>
        )}

        {/* Floating Verified & Featured Badges on Hero Image */}
        {(isVerified || isFeatured) && (
          <div className="absolute top-20 left-4 z-20 flex flex-col gap-2 items-start">
            {isVerified && (
              <button
                type="button"
                id="hero-verified-badge"
                onClick={() => setActiveModal('VERIFIED')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                  vInfo.role === 'LOCATOR' 
                    ? 'bg-[#0a2624]/90 hover:bg-[#0a2624] text-[#13ecda] border-[#13ecda]/50 shadow-[0_4px_16px_rgba(19,236,218,0.3)]'
                    : 'bg-emerald-950/85 hover:bg-emerald-900/95 text-emerald-300 border-emerald-400/50 shadow-lg shadow-emerald-950/60'
                } border backdrop-blur-xl active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer`}
                title={`${verificationDetails.badgeLabel} • ${verificationDetails.verifiedBy}`}
              >
                <span className={`material-symbols-outlined text-[15px] font-black ${vInfo.role === 'LOCATOR' ? 'text-[#13ecda]' : 'text-emerald-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {vInfo.icon}
                </span>
                <span>{verificationDetails.badgeLabel}</span>
                <span className={`${vInfo.role === 'LOCATOR' ? 'bg-[#13ecda]/25 text-[#13ecda]' : 'bg-emerald-500/25 text-emerald-200'} text-[8px] px-1.5 py-0.5 rounded font-bold`}>
                  {verificationDetails.inspectionScore}%
                </span>
              </button>
            )}
            {isFeatured && (
              <button
                type="button"
                id="hero-featured-badge"
                onClick={() => setActiveModal('FEATURED')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/85 hover:bg-amber-900/95 text-amber-300 border border-amber-400/50 backdrop-blur-xl shadow-lg shadow-amber-950/60 active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
                title="Duyar Featured Listing • Tap for details"
              >
                <span className="material-symbols-outlined text-[15px] font-black text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <span>Featured</span>
                <span className="bg-amber-500/25 text-amber-200 text-[8px] px-1.5 py-0.5 rounded font-bold">
                  Spotlight
                </span>
              </button>
            )}
          </div>
        )}

        {!isSale && (
          <div className="absolute bottom-16 left-5 z-20 animate-in fade-in slide-in-from-left-4 duration-500">
             <div className="bg-primary/90 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/20 shadow-2xl">
                <span className="material-symbols-outlined text-background-dark text-xl font-black">calendar_today</span>
                <div>
                   <p className="text-background-dark text-[8px] font-black uppercase tracking-widest leading-none">Available From</p>
                   <p className="text-background-dark text-base font-black uppercase leading-tight">{availableMonth}</p>
                </div>
             </div>
          </div>
        )}

        {/* Floating 360° Virtual Tour Launch Button on Hero Image */}
        <button
          type="button"
          id="hero-360-tour-btn"
          onClick={() => setIsVirtualTourModalOpen(true)}
          className="absolute bottom-16 right-5 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-background-dark/85 hover:bg-background-dark text-primary border border-primary/40 backdrop-blur-xl shadow-2xl shadow-primary/20 active:scale-95 transition-all cursor-pointer group"
          title="Open 360° Virtual Tour"
        >
          <span className="material-symbols-outlined text-xl text-primary animate-spin" style={{ animationDuration: '6s' }}>
            360
          </span>
          <div className="text-left">
            <span className="block text-[8px] font-black uppercase tracking-widest text-white/50 leading-none">Virtual Tour</span>
            <span className="block text-xs font-black uppercase text-white leading-tight group-hover:text-primary transition-colors">360° View</span>
          </div>
        </button>

        <div className="absolute bottom-6 w-full flex justify-center gap-2 z-20">
          {images.map((_, idx) => (
            <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-6 bg-primary' : 'w-1.5 bg-white/30'}`}></div>
          ))}
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10">
        {/* Visual Badges Strip Above Title */}
        {(isVerified || isFeatured) && (
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            {isVerified && (
              <button
                type="button"
                id="title-verified-badge"
                onClick={() => setActiveModal('VERIFIED')}
                className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${
                  vInfo.role === 'LOCATOR'
                    ? 'bg-[#13ecda]/15 border-[#13ecda]/35 text-[#13ecda] hover:bg-[#13ecda]/25'
                    : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25'
                } border transition-all text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95`}
              >
                <span className={`material-symbols-outlined text-[15px] font-black ${vInfo.role === 'LOCATOR' ? 'text-[#13ecda]' : 'text-emerald-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {vInfo.icon}
                </span>
                <span>{verificationDetails.badgeLabel}</span>
                <span className={`${vInfo.role === 'LOCATOR' ? 'bg-[#13ecda]/25 text-[#13ecda]' : 'bg-emerald-500/25 text-emerald-200'} px-1.5 py-0.5 rounded text-[8px] font-bold`}>
                  Score {verificationDetails.inspectionScore}%
                </span>
                <span className="material-symbols-outlined text-[12px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  info
                </span>
              </button>
            )}

            {isFeatured && (
              <button
                type="button"
                id="title-featured-badge"
                onClick={() => setActiveModal('FEATURED')}
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/35 text-amber-300 hover:bg-amber-400/25 transition-all text-[10px] font-black uppercase tracking-wider shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[15px] font-black text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <span>Featured Listing</span>
                <span className="bg-amber-400/25 text-amber-200 px-1.5 py-0.5 rounded text-[8px] font-bold">
                  {verificationDetails.featuredTier}
                </span>
                <span className="material-symbols-outlined text-[12px] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  info
                </span>
              </button>
            )}
          </div>
        )}

        <h1 className="text-white text-3xl font-extrabold leading-tight italic">{title}</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-primary text-2xl font-black">{price} {!isSale && <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">/ month</span>}</p>
          <div className="flex items-center gap-1 text-white/60 text-[10px] font-black uppercase tracking-widest">
            <span className="material-symbols-outlined text-xs">location_on</span>
            <span className="truncate max-w-[120px]">{location}</span>
          </div>
        </div>

        {/* Quick Action Buttons: Compare, Share, Copy Link & Save */}
        <div className="grid grid-cols-4 gap-2 mt-3.5 pt-3 border-t border-white/10">
          <button
            type="button"
            id="property-action-compare-button"
            onClick={handleToggleCompare}
            className={`py-2 px-1.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer ${
              inCompare
                ? 'bg-primary/25 border-primary/50 text-primary shadow-[0_0_15px_rgba(19,236,218,0.25)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
            }`}
            title={inCompare ? "Remove from Compare List" : "Add to Compare List"}
          >
            <span className="material-symbols-outlined text-base font-black">
              compare_arrows
            </span>
            <span className="truncate">{inCompare ? 'Compared' : 'Compare'}</span>
          </button>

          <button
            type="button"
            id="property-action-share-button"
            onClick={handleShare}
            className="py-2 px-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-[11px] font-black uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 active:scale-95 transition-all shadow-sm group cursor-pointer"
            title="Share property via social apps"
          >
            <span className="material-symbols-outlined text-base font-black group-hover:scale-110 transition-transform">
              share
            </span>
            <span className="truncate">Share</span>
          </button>

          <button
            type="button"
            id="property-action-copy-link-button"
            onClick={handleCopyLink}
            className={`py-2 px-1.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer ${
              copiedLink
                ? 'bg-primary/25 border-primary/50 text-primary shadow-[0_0_15px_rgba(22,231,110,0.25)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
            }`}
            title="Copy property link to clipboard"
          >
            <span className="material-symbols-outlined text-base font-black">
              {copiedLink ? 'check' : 'content_copy'}
            </span>
            <span className="truncate">{copiedLink ? 'Copied' : 'Link'}</span>
          </button>

          <button
            type="button"
            id="property-action-favorite-button"
            onClick={handleToggleFavorite}
            className={`py-2 px-1.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider flex flex-col sm:flex-row items-center justify-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer ${
              isSaved
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
            title={isSaved ? "Saved in Favorites" : "Save to Favorites"}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            <span className="truncate">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {isSaved && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold animate-in fade-in">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span>Saved in your Favorites</span>
            </div>
          )}
          {inCompare && (
            <button
              type="button"
              id="details-in-compare-indicator"
              onClick={() => setIsCompareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold hover:bg-primary/20 transition-all cursor-pointer animate-in fade-in"
            >
              <span className="material-symbols-outlined text-xs">compare_arrows</span>
              <span>In Compare List ({compareList.length}/4) • View Table</span>
            </button>
          )}
          <button
            type="button"
            id="details-virtual-tour-badge"
            onClick={() => setIsVirtualTourModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold transition-all cursor-pointer animate-in fade-in"
          >
            <span className="material-symbols-outlined text-xs">360</span>
            <span>360° Virtual Tour • 5 Rooms</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 px-5 py-6 overflow-x-auto no-scrollbar">
        {[
          { icon: 'bed', label: `${property?.beds || 3} Bed` },
          { icon: 'shower', label: `${property?.baths || 3} Bath` },
          { icon: 'square_foot', label: `${property?.sqft || 1650} sqft` },
          { icon: 'balcony', label: '2 Balcony' }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 glass-item px-4 py-2.5 rounded-xl shrink-0 border border-white/5">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>{item.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Trust, Verification & Feature Spotlight Card */}
      {(isVerified || isFeatured) && (
        <div className="px-5 pb-6">
          <div className="glass-item rounded-3xl p-5 border border-white/10 relative overflow-hidden space-y-4">
            <div 
              className="absolute -right-10 -top-10 size-36 rounded-full blur-3xl pointer-events-none opacity-20"
              style={{ background: isVerified ? '#10b981' : '#f59e0b' }}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                  isVerified 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isVerified ? 'verified_user' : 'auto_awesome'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-black italic uppercase tracking-tight text-white flex items-center gap-1.5">
                    {isVerified ? 'Duyar Verified Protection' : 'Duyar Spotlight Collection'}
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    {isVerified ? `Audited by ${verificationDetails.verifiedBy}` : 'Handpicked for Quality & Tenant Trust'}
                  </p>
                </div>
              </div>

              {isVerified && (
                <div className="text-right">
                  <div className="text-base font-black text-emerald-400 leading-tight">
                    {verificationDetails.inspectionScore}%
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/40">
                    Audit Score
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {isVerified && (
                <>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="material-symbols-outlined text-emerald-400 text-sm font-bold">check_circle</span>
                    <span className="text-[10px] font-bold text-white/80">Physical Site Audit</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="material-symbols-outlined text-emerald-400 text-sm font-bold">check_circle</span>
                    <span className="text-[10px] font-bold text-white/80">Deed & Title Cleared</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="material-symbols-outlined text-emerald-400 text-sm font-bold">check_circle</span>
                    <span className="text-[10px] font-bold text-white/80">Rent Transparency</span>
                  </div>
                </>
              )}
              {isFeatured && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="material-symbols-outlined text-amber-400 text-sm font-bold">star</span>
                  <span className="text-[10px] font-bold text-white/80">Top Tenant Desirability</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-white/40">
              <span className="font-mono">Cert: {verificationDetails.certificateId}</span>
              <button
                type="button"
                id="view-full-audit-btn"
                onClick={() => setActiveModal(isVerified ? 'VERIFIED' : 'FEATURED')}
                className="text-primary font-black uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <span>View Full Audit</span>
                <span className="material-symbols-outlined text-[11px]">open_in_new</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Property Comparison Section */}
      <div className="px-5 pb-6">
        <div id="property-comparison-hub" className="glass-item rounded-3xl p-5 border border-white/10 relative overflow-hidden space-y-4 bg-gradient-to-br from-primary/5 via-transparent to-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`size-11 rounded-2xl flex items-center justify-center border shadow-inner ${
                inCompare 
                  ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_20px_rgba(19,236,218,0.2)]' 
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}>
                <span className="material-symbols-outlined text-2xl font-black">compare_arrows</span>
              </div>
              <div>
                <h3 className="text-sm font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                  <span>Side-by-Side Comparison</span>
                  {inCompare && (
                    <span className="bg-primary/20 text-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-primary/30">
                      Saved
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  Compare price, area & amenities vs other listings
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/70">
              {compareList.length}/4 Selected
            </span>
          </div>

          {/* Carousel / preview of other compared properties */}
          {compareList.length > 0 ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[10px] text-white/50 uppercase font-black tracking-wider">
                <span>Properties in your list</span>
                <span>Max 4 properties</span>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {compareList.map((item) => {
                  const isCurrent = String(item.propertyId) === String(property?.id) || String(item.id) === String(property?.id) || String(item.id) === `comp-${property?.id}`;
                  return (
                    <div
                      key={item.id}
                      className={`shrink-0 w-44 p-2.5 rounded-2xl border flex flex-col justify-between relative transition-all ${
                        isCurrent 
                          ? 'bg-primary/10 border-primary/40 shadow-sm' 
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="size-10 rounded-xl object-cover border border-white/10 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-white truncate leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[10px] font-black text-primary">
                            {item.price}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[9px] text-white/50">
                        <span>{item.sqft} sqft · {item.beds}B</span>
                        {isCurrent ? (
                          <span className="text-primary font-black uppercase text-[8px]">This listing</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = removeFromCompare(item.propertyId || item.id);
                              setCompareList(updated);
                              setInCompare(isInCompare(property?.id));
                            }}
                            className="text-white/40 hover:text-rose-400 font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">info</span>
              <p className="text-xs text-white/60 font-sans leading-relaxed">
                Save this property to your comparison list to inspect side-by-side rent, size per square foot, and full amenities breakdown.
              </p>
            </div>
          )}

          {/* Comparison Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              id="details-toggle-compare-btn"
              onClick={handleToggleCompare}
              className={`flex-1 py-3 px-3 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer ${
                inCompare
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-300'
                  : 'bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {inCompare ? 'remove_done' : 'add_circle'}
              </span>
              <span>{inCompare ? 'Remove from Compare' : 'Save to Compare List'}</span>
            </button>

            <button
              type="button"
              id="details-view-comparison-table-btn"
              onClick={() => {
                if (compareList.length === 0) {
                  handleToggleCompare();
                }
                setIsCompareModalOpen(true);
              }}
              className="flex-1 py-3 px-3 rounded-2xl bg-primary hover:bg-primary/90 text-background-dark text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-primary/25 active:scale-95 transition-all font-display cursor-pointer"
            >
              <span className="material-symbols-outlined text-base font-black">table_chart</span>
              <span>Compare Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Amenities & Features Section */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white text-base font-black uppercase tracking-widest italic leading-tight">
              Amenities & Features
            </h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
              Verified In-Unit & Building Facilities
            </p>
          </div>
          <span className="text-[10px] font-black uppercase text-primary tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl">
            {ALL_KEY_AMENITIES.filter(a => effectiveAmenities.some(ea => ea.toLowerCase().includes(a.key.toLowerCase()) || a.label.toLowerCase().includes(ea.toLowerCase()))).length} Included
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {ALL_KEY_AMENITIES.map((amenity) => {
            const isIncluded = effectiveAmenities.some(a => 
              a.toLowerCase().includes(amenity.key.toLowerCase()) || 
              amenity.label.toLowerCase().includes(a.toLowerCase()) ||
              (amenity.key === 'cctv' && a.toLowerCase().includes('security'))
            );
            return (
              <div 
                key={amenity.key}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${
                  isIncluded 
                    ? 'bg-white/[0.03] border-white/10 text-white' 
                    : 'bg-white/[0.01] border-white/5 text-white/30 opacity-60'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${isIncluded ? 'text-primary' : 'text-white/20'}`}>
                  {amenity.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isIncluded ? 'text-white' : 'text-white/40'}`}>
                    {amenity.label}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider font-mono">
                    {isIncluded ? 'Included' : 'Not Available'}
                  </p>
                </div>
                <span className={`material-symbols-outlined text-sm font-black ${isIncluded ? 'text-emerald-400' : 'text-white/20'}`}>
                  {isIncluded ? 'check_circle' : 'remove'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 360-Degree Virtual Tour Interactive Section */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary animate-ping" />
              <h3 className="text-white text-base font-black uppercase tracking-widest italic leading-tight">
                360° Virtual Tour
              </h3>
            </div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
              Swipe to explore rooms in 3D panorama
            </p>
          </div>
          <button
            type="button"
            id="open-fullscreen-tour-btn"
            onClick={() => setIsVirtualTourModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-sm font-black">fullscreen</span>
            <span>Fullscreen</span>
          </button>
        </div>

        {/* Embedded Interactive 360 Viewer */}
        <VirtualTour360
          propertyName={title}
          propertyLocation={location}
          isModal={false}
          onExpand={() => setIsVirtualTourModalOpen(true)}
        />
      </div>

      <div className="px-5 pb-6">
        <h3 className="text-white text-base font-black mb-3 uppercase tracking-widest italic">Location Preview</h3>
        <div className="w-full h-44 rounded-2xl overflow-hidden glass-item border border-white/10 mb-4">
          <div ref={mapContainerRef} className="w-full h-full"></div>
        </div>
      </div>

      {/* Tenant Visit Reviews & Star Ratings */}
      <div className="px-5 pb-24">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white text-base font-black uppercase tracking-widest italic leading-tight">
              Tenant Visit Reviews
            </h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
              Verified In-Person Inspections
            </p>
          </div>
          <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-xl">
            <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
            <span className="text-amber-400 text-xs font-black">{avgRating}</span>
            <span className="text-[10px] text-white/40 font-bold">({reviews.length})</span>
          </div>
        </div>

        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="glass-item rounded-2xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-primary/20 text-primary font-black text-xs flex items-center justify-center">
                    {rev.tenantName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white leading-tight">{rev.tenantName}</p>
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[10px]">verified</span>
                        Verified Visit
                      </span>
                    </div>
                    <p className="text-[9px] text-white/30">{rev.reviewedAt}</p>
                  </div>
                </div>

                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className="material-symbols-outlined text-xs"
                      style={{ fontVariationSettings: rev.rating >= s ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  ))}
                </div>
              </div>

              {rev.aspectRatings && (
                <div className="flex items-center gap-3 text-[9px] text-white/50 pt-1">
                  <span>Accuracy: <strong className="text-amber-400 font-bold">★ {rev.aspectRatings.propertyAccuracy}</strong></span>
                  <span>Host: <strong className="text-amber-400 font-bold">★ {rev.aspectRatings.hostProfessionalism}</strong></span>
                  <span>Area: <strong className="text-amber-400 font-bold">★ {rev.aspectRatings.neighborhoodSafety}</strong></span>
                </div>
              )}

              <p className="text-xs text-white/80 leading-relaxed italic">
                "{rev.reviewText}"
              </p>

              {rev.tags && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {rev.tags.map((t) => (
                    <span key={t} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-primary font-bold">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {onRate && (
            <button
              onClick={onRate}
              className="w-full py-3 rounded-xl glass-item border border-primary/30 hover:border-primary/60 text-primary text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">rate_review</span>
              <span>Rate Your Visit To This Property</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Comparison Quick Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-24 left-4 right-4 z-40 max-w-[440px] mx-auto animate-in slide-in-from-bottom-3 duration-300 pointer-events-auto">
          <div className="glass-card px-4 py-2.5 rounded-2xl border border-primary/40 bg-background-dark/95 backdrop-blur-2xl shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-primary/20 border border-primary/40 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base font-black">compare_arrows</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white leading-tight truncate">
                  {compareList.length} {compareList.length === 1 ? 'Property' : 'Properties'} in Compare List
                </p>
                <p className="text-[10px] text-white/50 truncate">
                  {inCompare ? 'Includes this property' : 'Tap to compare side-by-side'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="floating-compare-table-btn"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-background-dark text-[11px] font-black uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-primary/20 shrink-0 cursor-pointer"
            >
              <span>Compare</span>
              <span className="material-symbols-outlined text-sm font-black">table_chart</span>
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-8 pt-4 bg-background-dark/90 backdrop-blur-3xl border-t border-white/10 rounded-t-[2.5rem] max-w-[480px] mx-auto shadow-2xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              haptics.bookingConfirmed();
              onBook();
            }} 
            className="flex-1 bg-white/5 border border-white/10 text-white font-black text-[11px] h-16 rounded-2xl flex items-center justify-center tracking-[0.2em] uppercase active:bg-white/10 transition-all italic"
          >
            BOOK VISIT
          </button>
          <button 
            onClick={() => {
              haptics.bookingConfirmed();
              onApply();
            }} 
            className="bg-primary text-background-dark font-black text-[11px] h-16 rounded-2xl flex-1 transition-transform active:scale-[0.98] shadow-[0_0_25px_rgba(19,236,218,0.4)] uppercase tracking-[0.2em] italic"
          >
            {isSale ? 'OFFER NOW' : 'RENT NOW'}
          </button>
        </div>
      </div>

      {/* Verification / Featured Information Sheet */}
      {activeModal && (
        <div 
          id="verification-modal-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div 
            id="verification-modal-dialog"
            className="w-full max-w-md bg-background-dark border border-white/15 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative max-h-[85vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Swipe-Down Handle */}
            <div 
              className="w-full -mt-2 mb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group"
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const onTouchMove = (ev: TouchEvent) => {
                  if (ev.touches[0].clientY - startY > 70) {
                    setActiveModal(null);
                    haptics.selection();
                    window.removeEventListener('touchmove', onTouchMove);
                  }
                };
                window.addEventListener('touchmove', onTouchMove, { passive: true });
                window.addEventListener('touchend', () => window.removeEventListener('touchmove', onTouchMove), { once: true });
              }}
            >
              <div className="w-14 h-1.5 rounded-full bg-white/30 group-hover:bg-primary transition-colors" />
              <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold mt-1">Swipe down to dismiss</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-12 rounded-2xl flex items-center justify-center border ${
                  activeModal === 'VERIFIED' 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                }`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {activeModal === 'VERIFIED' ? 'verified' : 'auto_awesome'}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-black italic uppercase tracking-tight text-white">
                    {activeModal === 'VERIFIED' ? 'Verified Property Dossier' : 'Featured Listing Spotlight'}
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    {activeModal === 'VERIFIED' ? 'Duyar Certified Audit Standard' : 'Curated Premier Selection'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-verification-modal-btn"
                onClick={() => setActiveModal(null)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {activeModal === 'VERIFIED' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Audit Status: 100% Passed
                    </span>
                    <span className="text-xs font-black text-white">
                      Score: {verificationDetails.inspectionScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    This property has passed in-person physical inspections and legal ownership cross-referencing by authorized Duyar field officers.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    Inspection Guarantee
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="material-symbols-outlined text-emerald-400 text-base font-black">check_circle</span>
                      <div>
                        <p className="text-xs font-bold text-white">Physical On-Site Inspection</p>
                        <p className="text-[10px] text-white/40">Verified room dimensions, water pressure, electrical fixtures, and structural health.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="material-symbols-outlined text-emerald-400 text-base font-black">check_circle</span>
                      <div>
                        <p className="text-xs font-bold text-white">Deed & Land Registry Audit</p>
                        <p className="text-[10px] text-white/40">Landlord identity and property ownership verified against municipal land deed records.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="material-symbols-outlined text-emerald-400 text-base font-black">check_circle</span>
                      <div>
                        <p className="text-xs font-bold text-white">Zero Hidden Charges Agreement</p>
                        <p className="text-[10px] text-white/40">Guaranteed fixed deposit policies and transparent utility breakdown.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inspector Credentials */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[10px]">
                  <div>
                    <span className="text-white/40 uppercase block text-[8px] font-black">Inspected By</span>
                    <span className="text-white font-bold">{verificationDetails.verifiedBy}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 uppercase block text-[8px] font-black">Certificate ID</span>
                    <span className="text-primary font-mono font-bold">{verificationDetails.certificateId}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      Tier: {verificationDetails.featuredTier}
                    </span>
                    <span className="text-xs font-black text-amber-300">
                      High Demand
                    </span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Featured properties represent the top 5% of listings on Duyar, selected for prime locations, upscale architecture, and highly rated property managers.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="material-symbols-outlined text-amber-400 text-base">timer</span>
                    <div>
                      <p className="text-xs font-bold text-white">Guaranteed Fast Response</p>
                      <p className="text-[10px] text-white/40">Verified landlords commit to responding to visit queries within 2 hours.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="material-symbols-outlined text-amber-400 text-base">apartment</span>
                    <div>
                      <p className="text-xs font-bold text-white">Prime Neighborhood Location</p>
                      <p className="text-[10px] text-white/40">Direct access to commercial avenues, transit hubs, and recreation parks.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              id="dismiss-verification-modal-btn"
              onClick={() => setActiveModal(null)}
              className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.99]"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Property Comparison Table Modal */}
      {isCompareModalOpen && (
        <div
          id="property-compare-modal-overlay"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsCompareModalOpen(false)}
        >
          <div
            id="property-compare-modal-dialog"
            className="w-full max-w-4xl bg-background-dark border border-white/15 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Swipe-Down Handle */}
            <div 
              className="w-full -mt-2 mb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group shrink-0"
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const onTouchMove = (ev: TouchEvent) => {
                  if (ev.touches[0].clientY - startY > 70) {
                    setIsCompareModalOpen(false);
                    haptics.selection();
                    window.removeEventListener('touchmove', onTouchMove);
                  }
                };
                window.addEventListener('touchmove', onTouchMove, { passive: true });
                window.addEventListener('touchend', () => window.removeEventListener('touchmove', onTouchMove), { once: true });
              }}
            >
              <div className="w-14 h-1.5 rounded-full bg-white/30 group-hover:bg-primary transition-colors" />
              <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold mt-1">Swipe down to dismiss</span>
            </div>

            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
                  <span className="material-symbols-outlined text-2xl font-black">table_chart</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Side-by-Side</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/70">
                      {compareList.length} of 4 slots
                    </span>
                  </div>
                  <h2 className="text-lg font-black uppercase italic tracking-tight text-white">
                    Property Comparison Table
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {compareList.length > 0 && (
                  <button
                    type="button"
                    id="modal-clear-compare-btn"
                    onClick={() => {
                      clearCompareList();
                      setCompareList([]);
                      setInCompare(false);
                      setToastMessage("Comparison list cleared");
                      setTimeout(() => setToastMessage(null), 2000);
                    }}
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 active:scale-95 transition-all"
                  >
                    Clear All
                  </button>
                )}

                {compareList.length < 2 && (
                  <button
                    type="button"
                    id="modal-load-sample-btn"
                    onClick={() => {
                      const samples = resetComparisonToDefault();
                      // Also add current property if not in samples
                      const currentPropId = property?.id || 'curr-prop';
                      if (!samples.some(s => String(s.propertyId) === String(currentPropId))) {
                        addToCompare({
                          id: currentPropId,
                          title,
                          price,
                          location,
                          beds: property?.beds || 3,
                          baths: property?.baths || 3,
                          sqft: property?.sqft || 1650,
                          image: images[0],
                          tag: isSale ? 'FOR SALE' : 'FOR RENT',
                          tags: effectiveAmenities,
                          availableMonth,
                          isVerified,
                          isFeatured
                        });
                      }
                      const updated = getComparisonList();
                      setCompareList(updated);
                      setInCompare(isInCompare(currentPropId));
                      setToastMessage("Loaded comparison samples");
                      setTimeout(() => setToastMessage(null), 2000);
                    }}
                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">auto_awesome</span>
                    <span>Load Samples</span>
                  </button>
                )}

                {onCompare && (
                  <button
                    type="button"
                    id="modal-fullscreen-compare-btn"
                    onClick={() => {
                      setIsCompareModalOpen(false);
                      onCompare();
                    }}
                    title="Open in full screen page"
                    className="size-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">open_in_full</span>
                  </button>
                )}

                <button
                  type="button"
                  id="close-compare-modal-btn"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="size-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  title="Close comparison table"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body: Side-by-Side Comparison Table */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {compareList.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="size-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(19,236,218,0.15)]">
                    <span className="material-symbols-outlined text-3xl font-black">compare_arrows</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-white">
                      Your Comparison List is Empty
                    </h3>
                    <p className="text-xs text-white/50 max-w-sm mt-1">
                      Add this property and compare its price, area, and amenities against other rental options in Dhaka.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="btn-empty-add-current"
                    onClick={() => {
                      handleToggleCompare();
                      const samples = resetComparisonToDefault();
                      const updated = getComparisonList();
                      setCompareList(updated);
                    }}
                    className="py-3 px-5 rounded-2xl bg-primary text-background-dark text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-base font-black">add_circle</span>
                    <span>Add This Property & 2 Samples</span>
                  </button>
                </div>
              ) : (
                <>
                  {compareList.length === 1 && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-200">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400 text-base">info</span>
                        <span>1 property in comparison. Add at least 1 more to see side-by-side differences!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetComparisonToDefault();
                          // Keep current property
                          const currentPropId = property?.id || 'curr-prop';
                          addToCompare({
                            id: currentPropId,
                            title,
                            price,
                            location,
                            beds: property?.beds || 3,
                            baths: property?.baths || 3,
                            sqft: property?.sqft || 1650,
                            image: images[0],
                            tag: isSale ? 'FOR SALE' : 'FOR RENT',
                            tags: effectiveAmenities,
                            availableMonth,
                            isVerified,
                            isFeatured
                          });
                          const updated = getComparisonList();
                          setCompareList(updated);
                          setInCompare(true);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-amber-400 text-background-dark font-black text-[10px] uppercase shrink-0"
                      >
                        + Add Sample Flat
                      </button>
                    </div>
                  )}

                  {/* Horizontal Scrollable Comparison Table */}
                  <div className="overflow-x-auto no-scrollbar pb-2">
                    <div className="min-w-[620px] space-y-3">
                      {/* 1. Header Cards Grid */}
                      {(() => {
                        const minPrice = Math.min(...compareList.map(p => p.numericPrice || parseNumericPrice(p.price)));
                        const maxSize = Math.max(...compareList.map(p => p.sqft || 0));

                        return (
                          <>
                            <div
                              className="grid gap-3"
                              style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                            >
                              {/* Left Label Cell */}
                              <div className="flex flex-col justify-end p-2 pb-3">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                                  Specs
                                </span>
                                <span className="text-xs font-black uppercase text-primary">
                                  Property Cards
                                </span>
                              </div>

                              {/* Property Header Cards */}
                              {compareList.map((item) => {
                                const priceVal = item.numericPrice || parseNumericPrice(item.price);
                                const isLowest = compareList.length > 1 && priceVal > 0 && priceVal === minPrice;
                                const isLargest = compareList.length > 1 && (item.sqft || 0) === maxSize && maxSize > 0;
                                const isCurrent = String(item.propertyId) === String(property?.id) || String(item.id) === String(property?.id) || String(item.id) === `comp-${property?.id}`;

                                return (
                                  <div
                                    key={item.id}
                                    className={`glass-card rounded-2xl p-3 border flex flex-col justify-between relative group transition-all ${
                                      isCurrent 
                                        ? 'border-primary/50 bg-primary/[0.04] shadow-lg shadow-primary/10' 
                                        : 'border-white/10 bg-white/[0.02]'
                                    }`}
                                  >
                                    {/* Remove button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = removeFromCompare(item.propertyId || item.id);
                                        setCompareList(updated);
                                        setInCompare(isInCompare(property?.id));
                                      }}
                                      className="absolute top-2 right-2 size-6 rounded-full bg-black/60 hover:bg-rose-500 text-white/70 hover:text-white flex items-center justify-center border border-white/10 z-10 active:scale-90 transition-all"
                                      title="Remove from compare"
                                    >
                                      <span className="material-symbols-outlined text-xs">close</span>
                                    </button>

                                    <div>
                                      {/* Thumbnail */}
                                      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-2 bg-black/40 border border-white/5">
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {isCurrent && (
                                          <div className="absolute top-1.5 left-1.5 bg-primary text-background-dark text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                                            Current
                                          </div>
                                        )}
                                      </div>

                                      <h4 className="text-xs font-black uppercase italic tracking-tight text-white truncate">
                                        {item.title}
                                      </h4>
                                      <p className="text-[10px] text-white/50 truncate flex items-center gap-0.5 mt-0.5">
                                        <span className="material-symbols-outlined text-[11px] text-primary">location_on</span>
                                        {item.location}
                                      </p>

                                      <div className="mt-2 flex items-baseline justify-between">
                                        <p className="text-sm font-black text-primary">
                                          {item.price}
                                          <span className="text-[8px] font-normal text-white/40">/mo</span>
                                        </p>
                                        {isLowest && (
                                          <span className="text-[8px] font-black uppercase bg-primary/20 text-primary border border-primary/40 px-1.5 py-0.5 rounded-full">
                                            Best Value
                                          </span>
                                        )}
                                        {!isLowest && isLargest && (
                                          <span className="text-[8px] font-black uppercase bg-white/10 text-white/80 border border-white/15 px-1.5 py-0.5 rounded-full">
                                            Largest
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* 2. Key Specs Rows (Price, Area, Beds, Baths, Availability) */}
                            <div className="space-y-1.5 pt-2">
                              {/* Price Row */}
                              <div
                                className="glass-card rounded-xl p-2.5 grid items-center border border-white/5 bg-white/[0.01]"
                                style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                              >
                                <div className="flex items-center gap-1.5 pr-2">
                                  <span className="material-symbols-outlined text-primary text-sm">payments</span>
                                  <span className="text-[11px] font-bold text-white/70">Rent / Month</span>
                                </div>
                                {compareList.map((item) => {
                                  const pVal = item.numericPrice || parseNumericPrice(item.price);
                                  const isLowest = compareList.length > 1 && pVal > 0 && pVal === minPrice;
                                  return (
                                    <div key={item.id} className="px-2">
                                      <p className={`text-xs font-black ${isLowest ? 'text-primary' : 'text-white'}`}>
                                        {item.price}
                                      </p>
                                      {item.sqft > 0 && pVal > 0 && (
                                        <p className="text-[9px] text-white/40 font-mono">
                                          ≈ ৳{Math.round(pVal / item.sqft)}/sqft
                                        </p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Area Row */}
                              <div
                                className="glass-card rounded-xl p-2.5 grid items-center border border-white/5 bg-white/[0.01]"
                                style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                              >
                                <div className="flex items-center gap-1.5 pr-2">
                                  <span className="material-symbols-outlined text-primary text-sm">straighten</span>
                                  <span className="text-[11px] font-bold text-white/70">Floor Area</span>
                                </div>
                                {compareList.map((item) => {
                                  const isLargest = compareList.length > 1 && (item.sqft || 0) === maxSize && maxSize > 0;
                                  return (
                                    <div key={item.id} className="px-2">
                                      <p className={`text-xs font-black ${isLargest ? 'text-primary' : 'text-white'}`}>
                                        {item.sqft || 0} sqft
                                      </p>
                                      {isLargest && (
                                        <span className="text-[8px] font-bold text-emerald-400">
                                          + Largest Layout
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Bedrooms Row */}
                              <div
                                className="glass-card rounded-xl p-2.5 grid items-center border border-white/5 bg-white/[0.01]"
                                style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                              >
                                <div className="flex items-center gap-1.5 pr-2">
                                  <span className="material-symbols-outlined text-primary text-sm">bed</span>
                                  <span className="text-[11px] font-bold text-white/70">Bedrooms</span>
                                </div>
                                {compareList.map((item) => (
                                  <div key={item.id} className="px-2">
                                    <p className="text-xs font-bold text-white">
                                      {item.beds} Bedrooms
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Bathrooms Row */}
                              <div
                                className="glass-card rounded-xl p-2.5 grid items-center border border-white/5 bg-white/[0.01]"
                                style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                              >
                                <div className="flex items-center gap-1.5 pr-2">
                                  <span className="material-symbols-outlined text-primary text-sm">bathtub</span>
                                  <span className="text-[11px] font-bold text-white/70">Bathrooms</span>
                                </div>
                                {compareList.map((item) => (
                                  <div key={item.id} className="px-2">
                                    <p className="text-xs font-bold text-white">
                                      {item.baths} Bathrooms
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Availability Row */}
                              <div
                                className="glass-card rounded-xl p-2.5 grid items-center border border-white/5 bg-white/[0.01]"
                                style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                              >
                                <div className="flex items-center gap-1.5 pr-2">
                                  <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
                                  <span className="text-[11px] font-bold text-white/70">Availability</span>
                                </div>
                                {compareList.map((item) => (
                                  <div key={item.id} className="px-2">
                                    <p className="text-xs font-bold text-white">
                                      {item.availableMonth || 'Immediate'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 3. Amenities Side-by-Side Breakdown */}
                            <div className="pt-3">
                              <div className="px-2 py-1.5 mb-1.5">
                                <h4 className="text-[11px] font-black uppercase italic tracking-wider text-primary flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">checklist</span>
                                  <span>Amenities & Building Facilities Comparison</span>
                                </h4>
                              </div>

                              <div className="space-y-1">
                                {ALL_KEY_AMENITIES.map((amenity) => (
                                  <div
                                    key={amenity.key}
                                    className="glass-card rounded-xl p-2.5 grid items-center border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all"
                                    style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                                  >
                                    <div className="flex items-center gap-1.5 pr-2">
                                      <span className="material-symbols-outlined text-sm text-primary/70">{amenity.icon}</span>
                                      <span className="text-[10px] font-bold text-white/80 truncate">{amenity.label}</span>
                                    </div>

                                    {compareList.map((item) => {
                                      const tags = item.tags || [];
                                      const hasAmenity = tags.some(t => 
                                        t.toLowerCase().includes(amenity.key.toLowerCase()) || 
                                        amenity.label.toLowerCase().includes(t.toLowerCase()) ||
                                        (amenity.key === 'cctv' && t.toLowerCase().includes('security'))
                                      );

                                      return (
                                        <div key={item.id} className="px-2 flex items-center gap-1.5">
                                          <span className={`material-symbols-outlined text-sm font-black ${
                                            hasAmenity ? 'text-emerald-400' : 'text-white/20'
                                          }`}>
                                            {hasAmenity ? 'check_circle' : 'cancel'}
                                          </span>
                                          <span className={`text-[10px] font-bold ${
                                            hasAmenity ? 'text-white' : 'text-white/30'
                                          }`}>
                                            {hasAmenity ? 'Included' : 'None'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* 4. Action Row */}
                            <div
                              className="pt-2 grid gap-3"
                              style={{ gridTemplateColumns: `130px repeat(${compareList.length}, minmax(190px, 1fr))` }}
                            >
                              <div />
                              {compareList.map((item) => {
                                const isCurrent = String(item.propertyId) === String(property?.id) || String(item.id) === String(property?.id) || String(item.id) === `comp-${property?.id}`;
                                return (
                                  <div key={item.id} className="pt-1">
                                    {isCurrent ? (
                                      <button
                                        type="button"
                                        onClick={() => setIsCompareModalOpen(false)}
                                        className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[10px] font-black uppercase tracking-wider text-center active:scale-95 transition-all"
                                      >
                                        Currently Viewing
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          haptics.bookingConfirmed();
                                          setIsCompareModalOpen(false);
                                          onBook();
                                        }}
                                        className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-background-dark text-[10px] font-black uppercase tracking-wider text-center shadow-md active:scale-95 transition-all font-display"
                                      >
                                        Book Visit
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-white/40">
                Persistent comparison saved locally
              </span>

              <button
                type="button"
                id="done-compare-modal-btn"
                onClick={() => setIsCompareModalOpen(false)}
                className="py-2.5 px-5 rounded-xl bg-primary text-background-dark text-xs font-black uppercase tracking-wider active:scale-95 transition-all font-display shadow-md shadow-primary/20"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
      {isShareModalOpen && (
        <div
          id="property-share-modal-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            id="property-share-modal-dialog"
            className="w-full max-w-md bg-background-dark border border-white/15 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Swipe-Down Handle */}
            <div 
              className="w-full -mt-2 mb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group"
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const onTouchMove = (ev: TouchEvent) => {
                  if (ev.touches[0].clientY - startY > 70) {
                    setIsShareModalOpen(false);
                    haptics.selection();
                    window.removeEventListener('touchmove', onTouchMove);
                  }
                };
                window.addEventListener('touchmove', onTouchMove, { passive: true });
                window.addEventListener('touchend', () => window.removeEventListener('touchmove', onTouchMove), { once: true });
              }}
            >
              <div className="w-14 h-1.5 rounded-full bg-white/30 group-hover:bg-primary transition-colors" />
              <span className="text-[8px] uppercase tracking-widest text-white/30 font-bold mt-1">Swipe down to dismiss</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl font-black">share</span>
                </div>
                <div>
                  <h3 className="text-base font-black italic uppercase tracking-tight text-white">
                    Share Property
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    Send to social apps & contacts
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="close-share-modal-btn"
                onClick={() => setIsShareModalOpen(false)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Property preview card */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <img
                src={images[0]}
                alt={title}
                className="size-14 rounded-xl object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate">{title}</p>
                <p className="text-[11px] font-black text-primary">{price} {!isSale && <span className="text-[9px] text-white/40 font-normal">/ mo</span>}</p>
                <p className="text-[10px] text-white/50 truncate flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">location_on</span>
                  {location}
                </p>
              </div>
            </div>

            {/* Native Mobile Share Sheet Trigger */}
            <button
              type="button"
              id="btn-native-mobile-share"
              onClick={triggerNativeShare}
              className="w-full py-3 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-background-dark text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg font-black">phone_iphone</span>
              <span>Open Native Mobile Share Sheet</span>
            </button>

            {/* Social Apps Grid */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Send via Social Apps
              </p>
              <div className="grid grid-cols-4 gap-2.5">
                {/* WhatsApp */}
                <a
                  id="share-whatsapp-btn"
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + (shareUrl || window.location.href))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] transition-all active:scale-95 group"
                  title="Share via WhatsApp"
                >
                  <div className="size-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-[#25D366]/30 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">chat</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">WhatsApp</span>
                </a>

                {/* Facebook */}
                <a
                  id="share-facebook-btn"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl || window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] transition-all active:scale-95 group"
                  title="Share on Facebook"
                >
                  <div className="size-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md shadow-[#1877F2]/30 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">public</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">Facebook</span>
                </a>

                {/* Telegram */}
                <a
                  id="share-telegram-btn"
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl || window.location.href)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] transition-all active:scale-95 group"
                  title="Send via Telegram"
                >
                  <div className="size-10 rounded-full bg-[#0088cc] text-white flex items-center justify-center shadow-md shadow-[#0088cc]/30 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">send</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">Telegram</span>
                </a>

                {/* Twitter / X */}
                <a
                  id="share-twitter-btn"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl || window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all active:scale-95 group"
                  title="Post to X"
                >
                  <div className="size-10 rounded-full bg-black text-white border border-white/20 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">tag</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">X (Twitter)</span>
                </a>

                {/* SMS / Message */}
                <a
                  id="share-sms-btn"
                  href={`sms:?body=${encodeURIComponent(shareText + ' ' + (shareUrl || window.location.href))}`}
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 transition-all active:scale-95 group"
                  title="Send SMS"
                >
                  <div className="size-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">sms</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">SMS</span>
                </a>

                {/* Email */}
                <a
                  id="share-email-btn"
                  href={`mailto:?subject=${encodeURIComponent(title + ' - Duyar Property Listing')}&body=${encodeURIComponent(shareText + '\n\n' + (shareUrl || window.location.href))}`}
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition-all active:scale-95 group"
                  title="Send via Email"
                >
                  <div className="size-10 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">Email</span>
                </a>

                {/* Messenger */}
                <a
                  id="share-messenger-btn"
                  href={`fb-messenger://share/?link=${encodeURIComponent(shareUrl || window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 transition-all active:scale-95 group"
                  title="Send via Messenger"
                >
                  <div className="size-10 rounded-full bg-gradient-to-tr from-blue-600 to-violet-500 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-xl">forum</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">Messenger</span>
                </a>

                {/* Copy Link Tile */}
                <button
                  type="button"
                  id="share-copy-tile-btn"
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white transition-all active:scale-95 group cursor-pointer"
                  title="Copy property link"
                >
                  <div className={`size-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                    copiedLink ? 'bg-primary text-background-dark font-black' : 'bg-white/10 text-white group-hover:scale-105'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {copiedLink ? 'check' : 'content_copy'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-white/90">
                    {copiedLink ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            {/* Direct Copy URL Bar */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Property Link
              </p>
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10">
                <input
                  type="text"
                  readOnly
                  value={shareUrl || (typeof window !== 'undefined' ? window.location.href : '')}
                  id="share-url-input"
                  className="flex-1 bg-transparent px-3 text-xs text-white/70 font-mono focus:outline-none truncate selection:bg-primary/30"
                />
                <button
                  type="button"
                  id="copy-property-link-btn"
                  onClick={handleCopyLink}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 shrink-0 cursor-pointer ${
                    copiedLink
                      ? 'bg-primary text-background-dark shadow-md'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                  title="Copy link to clipboard"
                >
                  <span className="material-symbols-outlined text-sm font-black">
                    {copiedLink ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              id="dismiss-share-modal-btn"
              onClick={() => setIsShareModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.99] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen 360° Virtual Tour Viewer Modal */}
      {isVirtualTourModalOpen && (
        <VirtualTour360
          propertyName={title}
          propertyLocation={location}
          isModal={true}
          onClose={() => setIsVirtualTourModalOpen(false)}
        />
      )}

      <style>{`
        .glass-circle { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glass-item { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .fill-icon { font-variation-settings: 'FILL' 1; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default PropertyDetails;
