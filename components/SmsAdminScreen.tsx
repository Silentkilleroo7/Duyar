
import React, { useState, useEffect } from 'react';
import { getSmsBalance } from '../sms';

interface Props {
  onBack: () => void;
}

const SmsAdminScreen: React.FC<Props> = ({ onBack }) => {
  const [balance, setBalance] = useState<string>('Loading...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchBalance = async () => {
    setIsRefreshing(true);
    const bal = await getSmsBalance();
    setBalance(bal);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleRegenerate = () => {
    if (confirm("Warning: Regenerating your API key will break existing integrations until they are updated. Proceed?")) {
      setIsRegenerating(true);
      setTimeout(() => {
        setIsRegenerating(false);
        alert("New API Key generated successfully! (Simulated)");
      }, 2500);
    }
  };

  const errorCodes = [
    { code: '202', label: 'Success', desc: 'SMS Submitted Successfully' },
    { code: '1001', label: 'Invalid', desc: 'The number provided is invalid' },
    { code: '1002', label: 'ID Error', desc: 'Sender ID incorrect or disabled' },
    { code: '1007', label: 'Balance', desc: 'Insufficient credit balance' },
    { code: '1032', label: 'IP Error', desc: 'Source IP not whitelisted' }
  ];

  return (
    <div className="relative min-h-screen max-w-md mx-auto bg-background-dark font-display text-white overflow-y-auto no-scrollbar">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-primary/5 to-transparent"></div>
        <div className="absolute top-[10%] right-[-20%] w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
      </div>

      <header className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-background-dark/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-white">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase italic text-primary">SMS Gateway</h1>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] leading-none mt-1">BulkSMSBD Infrastructure</p>
          </div>
        </div>
        <button 
          onClick={fetchBalance}
          className={`size-10 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 text-primary transition-all ${isRefreshing ? 'animate-spin' : 'active:scale-90'}`}
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
        </button>
      </header>

      <main className="relative z-10 px-6 pt-8 pb-32 space-y-8">
        {/* Balance Card */}
        <section>
          <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden border border-primary/20 bg-primary/5 shadow-[0_0_50px_rgba(19,236,218,0.1)]">
             <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
             <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-70">Available Credits</p>
             <div className="flex items-baseline gap-2">
               <span className="text-white text-5xl font-black tracking-tighter italic">৳ {balance}</span>
               <span className="text-primary text-xs font-bold uppercase tracking-widest opacity-60">BDT</span>
             </div>
             <div className="mt-6 flex items-center gap-2">
               <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Gateway Connectivity: Stable</p>
             </div>
          </div>
        </section>

        {/* Credentials Section */}
        <section className="space-y-4">
          <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">API Credentials</h3>
          
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
               <div>
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-2">Primary API Key</label>
                  <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                    <code className="text-xs font-mono text-primary truncate mr-4">
                      {apiKeyVisible ? 'otxMrnZcEdTRCGapdmqU' : '••••••••••••••••••••'}
                    </code>
                    <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="text-white/40 hover:text-white">
                      <span className="material-symbols-outlined text-[18px]">{apiKeyVisible ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
               </div>

               <div>
                  <label className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-2">Approved Sender ID</label>
                  <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                    <code className="text-xs font-mono text-white">8809617631033</code>
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">verified</span>
                  </div>
               </div>

               <div className="pt-2">
                 <button 
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="w-full h-14 rounded-xl border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                   {isRegenerating ? (
                     <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                   ) : (
                     <>
                       <span className="material-symbols-outlined text-lg">key_visualizer</span>
                       Regenerate API Key
                     </>
                   )}
                 </button>
               </div>
            </div>
          </div>
        </section>

        {/* API Response Codes */}
        <section className="space-y-4">
          <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Gateway Reference</h3>
          <div className="glass-card rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
             {errorCodes.map((err) => (
               <div key={err.code} className="p-4 flex items-center gap-4 bg-black/20">
                  <div className="size-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-primary font-mono shrink-0">
                    {err.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold uppercase tracking-tight">{err.label}</p>
                    <p className="text-white/40 text-[10px] truncate">{err.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-white/10 text-xl">info</span>
               </div>
             ))}
          </div>
        </section>

        {/* Branding */}
        <div className="text-center py-6 opacity-20">
           <p className="text-[9px] font-black uppercase tracking-[0.5em]">BulkSMSBD Global Node • Secure Connect</p>
        </div>
      </main>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default SmsAdminScreen;
