import React, { useState, useEffect } from 'react';
import { PropertyVisit, VisitReview } from '../types';
import {
  getStoredVisits,
  getUserVisits,
  markVisitAsCompleted,
  cancelPropertyVisit
} from '../visitStorage';

interface Props {
  onBack: () => void;
  onNavigate: () => void;
  onArrival: () => void;
  onRateVisit?: (visit: PropertyVisit) => void;
  userProfile?: any;
}

const MyVisits: React.FC<Props> = ({ onBack, onNavigate, onArrival, onRateVisit, userProfile }) => {
  const [tab, setTab] = useState<'UPCOMING' | 'COMPLETED' | 'REVIEWS'>('UPCOMING');
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [selectedReviewForModal, setSelectedReviewForModal] = useState<VisitReview | null>(null);

  const loadVisits = () => {
    const userPhone = userProfile?.phone || localStorage.getItem('duyar_user_phone') || undefined;
    const userId = userProfile?.id;
    setVisits(getUserVisits(userPhone, userId));
  };

  useEffect(() => {
    loadVisits();
  }, [userProfile]);

  const handleMarkCompleted = (visit: PropertyVisit) => {
    const updated = markVisitAsCompleted(visit.id);
    loadVisits();
    // Switch to completed tab or directly trigger review
    if (onRateVisit && updated) {
      onRateVisit(updated);
    } else {
      setTab('COMPLETED');
    }
  };

  const handleCancelVisit = (visitId: string) => {
    if (window.confirm('Are you sure you want to cancel this scheduled property visit?')) {
      cancelPropertyVisit(visitId);
      loadVisits();
    }
  };

  const upcomingVisits = visits.filter((v) => v.status === 'SCHEDULED');
  const completedVisits = visits.filter((v) => v.status === 'COMPLETED');
  const reviewedVisits = visits.filter((v) => v.status === 'COMPLETED' && v.review);

  return (
    <div className="min-h-screen bg-background-dark text-white p-5 pt-12 flex flex-col font-display max-w-[480px] mx-auto pb-16">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="size-11 glass rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-all text-white"
          title="Back"
        >
          <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
        </button>
        <div className="text-center">
          <p className="text-primary font-black text-[10px] tracking-[0.25em] uppercase italic">
            Schedule & History
          </p>
          <h1 className="text-white font-black text-xl tracking-tight uppercase italic leading-none">
            My Property Visits
          </h1>
        </div>
        <div className="size-11" />
      </header>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-6">
        {[
          { id: 'UPCOMING', label: 'Upcoming', count: upcomingVisits.length },
          { id: 'COMPLETED', label: 'Completed', count: completedVisits.length },
          { id: 'REVIEWS', label: 'My Reviews', count: reviewedVisits.length }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
              tab === t.id
                ? 'bg-primary text-background-dark shadow-md shadow-primary/20'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span>{t.label}</span>
            {t.count > 0 && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  tab === t.id ? 'bg-background-dark/20 text-background-dark' : 'bg-white/10 text-primary'
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: UPCOMING VISITS */}
      {tab === 'UPCOMING' && (
        <div className="space-y-4 flex-1">
          {upcomingVisits.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center glass-card rounded-3xl p-8 border border-white/5">
              <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/30">
                <span className="material-symbols-outlined text-4xl">calendar_month</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">No Upcoming Visits</p>
              <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                Browse properties and click "Book Visit" to schedule an in-person viewing with landlords.
              </p>
            </div>
          ) : (
            upcomingVisits.map((visit) => (
              <div
                key={visit.id}
                className="glass-card rounded-[2rem] p-4 flex flex-col gap-3.5 border border-white/10 bg-white/[0.03] shadow-lg hover:border-primary/30 transition-all"
              >
                {/* Top Info */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="size-16 rounded-2xl bg-center bg-cover border border-white/10 shrink-0"
                    style={{ backgroundImage: `url("${visit.propertyImage}")` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {visit.scheduledDate} • {visit.scheduledTime}
                      </span>
                      <span className="text-[11px] font-black text-white">{visit.propertyPrice}</span>
                    </div>
                    <h4 className="font-bold text-sm truncate leading-tight text-white mt-1">
                      {visit.propertyTitle}
                    </h4>
                    <p className="text-white/40 text-[10px] font-medium truncate mt-0.5">
                      {visit.propertyLocation}
                    </p>
                  </div>
                </div>

                {/* Landlord Contact Row */}
                {visit.landlordName && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                      <span className="text-white/70">Host: <strong className="text-white">{visit.landlordName}</strong></span>
                    </div>
                    {visit.landlordPhone && (
                      <a
                        href={`tel:${visit.landlordPhone}`}
                        className="text-primary hover:underline font-bold text-[10px] uppercase flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">call</span>
                        Call Host
                      </a>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={onNavigate}
                    className="h-11 rounded-xl bg-primary text-background-dark font-black text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    title="Get turn-by-turn directions"
                  >
                    <span className="material-symbols-outlined text-sm font-black">near_me</span>
                    <span>Route</span>
                  </button>

                  <button
                    onClick={onArrival}
                    className="h-11 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 font-bold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    title="Simulate check-in at the property"
                  >
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    <span>Check In</span>
                  </button>

                  <button
                    onClick={() => handleMarkCompleted(visit)}
                    className="h-11 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 font-bold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 active:scale-95 transition-all"
                    title="Mark visit as finished and rate it"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Done</span>
                  </button>
                </div>

                {/* Cancel Link */}
                <div className="text-right px-1">
                  <button
                    onClick={() => handleCancelVisit(visit.id)}
                    className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
                  >
                    Cancel visit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: COMPLETED VISITS */}
      {tab === 'COMPLETED' && (
        <div className="space-y-4 flex-1">
          {completedVisits.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center glass-card rounded-3xl p-8 border border-white/5">
              <span className="material-symbols-outlined text-4xl text-white/30 mb-3">history</span>
              <p className="text-sm font-bold text-white mb-1">No Completed Visits Yet</p>
              <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                When you finish an in-person property visit, mark it completed to provide verified tenant star ratings and reviews.
              </p>
            </div>
          ) : (
            completedVisits.map((visit) => {
              const hasReview = Boolean(visit.review);
              return (
                <div
                  key={visit.id}
                  className={`glass-card rounded-[2rem] p-4 flex flex-col gap-3.5 border transition-all ${
                    hasReview
                      ? 'border-white/10 bg-white/[0.03]'
                      : 'border-amber-400/40 bg-gradient-to-b from-amber-400/10 via-white/[0.02] to-transparent shadow-[0_0_20px_rgba(251,191,36,0.1)]'
                  }`}
                >
                  {/* Property Header Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className="size-16 rounded-2xl bg-center bg-cover border border-white/10 shrink-0"
                      style={{ backgroundImage: `url("${visit.propertyImage}")` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Completed Visit
                        </span>
                        <span className="text-[10px] text-white/40">
                          {visit.scheduledDate}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm truncate leading-tight text-white mt-1">
                        {visit.propertyTitle}
                      </h4>
                      <p className="text-white/40 text-[10px] font-medium truncate mt-0.5">
                        {visit.propertyLocation}
                      </p>
                    </div>
                  </div>

                  {/* Review Status Section */}
                  {hasReview && visit.review ? (
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className="material-symbols-outlined text-base"
                                style={{
                                  fontVariationSettings:
                                    visit.review!.rating >= s ? "'FILL' 1" : "'FILL' 0"
                                }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <span className="text-xs font-black text-amber-400">
                            {visit.review.rating}.0
                          </span>
                        </div>

                        <span className="text-[9px] text-white/40 font-bold uppercase">
                          Reviewed on {visit.review.reviewedAt}
                        </span>
                      </div>

                      {/* Review text snippet */}
                      <p className="text-xs text-white/80 italic leading-relaxed line-clamp-2">
                        "{visit.review.reviewText}"
                      </p>

                      {/* Tags */}
                      {visit.review.tags && visit.review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {visit.review.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                          {visit.review.tags.length > 3 && (
                            <span className="text-[9px] text-white/40 self-center">
                              +{visit.review.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action to re-open / edit review */}
                      <div className="pt-1 flex items-center justify-between border-t border-white/5">
                        <span className="text-[10px] font-semibold text-emerald-400 inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          Verified Review Published
                        </span>
                        <button
                          type="button"
                          onClick={() => onRateVisit && onRateVisit(visit)}
                          className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                        >
                          Edit Review
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Awaiting Review Banner */
                    <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-xl">rate_review</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-amber-300 uppercase tracking-wide">
                            Feedback Requested
                          </p>
                          <p className="text-[11px] text-white/70 leading-tight mt-0.5">
                            How was your visit? Rate this property to help fellow tenants and inform the landlord.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRateVisit && onRateVisit(visit)}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-background-dark font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm font-black">star</span>
                        <span>Rate & Review This Visit</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: MY REVIEWS */}
      {tab === 'REVIEWS' && (
        <div className="space-y-4 flex-1">
          {reviewedVisits.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center glass-card rounded-3xl p-8 border border-white/5">
              <span className="material-symbols-outlined text-4xl text-white/30 mb-3">reviews</span>
              <p className="text-sm font-bold text-white mb-1">No Reviews Given Yet</p>
              <p className="text-xs text-white/40 max-w-xs leading-relaxed">
                Complete a property visit and share your evaluation to build your verified reviewer profile.
              </p>
            </div>
          ) : (
            reviewedVisits.map((visit) => {
              const review = visit.review!;
              return (
                <div
                  key={review.id}
                  className="glass-card rounded-[2rem] p-5 border border-white/10 bg-white/[0.03] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{visit.propertyTitle}</h4>
                      <p className="text-white/40 text-[10px]">{visit.propertyLocation}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-xl">
                      <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="text-amber-400 text-xs font-black">{review.rating}.0</span>
                    </div>
                  </div>

                  {/* Aspect mini-breakdown */}
                  {review.aspectRatings && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Accuracy</span>
                        <span className="text-amber-400 font-bold">★ {review.aspectRatings.propertyAccuracy}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Host Behavior</span>
                        <span className="text-amber-400 font-bold">★ {review.aspectRatings.hostProfessionalism}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Neighborhood</span>
                        <span className="text-amber-400 font-bold">★ {review.aspectRatings.neighborhoodSafety}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50">Value/Price</span>
                        <span className="text-amber-400 font-bold">★ {review.aspectRatings.valueForPrice}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-white/80 leading-relaxed italic bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    "{review.reviewText}"
                  </p>

                  {/* Tags */}
                  {review.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {review.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-white/40">
                    <span>Reviewed: {review.reviewedAt}</span>
                    <button
                      type="button"
                      onClick={() => onRateVisit && onRateVisit(visit)}
                      className="text-primary font-bold hover:underline uppercase tracking-wider"
                    >
                      Update Review
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(24px);
        }
      `}</style>
    </div>
  );
};

export default MyVisits;
