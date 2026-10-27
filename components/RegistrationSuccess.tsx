
import React from 'react';

interface Props {
  onLogin: () => void;
}

const RegistrationSuccess: React.FC<Props> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-6 text-white font-display overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-500">
        
        {/* Success Icon */}
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50 blur-xl"></div>
          <div className="w-28 h-28 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(19,236,218,0.4)] border-4 border-background-dark">
            <span className="material-symbols-outlined text-background-dark text-6xl font-black">check</span>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 mb-14">
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-white leading-tight">
            Registration <br/> <span className="text-primary">Successful!</span>
          </h1>
          <p className="text-white/60 text-sm font-medium leading-relaxed max-w-xs mx-auto">
            Your account has been created and verified in our database. Please log in to access your dashboard.
          </p>
        </div>

        {/* Action Button */}
        <button 
          onClick={onLogin}
          className="w-full h-16 bg-primary text-background-dark font-black text-sm tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 uppercase italic transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-3"
        >
          PROCEED TO LOGIN
          <span className="material-symbols-outlined font-black">login</span>
        </button>

        <p className="mt-8 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
          Duyar Secure Gateway
        </p>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
