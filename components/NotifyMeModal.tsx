import React, { useState, useEffect } from 'react';
import { SearchFilters, SearchAlert, SentEmailLog } from '../types';
import { 
  saveSearchAlert, 
  updateSearchAlert, 
  deleteSearchAlert, 
  findExistingAlertForFilters, 
  generateAlertTitle,
  triggerSearchAlertMatch,
  triggerPriceDropAlert,
  DEFAULT_USER_EMAIL 
} from '../searchAlertStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  userEmail?: string;
  lang?: 'EN' | 'BN';
  onAlertSaved?: (alert: SearchAlert) => void;
  onViewProperty?: (property: any) => void;
}

const TAG_ICONS: Record<string, string> = {
  'Pet Friendly': 'pets',
  'Balcony': 'balcony',
  'Parking': 'local_parking',
  'Elevator': 'elevator',
  'Generator': 'bolt',
  'Gas Pipeline': 'propane_tank',
  'Security Guard': 'shield',
  'Gym': 'fitness_center',
  'CCTV': 'videocam',
  'Furnished': 'chair',
  'Swimming Pool': 'pool',
  'WiFi': 'wifi'
};

const SAMPLE_MATCHING_PROPERTY = {
  id: 'alert-sample-1',
  title: 'Luxury 3BHK Flat with Lake View',
  price: '৳ 48k',
  location: 'Road 11, Block E, Banani, Dhaka',
  beds: 3,
  baths: 3,
  sqft: 1750,
  distance: 2.5,
  tag: 'FOR RENT',
  type: 'Flat',
  isVerified: true,
  isFeatured: true,
  image: '',
  tags: ['Pet Friendly', 'Balcony', 'Parking', 'Elevator', 'Security Guard', 'Generator']
};

