
import React from 'react';
import { Provider } from '../types';

interface Props {
  serviceName: string;
  onBack: () => void;
  onSelect: (p: Provider) => void;
}

const MOCK_PROVIDERS: Provider[] = [
  { id: '1', name: 'Ariful Islam', rating: 4.9, jobsDone: 120, location: 'Banani, Dhaka', price: '৳ 500/hr', category: 'Maintenance', online: true, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaX6sDjQxpvUGeB_0Not7GzlTANyX0X71oCtAQZnlfX-kNT3gwtoOBsEs1UeWpAm1ath0eBsxXu5SwYrJt0xkZt--1UO42wIRyfJiY1FbTZm_4n6S6LEOmFKpTF-fwJLpQVvN2yMO8iKFMIaVhmTdA2gkLZWk0SwOMa0Wi8KmJ2TnMkZo9Sql6FCefcWPX7V5nrbVNpjksJVtryOenL8Z38OAV6uzzy9zr7Z20NN-5foEcNq_zB9akXMpZrujmbxb0WY3foZr7iTA' },
  { id: '2', name: 'Sajid Ahmed', rating: 4.8, jobsDone: 85, location: 'Gulshan 2, Dhaka', price: '৳ 450/hr', category: 'Maintenance', online: true, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2P23xSt_QO7ql4zx9lRAcA5BoUbVN4r4oQaRGdXr2FrDbFRlp3gZkO4REXonGfJxr2kkU-dtMwvCfHxXG75QunNYy52QxAGBoOqgGtbHSwl8dctQDKGafprQEPbb2Ur31_YvIM3SmEWP6vziybyjw47B8QBT-zvHCMOsZ47Ibl5Tz0EzKK-lkBw10Ymi0XbCEnQh47eTuXsmT9kuA9ei-e0ejiie772Z7yRmRSbUDPN7lTBq_tzqd1MDWyAkm74VKgcLhptO-Qfc' },
  { id: '3', name: 'Rafiqul Islam', rating: 4.7, jobsDone: 200, location: 'Uttara, Dhaka', price: '৳ 600/hr', category: 'Maintenance', online: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiM5NOytiy4bbLWb8h2Phn0KlhShmtmcRrtRimzppompSmQtK22ZRvooI9cTXWwR8pYxxbo7QmyugMgOzL10ZMWeqnXjTNl0B7yGP8Iw8a7NKtThbfvZeO1JdVl9debOOYg5UJDneYhueDGVBLVAi0AoV9AkvZQdo-PBXEfDT9TaKnGIIrwfYFI5D7f8D-GeApro0yjn5P9Ouq0tLXrRGw7U4s706QqLVurd8pop3_G8CpF51aRXIuSdp3VsXwXOGB8LV8Ug3QmIA' }
];

const ProviderSelectionScreen: React.FC<Props> = ({ serviceName, onBack, onSelect }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[480px] mx-auto bg-background-dark font-display text-white">
      <header className="flex items-center p-6 pb-2 justify-between sticky top-0 z-50 bg-background-dark/80 backdrop-blur-md">
        <button onClick={onBack} className="flex size-12 items-center justify-center rounded-full glass-card hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-white">arrow_back_ios_new</span>
        </button>
        <button className="flex size-12 items-center justify-center rounded-full glass-card hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-white">more_horiz</span>
        </button>
      </header>

      <div className="px-6 pt-6">
        <h1 className="text-primary tracking-[0.1em] text-sm font-extrabold leading-tight text-left uppercase">
          Select Provider
        </h1>
        <h2 className="text-white text-3xl font-bold mt-1 italic">{serviceName}</h2>
      </div>

      <div className="flex gap-3 px-6 py-6 overflow-x-auto no-scrollbar">
        {['Top Rated', 'Near Me', 'Lowest Price'].map((chip, i) => (
          <div key={i} className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full border px-5 transition-colors ${i === 0 ? 'border-primary bg-primary/10 text-primary' : 'glass-card text-white/70'}`}>
            <p className="text-sm font-semibold leading-normal">{chip}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-20">
        {MOCK_PROVIDERS.map((p) => (
          <div key={p.id} onClick={() => onSelect(p)} className="glass-card flex items-center gap-4 px-4 py-4 rounded-xl justify-between cursor-pointer hover:bg-white/5 transition-all border border-white/5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="size-14 rounded-full bg-cover bg-center border border-white/10" style={{ backgroundImage: `url("${p.image}")` }}></div>
                {p.online && <div className="absolute bottom-0 right-0 size-3.5 bg-green-500 rounded-full border-2 border-[#102220]"></div>}
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <p className="text-white text-base font-bold leading-tight uppercase italic">{p.name}</p>
                  <div className={`size-2 rounded-full transition-all duration-500 ${p.online ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]' : 'bg-white/20'}`} title={p.online ? 'Online' : 'Offline'}></div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-yellow-400 text-[14px] fill-1">star</span>
                  <p className="text-[#9db9b7] text-xs font-medium leading-none">{p.rating} ({p.jobsDone}+ Jobs Done)</p>
                </div>
                <p className="text-[#9db9b7]/60 text-[11px] font-normal leading-normal mt-0.5 uppercase tracking-wider">{p.location}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-primary text-lg font-extrabold leading-none">{p.price}</p>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-background-dark transition-all">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .fill-1 { font-variation-settings: 'FILL' 1; }
      `}</style>
    </div>
  );
};

export default ProviderSelectionScreen;
