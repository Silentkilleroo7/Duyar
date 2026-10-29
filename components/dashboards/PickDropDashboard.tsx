import React, { useState, useEffect, useRef } from 'react';
import { 
  getActivePickDropRequest, 
  getAllPickDropHistory,
  DEFAULT_PICKDROP_REQUEST, 
  PickDropRequest, 
  acceptPickDropRequest,
  releasePickDropRequestToPending
} from '../../pickDropStorage';
import { haptics } from '../../haptics';

interface Props {
  onBack: () => void;
  onTrack: () => void;
  userProfile?: any;
}

const PickDropDashboard: React.FC<Props> = ({ onBack, onTrack, userProfile }) => {
  const [request, setRequest] = useState<PickDropRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PickDropRequest[]>([]);
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);

  const driverName = userProfile?.full_name || 'Sajid Ahmed';
  const driverPhone = userProfile?.phone || '+880 1966-778899';

  const syncRequests = () => {
    const active = getActivePickDropRequest() || DEFAULT_PICKDROP_REQUEST;
    setRequest(active);
    const history = getAllPickDropHistory();
    setPendingRequests(history.filter(r => r.status === 'PENDING'));
  };

  useEffect(() => {
    syncRequests();

    const handleUpdate = (e: any) => {
      syncRequests();
    };
    window.addEventListener('duyar_pickdrop_updated', handleUpdate);
    return () => window.removeEventListener('duyar_pickdrop_updated', handleUpdate);
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current) return;

    if (!leafletInstance.current) {
      const coords: [number, number] = [23.794, 90.4043];
      leafletInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(coords, 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletInstance.current);

      // User/Vehicle Marker
      const icon = L.divIcon({
        className: 'vehicle-marker',
        html: `<div class="relative flex items-center justify-center">
                <div class="size-6 bg-primary rounded-full border-4 border-background-dark shadow-[0_0_20px_rgba(19,236,218,1)]"></div>
                <div class="absolute -top-10 bg-primary px-3 py-1 rounded-lg text-background-dark font-black text-[10px] uppercase tracking-widest whitespace-nowrap shadow-xl">On Trip</div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      L.marker(coords, { icon }).addTo(leafletInstance.current);
    }

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, []);

  const handleAcceptPending = (reqItem: PickDropRequest) => {
    haptics.bookingConfirmed();
    acceptPickDropRequest(reqItem.id, {
      name: driverName,
      phone: driverPhone,
      vehicleNo: 'Dhaka Metro-Ta 14-8821'
    });
    setToastMessage(`Accepted moving job #${reqItem.id}! Status is now ACTIVE.`);
    syncRequests();
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCallCustomer = () => {
    window.location.href = 'tel:+8801977347402';
  };

  const handleReleasePriceMismatch = (reqId: string) => {
    haptics.selection();
    releasePickDropRequestToPending(reqId, 'Driver could not agree on fare');
    setToastMessage(`Trip #${reqId} released due to price disagreement. Re-broadcasted to pending queue for other drivers.`);
    syncRequests();
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-background-dark font-display text-white overflow-hidden relative">
      {/* Background Map Container */}
      <div ref={mapRef} className="absolute inset-0 z-0 brightness-50 contrast-125"></div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-background-dark via-transparent to-background-dark/60 pointer-events-none"></div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] animate-in fade-in duration-300">
          <div className="glass-card bg-[#0e211e]/95 border border-primary/40 rounded-2xl p-3 shadow-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl font-black">check_circle</span>
            <p className="text-white text-xs font-bold leading-snug">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-10 px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="size-11 rounded-full flex items-center justify-center glass-button text-white border border-white/10 backdrop-blur-xl bg-background-dark/20 active:scale-95 transition-transform">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black italic tracking-tight uppercase leading-none">Driver Trip Management</h1>
            <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mt-1.5">Pick & Drop Dashboard</p>
          </div>
        </div>
        <div className="bg-primary/20 border border-primary/30 px-4 py-2 rounded-2xl">
          <p className="text-primary text-[10px] font-black uppercase tracking-widest italic leading-none">
            {request ? `Fare: ৳${request.fare}` : 'Standby Mode'}
          </p>
        </div>
      </header>

      {/* Trip Drawer (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 max-w-md mx-auto max-h-[85vh] overflow-y-auto no-scrollbar">
        <div className="glass-drawer rounded-[2.5rem] p-6 pb-10 border border-white/10 backdrop-blur-3xl bg-[#102220]/95 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] space-y-5">
           <div className="flex h-1.5 w-12 bg-white/20 rounded-full mx-auto"></div>

           {/* Pending Broadcasted Requests from Residents */}
           {pendingRequests.length > 0 && (
             <div className="space-y-3 pb-2 border-b border-white/10">
               <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black italic uppercase tracking-tight flex items-center gap-1.5 text-amber-300">
                   <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                   <span>New Broadcasted Moving Requests ({pendingRequests.length})</span>
                 </h3>
                 <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black uppercase">
                   Awaiting Driver
                 </span>
               </div>

               {pendingRequests.map(pReq => (
                 <div key={pReq.id} className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                   <div className="flex justify-between items-start">
                     <div>
                       <h4 className="text-white text-xs font-black uppercase tracking-tight">
                         {pReq.vehicle} • {pReq.items.join(', ') || 'Household Move'}
                       </h4>
                       <p className="text-[10px] text-white/60 font-medium mt-0.5 truncate max-w-[200px]">
                         📍 {pReq.pickupArea} ➔ {pReq.dropArea}
                       </p>
                     </div>
                     <span className="text-amber-300 font-black text-sm">৳{pReq.fare}</span>
                   </div>
                   <button
                     type="button"
                     onClick={() => handleAcceptPending(pReq)}
                     className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20"
                   >
                     <span className="material-symbols-outlined text-sm font-black">handshake</span>
                     <span>Accept Moving Request</span>
                   </button>
                 </div>
               ))}
             </div>
           )}
           
           {request ? (
             <>
               {/* Active Shipment Status */}
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                      <span className="material-symbols-outlined text-2xl font-black">local_shipping</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">Assigned Shipment</h3>
                      <p className="text-[10px] text-white/40 font-bold uppercase mt-1 tracking-widest italic">
                        Booking #{request.id} • {request.vehicle}
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                     <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                       {request.status.replace('_', ' ')}
                     </span>
                  </div>
               </div>

               {/* PICKUP REQUEST DETAILS & MOVING ITEMS */}
               <div className="p-4 rounded-2xl bg-black/40 border border-primary/30 space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      Pickup Request Item Details:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowFullDetailsModal(true)}
                      className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                    >
                      Full Sheet ↗
                    </button>
                  </div>

                  <p className="text-xs text-black font-semibold leading-relaxed italic bg-white p-3.5 rounded-xl border border-gray-200 shadow-md">
                    "{request.itemDetails || 'Moving cargo shipment'}"
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {request.specialNotes?.map(tag => (
                      <span key={tag} className="bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 rounded border border-primary/30">
                        ⚡ {tag}
                      </span>
                    ))}
                    {request.pickupFloor && (
                      <span className="bg-white/10 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded">
                        🪜 {request.pickupFloor} ➔ {request.dropFloor || 'Ground'}
                      </span>
                    )}
                    <span className="bg-white/10 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded">
                      👷 {request.helpers || 1} Helpers
                    </span>
                  </div>
               </div>

               {/* Route Details */}
               <div className="space-y-3 px-1">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center pt-1">
                      <div className="size-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(19,236,218,0.8)]"></div>
                      <div className="w-[1.5px] h-8 bg-white/10 my-1"></div>
                      <div className="size-2.5 rounded-full border-2 border-white/40"></div>
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                       <div>
                         <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Pickup Point</p>
                         <p className="text-white text-xs font-bold truncate">{request.pickupAddress}</p>
                       </div>
                       <div>
                         <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Drop Destination</p>
                         <p className="text-white text-xs font-bold truncate">{request.dropAddress}</p>
                       </div>
                    </div>
                  </div>
               </div>

               {/* Driver Action Buttons */}
               <div className="flex flex-col gap-2 pt-1">
                 <div className="flex gap-3">
                   {request.status === 'PENDING' ? (
                     <button
                       type="button"
                       onClick={() => {
                         acceptPickDropRequest(request.id, {
                           name: userProfile?.name || 'Verified Logistics Pilot', phone: userProfile?.phone || '+880 1819-234567', vehicleNo: 'Dhaka Metro Verified'
                         });
                         const updated = getActivePickDropRequest();
                         setRequest(updated);
                       }}
                       className="flex-1 h-14 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-2xl tracking-[0.2em] uppercase italic text-xs shadow-[0_10px_25px_rgba(251,191,36,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                       <span className="material-symbols-outlined text-base font-black">handshake</span>
                       <span>Accept Moving Request</span>
                     </button>
                   ) : (
                     <>
                       <button 
                         type="button"
                         onClick={onTrack} 
                         className="flex-[1.5] h-14 bg-primary text-background-dark font-black rounded-2xl tracking-[0.2em] uppercase italic text-xs shadow-[0_10px_25px_rgba(19,236,218,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                       >
                         <span className="material-symbols-outlined text-base">navigation</span>
                         Route Map
                       </button>
                       {request.userPhone && (
                         <a 
                           href={`tel:${request.userPhone}`}
                           className="flex-1 h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl tracking-widest uppercase text-xs italic transition-all flex items-center justify-center gap-1.5 active:scale-95"
                         >
                           <span className="material-symbols-outlined text-base">call</span>
                           Client
                         </a>
                       )}
                     </>
                   )}
                 </div>
                 {request.status !== 'PENDING' && request.status !== 'COMPLETED' && (
                   <button
                     type="button"
                     onClick={() => handleReleasePriceMismatch(request.id)}
                     className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                     title="If price negotiation does not meet, release request back to PENDING for other drivers"
                   >
                     <span className="material-symbols-outlined text-sm font-black">sync_problem</span>
                     <span>Price Mismatch • Release Trip to Other Drivers</span>
                   </button>
                 )}
               </div>
             </>
           ) : (
             <div className="py-8 flex flex-col items-center justify-center text-center">
               <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-3">
                 <span className="material-symbols-outlined text-3xl">local_shipping</span>
               </div>
               <h4 className="text-white font-black text-sm uppercase tracking-wider mb-1">
                 No Active Pick & Drop Trips
               </h4>
               <p className="text-white/40 text-xs max-w-xs leading-relaxed">
                 You are currently in standby mode. When a customer books a moving trip in your area, details will appear here.
               </p>
             </div>
           )}
        </div>
      </div>

      {/* Driver Full Request Briefing Modal */}
      {showFullDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0e1a18] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6">
            {/* Top Swipe-Down Handle */}
            <div 
              className="w-full -mt-2 mb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none group"
              onTouchStart={(e) => {
                const startY = e.touches[0].clientY;
                const onTouchMove = (ev: TouchEvent) => {
                  if (ev.touches[0].clientY - startY > 70) {
                    setShowFullDetailsModal(false);
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

            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">description</span>
                <h3 className="text-white text-sm font-black uppercase tracking-wider">
                  Pickup Request Detailed Briefing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFullDetailsModal(false)}
                className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-md">
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">
                  Client Moving Notes
                </span>
                <p className="text-black text-xs font-semibold leading-relaxed italic">
                  "{request?.itemDetails || 'Standard household items.'}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Pickup Floor</span>
                  <span className="text-black font-extrabold text-xs">{request?.pickupFloor || 'Ground Floor'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-black block mb-1">Drop Floor</span>
                  <span className="text-black font-extrabold text-xs">{request?.dropFloor || 'Ground Floor'}</span>
                </div>
              </div>

              {request?.driverInstructions && (
                <div className="p-3.5 rounded-xl bg-white border border-gray-200 space-y-1 shadow-sm">
                  <span className="text-[10px] text-gray-500 uppercase font-black block">
                    Special Entry Instructions
                  </span>
                  <p className="text-black font-semibold text-xs leading-relaxed">{request.driverInstructions}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-[10px] text-white/40 uppercase font-bold block">Special Handling Badges</span>
                <div className="flex flex-wrap gap-1.5">
                  {request?.specialNotes?.map(tag => (
                    <span key={tag} className="bg-primary/20 text-primary text-xs font-bold px-2.5 py-1 rounded-lg border border-primary/30">
                      ⚡ {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFullDetailsModal(false)}
              className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Close Briefing
            </button>
          </div>
        </div>
      )}

      <style>{`
        .glass-button { background: rgba(255, 255, 255, 0.05); }
      `}</style>
    </div>
  );
};

export default PickDropDashboard;
