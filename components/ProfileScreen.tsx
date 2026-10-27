import React, { useState, useEffect } from 'react';
import { AppStatus } from '../App';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import { haptics } from '../haptics';
import { 
  canUserPostProperty, 
  isUserApprovedLandlord, 
  isUserApprovedLocator 
} from '../providerApplicationsStorage';

interface Props {
  onBack: () => void;
  onEditProfile: () => void;
  onMyAds?: () => void;
  onPostAd?: () => void;
  onPaymentMethods: () => void;
  onApplyLandlord: () => void;
  onApplyPickDrop: () => void;
  onApplyMaintenance: () => void;
  onApplyLocator: () => void;
  onApplySecurityGuard: () => void;
  onApplyMaid: () => void;
  onNotificationSettings: () => void;
  onSavedProperties: () => void;
  onSecurity?: () => void;
  onSupport: () => void;
  onLogout: () => void;
  onAdminHub?: () => void;
  isAdmin?: boolean;
  userProfile: any;
  appStatuses: {
    landlord: AppStatus;
    locator: AppStatus;
    maintenance: AppStatus;
    pickDrop: AppStatus;
    securityGuard: AppStatus;
    maid: AppStatus;
  };
  onNavigate: (screen: Screen) => void;
  lang?: 'EN' | 'BN';
  onToggleLang?: () => void;
  onLangChange?: (lang: 'EN' | 'BN') => void;
}

const translations = {
  EN: {
    systemRoot: "System Root",
    conciergeTerminal: "Concierge Terminal",
    marketplaceAccount: "Marketplace Account",
    landlordHub: "Landlord Hub",
    applyLandlord: "Apply for Landlord",
    maintenanceHub: "Maintenance Hub",
    applyMaintenance: "Apply for Maintenance",
    logisticsHub: "Logistics Hub",
    applyPickDrop: "Apply for Pick & Drop",
    locatorHub: "Locator Hub",
    applyLocator: "Apply for Locator",
    securityHub: "Security Hub",
    applySecurity: "Apply for Security",
    maidHub: "Maid Hub",
    applyMaid: "Apply for Maid",
    personalPreferences: "Personal Preferences",
    languagePref: "Language / ভাষা",
    languageSub: "English (EN)",
    languageSwitchHint: "Switch app interface language",
    myVisits: "My Property Visits & Reviews",
    securityBiometrics: "Security & Biometrics",
    savedProperties: "Saved Properties",
    notifications: "Notifications",
    duyarSupport: "Duyar Support",
    terminateSession: "Terminate Session",
    systemAdmin: "System Administrator",
    premiumMember: "Premium Member",
    defaultName: "Duyar User",
    accessAuthorized: "Access Authorized",
    reviewingData: "Reviewing Data",
    enBadge: "EN",
    bnBadge: "বাংলা",
    verifiedPublisher: "Verified Property Publisher",
    postProperty: "Post / Publish Property",
    postPropertySub: "Instant Live On Platform Map",
    myAds: "My Advertisements",
    myAdsSub: "Manage & Boost Listings",
  },
  BN: {
    systemRoot: "প্রধান নিয়ন্ত্রণ কেন্দ্র",
    conciergeTerminal: "কনসিয়ার্জ টার্মিনাল",
    marketplaceAccount: "মার্কেটপ্লেস ও সেবা অ্যাকাউন্ট",
    landlordHub: "বাড়ি মালিক কেন্দ্র",
    applyLandlord: "বাড়ি মালিক হিসেবে আবেদন করুন",
    maintenanceHub: "গৃহ মেরামত ও রক্ষণাবেক্ষণ কেন্দ্র",
    applyMaintenance: "রক্ষণাবেক্ষণ কর্মী হিসেবে আবেদন করুন",
    logisticsHub: "মালামাল পরিবহন সেবা (পিক অ্যান্ড ড্রপ)",
    applyPickDrop: "পরিবহন চালক হিসেবে আবেদন করুন",
    locatorHub: "বাসা অনুসন্ধান কেন্দ্র",
    applyLocator: "বাসা সন্ধানকারী হিসেবে আবেদন করুন",
    securityHub: "নিরাপত্তা প্রহরী কেন্দ্র",
    applySecurity: "নিরাপত্তা প্রহরী হিসেবে আবেদন করুন",
    maidHub: "গৃহপরিচারিকা সেবা কেন্দ্র",
    applyMaid: "গৃহপরিচারিকা হিসেবে আবেদন করুন",
    personalPreferences: "ব্যক্তিগত পছন্দসমূহ",
    languagePref: "ভাষা পরিবর্তন (Language)",
    languageSub: "বাংলা (BN)",
    languageSwitchHint: "অ্যাপের ভাষা পরিবর্তন করুন",
    myVisits: "আমার বাসা পরিদর্শন ও মতামত",
    securityBiometrics: "নিরাপত্তা ও বায়োমেট্রিক্স",
    savedProperties: "সংরক্ষিত পছন্দের বাসা",
    notifications: "বিজ্ঞপ্তি ও বার্তা",
    duyarSupport: "দুয়ার সাপোর্ট ও হেল্পলাইন",
    terminateSession: "লগআউট করুন",
    systemAdmin: "সিস্টেম অ্যাডমিনিস্ট্রেটর",
    premiumMember: "সম্মানিত বাসিন্দা",
    defaultName: "দুয়ার ব্যবহারকারী",
    accessAuthorized: "অনুমোদিত অ্যাকাউন্ট",
    reviewingData: "আবেদন পর্যালোচনায় রয়েছে",
    enBadge: "English",
    bnBadge: "বাংলা",
    verifiedPublisher: "অনুমোদিত প্রোপার্টি পোস্টিং",
    postProperty: "নতুন বাসা বিজ্ঞাপন দিন",
    postPropertySub: "ম্যাপে তাৎক্ষণিক লাইভ হবে",
    myAds: "আমার বিজ্ঞাপনসমূহ",
    myAdsSub: "বিজ্ঞাপন পরিচালনা ও বুস্ট করুন",
  }
};

