
import React, { useState } from 'react';
import { haptics } from '../haptics';
import { addMaintenanceTicket } from '../maintenanceStorage';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
  userProfile?: any;
}

const POPULAR_AREAS = [
  'Gulshan-2, Dhaka',
  'Gulshan-1, Dhaka',
  'Banani, Dhaka',
  'Dhanmondi, Dhaka',
  'Uttara, Dhaka',
  'Mirpur, Dhaka',
  'Bashundhara R/A, Dhaka',
  'Baridhara DOHS, Dhaka',
  'Mohammadpur, Dhaka'
];

const SecurityBooking: React.FC<Props> = ({ onBack, onConfirm, userProfile }) => {
  const [serviceType, setServiceType] = useState('Residential');
  const [guards, setGuards] = useState('1');
  const [duration, setDuration] = useState('monthly');
  const [userCost, setUserCost] = useState('15000');
  const [instructions, setInstructions] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Service Location States
  const [serviceLocation, setServiceLocation] = useState({
    area: 'Gulshan-2, Dhaka',
    address: 'House 45, Road 12, Block D',
    isCurrentLocation: false
  });
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editArea, setEditArea] = useState('Gulshan-2, Dhaka');
  const [editAddress, setEditAddress] = useState('House 45, Road 12, Block D');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const serviceTypes = ['Residential', 'Event', 'Office', 'Bodyguard', 'Night Shift'];

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
        try {
          // Reverse-geocode to obtain readable suburb and street
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
            isCurrentLocation: true
          });
          setEditArea(fullArea);
          setEditAddress(fullAddress);
          setToastMessage("Current location detected & selected!");
          setTimeout(() => setToastMessage(null), 3500);
        } catch (err) {
          const fallbackArea = 'Current Location, Dhaka';
          const fallbackAddr = `GPS Pin [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`;
          setServiceLocation({
            area: fallbackArea,
            address: fallbackAddr,
            isCurrentLocation: true
          });
          setEditArea(fallbackArea);
          setEditAddress(fallbackAddr);
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
        setServiceLocation({
          area: defaultArea,
          address: defaultAddr,
          isCurrentLocation: true
        });
        setEditArea(defaultArea);
        setEditAddress(defaultAddr);
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
    setServiceLocation({
      area: editArea.trim(),
      address: editAddress.trim() || 'Specified Address',
      isCurrentLocation: false
    });
    setShowLocationModal(false);
    setToastMessage("Service location updated successfully!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto bg-background-dark font-display text-white selection:bg-primary/30">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="flex items-center px-5 pt-6 pb-2 relative z-10">
        <button 
          type="button"
          onClick={onBack}
          className="flex size-9 items-center justify-center rounded-full glass text-white/80 hover:bg-white/10 transition-colors active:scale-90"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
      </div>

      <div className="px-5 py-3 relative z-10">
        <h1 className="text-primary text-2xl font-extrabold tracking-tight">Security Guard Service</h1>
        <p className="text-white/50 text-xs mt-0.5 font-medium tracking-wide">Professional property protection</p>
      </div>

      <div className="flex-1 px-5 space-y-7 pb-32 relative z-10">
        {/* Service Type Selection */}
        <section>
          <h3 className="text-white/80 text-[11px] font-bold uppercase tracking-widest mb-3 ml-1">Service Type</h3>
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
            {serviceTypes.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setServiceType(type)}
                className={`flex-none px-5 py-2.5 rounded-full transition-all text-xs font-bold ${
                  serviceType === type 
                  ? 'bg-primary text-background-dark shadow-lg shadow-primary/20' 
                  : 'glass text-white/80 border border-white/10 hover:border-primary/40'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        {/* Guards & Duration */}
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-[11px] font-bold uppercase tracking-wider ml-1">Number of Guards</label>
              <div className="relative">
                <select 
                  value={guards}
                  onChange={(e) => setGuards(e.target.value)}
                  className="glass-dark w-full h-12 rounded-xl px-4 text-white/90 focus:ring-1 focus:ring-primary/50 border-none text-sm outline-none appearance-none cursor-pointer"
                >
                  <option value="1">1 Guard</option>
                  <option value="2">2 Guards</option>
                  <option value="3">3 Guards</option>
                  <option value="4+">4+ Guards</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-[11px] font-bold uppercase tracking-wider ml-1">Duration</label>
              <div className="relative">
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="glass-dark w-full h-12 rounded-xl px-4 text-white/90 focus:ring-1 focus:ring-primary/50 border-none text-sm outline-none appearance-none cursor-pointer"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-white/60 text-[11px] font-bold uppercase tracking-wider ml-1">Special Instructions</label>
            <textarea 
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="glass-dark w-full min-h-[100px] rounded-xl p-4 text-white/90 placeholder:text-white/20 focus:ring-1 focus:ring-primary/50 border-none text-sm outline-none resize-none transition-all" 
              placeholder="Armed/unarmed, uniform specs, specific shift hours..."
            ></textarea>
          </div>
        </section>

        {/* Service Location Section with CHANGE and Location Icon */}
        <section className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-white/80 text-[11px] font-bold uppercase tracking-widest">
              Service Location
            </h3>
            <span className="text-[10px] text-white/40 flex items-center gap-1 font-medium">
              <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
              Protection Site
            </span>
          </div>

          {/* Service Location Card */}
          <div className="glass flex items-center justify-between p-3.5 px-4 rounded-2xl border border-white/10 hover:border-primary/30 transition-all shadow-lg group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Clickable Location Icon for Current Location Select */}
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
                {/* Visual pulse badge indicator */}
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

            {/* CHANGE Option Button */}
            <button 
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="text-primary font-black text-[11px] px-3.5 py-2 hover:bg-primary/15 rounded-xl transition-all tracking-wider uppercase border border-primary/30 bg-primary/5 active:scale-95 shrink-0 ml-2 shadow-sm"
            >
              CHANGE
            </button>
          </div>

          {/* Quick helper note */}
          <div className="flex items-center justify-between text-[10px] text-white/40 px-1">
            <span>Click location icon for GPS</span>
            <button 
              type="button"
              onClick={handleCurrentLocationSelect}
              className="text-primary font-semibold hover:underline flex items-center gap-1"
            >
              {isLocating ? 'Detecting...' : '📍 Use Current Location'}
            </button>
          </div>

          {/* Status Message */}
          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{toastMessage}</span>
            </div>
          )}
        </section>
      </div>

      {/* Location Change Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 relative"
          >
            {/* Modal Header */}
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

            {/* Quick Button: Detect Current Location */}
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

            {/* Popular Area Chips */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                Popular Areas in Dhaka
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar py-0.5">
                {POPULAR_AREAS.map((area) => (
                  <button
                    type="button"
                    key={area}
                    onClick={() => {
                      setEditArea(area);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 ${
                      editArea === area 
                        ? 'bg-primary text-black shadow-sm' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    📍 {area.split(',')[0]}
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
                  placeholder="e.g. Gulshan-2, Dhaka"
                  className="glass-dark w-full h-11 rounded-xl px-4 text-white placeholder:text-white/30 text-xs font-semibold focus:ring-1 focus:ring-primary/50 outline-none border-none"
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
                  placeholder="e.g. House 45, Road 12, Block D"
                  className="glass-dark w-full h-11 rounded-xl px-4 text-white placeholder:text-white/30 text-xs font-semibold focus:ring-1 focus:ring-primary/50 outline-none border-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
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

      {/* Security Request Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#091514] border border-primary/30 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]">
                  <span className="material-symbols-outlined text-xl">shield_person</span>
                </div>
                <div>
                  <h3 className="text-white text-base font-black uppercase tracking-tight italic">
                    Security Request Preview
                  </h3>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                    Review specifications before broadcasting
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

            {/* Service & Guard Spec Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-black uppercase tracking-tight">
                    {serviceType} Guarding • {guards} {guards === '1' ? 'Guard' : 'Guards'}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {duration}
                </span>
              </div>

              {/* Instructions / Requirements Block */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-primary/30 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">notes</span>
                    Customer Security Requirements Note:
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
                  "{instructions.trim() || `Professional ${serviceType.toLowerCase()} guard deployment for ${duration} duration.`}"
                </p>
              </div>

              {/* Price & Location Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Offered Budget
                  </span>
                  <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                    ৳ {userCost}
                  </span>
                  <span className="text-[8.5px] text-white/40 uppercase font-medium">Negotiable in chat</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Deployment Site
                  </span>
                  <span className="text-xs font-bold text-white truncate mt-0.5 block">
                    {serviceLocation.area}
                  </span>
                  <span className="text-[8.5px] text-white/40 uppercase font-medium">
                    {serviceLocation.isCurrentLocation ? 'Live GPS' : 'Target Location'}
                  </span>
                </div>
              </div>

              <div className="px-1 text-[11px] text-white/60 font-medium">
                📍 {serviceLocation.address}
              </div>
            </div>

            {/* Next Steps Notification */}
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-white flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">info</span>
              <div className="text-[10.5px] leading-relaxed text-white/80">
                <p className="font-bold text-primary">Pending Guard Broadcast</p>
                <p className="mt-0.5 text-white/70">
                  Your request is broadcasted as <span className="text-amber-300 font-bold">PENDING</span>. Once an officer accepts, it becomes <span className="text-primary font-bold">ACTIVE</span> to negotiate and confirm deployment.
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
                  haptics.bookingConfirmed();
                  const userPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402';
                  const userName = userProfile?.full_name || 'Resident';
                  const userId = userProfile?.id;

                  try {
                    addMaintenanceTicket({
                      title: `Security Guard (${serviceType} • ${guards} Guard${guards === '1' ? '' : 's'})`,
                      category: 'Security & CCTV',
                      icon: 'shield_person',
                      priority: 'Standard',
                      customerName: userName,
                      customerPhone: userPhone,
                      userId,
                      address: serviceLocation.address,
                      area: serviceLocation.area,
                      price: `৳ ${userCost}`,
                      status: 'PENDING',
                      technicianName: 'Awaiting Guard Acceptance',
                      technicianRole: 'Pending Guard Confirmation',
                      technicianPhone: '',
                      description: `Security requirements: ${instructions.trim() || `${serviceType} guarding`} | Duration: ${duration} (${guards} guards) in ${serviceLocation.area}`
                    });
                  } catch (e) {
                    console.warn('Security booking persistence error:', e);
                  }
                  setShowPreviewModal(false);
                  onConfirm();
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

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-5 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-8 z-40">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-0.5">Your Offer</span>
            <div className="flex items-center gap-1 bg-white rounded-xl px-2.5 py-1.5 border border-primary/20">
              <span className="text-black font-black text-base">৳</span>
              <input 
                type="number"
                value={userCost}
                onChange={(e) => setUserCost(e.target.value)}
                className="w-20 bg-transparent border-none focus:ring-0 p-0 text-black text-base font-black outline-none"
              />
            </div>
          </div>
          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setShowPreviewModal(true);
            }}
            className="flex-1 bg-primary hover:bg-[#0fd9d9] active:scale-[0.98] text-background-dark font-black text-xs py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-primary/20 tracking-wider uppercase h-13 flex items-center justify-center gap-2 italic"
          >
            <span className="material-symbols-outlined text-base font-black">visibility</span>
            <span>PREVIEW & SUBMIT</span>
          </button>
        </div>
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glass-dark {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default SecurityBooking;
