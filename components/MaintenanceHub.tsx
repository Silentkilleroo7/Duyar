
import React, { useState } from 'react';
import { ServiceInfoModal } from './ServiceInfoModal';
import { haptics } from '../haptics';

interface Props {
  onBack: () => void;
  onSelect: (service: string) => void;
  lang?: 'EN' | 'BN';
}

const MaintenanceHub: React.FC<Props> = ({ onBack, onSelect, lang = 'EN' }) => {
  const [selectedInfoService, setSelectedInfoService] = useState<string | null>(null);
  const isBn = lang === 'BN';

  const services = [
    { 
      originalName: 'Electrical', 
      name: isBn ? 'বৈদ্যুতিক কাজ' : 'Electrical', 
      icon: 'bolt', 
      desc: isBn ? 'ওয়্যারিং, ফ্যান, লাইটিং, ব্রেকার' : 'Wiring, Fans, Lights' 
    },
    { 
      originalName: 'Plumbing', 
      name: isBn ? 'প্লাম্বিং ও পাইপলাইন' : 'Plumbing', 
      icon: 'plumbing', 
      desc: isBn ? 'পানি লিকেজ, ট্যাপ, ড্রেনেজ, গিজার' : 'Leaks, Taps, Drainage' 
    },
    { 
      originalName: 'Painting', 
      name: isBn ? 'রং ও দেয়াল সজ্জা' : 'Painting', 
      icon: 'brush', 
      desc: isBn ? 'পুরো বাসা পেইন্টিং, ড্যাম্প প্রতিরোধ' : 'Full House, Touch-ups' 
    },
    { 
      originalName: 'Appliance Repair', 
      name: isBn ? 'যন্ত্রপাতি মেরামত' : 'Appliance Repair', 
      icon: 'home_repair_service', 
      desc: isBn ? 'ফ্রিজ, এসি, ওয়াশিং মেশিন' : 'Fridge, Washing Machine' 
    },
    { 
      originalName: 'Cleaning', 
      name: isBn ? 'সার্বিক পরিচ্ছন্নতা' : 'Cleaning', 
      icon: 'sanitizer', 
      desc: isBn ? 'ডিপ ক্লিন, সোফা, কিচেন ওয়াশ' : 'Deep Clean, Sofa' 
    },
    { 
      originalName: 'Security', 
      name: isBn ? 'নিরাপত্তা ও সিসিটিভি' : 'Security', 
      icon: 'shield', 
      desc: isBn ? 'সিসিটিভি, গার্ড নিয়োগ, ইন্টারকম' : 'CCTV, Guard Hire' 
    }
  ];

  return (
    <div className="min-h-screen bg-background-dark text-white font-display flex flex-col relative overflow-x-hidden max-w-[430px] mx-auto">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      <header className="relative z-10 px-6 pt-12 pb-6 border-b border-white/5 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase leading-none">
            {isBn ? 'রক্ষণাবেক্ষণ ও সেবা' : 'Maintenance'}
          </h1>
          <p className="text-[10px] text-white/40 font-bold tracking-[0.2em] uppercase mt-1">
            {isBn ? 'দক্ষ ও পেশাদার গৃহ মেরামত সেবা' : 'Professional Home Services'}
          </p>
        </div>
      </header>

      <main className="relative z-10 flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-2 gap-4">
          {services.map((s) => (
            <div 
              key={s.originalName} 
              onClick={() => onSelect(s.originalName)}
              className="glass-card rounded-3xl p-5 flex flex-col gap-3 border border-white/5 hover:border-primary/40 transition-all cursor-pointer group active:scale-[0.98] relative"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                </div>
                <button
                  type="button"
                  title="View detailed service info & swipe down to dismiss"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.selection();
                    setSelectedInfoService(s.originalName);
                  }}
                  className="size-7 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary text-white/50 flex items-center justify-center border border-white/10 active:scale-90 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">info</span>
                </button>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{s.name}</h4>
                <p className="text-[10px] text-white/40 font-medium leading-tight mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-[2rem] p-6 bg-primary/5 border border-primary/20 mt-4 relative overflow-hidden mb-12">
          <div className="relative z-10">
            <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">Duyar Shield</p>
            <h4 className="text-white font-bold text-lg leading-tight italic">
              {isBn ? 'বার্ষিক গৃহ রক্ষণাবেক্ষণ প্ল্যান' : 'Annual Maintenance Plan'}
            </h4>
            <p className="text-white/60 text-xs mt-2">
              {isBn ? '১২ মাসের জন্য অগ্রাধিকার ভিত্তিক সেবা ও ফ্রি পরিদর্শন সুবিধা গ্রহণ করুন।' : 'Get priority support and free inspections for 12 months.'}
            </p>
            <button className="mt-4 bg-primary text-background-dark font-black px-6 py-2.5 rounded-full text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20 transition-transform active:scale-95">
              {isBn ? 'এখনই সাবস্ক্রাইব করুন' : 'Subscribe Now'}
            </button>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[100px]">verified_user</span>
          </div>
        </div>
      </main>

      <ServiceInfoModal
        isOpen={Boolean(selectedInfoService)}
        serviceName={selectedInfoService || ''}
        onClose={() => setSelectedInfoService(null)}
        onBook={(srv) => {
          setSelectedInfoService(null);
          onSelect(srv);
        }}
      />

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default MaintenanceHub;