const ProfileScreen: React.FC<Props> = ({
  onBack,
  onEditProfile,
  onMyAds,
  onPostAd,
  onApplyLandlord,
  onApplyPickDrop,
  onApplyMaintenance,
  onApplyLocator,
  onApplySecurityGuard,
  onApplyMaid,
  onNotificationSettings,
  onSavedProperties,
  onSecurity,
  onSupport,
  onLogout,
  onAdminHub,
  isAdmin = false,
  userProfile,
  appStatuses,
  onNavigate,
  lang,
  onToggleLang,
  onLangChange
}) => {
  // Local state initialized from prop or localStorage
  const [internalLang, setInternalLang] = useState<'EN' | 'BN'>(() => {
    if (lang === 'BN' || lang === 'EN') return lang;
    try {
      const saved = localStorage.getItem('duyar_lang');
      if (saved === 'BN' || saved === 'EN') return saved;
    } catch (e) {}
    return 'EN';
  });

  // Synchronize when prop changes
  useEffect(() => {
    if (lang && (lang === 'EN' || lang === 'BN') && lang !== internalLang) {
      setInternalLang(lang);
    }
  }, [lang]);

  const currentLang = lang || internalLang;
  const t = translations[currentLang];

  const avatar = userProfile?.avatar_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBkp67SZeSw9vt00YI0l3V1ISUT1SF1EDhvwqELxScDYEaI-S-6v9xlwW1zCXjKg1pTUvFuMEq53nTFmfSmeeFkDo97tGGm3ODZqR8zKDSo_oXheuMYJtlAwHagYalee372CqN-33nIA4B__EDWlZq4MjEYI3stEMjQkRCEX7-1pV0foyJq4OM6vYJWVzHZzcGWNt-wtuAqMtBx1GzZE5B2cU_zQN2ePUWesGfU4Tr6MPOoybPdRR-PKpfLi3eMgB4Sbb-13cGKnAY";
  const name = userProfile?.full_name || t.defaultName;

  const isApprovedLandlord = isUserApprovedLandlord(userProfile) || appStatuses.landlord === 'APPROVED';
  const isApprovedLocator = isUserApprovedLocator(userProfile) || appStatuses.locator === 'APPROVED';
  const canPost = canUserPostProperty(userProfile) || isApprovedLandlord || isApprovedLocator || isAdmin;

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display max-w-[430px] mx-auto overflow-hidden text-white">
      <header className="relative z-10 border-b border-white/5 bg-background-dark/20 backdrop-blur-xl px-6 pt-12 pb-8">
        {/* Back Button */}
        <div className="absolute top-12 left-6 z-20">
          <button 
            type="button"
            id="profile-back-btn"
            onClick={onBack} 
            className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/10"
            aria-label="Back"
          >
            <span className="material-symbols-outlined text-white/60">arrow_back</span>
          </button>
        </div>

        {/* User Info Avatar & Role */}
        <div className="flex flex-col items-center gap-6 mt-4">
          <div className="relative group">
            <div className="size-28 rounded-[2.5rem] border-2 border-primary/30 p-1.5 transition-all group-hover:border-primary duration-500 shadow-[0_0_40px_rgba(19,236,218,0.15)]">
              <div 
                className="w-full h-full rounded-[2rem] bg-center bg-no-repeat bg-cover shadow-2xl bg-background-dark/40" 
                style={{ backgroundImage: `url("${avatar}")` }}
              ></div>
            </div>
            <button 
              type="button"
              id="profile-edit-avatar-btn"
              onClick={onEditProfile} 
              className="absolute -bottom-1 -right-1 bg-primary text-background-dark size-9 rounded-2xl flex items-center justify-center border-4 border-[#0a1211] shadow-xl active:scale-90 transition-all hover:bg-primary/90"
              aria-label="Edit Profile"
            >
              <span className="material-symbols-outlined text-[20px] font-black">edit_square</span>
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight uppercase italic leading-none">{name}</h1>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
              <p className="text-primary text-[9px] font-black uppercase tracking-[0.2em]">{isAdmin ? t.systemAdmin : t.premiumMember}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pt-8 pb-44 no-scrollbar relative z-10">
        <section className="space-y-8">
          {/* Admin Section */}
          {isAdmin && (
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4 ml-2 italic leading-none">{t.systemRoot}</p>
              <MenuItem 
                id="menu-admin-hub"
                icon="admin_panel_settings" 
                label={t.conciergeTerminal} 
                onClick={onAdminHub || (() => {})} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
            </div>
          )}

          {/* Verified Property Publisher Section - ONLY visible to approved Landlords and approved Locators */}
          {canPost && (
            <div id="verified-property-publisher-section" className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-3 ml-2">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] italic leading-none flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">verified</span>
                  {t.verifiedPublisher}
                </p>
                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="size-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  {isAdmin ? 'System Master' : isApprovedLandlord ? (currentLang === 'BN' ? 'অনুমোদিত বাড়ি মালিক' : 'Approved Landlord') : (currentLang === 'BN' ? 'অনুমোদিত লোকেটর' : 'Approved Locator')}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {/* Post / Publish Property Button */}
                <button
                  type="button"
                  id="account-post-property-btn"
                  onClick={() => {
                    haptics.selection();
                    if (onPostAd) onPostAd();
                    else onNavigate(Screen.POST_AD);
                  }}
                  className="glass-card flex items-center gap-4 px-5 h-16 rounded-[1.5rem] w-full border border-[#13ecda]/40 bg-[#13ecda]/10 hover:bg-[#13ecda]/20 transition-all group active:scale-[0.98] shadow-[0_0_25px_rgba(19,236,218,0.2)]"
                >
                  <div className="flex items-center justify-center rounded-xl bg-[#13ecda] text-[#0a1211] size-11 shrink-0 border border-[#13ecda] shadow-md group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-2xl font-black">post_add</span>
                  </div>
                  <div className="flex flex-col flex-1 text-left overflow-hidden">
                    <p className="text-white text-[13px] font-black tracking-tight truncate uppercase italic flex items-center gap-1.5">
                      <span>{t.postProperty}</span>
                      <span className="size-1.5 rounded-full bg-[#13ecda] animate-pulse"></span>
                    </p>
                    <p className="text-[#13ecda] text-[8px] font-black uppercase tracking-widest leading-none mt-1">
                      {t.postPropertySub}
                    </p>
                  </div>
                  <div className="size-8 rounded-full bg-white/5 flex items-center justify-center text-[#13ecda] group-hover:bg-[#13ecda] group-hover:text-[#0a1211] transition-all">
                    <span className="material-symbols-outlined text-lg">add</span>
                  </div>
                </button>

                {/* My Advertisements */}
                <button
                  type="button"
                  id="account-my-ads-btn"
                  onClick={() => {
                    haptics.dashboardNavigated();
                    if (onMyAds) onMyAds();
                    else onNavigate(Screen.MY_ADS);
                  }}
                  className="glass-card flex items-center gap-4 px-5 h-16 rounded-[1.5rem] w-full border border-white/5 hover:bg-white/5 transition-all group active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center rounded-xl bg-white/5 text-[#13ecda] size-11 shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-2xl font-light">real_estate_agent</span>
                  </div>
                  <div className="flex flex-col flex-1 text-left overflow-hidden">
                    <p className="text-white text-[13px] font-bold tracking-tight truncate uppercase italic">
                      {t.myAds}
                    </p>
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest leading-none mt-1">
                      {t.myAdsSub}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-white/20 group-hover:text-[#13ecda] transition-all">chevron_right</span>
                </button>
              </div>
            </div>
          )}

          {/* Marketplace Hubs */}
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 ml-2 italic leading-none">{t.marketplaceAccount}</p>
            <div className="flex flex-col gap-2">
              <MenuItem 
                id="menu-landlord-app"
                icon="home_work" 
                label={appStatuses.landlord === 'APPROVED' ? t.landlordHub : t.applyLandlord} 
                status={appStatuses.landlord} 
                onClick={onApplyLandlord} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-maintenance-app"
                icon="build" 
                label={appStatuses.maintenance === 'APPROVED' ? t.maintenanceHub : t.applyMaintenance} 
                status={appStatuses.maintenance} 
                onClick={onApplyMaintenance} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-pickdrop-app"
                icon="local_shipping" 
                label={appStatuses.pickDrop === 'APPROVED' ? t.logisticsHub : t.applyPickDrop} 
                status={appStatuses.pickDrop} 
                onClick={onApplyPickDrop} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-locator-app"
                icon="explore" 
                label={appStatuses.locator === 'APPROVED' ? t.locatorHub : t.applyLocator} 
                status={appStatuses.locator} 
                onClick={onApplyLocator} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-security-app"
                icon="shield_person" 
                label={appStatuses.securityGuard === 'APPROVED' ? t.securityHub : t.applySecurity} 
                status={appStatuses.securityGuard} 
                onClick={onApplySecurityGuard} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-maid-app"
                icon="cleaning_services" 
                label={appStatuses.maid === 'APPROVED' ? t.maidHub : t.applyMaid} 
                status={appStatuses.maid} 
                onClick={onApplyMaid} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
            </div>
          </div>

          {/* Personal Preferences */}
          <div>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-4 ml-2 italic leading-none">{t.personalPreferences}</p>
            <div className="flex flex-col gap-2">
              <MenuItem 
                id="menu-visits-reviews"
                icon="calendar_month" 
                label={t.myVisits} 
                onClick={() => onNavigate(Screen.MY_VISITS)} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-security-biometrics"
                icon="fingerprint" 
                label={t.securityBiometrics} 
                status="APPROVED" 
                onClick={onSecurity || (() => onNavigate(Screen.ACCOUNT_SECURITY))} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-saved-properties"
                icon="favorite" 
                label={t.savedProperties} 
                onClick={onSavedProperties} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-notifications"
                icon="notifications_active" 
                label={t.notifications} 
                onClick={onNotificationSettings} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
              <MenuItem 
                id="menu-support"
                icon="support_agent" 
                label={t.duyarSupport} 
                onClick={onSupport} 
                authorizedText={t.accessAuthorized}
                reviewingText={t.reviewingData}
              />
            </div>
          </div>

          {/* Terminate Session Button */}
          <div className="pt-4">
            <button 
              type="button"
              id="profile-logout-btn"
              onClick={onLogout} 
              className="glass-card flex items-center gap-4 px-5 h-16 rounded-[1.5rem] w-full border border-red-500/20 hover:bg-red-500/10 transition-colors group active:scale-[0.98]"
            >
              <div className="flex items-center justify-center rounded-xl bg-red-500/10 size-11 shrink-0 text-red-500 border border-red-500/10 transition-transform group-active:scale-90">
                <span className="material-symbols-outlined text-2xl font-light">logout</span>
              </div>
              <p className="text-red-500 text-sm font-black tracking-widest uppercase italic flex-1 text-left">{t.terminateSession}</p>
              <span className="material-symbols-outlined text-red-500/30 group-hover:text-red-500 transition-colors">chevron_right</span>
            </button>
          </div>

          {/* Duyar Official Brand Badge */}
          <div className="pt-8 pb-4 flex flex-col items-center justify-center text-center">
            <div className="size-16 rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_20px_rgba(19,236,218,0.25)] bg-[#07100f] mb-3 p-1.5 flex items-center justify-center">
              <img
                src="/duyar-symbol.png"
                alt="Duyar"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span>Duyar Real Estate Platform</span>
              <span className="material-symbols-outlined text-xs text-primary">verified</span>
            </p>
            <p className="text-[9px] text-white/40 tracking-wider mt-0.5">Version 2.2 • Verified Resident Network</p>
          </div>
        </section>
      </main>

      <BottomNav activeTab="PROFILE" onNavigate={onNavigate} lang={currentLang} />

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

interface MenuItemProps {
  id?: string;
  icon: string;
  label: string;
  onClick: () => void;
  status?: AppStatus;
  authorizedText?: string;
  reviewingText?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  id, 
  icon, 
  label, 
  onClick, 
  status = 'NONE', 
  authorizedText = 'Access Authorized', 
  reviewingText = 'Reviewing Data' 
}) => (
  <button 
    type="button"
    id={id}
    onClick={() => {
      haptics.dashboardNavigated();
      onClick();
    }} 
    className={`glass-card flex items-center gap-4 px-5 h-16 rounded-[1.5rem] w-full border border-white/5 hover:bg-white/5 transition-all group active:scale-[0.98] ${status === 'PENDING' ? 'border-primary/30 animate-pulse' : ''}`}
  >
    <div className={`flex items-center justify-center rounded-xl ${status === 'APPROVED' ? 'bg-primary text-background-dark' : 'bg-white/5 text-primary'} size-11 shrink-0 border border-white/10 shadow-inner group-hover:scale-105 transition-transform`}>
      <span className="material-symbols-outlined text-2xl font-light">{icon}</span>
    </div>
    <div className="flex flex-col flex-1 text-left overflow-hidden">
      <p className="text-white text-[13px] font-bold tracking-tight truncate uppercase italic">{label}</p>
      {status === 'APPROVED' && <p className="text-primary text-[8px] font-black uppercase tracking-widest leading-none mt-1">{authorizedText}</p>}
      {status === 'PENDING' && <p className="text-amber-500 text-[8px] font-black uppercase tracking-widest leading-none mt-1">{reviewingText}</p>}
    </div>
    <span className="material-symbols-outlined text-white/20 group-hover:text-primary transition-all">chevron_right</span>
  </button>
);

export default ProfileScreen;
