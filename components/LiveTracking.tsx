import React, { useState, useEffect, useRef } from 'react';
import { getActivePickDropRequest, DEFAULT_PICKDROP_REQUEST, PickDropRequest, updatePickDropStatus } from '../pickDropStorage';
import { updateTicketStatus } from '../maintenanceStorage';
import { haptics } from '../haptics';
import { realtimeClient, RealtimeTrackingState } from '../realtimeClient';
import ProviderAvatar from './ProviderAvatar';

export interface ServiceTrackingData {
  id?: string;
  title?: string;
  category?: string;
  price?: string;
  providerName?: string;
  providerPhone?: string;
  providerRole?: string;
  providerImage?: string;
  address?: string;
  notes?: string[];
  [key: string]: any;
}

interface Props {
  onBack: () => void;
  onArrived?: () => void;
  serviceType?: string;
  serviceData?: ServiceTrackingData | null;
}

interface ServiceProfile {
  categoryKey: 'ELECTRICAL' | 'PLUMBING' | 'MAID' | 'SECURITY' | 'PICK_DROP' | 'MAINTENANCE';
  categoryTitle: string;
  badgeLabel: string;
  providerName: string;
  providerRole: string;
  providerPhone: string;
  providerImage: string;
  providerRating: string;
  licenseNumber: string;
  icon: string;
  vehicleOrMode: string;
  workOrderId: string;
  telemetry1: { icon: string; label: string; value: string };
  telemetry2: { icon: string; label: string; value: string };
  workOrderScope: {
    title: string;
    description: string;
    tags: string[];
    locationSummary: string;
    price: string;
  };
  trackingLogs: string[];
  isMovingCargo: boolean;
}

