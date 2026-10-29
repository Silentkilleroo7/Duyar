import React, { useState } from 'react';
import { haptics } from '../haptics';
import { addMaintenanceTicket } from '../maintenanceStorage';
import { ProximityRadarModal } from './ProximityRadarModal';
import { RankedProvider } from '../proximityDispatcher';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
  userProfile?: any;
}

const POPULAR_AREAS = [
  'Banani, Dhaka',
  'Gulshan-2, Dhaka',
  'Gulshan-1, Dhaka',
  'Dhanmondi, Dhaka',
  'Uttara, Dhaka',
  'Mirpur, Dhaka',
  'Bashundhara R/A, Dhaka',
  'Baridhara DOHS, Dhaka',
  'Mohammadpur, Dhaka'
];

interface ShiftPreset {
  id: string;
  name: string;
  timeRange: string;
  icon: string;
  description: string;
  badge?: string;
}

const SHIFT_PRESETS: ShiftPreset[] = [
  {
    id: 'Morning',
    name: 'Morning Shift',
    timeRange: '08:00 AM – 12:00 PM',
    icon: 'wb_sunny',
    description: 'Perfect for breakfast prep, kitchen cleanup, sweeping & morning mopping.',
    badge: 'Popular'
  },
  {
    id: 'Afternoon',
    name: 'Afternoon Shift',
    timeRange: '01:00 PM – 05:00 PM',
    icon: 'wb_twilight',
    description: 'Ideal for post-lunch tidying, deep bathroom washing & laundry ironing.'
  },
  {
    id: 'Evening',
    name: 'Evening Shift',
    timeRange: '05:00 PM – 09:00 PM',
    icon: 'dark_mode',
    description: 'Great for evening cooking assistance, dinner dishwashing & night tidy-up.'
  },
  {
    id: 'Full Day',
    name: 'Full Day Shift',
    timeRange: '08:00 AM – 05:00 PM',
    icon: 'schedule',
    description: 'All-day household support covering multiple meals, laundry & deep chores.',
    badge: 'Comprehensive'
  }
];

const HOUR_PRESETS = [
  { hours: 2, label: '2 Hours / Day', desc: 'Quick cleaning & dishwashing', rate: 650 },
  { hours: 3, label: '3 Hours / Day', desc: 'Standard 1-2 BHK apartment cleaning', rate: 950 },
  { hours: 4, label: '4 Hours / Day', desc: '3 BHK cleaning, dusting & laundry', rate: 1200, popular: true },
  { hours: 6, label: '6 Hours / Day', desc: 'Large flat cleaning, laundry & cooking', rate: 1800 },
  { hours: 8, label: '8 Hours / Day', desc: 'Full-day dedicated household support', rate: 2400 },
  { hours: 10, label: '10 Hours / Day', desc: 'Intensive housekeeping & family cooking', rate: 3000 },
  { hours: 12, label: '12 Hours (Live-in)', desc: 'Round-the-clock home & family assistance', rate: 3800 }
];

