import React, { useState } from 'react';
import { haptics } from '../haptics';
import ProviderAvatar from './ProviderAvatar';

export interface ServiceRatingData {
  providerName?: string;
  providerRole?: string;
  providerImage?: string;
  category?: string;
  type?: string;
  title?: string;
  [key: string]: any;
}

interface Props {
  onBack: () => void;
  onSubmit: (ratingData?: any) => void;
  serviceType?: string;
  serviceData?: ServiceRatingData | null;
}

const DEFAULT_AVATAR = '';

interface ServiceRatingConfig {
  providerName: string;
  providerRole: string;
  providerImage: string;
  serviceCategory: string;
  icon: string;
  tags: string[];
  defaultTags: string[];
  placeholder: string;
}

function getRatingConfig(serviceType?: string, serviceData?: ServiceRatingData | null): ServiceRatingConfig {
  const raw = (serviceType || serviceData?.category || serviceData?.type || serviceData?.title || '').toLowerCase();

  // 1. SECURITY GUARD
  if (raw.includes('security') || raw.includes('guard') || raw.includes('cctv') || raw.includes('patrol')) {
    const pName = serviceData?.providerName || 'Security Specialist';
    return {
      providerName: pName,
      providerRole: serviceData?.providerRole || 'Senior Security Specialist',
      providerImage: serviceData?.providerImage || '',
      serviceCategory: 'Security Guard Service',
      icon: 'shield_person',
      tags: [
        'Vigilant & Alert',
        'Punctual & Disciplined',
        'Professional Conduct',
        'Gate & Perimeter Safety',
        'Emergency Prepared',
        'Polite & Respectful'
      ],
      defaultTags: ['Vigilant & Alert', 'Professional Conduct'],
      placeholder: `Share your feedback on ${pName}'s alertness, guarding quality, and perimeter vigilance...`
    };
  }

  // 2. MAID & HOUSEKEEPING
  if (raw.includes('maid') || raw.includes('clean') || raw.includes('housekeep')) {
    const pName = serviceData?.providerName || 'Housekeeping Specialist';
    return {
      providerName: pName,
      providerRole: serviceData?.providerRole || 'Verified Housekeeping Specialist',
      providerImage: serviceData?.providerImage || '',
      serviceCategory: 'Maid & Housekeeping',
      icon: 'cleaning_services',
      tags: [
        'Spotless Cleaning',
        'Honest & Trustworthy',
        'Attention to Detail',
        'Fast & Efficient',
        'Eco Sanitization',
        'Polite Demeanor'
      ],
      defaultTags: ['Spotless Cleaning', 'Honest & Trustworthy'],
      placeholder: `Share your feedback on ${pName}'s cleaning thoroughness, honesty, and punctuality...`
    };
  }

  // 3. PICK & DROP
  if (raw.includes('pick') || raw.includes('drop') || raw.includes('truck') || raw.includes('moving') || raw.includes('cargo')) {
    const pName = serviceData?.providerName || 'Logistics Pilot';
    return {
      providerName: pName,
      providerRole: serviceData?.providerRole || 'Pick & Drop Logistics Pilot',
      providerImage: serviceData?.providerImage || '',
      serviceCategory: 'Pick & Drop Shipment',
      icon: 'local_shipping',
      tags: [
        'Careful Cargo Handling',
        'Safe Driving',
        'On-Time Dispatch',
        'Clean Vehicle Bed',
        'Helpful & Courteous',
        'Quick Transit'
      ],
      defaultTags: ['Careful Cargo Handling', 'Safe Driving'],
      placeholder: `Share your feedback on ${pName}'s driving safety, handling care, and punctuality...`
    };
  }

  // 4. MAINTENANCE (Electrical, Plumbing, General)
  const isPlumb = raw.includes('plumb') || raw.includes('pipe') || raw.includes('water');
  const defaultTitle = isPlumb ? 'Plumbing Specialist' : 'Electrical Specialist';
  const pName = serviceData?.providerName || defaultTitle;
  return {
    providerName: pName,
    providerRole: serviceData?.providerRole || (isPlumb ? 'Master Plumber' : 'Licensed Electrical Specialist'),
    providerImage: serviceData?.providerImage || '',
    serviceCategory: serviceData?.category || (isPlumb ? 'Plumbing Maintenance' : 'Electrical Maintenance'),
    icon: isPlumb ? 'plumbing' : 'bolt',
    tags: [
      'Expert Technical Skill',
      'Accurate Diagnostics',
      'Clean Work Area',
      'Safety Compliant',
      'Genuine Parts Used',
      'Punctual Arrival'
    ],
    defaultTags: ['Expert Technical Skill', 'Clean Work Area'],
    placeholder: `Share your feedback on ${pName}'s craftsmanship, troubleshooting speed, and repair quality...`
  };
}

