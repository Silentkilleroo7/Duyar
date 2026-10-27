
import React, { useState } from 'react';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import { haptics } from '../haptics';
import { ServiceInfoModal } from './ServiceInfoModal';
import { t } from '../translations';

interface Props {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  activeTab: string;
  lang?: 'EN' | 'BN';
}

const ServicesHub: React.FC<Props> = ({ onBack, onNavigate, lang = 'EN' }) => {
  const [selectedInfoService, setSelectedInfoService] = useState<string | null>(null);
  const isBn = lang === 'BN';
  const text = t[isBn ? 'BN' : 'EN'].services;

  const categories = [
    { 
      id: Screen.SECURITY_BOOKING, 
      label: text.securityGuard, 
      originalName: 'Security Guard',
      icon: 'shield_person', 
      color: 'bg-blue-500/10 text-blue-400' 
    },
    { 
      id: Screen.MAID_BOOKING, 
      label: text.maid, 
      originalName: 'Maid',
      icon: 'cleaning_services', 
      color: 'bg-emerald-500/10 text-emerald-500' 
    },
    { 
      id: Screen.MAINTENANCE_HUB, 
      label: text.maintenance, 
      originalName: 'Maintenance',
      icon: 'construction', 
      color: 'bg-yellow-500/10 text-yellow-500' 
    },
    { 
      id: Screen.PICK_DROP_BOOKING, 
      label: text.pickDrop, 
      originalName: 'Pick & Drop',
      icon: 'local_shipping', 
      color: 'bg-orange-500/10 text-orange-500' 
    },
    { 
      id: Screen.EMERGENCY_HELP, 
      label: text.emergencySos, 
      originalName: 'Emergency SOS',
      icon: 'sos', 
      color: 'bg-red-500/10 text-red-500', 
      isUrgent: true 
    },
  ];

  return (
    <div className="w-full max-w-[430px] min-h-screen flex flex-col px-5 pt-14 pb-44 relative overflow-hidden mx-auto bg-background-dark font-display text-white selection:bg-primary/30">
      <div className="flex items-center gap-4 mb-10 px-1 relative z-10">
        <button onClick={onBack} className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-white/60">arrow_back</span>
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="text-primary font-black text-4xl tracking-tighter uppercase italic leading-none">
            {text.title}
          </h1>
          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">{text.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 relative z-10 overflow-y-auto no-scrollbar pb-10">
        {categories.map((cat, i) => (
          <div 
            key={i}
            onClick={() => {
              haptics.dashboardNavigated();
              onNavigate(cat.id);
            }}
            className={`glass rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-5 transition-all active:scale-95 cursor-pointer group h-[180px] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] shadow-2xl relative overflow-hidden ${cat.isUrgent ? 'border-red-500/20 bg-red-500/5' : ''}`}
          >
            {cat.isUrgent && (
               <div className="absolute top-3 right-5">
                  <div className="size-1.5 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
               </div>
            )}
            {!cat.isUrgent && (
              <button
                type="button"
                title="View detailed service info & swipe down to dismiss"
                onClick={(e) => {
                  e.stopPropagation();
                  haptics.selection();
                  setSelectedInfoService(cat.originalName);
                }}
                className="absolute top-4 left-4 size-7 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary text-white/50 flex items-center justify-center border border-white/10 active:scale-90 transition-all z-10"
              >
                <span className="material-symbols-outlined text-xs">info</span>
              </button>
            )}
            <div className={`w-16 h-16 flex items-center justify-center rounded-2xl ${cat.color} group-hover:scale-110 transition-all shadow-inner border border-white/5`}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', fontVariationSettings: "'wght' 700" }}>{cat.icon}</span>
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase text-white text-center italic">{cat.label}</span>
          </div>
        ))}
      </div>

      <ServiceInfoModal
        isOpen={Boolean(selectedInfoService)}
        serviceName={selectedInfoService || ''}
        onClose={() => setSelectedInfoService(null)}
        onBook={(srv) => {
          setSelectedInfoService(null);
          const targetCat = categories.find(c => c.originalName.toLowerCase().includes(srv.toLowerCase()) || srv.toLowerCase().includes(c.originalName.toLowerCase()));
          if (targetCat) {
            onNavigate(targetCat.id);
          } else {
            onNavigate(Screen.MAINTENANCE_HUB);
          }
        }}
      />

      <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <BottomNav activeTab="SERVICES" onNavigate={onNavigate} lang={lang} />

      <style>{`
        .glass {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 0.5px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default ServicesHub;
