import React, { useState, useEffect } from 'react';

export interface SmartLockDevice {
  id: string;
  name: string;
  room: string;
  type: 'lock';
  isLocked: boolean;
  battery: number;
  protocol: string;
  lastActivity: string;
  autoLockMinutes?: number;
}

export interface ClimateDevice {
  id: string;
  name: string;
  room: string;
  type: 'climate';
  isOn: boolean;
  targetTemp: number;
  currentTemp: number;
  humidity: number;
  mode: 'cool' | 'eco' | 'fan' | 'dry';
  fanSpeed: 'auto' | 'low' | 'med' | 'high';
  powerKw: number;
}

export interface PropertySmartHome {
  id: string;
  propertyName: string;
  address: string;
  locks: SmartLockDevice[];
  climates: ClimateDevice[];
}

const DEFAULT_PROPERTIES: PropertySmartHome[] = [
  {
    id: 'prop-uttara-12',
    propertyName: 'House 12, Uttara',
    address: 'Road 5, Sector 4, Uttara, Dhaka (Active Task)',
    locks: [
      {
        id: 'lock-uttara-main',
        name: 'Main Entrance Smart Deadbolt',
        room: 'Front Foyer',
        type: 'lock',
        isLocked: true,
        battery: 94,
        protocol: 'Zigbee 3.0 / Secure Pro',
        lastActivity: 'Locked 24m ago via Keypad',
        autoLockMinutes: 5
      },
      {
        id: 'lock-uttara-balcony',
        name: 'Service Balcony Security Latch',
        room: 'Rear Balcony',
        type: 'lock',
        isLocked: true,
        battery: 88,
        protocol: 'BLE Mesh 5.2',
        lastActivity: 'Locked yesterday at 11:30 PM',
        autoLockMinutes: 3
      }
    ],
    climates: [
      {
        id: 'climate-uttara-living',
        name: 'Living Hall Inverter AC',
        room: 'Living Room',
        type: 'climate',
        isOn: true,
        targetTemp: 23,
        currentTemp: 28,
        humidity: 52,
        mode: 'cool',
        fanSpeed: 'high',
        powerKw: 1.2
      },
      {
        id: 'climate-uttara-master',
        name: 'Master Suite Dual Climate',
        room: 'Master Bedroom',
        type: 'climate',
        isOn: false,
        targetTemp: 24,
        currentTemp: 27,
        humidity: 50,
        mode: 'eco',
        fanSpeed: 'auto',
        powerKw: 0.0
      },
      {
        id: 'climate-uttara-kitchen',
        name: 'Kitchen Smart Exhaust & Cooler',
        room: 'Kitchen Area',
        type: 'climate',
        isOn: true,
        targetTemp: 25,
        currentTemp: 30,
        humidity: 61,
        mode: 'fan',
        fanSpeed: 'med',
        powerKw: 0.4
      }
    ]
  },
  {
    id: 'prop-banani-4b',
    propertyName: 'Banani Apartment 4B',
    address: 'Road 11, Block D, Banani, Dhaka',
    locks: [
      {
        id: 'lock-banani-main',
        name: 'Penthouse Digital Entry Lock',
        room: 'Main Door',
        type: 'lock',
        isLocked: true,
        battery: 96,
        protocol: 'Matter over Thread',
        lastActivity: 'Auto-locked 1h ago',
        autoLockMinutes: 5
      }
    ],
    climates: [
      {
        id: 'climate-banani-hall',
        name: 'Central Multi-Split Aircon',
        room: 'Great Hall',
        type: 'climate',
        isOn: true,
        targetTemp: 22,
        currentTemp: 26,
        humidity: 48,
        mode: 'cool',
        fanSpeed: 'auto',
        powerKw: 1.4
      },
      {
        id: 'climate-banani-bed',
        name: 'Bedroom 1 Climate Unit',
        room: 'Guest Bed',
        type: 'climate',
        isOn: false,
        targetTemp: 24,
        currentTemp: 26,
        humidity: 49,
        mode: 'eco',
        fanSpeed: 'low',
        powerKw: 0.0
      }
    ]
  }
];

const STORAGE_KEY = 'duyar_smart_home_controls_v1';

