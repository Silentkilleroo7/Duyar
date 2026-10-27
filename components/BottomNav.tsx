
import React from 'react';
import { Screen } from '../types';
import { haptics } from '../haptics';
import { t } from '../translations';

interface Props {
  activeTab: 'HOME' | 'SERVICES' | 'HISTORY' | 'WALLET' | 'PROFILE';
  onNavigate: (screen: Screen) => void;
  lang?: 'EN' | 'BN';
}

const BottomNav: React.FC<Props> = ({ activeTab, onNavigate, lang = 'EN' }) => {
  const isBn = lang === 'BN';
  const navText = t[isBn ? 'BN' : 'EN'].nav;

  const tabs = [
    { id: 'HOME', label: navText.home, icon: 'home', screen: Screen.HOME },
    { id: 'SERVICES', label: navText.services, icon: 'grid_view', screen: Screen.SERVICES_HUB },
    { id: 'HISTORY', label: navText.history, icon: 'schedule', screen: Screen.HISTORY },
    { id: 'WALLET', label: navText.wallet, icon: 'account_balance_wallet', screen: Screen.WALLET },
    { id: 'PROFILE', label: navText.profile, icon: 'person', screen: Screen.SECURITY },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] max-w-[400px] mx-auto">
      <div className="bg-[#0a1211]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-4 py-3 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => {
                haptics.dashboardNavigated();
                onNavigate(tab.screen);
              }}
              className="flex flex-col items-center gap-1 group min-w-[50px] relative transition-all active:scale-90"
            >
              <span 
                className={`material-symbols-outlined transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-white/40'}`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className={`text-[8px] font-black uppercase tracking-tighter transition-colors duration-300 ${isActive ? 'text-primary' : 'text-white/20'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(19,236,218,1)]"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