const ServiceRating: React.FC<Props> = ({ onBack, onSubmit, serviceType, serviceData }) => {
  const config = getRatingConfig(serviceType, serviceData);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(config.defaultTags);
  const [note, setNote] = useState('');

  const toggleTag = (tag: string) => {
    haptics.selection();
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = () => {
    haptics.bookingConfirmed();
    onSubmit({
      rating,
      tags: selectedTags,
      note,
      providerName: config.providerName,
      providerRole: config.providerRole,
      providerImage: config.providerImage,
      serviceCategory: config.serviceCategory
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-dark max-w-md mx-auto overflow-hidden font-display text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <div className="absolute -top-20 -right-20 size-72 bg-primary/20 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-20 -left-20 size-72 bg-primary/10 blur-[100px] rounded-full"></div>
      </div>

      <header className="flex items-center p-6 pb-2 justify-between z-10">
        <button 
          onClick={onBack} 
          className="glass size-11 flex items-center justify-center rounded-full text-white border border-white/10 active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
          <span className="material-symbols-outlined text-xs">{config.icon}</span>
          <span>{config.serviceCategory}</span>
        </div>
      </header>

      {/* Provider Details Header */}
      <div className="flex flex-col items-center px-6 pt-4 pb-4 z-10 text-center">
        <div className="relative">
          <ProviderAvatar 
            name={config.providerName} 
            category={config.serviceCategory} 
            role={config.providerRole} 
            image={config.providerImage} 
            size="xl" 
            showOnlineDot={false} 
          />
          <div className="absolute bottom-0 right-0 bg-primary size-6 rounded-full border-2 border-background-dark flex items-center justify-center text-background-dark shadow-md">
            <span className="material-symbols-outlined text-xs font-black">verified</span>
          </div>
        </div>
        <div className="mt-4">
          <h1 className="text-2xl font-black tracking-tight text-white italic uppercase">
            {config.providerName}
          </h1>
          <p className="text-primary text-[11px] font-black tracking-[0.2em] uppercase mt-1">
            {config.providerRole}
          </p>
        </div>
      </div>

      {/* Star Rating Control */}
      <div className="flex flex-col items-center px-6 py-3 z-10">
        <h3 className="text-white/40 text-[10px] font-black mb-3 uppercase tracking-[0.25em]">
          Rate Your Service Experience
        </h3>
        <div className="flex gap-2.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star} 
              type="button"
              onClick={() => {
                haptics.selection();
                setRating(star);
              }} 
              className="active:scale-90 transition-transform focus:outline-none"
            >
              <span 
                className={`material-symbols-outlined text-4xl transition-colors ${
                  rating >= star ? 'text-primary drop-shadow-[0_0_8px_rgba(19,236,218,0.6)]' : 'text-white/15'
                }`} 
                style={{ fontVariationSettings: `'FILL' ${rating >= star ? 1 : 0}` }}
              >
                star
              </span>
            </button>
          ))}
        </div>
        <span className="text-[11px] font-black uppercase tracking-wider text-primary mt-2">
          {rating === 5 ? 'Excellent • 5.0' : rating === 4 ? 'Good • 4.0' : rating === 3 ? 'Average • 3.0' : 'Needs Improvement'}
        </span>
      </div>

      {/* Service-Specific Feedback Tags */}
      <div className="px-6 py-3 z-10">
        <h3 className="text-white text-xs font-black mb-3 uppercase tracking-widest italic flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-sm">thumb_up</span>
          <span>Service Highlights</span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {config.tags.map(tag => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button 
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-extrabold transition-all border ${
                  isSelected 
                    ? 'bg-primary text-background-dark border-primary shadow-lg shadow-primary/25 scale-[1.02]' 
                    : 'glass text-white/60 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Note */}
      <div className="px-6 py-3 flex-1 z-10 flex flex-col">
        <h3 className="text-white text-xs font-black mb-2 uppercase tracking-widest italic flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-sm">edit_note</span>
          <span>Review & Comments</span>
        </h3>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full glass rounded-2xl p-4 text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all min-h-[100px] resize-none border border-white/10 text-xs font-medium leading-relaxed" 
          placeholder={config.placeholder}
        />
      </div>

      {/* Submit Button */}
      <div className="p-6 pb-12 z-10">
        <button 
          type="button"
          onClick={handleSubmit}
          className="w-full bg-primary hover:bg-primary/90 text-background-dark font-black text-sm py-4 rounded-2xl shadow-[0_10px_30px_rgba(19,236,218,0.3)] transition-all active:scale-[0.98] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg font-black">send</span>
          <span>Submit Review</span>
        </button>
      </div>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default ServiceRating;
