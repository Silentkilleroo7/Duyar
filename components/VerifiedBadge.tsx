import React from 'react';
import { getListingProviderVerification, ListingProviderVerificationInfo } from '../providerApplicationsStorage';

export interface VerifiedBadgeProps {
  property: any;
  variant?: 'card' | 'pill' | 'subtle' | 'hero' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
  showUnverified?: boolean;
  lang?: 'EN' | 'BN';
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  property,
  variant = 'card',
  size = 'sm',
  showSubtext = false,
  showUnverified = false,
  lang = 'EN',
  className = ''
}) => {
  const info: ListingProviderVerificationInfo = getListingProviderVerification(property);
  const isBn = lang === 'BN';

  // If not verified and not showing unverified / not pending, don't render anything
  if (!info.isVerified && !info.isPendingVerification && !showUnverified) {
    return null;
  }

  const label = isBn ? info.badgeLabelBn : info.badgeLabel;
  const subtext = isBn ? info.badgeSubtextBn : info.badgeSubtext;

  // Configuration based on provider role
  let themeStyles = {
    bg: 'bg-emerald-500/95',
    text: 'text-white',
    border: 'border-emerald-400/50',
    ring: 'ring-emerald-500/30',
    iconColor: 'text-white',
    shadow: 'shadow-[0_4px_16px_rgba(16,185,129,0.35)]',
    pillBg: 'bg-emerald-500/15',
    pillText: 'text-emerald-400',
    pillBorder: 'border-emerald-500/30',
    dotBg: 'bg-emerald-400'
  };

  if (info.role === 'LOCATOR' && info.isVerified) {
    // Approved locator listing (Cyan / Teal themed for Locator Network)
    themeStyles = {
      bg: 'bg-[#13ecda]/95',
      text: 'text-[#0a1211]',
      border: 'border-[#13ecda]/60',
      ring: 'ring-[#13ecda]/40',
      iconColor: 'text-[#0a1211]',
      shadow: 'shadow-[0_4px_16px_rgba(19,236,218,0.4)]',
      pillBg: 'bg-[#13ecda]/15',
      pillText: 'text-[#13ecda]',
      pillBorder: 'border-[#13ecda]/35',
      dotBg: 'bg-[#13ecda]'
    };
  } else if (info.isPendingVerification) {
    // Pending moderation (Amber themed)
    themeStyles = {
      bg: 'bg-amber-500/90',
      text: 'text-black',
      border: 'border-amber-400/50',
      ring: 'ring-amber-500/30',
      iconColor: 'text-black',
      shadow: 'shadow-[0_4px_12px_rgba(245,158,11,0.25)]',
      pillBg: 'bg-amber-500/15',
      pillText: 'text-amber-300',
      pillBorder: 'border-amber-400/30',
      dotBg: 'bg-amber-400'
    };
  } else if (!info.isVerified) {
    // Unverified
    themeStyles = {
      bg: 'bg-white/10',
      text: 'text-white/60',
      border: 'border-white/15',
      ring: 'ring-white/10',
      iconColor: 'text-white/50',
      shadow: 'shadow-none',
      pillBg: 'bg-white/5',
      pillText: 'text-white/50',
      pillBorder: 'border-white/10',
      dotBg: 'bg-white/40'
    };
  }

  // Size specifications
  const sizeConfig = {
    xs: {
      text: 'text-[8px]',
      icon: 'text-[10px]',
      padding: 'px-1.5 py-0.5',
      gap: 'gap-0.5'
    },
    sm: {
      text: 'text-[9px]',
      icon: 'text-[11px]',
      padding: 'px-2 py-0.5',
      gap: 'gap-1'
    },
    md: {
      text: 'text-[10px]',
      icon: 'text-[13px]',
      padding: 'px-2.5 py-1',
      gap: 'gap-1.5'
    },
    lg: {
      text: 'text-xs',
      icon: 'text-base',
      padding: 'px-3 py-1.5',
      gap: 'gap-2'
    }
  }[size];

  // VARIANT: Floating Card Tag (Used on top-left of image thumbnails)
  if (variant === 'card') {
    return (
      <div 
        className={`inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding} rounded-full backdrop-blur-md border ${themeStyles.border} ${themeStyles.bg} ${themeStyles.text} ${themeStyles.shadow} font-black uppercase tracking-wider select-none transition-transform group-hover:scale-102 ${className}`}
        title={`${label}: ${subtext} • Audited by ${info.verifiedBy}`}
      >
        <span 
          className={`material-symbols-outlined ${sizeConfig.icon} ${themeStyles.iconColor} font-black leading-none`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {info.icon}
        </span>
        <span className={`${sizeConfig.text} leading-none font-black truncate max-w-[120px]`}>
          {label}
        </span>
      </div>
    );
  }

  // VARIANT: Compact Badge (Small pill with icon & short tag)
  if (variant === 'compact') {
    return (
      <span 
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${themeStyles.pillBg} ${themeStyles.pillText} border ${themeStyles.pillBorder} ${className}`}
        title={`${label} (${info.verifiedBy})`}
      >
        <span className="material-symbols-outlined text-[10px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>
          {info.icon}
        </span>
        <span>{label}</span>
      </span>
    );
  }

  // VARIANT: Inline Pill (For tables, info rows, or lists)
  if (variant === 'pill') {
    return (
      <div 
        className={`inline-flex items-center ${sizeConfig.gap} ${sizeConfig.padding} rounded-full border ${themeStyles.pillBorder} ${themeStyles.pillBg} ${themeStyles.pillText} font-extrabold uppercase tracking-wider select-none ${className}`}
        title={`${label}: ${subtext}`}
      >
        <span 
          className={`material-symbols-outlined ${sizeConfig.icon} leading-none`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {info.icon}
        </span>
        <span className={`${sizeConfig.text} leading-none font-black`}>
          {label}
        </span>
      </div>
    );
  }

  // VARIANT: Hero / Detail view with full audit subtext
  if (variant === 'hero') {
    return (
      <div className={`flex items-center gap-2.5 p-3 rounded-2xl border ${themeStyles.pillBorder} ${themeStyles.pillBg} backdrop-blur-xl ${className}`}>
        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${themeStyles.bg} ${themeStyles.text} shadow-md`}>
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            {info.icon}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-black uppercase tracking-wider ${themeStyles.pillText}`}>
              {label}
            </span>
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <span className="text-[11px] text-white/60 truncate mt-0.5 font-medium">
            {subtext} • <strong className="text-white/80">{info.verifiedBy}</strong>
          </span>
        </div>
      </div>
    );
  }

  // VARIANT: Subtle inline text with icon
  return (
    <span 
      className={`inline-flex items-center gap-1 ${themeStyles.pillText} ${sizeConfig.text} font-black uppercase tracking-wider ${className}`}
      title={`${label}: ${subtext}`}
    >
      <span className={`material-symbols-outlined ${sizeConfig.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {info.icon}
      </span>
      <span>{label}</span>
      {showSubtext && (
        <span className="text-white/40 normal-case font-normal text-[9px] ml-1 truncate">
          ({subtext})
        </span>
      )}
    </span>
  );
};

export default VerifiedBadge;
