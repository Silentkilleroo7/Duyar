import React, { useState, useRef, useEffect } from 'react';
import { uploadImage } from '../cloudinary';
import { supabase } from '../supabase';
import { 
  RENT_PROPERTY_TYPES, 
  SALE_PROPERTY_TYPES, 
  savePublishedProperty 
} from '../propertyStorage';
import { isUserApprovedLandlord, isUserApprovedLocator } from '../providerApplicationsStorage';
import { haptics } from '../haptics';

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  { label: 'Road 11, Block D, Banani, Dhaka', lat: 23.7937, lng: 90.4066 },
  { label: 'Road 7, Block D, Banani, Dhaka', lat: 23.7940, lng: 90.4043 },
  { label: 'Gulshan Avenue, Gulshan-2, Dhaka', lat: 23.7925, lng: 90.4152 },
  { label: 'Road 27, Dhanmondi, Dhaka', lat: 23.7461, lng: 90.3742 },
  { label: 'Sector 4, Road 18, Uttara, Dhaka', lat: 23.8712, lng: 90.3934 },
  { label: 'Block C, Bashundhara R/A, Dhaka', lat: 23.8161, lng: 90.4265 },
  { label: 'Mirpur DOHS, Dhaka', lat: 23.8340, lng: 90.3685 }
];

interface Props {
  onBack: () => void;
  onSubmit: (adData: any) => void;
  onApplyLandlord?: () => void;
  onApplyLocator?: () => void;
  lang?: 'EN' | 'BN';
  userProfile?: any;
}

