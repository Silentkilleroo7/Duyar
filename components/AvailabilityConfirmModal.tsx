import React, { useState } from 'react';
import { SwipeDownModal } from './SwipeDownModal';
import { ScheduledMaintenanceVisit, confirmVisitAvailability, delayVisitSchedule } from '../maintenanceScheduler';
import { haptics } from '../haptics';

interface Props {
  visit: ScheduledMaintenanceVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed?: () => void;
}

export const AvailabilityConfirmModal: React.FC<Props> = ({
  visit,
  isOpen,
  onClose,
  onConfirmed
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!visit) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    haptics.bookingConfirmed();
    confirmVisitAvailability(visit.id);

    setSuccessMessage("Availability Confirmed! Your technician has been notified and is proceeding with transit.");
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage(null);
      if (onConfirmed) onConfirmed();
      onClose();
    }, 1800);
  };

  const handleDelay = () => {
    haptics.medium();
    delayVisitSchedule(visit.id, 15);
    setSuccessMessage("15-minute buffer requested. Technician's arrival has been rescheduled.");
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1800);
  };

  return (
    <SwipeDownModal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Your Availability"
      subtitle="30-Minute Pre-Visit Arrival Check"
      icon="verified_user"
      badge="30m Notice"
      maxHeight="max-h-[85vh]"
    >
      <div className="space-y-4 text-white font-display">
        {successMessage ? (
          <div className="p-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="size-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
            </div>
            <h4 className="text-white text-base font-black uppercase tracking-tight">
              Confirmation Sent
            </h4>
            <p className="text-emerald-300 text-xs font-medium leading-relaxed">
              {successMessage}
            </p>
          </div>
        ) : (
          <>
            {/* Arrival Notice Banner with Glowing Accents */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  Arrival in ~30 Minutes
                </span>
                <span className="text-[9px] font-mono uppercase bg-primary/20 text-primary px-2 py-0.5 rounded font-bold">
                  {visit.scheduledTime}
                </span>
              </div>
              <p className="text-xs text-white/90 font-semibold leading-relaxed">
                Your booked <span className="text-primary font-bold">{visit.serviceType}</span> specialist is preparing to depart. Please confirm someone will be at the premises.
              </p>
            </div>

            {/* Provider Profile Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3.5">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className="size-13 rounded-2xl bg-cover bg-center border border-primary/40 shadow-lg"
                    style={{ backgroundImage: `url('${visit.providerImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaX6sDjQxpvUGeB_0Not7GzlTANyX0X71oCtAQZnlfX-kNT3gwtoOBsEs1UeWpAm1ath0eBsxXu5SwYrJt0xkZt--1UO42wIRyfJiY1FbTZm_4n6S6LEOmFKpTF-fwJLpQVvN2yMO8iKFMIaVhmTdA2gkLZWk0SwOMa0Wi8KmJ2TnMkZo9Sql6FCefcWPX7V5nrbVNpjksJVtryOenL8Z38OAV6uzzy9zr7Z20NN-5foEcNq_zB9akXMpZrujmbxb0WY3foZr7iTA'}')` }}
                  />
                  <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 rounded-full border-2 border-[#0c1817] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[9px] text-black font-black">check</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="text-white text-sm font-extrabold tracking-tight truncate">
                    {visit.providerName}
                  </h4>
                  <p className="text-primary text-[10px] font-bold uppercase tracking-wider truncate mt-0.5">
                    {visit.providerRole}
                  </p>
                  <p className="text-white/40 text-[9px] font-mono truncate mt-0.5">
                    Order: {visit.id}
                  </p>
                </div>
              </div>

              {visit.providerPhone && (
                <a
                  href={`tel:${visit.providerPhone}`}
                  className="size-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center justify-center active:scale-95 transition-all shrink-0"
                  title="Direct Call"
                >
                  <span className="material-symbols-outlined text-xl">call</span>
                </a>
              )}
            </div>

            {/* Service & Location Summary */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span className="material-symbols-outlined text-primary text-sm">home_pin</span>
                <span className="font-semibold truncate">{visit.address}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/60">
                <span className="material-symbols-outlined text-emerald-400 text-sm">shield</span>
                <span>Duyar Verified Visit • Zero Contact Charges if Cancelled Early</span>
              </div>
            </div>

            {/* Interactive Response Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                id="btn-confirm-availability-modal"
                disabled={isSubmitting}
                onClick={handleConfirm}
                className="w-full py-4 px-5 rounded-2xl bg-primary hover:bg-[#11d8c7] text-background-dark font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(19,236,218,0.35)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg font-black">check_circle</span>
                <span>Yes, I Am Available (Confirm)</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-delay-availability-modal"
                  onClick={handleDelay}
                  className="flex-1 py-3 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-white/5"
                >
                  <span className="material-symbols-outlined text-sm">snooze</span>
                  <span>Delay 15 Mins</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </SwipeDownModal>
  );
};

export default AvailabilityConfirmModal;
