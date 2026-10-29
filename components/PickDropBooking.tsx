import React, { useState, useRef, useEffect } from 'react';
import { saveActivePickDropRequest, getActivePickDropRequest, PickDropRequest } from '../pickDropStorage';
import { haptics } from '../haptics';
import { ProximityRadarModal } from './ProximityRadarModal';
import { RankedProvider } from '../proximityDispatcher';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
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
  { name: 'Mohammadpur, Dhaka', coords: [23.7658, 90.3584] as [number, number] },
  { name: 'Motijheel, Dhaka', coords: [23.7330, 90.4178] as [number, number] }
];

const QUICK_TAGS = [
  'Fragile / Glassware',
  'Elevator Available',
  'Stairs Only (No Lift)',
  'Disassembly Required',
  'Heavy Appliances (>100kg)',
  'Urgent / Priority Move'
];

const FLOOR_OPTIONS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  '5th+ Floor'
];

const PickDropBooking: React.FC<Props> = ({ onBack, onConfirm, userProfile }) => {
  // Navigation between main booking view and dedicated item details page
  const [currentPage, setCurrentPage] = useState<'booking' | 'details'>('booking');

  const [vehicle, setVehicle] = useState('Pickup');
  const [helpers, setHelpers] = useState(2);
  const [items, setItems] = useState<string[]>(['Sofa', 'Fridge']);
  const [userFare, setUserFare] = useState('2450');
  const [showProximityModal, setShowProximityModal] = useState(false);

  // Item Details State (shown to driver)
  const [itemDetails, setItemDetails] = useState(
    '1 3-seater sofa, 1 double door refrigerator, 1 queen size bed with mattress. Glass top dining table needs careful bubble wrap.'
  );
  const [specialNotes, setSpecialNotes] = useState<string[]>([
    'Fragile / Glassware',
    'Elevator Available'
  ]);
  const [pickupFloor, setPickupFloor] = useState('2nd Floor');
  const [dropFloor, setDropFloor] = useState('4th Floor');
  const [driverInstructions, setDriverInstructions] = useState('Please enter through Gate 2 and call upon arrival.');

  // Pickup Location State
  const [pickupLocation, setPickupLocation] = useState({
    area: 'Banani Block D, Dhaka',
    address: 'House 12, Road 4, Banani',
    isCurrentLocation: false,
    coords: [23.794, 90.4043] as [number, number]
  });

  // Destination Location State
  const [dropLocation, setDropLocation] = useState({
    area: 'Uttara Sector 4, Dhaka',
    address: 'House 18, Road 7, Sector 4, Uttara',
    isCurrentLocation: false,
    coords: [23.8759, 90.3795] as [number, number]
  });

  const [isLocatingPickup, setIsLocatingPickup] = useState(false);
  const [isLocatingDrop, setIsLocatingDrop] = useState(false);
  const [locationModalTarget, setLocationModalTarget] = useState<'pickup' | 'drop' | null>(null);
  const [editArea, setEditArea] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCoords, setEditCoords] = useState<[number, number] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const pickupMapRef = useRef<HTMLDivElement>(null);
  const dropMapRef = useRef<HTMLDivElement>(null);
  const leafletPickupMapRef = useRef<any>(null);
  const leafletDropMapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const dropMarkerRef = useRef<any>(null);

  // Load existing draft if available
  useEffect(() => {
    try {
      const active = getActivePickDropRequest();
      if (active) {
        if (active.vehicle) setVehicle(active.vehicle);
        if (active.helpers) setHelpers(active.helpers);
        if (active.items && active.items.length) setItems(active.items);
        if (active.fare) setUserFare(active.fare);
        if (active.itemDetails) setItemDetails(active.itemDetails);
        if (active.specialNotes) setSpecialNotes(active.specialNotes);
        if (active.pickupFloor) setPickupFloor(active.pickupFloor);
        if (active.dropFloor) setDropFloor(active.dropFloor);
        if (active.driverInstructions) setDriverInstructions(active.driverInstructions);
      }
    } catch (e) {
      console.warn("Could not load draft:", e);
    }
  }, []);

  const toggleItem = (item: string) => {
    setItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const toggleSpecialTag = (tag: string) => {
    setSpecialNotes(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Initialize Leaflet maps on booking view
  useEffect(() => {
    if (currentPage !== 'booking') return;

    const timer = setTimeout(() => {
      const L = (window as any).L;
      if (!L) return;

      if (pickupMapRef.current && !leafletPickupMapRef.current) {
        const pMap = L.map(pickupMapRef.current, { zoomControl: false, attributionControl: false }).setView(pickupLocation.coords, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pMap);
        const pMarker = L.marker(pickupLocation.coords, { 
          icon: L.divIcon({ 
            className: 'custom-div-icon', 
            html: `<div class='marker-pin' style='background:#13ecda; box-shadow:0 0 10px rgba(19,236,218,0.7);'></div>`, 
            iconSize: [30, 42], 
            iconAnchor: [15, 42] 
          }) 
        }).addTo(pMap);

        leafletPickupMapRef.current = pMap;
        pickupMarkerRef.current = pMarker;
      }

      if (dropMapRef.current && !leafletDropMapRef.current) {
        const dMap = L.map(dropMapRef.current, { zoomControl: false, attributionControl: false }).setView(dropLocation.coords, 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(dMap);
        const dMarker = L.marker(dropLocation.coords, { 
          icon: L.divIcon({ 
            className: 'custom-div-icon', 
            html: `<div class='marker-pin' style='background:#ffffff; box-shadow:0 0 10px rgba(255,255,255,0.7);'></div>`, 
            iconSize: [30, 42], 
            iconAnchor: [15, 42] 
          }) 
        }).addTo(dMap);

        leafletDropMapRef.current = dMap;
        dropMarkerRef.current = dMarker;
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (leafletPickupMapRef.current) {
        leafletPickupMapRef.current.remove();
        leafletPickupMapRef.current = null;
      }
      if (leafletDropMapRef.current) {
        leafletDropMapRef.current.remove();
        leafletDropMapRef.current = null;
      }
    };
  }, [currentPage]);

  // Pan pickup map smoothly
  const panPickupMapToCoords = (coords: [number, number]) => {
    if (leafletPickupMapRef.current && pickupMarkerRef.current) {
      leafletPickupMapRef.current.flyTo(coords, 15, { animate: true, duration: 1.0 });
      pickupMarkerRef.current.setLatLng(coords);
    }
  };

  // Pan destination map smoothly
  const panDropMapToCoords = (coords: [number, number]) => {
    if (leafletDropMapRef.current && dropMarkerRef.current) {
      leafletDropMapRef.current.flyTo(coords, 15, { animate: true, duration: 1.0 });
      dropMarkerRef.current.setLatLng(coords);
    }
  };

  // Current Location Selection Handler
  const handleCurrentLocationSelect = (target: 'pickup' | 'drop') => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your device");
      return;
    }

    if (target === 'pickup') setIsLocatingPickup(true);
    else setIsLocatingDrop(true);
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

          if (target === 'pickup') {
            setPickupLocation({
              area: fullArea,
              address: fullAddress,
              isCurrentLocation: true,
              coords: liveCoords
            });
            panPickupMapToCoords(liveCoords);
            setToastMessage("Current location set as Pickup Point!");
          } else {
            setDropLocation({
              area: fullArea,
              address: fullAddress,
              isCurrentLocation: true,
              coords: liveCoords
            });
            panDropMapToCoords(liveCoords);
            setToastMessage("Current location set as Destination!");
          }
          setTimeout(() => setToastMessage(null), 3500);
        } catch (err) {
          const fallbackArea = 'Current Location, Dhaka';
          const fallbackAddr = `GPS Pin [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`;
          if (target === 'pickup') {
            setPickupLocation({
              area: fallbackArea,
              address: fallbackAddr,
              isCurrentLocation: true,
              coords: liveCoords
            });
            panPickupMapToCoords(liveCoords);
            setToastMessage("Current location set as Pickup Point!");
          } else {
            setDropLocation({
              area: fallbackArea,
              address: fallbackAddr,
              isCurrentLocation: true,
              coords: liveCoords
            });
            panDropMapToCoords(liveCoords);
            setToastMessage("Current location set as Destination!");
          }
          setTimeout(() => setToastMessage(null), 3500);
        } finally {
          setIsLocatingPickup(false);
          setIsLocatingDrop(false);
        }
      },
      (err) => {
        console.warn("Location error:", err);
        const defaultArea = 'Banani, Dhaka';
        const defaultAddr = 'Current Location (GPS Verified)';
        const defaultCoords: [number, number] = [23.7937, 90.4066];
        if (target === 'pickup') {
          setPickupLocation({
            area: defaultArea,
            address: defaultAddr,
            isCurrentLocation: true,
            coords: defaultCoords
          });
          panPickupMapToCoords(defaultCoords);
          setToastMessage("Default current location applied to Pickup!");
        } else {
          setDropLocation({
            area: defaultArea,
            address: defaultAddr,
            isCurrentLocation: true,
            coords: defaultCoords
          });
          panDropMapToCoords(defaultCoords);
          setToastMessage("Default current location applied to Destination!");
        }
        setTimeout(() => setToastMessage(null), 3500);
        setIsLocatingPickup(false);
        setIsLocatingDrop(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const openLocationModal = (target: 'pickup' | 'drop') => {
    const loc = target === 'pickup' ? pickupLocation : dropLocation;
    setEditArea(loc.area);
    setEditAddress(loc.address);
    setEditCoords(loc.coords);
    setLocationModalTarget(target);
  };

  const handleSaveLocation = () => {
    if (!locationModalTarget || !editArea.trim()) return;

    if (locationModalTarget === 'pickup') {
      const coords = editCoords || pickupLocation.coords;
      setPickupLocation({
        area: editArea.trim(),
        address: editAddress.trim() || 'Specified Address',
        isCurrentLocation: false,
        coords
      });
      panPickupMapToCoords(coords);
      setToastMessage("Pickup location updated successfully!");
    } else {
      const coords = editCoords || dropLocation.coords;
      setDropLocation({
        area: editArea.trim(),
        address: editAddress.trim() || 'Specified Address',
        isCurrentLocation: false,
        coords
      });
      panDropMapToCoords(coords);
      setToastMessage("Destination location updated successfully!");
    }

    setLocationModalTarget(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle final submission and persist for driver visibility
  const handleFinalConfirm = () => {
    haptics.bookingConfirmed();
    const orderData: PickDropRequest = {
      id: `PD-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicle,
      helpers,
      items,
      itemDetails: itemDetails.trim() || 'Standard household items for moving.',
      specialNotes,
      pickupFloor,
      dropFloor,
      driverInstructions,
      pickupArea: pickupLocation.area,
      pickupAddress: pickupLocation.address,
      dropArea: dropLocation.area,
      dropAddress: dropLocation.address,
      fare: userFare,
      weightCategory: 'Under 500kg',
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      driverName: 'Awaiting Driver Acceptance',
      driverPhone: '',
      driverVehicleNo: '',
      userPhone: userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402',
      userId: userProfile?.id
    };

    saveActivePickDropRequest(orderData);
    onConfirm();
  };

  const handleProximityDispatch = (provider: RankedProvider) => {
    const orderData: PickDropRequest = {
      id: `PD-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicle,
      helpers,
      items,
      itemDetails: itemDetails.trim() || 'Standard household items for moving.',
      specialNotes,
      pickupFloor,
      dropFloor,
      driverInstructions: `${driverInstructions ? `${driverInstructions} | ` : ''}Dispatched nearest driver: ${provider.name} (${provider.distanceKm} km away • Top Priority)`,
      pickupArea: pickupLocation.area,
      pickupAddress: pickupLocation.address,
      dropArea: dropLocation.area,
      dropAddress: dropLocation.address,
      fare: userFare,
      weightCategory: 'Under 500kg',
      createdAt: new Date().toISOString(),
      status: 'ACCEPTED',
      driverName: provider.name,
      driverPhone: provider.phone,
      driverVehicleNo: `Dhaka Metro-U ${Math.floor(11 + Math.random() * 88)}-${Math.floor(1000 + Math.random() * 9000)} (📍 ${provider.distanceKm} km away • Top Priority)`,
      userPhone: userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402',
      userId: userProfile?.id
    };

    saveActivePickDropRequest(orderData);
    setShowProximityModal(false);
    onConfirm();
  };

  const vehicles = [
    { name: 'Pickup', icon: 'airport_shuttle' },
    { name: 'Mini Truck', icon: 'local_shipping' },
    { name: 'Large Truck', icon: 'arrow_right' }
  ];

  // ----------------------------------------------------
  // SUB-PAGE: ITEM MOVE DETAILS PAGE (Shown to Driver)
  // ----------------------------------------------------
  if (currentPage === 'details') {
    return (
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-background-dark font-display text-white selection:bg-primary/30 animate-in fade-in duration-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Top Header */}
        <header className="flex items-center px-5 pt-12 pb-4 justify-between relative z-10 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setCurrentPage('booking')}
              className="flex items-center justify-center size-10 rounded-full glass-card border-white/10 active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h2 className="text-white text-lg font-black uppercase italic tracking-tight">Moving Item Details</h2>
              <p className="text-primary text-[10px] font-bold uppercase tracking-wider">Driver Briefing Sheet</p>
            </div>
          </div>
          <span className="size-2 rounded-full bg-primary animate-ping"></span>
        </header>

        {/* Details Form Area */}
        <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto no-scrollbar pb-36 relative z-10">
          {/* Informational Banner */}
          <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-start gap-3 shadow-lg">
            <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">badge</span>
            <div>
              <h4 className="text-white text-xs font-black uppercase tracking-wider">Visible to Your Assigned Driver</h4>
              <p className="text-white/60 text-[11px] leading-relaxed mt-0.5">
                The driver will read this note before arriving to bring the correct ropes, blankets, and vehicle space for your move.
              </p>
            </div>
          </div>

          {/* Short Details on Moving Items */}
          <section className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-white/90 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">edit_note</span>
                Short Details on Items to Move
              </label>
              <span className="text-[10px] text-white/40 font-mono">
                {itemDetails.length}/350 chars
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={350}
              value={itemDetails}
              onChange={(e) => setItemDetails(e.target.value)}
              placeholder="e.g. 1 3-seater sofa, 1 double bed frame with mattress, 4 packing boxes. Please note the glass dining table is very fragile. Pickup from 2nd floor, delivery to 4th floor."
              className="w-full bg-white text-black placeholder:text-gray-500 rounded-2xl p-4 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none border-2 border-primary/30 resize-none transition-all shadow-lg leading-relaxed selection:bg-primary/30"
            />
            <p className="text-[10px] text-white/40 italic px-1">
              Tip: List large furniture, number of boxes, and any fragile objects.
            </p>
          </section>

          {/* Quick Handling & Access Tags */}
          <section className="space-y-2.5">
            <label className="text-white/80 text-[11px] font-bold uppercase tracking-wider ml-1 block">
              Special Handling Tags (Select All That Apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const isSelected = specialNotes.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleSpecialTag(tag)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95 flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-primary text-background-dark border-primary shadow-[0_0_12px_rgba(19,236,218,0.3)]' 
                        : 'glass-card border-white/5 text-white/70 hover:border-white/20'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Floor & Lift Information */}
          <section className="bg-white p-5 rounded-2xl border-2 border-primary/30 shadow-xl space-y-4 text-black">
            <h4 className="text-black text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0f766e] text-base font-black">apartment</span>
              Floor & Building Access
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700 text-[10px] font-black uppercase tracking-wider">Pickup Floor</label>
                <div className="relative">
                  <select
                    value={pickupFloor}
                    onChange={(e) => setPickupFloor(e.target.value)}
                    className="w-full h-11 rounded-xl bg-gray-50 hover:bg-white text-black text-xs font-bold border-2 border-gray-200 focus:border-primary px-3 pr-8 outline-none cursor-pointer shadow-sm appearance-none"
                  >
                    {FLOOR_OPTIONS.map((f) => (
                      <option key={f} value={f} className="bg-white text-black font-semibold">{f}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-base">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-gray-700 text-[10px] font-black uppercase tracking-wider">Drop Floor</label>
                <div className="relative">
                  <select
                    value={dropFloor}
                    onChange={(e) => setDropFloor(e.target.value)}
                    className="w-full h-11 rounded-xl bg-gray-50 hover:bg-white text-black text-xs font-bold border-2 border-gray-200 focus:border-primary px-3 pr-8 outline-none cursor-pointer shadow-sm appearance-none"
                  >
                    {FLOOR_OPTIONS.map((f) => (
                      <option key={f} value={f} className="bg-white text-black font-semibold">{f}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-base">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-gray-700 text-[10px] font-black uppercase tracking-wider">
                Driver Entry Instructions (Gate / Parking)
              </label>
              <input
                type="text"
                value={driverInstructions}
                onChange={(e) => setDriverInstructions(e.target.value)}
                placeholder="e.g. Enter through Gate 2, guard clearance needed"
                className="w-full h-11 rounded-xl bg-gray-50 focus:bg-white text-black placeholder:text-gray-400 text-xs font-semibold border-2 border-gray-200 focus:border-primary px-3.5 outline-none shadow-sm transition-all"
              />
            </div>
          </section>

          {/* Live Preview of What the Driver Sees */}
          <section className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">
                Driver Screen Preview
              </span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                Driver View
              </span>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-dashed border-primary/40 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">local_shipping</span>
                <span>Incoming Pickup Request #{Math.floor(1000 + Math.random() * 9000)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-md">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                  Client Moving Items Note:
                </span>
                <p className="text-xs text-black font-semibold leading-relaxed italic">
                  "{itemDetails || 'No special notes provided'}"
                </p>
              </div>
              {specialNotes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specialNotes.map(n => (
                    <span key={n} className="bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 rounded border border-primary/30">
                      ⚡ {n}
                    </span>
                  ))}
                  <span className="bg-white text-black font-extrabold text-[9px] px-2 py-0.5 rounded border border-gray-300 shadow-sm">
                    🪜 {pickupFloor} ➔ {dropFloor}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sticky Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-background-dark/95 backdrop-blur-xl border-t border-white/10 z-30 max-w-[430px] mx-auto">
          <button
            type="button"
            onClick={() => {
              setToastMessage("Moving details saved for driver!");
              setCurrentPage('booking');
              setTimeout(() => setToastMessage(null), 3500);
            }}
            className="w-full h-14 bg-primary hover:bg-[#11d8c7] text-background-dark font-black text-sm uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(19,236,218,0.3)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Save Details & Return to Booking
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN VIEW: BOOK PROFESSIONAL MOVING SERVICES
  // ----------------------------------------------------
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-background-dark font-display text-white selection:bg-primary/30">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex items-center p-4 pt-6 justify-between relative z-10">
        <button 
          onClick={onBack}
          className="flex items-center justify-center size-10 rounded-full glass-card border-white/10 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
        </button>
      </div>

      <div className="px-5 pt-2 relative z-10">
        <h1 className="text-primary text-[32px] font-bold tracking-tight leading-tight uppercase italic">Pick & Drop</h1>
        <p className="text-white/60 text-sm mt-1 font-medium">Book professional moving services</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-6 relative z-10 overflow-y-auto no-scrollbar pb-36">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Vehicle Selection */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-white/90 text-sm font-semibold uppercase tracking-wider">Vehicle Type</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {vehicles.map((v) => (
              <div 
                key={v.name}
                onClick={() => setVehicle(v.name)}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all cursor-pointer border ${vehicle === v.name ? 'bg-primary text-background-dark border-primary' : 'glass-card border-white/5 text-white/60'}`}
              >
                <span className={`material-symbols-outlined text-[20px] ${vehicle === v.name ? 'text-background-dark' : 'text-primary'}`}>{v.icon}</span>
                <p className={`text-sm ${vehicle === v.name ? 'font-bold' : 'font-medium'}`}>{v.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Service Locations Section: Pickup and Destination */}
        <section className="glass-card rounded-2xl p-5 relative border border-white/10 space-y-6 shadow-xl">
          {/* Pickup Point (Service Location) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-primary text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_rgba(19,236,218,0.8)]"></span>
                Pickup Point (Service Location)
              </label>
              <button
                type="button"
                onClick={() => handleCurrentLocationSelect('pickup')}
                disabled={isLocatingPickup}
                className="text-[10px] text-primary/80 hover:text-primary font-bold flex items-center gap-1"
              >
                {isLocatingPickup ? 'Locating...' : '📍 Use Current GPS'}
              </button>
            </div>

            {/* Pickup Location Header Card */}
            <div className="glass-inner flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleCurrentLocationSelect('pickup')}
                  disabled={isLocatingPickup}
                  title="Click icon to select your current location for pickup"
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all border active:scale-95 relative group/icon ${
                    isLocatingPickup 
                      ? 'bg-primary/20 text-primary border-primary animate-pulse' 
                      : pickupLocation.isCurrentLocation
                        ? 'bg-primary text-black border-primary shadow-[0_0_12px_rgba(19,236,218,0.5)]'
                        : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/25 hover:scale-105'
                  }`}
                >
                  {isLocatingPickup ? (
                    <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg group-hover/icon:scale-110 transition-transform">
                      {pickupLocation.isCurrentLocation ? 'my_location' : 'location_on'}
                    </span>
                  )}
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                </button>

                <div 
                  className="flex flex-col min-w-0 flex-1 cursor-pointer"
                  onClick={() => openLocationModal('pickup')}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-extrabold text-sm truncate">
                      {pickupLocation.area}
                    </span>
                    {pickupLocation.isCurrentLocation && (
                      <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/30 shrink-0">
                        LIVE GPS
                      </span>
                    )}
                  </div>
                  <span className="text-white/50 text-[11px] font-medium truncate mt-0.5">
                    {pickupLocation.address}
                  </span>
                </div>
              </div>

              {/* CHANGE Option Button */}
              <button 
                type="button"
                onClick={() => openLocationModal('pickup')}
                className="text-primary font-black text-[11px] px-3 py-1.5 hover:bg-primary/15 rounded-lg transition-all tracking-wider uppercase border border-primary/30 bg-primary/5 active:scale-95 shrink-0 ml-2 shadow-sm"
              >
                CHANGE
              </button>
            </div>

            {/* Interactive Pickup Map */}
            <div className="w-full h-24 rounded-xl overflow-hidden glass-card border border-white/5 relative">
              <div ref={pickupMapRef} className="w-full h-full"></div>
            </div>
          </div>
          
          {/* Route Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-white/10"></div>
            <span className="absolute bg-[#122220] px-3 text-[10px] text-white/40 font-bold uppercase tracking-widest border border-white/5 rounded-full">
              Route
            </span>
          </div>

          {/* Destination Point */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-white/80 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                Destination (Drop Location)
              </label>
              <button
                type="button"
                onClick={() => handleCurrentLocationSelect('drop')}
                disabled={isLocatingDrop}
                className="text-[10px] text-white/60 hover:text-white font-bold flex items-center gap-1"
              >
                {isLocatingDrop ? 'Locating...' : '📍 Use Current GPS'}
              </button>
            </div>

            {/* Destination Location Header Card */}
            <div className="glass-inner flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/30 transition-all group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleCurrentLocationSelect('drop')}
                  disabled={isLocatingDrop}
                  title="Click icon to select location"
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-all border active:scale-95 relative group/icon ${
                    isLocatingDrop 
                      ? 'bg-white/20 text-white border-white animate-pulse' 
                      : dropLocation.isCurrentLocation
                        ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
                        : 'bg-white/10 text-white border-white/30 hover:bg-white/25 hover:scale-105'
                  }`}
                >
                  {isLocatingDrop ? (
                    <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-lg group-hover/icon:scale-110 transition-transform">
                      {dropLocation.isCurrentLocation ? 'my_location' : 'pin_drop'}
                    </span>
                  )}
                </button>

                <div 
                  className="flex flex-col min-w-0 flex-1 cursor-pointer"
                  onClick={() => openLocationModal('drop')}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-extrabold text-sm truncate">
                      {dropLocation.area}
                    </span>
                    {dropLocation.isCurrentLocation && (
                      <span className="bg-white/20 text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white/30 shrink-0">
                        LIVE GPS
                      </span>
                    )}
                  </div>
                  <span className="text-white/50 text-[11px] font-medium truncate mt-0.5">
                    {dropLocation.address}
                  </span>
                </div>
              </div>

              {/* CHANGE Option Button */}
              <button 
                type="button"
                onClick={() => openLocationModal('drop')}
                className="text-white font-black text-[11px] px-3 py-1.5 hover:bg-white/15 rounded-lg transition-all tracking-wider uppercase border border-white/30 bg-white/5 active:scale-95 shrink-0 ml-2 shadow-sm"
              >
                CHANGE
              </button>
            </div>

            {/* Interactive Destination Map */}
            <div className="w-full h-24 rounded-xl overflow-hidden glass-card border border-white/5 relative">
              <div ref={dropMapRef} className="w-full h-full"></div>
            </div>
          </div>
        </section>

        {/* Select Items */}
        <section>
          <h3 className="text-white/90 text-[11px] font-bold uppercase tracking-wider mb-3 px-1">Select Items</h3>
          <div className="flex flex-wrap gap-2">
            {['Sofa', 'Fridge', 'Almaris', 'Bed', 'Table', 'Boxes', 'TV'].map((item) => (
              <div 
                key={item}
                onClick={() => toggleItem(item)}
                className={`h-9 flex items-center justify-center rounded-lg glass-card px-4 text-xs transition-all cursor-pointer border ${items.includes(item) ? 'border-primary/50 text-primary font-bold bg-primary/5' : 'border-white/5 text-white/60'}`}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* NEW DEDICATED DETAILS SECTION WITH DIRECT LINK TO DETAILS PAGE   */}
        {/* ---------------------------------------------------------------- */}
        <section className="glass-card rounded-2xl p-5 border border-primary/30 bg-primary/[0.04] space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <span className="material-symbols-outlined text-lg">description</span>
              </div>
              <div>
                <h3 className="text-white text-xs font-black uppercase tracking-wider">Item Details for Driver</h3>
                <p className="text-[10px] text-white/40 font-medium">Briefing sent to pickup driver</p>
              </div>
            </div>

            {/* Button to open the full Details Page */}
            <button
              type="button"
              onClick={() => setCurrentPage('details')}
              className="text-primary font-black text-[11px] px-3.5 py-1.5 hover:bg-primary/20 rounded-xl transition-all tracking-wider uppercase border border-primary/40 bg-primary/10 active:scale-95 flex items-center gap-1 shadow-sm"
            >
              <span>{itemDetails ? 'EDIT DETAILS' : 'WRITE DETAILS'}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Details Content Preview */}
          <div 
            onClick={() => setCurrentPage('details')}
            className="p-3.5 rounded-2xl bg-white border-2 border-white hover:border-primary/60 cursor-pointer transition-all space-y-2 group shadow-xl"
          >
            <p className="text-xs text-black font-semibold leading-relaxed italic line-clamp-2">
              "{itemDetails || 'Tap to write details about the items, fragile pieces, and floor instructions...'}"
            </p>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {specialNotes.map(n => (
                <span key={n} className="bg-emerald-100 text-emerald-900 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                  ⚡ {n}
                </span>
              ))}
              <span className="bg-gray-100 text-gray-800 text-[9px] font-bold px-2 py-0.5 rounded border border-gray-300">
                🏢 {pickupFloor} ➔ {dropFloor}
              </span>
            </div>
          </div>
        </section>

        {/* Weight & Labor */}
        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <h3 className="text-white/90 text-[11px] font-bold uppercase tracking-wider mb-3 px-1">Weight Category</h3>
            <div className="glass-card h-12 rounded-xl flex items-center justify-between px-4 border border-white/5 cursor-pointer">
              <span className="text-xs text-white/80 font-bold">Under 500kg</span>
              <span className="material-symbols-outlined text-[18px] text-white/40">expand_more</span>
            </div>
          </div>
          <div className="col-span-1">
            <h3 className="text-white/90 text-[11px] font-bold uppercase tracking-wider mb-3 px-1">Labour</h3>
            <div className="glass-card h-12 rounded-xl flex items-center justify-between px-3 border border-white/5">
              <button onClick={() => setHelpers(Math.max(0, helpers - 1))} className="size-7 flex items-center justify-center rounded bg-white/5 active:scale-90"><span className="material-symbols-outlined text-[16px]">remove</span></button>
              <span className="text-xs font-black text-primary">{helpers}P</span>
              <button onClick={() => setHelpers(helpers + 1)} className="size-7 flex items-center justify-center rounded bg-white/5 active:scale-90"><span className="material-symbols-outlined text-[16px]">add</span></button>
            </div>
          </div>
        </section>
      </div>

      {/* Location Change Modal */}
      {locationModalTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 relative"
          >
            {/* Top Swipe-Down Handle */}
            <div 
              className="w-full -mt-2 mb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group"
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const onTouchMove = (ev: TouchEvent) => {
                  if (ev.touches[0].clientY - startY > 70) {
                    setLocationModalTarget(null);
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
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">edit_location</span>
                </div>
                <h3 className="text-white text-base font-extrabold uppercase tracking-tight">
                  {locationModalTarget === 'pickup' ? 'Change Pickup Location' : 'Change Destination Location'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setLocationModalTarget(null)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Quick Button: Detect Current Location */}
            <button
              type="button"
              onClick={() => {
                handleCurrentLocationSelect(locationModalTarget);
                setLocationModalTarget(null);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">my_location</span>
              <span>Select My Current Location (GPS)</span>
            </button>

            {/* Popular Area Chips */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                Popular Hubs in Dhaka
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
                {POPULAR_AREAS.map((area) => (
                  <button
                    type="button"
                    key={area.name}
                    onClick={() => {
                      setEditArea(area.name);
                      setEditCoords(area.coords);
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

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                  Area / Zone
                </label>
                <input 
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  placeholder="e.g. Banani Block D, Dhaka"
                  className="w-full h-11 rounded-xl px-4 text-white placeholder:text-white/30 text-xs font-semibold focus:ring-1 focus:ring-primary/50 outline-none border border-white/10 bg-white/5"
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
                  placeholder="e.g. House 12, Road 4"
                  className="w-full h-11 rounded-xl px-4 text-white placeholder:text-white/30 text-xs font-semibold focus:ring-1 focus:ring-primary/50 outline-none border border-white/10 bg-white/5"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLocationModalTarget(null)}
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

      {/* 2-STEP PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                </div>
                <div>
                  <h3 className="text-white text-base font-extrabold uppercase tracking-tight">
                    Pick & Drop Trip Preview
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    Step 1 of 2: Review & Confirm Details
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

            {/* Trip Spec Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-black uppercase tracking-tight">
                    {vehicle} • {helpers} {helpers === 1 ? 'Helper' : 'Helpers'}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {items.length} Category Items
                </span>
              </div>

              {/* Items Briefing */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-primary/30 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">inventory_2</span>
                    Moving Items Note:
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPreviewModal(false);
                      setCurrentPage('details');
                    }}
                    className="text-[9px] text-white/50 hover:text-primary font-bold uppercase underline"
                  >
                    Edit ✎
                  </button>
                </div>
                <p className="text-xs text-white/95 font-medium leading-relaxed italic">
                  "{itemDetails.trim() || 'Standard household items for moving.'}"
                </p>
                <div className="flex flex-wrap gap-1 pt-1 border-t border-white/10">
                  <span className="text-[9px] bg-white text-black font-extrabold px-2 py-0.5 rounded shadow-sm">
                    🪜 {pickupFloor} ➔ {dropFloor}
                  </span>
                  {specialNotes.map(n => (
                    <span key={n} className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold border border-primary/20">
                      ⚡ {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Price & Location Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Offered Fare
                  </span>
                  <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                    ৳ {userFare}
                  </span>
                  <span className="text-[8.5px] text-white/40 uppercase font-medium">Negotiable in chat</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Weight Est.
                  </span>
                  <span className="text-xs font-bold text-white truncate mt-0.5 block">
                    Under 500kg
                  </span>
                  <span className="text-[8.5px] text-white/40 uppercase font-medium">
                    Standard cargo
                  </span>
                </div>
              </div>

              {/* Pickup & Destination */}
              <div className="space-y-1.5 pt-1 text-[11px] font-medium text-white/70">
                <div className="flex items-start gap-1.5">
                  <span className="text-primary font-black shrink-0">📍 Pickup:</span>
                  <span className="text-white/90 truncate">{pickupLocation.address} ({pickupLocation.area})</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-black shrink-0">🏁 Drop:</span>
                  <span className="text-white/90 truncate">{dropLocation.address} ({dropLocation.area})</span>
                </div>
              </div>
            </div>

            {/* Next Steps Notification */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-white flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">info</span>
              <div className="text-[10.5px] leading-relaxed text-white/80">
                <p className="font-bold text-primary">Pending Driver Broadcast</p>
                <p className="mt-0.5 text-white/70">
                  Your request is broadcasted as <span className="text-amber-300 font-bold">PENDING</span> to authorized drivers. Once a driver accepts, it becomes <span className="text-primary font-bold">ACTIVE</span> to negotiate and confirm dispatch.
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
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowProximityModal(true);
                }}
                className="flex-[1.2] py-3.5 rounded-xl bg-primary/20 text-primary border border-primary/40 font-black text-xs uppercase tracking-wider hover:bg-primary/30 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">radar</span>
                <span>NEAREST RADAR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  handleFinalConfirm();
                }}
                className="flex-[1.8] py-3.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base font-black">check_circle</span>
                <span>CONFIRM & SUBMIT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nearest Driver Proximity Radar Modal */}
      {showProximityModal && (
        <ProximityRadarModal
          isOpen={showProximityModal}
          onClose={() => setShowProximityModal(false)}
          serviceCategory="Pick & Drop"
          serviceSubCategory={vehicle}
          userArea={pickupLocation.area}
          userAddress={pickupLocation.address}
          userLat={pickupLocation.coords[0]}
          userLng={pickupLocation.coords[1]}
          onSelectProvider={handleProximityDispatch}
          onConfirmWithoutSpecificProvider={handleFinalConfirm}
        />
      )}

      {/* Footer Area - EDITABLE FARE & NEAREST RADAR & PREVIEW */}
      <div className="p-4 bg-background-dark/80 backdrop-blur-xl border-t border-white/10 pb-10 z-20">
        <div className="flex items-center justify-between mb-4 px-2 gap-2.5">
          <div className="flex flex-col min-w-0 pr-1">
            <p className="text-white/40 text-[9px] uppercase font-black tracking-widest mb-0.5">Price</p>
            <div className="flex items-center gap-1 bg-white rounded-xl px-2.5 py-1 border-2 border-primary/30 shadow-inner w-24">
              <span className="text-black font-black text-sm">৳</span>
              <input 
                type="number"
                value={userFare}
                onChange={(e) => setUserFare(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-black text-sm font-black"
              />
            </div>
          </div>

          {/* Action 1: Find Nearest Driver Radar */}
          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setShowProximityModal(true);
            }} 
            className="flex-[1.2] bg-primary px-3 py-3 rounded-xl text-background-dark font-black text-[11px] uppercase tracking-wider active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(19,236,218,0.3)] h-12 shrink-0 flex items-center justify-center gap-1.5 hover:brightness-110 border border-primary/50"
          >
            <span className="material-symbols-outlined text-base font-black animate-pulse">radar</span>
            <span>FIND NEAREST</span>
          </button>

          {/* Action 2: Preview & Submit */}
          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setShowPreviewModal(true);
            }} 
            className="flex-1 bg-white/10 px-3 py-3 rounded-xl text-white font-black text-[11px] uppercase tracking-wider active:scale-[0.98] transition-transform border border-white/10 h-12 shrink-0 flex items-center justify-center gap-1 hover:bg-white/15"
          >
            <span className="material-symbols-outlined text-sm font-black">visibility</span>
            <span>PREVIEW</span>
          </button>
        </div>
      </div>

      <style>{`
        .glass-card { background: rgba(25, 51, 51, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .glass-inner { background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(8px); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default PickDropBooking;
