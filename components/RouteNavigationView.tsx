
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onBack: () => void;
  property?: any;
}

const RouteNavigationView: React.FC<Props> = ({ onBack, property }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<string>("Calculating...");
  const [eta, setEta] = useState<string>("--");

  const propertyCoords: [number, number] = property?.lat && property?.lng 
    ? [property.lat, property.lng] 
    : [23.794, 90.4043]; // Default Banani

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.error("Geo error", err);
          setUserPos([23.7776, 90.4174]); // Fallback Gulshan 1
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !userPos) return;

    if (leafletInstance.current) {
      leafletInstance.current.remove();
      leafletInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      rotate: true, 
    }).setView(userPos, 16);
    
    leafletInstance.current = map;

    // Google Maps Roadmap Tile Layer for clearer navigation view
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Google Maps'
    }).addTo(map);

    // User Marker (Arrow Puck)
    const userIcon = L.divIcon({
      className: 'user-nav-marker',
      html: `<div class="nav-arrow-puck"></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
    L.marker(userPos, { icon: userIcon }).addTo(map);

    // Property Marker
    const propIcon = L.divIcon({
      className: 'prop-marker',
      html: `<div class="bg-red-500 text-white p-1.5 rounded-lg shadow-xl border-2 border-white transform -translate-x-1/2 -translate-y-full">
              <span class="material-symbols-outlined text-lg font-bold block">flag</span>
             </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });
    L.marker(propertyCoords, { icon: propIcon }).addTo(map);

    // Navigation Route Line (Google Blue)
    // Simulate a path with a waypoint for realism
    const midPoint = [
        (userPos[0] + propertyCoords[0]) / 2 + 0.002, 
        (userPos[1] + propertyCoords[1]) / 2 - 0.002
    ];
    const path = [userPos, midPoint, propertyCoords]; 
    
    const polyline = L.polyline(path, {
      color: '#4285F4', 
      weight: 8,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [100, 100] });

    // Calculate simulated stats
    const d = map.distance(userPos, propertyCoords) / 1000;
    setDistance(`${d.toFixed(1)} km`);
    setEta(`${Math.round(d * 4)} min`); 

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [userPos, propertyCoords]);

  const handleOpenGoogleMaps = () => {
    const destination = `${propertyCoords[0]},${propertyCoords[1]}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col font-display text-gray-800 overflow-hidden bg-white">
      <div ref={mapRef} className="absolute inset-0 z-0"></div>

      {/* Top Direction Banner (Google Maps Style) */}
      <div className="absolute top-4 left-4 right-4 z-20 bg-[#0F9D58] rounded-xl p-4 shadow-lg flex gap-4 items-start animate-in slide-in-from-top-4 duration-500">
         <div className="text-white/90 mt-1">
            <span className="material-symbols-outlined text-4xl font-bold">turn_left</span>
         </div>
         <div className="flex-1 text-white">
            <p className="text-sm font-medium opacity-90">In 200 meters</p>
            <h2 className="text-2xl font-bold leading-tight">Turn left onto Gulshan Ave</h2>
         </div>
      </div>

      {/* Floating Control Buttons */}
      <div className="absolute right-4 top-32 flex flex-col gap-3 z-20">
         <button className="size-11 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 active:scale-90 transition-all border border-gray-100">
            <span className="material-symbols-outlined text-2xl">volume_up</span>
         </button>
         <button className="size-11 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 active:scale-90 transition-all border border-gray-100">
            <span className="material-symbols-outlined text-2xl">compass_calibration</span>
         </button>
         <button className="size-11 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 active:scale-90 transition-all border border-gray-100">
            <span className="material-symbols-outlined text-2xl">search</span>
         </button>
      </div>

      {/* Bottom Info Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.15)] p-5 pb-8 animate-in slide-in-from-bottom-10 duration-500">
         <div className="flex justify-center mb-2">
            <div className="w-10 h-1.5 bg-gray-300 rounded-full"></div>
         </div>
         
         <div className="flex items-center justify-between mb-6 px-1">
            <div>
               <h3 className="text-[#0F9D58] text-2xl font-bold tracking-tight">{eta} <span className="text-gray-500 text-lg font-normal">({distance})</span></h3>
               <p className="text-gray-500 text-sm font-medium">Fastest route • Usual traffic</p>
            </div>
            <button onClick={onBack} className="bg-gray-100 p-2.5 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
               <span className="material-symbols-outlined text-2xl">close</span>
            </button>
         </div>

         <div className="flex gap-3">
            <button 
               onClick={handleOpenGoogleMaps}
               className="flex-1 bg-white border border-gray-200 h-12 rounded-full flex items-center justify-center gap-2 shadow-sm active:bg-gray-50 transition-all active:scale-[0.98]"
            >
               <span className="material-symbols-outlined text-red-500 text-xl">map</span>
               <span className="text-gray-800 font-bold text-sm">Open Maps</span>
            </button>
            <button className="flex-1 bg-[#4285F4] text-white h-12 rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all shadow-blue-500/30">
               <span className="material-symbols-outlined font-bold text-xl">near_me</span>
               <span className="font-bold text-sm">Start</span>
            </button>
         </div>
      </div>

      <style>{`
        .nav-arrow-puck {
           width: 20px; 
           height: 20px; 
           background: #4285F4;
           border: 3px solid white;
           border-radius: 50%;
           box-shadow: 0 0 0 10px rgba(66, 133, 244, 0.2);
           position: relative;
        }
        .nav-arrow-puck::after {
           content: '';
           position: absolute;
           top: -6px;
           left: 50%;
           transform: translateX(-50%);
           border-left: 6px solid transparent;
           border-right: 6px solid transparent;
           border-bottom: 8px solid white;
        }
        .user-nav-marker {
           background: transparent;
           border: none;
           display: flex;
           justify-content: center;
           align-items: center;
        }
        .prop-marker {
           background: transparent;
           border: none;
        }
      `}</style>
    </div>
  );
};

export default RouteNavigationView;
