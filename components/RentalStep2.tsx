
import React from 'react';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const RentalStep2: React.FC<Props> = ({ onNext, onBack }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white p-6 flex flex-col pt-12">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="size-11 glass rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <p className="text-primary font-bold text-sm tracking-widest uppercase">Step 2 of 3</p>
      </header>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight uppercase">Verification</h1>
      <p className="text-white/50 text-sm mb-10">Upload your identity documents.</p>
      <div className="flex-1 space-y-6">
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center border-dashed border-2 border-white/20 h-48 hover:border-primary/50 transition-colors">
          <span className="material-symbols-outlined text-primary text-4xl mb-2">cloud_upload</span>
          <p className="font-bold text-sm">Upload NID (Front)</p>
          <p className="text-[10px] text-white/40 uppercase mt-1">JPG, PNG up to 5MB</p>
        </div>
        <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center border-dashed border-2 border-white/20 h-48">
          <span className="material-symbols-outlined text-primary text-4xl mb-2">cloud_upload</span>
          <p className="font-bold text-sm">Upload NID (Back)</p>
        </div>
      </div>
      <button onClick={onNext} className="w-full bg-primary text-background-dark font-black py-4 rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest mt-10">
        NEXT: REVIEW
      </button>
    </div>
  );
};

export default RentalStep2;
