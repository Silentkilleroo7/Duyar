
import React from 'react';
import { haptics } from '../haptics';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

const RentalStep3: React.FC<Props> = ({ onBack, onSubmit }) => {
  return (
    <div className="min-h-screen bg-background-dark text-white p-6 flex flex-col pt-12">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="size-11 glass rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <p className="text-primary font-bold text-sm tracking-widest uppercase">Step 3 of 3</p>
      </header>
      <h1 className="text-3xl font-extrabold mb-2 tracking-tight uppercase">Review</h1>
      <p className="text-white/50 text-sm mb-10">Verify your application summary.</p>
      <div className="flex-1 space-y-4">
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex justify-between">
            <span className="text-white/40 text-xs">Name</span>
            <span className="text-sm font-bold">Ariful Islam</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40 text-xs">Income</span>
            <span className="text-sm font-bold text-primary">৳ 85,000</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5">
           <p className="text-white/40 text-xs mb-3 uppercase tracking-widest">Attachments</p>
           <div className="flex gap-2">
             <div className="size-12 rounded bg-white/10 flex items-center justify-center">
               <span className="material-symbols-outlined text-white/40">image</span>
             </div>
             <div className="size-12 rounded bg-white/10 flex items-center justify-center">
               <span className="material-symbols-outlined text-white/40">image</span>
             </div>
           </div>
        </div>
      </div>
      <button 
        onClick={() => {
          haptics.bookingConfirmed();
          onSubmit();
        }} 
        className="w-full bg-primary text-background-dark font-black py-4 rounded-2xl shadow-lg shadow-primary/20 uppercase tracking-widest mt-10"
      >
        SUBMIT APPLICATION
      </button>
    </div>
  );
};

export default RentalStep3;
