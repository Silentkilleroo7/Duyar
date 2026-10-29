import React from 'react';

interface ProviderAvatarProps {
  name?: string;
  category?: string;
  role?: string;
  image?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineDot?: boolean;
  isOnline?: boolean;
}

// Filter out demo, stock, and mock picture URLs
export function isRealUserUploadedImage(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (
    clean === '' ||
    clean.includes('aida-public') ||
    clean.includes('images.unsplash.com') ||
    clean.includes('placeholder.com') ||
    clean.includes('via.placeholder') ||
    clean.includes('picsum.photos') ||
    clean.includes('dummyimage') ||
    clean.includes('default-avatar')
  ) {
    return false;
  }
  // Allow real data URIs, blob URLs, Supabase storage, Cloudinary, or relative uploads
  return (
    clean.startsWith('data:image/') ||
    clean.startsWith('blob:') ||
    clean.includes('supabase.co/storage') ||
    clean.includes('res.cloudinary.com') ||
    clean.startsWith('/uploads/') ||
    clean.startsWith('/storage/')
  );
}

// Generate clean monogram initials from name
export function getInitials(name?: string): string {
  if (!name) return 'DY';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DY';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  // If starts with honorifics like Md., Mr., Mrs., Dr.
  const first = parts[0].replace(/\./g, '').toLowerCase();
  if ((first === 'md' || first === 'mst' || first === 'mr' || first === 'mrs' || first === 'dr') && parts.length >= 3) {
    return (parts[1][0] + parts[2][0]).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Category-based colors and icons for fresh production UI
export function getCategoryTheme(categoryOrRole?: string) {
  const str = (categoryOrRole || '').toLowerCase();
  
  if (str.includes('maid') || str.includes('clean') || str.includes('housekeep')) {
    return {
      gradient: 'from-[#062c24] via-[#0b3d32] to-[#041d18]',
      textColor: 'text-emerald-300',
      borderColor: 'border-emerald-400/40',
      glowColor: 'rgba(16, 185, 129, 0.25)',
      icon: 'cleaning_services',
      accent: '#10b981'
    };
  }

  if (str.includes('sec') || str.includes('guard') || str.includes('cctv')) {
    return {
      gradient: 'from-[#0b1b36] via-[#10274f] to-[#081226]',
      textColor: 'text-cyan-300',
      borderColor: 'border-cyan-400/40',
      glowColor: 'rgba(6, 182, 212, 0.25)',
      icon: 'shield_person',
      accent: '#06b6d4'
    };
  }

  if (str.includes('pick') || str.includes('drop') || str.includes('cargo') || str.includes('mov') || str.includes('parcel')) {
    return {
      gradient: 'from-[#331c05] via-[#482808] to-[#201002]',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-400/40',
      glowColor: 'rgba(245, 158, 11, 0.25)',
      icon: 'local_shipping',
      accent: '#f59e0b'
    };
  }

  if (str.includes('plumb')) {
    return {
      gradient: 'from-[#072430] via-[#0a3345] to-[#041720]',
      textColor: 'text-sky-300',
      borderColor: 'border-sky-400/40',
      glowColor: 'rgba(56, 189, 248, 0.25)',
      icon: 'plumbing',
      accent: '#38bdf8'
    };
  }

  // Default: Electrical / Maintenance / General Specialist
  return {
    gradient: 'from-[#0a2724] via-[#103d38] to-[#061c1a]',
    textColor: 'text-primary',
    borderColor: 'border-primary/40',
    glowColor: 'rgba(19, 236, 218, 0.25)',
    icon: 'handyman',
    accent: '#13ecda'
  };
}

export const ProviderAvatar: React.FC<ProviderAvatarProps> = ({
  name = 'Specialist',
  category = '',
  role = '',
  image,
  size = 'md',
  className = '',
  showOnlineDot = true,
  isOnline = true
}) => {
  const hasRealImage = isRealUserUploadedImage(image);
  const initials = getInitials(name);
  const theme = getCategoryTheme(category || role);

  const sizeClasses = {
    xs: 'size-7 text-[10px]',
    sm: 'size-9 text-xs',
    md: 'size-11 text-sm',
    lg: 'size-14 text-base',
    xl: 'size-20 text-xl'
  }[size];

  const dotSizes = {
    xs: 'size-2 border-[1.5px] -bottom-0.5 -right-0.5',
    sm: 'size-2.5 border-2 bottom-0 right-0',
    md: 'size-3 border-2 bottom-0 right-0',
    lg: 'size-3.5 border-2 bottom-0.5 right-0.5',
    xl: 'size-4 border-2 bottom-1 right-1'
  }[size];

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      {hasRealImage ? (
        <div 
          className={`${sizeClasses} rounded-2xl bg-cover bg-center border-2 ${theme.borderColor} overflow-hidden shadow-md`}
          style={{ backgroundImage: `url("${image}")` }}
        />
      ) : (
        <div 
          className={`${sizeClasses} rounded-2xl bg-gradient-to-br ${theme.gradient} border-2 ${theme.borderColor} flex items-center justify-center font-black tracking-tight ${theme.textColor} shadow-lg relative overflow-hidden`}
          style={{ boxShadow: `0 0 16px ${theme.glowColor}` }}
          title={`${name} (${category || role || 'Verified Specialist'})`}
        >
          {/* Subtle geometric backlight accent */}
          <div 
            className="absolute -top-3 -right-3 size-8 rounded-full blur-md opacity-40 pointer-events-none"
            style={{ backgroundColor: theme.accent }}
          />

          <span className="relative z-10 uppercase font-black drop-shadow-sm">
            {initials}
          </span>
        </div>
      )}

      {showOnlineDot && (
        <div 
          className={`absolute ${dotSizes} ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'} rounded-full border-background-dark shadow-sm`}
          title={isOnline ? 'Active Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default ProviderAvatar;
