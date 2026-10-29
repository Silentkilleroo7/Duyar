import React, { useState, useEffect } from 'react';
import { Property, PropertyVisit, VisitAspectRatings } from '../types';
import { submitPropertyVisitReview, getStoredVisits } from '../visitStorage';
import { playBiometricSuccessEffect } from '../biometrics';

interface Props {
  onBack: () => void;
  onSubmit: (data: { rating: number; interest: string; review?: any }) => void;
  property?: Property | null;
  visit?: PropertyVisit | null;
}

const QUICK_TAG_OPTIONS = [
  'As Described',
  'Clean & Spotless',
  'Quiet Area',
  'Good Natural Light',
  'Great Ventilation',
  'Punctual Host',
  'Good Water Pressure',
  'Safe Neighborhood',
  'Price Negotiable',
  'Needs Minor Repairs'
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor Experience',
  2: 'Fair / Below Expectations',
  3: 'Average / Acceptable',
  4: 'Very Good / Satisfied',
  5: 'Exceptional / Loved It!'
};

const VisitFeedbackScreen: React.FC<Props> = ({ onBack, onSubmit, property, visit }) => {
  // If visit is provided, use visit info; otherwise fallback to property
  const effectivePropertyTitle = visit?.propertyTitle || property?.title || 'Modern 3BHK Luxury Flat';
  const effectiveLocation = visit?.propertyLocation || property?.location || 'Banani Block D, Dhaka';
  const effectiveImage = visit?.propertyImage || property?.image || '';
  const effectiveVisitDate = visit?.scheduledDate || 'Today';
  const effectiveVisitTime = visit?.scheduledTime || '10:30 AM';

  // Overall Rating state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Aspect star ratings
  const [aspectRatings, setAspectRatings] = useState<VisitAspectRatings>({
    propertyAccuracy: 5,
    hostProfessionalism: 5,
    neighborhoodSafety: 4,
    valueForPrice: 5
  });

  // Selected quick tags
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'As Described',
    'Clean & Spotless',
    'Good Natural Light'
  ]);

  // Review written text
  const [reviewText, setReviewText] = useState(
    'The flat was exactly as shown in the listing. The host was welcoming, on time, and answered all questions regarding utility bills and building rules.'
  );

  // Private notes
  const [personalNotes, setPersonalNotes] = useState('');

  // Interest level
  const [interest, setInterest] = useState<'Yes' | 'Maybe' | 'No'>('Yes');

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Prepopulate if visit already has review
  useEffect(() => {
    if (visit?.review) {
      setRating(visit.review.rating);
      if (visit.review.aspectRatings) {
        setAspectRatings(visit.review.aspectRatings);
      }
      if (visit.review.tags) {
        setSelectedTags(visit.review.tags);
      }
      if (visit.review.reviewText) {
        setReviewText(visit.review.reviewText);
      }
      if (visit.review.personalNotes) {
        setPersonalNotes(visit.review.personalNotes);
      }
      if (visit.review.interest) {
        setInterest(visit.review.interest);
      }
    }
  }, [visit]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAspectChange = (aspect: keyof VisitAspectRatings, value: number) => {
    setAspectRatings((prev) => ({
      ...prev,
      [aspect]: value
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    // Save review to persistent visit storage
    const targetVisitId = visit?.id || 'visit-1';
    const result = submitPropertyVisitReview({
      visitId: targetVisitId,
      rating,
      aspectRatings,
      reviewText,
      tags: selectedTags,
      interest,
      personalNotes,
      tenantName: 'Zahid Anwar'
    });

    try {
      playBiometricSuccessEffect();
    } catch (e) {
      // Audio effect fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSubmit({
          rating,
          interest,
          review: result?.review
        });
      }, 1600);
    }, 1200);
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-[480px] mx-auto overflow-x-hidden bg-background-dark font-display text-white selection:bg-primary/30 pb-16">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Submitting Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background-dark/85 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse scale-150" />
            <div className="size-20 rounded-full border-4 border-t-primary border-primary/10 animate-spin flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl animate-pulse">star</span>
            </div>
          </div>
          <p className="text-primary text-xs font-black uppercase tracking-[0.3em] animate-pulse">
            Saving Verified Review...
          </p>
          <p className="text-white/50 text-[11px] mt-1">Publishing visit feedback & star ratings</p>
        </div>
      )}

      {/* Success Modal Overlay */}
      {isSuccess && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-background-dark/95 backdrop-blur-2xl animate-in zoom-in duration-300 px-6 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/30 blur-[80px] rounded-full scale-[2] animate-pulse" />
            <div className="relative size-24 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(19,236,218,0.5)] border-4 border-white/20">
              <span className="material-symbols-outlined text-background-dark text-5xl font-black">
                verified
              </span>
            </div>
          </div>
          <h2 className="text-white text-2xl font-black uppercase italic tracking-tight mb-2">
            Feedback Submitted!
          </h2>
          <p className="text-white/60 text-xs leading-relaxed max-w-xs mb-4">
            Thank you for reviewing your scheduled visit. Your verified tenant feedback helps landlords maintain quality standards.
          </p>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-sm">stars</span>
            <span className="text-primary text-[10px] font-bold uppercase tracking-wider">
              {rating}.0 Star Verified Visit Rating
            </span>
          </div>
        </div>
      )}

      {/* Header bar */}
      <header className="flex items-center justify-between px-6 pt-12 pb-4">
        <button
          onClick={onBack}
          className="size-11 rounded-full glass flex items-center justify-center text-white active:scale-95 transition-transform border border-white/10 shadow-sm"
          title="Go back"
        >
          <span className="material-symbols-outlined text-sm">arrow_back_ios_new</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            Verified Visit Review
          </span>
        </div>

        <div className="size-11" />
      </header>

      <div className="px-6 flex-1">
        {/* Title & Property Summary Card */}
        <div className="mb-6">
          <h3 className="text-primary tracking-[0.2em] text-[10px] font-black uppercase mb-1 italic">
            Completed Property Visit
          </h3>
          <h1 className="text-white tracking-tight text-2xl font-black uppercase italic leading-tight">
            RATE & REVIEW VISIT
          </h1>
          <p className="text-white/60 text-xs mt-1 leading-relaxed">
            Share your honest evaluation of the property, host punctuality, and neighborhood.
          </p>

          {/* Property Context Snippet */}
          <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3.5">
            <div
              className="size-14 rounded-xl bg-center bg-cover shrink-0 border border-white/10"
              style={{ backgroundImage: `url("${effectiveImage}")` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                  Completed Visit
                </span>
              </div>
              <h4 className="text-white font-bold text-sm truncate leading-tight mt-0.5">
                {effectivePropertyTitle}
              </h4>
              <p className="text-white/40 text-[10px] truncate mt-0.5">
                {effectiveLocation} • {effectiveVisitDate}, {effectiveVisitTime}
              </p>
            </div>
          </div>
        </div>

        {/* 1. OVERALL STAR RATING CARD */}
        <div className="glass-card rounded-3xl p-6 border border-primary/30 shadow-[0_0_35px_rgba(19,236,218,0.12)] mb-6 text-center bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">
            Overall Visit Satisfaction
          </p>

          {/* Stars Row */}
          <div className="flex items-center justify-center gap-2.5 my-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => setRating(star)}
                className="transition-all transform active:scale-125 hover:scale-115 focus:outline-none p-1"
                aria-label={`Rate ${star} star`}
              >
                <span
                  className={`material-symbols-outlined text-4xl sm:text-5xl transition-colors drop-shadow-md ${
                    displayRating >= star ? 'text-amber-400' : 'text-white/15'
                  }`}
                  style={{ fontVariationSettings: displayRating >= star ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>

          {/* Rating Descriptor Label */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mt-1">
            <span className="text-amber-400 font-black text-sm">{displayRating}.0</span>
            <span className="w-1 h-3 bg-white/20 rounded-full" />
            <span className="text-white/90 text-xs font-bold uppercase tracking-wider">
              {RATING_LABELS[displayRating]}
            </span>
          </div>
        </div>

        {/* 2. DETAILED ASPECT STAR RATINGS */}
        <div className="glass-card rounded-3xl p-5 border border-white/10 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-xs font-black uppercase tracking-widest italic">
              Detailed Experience Criteria
            </h3>
            <span className="text-[10px] text-white/40 uppercase font-bold">1 to 5 Stars</span>
          </div>

          {/* Criteria 1: Property Accuracy */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-bold text-white">Property Accuracy</p>
              <p className="text-[10px] text-white/40">Matched photos & listed specs</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAspectChange('propertyAccuracy', s)}
                  className="p-0.5 focus:outline-none"
                >
                  <span
                    className={`material-symbols-outlined text-xl transition-colors ${
                      aspectRatings.propertyAccuracy >= s ? 'text-amber-400' : 'text-white/15'
                    }`}
                    style={{
                      fontVariationSettings: aspectRatings.propertyAccuracy >= s ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 2: Landlord / Host Professionalism */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <p className="text-xs font-bold text-white">Host Professionalism</p>
              <p className="text-[10px] text-white/40">Punctuality & behavior</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAspectChange('hostProfessionalism', s)}
                  className="p-0.5 focus:outline-none"
                >
                  <span
                    className={`material-symbols-outlined text-xl transition-colors ${
                      aspectRatings.hostProfessionalism >= s ? 'text-amber-400' : 'text-white/15'
                    }`}
                    style={{
                      fontVariationSettings: aspectRatings.hostProfessionalism >= s ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 3: Neighborhood & Security */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <p className="text-xs font-bold text-white">Neighborhood & Safety</p>
              <p className="text-[10px] text-white/40">Road access, noise & security</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAspectChange('neighborhoodSafety', s)}
                  className="p-0.5 focus:outline-none"
                >
                  <span
                    className={`material-symbols-outlined text-xl transition-colors ${
                      aspectRatings.neighborhoodSafety >= s ? 'text-amber-400' : 'text-white/15'
                    }`}
                    style={{
                      fontVariationSettings: aspectRatings.neighborhoodSafety >= s ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Criteria 4: Value for Rent Price */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div>
              <p className="text-xs font-bold text-white">Value for Rent Price</p>
              <p className="text-[10px] text-white/40">Worth the quoted monthly rent</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAspectChange('valueForPrice', s)}
                  className="p-0.5 focus:outline-none"
                >
                  <span
                    className={`material-symbols-outlined text-xl transition-colors ${
                      aspectRatings.valueForPrice >= s ? 'text-amber-400' : 'text-white/15'
                    }`}
                    style={{
                      fontVariationSettings: aspectRatings.valueForPrice >= s ? "'FILL' 1" : "'FILL' 0"
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. QUICK EXPERIENCE TAGS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-white text-xs font-black uppercase tracking-widest italic">
              Experience Highlights
            </h3>
            <span className="text-[10px] text-primary font-bold">
              {selectedTags.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_TAG_OPTIONS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-primary text-background-dark shadow-md shadow-primary/25 border border-primary'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm font-bold">
                    {isSelected ? 'check' : 'add'}
                  </span>
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. WRITTEN REVIEW */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-white text-xs font-black uppercase tracking-widest italic">
              Public Written Review
            </h3>
            <span className="text-[10px] text-white/40">Visible to community</span>
          </div>
          <textarea
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Describe what you observed during the visit (ventilation, road width, noise, water pressure, building security)..."
            className="w-full bg-white/5 border border-white/10 focus:border-primary/50 rounded-2xl p-4 text-white placeholder:text-white/20 text-xs font-medium outline-none transition-all leading-relaxed shadow-inner"
          />
        </div>

        {/* 5. PRIVATE INSPECTION NOTES (Optional) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-white text-xs font-black uppercase tracking-widest italic flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-sm">lock</span>
              <span>Private Inspection Notes</span>
            </h3>
            <span className="text-[10px] text-white/40">Private to you only</span>
          </div>
          <textarea
            rows={2}
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder="E.g., measurements for sofa, AC outlet locations, advance deposit discussed..."
            className="w-full bg-white/[0.03] border border-white/5 focus:border-primary/40 rounded-2xl p-3.5 text-white placeholder:text-white/20 text-xs font-medium outline-none transition-all"
          />
        </div>

        {/* 6. RENTAL INTENTION / INTEREST LEVEL */}
        <div className="mb-8">
          <h3 className="text-white text-xs font-black uppercase tracking-widest italic mb-3 text-center">
            Are you interested in renting this property?
          </h3>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { key: 'Yes', label: 'Ready to Rent', icon: 'thumb_up' },
              { key: 'Maybe', label: 'Considering', icon: 'hourglass_empty' },
              { key: 'No', label: 'Not for Me', icon: 'thumb_down' }
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setInterest(opt.key as any)}
                className={`py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center gap-1 transition-all border ${
                  interest === opt.key
                    ? 'bg-primary text-background-dark border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                <span className="tracking-wider uppercase text-[10px] font-black">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isSuccess}
          className="w-full bg-primary hover:bg-primary/90 text-background-dark py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] italic shadow-[0_0_30px_rgba(19,236,218,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span>SUBMIT VISIT REVIEW</span>
          <span className="material-symbols-outlined font-black text-base">send</span>
        </button>
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
};

export default VisitFeedbackScreen;
