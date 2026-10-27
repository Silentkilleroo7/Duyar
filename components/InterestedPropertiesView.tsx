
import React, { useState } from 'react';

interface Props {
  onBack: () => void;
}

const InterestedPropertiesView: React.FC<Props> = ({ onBack }) => {
  const [filter, setFilter] = useState<'YES' | 'MAYBE'>('YES');

  const list = [
    { title: 'Skyline Penthouse', price: '$4,500/mo', area: '120 sqm', stars: 4.5, date: 'Oct 25', badge: 'High Interest', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx_f4iri-cYkVratfpoBWCrCaSdsLK3220xPI3fCgPol4y4_4MjfOis0JeOZ5C__rs-CBoayx0kdM87pPueqgsOOG7zdyzYQaNIh4SL2NZj7RqC_zFtoxb-sQdnr6BG_4MxYs8cnwiprtmFsFYrZpGwvnbcUKLDXNXa-vt9Xf-1rASptslKTY1yq_mDzrvWQb37deDR9HOPquvrjN5ELf9MAiGkWXmE9eV6WUk2waBcwyFABEEyhaTgAHub8f7KuxxuU90v_06iAA' },
    { title: 'Urban Loft B-4', price: '$3,200/mo', area: '85 sqm', stars: 4.8, date: 'Oct 24', badge: 'Hot Property', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo8SU85hhtWvKSMelJAvZsV4OmlKJwpbZ7RJ3KcwJGPcQv2r_iffwQWYbCpS1g3d3sImMztND6Sfh0TaHGAefPANCUA3uSeg903TNkGMSkHEWsQo6NpOEEWbpy2wShUNaL5g56EVO3kt3lfxdPWLeyjuEAd_ATm6HJtaBznz2YaDf_2yIorAeXuIaEThV69TalwZglY8nLOUWcX7qzAJdH67L1TLBwsHMyN0vWsN5t-hUcoPm8o3otxNPsJ_t4Ckz20Y4k5mWLBuA' },
    { title: 'The Glass Duplex', price: '$6,800/mo', area: '210 sqm', stars: 4.2, date: 'Oct 22', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmP7vwMG7nj9ZfKgENxSh9hyp2hPvtyXdyRIjki2xS4on8rjGNwIpbmbaozoh1b6g_4QvDlFV-AJN03Ya6IpTkkLhtHn1gHYrkL-sR1vQaH8t9JhGO32pIJPOkv-gmVQyV395s0-uAvoTEQkLc8roecvcyOMVBADFiHRQSzUb1uIPwRfT81h6fam26iaW0fx6t_IYvnwsE_plEqGXGMfRGPDhtPVy7rSLEuSUBSea7u0l7NQRfqlaKITOKM-h7fphhmsxig33GMco' }
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-hidden bg-background-dark font-display text-white">
      <div className="flex items-center px-4 pt-6 pb-2 justify-between">
        <button onClick={onBack} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white active:scale-95 transition-all">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
      </div>

      <div className="px-4 pt-6 pb-3">
        <h1 className="text-primary tracking-tighter text-[36px] font-extrabold leading-none uppercase italic">Interested</h1>
      </div>

      <div className="flex px-4 py-3">
        <div className="flex h-11 flex-1 items-center justify-center rounded-xl glass-card p-1 border border-white/5 bg-white/5">
          <label className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-[11px] font-black tracking-widest transition-all ${filter === 'YES' ? 'bg-primary text-background-dark' : 'text-white/40'}`}>
            <span>YES</span>
            <input checked={filter === 'YES'} onChange={() => setFilter('YES')} className="hidden" name="filter" type="radio" />
          </label>
          <label className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-[11px] font-black tracking-widest transition-all ${filter === 'MAYBE' ? 'bg-primary text-background-dark' : 'text-white/40'}`}>
            <span>MAYBE</span>
            <input checked={filter === 'MAYBE'} onChange={() => setFilter('MAYBE')} className="hidden" name="filter" type="radio" />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10 space-y-3 no-scrollbar">
        {list.map((item, i) => (
          <div key={i} className="glass-card flex gap-3 p-3 rounded-xl items-center border border-white/5 bg-white/5">
            <div className="relative shrink-0">
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[84px] shadow-lg border border-white/10" style={{backgroundImage: `url('${item.img}')`}}></div>
              {item.badge && (
                <div className="absolute -top-1 -left-1 bg-primary text-background-dark text-[7px] font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">
                  {item.badge}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center min-w-0">
              <p className="text-white text-base font-bold leading-tight truncate">{item.title}</p>
              <p className="text-primary text-[11px] font-black leading-normal mt-0.5">{item.price} • {item.area}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-white/30 text-[12px]">calendar_today</span>
                <p className="text-white/40 text-[10px] font-bold leading-none uppercase tracking-tighter">Visited {item.date} • {item.stars} Stars</p>
              </div>
            </div>
            <div className="shrink-0">
              <button className="flex min-w-[70px] cursor-pointer items-center justify-center rounded-lg h-9 px-3 bg-primary text-background-dark text-[10px] font-black leading-normal uppercase shadow-lg shadow-primary/20 active:scale-95 transition-transform tracking-widest">
                APPLY
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default InterestedPropertiesView;
