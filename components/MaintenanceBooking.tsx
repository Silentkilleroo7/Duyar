import React, { useState, useRef, useEffect } from 'react';
import { haptics } from '../haptics';
import { scheduleMaintenanceVisit } from '../maintenanceScheduler';
import { addMaintenanceTicket } from '../maintenanceStorage';

interface Props {
  serviceName: string;
  onBack: () => void;
  onConfirm: (offeredPrice: string) => void;
  userProfile?: any;
}

const POPULAR_AREAS = [
  { name: 'Banani, Dhaka', coords: [23.7937, 90.4066] as [number, number] },
  { name: 'Gulshan-2, Dhaka', coords: [23.7925, 90.4152] as [number, number] },
  { name: 'Gulshan-1, Dhaka', coords: [23.7785, 90.4172] as [number, number] },
  { name: 'Dhanmondi, Dhaka', coords: [23.7461, 90.3742] as [number, number] },
  { name: 'Uttara, Dhaka', coords: [23.8759, 90.3795] as [number, number] },
  { name: 'Mirpur, Dhaka', coords: [23.8069, 90.3685] as [number, number] },
  { name: 'Bashundhara R/A, Dhaka', coords: [23.8155, 90.4325] as [number, number] },
  { name: 'Baridhara DOHS, Dhaka', coords: [23.8055, 90.4190] as [number, number] },
  { name: 'Mohammadpur, Dhaka', coords: [23.7658, 90.3584] as [number, number] }
];

const QUICK_PROBLEM_SUGGESTIONS: Record<string, string[]> = {
  'Electrical': [
    'Ceiling fan wobbling & humming',
    'Switch board sparking / burning smell',
    'New LED fixture & chandelier installation',
    'Circuit breaker tripping frequently',
    'Wall power socket dead'
  ],
  'Plumbing': [
    'Water pipe leaking under kitchen basin',
    'Bathroom faucet dripping constantly',
    'Main drain pipe clogged / slow water outflow',
    'Commode flush valve leaking into bowl',
    'Water pump motor line low pressure'
  ],
  'Painting': [
    'Wall moisture dampness & paint peeling',
    'Single bedroom wall fresh repaint',
    'Ceiling water stain touchup needed',
    'Door and window grill enamel coat'
  ],
  'Appliance Repair': [
    'AC cooling very low, air not cold',
    'Indoor AC unit leaking water on wall',
    'Refrigerator compressor not starting',
    'Washing machine vibration / drainage issue'
  ],
  'Cleaning': [
    'Deep kitchen grease & tile cleaning',
    'Full house deep scrubbing & sanitization',
    'Sofa & mattress fabric shampooing',
    'Balcony floor & window glass washing'
  ],
  'Security': [
    'CCTV camera offline / blind spot rewire',
    'Guard deployment request for apartment gate',
    'Intercom bell connection not ringing'
  ]
};

