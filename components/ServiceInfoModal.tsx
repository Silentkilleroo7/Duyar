import React from 'react';
import { SwipeDownModal } from './SwipeDownModal';
import { haptics } from '../haptics';

export interface ServiceDetailInfo {
  id: string;
  name: string;
  icon: string;
  category: string;
  tagline: string;
  hourlyRate: string;
  baseCharge: string;
  eta: string;
  rating: string;
  completedJobs: string;
  scopeOfWork: string[];
  equipmentProvided: string[];
  guarantees: string[];
  emergencyAvailable?: boolean;
}

export const SERVICE_DETAILS_CATALOG: Record<string, ServiceDetailInfo> = {
  'Electrical': {
    id: 'elec',
    name: 'Electrical Maintenance',
    icon: 'bolt',
    category: 'Home Engineering',
    tagline: 'Govt. Grade-A Certified Electricians & Diagnostics',
    hourlyRate: '৳ 500 / hr',
    baseCharge: '৳ 1,250 Initial Diagnostic',
    eta: '15-25 Mins',
    rating: '4.9 ★ (1,420+ jobs in Dhaka)',
    completedJobs: '1,420+ Completed',
    scopeOfWork: [
      'Circuit breaker testing, diagnostic & load rebalancing',
      'Ceiling fan, exhaust, chandelier & LED lighting install',
      'Short-circuit fault finding with 1000V insulated instruments',
      'Generator transfer switch & distribution board inspection',
      'High-amp AC socket, oven & geyser wiring lines'
    ],
    equipmentProvided: [
      'Digital Multimeter & Insulation Resistance Tester',
      'Certified 1000V Insulated VDE Tool Set',
      'OEM 16A-32A Miniature Circuit Breakers (MCB)',
      'Flame-retardant copper wiring coils'
    ],
    guarantees: [
      '30-Day Duyar Workmanship Warranty',
      'NID & Police Clearance Verified Electrician',
      'Transparent flat pricing — No surprise charges'
    ],
    emergencyAvailable: true
  },
  'Plumbing': {
    id: 'plumb',
    name: 'Plumbing & Drainage',
    icon: 'plumbing',
    category: 'Sanitary Engineering',
    tagline: 'Master Plumbers for Leaks, Piping & Fixture Installations',
    hourlyRate: '৳ 450 / hr',
    baseCharge: '৳ 950 Diagnostic & Fix',
    eta: '20-30 Mins',
    rating: '4.8 ★ (980+ jobs in Dhaka)',
    completedJobs: '980+ Completed',
    scopeOfWork: [
      'High-pressure leak detection behind tiles & walls',
      'Sanitary commode, basin, concealed cistern & mixer repair',
      'Water heater / geyser safety valve and line setup',
      'Drainage unclogging using mechanical spiral snake cable',
      'Rooftop water tank sensor & automatic pump float switch'
    ],
    equipmentProvided: [
      'High-pressure motorized drain auger',
      'Acoustic water leak detection wand',
      'Heavy-duty pipe threading & PPR hot melt welding machine',
      'Teflon, O-rings, and brass plumbing spares'
    ],
    guarantees: [
      '30-Day Leak-Free Guarantee',
      'Clean workspace restoration after work',
      'Govt. Grade Sanitary Certification'
    ],
    emergencyAvailable: true
  },
  'Painting': {
    id: 'paint',
    name: 'Painting & Touch-Up',
    icon: 'brush',
    category: 'Interior Renovation',
    tagline: 'Flawless Wall Coating, Weather Coat & Damp Proofing',
    hourlyRate: '৳ 400 / hr',
    baseCharge: '৳ 1,500 Room Consultation',
    eta: 'Same-Day Dispatch',
    rating: '4.8 ★ (650+ apartments)',
    completedJobs: '650+ Completed',
    scopeOfWork: [
      'Full apartment interior & exterior wall painting',
      'Anti-fungal damp seal & waterproof chemical treatment',
      'Ceiling putty smoothing, crack filling & primer coat',
      'Door, cabinet, and grill enamel gloss polishing',
      'Pre-painting furniture masking & post-paint deep cleanup'
    ],
    equipmentProvided: [
      'Dustless orbital wall sanding machine',
      'Airless high-precision paint spray rigs',
      'Protective plastic floor & furniture tarps',
      'Berger / Asian Paints authentic tinting'
    ],
    guarantees: [
      '100% Genuine Branded Paints Guaranteed',
      '1-Year Anti-Peeling Warranty',
      'Trained professional painters'
    ]
  },
  'Appliance Repair': {
    id: 'appliance',
    name: 'Appliance Repair',
    icon: 'home_repair_service',
    category: 'Home Appliances',
    tagline: 'Certified Techs for Refrigerators, Washing Machines & AC',
    hourlyRate: '৳ 550 / hr',
    baseCharge: '৳ 1,400 Diagnostic + Gas Check',
    eta: '25-40 Mins',
    rating: '4.9 ★ (820+ repairs)',
    completedJobs: '820+ Completed',
    scopeOfWork: [
      'Refrigerator cooling coil, compressor & gas recharge (R600a/R134a)',
      'Split inverter AC jet wash, PCB board repair & leak sealing',
      'Front-load / Top-load washing machine drum & pump repair',
      'Microwave oven magnetron & transformer testing',
      'Water purifier RO membrane replacement & sanitization'
    ],
    equipmentProvided: [
      'Digital manifold gauge set & vacuum pump',
      'High-pressure chemical jet cleaning washer',
      'Electronic PCB fault multimeter',
      'OEM genuine compressors & relays'
    ],
    guarantees: [
      '90-Day Parts Replacement Warranty',
      'Only genuine manufacturer spare parts used',
      'Free 15-day checkup post repair'
    ]
  },
  'Cleaning': {
    id: 'clean',
    name: 'Deep Cleaning & Sanitization',
    icon: 'sanitizer',
    category: 'Hygiene & Cleanliness',
    tagline: 'Deep Apartment, Kitchen, Sofa & Washroom Sanitization',
    hourlyRate: '৳ 350 / hr',
    baseCharge: '৳ 2,200 3BHK Deep Wash',
    eta: 'Within 45 Mins',
    rating: '4.9 ★ (1,150+ homes)',
    completedJobs: '1,150+ Completed',
    scopeOfWork: [
      'Kitchen chimney, stove grease removal & exhaust degreasing',
      'Bathroom tile grout scrubbing, scale removal & disinfecting',
      'Fabric sofa, carpet & mattress steam extraction cleaning',
      'Balcony, window panes & sliding track debris cleanup',
      'Eco-friendly microbial sanitization spray'
    ],
    equipmentProvided: [
      'Commercial wet/dry vacuum extractor',
      'High-temperature 140°C steam sterilizer',
      'German non-toxic eco degreasers & floor buffers',
      'Microfiber cloths and disposable protective sets'
    ],
    guarantees: [
      '100% Eco-Friendly Non-Toxic Chemicals',
      'Spotless Inspection Sign-off Guarantee',
      'Background-checked professional cleaners'
    ]
  },
  'Security': {
    id: 'sec',
    name: 'Security & CCTV Guard',
    icon: 'shield_person',
    category: 'Property Protection',
    tagline: 'Vetted Security Personnel & CCTV Surveillance Setup',
    hourlyRate: '৳ 300 / hr',
    baseCharge: '৳ 1,200 Shift / Day Guard',
    eta: 'Instant Deployment',
    rating: '4.9 ★ (720+ buildings)',
    completedJobs: '720+ Completed',
    scopeOfWork: [
      '24/7 Gated residential building access control & visitor registry',
      'IP CCTV camera angle calibration, NVR storage & remote mobile link',
      'Night-shift perimeter patrol & emergency gate protocols',
      'VIP event escort and concierge security presence',
      'Intercom & automated biometric gate lock troubleshooting'
    ],
    equipmentProvided: [
      'High-visibility patrol uniform & flashlight rig',
      'Two-way radio communication walkie-talkie',
      'Digital visitor logging terminal app',
      'Metal detector wand & safety Baton'
    ],
    guarantees: [
      'Ex-Military / Police Vetted Supervisors',
      'Zero-absenteeism replacement guarantee',
      'Direct 24/7 emergency hotline dispatch'
    ],
    emergencyAvailable: true
  },
  'Maid': {
    id: 'maid',
    name: 'Housekeeping & Maid Service',
    icon: 'cleaning_services',
    category: 'Home Assistance',
    tagline: 'Trusted, Screened & Verified Domestic Help',
    hourlyRate: '৳ 250 / hr',
    baseCharge: '৳ 500 Daily Routine',
    eta: 'Scheduled / Within 1 Hr',
    rating: '4.9 ★ (2,100+ households)',
    completedJobs: '2,100+ Completed',
    scopeOfWork: [
      'Daily sweeping, floor mopping, dusting & dishwashing',
      'Laundry machine wash, drying & garment ironing',
      'Meal prep, vegetable chopping & kitchen cleanup',
      'Post-event dishwashing & living room organization',
      'Elderly assistance and domestic housekeeping tasks'
    ],
    equipmentProvided: [
      'Duyar hygiene apron & disposable gloves',
      'Sanitized mop & microfiber dusting tools'
    ],
    guarantees: [
      'Biometric & NID Dual-Verified Personnel',
      'Replacement within 2 hours if unsatisfied',
      'Zero theft record with police verification'
    ]
  },
  'Pick & Drop': {
    id: 'pickdrop',
    name: 'Pick & Drop Cargo / Moving',
    icon: 'local_shipping',
    category: 'Logistics & Shifting',
    tagline: 'Instant Parcel, Furniture & House Shifting Logistics',
    hourlyRate: 'Distance / Weight Based',
    baseCharge: '৳ 350 Base Fare (Bike/Truck)',
    eta: '8-15 Mins Pickup',
    rating: '4.8 ★ (3,400+ deliveries)',
    completedJobs: '3,400+ Completed',
    scopeOfWork: [
      'Apartment furniture shifting (Beds, sofas, wardrobes, electronics)',
      'Same-day express document, parcel & carton courier in Dhaka',
      'Heavy cargo pickup with hydraulic lift & moving helpers',
      'Floor-to-floor stair loading & elevator cargo protection',
      'Real-time GPS tracking on map with driver live telemetry'
    ],
    equipmentProvided: [
      'Heavy-duty ratchet straps and bubble cushioning wraps',
      'Floor moving dolly wheels & cargo hand trucks',
      'Weather-sealed covered pickups (1-Ton, 2-Ton, 3-Ton)',
      'Moving blankets to protect wooden furniture'
    ],
    guarantees: [
      'Goods Damage Protection Insurance up to ৳ 50,000',
      'Live GPS Tracking from doorstep to destination',
      'Punctual pickup commitment with verified driver'
    ]
  }
};

