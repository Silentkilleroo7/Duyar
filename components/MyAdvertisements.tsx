
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getStoredPublishedProperties } from '../propertyStorage';
import { VerifiedBadge } from './VerifiedBadge';

interface Props {
  onBack: () => void;
  onBoost: () => void;
  userProfile?: any;
}

const MyAdvertisements: React.FC<Props> = ({ onBack, onBoost, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'RENT' | 'SALE'>('RENT');
  const [myAds, setMyAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      const local = getStoredPublishedProperties();
      const localMapped = local.map((item: any) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        location: item.location,
        status: 'Live',
        isVerified: Boolean(item.isVerified || item.is_verified || item.metadata?.verified),
        type: item.tag === 'FOR SALE' ? 'SALE' : 'RENT',
        image: item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
      }));

      if (!userProfile?.id) {
        setMyAds(localMapped);
        setLoading(false);
        return;
      }

      let remoteMapped: any[] = [];
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          remoteMapped = data.map((item: any) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            location: item.location,
            status: item.status === 'PENDING' ? 'Pending' : 'Live',
            isVerified: Boolean(item.is_verified || item.isVerified || item.metadata?.verified),
            type: item.tag === 'FOR SALE' ? 'SALE' : 'RENT',
            image: item.image_url || 'https://via.placeholder.com/150'
          }));
        }
      } catch (err) {
        console.warn("My ads fetch note:", err);
      }

      // Merge local and remote ads deduplicated
      const seen = new Set<string>();
      const combined: any[] = [];
      [...localMapped, ...remoteMapped].forEach(ad => {
        if (!seen.has(ad.id)) {
          seen.add(ad.id);
          combined.push(ad);
        }
      });

      setMyAds(combined);
      setLoading(false);
    };

    fetchAds();
  }, [userProfile]);

  const filteredAds = myAds.filter(ad => ad.type === activeTab);

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-white antialiased min-h-screen relative selection:bg-primary/20">
      {/* Map Overlay Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div 
          className="w-full h-full bg-center bg-no-repeat bg-cover filter brightness-50" 
          style={{
            backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBcR4DS4jyrZ6wuWIL3bjOxOgk9ppbDuJhhvbDHEoc2epeV6PtKazeK5DHym1dDutWg26E2CEsXg_IOuXvaqDGrBTxqIT5nNpYliCernF1wFZo3jw6b-sP3F6ZaZqT9UQjMm8UDwr3ls-CeXLp1DdKoBIiW3s_4jCwGbN7fLdkvPoXGPCb_DYNxjem_mzpu3uiXJqi39P-7iARglwvmb6BcmCkSPzsNojzK4YFth56qeNG1ninajUK6ICgEmqOU4UAY-r3nevbC78g")',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
          }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center p-4 pt-8 justify-between">
          <button 
            onClick={onBack}
            className="glass-btn flex size-10 shrink-0 items-center justify-center rounded-full text-white active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
          </button>
          <h2 className="text-primary text-xl font-bold leading-tight tracking-wider uppercase flex-1 text-center pr-10">
            MY ADS
          </h2>
        </div>

        {/* Tab Toggle */}
        <div className="px-4 py-2">
          <div className="flex h-11 flex-1 items-center justify-center rounded-full bg-background-dark/80 border border-white/5 p-1 backdrop-blur-md">
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 text-sm font-bold transition-all duration-300 ${activeTab === 'RENT' ? 'bg-primary text-background-dark' : 'text-white/60'}`}>
              <span className="truncate">RENT</span>
              <input 
                checked={activeTab === 'RENT'} 
                className="invisible w-0" 
                name="ad-type" 
                type="radio" 
                onChange={() => setActiveTab('RENT')}
              />
            </label>
            <label className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 text-sm font-bold transition-all duration-300 ${activeTab === 'SALE' ? 'bg-primary text-background-dark' : 'text-white/60'}`}>
              <span className="truncate">SALE</span>
              <input 
                checked={activeTab === 'SALE'} 
                className="invisible w-0" 
                name="ad-type" 
                type="radio" 
                onChange={() => setActiveTab('SALE')}
              />
            </label>
          </div>
        </div>

        {/* Ad List */}
        <div className="flex flex-col gap-3 px-4 py-4 pb-12">
          {loading ? (
             <div className="py-20 flex justify-center">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
             </div>
          ) : filteredAds.length > 0 ? (
            filteredAds.map((ad) => (
            <div 
              key={ad.id} 
              className={`glass-card rounded-2xl p-3 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${ad.status === 'Pending' ? 'opacity-90' : ''}`}
            >
              <div className="flex gap-3 justify-between">
                <div className="flex items-start gap-3">
                  <div 
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl size-16 border border-white/5" 
                    style={{ backgroundImage: `url("${ad.image}")` }}
                  ></div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="text-white text-sm font-bold leading-tight truncate">{ad.title}</p>
                    <p className="text-primary text-xs font-semibold leading-normal">{ad.price}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[10px] text-white/40">location_on</span>
                      <p className="text-white/50 text-[10px] font-normal leading-normal">{ad.location}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1.5 py-0.5">
                  <div className={`px-2 py-0.5 rounded-full border ${
                    ad.status === 'Live' 
                    ? 'bg-primary/20 border-primary/30' 
                    : 'bg-yellow-500/20 border-yellow-500/30'
                  }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      ad.status === 'Live' ? 'text-primary' : 'text-yellow-500'
                    }`}>
                      {ad.status}
                    </span>
                  </div>

                  <VerifiedBadge property={ad} variant="pill" size="xs" showUnverified={true} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <div className="flex gap-1.5">
                  <button className="flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors active:scale-95">
                    <span className="material-symbols-outlined text-[14px] text-white">edit</span>
                    <span className="text-[10px] font-medium">Edit</span>
                  </button>
                  <button className="flex items-center gap-1 bg-white/5 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-colors group active:scale-95">
                    <span className="material-symbols-outlined text-[14px] text-white group-hover:text-red-400">delete</span>
                    <span className="text-[10px] font-medium">Delete</span>
                  </button>
                </div>
                
                <button 
                  onClick={ad.status === 'Live' ? onBoost : undefined}
                  disabled={ad.status !== 'Live'}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                    ad.status === 'Live' 
                    ? 'bg-primary shadow-[0_0_15px_rgba(19,236,236,0.3)]' 
                    : 'bg-white/10 border border-white/10 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[14px] font-bold ${
                    ad.status === 'Live' ? 'text-background-dark' : 'text-white'
                  }`}>bolt</span>
                  <span className={`text-[10px] font-bold uppercase ${
                    ad.status === 'Live' ? 'text-background-dark' : 'text-white'
                  }`}>BOOST</span>
                </button>
              </div>
            </div>
          ))) : (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
              <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
              <p className="text-lg font-bold tracking-widest uppercase">No Listings Found</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .glass-card {
            background: rgba(16, 34, 34, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glass-btn {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default MyAdvertisements;