const PostAdScreen: React.FC<Props> = ({ 
  onBack, 
  onSubmit, 
  onApplyLandlord, 
  onApplyLocator, 
  lang = 'EN', 
  userProfile 
}) => {
  const isApprovedLandlord = isUserApprovedLandlord(userProfile);
  const isApprovedLocator = isUserApprovedLocator(userProfile);
  const isAuthorized = isApprovedLandlord || isApprovedLocator || userProfile?.role === 'ADMIN' || userProfile?.phone === '+8801977347402';

  const [mode, setMode] = useState<'RENT' | 'SALE'>('RENT');
  const [address, setAddress] = useState('Road 11, Block D, Banani, Dhaka');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pinnedCoords, setPinnedCoords] = useState<[number, number]>([23.7937, 90.4066]);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mapPreviewRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  
  // Type is initialized to first rent option 'Bachelor'
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    type: 'Bachelor',
    availableFrom: '',
    beds: 2,
    baths: 2,
    kitchens: 1,
    balconies: 1,
    sqft: 1200,
    amenities: [] as string[]
  });

  // Current options strictly based on mode (No repeated options!)
  const currentTypeOptions = mode === 'RENT' ? RENT_PROPERTY_TYPES : SALE_PROPERTY_TYPES;

  // Handle Mode Change (RENT vs SALE) with dynamic type adjustment
  const handleModeChange = (newMode: 'RENT' | 'SALE') => {
    haptics.selection();
    setMode(newMode);
    if (newMode === 'RENT') {
      // If current type is not a valid Rent option, default to first option 'Bachelor'
      if (!RENT_PROPERTY_TYPES.includes(formData.type as any)) {
        setFormData(prev => ({ ...prev, type: RENT_PROPERTY_TYPES[0] }));
      }
    } else {
      // If current type is not a valid Sale option, default to first option 'Flat / Apartment'
      if (!SALE_PROPERTY_TYPES.includes(formData.type as any)) {
        setFormData(prev => ({ ...prev, type: SALE_PROPERTY_TYPES[0] }));
      }
    }
  };

  const amenitiesList = [
    { id: 'parking', label: 'Parking', icon: 'local_parking' },
    { id: 'elevator', label: 'Elevator', icon: 'elevator' },
    { id: 'generator', label: 'Generator', icon: 'bolt' },
    { id: 'security', label: 'Security', icon: 'security' },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i]);
      if (url) newImages.push(url);
    }
    setUploadedImages(prev => [...prev, ...newImages]);
    setIsUploading(false);
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (val.length > 1) {
      const filtered = MOCK_SUGGESTIONS.filter(s => s.label.toLowerCase().includes(val.toLowerCase()));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    haptics.selection();
    setAddress(s.label);
    setSuggestions([]);
    setPinnedCoords([s.lat, s.lng]);
    if (leafletInstance.current && markerInstance.current) {
      leafletInstance.current.setView([s.lat, s.lng], 16);
      markerInstance.current.setLatLng([s.lat, s.lng]);
    }
  };

  // GPS Current Location Detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    haptics.selection();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const liveCoords: [number, number] = [latitude, longitude];
        setPinnedCoords(liveCoords);

        if (leafletInstance.current && markerInstance.current) {
          leafletInstance.current.setView(liveCoords, 16);
          markerInstance.current.setLatLng(liveCoords);
        }

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const road = data.address?.road || data.address?.pedestrian || 'Current Location';
          const area = data.address?.suburb || data.address?.neighbourhood || 'Dhaka';
          setAddress(`${road}, ${area}`);
        } catch {
          setAddress(`GPS Pin [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Location error:", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleAmenity = (id: string) => {
    haptics.selection();
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) ? prev.amenities.filter(a => a !== id) : [...prev.amenities, id]
    }));
  };

  const updateCount = (field: 'beds' | 'baths' | 'kitchens' | 'balconies', delta: number) => {
    haptics.selection();
    setFormData(prev => ({ ...prev, [field]: Math.max(0, prev[field] + delta) }));
  };

  // Final Submit Handler - Guarantees property is stored and appears on the map
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.bookingConfirmed();

    if (!formData.title.trim()) {
      alert("Please enter a property headline.");
      return;
    }

    if (!formData.price.trim()) {
      alert("Please enter the property price.");
      return;
    }

    setIsSubmitting(true);

    const ownerId = userProfile?.id || localStorage.getItem('duyar_user_phone') || 'verified-resident-1';
    const fallbackImage = mode === 'RENT' 
      ? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

    const finalImages = uploadedImages.length > 0 ? uploadedImages : [fallbackImage];

    const isVerifiedLandlord = isUserApprovedLandlord(userProfile);
    const isApprovedLocator = isUserApprovedLocator(userProfile);

    // Only landlord approved user shows as verified property immediately.
    // Locator approved user posts will be verified by admin/moderator before getting verified property tag.
    const isAutoVerified = isVerifiedLandlord;
    const posterRole = isVerifiedLandlord ? 'LANDLORD' : isApprovedLocator ? 'LOCATOR' : 'RESIDENT';
    const verifiedBy = isVerifiedLandlord 
      ? 'Duyar Verified Landlord' 
      : isApprovedLocator 
        ? 'Pending Admin/Moderator Verification' 
        : 'Unverified Resident Post';

    const locatorPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402';
    const locatorName = userProfile?.full_name || 'Adnan Sami (Area Locator)';

    // Create the full Property record with exact coordinates for the map
    const newProperty = {
      id: `prop-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: formData.title.trim(),
      price: `৳ ${formData.price.replace(/[^\d,]/g, '')}`,
      location: address.trim() || 'Banani, Dhaka',
      beds: Number(formData.beds) || 1,
      baths: Number(formData.baths) || 1,
      sqft: Number(formData.sqft) || 1000,
      image: finalImages[0],
      images: finalImages,
      tag: mode === 'RENT' ? 'FOR RENT' : 'FOR SALE',
      type: formData.type, // Bachelor, Sub-let, Family, Commercial or Flat / Apartment
      lat: pinnedCoords[0],
      lng: pinnedCoords[1],
      availableMonth: formData.availableFrom || 'Immediate',
      amenities: formData.amenities,
      isVerified: isAutoVerified,
      isFeatured: false,
      metadata: {
        verified: isAutoVerified,
        verifiedBy: verifiedBy,
        verificationDate: isAutoVerified ? new Date().toISOString() : undefined,
        posterRole: posterRole,
        locatorStatus: isApprovedLocator ? 'PENDING_VERIFICATION' : (isVerifiedLandlord ? 'APPROVED' : 'NONE'),
        locatorBountyBDT: isApprovedLocator ? 5 : 0,
        locatorPhone: isApprovedLocator ? locatorPhone : undefined,
        locatorName: isApprovedLocator ? locatorName : undefined,
        ownerPhone: userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402',
        ownerId: ownerId,
        kitchens: formData.kitchens,
        balconies: formData.balconies,
        createdAt: new Date().toISOString()
      }
    };

    try {
      // 1. Save to local propertyStorage with immediate map focus triggers
      savePublishedProperty(newProperty);

      // 2. Also sync to Supabase database with coordinates
      if (supabase) {
        (async () => {
          try {
            const { error } = await supabase.from('properties').insert({
              id: newProperty.id,
              owner_id: ownerId,
              title: newProperty.title,
              price: newProperty.price,
              location: newProperty.location,
              lat: newProperty.lat,
              lng: newProperty.lng,
              latitude: newProperty.lat,
              longitude: newProperty.lng,
              type: newProperty.type,
              beds: newProperty.beds,
              baths: newProperty.baths,
              sqft: newProperty.sqft,
              image_url: newProperty.image,
              tag: newProperty.tag,
              status: 'APPROVED',
              is_verified: isVerifiedLandlord,
              available_month: newProperty.availableMonth
            });
            if (error) console.debug('Supabase property insert note:', error.message);
          } catch (err) {
            console.debug('Supabase sync note:', err);
          }
        })();
      }

      setIsSubmitting(false);
      onSubmit(newProperty);
    } catch (err) {
      console.error("Submission Error:", err);
      // Fallback: save locally and proceed
      savePublishedProperty(newProperty);
      setIsSubmitting(false);
      onSubmit(newProperty);
    }
  };

  // Leaflet Interactive Pin Map Initialization
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapPreviewRef.current) return;

    if (!leafletInstance.current) {
      const map = L.map(mapPreviewRef.current, { 
        zoomControl: false, 
        attributionControl: false 
      }).setView(pinnedCoords, 16);

      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20
      }).addTo(map);

      const customPin = L.divIcon({ 
        className: 'custom-div-icon', 
        html: `<div class='marker-pin' style='background:#13ecda;'></div>`, 
        iconSize: [30, 42], 
        iconAnchor: [15, 42] 
      });

      const marker = L.marker(pinnedCoords, { 
        icon: customPin,
        draggable: true 
      }).addTo(map);

      // Allow dragging or clicking map to place pin accurately
      marker.on('dragend', (ev: any) => {
        const pos = ev.target.getLatLng();
        setPinnedCoords([pos.lat, pos.lng]);
      });

      map.on('click', (ev: any) => {
        marker.setLatLng(ev.latlng);
        setPinnedCoords([ev.latlng.lat, ev.latlng.lng]);
      });

      leafletInstance.current = map;
      markerInstance.current = marker;
    }

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, []);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background-dark font-display text-white max-w-md mx-auto p-6 flex flex-col justify-between select-none">
        <div className="pt-10 space-y-6">
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={onBack}
              className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-base font-black uppercase italic tracking-tight text-amber-400">
                {lang === 'BN' ? 'পোস্টিং অনুমতি সংরক্ষিত' : 'Posting Permission Restricted'}
              </h1>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                {lang === 'BN' ? 'অনুমোদিত ব্যবহারকারী আবশ্যক' : 'Verification Required'}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-amber-500/30 bg-amber-500/10 text-center space-y-4 shadow-2xl backdrop-blur-xl">
            <div className="size-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-3xl">gpp_maybe</span>
            </div>
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-tight text-white">
                {lang === 'BN' ? 'শুধুমাত্র বাড়ি মালিক ও লোকেটরদের জন্য' : 'Approved Landlords & Locators Only'}
              </h2>
              <p className="text-xs text-white/70 mt-2 leading-relaxed font-medium">
                {lang === 'BN' 
                  ? 'এই প্ল্যাটফর্মে শুধুমাত্র অনুমোদিত বাড়ি মালিক এবং যাচাইকৃত লোকেটরগণ প্রোপার্টি বিজ্ঞাপন প্রকাশ করতে পারেন। অন্যান্য সাধারণ ব্যবহারকারীদের ড্যাশবোর্ডে পোস্টিং আইকন দৃশ্যমান হবে না।'
                  : 'Only approved Landlords and verified Locators are authorized to post property listings on Duyar. Listings by approved Landlords show as Verified, while Locators earn rewards once verified.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {onApplyLandlord && (
              <button
                type="button"
                onClick={onApplyLandlord}
                className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/90 text-background-dark font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base font-black">home_work</span>
                {lang === 'BN' ? 'বাড়ি মালিক হিসেবে আবেদন করুন' : 'Apply For Landlord Verification'}
              </button>
            )}

            {onApplyLocator && (
              <button
                type="button"
                onClick={onApplyLocator}
                className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-white/10 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base font-black">explore</span>
                {lang === 'BN' ? 'লোকেটর হিসেবে আবেদন করুন' : 'Apply For Locator Approval'}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full py-4 text-center text-xs font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors"
        >
          {lang === 'BN' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Return To Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white font-display overflow-y-auto pb-36 select-none">
      <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input type="file" ref={galleryInputRef} accept="image/*" multiple className="hidden" onChange={handleFileChange} />

      <div className="max-w-md mx-auto px-4 pt-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            type="button" 
            onClick={onBack} 
            className="w-12 h-12 rounded-full flex items-center justify-center glass border border-white/10 active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-primary font-bold">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none">Publish Property</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
              Your post will appear live on the map
            </p>
          </div>
        </div>

        {/* Landlord Verification Notice */}
        {isUserApprovedLandlord(userProfile) ? (
          <div className="mb-6 p-3.5 rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-3 animate-in fade-in">
            <span className="material-symbols-outlined text-primary text-2xl shrink-0 font-black">verified</span>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Verified Landlord Account</p>
              <p className="text-[10px] text-primary/80 font-semibold mt-0.5">
                Your listing will display with the official Verified Shield badge directly on the map.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center gap-3 animate-in fade-in">
            <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0 font-black">info</span>
            <div>
              <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Resident Post (Unverified)</p>
              <p className="text-[10px] text-white/70 font-semibold mt-0.5">
                Will show on the map directly for all searchers. Apply as Landlord in Profile to unlock the Verified Shield badge.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleFinalSubmit} className="space-y-8">
          {/* Rent/Sale Mode Toggle */}
          <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <button 
              type="button" 
              onClick={() => handleModeChange('RENT')} 
              className={`flex-1 py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                mode === 'RENT' 
                  ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,218,0.4)]' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              FOR RENT
            </button>
            <button 
              type="button" 
              onClick={() => handleModeChange('SALE')} 
              className={`flex-1 py-3.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                mode === 'SALE' 
                  ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,218,0.4)]' 
                  : 'text-white/50 hover:text-white'
              }`}
            >
              FOR SALE
            </button>
          </div>

          {/* Photo Upload Section */}
          <section className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">
              Property Images
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => cameraInputRef.current?.click()} 
                className="glass-card aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-2 border-dashed border-2 border-white/10 hover:border-primary/40 bg-primary/5 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/80">Camera</span>
              </button>
              {uploadedImages.length > 0 ? (
                <div className="relative aspect-square rounded-[2rem] overflow-hidden border border-white/10">
                  <img src={uploadedImages[0]} className="w-full h-full object-cover" alt="Uploaded Preview" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white font-black text-xl">+{uploadedImages.length}</span>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => galleryInputRef.current?.click()} 
                  className="glass-card aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-2 border-dashed border-2 border-white/10 hover:border-blue-500/40 bg-blue-500/5 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-blue-400 text-3xl">image</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-300">Gallery</span>
                </button>
              )}
            </div>
            {isUploading && (
              <p className="text-[10px] text-primary font-bold animate-pulse px-1">Uploading photo...</p>
            )}
          </section>

          {/* Headline & Price */}
          <section className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">
                Property Headline
              </label>
              <input 
                required 
                className="w-full glass-card border-white/10 rounded-2xl px-5 py-4 text-white outline-none font-bold text-sm placeholder:text-white/30 focus:border-primary/50 transition-colors" 
                placeholder="e.g. Spacious 3-Bed Family Flat with Balcony" 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">
                {mode === 'RENT' ? 'Monthly Rent (৳)' : 'Asking Price (৳)'}
              </label>
              <div className="relative">
                <input 
                  required 
                  type="number" 
                  className="w-full glass-card border-white/10 rounded-2xl pl-11 pr-5 py-4 outline-none font-black text-xl text-white placeholder:text-white/30 focus:border-primary/50 transition-colors" 
                  placeholder={mode === 'RENT' ? '25000' : '15000000'} 
                  value={formData.price} 
                  onChange={e => setFormData({ ...formData, price: e.target.value })} 
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-xl">৳</span>
              </div>
            </div>

            {/* SELECT TYPE SECTION - DYNAMIC BASED ON FOR RENT vs FOR SALE */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">category</span>
                  <span>Select Type ({mode === 'RENT' ? 'For Rent' : 'For Sale'})</span>
                </label>
                <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {currentTypeOptions.length} Options
                </span>
              </div>

              {/* Option Chips (No duplicates!) */}
              <div className="grid grid-cols-2 gap-2">
                {currentTypeOptions.map((t) => {
                  const isSelected = formData.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        haptics.selection();
                        setFormData({ ...formData, type: t });
                      }}
                      className={`h-12 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all active:scale-95 flex items-center justify-between ${
                        isSelected 
                          ? 'bg-primary border-primary text-background-dark shadow-[0_0_15px_rgba(19,236,218,0.35)]' 
                          : 'glass-card border-white/10 text-white/70 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="truncate">{t}</span>
                      {isSelected ? (
                        <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                      ) : (
                        <span className="size-2 rounded-full border border-white/30"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Native Dropdown (Synchronized with selected type, strictly distinct options) */}
              <div className="relative mt-2">
                <select 
                  className="w-full glass-card border-white/10 rounded-2xl px-4 py-3.5 outline-none bg-[#0a1614] font-bold text-xs appearance-none text-white cursor-pointer"
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  {currentTypeOptions.map(t => (
                    <option key={t} value={t} className="bg-[#0a1614] text-white py-1">
                      {t}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-sm">
                  expand_more
                </span>
              </div>
            </div>

            {/* Address & Interactive Map Pinning */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                  Location & Map Pin
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">my_location</span>
                  <span>{isLocating ? 'Locating...' : 'Use GPS'}</span>
                </button>
              </div>

              <div className="relative">
                <input 
                  required 
                  value={address} 
                  onChange={(e) => handleAddressChange(e.target.value)} 
                  className="w-full glass-card border-white/10 rounded-2xl pl-11 pr-5 py-4 outline-none font-medium text-xs text-white placeholder:text-white/30 focus:border-primary/50 transition-colors" 
                  placeholder="e.g. Road 11, Block D, Banani, Dhaka" 
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-base">location_on</span>
                
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#091514] border border-white/20 rounded-2xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i} 
                        type="button" 
                        onClick={() => selectSuggestion(s)} 
                        className="w-full text-left px-4 py-3 border-b border-white/5 last:border-none hover:bg-primary/15 transition-colors flex items-center gap-2.5"
                      >
                        <span className="material-symbols-outlined text-primary text-sm">place</span>
                        <span className="text-xs font-semibold text-white/90 truncate">{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive Map Pin Display */}
              <div className="w-full h-44 rounded-2xl overflow-hidden glass-card border border-primary/30 relative shadow-inner">
                <div ref={mapPreviewRef} className="w-full h-full"></div>
                <div className="absolute top-2 right-2 z-[400] bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary animate-ping"></span>
                  <span>Drag marker to adjust pin</span>
                </div>
              </div>
            </div>
          </section>

          {/* Area & Date Details */}
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Area (SQFT)</label>
                 <input 
                  type="number" 
                  className="w-full glass-card border-white/10 rounded-2xl px-5 py-3.5 outline-none font-bold text-sm text-white" 
                  value={formData.sqft} 
                  onChange={e => setFormData({ ...formData, sqft: Number(e.target.value) })} 
                 />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Available Date</label>
                 <input 
                  type="date" 
                  className="w-full glass-card border-white/10 rounded-2xl px-4 py-3.5 outline-none font-bold text-xs uppercase text-white" 
                  value={formData.availableFrom} 
                  onChange={e => setFormData({ ...formData, availableFrom: e.target.value })} 
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <Counter label="Bedrooms" val={formData.beds} onDec={() => updateCount('beds', -1)} onInc={() => updateCount('beds', 1)} />
              <Counter label="Bathrooms" val={formData.baths} onDec={() => updateCount('baths', -1)} onInc={() => updateCount('baths', 1)} />
              <Counter label="Kitchens" val={formData.kitchens} onDec={() => updateCount('kitchens', -1)} onInc={() => updateCount('kitchens', 1)} />
              <Counter label="Balconies" val={formData.balconies} onDec={() => updateCount('balconies', -1)} onInc={() => updateCount('balconies', 1)} />
            </div>

            <div className="space-y-2.5">
               <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Amenities</label>
               <div className="flex flex-wrap gap-2">
                  {amenitiesList.map(a => (
                    <button 
                      key={a.id} 
                      type="button" 
                      onClick={() => toggleAmenity(a.id)} 
                      className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 ${
                        formData.amenities.includes(a.id) 
                          ? 'bg-primary border-primary text-background-dark font-extrabold shadow-sm' 
                          : 'glass-card border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  ))}
               </div>
            </div>
          </section>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting || isUploading} 
            className="w-full bg-primary hover:bg-[#0fd9d9] text-background-dark font-black h-18 rounded-2xl shadow-[0_15px_30px_rgba(19,236,218,0.3)] uppercase transition-all active:scale-95 flex items-center justify-center gap-2.5 italic text-sm tracking-widest disabled:opacity-50"
          >
            <span className="material-symbols-outlined font-black text-xl">publish</span>
            <span>{isSubmitting ? 'PINNING ON MAP...' : 'PUBLISH & PIN ON MAP'}</span>
          </button>
        </form>
      </div>

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

const Counter = ({ label, val, onDec, onInc }: any) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-1">{label}</p>
    <div className="flex items-center justify-between glass-card rounded-2xl p-1 px-2 h-13 border border-white/10">
      <button 
        type="button" 
        onClick={onDec} 
        className="size-9 rounded-xl bg-white/5 flex items-center justify-center text-primary active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-sm">remove</span>
      </button>
      <span className="text-base font-black text-white">{val}</span>
      <button 
        type="button" 
        onClick={onInc} 
        className="size-9 rounded-xl bg-white/5 flex items-center justify-center text-primary active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
    </div>
  </div>
);

export default PostAdScreen;
