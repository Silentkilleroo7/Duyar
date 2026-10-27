import React, { useState, useEffect } from 'react';
import { getStoredPublishedProperties } from '../../propertyStorage';
import { Property } from '../../types';
import { getPostedProperties } from '../../postedPropertiesStorage';
import { isUserApprovedLandlord } from '../../providerApplicationsStorage';

interface Props {
  onBack: () => void;
  onPostAd: () => void;
  userProfile?: any;
}

const LandlordDashboard: React.FC<Props> = ({ onBack, onPostAd, userProfile }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const isApproved = isUserApprovedLandlord(userProfile);
  const landlordName = userProfile?.full_name || 'Landlord Partner';

  useEffect(() => {
    const published = getStoredPublishedProperties();
    const posted = getPostedProperties();
    const combined = [...published];
    const seen = new Set(published.map(p => p.id));
    posted.forEach(p => {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        combined.push(p);
      }
    });
    setProperties(combined);
  }, []);

  return (
    <div className="min-h-screen bg-background-dark font-display text-white overflow-x-hidden pb-10">
      <header className="sticky top-0 z-50 glass px-4 pt-12 pb-4 flex items-center justify-between bg-background-dark/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="size-10 rounded-full border-2 border-primary overflow-hidden bg-cover bg-center" style={{backgroundImage: `url("${userProfile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAu6g7x3X_ODaNppEhj5y4I_JY2XmSmfeJ44CmD8q0WnXj0FdmaTsGfxnlTnBXYUW9vEPn5fKFpCRSBwRP0PpvqAjtnumOD-tv_2xifeqJRT5WPYTfPxC3BRliVhj5nnYcH0rtcE3caTBz3sOAE-vR_6FJ6jY5M4GqxBeuqtwk6SF-uXojK7Nr2sp41LU0lEzjoALeWyxDzQ-hhoF1n7QJgf4onK4Uw57NUAm4okUArHeKuydjPu-Osk7IgY8F03o9SiK3JjSq6VMQ'}")`}}></div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase italic text-primary leading-none">{landlordName}</h1>
            <div className="flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs text-emerald-400">verified</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                {isApproved ? 'Approved Landlord' : 'Verification Active'}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onPostAd} className="bg-primary hover:bg-primary/90 text-background-dark px-4 py-2.5 rounded-full text-[10px] font-black transition-all shadow-lg shadow-primary/20 flex items-center gap-1 uppercase tracking-widest">
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          Post Ad
        </button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Verification Status Banner */}
        <section className="glass-card rounded-2xl p-4 flex items-center justify-between border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-white">Landlord Verified Partner</p>
              <p className="text-[10px] text-white/60 mt-0.5">All your posted properties appear with Verified Badge on Map</p>
            </div>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Active</span>
        </section>

        {/* Top Stats */}
        <section className="grid grid-cols-2 gap-3">
          <div className="glass-card p-5 rounded-2xl col-span-2 border border-white/5 relative overflow-hidden bg-primary/5">
            <div className="absolute top-[-20%] right-[-10%] size-24 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Properties Live on Map</p>
              <span className="material-symbols-outlined text-primary text-xl">map</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-black italic">{properties.length}</h2>
              <span className="text-primary text-[10px] font-black bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">All Verified</span>
            </div>
          </div>
        </section>

        {/* Properties List */}
        <section className="space-y-4 pb-8">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-black uppercase tracking-[0.1em] italic">Your Properties</h3>
            <button onClick={onPostAd} className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">add_circle</span> Post New
            </button>
          </div>
          <div className="space-y-3">
            {properties.map((prop, i) => (
              <div key={prop.id || i} className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-cover bg-center border border-white/10 shrink-0" style={{backgroundImage: `url("${prop.image}")`}}></div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-black italic tracking-tighter leading-none truncate max-w-[170px]">{prop.title}</p>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1.5 truncate max-w-[170px]">{prop.location}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest border mb-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <span className="material-symbols-outlined text-[10px]">verified</span>
                    VERIFIED
                  </span>
                  <p className="text-xs font-black text-white italic">{prop.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default LandlordDashboard;