const MaintenanceBooking: React.FC<Props> = ({ serviceName, onBack, onConfirm, userProfile }) => {
  const [offeredPrice, setOfferedPrice] = useState('1250');
  const [priority, setPriority] = useState<'Standard' | 'Urgent Fix'>('Standard');
  const [description, setDescription] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  // Location States
  const [serviceLocation, setServiceLocation] = useState({
    area: 'Banani, Dhaka',
    address: 'House 14, Road 11, Block D',
    isCurrentLocation: false,
    coords: [23.794, 90.4043] as [number, number]
  });
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editArea, setEditArea] = useState('Banani, Dhaka');
  const [editAddress, setEditAddress] = useState('House 14, Road 11, Block D');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const subServices = {
    'Electrical': ['Fan Repair', 'Light Installation', 'Circuit Breaker', 'Wiring Check', 'Socket Fix'],
    'Plumbing': ['Leaking Pipe', 'Tap Repair', 'Clogged Drain', 'Water Heater', 'New Fitting'],
    'Painting': ['Full Wall Repaint', 'Touch-up Patch', 'Damp Proofing', 'Grill Paint'],
    'Appliance Repair': ['AC Fix & Gas', 'Fridge Repair', 'Washing Machine', 'Microwave Repair'],
    'Cleaning': ['Deep Cleaning', 'Kitchen Wash', 'Bathroom Scrub', 'Sofa Clean'],
    'Security': ['CCTV Setup', 'Gate Guard Hire', 'Intercom Repair'],
    'Maintenance': ['AC Fix', 'Fridge Repair', 'Deep Cleaning', 'Painting', 'Furniture Fix']
  }[serviceName] || ['General Fix', 'Inspection & Quote', 'Installation', 'Urgent Maintenance'];

  const [selectedSub, setSelectedSub] = useState(subServices[0]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (mapRef.current && (window as any).L && !leafletMapRef.current) {
      const L = (window as any).L;
      const initialCoords = serviceLocation.coords;
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(initialCoords, 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      const marker = L.marker(initialCoords, { 
        icon: L.divIcon({ 
          className: 'custom-div-icon', 
          html: `<div class='marker-pin' style='background:#13ecda;'></div>`, 
          iconSize: [30, 42], 
          iconAnchor: [15, 42] 
        }) 
      }).addTo(map);

      leafletMapRef.current = map;
      markerRef.current = marker;
    }
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Map position when coordinates change
  const panMapToCoords = (coords: [number, number]) => {
    if (leafletMapRef.current && markerRef.current) {
      leafletMapRef.current.flyTo(coords, 16, { animate: true, duration: 1.2 });
      markerRef.current.setLatLng(coords);
    }
  };

  // Current Location Selection Handler
  const handleCurrentLocationSelect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your device");
      return;
    }

    setIsLocating(true);
    setToastMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const liveCoords: [number, number] = [latitude, longitude];
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const areaName =
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.residential ||
            data.address?.city_district ||
            'Dhaka';
          const road =
            data.address?.road ||
            data.address?.pedestrian ||
            'Current Location';
          const city = data.address?.city || 'Dhaka';
          const fullArea = `${areaName}, ${city}`;
          const fullAddress = `${road}, Near ${areaName} (GPS Accurate)`;

          setServiceLocation({
            area: fullArea,
            address: fullAddress,
            isCurrentLocation: true,
            coords: liveCoords
          });
          setEditArea(fullArea);
          setEditAddress(fullAddress);
          panMapToCoords(liveCoords);
          setToastMessage("Current location detected & selected!");
          setTimeout(() => setToastMessage(null), 3500);
        } catch (err) {
          const fallbackArea = 'Current Location, Dhaka';
          const fallbackAddr = `GPS Pin [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`;
          setServiceLocation({
            area: fallbackArea,
            address: fallbackAddr,
            isCurrentLocation: true,
            coords: liveCoords
          });
          setEditArea(fallbackArea);
          setEditAddress(fallbackAddr);
          panMapToCoords(liveCoords);
          setToastMessage("Current location detected & selected!");
          setTimeout(() => setToastMessage(null), 3500);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Location error:", err);
        const defaultArea = 'Banani / Gulshan, Dhaka';
        const defaultAddr = 'Current Location (GPS Verified)';
        const defaultCoords: [number, number] = [23.794, 90.4043];
        setServiceLocation({
          area: defaultArea,
          address: defaultAddr,
          isCurrentLocation: true,
          coords: defaultCoords
        });
        setEditArea(defaultArea);
        setEditAddress(defaultAddr);
        panMapToCoords(defaultCoords);
        setToastMessage("Default current location applied!");
        setTimeout(() => setToastMessage(null), 3500);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Save Custom Location from Modal
  const handleSaveLocation = () => {
    if (!editArea.trim()) return;
    
    const matched = POPULAR_AREAS.find(a => a.name.toLowerCase().includes(editArea.toLowerCase()));
    const newCoords = matched ? matched.coords : serviceLocation.coords;

    setServiceLocation({
      area: editArea.trim(),
      address: editAddress.trim() || 'Specified Address',
      isCurrentLocation: false,
      coords: newCoords
    });
    panMapToCoords(newCoords);
    setShowLocationModal(false);
    setToastMessage("Service location updated successfully!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick problem chips based on active category
  const problemSuggestions = QUICK_PROBLEM_SUGGESTIONS[serviceName] || [
    'Inspection & quote needed',
    'Urgent repair required today',
    'Replacement spare parts required',
    'Morning visit preferred'
  ];

  const handleAppendSuggestion = (suggestion: string) => {
    haptics.selection();
    setDescription(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return suggestion;
      if (trimmed.includes(suggestion)) return trimmed;
      return `${trimmed}. ${suggestion}`;
    });
  };

  // Step 1: Open Preview Modal
  const handleOpenPreview = () => {
    haptics.selection();
    setShowPreviewModal(true);
  };

  // Step 2: Final Confirmed Submission from Preview
  const handleFinalSubmit = () => {
    setIsSubmitting(true);
    haptics.bookingConfirmed();

    const userPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402';
    const userName = userProfile?.full_name || 'Resident';
    const userId = userProfile?.id;
    
    const categoryMap: Record<string, 'Electrical' | 'Plumbing' | 'AC & Appliance' | 'Security & CCTV' | 'Carpentry'> = {
      'Electrical': 'Electrical',
      'Plumbing': 'Plumbing',
      'Painting': 'Carpentry',
      'Appliance Repair': 'AC & Appliance',
      'Maintenance': 'AC & Appliance',
      'Cleaning': 'AC & Appliance',
      'Security': 'Security & CCTV',
      'Carpentry': 'Carpentry'
    };
    const category = categoryMap[serviceName] || 'Electrical';
    const iconName = serviceName.toLowerCase().includes('electric') 
      ? 'bolt' 
      : serviceName.toLowerCase().includes('plumb') 
      ? 'plumbing' 
      : serviceName.toLowerCase().includes('paint')
      ? 'brush'
      : serviceName.toLowerCase().includes('clean')
      ? 'sanitizer'
      : serviceName.toLowerCase().includes('security')
      ? 'shield_person'
      : 'build';

    const finalDescription = description.trim() 
      ? `${description.trim()} | Service: ${selectedSub} in ${serviceLocation.area}`
      : `Booked service: ${selectedSub} in ${serviceLocation.area}`;

    try {
      addMaintenanceTicket({
        title: `${serviceName} - ${selectedSub}`,
        category,
        icon: iconName,
        priority: priority === 'Urgent Fix' ? 'High' : 'Standard',
        customerName: userName,
        customerPhone: userPhone,
        userId,
        address: serviceLocation.address,
        area: serviceLocation.area,
        price: `৳ ${offeredPrice}`,
        status: 'PENDING',
        description: finalDescription,
        technicianName: 'Awaiting Provider Acceptance',
        technicianRole: 'Pending Provider Acceptance',
        technicianPhone: '',
        scheduledTime: priority === 'Urgent Fix' ? 'URGENT (30-45 mins)' : 'TODAY'
      });

      scheduleMaintenanceVisit({
        serviceType: serviceName || 'Electrical',
        serviceTitle: `${serviceName || 'Electrical'} Maintenance & Repair`,
        providerName: 'Awaiting Provider',
        providerRole: 'Pending Acceptance',
        customerName: userName,
        customerPhone: userPhone,
        userId,
        address: `${serviceLocation.address}, ${serviceLocation.area}`,
        scheduledTimestamp: Date.now() + 35 * 60 * 1000
      });
    } catch (e) {
      console.warn('Booking persistence note:', e);
    }

    setShowPreviewModal(false);
    setIsSubmitting(false);
    onConfirm(offeredPrice);
  };

  return (
    <div className="min-h-screen bg-background-dark text-white font-display flex flex-col relative overflow-x-hidden pb-40 max-w-[430px] mx-auto select-none">
      {/* Top Header */}
      <header className="px-6 pt-12 pb-4 border-b border-white/5 flex items-center gap-4 sticky top-0 bg-background-dark/80 backdrop-blur-xl z-50">
        <button 
          type="button"
          onClick={onBack} 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none italic">{serviceName}</h1>
          <p className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase mt-1">Configure Your Request</p>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-7 overflow-y-auto no-scrollbar">
        {/* Sub-Service Selection */}
        <section>
          <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-1">Specific Service</h3>
          <div className="flex flex-wrap gap-2">
            {subServices.map(sub => (
              <button 
                type="button"
                key={sub} 
                onClick={() => {
                  haptics.selection();
                  setSelectedSub(sub);
                }} 
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedSub === sub ? 'bg-primary/20 border-primary text-primary shadow-sm' : 'glass-card border-white/10 text-white/60 hover:border-primary/40'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </section>

        {/* CUSTOMER DESCRIPTION BOX - GIVE AN IDEA REGARDING REQUIREMENTS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-white/80 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">description</span>
              <span>Maintenance Requirements</span>
            </h3>
            <span className="text-[9px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Helps Specialist Prepare
            </span>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3 relative focus-within:border-primary/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                Describe the problem or requirement
              </span>
              <span className="text-[9px] text-white/40 font-bold">
                {description.length} / 500
              </span>
            </div>

            <textarea
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Give the specialist an idea of what needs fixing in ${serviceName} (e.g. Symptoms, location in flat, brand/model, parts needed, or preferred time)...`}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary/40 outline-none resize-none leading-relaxed font-medium"
            />

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">
                Tap to quickly add common issues:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {problemSuggestions.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => handleAppendSuggestion(item)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-white/70 hover:text-white font-medium transition-all active:scale-95 text-left flex items-center gap-1"
                  >
                    <span className="text-primary font-black">+</span>
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Priority & Urgency */}
        <section>
          <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-1">Service Priority</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Standard', label: 'Standard Visit', time: 'Today Flexible', icon: 'schedule' },
              { id: 'Urgent Fix', label: 'Urgent Fix', time: 'Within 30–45 mins', icon: 'bolt', badge: 'Fast Track' }
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  haptics.selection();
                  setPriority(p.id as any);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  priority === p.id 
                    ? 'bg-primary/20 border-primary text-white shadow-md' 
                    : 'glass-card border-white/10 text-white/70 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`material-symbols-outlined text-lg ${priority === p.id ? 'text-primary' : 'text-white/40'}`}>
                    {p.icon}
                  </span>
                  {p.badge && (
                    <span className="text-[8px] bg-amber-400/20 text-amber-300 font-black px-1.5 py-0.5 rounded uppercase">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase">{p.label}</h4>
                  <p className="text-[10px] text-white/50 font-bold mt-0.5">{p.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Offered Price */}
        <section>
          <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 px-1">Offered Price (Negotiable)</h3>
          <div className="relative">
             <div className="w-full h-16 rounded-2xl bg-white border-white/10 flex items-center px-6 shadow-inner border-2 border-primary/20">
               <span className="text-black text-xl font-bold mr-2">৳</span>
               <input 
                type="number" 
                value={offeredPrice} 
                onChange={(e) => setOfferedPrice(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-2xl font-black text-black outline-none" 
               />
             </div>
          </div>
          <p className="text-[10px] text-white/30 uppercase mt-2.5 px-1 font-bold italic tracking-wider">
            Budget estimate. You can negotiate and confirm final rate in chat with the specialist.
          </p>
        </section>

        {/* Service Location with CHANGE and Clickable Location Icon */}
        <section className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Service Location</h3>
            <span className="text-[10px] text-white/40 flex items-center gap-1 font-medium">
              <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
              Maintenance Site
            </span>
          </div>

          <div className="glass-card p-4 rounded-2xl flex flex-col gap-4 border border-white/10 shadow-lg">
            {/* Location Address Info Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={handleCurrentLocationSelect}
                  disabled={isLocating}
                  title="Click icon to select your current location"
                  className={`size-11 rounded-xl flex items-center justify-center shrink-0 transition-all border active:scale-95 relative group/icon ${
                    isLocating 
                      ? 'bg-primary/20 text-primary border-primary animate-pulse' 
                      : serviceLocation.isCurrentLocation
                        ? 'bg-primary text-black border-primary shadow-[0_0_15px_rgba(19,236,218,0.5)]'
                        : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/25 hover:scale-105'
                  }`}
                >
                  {isLocating ? (
                    <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-xl group-hover/icon:scale-110 transition-transform">
                      {serviceLocation.isCurrentLocation ? 'my_location' : 'location_on'}
                    </span>
                  )}
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                </button>

                <div 
                  className="flex flex-col min-w-0 flex-1 cursor-pointer" 
                  onClick={() => setShowLocationModal(true)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-extrabold text-sm uppercase tracking-tight truncate">
                      {serviceLocation.area}
                    </span>
                    {serviceLocation.isCurrentLocation && (
                      <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/30 shrink-0">
                        LIVE GPS
                      </span>
                    )}
                  </div>
                  <span className="text-white/50 text-[11px] font-medium truncate mt-0.5">
                    {serviceLocation.address}
                  </span>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="text-primary font-black text-[11px] px-3.5 py-2 hover:bg-primary/15 rounded-xl transition-all tracking-wider uppercase border border-primary/30 bg-primary/5 active:scale-95 shrink-0 shadow-sm"
              >
                CHANGE
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/40 px-1 pt-1 border-t border-white/5">
              <span>Click icon to use GPS</span>
              <button 
                type="button"
                onClick={handleCurrentLocationSelect}
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                {isLocating ? 'Detecting...' : '📍 Use Current Location'}
              </button>
            </div>

            <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
              <div ref={mapRef} className="w-full h-full"></div>
              <div className="absolute top-2 right-2 z-[400] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/80 border border-white/10 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary"></span>
                <span>Job Location</span>
              </div>
            </div>
          </div>

          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{toastMessage}</span>
            </div>
          )}
        </section>
      </main>

      {/* Location Change Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">edit_location</span>
                </div>
                <h3 className="text-white text-base font-extrabold uppercase tracking-tight">
                  Change Service Location
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                handleCurrentLocationSelect();
                setShowLocationModal(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">my_location</span>
              <span>Select My Current Location (GPS)</span>
            </button>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                Popular Areas in Dhaka
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
                {POPULAR_AREAS.map((area) => (
                  <button
                    type="button"
                    key={area.name}
                    onClick={() => {
                      setEditArea(area.name);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                      editArea === area.name 
                        ? 'bg-primary text-black shadow-sm' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    📍 {area.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  Area / Zone
                </label>
                <input 
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  placeholder="e.g. Banani, Dhaka"
                  className="glass-card w-full h-11 rounded-xl px-4 text-white placeholder:text-white/30 text-xs font-semibold focus:ring-1 focus:ring-primary/50 outline-none border border-white/10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  Street / House Address (Detailed)
                </label>
                <input 
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. House 14, Road 11, Block D"
                  className="glass-card w-full h-11 rounded-xl px-4 text-white placeholder:text-white/30 text-xs font-semibold focus:ring-1 focus:ring-primary/50 outline-none border border-white/10"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                className="flex-1 py-3 rounded-xl bg-primary text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all"
              >
                Apply Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL REQUEST PREVIEW MODAL - SHOWS BEFORE SUBMISSION */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#091514] border border-primary/30 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]">
                  <span className="material-symbols-outlined text-xl">preview</span>
                </div>
                <div>
                  <h3 className="text-white text-base font-black uppercase tracking-tight italic">
                    Request Preview
                  </h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                    Confirm details before broadcasting
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Service & Category Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">construction</span>
                  <span className="text-white text-sm font-black uppercase tracking-tight">
                    {serviceName} • {selectedSub}
                  </span>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  priority === 'Urgent Fix' 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                    : 'bg-primary/20 text-primary border border-primary/30'
                }`}>
                  {priority}
                </span>
              </div>

              {/* Requirements Description Block */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-primary/30 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">notes</span>
                    Customer Problem / Requirements Note:
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="text-[9px] text-white/50 hover:text-primary font-bold uppercase underline"
                  >
                    Edit ✎
                  </button>
                </div>
                <p className="text-xs text-white/95 font-medium leading-relaxed italic">
                  "{description.trim() || `Inspection, troubleshooting & fix for ${selectedSub}.`}"
                </p>
              </div>

              {/* Price & Location Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Proposed Budget
                  </span>
                  <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                    ৳ {offeredPrice}
                  </span>
                  <span className="text-[8.5px] text-white/40 uppercase font-medium">Negotiable in chat</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Location Area
                  </span>
                  <span className="text-xs font-bold text-white truncate mt-0.5 block">
                    {serviceLocation.area}
                  </span>
                  <span className="text-[8.5px] text-white/40 uppercase font-medium">
                    {serviceLocation.isCurrentLocation ? 'GPS Verified' : 'Selected Area'}
                  </span>
                </div>
              </div>

              {/* Address Full */}
              <div className="px-1 text-[11px] text-white/60 font-medium">
                📍 {serviceLocation.address}
              </div>
            </div>

            {/* Next Steps Notification */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-white flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">info</span>
              <div className="text-[10.5px] leading-relaxed text-white/80">
                <p className="font-bold text-primary">What happens after submission?</p>
                <p className="mt-0.5 text-white/70">
                  Your request is broadcasted as <span className="text-amber-300 font-bold">PENDING</span> to certified specialists. Once accepted, it moves to <span className="text-primary font-bold">ACTIVE</span> to chat, negotiate, and lock the deal.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-black uppercase tracking-wider transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-[1.8] py-3.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base font-black">check_circle</span>
                <span>CONFIRM & SUBMIT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar - PREVIEW & SUBMIT INITIATION */}
      <div className="fixed bottom-0 left-0 right-0 p-5 glass border-t border-white/10 z-[40]">
        <div className="max-w-[430px] mx-auto flex items-center gap-3">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-[9px] text-white/40 uppercase font-black tracking-wider">Offer</span>
            <span className="text-emerald-400 font-black text-lg leading-tight">৳{offeredPrice}</span>
          </div>
          <button 
            type="button"
            onClick={handleOpenPreview} 
            className="flex-1 bg-primary text-background-dark font-black h-14 rounded-2xl shadow-[0_0_20px_rgba(19,236,218,0.3)] tracking-[0.15em] uppercase active:scale-[0.98] text-xs italic hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined font-black text-base">visibility</span>
            <span>PREVIEW & SUBMIT REQUEST</span>
          </button>
        </div>
      </div>

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .glass { background: rgba(10, 18, 17, 0.9); backdrop-filter: blur(20px); }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default MaintenanceBooking;
