
import React, { useState, useRef, useEffect } from 'react';
import { uploadImage } from '../cloudinary';
import { supabase } from '../supabase';

interface Props {
  onBack: () => void;
  onSave: () => void;
  userProfile: any;
}

const EditProfileScreen: React.FC<Props> = ({ onBack, onSave, userProfile }) => {
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      if (url) {
        setAvatarUrl(url);
      } else {
        setError("Image transmission failed");
      }
    } catch (err) {
      setError("Upload error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalSave = async () => {
    if (!fullName.trim()) {
      setError("Name cannot be empty");
      return;
    }

    if (!userProfile?.id) {
      setError("Critical: User identity not found. Please re-login.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl
        })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;
      
      onSave(); // This calls fetchProfile in App.tsx to refresh local state
    } catch (err: any) {
      console.error("Save Error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden max-w-[430px] mx-auto bg-background-dark shadow-2xl font-display text-white selection:bg-primary/30">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
      
      <div className="flex items-center p-6 justify-between relative z-10">
        <button onClick={onBack} className="glass-button flex h-12 w-12 items-center justify-center rounded-full text-white">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold uppercase tracking-widest italic text-primary">Identity Hub</h1>
        <div className="w-12"></div> 
      </div>

      <div className="flex flex-col items-center px-4 py-8 relative z-10">
        <div className="relative group cursor-pointer" onClick={() => !isUploading && fileInputRef.current?.click()}>
          <div className="h-32 w-32 rounded-[2.5rem] border-2 border-primary/30 p-1.5 transition-all group-hover:border-primary duration-500 shadow-[0_0_40px_rgba(19,236,218,0.2)]">
            <div 
              className={`h-full w-full rounded-[2rem] bg-cover bg-center shadow-2xl bg-white/5 transition-opacity ${isUploading ? 'opacity-30' : 'opacity-100'}`} 
              style={{backgroundImage: avatarUrl ? `url("${avatarUrl}")` : 'none'}}
            >
              {!avatarUrl && !isUploading && (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <span className="material-symbols-outlined text-5xl">person</span>
                </div>
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span>
              </div>
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-background-dark shadow-xl border-4 border-background-dark active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-xl font-black">photo_camera</span>
          </button>
        </div>
        <p className="mt-5 text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Biometric Visualization</p>
      </div>

      <div className="flex flex-col gap-6 px-6 pb-40 relative z-10">
        <div className="flex flex-col gap-2">
          <label className="px-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Full Name (Legal Identity)</label>
          <div className="glass-effect flex h-16 w-full items-center rounded-2xl px-6 border border-white/10 focus-within:border-primary/40 transition-all shadow-inner">
            <span className="material-symbols-outlined text-primary/40 mr-4">person</span>
            <input 
              className="w-full bg-transparent border-none text-white focus:ring-0 text-base font-bold italic" 
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 opacity-50">
          <label className="px-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Linked Phone (Locked)</label>
          <div className="glass-effect flex h-16 w-full items-center rounded-2xl px-6 border border-white/5 bg-black/20">
            <span className="material-symbols-outlined text-white/20 mr-4">call</span>
            <input 
              className="w-full bg-transparent border-none text-white/30 focus:ring-0 text-base font-bold italic" 
              readOnly 
              value={userProfile?.phone || ''}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
             <p className="text-red-400 text-[10px] font-black uppercase tracking-wider text-center italic">{error}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 max-w-[430px] mx-auto z-20 bg-gradient-to-t from-background-dark via-background-dark to-transparent pt-12">
        <button 
          onClick={handleFinalSave}
          disabled={isSaving || isUploading}
          className="w-full bg-primary text-background-dark h-18 rounded-[1.5rem] font-black text-sm tracking-[0.2em] shadow-[0_15px_40px_rgba(19,236,218,0.3)] active:scale-[0.98] transition-all uppercase italic flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? (
             <span className="material-symbols-outlined animate-spin font-black">sync</span>
          ) : (
            <>
              Update Data
              <span className="material-symbols-outlined font-black">shield_lock</span>
            </>
          )}
        </button>
      </div>

      <style>{`
        .glass-effect { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .glass-button { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .h-18 { height: 4.5rem; }
      `}</style>
    </div>
  );
};

export default EditProfileScreen;
