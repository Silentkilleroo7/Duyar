
import React, { useState, useRef, useEffect } from 'react';

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

const MOCK_SUGGESTIONS: Suggestion[] = [
  { label: 'Road 12, Banani, Dhaka', lat: 23.7937, lng: 90.4066 },
  { label: 'Road 7, Block D, Banani, Dhaka', lat: 23.7940, lng: 90.4043 },
  { label: 'Sector 4, Road 18, Uttara, Dhaka', lat: 23.8712, lng: 90.3934 },
  { label: 'Block C, Bashundhara R/A, Dhaka', lat: 23.8161, lng: 90.4265 },
  { label: 'Road 27, Dhanmondi, Dhaka', lat: 23.7509, lng: 90.3776 },
];

interface Props {
  onBack: () => void;
  onSubmit: (data?: any) => void;
  userProfile?: any;
}

const LandlordApplication: React.FC<Props> = ({ onBack, onSubmit, userProfile }) => {
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [nidNumber, setNidNumber] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('Road 12, Banani, Dhaka');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pinnedCoords, setPinnedCoords] = useState<[number, number]>([23.7937, 90.4066]);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);

  const handleSubmit = () => {
    onSubmit({
      name: fullName.trim() || userProfile?.full_name || 'Resident Landlord',
      nidNumber: nidNumber.trim() || '1990823412389',
      propertyName: propertyName.trim() || 'Duyar Verified Residence',
      propertyAddress: address.trim() || 'Banani, Dhaka'
    });
  };

  const handleAddressChange = (val: string) => {
    setAddress(val);
    if (val.trim().length > 1) {
      const filtered = MOCK_SUGGESTIONS.filter(s => 
        s.label.toLowerCase().includes(val.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    setAddress(s.label);
    setSuggestions([]);
    setPinnedCoords([s.lat, s.lng]);
    
    if (leafletInstance.current) {
      leafletInstance.current.flyTo([s.lat, s.lng], 17, { animate: true, duration: 2.0 });
    }
  };

  useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    if (address.length > 5 && mapRef.current) {
      if (!leafletInstance.current) {
        leafletInstance.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView(pinnedCoords, 16);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletInstance.current);
        
        markerInstance.current = L.marker(pinnedCoords, {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div class='marker-pin'></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
          }),
          draggable: true
        }).addTo(leafletInstance.current);
      } else {
        markerInstance.current.setLatLng(pinnedCoords);
      }
    }

    return () => {
      if (leafletInstance.current && address.length <= 5) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [address.length > 5, pinnedCoords]);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display text-white overflow-x-hidden max-w-[430px] mx-auto selection:bg-primary/30">
      <header className="px-5 pt-14 pb-6 flex items-center gap-4 relative z-10 bg-background-dark/40 backdrop-blur-xl border-b border-white/5">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div>
          <h1 className="text-primary tracking-tighter text-2xl font-black italic uppercase">Landlord App</h1>
          <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.3em] leading-none mt-1">Official Enrollment</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-32 no-scrollbar relative z-10">
        <div className="space-y-6">
          <section className="space-y-4">
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2 italic">Primary Identity</p>
             <div className="glass-card rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] space-y-4 shadow-xl">
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Full Name (As per NID)</label>
                   <input 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" 
                      placeholder="Enter full legal name" 
                   />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">National ID Number</label>
                   <input 
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" 
                      placeholder="10 or 17 digit NID" 
                      type="number" 
                   />
                </div>
             </div>
          </section>

          <section className="space-y-4">
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2 italic">Asset Details</p>
             <div className="glass-card rounded-[2rem] p-6 border border-white/5 bg-white/[0.02] space-y-4 shadow-xl">
                <div className="flex flex-col gap-2">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Property Name</label>
                   <input 
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" 
                      placeholder="e.g. Skyline Heights" 
                   />
                </div>
                <div className="flex flex-col gap-2 relative">
                   <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Property Address</label>
                   <div className="relative">
                      <input 
                        value={address}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 pl-12 pr-5 text-sm font-bold focus:border-primary/40 outline-none transition-all" 
                        placeholder="Search or type address..." 
                      />
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">location_on</span>
                   </div>
                   
                   {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-[#102220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-40 overflow-y-auto no-scrollbar">
                        {suggestions.map((s, i) => (
                          <button key={i} type="button" onClick={() => selectSuggestion(s)} className="w-full text-left px-5 py-4 border-b border-white/5 last:border-none hover:bg-primary/10 transition-colors flex items-center gap-3">
                            <span className="text-xs font-bold text-white/90">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>

                {address.length > 5 && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden glass-card border border-primary/20 relative animate-in fade-in duration-500">
                    <div ref={mapRef} className="w-full h-full grayscale opacity-80"></div>
                  </div>
                )}
             </div>
          </section>

          <section className="space-y-4">
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2 italic">Legal Documents</p>
             <div className="grid grid-cols-2 gap-3">
                <button className="glass-card aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 border-dashed border-2 border-white/10 hover:border-primary/40 transition-all group">
                   <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-background-dark transition-all">
                      <span className="material-symbols-outlined text-2xl">badge</span>
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/40">NID Front</p>
                </button>
                <button className="glass-card aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 border-dashed border-2 border-white/10 hover:border-primary/40 transition-all group">
                   <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-background-dark transition-all">
                      <span className="material-symbols-outlined text-2xl">receipt_long</span>
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Tax Document</p>
                </button>
             </div>
          </section>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto p-6 bg-gradient-to-t from-background-dark via-background-dark/95 to-transparent pt-12 z-20">
        <button onClick={handleSubmit} className="w-full h-18 bg-primary text-background-dark font-black rounded-[1.5rem] tracking-[0.2em] shadow-[0_15px_40px_rgba(19,236,218,0.3)] uppercase transition-all active:scale-95 text-xs italic">
          SUBMIT OFFICIAL APPLICATION
        </button>
      </div>

      <style>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .h-18 { height: 4.5rem; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default LandlordApplication;
