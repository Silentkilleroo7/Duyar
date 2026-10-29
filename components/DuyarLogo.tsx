import React from 'react';

interface DuyarLogoProps {
  size?: number | string;
  className?: string;
  glow?: boolean;
  withText?: boolean;
  showStoryOnClick?: boolean;
}

export const DuyarLogo: React.FC<DuyarLogoProps> = ({
  size = 48,
  className = '',
  glow = true,
  withText = false,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div 
      className={`inline-flex items-center gap-2.5 ${className}`}
      title="Duyar"
    >
      <div 
        className="relative shrink-0 group select-none flex items-center justify-center"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {glow && (
          <div 
            className="absolute inset-0 bg-[#13ecda]/25 rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-300 pointer-events-none" 
          />
        )}
        <img
          src="/duyar-symbol.png"
          alt="Duyar"
          className="relative w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_4px_14px_rgba(19,236,218,0.3)]"
        />
      </div>

      {withText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-white font-black tracking-tight text-base leading-none">
              Duyar
            </span>
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              Verified
            </span>
          </div>
          <span className="text-primary/80 text-[8px] font-bold tracking-widest uppercase mt-0.5">
            The Door to Smart Living
          </span>
        </div>
      )}
    </div>
  );
};

export default DuyarLogo;