interface ServiceInfoModalProps {
  isOpen: boolean;
  serviceName: string;
  onClose: () => void;
  onBook: (serviceName: string) => void;
  lang?: 'EN' | 'BN';
}

export const ServiceInfoModal: React.FC<ServiceInfoModalProps> = ({
  isOpen,
  serviceName,
  onClose,
  onBook,
  lang = 'EN'
}) => {
  const isBn = lang === 'BN';
  // Resolve info from catalog
  const key = Object.keys(SERVICE_DETAILS_CATALOG).find(k => 
    serviceName.toLowerCase().includes(k.toLowerCase())
  ) || 'Electrical';

  const info = SERVICE_DETAILS_CATALOG[key] || SERVICE_DETAILS_CATALOG['Electrical'];

  return (
    <SwipeDownModal
      isOpen={isOpen}
      onClose={onClose}
      title={info.name}
      subtitle={info.category}
      icon={info.icon}
      badge={info.eta}
      maxHeight="max-h-[88vh]"
    >
      <div className="space-y-4 text-white">
        {/* Hero Pricing & Rating Card */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-primary/30 relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">verified</span>
              {info.tagline}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white italic">{info.hourlyRate}</span>
              <span className="text-[11px] text-white/50">({info.baseCharge})</span>
            </div>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">star</span>
              {info.rating}
            </p>
          </div>
          
          <div className="size-14 rounded-2xl bg-primary/10 border border-primary/25 flex flex-col items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl">{info.icon}</span>
            <span className="text-[8px] font-extrabold uppercase tracking-tight text-white/70 mt-0.5">{info.eta}</span>
          </div>
        </div>

        {/* Scope of Work */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">task_alt</span>
            {isBn ? "এই সেবার অন্তর্ভুক্ত সুবিধাসমূহ" : "What's Included in This Service"}
          </h4>
          <div className="space-y-1.5 bg-black/40 p-3.5 rounded-2xl border border-white/5">
            {info.scopeOfWork.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-white/90">
                <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Professional Equipment & Tools */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">handyman</span>
            {isBn ? "প্রযুক্তিবিদ কর্তৃক আনিত প্রত্যয়িত সরঞ্জাম ও যন্ত্রপাতি" : "Certified Equipment & Spares Brought by Technician"}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {info.equipmentProvided.map((eq, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">build_circle</span>
                <span className="text-[11px] text-white/80 leading-tight font-medium">{eq}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Duyar Shield Assurance */}
        <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">shield</span>
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              {isBn ? "দুয়ার নিরাপত্তা ও গ্রাহক সন্তুষ্টির নিশ্চয়তা" : "Duyar Safety & Satisfaction Commitment"}
            </span>
          </div>
          <div className="space-y-1">
            {info.guarantees.map((g, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-white/80">
                <span className="text-primary font-bold">✓</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
          >
            {isBn ? "বন্ধ করুন" : "Close Sheet"}
          </button>
          <button
            type="button"
            onClick={() => {
              haptics.bookingConfirmed();
              onClose();
              onBook(info.name);
            }}
            className="flex-[2] py-3.5 px-5 rounded-xl bg-primary hover:bg-[#11d8c7] text-background-dark font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(19,236,218,0.35)] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>{isBn ? "এখনই সেবা বুক করুন" : "Book Now"}</span>
            <span className="material-symbols-outlined text-base font-black">arrow_forward</span>
          </button>
        </div>
      </div>
    </SwipeDownModal>
  );
};

export default ServiceInfoModal;