function resolveServiceProfile(
  serviceType?: string,
  serviceData?: ServiceTrackingData | null,
  activePickDrop?: PickDropRequest | null
): ServiceProfile {
  const rawType = (serviceType || serviceData?.category || serviceData?.title || '').toLowerCase();

  // 1. ELECTRICAL MAINTENANCE
  if (rawType.includes('electric') || rawType.includes('bolt') || rawType.includes('wiring') || rawType.includes('breaker')) {
    return {
      categoryKey: 'ELECTRICAL',
      categoryTitle: 'Electrical Maintenance',
      badgeLabel: 'MASTER ELECTRICIAN EN ROUTE',
      providerName: serviceData?.providerName || 'Licensed Electrician',
      providerRole: serviceData?.providerRole || 'Licensed Electrical Specialist',
      providerPhone: serviceData?.providerPhone || '+880 1712-984512',
      providerImage: serviceData?.providerImage || '',
      providerRating: serviceData?.providerRating || 'Verified Specialist',
      licenseNumber: 'Govt. Grade-A Electrician: #BD-ELEC-4092',
      icon: 'bolt',
      vehicleOrMode: 'Equipped Electrical Service Van',
      workOrderId: serviceData?.id || '#ELC-9923',
      telemetry1: { icon: 'electric_meter', label: 'Voltage Rig', value: '1000V Insulated' },
      telemetry2: { icon: 'construction', label: 'Spares Loaded', value: '32A Breakers & Wire' },
      workOrderScope: {
        title: 'Electrical Diagnostic & Circuit Repair',
        description: 'Breaker diagnostic, line load balancing, socket inspection, line calibration, and emergency isolation.',
        tags: ['⚡ 1000V Insulated Rig', '🛡️ Safety Certified', '📦 Breakers Loaded', '🏢 On-Site Diagnostics'],
        locationSummary: serviceData?.address || 'House 14, Road 11, Block D, Banani, Dhaka',
        price: serviceData?.price || '৳ 1,250'
      },
      trackingLogs: [
        'Master Electrician dispatched from Banani Service Depot...',
        'Digital multimeter, 32A breaker fuses & safety gear verified...',
        'Service van navigating via Kamal Ataturk Avenue...',
        'Approaching residential premises — technician ready with certified tools...'
      ],
      isMovingCargo: false
    };
  }

  // 2. PLUMBING MAINTENANCE
  if (rawType.includes('plumb') || rawType.includes('pipe') || rawType.includes('water') || rawType.includes('leak') || rawType.includes('drain')) {
    return {
      categoryKey: 'PLUMBING',
      categoryTitle: 'Plumbing Maintenance',
      badgeLabel: 'MASTER PLUMBER DISPATCHED',
      providerName: serviceData?.providerName || 'Master Plumber',
      providerRole: serviceData?.providerRole || 'Master Plumber & Pipe Specialist',
      providerPhone: serviceData?.providerPhone || '+880 1912-345678',
      providerImage: serviceData?.providerImage || '',
      providerRating: serviceData?.providerRating || 'Verified Specialist',
      licenseNumber: 'Govt. Hydro License: #BD-PLM-8812',
      icon: 'plumbing',
      vehicleOrMode: 'Rapid Plumbing Utility Van',
      workOrderId: serviceData?.id || '#PLM-4402',
      telemetry1: { icon: 'speed', label: 'Hydro Gauge', value: '6.2 Bar Tested' },
      telemetry2: { icon: 'handyman', label: 'Sealing Kit', value: 'CPVC & High Pressure' },
      workOrderScope: {
        title: 'Concealed Pipe & Pressure Regulator Repair',
        description: 'High-pressure acoustic leak inspection, pipe union sealing, and sanitary drainage clearance.',
        tags: ['💧 Hydro-Acoustic Detector', '🔧 CPVC Fittings', '🛠️ Pressure Regulator Kit'],
        locationSummary: serviceData?.address || 'Flat 4B, Plot 28, Road 11, Banani, Dhaka',
        price: serviceData?.price || '৳ 1,250'
      },
      trackingLogs: [
        'Certified plumber dispatched from central depot...',
        'Hydro-acoustic leak detection kit & pipe clamps verified...',
        'Van navigating toward customer premises...',
        'Technician approaching site with replacement fittings...'
      ],
      isMovingCargo: false
    };
  }

  // 3. MAID & CLEANING SERVICE
  if (rawType.includes('maid') || rawType.includes('clean') || rawType.includes('housekeep')) {
    return {
      categoryKey: 'MAID',
      categoryTitle: 'Maid & Housekeeping',
      badgeLabel: 'VERIFIED HOUSEKEEPER EN ROUTE',
      providerName: serviceData?.providerName || 'Housekeeping Specialist',
      providerRole: serviceData?.providerRole || 'Verified Housekeeping & Sanitization Specialist',
      providerPhone: serviceData?.providerPhone || '+880 1744-889900',
      providerImage: serviceData?.providerImage || '',
      providerRating: serviceData?.providerRating || 'Verified Specialist',
      licenseNumber: 'Duyar Background-Verified: #VFD-MD-1102',
      icon: 'cleaning_services',
      vehicleOrMode: 'City Transit & Foot Travel',
      workOrderId: serviceData?.id || '#MD-7721',
      telemetry1: { icon: 'verified_user', label: 'Screening', value: '100% Cleared' },
      telemetry2: { icon: 'sanitizer', label: 'Supplies', value: 'Eco Disinfectants' },
      workOrderScope: {
        title: 'Housekeeping & Deep Surface Sanitization',
        description: 'Complete room cleaning, kitchen degreasing, bathroom sanitization, and eco floor mopping.',
        tags: ['✨ Eco Disinfection', '🧼 Deep Mopping', '🧽 Surface Polish', '🛡️ Verified Personnel'],
        locationSummary: serviceData?.address || 'Banani Block D, Dhaka',
        price: serviceData?.price || '৳ 850/day'
      },
      trackingLogs: [
        'Verified housekeeper confirmed and dispatched...',
        'Eco cleaning supplies & microfiber kit verified...',
        'Housekeeper en route to your residence...',
        'Arrived at building security reception...'
      ],
      isMovingCargo: false
    };
  }

  // 4. SECURITY GUARD SERVICE
  if (rawType.includes('security') || rawType.includes('guard') || rawType.includes('cctv') || rawType.includes('patrol')) {
    return {
      categoryKey: 'SECURITY',
      categoryTitle: 'Security Guard Service',
      badgeLabel: 'SECURITY OFFICER DEPLOYED',
      providerName: serviceData?.providerName || 'Security Specialist',
      providerRole: serviceData?.providerRole || 'Senior Security Specialist',
      providerPhone: serviceData?.providerPhone || '+880 1855-667788',
      providerImage: serviceData?.providerImage || '',
      providerRating: serviceData?.providerRating || 'Verified Specialist',
      licenseNumber: 'Govt. Private Security Reg: #SEC-8891',
      icon: 'shield_person',
      vehicleOrMode: 'Tactical Security Unit',
      workOrderId: serviceData?.id || '#SEC-5509',
      telemetry1: { icon: 'radio', label: 'Comms Link', value: 'Ch-4 Active' },
      telemetry2: { icon: 'badge', label: 'Duty Status', value: 'Uniformed Post' },
      workOrderScope: {
        title: 'Premises Access Control & Night Watch',
        description: 'Perimeter surveillance, visitor identity logging, checkpoint security, and emergency protocol monitoring.',
        tags: ['🛡️ Gate Security', '📻 Two-Way Comms', '🔦 Night Patrol', '📋 Visitor Logging'],
        locationSummary: serviceData?.address || 'Plot 12, Road 4, Banani, Dhaka',
        price: serviceData?.price || '৳ 1,800/shift'
      },
      trackingLogs: [
        'Security guard dispatched from Area Command Hub...',
        'Two-way radio communication verified on Channel 4...',
        'Officer in transit with tactical gear and duty logbook...',
        'Approaching property entrance for shift briefing...'
      ],
      isMovingCargo: false
    };
  }

  // 5. PICK & DROP (CARGO / MOVING VEHICLE)
  if (rawType.includes('pick') || rawType.includes('drop') || rawType.includes('moving') || rawType.includes('shipment') || rawType.includes('truck')) {
    const pd = activePickDrop || DEFAULT_PICKDROP_REQUEST || {
      id: '',
      vehicle: 'Mini Truck',
      helpers: 1,
      items: [],
      itemDetails: 'Cargo logistics shipment',
      specialNotes: [],
      pickupArea: 'Dhaka',
      pickupAddress: '',
      dropArea: 'Dhaka',
      dropAddress: '',
      fare: '0',
      weightCategory: 'Standard',
      createdAt: '',
      status: 'PENDING'
    } as any;
    return {
      categoryKey: 'PICK_DROP',
      categoryTitle: 'Pick & Drop Shipment',
      badgeLabel: 'MOVING TRUCK EN ROUTE',
      providerName: pd.driverName || 'Logistics Pilot',
      providerRole: `${pd.vehicle || 'Logistics'} Pilot • Verified`,
      providerPhone: pd.driverPhone || '+880 1819-234567',
      providerImage: pd.driverImage || '',
      providerRating: 'Verified Driver',
      licenseNumber: pd.driverVehicleNo || 'Dhaka Metro Certified',
      icon: 'local_shipping',
      vehicleOrMode: `${pd.vehicle || 'Vehicle'} (${pd.driverVehicleNo || 'Active Route'})`,
      workOrderId: pd.id || '#PD-8821',
      telemetry1: { icon: 'speed', label: 'Speed', value: '38 km/h' },
      telemetry2: { icon: 'battery_charging_80', label: 'Battery/Fuel', value: '84%' },
      workOrderScope: {
        title: 'Moving Items & Cargo Logistics',
        description: pd.itemDetails || 'Standard household items for moving.',
        tags: pd.specialNotes || ['Careful Handling', 'Verified Transport'],
        locationSummary: `${pd.pickupArea || 'Banani'} ➔ ${pd.dropArea || 'Uttara'}`,
        price: pd.fare ? `৳ ${pd.fare}` : '৳ 2,450'
      },
      trackingLogs: [
        'Transport dispatched to pickup coordinates...',
        'GPS coordinate set locked via Satellite...',
        'Optimal route calculated via Dhaka Express Highway...',
        'Vehicle arriving at pickup location...'
      ],
      isMovingCargo: true
    };
  }

  // 6. DEFAULT GENERAL MAINTENANCE (AC, Appliance, Carpenter, Painting, etc.)
  return {
    categoryKey: 'MAINTENANCE',
    categoryTitle: serviceData?.category || 'General Maintenance',
    badgeLabel: 'MAINTENANCE SPECIALIST EN ROUTE',
    providerName: serviceData?.providerName || 'Maintenance Specialist',
    providerRole: serviceData?.providerRole || 'Chief Maintenance Technician',
    providerPhone: serviceData?.providerPhone || '+880 1912-345678',
    providerImage: serviceData?.providerImage || '',
    providerRating: serviceData?.providerRating || 'Verified Specialist',
    licenseNumber: 'Govt. Certified Technician: #TECH-9902',
    icon: 'home_repair_service',
    vehicleOrMode: 'Maintenance Mobile Unit',
    workOrderId: serviceData?.id || '#SRV-1102',
    telemetry1: { icon: 'build', label: 'Tool Kit', value: 'Calibrated & Loaded' },
    telemetry2: { icon: 'verified', label: 'Certification', value: 'Verified Expert' },
    workOrderScope: {
      title: 'Home Maintenance Work Order',
      description: 'Scheduled on-site diagnostic, equipment inspection, and professional repair execution.',
      tags: ['🛠️ Tool Kit Loaded', '🛡️ Duyar Verified', '⏱️ Same-Day Service'],
      locationSummary: serviceData?.address || 'Banani, Dhaka',
      price: serviceData?.price || '৳ 1,250'
    },
    trackingLogs: [
      'Maintenance specialist assigned and confirmed...',
      'Tool kit and diagnostic equipment onboard...',
      'Technician en route via primary transit route...',
      'Approaching destination address...'
    ],
    isMovingCargo: false
  };
}

