
import React, { useState, useEffect } from 'react';
import { getSearchAlerts, SearchAlert } from '../../searchAlertStorage';
import { getStoredPublishedProperties } from '../../propertyStorage';

interface Props {
  onBack: () => void;
  onPostAd?: () => void;
  userProfile?: any;
}

const LocatorDashboard: React.FC<Props> = ({ onBack, onPostAd, userProfile }) => {
  const locatorName = userProfile?.full_name || 'Alex Sterling';
  const locatorAvatar = userProfile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFtey0SrTueToR1BwWZbRKzciO96qP6YFmN-SvIJht45_c9o9oSIv7K-blSAMuJlD-nSTgnTrVH2dTz6vSPPBj0WVPS3ft2Ur8TW4B4QKLrXKQlFvXDiooGvL49l7V59jF_6RKpQi4MXLm4t6nQs_es3coiHAgf1m8BC_QCBLtW_jZ1xqoaQKFDBSY4LKHtFI6v0KlZAm85VsQlSWaPpG5DHw5vSVAvE_OHAtmARpbpKoV1COhyUM3wivZdsJTfj0yndNmjS8j3kg';

  const [activeAlerts, setActiveAlerts] = useState<SearchAlert[]>([]);
  const [postedLocatorProperties, setPostedLocatorProperties] = useState<any[]>([]);

  useEffect(() => {
    setActiveAlerts(getSearchAlerts());
    const allProps = getStoredPublishedProperties();
    const myPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone');
    const myId = userProfile?.id;
    const locatorProps = allProps.filter((p: any) => 
      p.creatorRole === 'LOCATOR' || 
      (myPhone && p.contactPhone === myPhone) ||
      (myId && p.userId === myId)
    );
    setPostedLocatorProperties(locatorProps);
  }, [userProfile]);

  const verifiedCount = postedLocatorProperties.filter(p => p.verified).length;
  const locatorEarnings = verifiedCount * 5;

  return (
    <div className="min-h-screen bg-background-dark font-display text-white overflow-x-hidden pb-10">
      <header className="sticky top-0 z-50 glass-header px-4 py-4 flex items-center justify-between backdrop-blur-xl bg-background-dark/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="size-10 rounded-full border-2 border-primary/50 overflow-hidden">
            <div className="h-full w-full bg-center bg-cover" style={{backgroundImage: `url("${locatorAvatar}")`}}></div>
          </div>
          <div>
            <p className="text-[10px] text-[#9db9b7] font-bold uppercase tracking-widest leading-none">Locator Portal</p>
            <h2 className="text-base font-black leading-tight uppercase italic text-primary">{locatorName}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onPostAd && (
            <button 
              type="button"
              id="locator-post-ad-btn"
              onClick={onPostAd} 
              className="bg-primary hover:bg-primary/90 text-background-dark px-3 py-1.5 rounded-full text-[10px] font-black transition-all shadow-lg shadow-primary/20 flex items-center gap-1 uppercase tracking-widest active:scale-95"
            >
              <span className="material-symbols-outlined text-sm font-bold">add_home</span>
              Post Ad
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-full border border-white/10">
            <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(19,236,218,0.5)]"></div>
            <span className="text-[10px] font-black text-primary tracking-widest uppercase">ACTIVE</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto flex flex-col px-4 pt-6 space-y-6">
        {/* Verification & Posting Privileges Banner */}
        <section className="glass-card rounded-2xl p-4 flex items-center justify-between border border-primary/30 bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase text-white">Approved Property Locator</p>
              <p className="text-[10px] text-white/60 mt-0.5">Authorized to post listings • Earn 5 BDT per verified listing</p>
            </div>
          </div>
          {onPostAd && (
            <button
              onClick={onPostAd}
              className="bg-primary text-background-dark text-[9px] font-black uppercase px-3 py-1 rounded-full shrink-0 flex items-center gap-1 shadow-md active:scale-95 hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-xs">add</span>
              Post Now
            </button>
          )}
        </section>
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1 border border-white/5">
            <span className="material-symbols-outlined text-primary text-xl font-light">search</span>
            <p className="text-[10px] text-[#9db9b7] font-black uppercase tracking-widest">Seekers</p>
            <p className="text-2xl font-black">{activeAlerts.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1 border border-white/5">
            <span className="material-symbols-outlined text-primary text-xl font-light">home_work</span>
            <p className="text-[10px] text-[#9db9b7] font-black uppercase tracking-widest">Posted</p>
            <p className="text-2xl font-black">{postedLocatorProperties.length}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col gap-1 border border-white/5">
            <span className="material-symbols-outlined text-primary text-xl font-light">payments</span>
            <p className="text-[10px] text-[#9db9b7] font-black uppercase tracking-widest">Earned</p>
            <p className="text-sm font-black text-primary uppercase italic truncate">৳ {locatorEarnings} BDT</p>
          </div>
        </div>

        {/* Search List */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-lg font-black tracking-tight uppercase italic">Active Seeker Search List</h3>
            <span className="text-[10px] text-primary font-black uppercase tracking-widest">
              {activeAlerts.length} Active
            </span>
          </div>
          
          <div className="space-y-3">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <div key={alert.id} className="glass-card rounded-[1.5rem] p-4 flex items-center justify-between border border-white/5 bg-white/[0.02] hover:bg-white/5 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-lg">
                      <span className="material-symbols-outlined text-xl">person_search</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-black italic uppercase tracking-tighter">{alert.title || 'Property Seeker'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="material-symbols-outlined text-primary text-xs">location_on</span>
                        <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">{alert.filters.location || 'Dhaka Area'}</p>
                      </div>
                      <p className="text-xs text-primary font-black mt-0.5 italic">
                        ৳{alert.filters.minPrice?.toLocaleString() || '15k'} - ৳{alert.filters.maxPrice?.toLocaleString() || '50k'}
                      </p>
                    </div>
                  </div>
                  {onPostAd && (
                    <button 
                      onClick={onPostAd}
                      className="bg-primary hover:bg-primary/90 text-background-dark text-[10px] font-black px-3.5 py-2 rounded-xl transition-all shadow-lg uppercase tracking-widest active:scale-95"
                    >
                      Post Match
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="glass-card rounded-2xl p-6 text-center border border-white/5 space-y-2">
                <span className="material-symbols-outlined text-white/30 text-3xl">manage_search</span>
                <p className="text-xs font-black uppercase text-white/80">No Seeker Requests In Area</p>
                <p className="text-[11px] text-white/40 max-w-xs mx-auto">
                  When residents save search alerts or request properties in your coverage area, they will appear here in real-time.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Verified Listing Reward Banner */}
        <section className="pt-2">
          <div className="glass-card rounded-[2rem] p-6 border border-primary/30 text-center relative overflow-hidden bg-primary/5">
            <div className="absolute top-[-10%] right-[-10%] size-32 bg-primary/10 rounded-full blur-3xl"></div>
            <span className="material-symbols-outlined text-primary mb-3 text-3xl">workspace_premium</span>
            <h4 className="text-white text-lg font-black uppercase italic tracking-tighter mb-1 leading-none">Locator Earnings Rate</h4>
            <p className="text-[11px] text-white/60 leading-relaxed max-w-xs mx-auto font-medium">
              Every verified property you discover and post awards <span className="text-primary font-black">5 BDT</span> credited directly to your payout balance upon moderator approval.
            </p>
            {onPostAd && (
              <button 
                onClick={onPostAd}
                className="mt-4 w-full py-3 bg-primary text-background-dark rounded-xl text-[10px] font-black tracking-[0.2em] hover:brightness-105 transition-all uppercase italic shadow-xl active:scale-95"
              >
                Post New Property Now
              </button>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .glass-header {
            background: rgba(10, 18, 17, 0.8);
        }
      `}</style>
    </div>
  );
};

export default LocatorDashboard;