export const SmartHomeControl: React.FC = () => {
  const [properties, setProperties] = useState<PropertySmartHome[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load smart home state', e);
    }
    return DEFAULT_PROPERTIES;
  });

  const [selectedPropId, setSelectedPropId] = useState<string>('prop-uttara-12');
  const [activeFilter, setActiveFilter] = useState<'all' | 'locks' | 'climate'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch (e) {
      console.warn('Failed to save smart home state', e);
    }
  }, [properties]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  const currentProperty = properties.find(p => p.id === selectedPropId) || properties[0];

  // Toggle smart lock
  const handleToggleLock = (lockId: string) => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 300);

    setProperties(prev => prev.map(prop => {
      if (prop.id !== currentProperty.id) return prop;
      return {
        ...prop,
        locks: prop.locks.map(lock => {
          if (lock.id !== lockId) return lock;
          const nextState = !lock.isLocked;
          showToast(`${lock.name} ${nextState ? 'LOCKED' : 'UNLOCKED'}`);
          return {
            ...lock,
            isLocked: nextState,
            lastActivity: nextState ? 'Locked just now via App' : 'Unlocked just now by Maintenance'
          };
        })
      };
    }));
  };

  // Toggle climate device power
  const handleToggleClimatePower = (climateId: string) => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 300);

    setProperties(prev => prev.map(prop => {
      if (prop.id !== currentProperty.id) return prop;
      return {
        ...prop,
        climates: prop.climates.map(climate => {
          if (climate.id !== climateId) return climate;
          const nextOn = !climate.isOn;
          showToast(`${climate.name} turned ${nextOn ? 'ON' : 'OFF'}`);
          return {
            ...climate,
            isOn: nextOn,
            powerKw: nextOn ? (climate.mode === 'eco' ? 0.7 : 1.2) : 0.0
          };
        })
      };
    }));
  };

  // Adjust temperature
  const handleAdjustTemp = (climateId: string, delta: number) => {
    setProperties(prev => prev.map(prop => {
      if (prop.id !== currentProperty.id) return prop;
      return {
        ...prop,
        climates: prop.climates.map(climate => {
          if (climate.id !== climateId) return climate;
          const newTemp = Math.min(30, Math.max(16, climate.targetTemp + delta));
          showToast(`${climate.name} set to ${newTemp}°C`);
          return {
            ...climate,
            targetTemp: newTemp
          };
        })
      };
    }));
  };

  // Change climate mode
  const handleChangeMode = (climateId: string, mode: 'cool' | 'eco' | 'fan' | 'dry') => {
    setProperties(prev => prev.map(prop => {
      if (prop.id !== currentProperty.id) return prop;
      return {
        ...prop,
        climates: prop.climates.map(climate => {
          if (climate.id !== climateId) return climate;
          showToast(`${climate.name} switched to ${mode.toUpperCase()} mode`);
          return {
            ...climate,
            mode,
            powerKw: mode === 'eco' ? 0.7 : mode === 'fan' ? 0.3 : 1.2
          };
        })
      };
    }));
  };

  // Master action: Secure all locks
  const handleLockAll = () => {
    setProperties(prev => prev.map(prop => {
      if (prop.id !== currentProperty.id) return prop;
      return {
        ...prop,
        locks: prop.locks.map(l => ({ ...l, isLocked: true, lastActivity: 'Locked just now via Master Secure' }))
      };
    }));
    showToast(`All locks secured for ${currentProperty.propertyName}`);
  };

  // Master action: Set all climate to Eco mode
  const handleEcoAll = () => {
    setProperties(prev => prev.map(prop => {
      if (prop.id !== currentProperty.id) return prop;
      return {
        ...prop,
        climates: prop.climates.map(c => ({
          ...c,
          mode: 'eco',
          targetTemp: Math.max(c.targetTemp, 25),
          powerKw: c.isOn ? 0.7 : 0.0
        }))
      };
    }));
    showToast(`Eco Mode (25°C) applied to all AC units`);
  };

  const totalLocks = currentProperty.locks.length;
  const lockedCount = currentProperty.locks.filter(l => l.isLocked).length;
  const totalClimates = currentProperty.climates.length;
  const activeClimateCount = currentProperty.climates.filter(c => c.isOn).length;

  const showLocks = activeFilter === 'all' || activeFilter === 'locks';
  const showClimate = activeFilter === 'all' || activeFilter === 'climate';

  return (
    <section className="space-y-4">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-background-dark/95 border border-primary/40 text-white px-4 py-2.5 rounded-2xl shadow-[0_0_30px_rgba(19,236,218,0.3)] backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-primary text-base">hub</span>
          <span className="text-[11px] font-black uppercase tracking-wider italic">{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-lg">home_iot_device</span>
          </div>
          <div>
            <h3 className="text-base font-black italic uppercase tracking-tight flex items-center gap-2">
              Smart Home Control
            </h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
              Live IoT Hub • Remote Access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
            {isSyncing ? 'SYNCING...' : 'ONLINE'}
          </span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="glass-card rounded-[2rem] p-5 border border-white/10 space-y-5 bg-white/[0.02] shadow-2xl relative overflow-hidden">
        {/* Subtle accent backdrop glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Property Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-white/40 font-black uppercase tracking-wider px-1">
            <span>Select Property</span>
            <span className="text-primary font-bold">{properties.length} Linked Properties</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {properties.map(p => {
              const isSelected = p.id === currentProperty.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPropId(p.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary/15 border-primary/50 text-white shadow-[0_0_20px_rgba(19,236,218,0.15)]'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-black uppercase italic truncate ${isSelected ? 'text-primary' : 'text-white'}`}>
                      {p.propertyName}
                    </p>
                    <p className="text-[9px] text-white/40 truncate mt-0.5 font-medium">
                      {p.address.split('(')[0]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[9px] font-bold text-white/50">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px] text-primary">lock</span>
                      {p.locks.length}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[11px] text-primary">ac_unit</span>
                      {p.climates.length}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick summary & bulk actions */}
        <div className="flex items-center justify-between bg-white/5 rounded-2xl p-3 border border-white/5">
          <div className="flex items-center gap-4 text-xs font-bold text-white/70">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">lock</span>
              <span>{lockedCount}/{totalLocks} Locked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">thermostat</span>
              <span>{activeClimateCount}/{totalClimates} Active AC</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleLockAll}
              title="Lock all smart doors on this property"
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-primary hover:text-background-dark text-white text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border border-white/10"
            >
              <span className="material-symbols-outlined text-xs font-black">lock</span>
              <span>Lock All</span>
            </button>
            <button
              type="button"
              onClick={handleEcoAll}
              title="Set all ACs to Eco Mode (25°C)"
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-primary hover:text-background-dark text-white text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border border-white/10"
            >
              <span className="material-symbols-outlined text-xs font-black">eco</span>
              <span>Eco All</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeFilter === 'all'
                ? 'bg-primary text-background-dark shadow-md'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            All Devices ({totalLocks + totalClimates})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('locks')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
              activeFilter === 'locks'
                ? 'bg-primary text-background-dark shadow-md'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xs">lock</span>
            Locks ({totalLocks})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('climate')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
              activeFilter === 'climate'
                ? 'bg-primary text-background-dark shadow-md'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-xs">ac_unit</span>
            Climate ({totalClimates})
          </button>
        </div>

        {/* DEVICE LIST */}
        <div className="space-y-3.5">
          {/* SMART LOCKS SECTION */}
          {showLocks && currentProperty.locks.map(lock => {
            const isLocked = lock.isLocked;
            return (
              <div
                key={lock.id}
                className={`rounded-2xl p-4 border transition-all duration-300 ${
                  isLocked
                    ? 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    : 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                        isLocked
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl font-black">
                        {isLocked ? 'lock' : 'lock_open'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-tight italic text-white">
                          {lock.name}
                        </h4>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest ${
                            isLocked
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isLocked ? 'SECURE' : 'UNLOCKED'}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 font-medium mt-0.5">
                        Zone: {lock.room} • {lock.protocol}
                      </p>
                      <p className="text-[9px] text-white/30 italic mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">history</span>
                        {lock.lastActivity}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(lock.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                        isLocked
                          ? 'bg-white/10 hover:bg-amber-500 hover:text-background-dark text-white border border-white/10'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-background-dark shadow-emerald-500/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm font-black">
                        {isLocked ? 'lock_open' : 'lock'}
                      </span>
                      <span>{isLocked ? 'Unlock' : 'Lock'}</span>
                    </button>

                    <div className="flex items-center gap-1 text-[9px] text-white/40 font-bold">
                      <span className="material-symbols-outlined text-xs text-primary">battery_charging_full</span>
                      <span>{lock.battery}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CLIMATE DEVICES SECTION */}
          {showClimate && currentProperty.climates.map(climate => {
            const isOn = climate.isOn;
            return (
              <div
                key={climate.id}
                className={`rounded-2xl p-4 border transition-all duration-300 space-y-3.5 ${
                  isOn
                    ? 'bg-primary/5 border-primary/25 shadow-[0_0_20px_rgba(19,236,218,0.06)]'
                    : 'bg-white/[0.02] border-white/5 opacity-75'
                }`}
              >
                {/* Top header row: Info + Power Toggle */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                        isOn
                          ? 'bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]'
                          : 'bg-white/5 border-white/10 text-white/30'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${isOn ? 'animate-spin-slow' : ''}`}>
                        {climate.mode === 'eco' ? 'eco' : climate.mode === 'fan' ? 'mode_fan' : climate.mode === 'dry' ? 'water_drop' : 'ac_unit'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-tight italic text-white">
                          {climate.name}
                        </h4>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest ${
                            isOn
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-white/10 text-white/40 border border-white/10'
                          }`}
                        >
                          {isOn ? `${climate.mode.toUpperCase()}` : 'STANDBY'}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 font-medium mt-0.5">
                        Zone: {climate.room}
                      </p>
                      <p className="text-[9px] text-white/40 mt-1 flex items-center gap-2 font-medium">
                        <span className="flex items-center gap-0.5 text-primary">
                          <span className="material-symbols-outlined text-[11px]">thermostat</span>
                          Room: {climate.currentTemp}°C
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[11px]">water_drop</span>
                          {climate.humidity}% RH
                        </span>
                        {isOn && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{climate.powerKw} kW</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Power On/Off Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleClimatePower(climate.id)}
                    className={`size-11 rounded-2xl flex items-center justify-center transition-all border shadow-md active:scale-95 ${
                      isOn
                        ? 'bg-primary text-background-dark border-primary shadow-primary/30'
                        : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                    }`}
                    title={isOn ? 'Turn Climate Off' : 'Turn Climate On'}
                  >
                    <span className="material-symbols-outlined text-xl font-black">
                      power_settings_new
                    </span>
                  </button>
                </div>

                {/* Temperature Controls & Mode Adjustments (only when device is active or accessible) */}
                {isOn ? (
                  <div className="pt-2 border-t border-white/5 space-y-3">
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-2 px-3 border border-white/5">
                      <span className="text-[10px] text-white/50 uppercase font-black tracking-wider">Target Temp</span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleAdjustTemp(climate.id, -1)}
                          disabled={climate.targetTemp <= 16}
                          className="size-8 rounded-lg bg-white/10 hover:bg-primary hover:text-background-dark text-white flex items-center justify-center font-black active:scale-90 transition-all disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-sm font-black">remove</span>
                        </button>

                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xl font-black italic text-primary">{climate.targetTemp}</span>
                          <span className="text-xs font-bold text-white/60">°C</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdjustTemp(climate.id, 1)}
                          disabled={climate.targetTemp >= 30}
                          className="size-8 rounded-lg bg-white/10 hover:bg-primary hover:text-background-dark text-white flex items-center justify-center font-black active:scale-90 transition-all disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-sm font-black">add</span>
                        </button>
                      </div>
                    </div>

                    {/* Mode selection buttons */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { key: 'cool', label: 'Cool', icon: 'ac_unit' },
                        { key: 'eco', label: 'Eco', icon: 'eco' },
                        { key: 'fan', label: 'Fan', icon: 'mode_fan' },
                        { key: 'dry', label: 'Dry', icon: 'water_drop' }
                      ].map(m => {
                        const isCurrent = climate.mode === m.key;
                        return (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => handleChangeMode(climate.id, m.key as any)}
                            className={`py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all border ${
                              isCurrent
                                ? 'bg-primary/20 border-primary text-primary shadow-sm'
                                : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">{m.icon}</span>
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-white/30">
                    <span>Device powered off</span>
                    <button
                      type="button"
                      onClick={() => handleToggleClimatePower(climate.id)}
                      className="text-primary font-bold hover:underline"
                    >
                      Turn on to set climate ({climate.targetTemp}°C)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 7s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default SmartHomeControl;