export const NotifyMeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  filters,
  userEmail = DEFAULT_USER_EMAIL,
  lang = 'EN',
  onAlertSaved,
  onViewProperty
}) => {
  const isBn = lang === 'BN';
  const [existingAlert, setExistingAlert] = useState<SearchAlert | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState(userEmail);
  const [emailNotification, setEmailNotification] = useState(true);
  const [inAppNotification, setInAppNotification] = useState(true);
  const [priceDropNotification, setPriceDropNotification] = useState(true);
  const [frequency, setFrequency] = useState<'instant' | 'daily'>('instant');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState<SentEmailLog | null>(null);
  const [simulatedMatchMsg, setSimulatedMatchMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const match = findExistingAlertForFilters(filters);
      setExistingAlert(match);
      if (match) {
        setTitle(match.title);
        setEmail(match.email || userEmail);
        setEmailNotification(match.emailNotification);
        setInAppNotification(match.inAppNotification);
        setPriceDropNotification(match.priceDropNotification !== false);
        setFrequency(match.frequency);
      } else {
        setTitle(generateAlertTitle(filters));
        setEmail(userEmail || DEFAULT_USER_EMAIL);
        setEmailNotification(true);
        setInAppNotification(true);
        setPriceDropNotification(true);
        setFrequency('instant');
      }
      setIsSavedSuccess(false);
      setShowEmailPreview(false);
      setSimulatedMatchMsg(null);
    }
  }, [isOpen, filters, userEmail]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!emailNotification && !inAppNotification) {
      alert(isBn ? 'দয়া করে কমপক্ষে একটি নোটিফিকেশন চ্যানেল নির্বাচন করুন (ইমেইল অথবা ইন-অ্যাপ)' : 'Please select at least one notification channel (Email or In-App).');
      return;
    }

    if (emailNotification && (!email || !email.includes('@'))) {
      alert(isBn ? 'একটি সঠিক ইমেইল ঠিকানা দিন' : 'Please provide a valid email address.');
      return;
    }

    let saved: SearchAlert;
    if (existingAlert) {
      saved = updateSearchAlert(existingAlert.id, {
        title: title.trim() || generateAlertTitle(filters),
        criteria: filters,
        email: email.trim(),
        emailNotification,
        inAppNotification,
        priceDropNotification,
        frequency,
        isActive: true
      })!;
    } else {
      saved = saveSearchAlert({
        title: title.trim() || generateAlertTitle(filters),
        criteria: filters,
        email: email.trim(),
        emailNotification,
        inAppNotification,
        priceDropNotification,
        frequency,
        isActive: true
      });
      setExistingAlert(saved);
    }

    setIsSavedSuccess(true);
    if (onAlertSaved) onAlertSaved(saved);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1400);
  };

  const handleDelete = () => {
    if (!existingAlert) return;
    if (confirm(isBn ? 'আপনি কি এই সার্চ অ্যালার্টটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this search alert?')) {
      deleteSearchAlert(existingAlert.id);
      setExistingAlert(undefined);
      onClose();
    }
  };

  const handleTestSimulation = () => {
    const activeAlert: SearchAlert = existingAlert || {
      id: `temp-${Date.now()}`,
      title: title || generateAlertTitle(filters),
      criteria: filters,
      email: email || DEFAULT_USER_EMAIL,
      emailNotification,
      inAppNotification,
      priceDropNotification,
      frequency,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const res = triggerSearchAlertMatch(activeAlert, SAMPLE_MATCHING_PROPERTY);
    if (res.emailLog) {
      setSimulatedEmail(res.emailLog);
      setShowEmailPreview(true);
    }
    setSimulatedMatchMsg(
      isBn 
        ? `সফলভাবে সিমুলেট করা হয়েছে! একটি নতুন ম্যাচ প্রপার্টি আপনার ইনবক্স এবং ইমেইলে (${activeAlert.email}) পাঠানো হয়েছে।`
        : `Simulation successful! A matching property was delivered to in-app inbox and sent to ${activeAlert.email}.`
    );
  };

  const handleSimulatePriceDrop = () => {
    const activeAlert: SearchAlert = existingAlert || {
      id: `temp-${Date.now()}`,
      title: title || generateAlertTitle(filters),
      criteria: filters,
      email: email || DEFAULT_USER_EMAIL,
      emailNotification,
      inAppNotification,
      priceDropNotification,
      frequency,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const budgetK = filters.maxBudget || 50;
    const oldPriceK = budgetK + 10;
    const droppedPriceK = Math.max(15, budgetK - 5);

    const priceDropProperty = {
      id: `drop-${Date.now()}`,
      title: 'Diplomatic Zone Luxury Suite',
      price: `৳ ${droppedPriceK}k`,
      location: 'Road 11, Banani, Dhaka',
      beds: filters.beds && filters.beds !== 'Any' ? parseInt(filters.beds) : 3,
      baths: 3,
      sqft: 1800,
      image: SAMPLE_MATCHING_PROPERTY.image,
      tag: 'PRICE DROP'
    };

    const res = triggerPriceDropAlert(
      activeAlert,
      priceDropProperty,
      `৳ ${oldPriceK}k`,
      `৳ ${droppedPriceK}k`
    );

    if (res.emailLog) {
      setSimulatedEmail(res.emailLog);
      setShowEmailPreview(true);
    }

    setSimulatedMatchMsg(
      isBn
        ? `মূল্য কমার অ্যালার্ট পাঠানো হয়েছে! প্রপার্টির ভাড়া ৳ ${oldPriceK}k থেকে কমে ৳ ${droppedPriceK}k হয়েছে (আপনার বাজেট ৳ ${budgetK}k এর নিচে)। অ্যাপের ইন-বক্সে চেক করুন!`
        : `Price drop alert triggered! Price dropped from ৳ ${oldPriceK}k to ৳ ${droppedPriceK}k/mo (below your filter criteria of ৳ ${budgetK}k). Check In-App Notifications!`
    );
  };

  return (
    <div className="fixed inset-0 z-[110] bg-background-dark/95 backdrop-blur-xl flex flex-col justify-end overflow-y-auto font-display animate-in fade-in duration-300">
      <div className="min-h-full w-full flex items-end justify-center p-0 sm:p-4">
        <div className="bg-background-dark w-full max-w-[430px] rounded-t-[2.5rem] border border-white/10 shadow-2xl flex flex-col relative overflow-hidden max-h-[92vh]">
          {/* Neon Top Glow bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>

          {/* Modal Header */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/5 relative shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]">
                <span className="material-symbols-outlined text-2xl animate-pulse">notifications_active</span>
              </div>
              <div>
                <h2 className="text-white text-lg font-black uppercase tracking-tight italic">
                  {isBn ? 'সার্চ অ্যালার্ট: নোটিফাই মি' : 'Notify Me on Matches'}
                </h2>
                <p className="text-[11px] text-primary font-bold uppercase tracking-wider">
                  {existingAlert ? (isBn ? 'সক্রিয় অ্যালার্ট আপডেট করুন' : 'Active Alert Configured') : (isBn ? 'নতুন প্রপার্টি এলে জানুন' : 'Instant Email & App Alerts')}
                </p>
              </div>
            </div>
            <button
              type="button"
              id="close-notify-me-btn"
              onClick={onClose}
              className="size-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-90"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 no-scrollbar">
            {/* Success Banner */}
            {isSavedSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 animate-in zoom-in-95">
                <span className="material-symbols-outlined text-2xl font-black">check_circle</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">
                    {isBn ? 'অ্যালার্ট সক্রিয় করা হয়েছে!' : 'Search Alert Enabled!'}
                  </p>
                  <p className="text-[11px] text-white/60 font-medium">
                    {isBn ? 'নতুন প্রপার্টি পোস্ট হওয়ার সাথে সাথে আপনাকে জানানো হবে।' : 'You will be notified immediately when a match is posted.'}
                  </p>
                </div>
              </div>
            )}

            {/* Criteria Overview Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">manage_search</span>
                  {isBn ? 'অনুসন্ধানের মানদণ্ড' : 'Filter Criteria Monitored'}
                </span>
                <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-bold">
                  {filters.tags?.length || 0} {isBn ? 'টি ট্যাগ' : 'Tags'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {filters.propertyType && (
                  <span className="bg-white/5 border border-white/10 text-white/90 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">apartment</span>
                    {filters.propertyType}
                  </span>
                )}
                {filters.maxBudget && (
                  <span className="bg-white/5 border border-white/10 text-white/90 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">payments</span>
                    ≤ ৳{filters.maxBudget}k/mo
                  </span>
                )}
                {filters.beds && filters.beds !== 'Any' && (
                  <span className="bg-white/5 border border-white/10 text-white/90 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">bed</span>
                    {filters.beds} Beds
                  </span>
                )}
                {filters.radius && (
                  <span className="bg-white/5 border border-white/10 text-white/90 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-primary">near_me</span>
                    Within {filters.radius}km
                  </span>
                )}
              </div>

              {/* Tag Badges */}
              {filters.tags && filters.tags.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-wider mb-1.5">
                    {isBn ? 'নির্বাচিত সুবিধা / ট্যাগ:' : 'Required Amenities:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {filters.tags.map(t => (
                      <span key={t} className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          {TAG_ICONS[t] || 'sell'}
                        </span>
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Alert Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">label</span>
                {isBn ? 'অ্যালার্টের নাম' : 'Alert Name'}
              </label>
              <input
                type="text"
                id="alert-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Banani 3BHK Pet Friendly"
                className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-2xl px-4 py-3 text-white text-xs font-bold outline-none transition-all placeholder:text-white/20"
              />
            </div>

            {/* Notification Channels Selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">tune</span>
                {isBn ? 'নোটিফিকেশন চ্যানেল' : 'Notification Channels'}
              </label>

              {/* Email Alerts Toggle & Input */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <span className="material-symbols-outlined text-lg">mail</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-bold">
                        {isBn ? 'ইমেইল নোটিফিকেশন' : 'Email Alerts'}
                      </p>
                      <p className="text-white/40 text-[10px]">
                        {isBn ? 'নতুন প্রপার্টির পূর্ণাঙ্গ বিবরণসহ ইমেইল পাবেন' : 'Rich email updates with pictures & pricing'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="toggle-email-notification-btn"
                    onClick={() => setEmailNotification(!emailNotification)}
                    className={`relative flex h-6 w-11 cursor-pointer items-center rounded-full p-0.5 transition-all ${
                      emailNotification ? 'bg-primary justify-end' : 'bg-white/10 justify-start'
                    }`}
                  >
                    <div className="h-5 w-5 rounded-full bg-white shadow-md"></div>
                  </button>
                </div>

                {emailNotification && (
                  <div className="pt-2 border-t border-white/5">
                    <label className="text-[9px] text-white/30 font-bold uppercase tracking-wider block mb-1">
                      {isBn ? 'প্রাপকের ইমেইল ঠিকানা:' : 'Recipient Email:'}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="alert-email-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-white/5 border border-white/10 focus:border-primary rounded-xl pl-9 pr-3 py-2 text-white text-xs font-semibold outline-none"
                      />
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                        alternate_email
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* In-App Notifications Toggle */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-lg">notifications</span>
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">
                      {isBn ? 'ইন-অ্যাপ নোটিফিকেশন' : 'In-App Alerts'}
                    </p>
                    <p className="text-white/40 text-[10px]">
                      {isBn ? 'অ্যাপ ইনবক্স এবং পুশ অ্যালার্ট পাবেন' : 'Instant app inbox alerts & banner notifications'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="toggle-inapp-notification-btn"
                  onClick={() => setInAppNotification(!inAppNotification)}
                  className={`relative flex h-6 w-11 cursor-pointer items-center rounded-full p-0.5 transition-all ${
                    inAppNotification ? 'bg-primary justify-end' : 'bg-white/10 justify-start'
                  }`}
                >
                  <div className="h-5 w-5 rounded-full bg-white shadow-md"></div>
                </button>
              </div>

              {/* Price Drop Below Criteria In-App Alert Toggle */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-lg">trending_down</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-white text-xs font-bold">
                        {isBn ? 'মূল্য কমার ইন-অ্যাপ অ্যালার্ট' : 'Price Drop In-App Alert'}
                      </p>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <p className="text-white/50 text-[10px]">
                      {isBn 
                        ? `প্রপার্টির ভাড়া আপনার ফিল্টার বাজেট (≤ ৳${filters.maxBudget || 50}k) এর নিচে নামলে নোটিফিকেশন পাবেন`
                        : `Instant in-app notification if price drops below your filter budget (≤ ৳${filters.maxBudget || 50}k)`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="toggle-price-drop-alert-btn"
                  onClick={() => setPriceDropNotification(!priceDropNotification)}
                  className={`relative flex h-6 w-11 cursor-pointer items-center rounded-full p-0.5 transition-all ${
                    priceDropNotification ? 'bg-emerald-400 justify-end' : 'bg-white/10 justify-start'
                  }`}
                >
                  <div className="h-5 w-5 rounded-full bg-background-dark shadow-md"></div>
                </button>
              </div>
            </div>

            {/* Notification Frequency */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-primary">schedule</span>
                {isBn ? 'অ্যালার্টের পুনরাবৃত্তি' : 'Alert Frequency'}
              </label>
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setFrequency('instant')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    frequency === 'instant' 
                      ? 'bg-primary text-background-dark shadow-md' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm font-black">bolt</span>
                  <span>{isBn ? 'তাৎক্ষণিক (Instant)' : 'Instant Match'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('daily')}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    frequency === 'daily' 
                      ? 'bg-primary text-background-dark shadow-md' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm font-black">calendar_today</span>
                  <span>{isBn ? 'দৈনিক সারাংশ' : 'Daily Digest'}</span>
                </button>
              </div>
            </div>

            {/* Test Simulation Buttons & Email Preview */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-white text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-sm">science</span>
                  {isBn ? 'সিমুলেশন টেস্ট' : 'Test Notification Delivery'}
                </p>
                <p className="text-[10px] text-white/40">
                  {isBn ? 'এখনই একটি প্রপার্টি ম্যাচ অথবা মূল্য কমার অ্যালার্ট টেস্ট করে ইন-বক্সে ফলাফল দেখুন' : 'Simulate an immediate new match or price drop alert into your in-app inbox'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  id="test-search-alert-btn"
                  onClick={handleTestSimulation}
                  className="flex-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-xs">play_arrow</span>
                  <span>{isBn ? 'নতুন ম্যাচ' : 'Simulate Match'}</span>
                </button>
                <button
                  type="button"
                  id="test-price-drop-alert-btn"
                  onClick={handleSimulatePriceDrop}
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wider py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
                >
                  <span className="material-symbols-outlined text-xs">trending_down</span>
                  <span>{isBn ? 'মূল্য হ্রাস অ্যালার্ট' : 'Simulate Price Drop'}</span>
                </button>
              </div>

              {simulatedMatchMsg && (
                <div className="bg-primary/10 rounded-xl p-2.5 border border-primary/20 text-[11px] text-primary flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm shrink-0 mt-0.5">check_circle</span>
                  <span>{simulatedMatchMsg}</span>
                </div>
              )}

              {simulatedEmail && (
                <button
                  type="button"
                  onClick={() => setShowEmailPreview(!showEmailPreview)}
                  className="w-full text-left text-[11px] text-white/60 hover:text-white flex items-center justify-between py-1 font-bold transition-colors"
                >
                  <span className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-sm">mark_email_read</span>
                    {showEmailPreview ? (isBn ? 'ইমেইল প্রিভিউ লুকান' : 'Hide Email Preview') : (isBn ? 'প্রেরিত ইমেইলের প্রিভিউ দেখুন' : 'View Sent Email Preview')}
                  </span>
                  <span className="material-symbols-outlined text-sm">
                    {showEmailPreview ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )}

              {/* Realistic Email Mock Preview */}
              {showEmailPreview && simulatedEmail && (
                <div className="bg-[#0b1615] border border-white/10 rounded-2xl p-3.5 space-y-3 animate-in fade-in duration-300">
                  <div className="border-b border-white/5 pb-2 text-[10px] text-white/40 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white/60">From: </span>alerts@duyar.app
                      <br />
                      <span className="font-bold text-white/60">To: </span>{simulatedEmail.to}
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                      SENT
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white">{simulatedEmail.subject}</h4>
                    <p className="text-[11px] text-white/60">{simulatedEmail.bodyPreview}</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-2.5 flex items-center gap-3 border border-white/5">
                    <img 
                      src={simulatedEmail.propertyImage || SAMPLE_MATCHING_PROPERTY.image} 
                      alt="preview" 
                      className="size-14 rounded-lg object-cover shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{simulatedEmail.propertyTitle}</p>
                      <p className="text-[11px] text-primary font-black">{simulatedEmail.propertyPrice} <span className="text-[9px] text-white/40">/month</span></p>
                      <p className="text-[10px] text-white/40 truncate">{simulatedEmail.propertyLocation}</p>
                    </div>
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewProperty) {
                          onViewProperty(SAMPLE_MATCHING_PROPERTY);
                          onClose();
                        }
                      }}
                      className="flex-1 bg-primary text-background-dark text-[10px] font-black uppercase tracking-wider py-2 rounded-xl text-center shadow-sm"
                    >
                      {isBn ? 'অ্যাপে প্রপার্টি দেখুন' : 'View Property on Duyar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-5 border-t border-white/10 bg-background-dark/95 backdrop-blur-xl flex flex-col gap-2 shrink-0">
            <button
              type="button"
              id="save-search-alert-btn"
              onClick={handleSave}
              className="w-full bg-primary hover:bg-primary/90 text-background-dark font-black h-13 rounded-2xl text-xs uppercase tracking-[0.15em] shadow-[0_10px_25px_rgba(19,236,218,0.25)] flex items-center justify-center gap-2 active:scale-98 transition-all italic"
            >
              <span className="material-symbols-outlined text-lg font-black">
                {existingAlert ? 'save' : 'notification_add'}
              </span>
              <span>
                {existingAlert 
                  ? (isBn ? 'অ্যালার্ট আপডেট করুন' : 'Update Search Alert') 
                  : (isBn ? 'অ্যালার্ট সক্রিয় করুন' : 'Enable Search Alert')}
              </span>
            </button>

            {existingAlert && (
              <button
                type="button"
                id="delete-search-alert-btn"
                onClick={handleDelete}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold h-10 rounded-xl text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>{isBn ? 'অ্যালার্ট মুছে ফেলুন' : 'Delete This Alert'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotifyMeModal;