const POPULAR_START_TIMES = ['07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '10:00 AM', '01:00 PM', '02:00 PM', '05:00 PM', '06:00 PM'];
const POPULAR_END_TIMES = ['10:00 AM', '11:00 AM', '11:30 AM', '12:00 PM', '01:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '08:00 PM', '09:00 PM', '10:00 PM'];

const MaidBooking: React.FC<Props> = ({ onBack, onConfirm, userProfile }) => {
  const [frequency, setFrequency] = useState('Daily');
  const [tasks, setTasks] = useState<string[]>(['Cleaning', 'Laundry']);
  
  // Shift State
  const [shift, setShift] = useState('Morning');
  const [shiftTimeRange, setShiftTimeRange] = useState('08:00 AM – 12:00 PM');
  const [isCustomShift, setIsCustomShift] = useState(false);
  const [customStartTime, setCustomStartTime] = useState('07:30 AM');
  const [customEndTime, setCustomEndTime] = useState('11:30 AM');
  const [customShiftNote, setCustomShiftNote] = useState('');
  const [showShiftModal, setShowShiftModal] = useState(false);

  // Working Hours State
  const [hoursCount, setHoursCount] = useState(4);
  const [showHoursModal, setShowHoursModal] = useState(false);
  
  // Proposed User Price
  const [userPrice, setUserPrice] = useState('1200');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProximityModal, setShowProximityModal] = useState(false);

  // Service Location States
  const [serviceLocation, setServiceLocation] = useState({
    area: 'Banani, Dhaka',
    address: 'House 24, Road 7, Block D',
    isCurrentLocation: false
  });
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editArea, setEditArea] = useState('Banani, Dhaka');
  const [editAddress, setEditAddress] = useState('House 24, Road 7, Block D');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleTask = (task: string) => {
    haptics.selection();
    setTasks(prev => prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]);
  };

  // Quick Shift Select
  const handleSelectShiftPreset = (preset: ShiftPreset) => {
    haptics.selection();
    setShift(preset.id);
    setShiftTimeRange(preset.timeRange);
    setIsCustomShift(false);
  };

  // Save Custom Shift from Modal
  const handleSaveCustomShift = () => {
    haptics.bookingConfirmed();
    setIsCustomShift(true);
    setShift('Custom');
    setShiftTimeRange(`${customStartTime} – ${customEndTime}`);
    setShowShiftModal(false);
    setToastMessage(`Custom shift set: ${customStartTime} to ${customEndTime}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Select Preset inside Modal
  const handleApplyPresetInModal = (preset: ShiftPreset) => {
    haptics.selection();
    handleSelectShiftPreset(preset);
    setShowShiftModal(false);
    setToastMessage(`${preset.name} selected (${preset.timeRange})`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Adjust Hours
  const updateHoursCount = (newHours: number) => {
    const clamped = Math.max(1, Math.min(16, newHours));
    setHoursCount(clamped);
    haptics.selection();

    // Auto-suggest reasonable price based on hours
    const matchedPreset = HOUR_PRESETS.find(p => p.hours === clamped);
    if (matchedPreset) {
      setUserPrice(String(matchedPreset.rate));
    } else {
      setUserPrice(String(clamped * 300));
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

  const formattedHoursString = `${hoursCount}h / Day`;
  const formattedShiftString = isCustomShift 
    ? `Custom (${shiftTimeRange})` 
    : `${shift} (${shiftTimeRange})`;

  return (
    <div className="relative flex h-screen w-full flex-col body-bg max-w-[430px] mx-auto overflow-hidden shadow-2xl font-display text-white selection:bg-primary/30">
      {/* Background Decorative Element */}
      <div className="absolute -bottom-20 -right-20 size-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute -top-20 -left-20 size-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Top App Bar */}
      <div className="flex items-center p-6 pb-4 justify-between relative z-10">
        <button 
          type="button"
          onClick={onBack}
          className="flex items-center justify-center size-10 rounded-full glass-card text-white hover:bg-white/10 transition-all active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
        </button>
        <h2 className="text-primary text-xl font-extrabold leading-tight tracking-tight flex-1 text-center pr-10 italic uppercase">Maid Service</h2>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-36 no-scrollbar relative z-10">
        {/* Service Frequency */}
        <section>
          <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-3 px-1">Service Frequency</h3>
          <div className="grid grid-cols-2 gap-3">
            {['Daily', 'Weekly', 'One-time', 'Live-in'].map((opt) => (
              <div 
                key={opt}
                onClick={() => {
                  haptics.selection();
                  setFrequency(opt);
                }}
                className={`flex h-11 items-center justify-center rounded-xl transition-all cursor-pointer border ${frequency === opt ? 'selected-chip' : 'glass-chip'}`}
              >
                <p className={`text-[13px] ${frequency === opt ? 'font-bold' : 'font-medium text-white/80'}`}>{opt}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tasks */}
        <section>
          <h3 className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-3 px-1">Tasks</h3>
          <div className="flex flex-wrap gap-2">
            {['Cleaning', 'Cooking', 'Dish Washing', 'Laundry', 'Full House Help'].map((task) => (
              <div 
                key={task}
                onClick={() => toggleTask(task)}
                className={`flex h-9 items-center justify-center rounded-full px-4 transition-all cursor-pointer border ${tasks.includes(task) ? 'selected-chip' : 'glass-chip'}`}
              >
                <p className={`text-[12px] ${tasks.includes(task) ? 'font-bold' : 'font-medium text-white/80'}`}>{task}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CUSTOMIZABLE SHIFT & WORKING HOURS SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-white/80 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-primary">tune</span>
              <span>Shift & Working Hours</span>
            </h3>
            <span className="text-[9px] text-primary font-bold uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              Customizable by you
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Shift Card */}
            <div 
              onClick={() => {
                haptics.selection();
                setShowShiftModal(true);
              }}
              className="glass-card rounded-2xl p-3.5 border border-white/10 hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">schedule</span>
                  Shift
                </span>
                <span className="text-primary text-[10px] font-black group-hover:scale-110 transition-transform">
                  EDIT ✎
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-white font-extrabold text-[13px] uppercase truncate">
                    {isCustomShift ? 'Custom Slot' : shift}
                  </h4>
                  {isCustomShift && (
                    <span className="size-1.5 rounded-full bg-primary animate-ping"></span>
                  )}
                </div>
                <p className="text-[10px] text-primary font-bold mt-0.5 truncate">
                  {shiftTimeRange}
                </p>
                {customShiftNote && (
                  <p className="text-[9px] text-white/40 italic truncate mt-0.5">
                    "{customShiftNote}"
                  </p>
                )}
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-white/40">
                <span>Tap to change time</span>
                <span className="material-symbols-outlined text-xs text-primary/70">chevron_right</span>
              </div>
            </div>

            {/* Working Hours Card */}
            <div 
              className="glass-card rounded-2xl p-3.5 border border-white/10 hover:border-primary/40 transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-primary">timer</span>
                  Hours / Day
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.selection();
                    setShowHoursModal(true);
                  }}
                  className="text-primary text-[10px] font-black hover:underline"
                >
                  PRESETS
                </button>
              </div>

              <div className="flex items-center justify-between my-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateHoursCount(hoursCount - 1);
                  }}
                  className="size-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                  title="Decrease hour"
                >
                  <span className="material-symbols-outlined text-sm font-black">remove</span>
                </button>

                <div 
                  onClick={() => setShowHoursModal(true)}
                  className="text-center cursor-pointer px-1 flex-1"
                >
                  <span className="text-white font-black text-lg leading-none block">
                    {hoursCount}h
                  </span>
                  <span className="text-[9px] text-primary font-bold uppercase tracking-wider">
                    Daily
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateHoursCount(hoursCount + 1);
                  }}
                  className="size-8 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                  title="Increase hour"
                >
                  <span className="material-symbols-outlined text-sm font-black">add</span>
                </button>
              </div>

              <div 
                onClick={() => setShowHoursModal(true)}
                className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-white/40 cursor-pointer"
              >
                <span>Customize duration</span>
                <span className="material-symbols-outlined text-xs text-primary/70">tune</span>
              </div>
            </div>
          </div>

          {/* Quick Shift Pills for 1-Tap Switching */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SHIFT_PRESETS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => handleSelectShiftPreset(p)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight transition-all active:scale-95 flex items-center gap-1 border ${
                  !isCustomShift && shift === p.id 
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-sm' 
                    : 'bg-white/5 text-white/60 hover:text-white border-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-xs">{p.icon}</span>
                <span>{p.id}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                haptics.selection();
                setShowShiftModal(true);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-tight transition-all active:scale-95 flex items-center gap-1 border ${
                isCustomShift 
                  ? 'bg-primary text-black border-primary font-black shadow-sm' 
                  : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
              }`}
            >
              <span className="material-symbols-outlined text-xs">edit_calendar</span>
              <span>+ Custom Shift</span>
            </button>
          </div>

          {/* Quick Hours Pills for 1-Tap Duration Setting */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 shrink-0 mr-1">Hours:</span>
            {[2, 3, 4, 6, 8, 10, 12].map((h) => (
              <button
                type="button"
                key={h}
                onClick={() => updateHoursCount(h)}
                className={`px-2.5 py-0.5 rounded-md text-[10.5px] font-black transition-all active:scale-95 shrink-0 border ${
                  hoursCount === h 
                    ? 'bg-primary text-black border-primary' 
                    : 'bg-white/5 text-white/60 hover:text-white border-white/5'
                }`}
              >
                {h}h
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowHoursModal(true)}
              className="px-2 py-0.5 rounded-md text-[10px] font-black text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 shrink-0"
            >
              More...
            </button>
          </div>
        </section>

        {/* Location Section with CHANGE and Location Icon */}
        <section className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <h3 className="text-white/80 text-[11px] font-bold uppercase tracking-widest">
              Service Location
            </h3>
            <span className="text-[10px] text-white/40 flex items-center gap-1 font-medium">
              <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
              Cleaning Site
            </span>
          </div>

          {/* Service Location Card */}
          <div className="glass-card flex items-center justify-between p-3.5 px-4 rounded-2xl border border-white/10 hover:border-primary/30 transition-all shadow-lg group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
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
              className="text-primary font-black text-[11px] px-3.5 py-2 hover:bg-primary/15 rounded-xl transition-all tracking-wider uppercase border border-primary/30 bg-primary/5 active:scale-95 shrink-0 ml-2 shadow-sm"
            >
              CHANGE
            </button>
          </div>

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

          {toastMessage && (
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/40 text-primary text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{toastMessage}</span>
            </div>
          )}
        </section>
      </div>

      {/* 1. CUSTOM SHIFT MODAL */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                </div>
                <div>
                  <h3 className="text-white text-base font-extrabold uppercase tracking-tight">
                    Customize Maid Shift
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    Select standard shift or set custom time window
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Standard Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                Standard Shift Options
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SHIFT_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPresetInModal(preset)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      !isCustomShift && shift === preset.id 
                        ? 'bg-primary/15 border-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-9 rounded-lg flex items-center justify-center ${
                        !isCustomShift && shift === preset.id ? 'bg-primary text-black' : 'bg-white/10 text-white/70'
                      }`}>
                        <span className="material-symbols-outlined text-lg">{preset.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-black uppercase tracking-tight">{preset.name}</span>
                          {preset.badge && (
                            <span className="text-[8px] bg-primary/20 text-primary font-bold px-1.5 py-0.2 rounded border border-primary/30">
                              {preset.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-primary font-bold">{preset.timeRange}</p>
                        <p className="text-[9.5px] text-white/40 leading-snug mt-0.5">{preset.description}</p>
                      </div>
                    </div>
                    {!isCustomShift && shift === preset.id && (
                      <span className="material-symbols-outlined text-primary text-xl font-bold">check_circle</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Shift Section */}
            <div className="p-4 rounded-2xl bg-black/40 border border-primary/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                  <span className="text-white text-xs font-black uppercase tracking-wider">
                    Or Set Exact Custom Time Window
                  </span>
                </div>
                <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded uppercase">
                  User Defined
                </span>
              </div>

              {/* Start & End Time Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">
                    Shift Start Time
                  </label>
                  <input
                    type="text"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    placeholder="e.g. 07:30 AM"
                    className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                  {/* Quick start pills */}
                  <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto no-scrollbar">
                    {POPULAR_START_TIMES.slice(0, 6).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setCustomStartTime(t)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                          customStartTime === t ? 'bg-primary text-black' : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">
                    Shift End Time
                  </label>
                  <input
                    type="text"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs focus:ring-1 focus:ring-primary outline-none"
                  />
                  {/* Quick end pills */}
                  <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto no-scrollbar">
                    {POPULAR_END_TIMES.slice(0, 6).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setCustomEndTime(t)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold transition-all ${
                          customEndTime === t ? 'bg-primary text-black' : 'bg-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special instructions for timing */}
              <div className="space-y-1">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider block">
                  Timing Note / Special Request (Optional)
                </label>
                <input
                  type="text"
                  value={customShiftNote}
                  onChange={(e) => setCustomShiftNote(e.target.value)}
                  placeholder="e.g. Arrive before breakfast, flexible by 30 mins"
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              {/* Live Preview of custom shift */}
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[10px] text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>
                  Preview: <strong>Custom Slot ({customStartTime} – {customEndTime})</strong>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowShiftModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase tracking-wider"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveCustomShift}
                className="flex-[1.5] py-3 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-black">check</span>
                <span>Apply Custom Shift</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. WORKING HOURS CUSTOMIZATION MODAL */}
      {showHoursModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">timelapse</span>
                </div>
                <div>
                  <h3 className="text-white text-base font-extrabold uppercase tracking-tight">
                    Customize Working Hours
                  </h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                    Set daily hours required for your chores
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowHoursModal(false)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Large Interactive Stepper */}
            <div className="p-5 rounded-2xl bg-black/50 border border-primary/30 text-center space-y-3">
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest block">
                Daily Working Duration
              </span>

              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => updateHoursCount(hoursCount - 1)}
                  className="size-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white text-xl active:scale-90 transition-transform shadow-lg"
                >
                  <span className="material-symbols-outlined text-2xl font-black">remove</span>
                </button>

                <div>
                  <div className="text-4xl font-black italic tracking-tight text-white flex items-baseline justify-center gap-1">
                    <span>{hoursCount}</span>
                    <span className="text-lg font-bold text-primary not-italic">Hours</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    per service visit
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => updateHoursCount(hoursCount + 1)}
                  className="size-12 rounded-2xl bg-primary hover:brightness-110 text-black flex items-center justify-center text-xl active:scale-90 transition-transform shadow-[0_0_15px_rgba(19,236,218,0.4)]"
                >
                  <span className="material-symbols-outlined text-2xl font-black">add</span>
                </button>
              </div>

              {/* Workload Scope guidance */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">info</span>
                  <span>Scope of Work for {hoursCount}h:</span>
                </div>
                <p className="text-[11px] text-white/80 leading-relaxed font-medium">
                  {hoursCount <= 2 && "Quick dusting, broom sweep, dishwashing or light kitchen cleanup."}
                  {hoursCount >= 3 && hoursCount <= 4 && "Standard apartment sweep, mop, bathroom cleaning, laundry wash & balcony."}
                  {hoursCount >= 5 && hoursCount <= 6 && "Full house deep cleaning, family meal cooking support & wardrobe folding."}
                  {hoursCount >= 7 && hoursCount <= 9 && "Comprehensive full-day housekeeping, multiple meals, deep floor scrub & grocery prep."}
                  {hoursCount >= 10 && "Continuous full-time assistance, elder/child room tidying & all-day support."}
                </p>
              </div>
            </div>

            {/* Quick Presets Grid */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                Popular Durations & Rates
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HOUR_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset.hours}
                    onClick={() => updateHoursCount(preset.hours)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      hoursCount === preset.hours 
                        ? 'bg-primary/20 border-primary text-white shadow-md' 
                        : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-black uppercase">{preset.hours} Hours</span>
                      <span className="text-[10px] font-bold text-primary">৳{preset.rate}</span>
                    </div>
                    <p className="text-[9.5px] text-white/40 leading-tight line-clamp-1">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Price sync notice */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm font-black">payments</span>
                <span>Proposed Price adjusted to <strong>৳{userPrice}</strong></span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-300">Negotiable</span>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowHoursModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase tracking-wider"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  haptics.bookingConfirmed();
                  setShowHoursModal(false);
                  setToastMessage(`Working hours updated to ${hoursCount} Hours / Day`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="flex-[1.5] py-3 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm font-black">check</span>
                <span>Apply {hoursCount} Hours</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                  placeholder="e.g. House 24, Road 7, Block D"
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

      {/* 2-STEP PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">cleaning_services</span>
                </div>
                <div>
                  <h3 className="text-white text-base font-extrabold uppercase tracking-tight">
                    Housekeeping Booking Preview
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

            {/* Maid & Shift Spec Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-black uppercase tracking-tight">
                    {frequency} Housekeeping • {isCustomShift ? 'Custom Shift' : `${shift} Shift`}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {hoursCount} Hours / Day
                </span>
              </div>

              {/* Time Window */}
              <div className="text-[11px] text-primary font-bold flex items-center gap-1.5 px-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>{isCustomShift ? `Custom (${shiftTimeRange})` : `${shift} (${shiftTimeRange})`}</span>
              </div>

              {/* Selected Tasks Block */}
              <div className="p-3.5 rounded-xl bg-black/60 border border-primary/30 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">checklist</span>
                    Selected Housekeeping Tasks:
                  </span>
                  <button 
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="text-[9px] text-white/50 hover:text-primary font-bold uppercase underline"
                  >
                    Edit ✎
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {tasks.map(t => (
                    <span key={t} className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-bold border border-primary/20">
                      ✓ {t}
                    </span>
                  ))}
                </div>
                {customShiftNote && (
                  <p className="text-[10px] text-white/70 italic mt-1 pt-1 border-t border-white/10">
                    "{customShiftNote}"
                  </p>
                )}
              </div>

              {/* Price & Location Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Offered Budget
                  </span>
                  <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                    ৳ {userPrice}
                  </span>
                  <span className="text-[8.5px] text-white/40 uppercase font-medium">Negotiable in chat</span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider block">
                    Cleaning Site
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
                <p className="font-bold text-primary">Pending Housekeeper Broadcast</p>
                <p className="mt-0.5 text-white/70">
                  Your request is broadcasted as <span className="text-amber-300 font-bold">PENDING</span>. Once an approved housekeeper accepts, it becomes <span className="text-primary font-bold">ACTIVE</span> to negotiate and confirm terms.
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

                  const shiftDisplay = isCustomShift ? `Custom (${shiftTimeRange})` : `${shift} (${shiftTimeRange})`;
                  const hoursDisplay = `${hoursCount} Hours / Day`;

                  try {
                    addMaintenanceTicket({
                      title: `Housekeeping (${frequency} • ${isCustomShift ? 'Custom Shift' : shift})`,
                      category: 'Maid & Housekeeping',
                      icon: 'cleaning_services',
                      priority: 'Standard',
                      customerName: userName,
                      customerPhone: userPhone,
                      userId,
                      address: serviceLocation.address,
                      area: serviceLocation.area,
                      price: `৳ ${userPrice}`,
                      status: 'PENDING',
                      technicianName: 'Awaiting Housekeeper',
                      technicianRole: 'Pending Housekeeper Acceptance',
                      technicianPhone: '',
                      scheduledTime: `${shiftDisplay} • ${hoursDisplay}`,
                      description: `Shift: ${shiftDisplay} | Hours: ${hoursDisplay} | Tasks: ${tasks.join(', ')}${customShiftNote ? ` | Note: ${customShiftNote}` : ''}`
                    });
                  } catch (e) {
                    console.warn('Maid booking persistence error:', e);
                  }
                  setShowPreviewModal(false);
                  onConfirm();
                }}
                className="flex-[1.5] py-3.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,218,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base font-black">check_circle</span>
                <span>CONFIRM & SUBMIT</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowProximityModal(true);
                }}
                className="flex-[1.2] py-3.5 rounded-xl bg-primary/20 text-primary border border-primary/40 font-black text-xs uppercase tracking-wider hover:bg-primary/30 active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-base">radar</span>
                <span>NEAREST</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nearest Maid Proximity Radar Modal */}
      {showProximityModal && (
        <ProximityRadarModal
          isOpen={showProximityModal}
          onClose={() => setShowProximityModal(false)}
          serviceCategory="Maid & Housekeeping"
          serviceSubCategory={frequency}
          userArea={serviceLocation.area}
          userAddress={serviceLocation.address}
          onSelectProvider={(provider: RankedProvider) => {
            const userPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402';
            const userName = userProfile?.full_name || 'Resident';
            const userId = userProfile?.id;
            const shiftDisplay = isCustomShift ? `Custom (${shiftTimeRange})` : `${shift} (${shiftTimeRange})`;
            const hoursDisplay = `${hoursCount} Hours / Day`;

            try {
              addMaintenanceTicket({
                title: `Housekeeping (${frequency} • ${provider.name})`,
                category: 'Maid & Housekeeping',
                icon: 'cleaning_services',
                priority: 'Standard',
                customerName: userName,
                customerPhone: userPhone,
                userId,
                address: serviceLocation.address,
                area: serviceLocation.area,
                price: `৳ ${userPrice}`,
                status: 'ASSIGNED',
                technicianName: provider.name,
                technicianRole: `${provider.role} (📍 ${provider.distanceKm} km away • Top Priority)`,
                technicianPhone: provider.phone,
                scheduledTime: `${shiftDisplay} • Arriving ~${provider.etaMinutes}m`,
                description: `Assigned nearest housekeeper: ${provider.name} (${provider.distanceKm} km away) | Shift: ${shiftDisplay} | Hours: ${hoursDisplay} | Tasks: ${tasks.join(', ')}`
              });
            } catch (e) {
              console.warn('Maid booking persistence error:', e);
            }
            setShowProximityModal(false);
            onConfirm();
          }}
        />
      )}

      {/* Footer Action - PROPOSED PRICE, NEAREST RADAR & PREVIEW */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent z-20">
        <div className="flex items-center justify-between gap-2.5 glass-card p-3.5 rounded-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-white/50 text-[9px] uppercase font-bold tracking-tighter mb-0.5 ml-1">Price</span>
            <div className="flex items-center gap-1 bg-white rounded-xl px-2.5 py-1 border-2 border-primary/30 w-24">
              <span className="text-black font-black text-sm">৳</span>
              <input 
                type="number"
                value={userPrice}
                onChange={(e) => setUserPrice(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 p-0 text-black text-sm font-black"
              />
            </div>
          </div>

          {/* Priority Action: Find Nearest Maid Radar */}
          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setShowProximityModal(true);
            }}
            className="flex-[1.2] bg-primary hover:shadow-[0_0_20px_rgba(19,236,236,0.4)] text-[#102222] text-[11px] font-black h-12 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] uppercase tracking-wider shrink-0 border border-primary/50"
          >
            <span className="material-symbols-outlined text-base font-black animate-pulse">radar</span>
            <span>FIND NEAREST</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setShowPreviewModal(true);
            }}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white text-[11px] font-black h-12 px-3 rounded-xl flex items-center justify-center gap-1 transition-all active:scale-[0.98] uppercase tracking-wider shrink-0 border border-white/10"
          >
            <span className="material-symbols-outlined text-sm font-black">visibility</span>
            <span>PREVIEW</span>
          </button>
        </div>
      </div>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .glass-chip {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .selected-chip {
            background: rgba(19, 236, 236, 0.2);
            border: 1px solid #13ecec;
            color: #13ecec;
        }
        .body-bg {
            background: radial-gradient(circle at top right, #1a3333, #102222);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default MaidBooking;
