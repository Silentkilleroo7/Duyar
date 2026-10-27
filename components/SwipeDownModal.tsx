import React, { useEffect } from 'react';
import { useSwipeDownDismiss } from './useSwipeDownDismiss';

interface SwipeDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const SwipeDownModal: React.FC<SwipeDownModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  children,
  maxHeight = 'max-h-[85vh]',
  className = ''
}) => {
  const {
    containerRef,
    style,
    handleTouchProps,
    isDragging,
    offsetY
  } = useSwipeDownDismiss({
    onDismiss: onClose,
    threshold: 80,
    resistance: 0.75,
    enabled: isOpen
  });

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        style={style}
        className={`w-full max-w-[480px] bg-[#0c1817] border-t border-x border-white/15 rounded-t-[2.5rem] shadow-[0_-15px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ${maxHeight} ${className} relative`}
      >
        {/* Grab Handle Header (Touch/Drag Zone) */}
        <div 
          {...handleTouchProps}
          className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0 group hover:bg-white/[0.02] transition-colors"
          title="Drag down to close"
        >
          <div className={`w-14 h-1.5 rounded-full transition-all duration-200 ${
            isDragging || offsetY > 0 
              ? 'bg-primary scale-x-110 shadow-[0_0_10px_rgba(19,236,218,0.5)]' 
              : 'bg-white/30 group-hover:bg-white/50'
          }`} />
          <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-white/30 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Pull down to dismiss
          </span>
        </div>

        {/* Optional Title Bar */}
        {(title || icon) && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="size-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-base font-black uppercase tracking-tight italic">
                    {title}
                  </h3>
                  {badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {badge}
                    </span>
                  )}
                </div>
                {subtitle && (
                  <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-95"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SwipeDownModal;
