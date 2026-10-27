
import React, { useState, useMemo } from 'react';
// Import Property type for the property prop
import { Property } from '../types';
import { addPropertyVisit } from '../visitStorage';
import { haptics } from '../haptics';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
  property?: Property | null;
  userProfile?: any;
}

const BookVisitScreen: React.FC<Props> = ({ onBack, onConfirm, property, userProfile }) => {
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState(1);

  // Generate the next 7 days dynamically
  const dates = useMemo(() => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const result = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date();
      nextDate.setDate(today.getDate() + i);
      result.push({
        day: days[nextDate.getDay()],
        date: nextDate.getDate(),
        full: nextDate.toDateString()
      });
    }
    return result;
  }, []);

  const timeSlots = [
    '10:00 AM',
    '11:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM',
    '05:30 PM'
  ];

  const handleConfirm = () => {
    haptics.bookingConfirmed();
    try {
      const userPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone') || '+8801977347402';
      addPropertyVisit({
        propertyId: property?.id || 'prop-1',
        propertyTitle: property?.title || 'Modern 3BHK Luxury Flat',
        propertyImage: property?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNyzqhaWMRKt20pJlTTYPx97uhBwkRsJJIQP9bBD6G7myv3QPBoOCggmodkBmZ1crZZHI0QxaGIg8GsebmyLZzbhzqhrfMgI_EhOgwIbksb4AxagQfj9S2hqUWtTwIP01gy21hTJskVnRXUzZrEiYx_FBXn7aFyxgMC_LufEH1D2O0qFOOniM2AX_SeU3bZ2wkSz58ZJeTaV-QEnX32StqyDET-FS8sUErR2s5sXLHZS-NFj3jlql5I9Uy9XopupquPiVzRn2X39M',
        propertyLocation: property?.location || 'Banani, Dhaka',
        propertyPrice: property?.price || '৳ 45,000',
        scheduledDate: dates[selectedDateIdx]?.full || 'Upcoming Date',
        scheduledTime: timeSlots[selectedSlotIdx] || '10:30 AM',
        userPhone,
        userId: userProfile?.id,
        landlordName: (property as any)?.landlordName || 'Tanvir Ahmed',
        landlordPhone: (property as any)?.landlordPhone || '+880 1711-223344'
      });
    } catch (e) {
      console.error('Failed to persist visit:', e);
    }
    onConfirm();
  };

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col max-w-[430px] mx-auto px-4 pt-6 pb-10 font-display text-white selection:bg-primary/30">
      <div className="absolute inset-0 z-[-1] opacity-40 grayscale contrast-125">
        <div className="w-full h-full bg-center bg-cover" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBxvW7zy9tqzHAsPw3jMFdMYBcoyjXMnQJpT-yf9wDmSoPkXPeDVBG2LSvvC1DY6EfY0_E1RKlvBCjviKk0TgV3dlXSa8EaR5pLFB0o-mhK9CSL-kyppUSK4dz3LGeGgc3jNHPz1JqsBO0m10Ur_p7PGa5QRNAWLDTozXTEwGNOruhtEz0SPkYv-whnidxz_-2UHY0OxyFeAB428tu3SAQ-u2Gkvd1DEazq7JQgq691SLHwx0sb-VgUGbe9tHuj8NkpP1ARvRTEKIA')"}}></div>
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex size-12 items-center justify-center rounded-full glass hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-white">chevron_left</span>
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-primary text-2xl font-bold tracking-wider leading-tight uppercase italic">Schedule Visit</h1>
      </div>

      <div className="glass-card rounded-2xl p-3 mb-8 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="size-20 rounded-xl bg-center bg-cover shrink-0" style={{backgroundImage: `url("${property?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBNyzqhaWMRKt20pJlTTYPx97uhBwkRsJJIQP9bBD6G7myv3QPBoOCggmodkBmZ1crZZHI0QxaGIg8GsebmyLZzbhzqhrfMgI_EhOgwIbksb4AxagQfj9S2hqUWtTwIP01gy21hTJskVnRXUzZrEiYx_FBXn7aFyxgMC_LufEH1D2O0qFOOniM2AX_SeU3bZ2wkSz58ZJeTaV-QEnX32StqyDET-FS8sUErR2s5sXLHZS-NFj3jlql5I9Uy9XopupquPiVzRn2X39M'}")`}}></div>
          <div className="flex flex-col">
            <p className="text-white text-base font-bold leading-tight">{property?.title || 'Modern 3BHK Luxury Flat'}</p>
            <div className="flex items-center gap-1 mt-1 text-white/60">
              <span className="material-symbols-outlined text-xs">location_on</span>
              <p className="text-xs font-normal">{property?.location || 'Banani, Dhaka'}</p>
            </div>
            <p className="text-primary text-sm font-bold mt-1">{property?.price || '৳ 45,000'}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-white/80 text-sm font-semibold mb-3 uppercase tracking-widest px-1">Select Date</h3>
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
          {dates.map((item, i) => (
            <button 
              key={i} 
              onClick={() => {
                haptics.selection();
                setSelectedDateIdx(i);
              }}
              className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-2xl glass border transition-all ${selectedDateIdx === i ? 'border-primary bg-primary text-background-dark shadow-lg shadow-primary/20' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
            >
              <p className={`text-[10px] font-black tracking-widest ${selectedDateIdx === i ? 'text-background-dark' : 'text-primary'}`}>{item.day}</p>
              <p className={`text-xl font-black ${selectedDateIdx === i ? 'text-background-dark' : 'text-white'}`}>{item.date}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-white/80 text-sm font-semibold mb-3 uppercase tracking-widest px-1">Available Slots</h3>
        <div className="grid grid-cols-2 gap-3">
          {timeSlots.map((time, i) => (
            <button 
              key={time} 
              onClick={() => {
                haptics.selection();
                setSelectedSlotIdx(i);
              }}
              className={`flex h-12 items-center justify-center rounded-full glass border transition-all cursor-pointer ${selectedSlotIdx === i ? 'bg-primary border-none text-background-dark font-black shadow-lg shadow-primary/30' : 'border-white/10 text-white/80 hover:bg-white/5'}`}
            >
              <p className="text-xs font-bold uppercase tracking-wider">{time}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <button 
          onClick={handleConfirm}
          className="w-full h-16 bg-primary rounded-2xl flex items-center justify-center gap-3 shadow-[0_8px_24px_rgba(19,236,218,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="text-background-dark text-base font-black uppercase tracking-widest italic">Confirm Visit</span>
          <span className="material-symbols-outlined text-background-dark font-black">arrow_forward</span>
        </button>
        <p className="text-center text-white/30 text-[9px] mt-4 uppercase font-black tracking-[0.2em]">Free cancellation up to 24h before</p>
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default BookVisitScreen;