const LiveTracking: React.FC<Props> = ({ onBack, onArrived, serviceType, serviceData }) => {
  const [pickDropReq, setPickDropReq] = useState<PickDropRequest | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [providerPos, setProviderPos] = useState<[number, number]>([23.805, 90.415]);
  const [eta, setEta] = useState<string>("Calculating...");
  const [distance, setDistance] = useState<string>("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [speedKmh, setSpeedKmh] = useState<number>(36);
  const [isFullMap, setIsFullMap] = useState<boolean>(false);
  const [isBroadcastingGps, setIsBroadcastingGps] = useState<boolean>(false);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(realtimeClient.getIsConnected());
  
  const touchStartYRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Compute the service profile matching this specific service
  const serviceProfile = resolveServiceProfile(serviceType, serviceData, pickDropReq);
  const effectiveTicketId = serviceData?.id || pickDropReq?.id || serviceProfile.workOrderId.replace('#', '') || 'SRV-MAIN-TRACK';

  // Invalidate Leaflet dimensions when toggling full map
  useEffect(() => {
    const timer = setTimeout(() => {
      if (leafletInstance.current) {
        leafletInstance.current.invalidateSize();
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [isFullMap]);

  // Load pick and drop request if relevant
  useEffect(() => {
    try {
      const active = getActivePickDropRequest();
      if (active) setPickDropReq(active);
    } catch {
      // ignore
    }
  }, []);

  // Monitor real-time WebSocket connection
  useEffect(() => {
    const unsub = realtimeClient.onConnectionChange(setIsWsConnected);
    return unsub;
  }, []);

  // Subscribe to real-time server tracking for this ticket
  useEffect(() => {
    if (!effectiveTicketId) return;

    const unsubscribe = realtimeClient.subscribeTracking(effectiveTicketId, (trackingState: RealtimeTrackingState) => {
      if (trackingState) {
        if (trackingState.providerLat && trackingState.providerLng) {
          setProviderPos([trackingState.providerLat, trackingState.providerLng]);
        }
        if (trackingState.userLat && trackingState.userLng) {
          setUserPos([trackingState.userLat, trackingState.userLng]);
        }
        if (trackingState.speedKmh) {
          setSpeedKmh(trackingState.speedKmh);
        }
      }
    });

    return unsubscribe;
  }, [effectiveTicketId]);

  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const providerMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);

  // Get User Real GPS Position initially
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          setUserPos([uLat, uLng]);
          
          // Place provider at realistic initial offset if not yet placed by server
          setProviderPos(prev => {
            if (prev[0] === 23.805 && prev[1] === 90.415) {
              return [uLat + 0.008, uLng + 0.007];
            }
            return prev;
          });

          // Sync initial location to server
          realtimeClient.broadcastLocation(effectiveTicketId, {
            ticketId: effectiveTicketId,
            userLat: uLat,
            userLng: uLng,
            providerLat: uLat + 0.008,
            providerLng: uLng + 0.007,
            speedKmh: 36,
            status: 'EN_ROUTE'
          });
        },
        () => {
          // Fallback to Dhaka central coordinates
          const defaultUser: [number, number] = [23.794, 90.4043];
          setUserPos(defaultUser);
          setProviderPos([23.802, 90.411]);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserPos([23.794, 90.4043]);
      setProviderPos([23.802, 90.411]);
    }
  }, [effectiveTicketId]);

  // Real GPS broadcasting toggle (allows real mobile testing or provider on-site tracking)
  const toggleRealGpsBroadcasting = () => {
    haptics.selection();
    if (isBroadcastingGps) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsBroadcastingGps(false);
    } else {
      if (navigator.geolocation) {
        setIsBroadcastingGps(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const currentLat = pos.coords.latitude;
            const currentLng = pos.coords.longitude;
            const currentSpeed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 32;

            setProviderPos([currentLat, currentLng]);
            if (currentSpeed > 0) setSpeedKmh(currentSpeed);

            realtimeClient.broadcastLocation(effectiveTicketId, {
              ticketId: effectiveTicketId,
              providerLat: currentLat,
              providerLng: currentLng,
              userLat: userPos ? userPos[0] : currentLat,
              userLng: userPos ? userPos[1] : currentLng,
              speedKmh: currentSpeed,
              status: 'EN_ROUTE',
              lastUpdatedBy: 'live_device_gps'
            });
          },
          (err) => {
            console.warn('GPS Watch error:', err);
            setIsBroadcastingGps(false);
          },
          { enableHighAccuracy: true, maximumAge: 1000 }
        );
      }
    }
  };

  // Clean up leaflet and GPS watcher safely on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (leafletInstance.current) {
        try {
          leafletInstance.current.remove();
        } catch (e) {
          console.debug('Leaflet map remove note:', e);
        }
        leafletInstance.current = null;
        userMarkerRef.current = null;
        providerMarkerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, []);

  // Initialize and Update Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !userPos) return;

    if (!leafletInstance.current) {
      try {
        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView(userPos, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        leafletInstance.current = map;
      } catch (err) {
        console.warn('Map initialization notice:', err);
        return;
      }
    }

    const map = leafletInstance.current;
    if (!map) return;

    // Update User Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userPos);
    } else {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div class="relative flex items-center justify-center"><div class="bip-ring"></div><div class="size-6 bg-white rounded-full border-4 border-primary shadow-[0_0_15px_rgba(19,236,218,1)]"></div></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      userMarkerRef.current = L.marker(userPos, { icon: userIcon }).addTo(map);
    }

    // Provider Marker with specific service icon
    const providerIconHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-1 rounded-2xl bg-primary/40 blur-sm animate-pulse"></div>
        <div class="relative bg-[#0a1211] p-2.5 rounded-2xl shadow-2xl border-2 border-primary flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-xl font-black">${serviceProfile.icon}</span>
        </div>
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-primary"></div>
      </div>
    `;

    const providerIcon = L.divIcon({
      className: 'provider-service-marker',
      html: providerIconHtml,
      iconSize: [42, 42],
      iconAnchor: [21, 42]
    });

    if (providerMarkerRef.current) {
      providerMarkerRef.current.setLatLng(providerPos);
      providerMarkerRef.current.setIcon(providerIcon);
    } else {
      providerMarkerRef.current = L.marker(providerPos, { icon: providerIcon }).addTo(map);
    }

    // Route Line
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([userPos, providerPos]);
    } else {
      routeLineRef.current = L.polyline([userPos, providerPos], {
        color: '#13ecda',
        weight: 5,
        opacity: 0.7,
        dashArray: '3, 8',
        lineCap: 'round'
      }).addTo(map);
    }

    const d = map.distance(userPos, providerPos) / 1000;
    if (d < 0.1) {
      setDistance("Arrived on site");
      setEta("Here Now");
    } else {
      setDistance(`${d.toFixed(1)} km`);
      const mins = Math.max(1, Math.round((d / (speedKmh || 30)) * 60));
      setEta(`${mins} min${mins > 1 ? 's' : ''}`);
    }
  }, [userPos, providerPos, serviceProfile.icon, speedKmh]);

  // Interactive Map Control Helpers
  const handleRecenterUser = () => {
    if (leafletInstance.current && userPos) {
      haptics.selection();
      leafletInstance.current.flyTo(userPos, 16, { animate: true, duration: 0.8 });
    }
  };

  const handleRecenterProvider = () => {
    if (leafletInstance.current && providerPos) {
      haptics.selection();
      leafletInstance.current.flyTo(providerPos, 16, { animate: true, duration: 0.8 });
    }
  };

  const handleFitRoute = () => {
    if (leafletInstance.current && userPos && providerPos) {
      haptics.selection();
      leafletInstance.current.fitBounds([userPos, providerPos], { padding: [80, 80], animate: true });
    }
  };

  const handleZoomIn = () => {
    if (leafletInstance.current) {
      haptics.selection();
      leafletInstance.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (leafletInstance.current) {
      haptics.selection();
      leafletInstance.current.zoomOut();
    }
  };

  const handleConfirmArrival = () => {
    haptics.bookingConfirmed();
    setIsCompleting(true);

    try {
      if (serviceProfile.categoryKey === 'PICK_DROP') {
        const activeReq = getActivePickDropRequest();
        if (activeReq?.id) {
          updatePickDropStatus(activeReq.id, 'COMPLETED');
        } else if (serviceData?.id) {
          updatePickDropStatus(serviceData.id, 'COMPLETED');
        }
      }

      if (serviceData?.id) {
        updateTicketStatus(serviceData.id, 'COMPLETED', 'Customer confirmed specialist on-site arrival.');
      }

      realtimeClient.broadcastTicketStatus(effectiveTicketId, 'COMPLETED', {
        status: 'COMPLETED',
        note: 'Service arrival confirmed by resident'
      });
    } catch (e) {
      console.warn('Arrival update error:', e);
    }

    setTimeout(() => {
      setIsCompleting(false);
      onArrived?.();
    }, 1100);
  };

  if (!userPos) {
    return (
      <div className="h-screen w-full bg-background-dark flex flex-col items-center justify-center font-display">
        <div className="size-20 rounded-full border-4 border-t-primary border-primary/10 animate-spin flex items-center justify-center">
          <span className="material-symbols-outlined text-primary animate-pulse">radar</span>
        </div>
        <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mt-6 animate-pulse italic">
          Connecting to {serviceProfile.categoryTitle} Dispatch...
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full max-w-[480px] mx-auto overflow-hidden font-display bg-background-dark text-white">
      {isCompleting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background-dark/85 backdrop-blur-xl">
          <div className="size-16 rounded-full border-4 border-t-primary border-primary/10 animate-spin"></div>
          <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mt-4">Confirming Service Handshake...</p>
        </div>
      )}

      {/* Map Background */}
      <div ref={mapRef} className="absolute inset-0 z-0"></div>
      <div className="absolute inset-0 z-[1] pointer-events-none bg-background-dark/25 backdrop-brightness-75"></div>

      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 p-5 pt-11 flex justify-between items-start z-10 pointer-events-none">
        <button 
          onClick={onBack} 
          className="pointer-events-auto glass-card size-11 flex items-center justify-center rounded-full text-white backdrop-blur-md active:scale-90 transition-all border border-white/10 shadow-2xl hover:border-primary/50"
          title="Go back"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        
        <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => {
                haptics.selection();
                setIsFullMap(prev => !prev);
              }}
              className="flex items-center gap-1.5 bg-[#0a1211]/90 backdrop-blur-md border border-primary/40 px-3 py-1 rounded-full shadow-lg text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">{isFullMap ? 'expand_less' : 'map'}</span>
              <span>{isFullMap ? 'Order Details' : 'Full Map'}</span>
            </button>

            {/* Service Category Badge */}
            <div className="flex items-center gap-1.5 bg-[#0a1211]/90 backdrop-blur-md border border-primary/40 px-3 py-1 rounded-full shadow-lg">
              <span className="material-symbols-outlined text-primary text-sm">{serviceProfile.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">{serviceProfile.categoryTitle}</span>
            </div>
          </div>

          <div className="bg-primary text-black px-4 py-2 rounded-xl font-black text-[10px] flex flex-col items-center shadow-[0_0_25px_rgba(19,236,218,0.35)] uppercase tracking-wider leading-tight">
            <span className="text-sm font-black">{eta}</span>
            <span className="text-[7.5px] opacity-75 font-bold">ESTIMATED ARRIVAL</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-background-dark/90 backdrop-blur-md border border-white/10 text-white/90 px-3 py-1 rounded-lg font-bold text-[8.5px] uppercase tracking-wider shadow-lg flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span>{distance} • {isWsConnected ? 'REAL-TIME GPS' : 'RECONNECTING'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Service-Specific Telemetry Panel (Top-Left) */}
      <div className="absolute left-5 top-28 z-10 space-y-2 pointer-events-auto">
        <div className="glass-card p-2.5 rounded-2xl flex items-center gap-2.5 border border-primary/30 bg-[#0a1211]/85 shadow-lg">
          <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-base">{serviceProfile.telemetry1.icon}</span>
          </div>
          <div>
            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest leading-none">{serviceProfile.telemetry1.label}</p>
            <p className="text-white text-xs font-black italic mt-0.5">{serviceProfile.telemetry1.value}</p>
          </div>
        </div>

        <div className="glass-card p-2.5 rounded-2xl flex items-center gap-2.5 border border-white/10 bg-[#0a1211]/85 shadow-lg">
          <div className="size-8 rounded-xl bg-white/5 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-base">{serviceProfile.telemetry2.icon}</span>
          </div>
          <div>
            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest leading-none">{serviceProfile.telemetry2.label}</p>
            <p className="text-white text-xs font-black italic mt-0.5">{serviceProfile.telemetry2.value}</p>
          </div>
        </div>

        {/* Real GPS Transmit Button */}
        <button
          type="button"
          onClick={toggleRealGpsBroadcasting}
          className={`px-3 py-2 rounded-2xl flex items-center gap-2 text-[9px] font-black uppercase tracking-wider border shadow-xl transition-all ${
            isBroadcastingGps
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-500/20'
              : 'glass-card text-white/80 border-white/10 hover:border-primary/40'
          }`}
          title="Stream hardware device GPS in real time"
        >
          <span className={`material-symbols-outlined text-sm ${isBroadcastingGps ? 'text-emerald-400 animate-spin' : 'text-primary'}`}>
            {isBroadcastingGps ? 'satellite_alt' : 'sensors'}
          </span>
          <span>{isBroadcastingGps ? 'Streaming Device GPS' : 'Broadcast My GPS'}</span>
        </button>
      </div>

      {/* Floating Interactive Map Controls (Right Side) */}
      <div className="absolute right-4 top-40 z-20 flex flex-col gap-2.5 pointer-events-auto">
        <button 
          onClick={handleFitRoute}
          className="size-11 rounded-2xl glass-card flex items-center justify-center text-primary border border-primary/30 shadow-xl active:scale-90 hover:bg-primary/20 transition-all"
          title="Fit entire route"
        >
          <span className="material-symbols-outlined text-xl">fit_screen</span>
        </button>
        <button 
          onClick={handleRecenterProvider}
          className="size-11 rounded-2xl glass-card flex items-center justify-center text-white/80 hover:text-primary border border-white/10 shadow-xl active:scale-90 hover:bg-white/10 transition-all"
          title="Center on specialist"
        >
          <span className="material-symbols-outlined text-xl">near_me</span>
        </button>
        <button 
          onClick={handleRecenterUser}
          className="size-11 rounded-2xl glass-card flex items-center justify-center text-white/80 hover:text-primary border border-white/10 shadow-xl active:scale-90 hover:bg-white/10 transition-all"
          title="Center on my location"
        >
          <span className="material-symbols-outlined text-xl">my_location</span>
        </button>
        <div className="flex flex-col gap-1 pt-1">
          <button 
            onClick={handleZoomIn}
            className="size-9 rounded-xl glass-card flex items-center justify-center text-white/70 hover:text-white border border-white/10 shadow active:scale-90 transition-all"
            title="Zoom in"
          >
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
          <button 
            onClick={handleZoomOut}
            className="size-9 rounded-xl glass-card flex items-center justify-center text-white/70 hover:text-white border border-white/10 shadow active:scale-90 transition-all"
            title="Zoom out"
          >
            <span className="material-symbols-outlined text-lg">remove</span>
          </button>
        </div>
      </div>

      {/* Bottom Sheet Service & Provider Card */}
      <div className={`absolute bottom-0 left-0 right-0 p-3.5 z-30 transition-transform duration-300 ease-out ${
        isFullMap ? 'translate-y-[calc(100%-80px)]' : 'translate-y-0'
      }`}>
        <div className="glass-card rounded-[2.2rem] overflow-hidden border border-white/15 shadow-[0_-10px_50px_rgba(0,0,0,0.85)] bg-[#0a1211]/95 backdrop-blur-3xl p-5 pb-7 max-h-[72vh] overflow-y-auto no-scrollbar">
          
          {/* Top Pull Handle for Swipe Down / Tap to Toggle Full Map */}
          <div 
            className="w-full -mt-2 mb-3 flex flex-col items-center justify-center cursor-pointer select-none group py-1"
            onClick={() => {
              haptics.selection();
              setIsFullMap(prev => !prev);
            }}
            onTouchStart={(e) => {
              touchStartYRef.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (touchStartYRef.current !== null) {
                const diff = e.changedTouches[0].clientY - touchStartYRef.current;
                if (diff > 35 && !isFullMap) {
                  haptics.selection();
                  setIsFullMap(true);
                } else if (diff < -35 && isFullMap) {
                  haptics.selection();
                  setIsFullMap(false);
                }
                touchStartYRef.current = null;
              }
            }}
          >
            <div className="w-14 h-1.5 rounded-full bg-white/30 group-hover:bg-primary transition-colors" />
            <div className="flex items-center gap-1 mt-1.5 text-primary">
              <span className="material-symbols-outlined text-xs">
                {isFullMap ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
              <span className="text-[8.5px] uppercase tracking-widest font-black">
                {isFullMap ? 'Tap or swipe up for Order Details' : 'Swipe down for Full Map Tracking'}
              </span>
            </div>
          </div>

          {/* Top Status Row */}
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary animate-ping"></div>
              <p className="text-primary text-[10px] font-black tracking-widest uppercase italic">
                {serviceProfile.badgeLabel}
              </p>
            </div>
            <p className="text-white/40 text-[9px] font-mono uppercase tracking-wider">
              Order: {serviceProfile.workOrderId}
            </p>
          </div>

          {/* Provider Identity & Contact Row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <ProviderAvatar 
                name={serviceProfile.providerName} 
                category={serviceProfile.categoryTitle} 
                role={serviceProfile.providerRole} 
                image={serviceProfile.providerImage} 
                size="lg" 
                isOnline={true} 
                showOnlineDot={true} 
              />
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-white truncate flex items-center gap-1">
                  <span>{serviceProfile.providerName}</span>
                  <span className="material-symbols-outlined text-primary text-xs font-black">verified</span>
                </h3>
                <p className="text-primary text-[10.5px] font-bold truncate mt-0.5">
                  {serviceProfile.providerRole}
                </p>
                <p className="text-white/40 text-[9px] font-mono truncate mt-0.5">
                  {serviceProfile.licenseNumber}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a 
                href={`tel:${serviceProfile.providerPhone}`}
                className="size-11 rounded-2xl bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/25 hover:brightness-110 active:scale-90 transition-all"
                title="Call Specialist"
              >
                <span className="material-symbols-outlined text-xl">call</span>
              </a>
            </div>
          </div>

          {/* Vehicle / Mode Info Row */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-lg">local_shipping</span>
              <div>
                <p className="text-white/40 text-[8px] font-black uppercase tracking-wider">Vehicle / Transit Mode</p>
                <p className="text-white text-xs font-bold">{serviceProfile.vehicleOrMode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[8px] font-black uppercase tracking-wider">Speed</p>
              <p className="text-primary text-xs font-black">{speedKmh} km/h</p>
            </div>
          </div>

          {/* Specific Cargo / Work Order Details */}
          {serviceProfile.isMovingCargo && pickDropReq ? (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-primary/30 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                  Cargo Shipment Specification
                </span>
                <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-extrabold uppercase">
                  ৳ {pickDropReq.fare || '2,450'}
                </span>
              </div>
              <div className="text-xs text-white/90 font-medium bg-white/5 p-2.5 rounded-xl border border-white/5">
                <p className="text-primary font-bold">{pickDropReq.itemDetails || 'Standard household items.'}</p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-primary/30 mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">{serviceProfile.icon}</span>
                  {serviceProfile.workOrderScope.title}
                </span>
                <span className="text-[9px] bg-primary/20 text-primary px-2 py-0.5 rounded-md font-extrabold uppercase">
                  {serviceProfile.workOrderScope.price}
                </span>
              </div>

              <p className="text-xs text-white/80 font-medium leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                {serviceProfile.workOrderScope.description}
              </p>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {serviceProfile.workOrderScope.tags.map((tag, i) => (
                  <span key={i} className="bg-primary/10 text-primary text-[8.5px] font-bold px-2 py-0.5 rounded-lg border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-white/50 text-[9.5px] pt-1">
                <span className="material-symbols-outlined text-xs text-primary">location_on</span>
                <span className="truncate">{serviceProfile.workOrderScope.locationSummary}</span>
              </div>
            </div>
          )}

          {/* Live Dispatch Feed */}
          <div className="bg-black/50 rounded-2xl p-3 border border-white/5 mb-4 max-h-24 overflow-hidden font-mono text-[9px]">
            <div className="space-y-1">
              {serviceProfile.trackingLogs.slice(0, 3).map((log, i) => (
                <div key={i} className={`flex gap-2 ${i === 0 ? 'text-primary' : 'text-white/40'}`}>
                  <span className="font-bold shrink-0">
                    [{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
                  </span>
                  <span className="truncate">{log}</span>
                </div>
              ))}
              <div className="text-white/30 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400"></span>
                <span>Real-Time WebSocket telemetry synchronized with dispatch hub</span>
              </div>
            </div>
          </div>

          {/* Completion / Handshake Button */}
          <button 
            type="button"
            onClick={handleConfirmArrival}
            className="w-full h-14 bg-gradient-to-r from-primary to-[#00b4d8] text-black font-extrabold text-xs tracking-wider rounded-2xl uppercase shadow-[0_4px_20px_rgba(19,236,218,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Confirm Specialist Arrival</span>
            <span className="material-symbols-outlined text-base font-black">check_circle</span>
          </button>
        </div>
      </div>

      <style>{`
        .glass-card { background: rgba(16, 34, 32, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .bip-ring {
          position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(19, 236, 218, 0.4);
          animation: location-bip 2s cubic-bezier(0, 0.2, 0.8, 1) infinite; pointer-events: none;
        }
        @keyframes location-bip {
          0% { transform: scale(0.1); opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LiveTracking;
