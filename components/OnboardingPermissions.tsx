import React, { useState } from 'react';

interface Props {
  onFinish: () => void;
}

const OnboardingPermissions: React.FC<Props> = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  const permissions = [
    {
      id: 'location',
      title: 'Real-time Location',
      description: 'Access your location to find properties near you on Google Maps automatically.',
      icon: 'my_location',
      color: 'text-primary'
    },
    {
      id: 'contacts',
      title: 'Secure Contacts',
      description: 'Find friends and verified landlords easily in your contacts to send money securely.',
      icon: 'contacts',
      color: 'text-blue-400'
    },
    {
      id: 'sms',
      title: 'SMS & OTP Sync',
      description: 'Automatically fill verification codes from messages for a frictionless login experience.',
      icon: 'sms',
      color: 'text-emerald-400'
    },
    {
      id: 'camera',
      title: 'Camera & Gallery',
      description: 'Capture property photos or upload from your gallery directly to your advertisements.',
      icon: 'photo_camera',
      color: 'text-orange-400'
    }
  ];

  const handleNext = () => {
    if (step < permissions.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const current = permissions[step];

  return (
    <div className="relative min-h-screen bg-background-dark flex items-center justify-center p-6 overflow-hidden font-display">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-10%] w-[60%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 map-overlay opacity-10 grayscale brightness-50 pointer-events-none"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12 w-full px-12">
          {permissions.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary' : 'bg-white/10'}`}
            ></div>
          ))}
        </div>

        {/* Content Card */}
        <div className="w-full glass-card rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 border border-white/10 bg-black/40 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
          <div className="relative">
            <div className={`absolute inset-0 ${current.color} opacity-20 blur-3xl rounded-full scale-150`}></div>
            <div className={`relative size-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center ${current.color} shadow-2xl`}>
              <span className="material-symbols-outlined text-5xl animate-pulse" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
                {current.icon}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-white text-2xl font-black tracking-tight uppercase italic">{current.title}</h2>
            <p className="text-white/50 text-sm leading-relaxed font-medium">
              {current.description}
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <button 
              onClick={handleNext}
              className="w-full h-16 bg-primary text-background-dark font-black text-sm tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase italic"
            >
              Grant Access
            </button>
            <button 
              onClick={handleNext}
              className="w-full h-10 text-white/30 font-black text-[10px] tracking-[0.1em] uppercase hover:text-white/60 transition-colors"
            >
              Skip for now
            </button>
          </div>

          <div className="pt-4 border-t border-white/5 w-full">
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Privacy Protected by Duyar</p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-2">
          <h1 className="text-white text-xl font-extrabold tracking-tight opacity-20 italic">DUYAR REAL ESTATE</h1>
          <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">Installation Setup</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPermissions;
