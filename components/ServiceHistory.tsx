import React, { useState, useEffect, useMemo } from 'react';
import { Screen } from '../types';
import BottomNav from './BottomNav';
import { 
  getUserScheduledVisits, 
  ScheduledMaintenanceVisit, 
  VISIT_SCHEDULED_EVENT, 
  AVAILABILITY_CONFIRMED_EVENT 
} from '../maintenanceScheduler';
import { 
  getUserMaintenanceTickets, 
  fetchMaintenanceTicketsFromDB, 
  subscribeToMaintenanceTickets, 
  MaintenanceTicket,
  acceptMaintenanceTicket,
  releaseMaintenanceTicketToPending,
  completeMaintenanceTicket,
  deleteMaintenanceTicket
} from '../maintenanceStorage';
import { 
  getUserPickDropRequests, 
  PickDropRequest,
  acceptPickDropRequest,
  releasePickDropRequestToPending,
  updatePickDropStatus,
  deletePickDropRequest
} from '../pickDropStorage';
import { AvailabilityConfirmModal } from './AvailabilityConfirmModal';
import { haptics } from '../haptics';

interface Props {
  onBack: () => void;
  onTrack: (service?: any) => void;
  onChat: (service?: any) => void;
  onNavigate: (screen: Screen) => void;
  userProfile?: any;
  lang?: 'EN' | 'BN';
}

export type ServiceGroup = 'Maintenance' | 'Security' | 'Maid' | 'Pick & Drop';

export function detectServiceGroup(id: string, category: string, title: string): ServiceGroup {
  const cat = (category || '').toLowerCase();
  const tit = (title || '').toLowerCase();
  const rawId = (id || '').toUpperCase();

  if (rawId.startsWith('PD-') || cat.includes('pick') || cat.includes('drop') || cat.includes('moving') || cat.includes('transport') || tit.includes('pick & drop')) {
    return 'Pick & Drop';
  }
  if (rawId.startsWith('SEC-') || rawId.startsWith('MA-SEC') || cat.includes('security') || cat.includes('guard') || cat.includes('cctv') || tit.includes('security') || tit.includes('guard') || tit.includes('cctv')) {
    return 'Security';
  }
  if (rawId.startsWith('MAID-') || rawId.startsWith('MA-MD') || cat.includes('maid') || cat.includes('housekeep') || cat.includes('clean') || tit.includes('maid') || tit.includes('housekeep') || tit.includes('cook')) {
    return 'Maid';
  }
  return 'Maintenance';
}

export interface UnifiedServiceItem {
  id: string;
  title: string;
  serviceType: string;
  category: string;
  serviceGroup: ServiceGroup;
  status: string;
  rawStatus: 'PENDING' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED';
  time: string;
  icon: string;
  price: string;
  providerName: string;
  providerRole: string;
  providerPhone: string;
  address: string;
  isCompleted: boolean;
  rating?: number;
  originalData?: any;
}

type HistoryFilter = 'ALL' | 'PENDING' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED';

const ServiceHistory: React.FC<Props> = ({ 
  onBack, 
  onTrack, 
  onChat, 
  onNavigate, 
  userProfile,
  lang = 'EN'
}) => {
  const isBn = lang === 'BN';
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [confirmModalVisit, setConfirmModalVisit] = useState<ScheduledMaintenanceVisit | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const userPhone = userProfile?.phone || (typeof window !== 'undefined' ? localStorage.getItem('duyar_user_phone') : null);
  const userId = userProfile?.id;

  // Local state holding real user data
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(() => getUserMaintenanceTickets(userPhone, userId));
  const [pickDropRequests, setPickDropRequests] = useState<PickDropRequest[]>(() => getUserPickDropRequests(userPhone, userId));
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledMaintenanceVisit[]>(() => getUserScheduledVisits(userPhone, userId));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Refresh user data on mount and whenever events fire
  const refreshData = () => {
    setTickets(getUserMaintenanceTickets(userPhone, userId));
    setPickDropRequests(getUserPickDropRequests(userPhone, userId));
    setScheduledVisits(getUserScheduledVisits(userPhone, userId));
  };

  useEffect(() => {
    refreshData();
    if (userPhone || userId) {
      fetchMaintenanceTicketsFromDB(userPhone, userId).then(() => {
        refreshData();
      }).catch(() => {});
    }

    const unsubscribeTickets = subscribeToMaintenanceTickets(refreshData);

    const handlePickDropUpdate = () => refreshData();
    const handleVisitsUpdate = () => refreshData();

    window.addEventListener('duyar_pickdrop_updated', handlePickDropUpdate);
    window.addEventListener(VISIT_SCHEDULED_EVENT, handleVisitsUpdate);
    window.addEventListener(AVAILABILITY_CONFIRMED_EVENT, handleVisitsUpdate);
    window.addEventListener('storage', refreshData);

    return () => {
      unsubscribeTickets();
      window.removeEventListener('duyar_pickdrop_updated', handlePickDropUpdate);
      window.removeEventListener(VISIT_SCHEDULED_EVENT, handleVisitsUpdate);
      window.removeEventListener(AVAILABILITY_CONFIRMED_EVENT, handleVisitsUpdate);
      window.removeEventListener('storage', refreshData);
    };
  }, [userPhone, userId]);

  // Combine and normalize real service records with clear 3-stage lifecycle: PENDING -> ACTIVE -> CONFIRMED -> COMPLETED
  const allServices: UnifiedServiceItem[] = useMemo(() => {
    const list: UnifiedServiceItem[] = [];
    const seenIds = new Set<string>();

    // 1. Maintenance tickets
    tickets.forEach((t) => {
      if (seenIds.has(t.id)) return;
      seenIds.add(t.id);

      const isCompleted = t.status === 'COMPLETED';
      let rawStatus: 'PENDING' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED' = 'PENDING';
      let statusLabel = 'Pending Provider Acceptance';

      if (t.status === 'COMPLETED') {
        rawStatus = 'COMPLETED';
        statusLabel = 'Job Completed';
      } else if (t.status === 'CONFIRMED' || t.status === 'IN_PROGRESS') {
        rawStatus = 'CONFIRMED';
        statusLabel = 'Confirmed • Agreement Finalized';
      } else if (t.status === 'ACTIVE' || t.status === 'ACCEPTED') {
        rawStatus = 'ACTIVE';
        statusLabel = 'Active • Ready to Negotiate';
      } else {
        rawStatus = 'PENDING';
        statusLabel = 'Pending Provider Acceptance';
      }

      list.push({
        id: t.id,
        title: t.title,
        serviceType: t.category,
        category: t.category,
        serviceGroup: detectServiceGroup(t.id, t.category, t.title),
        status: statusLabel,
        rawStatus,
        time: t.scheduledTime || t.assignedAt || 'TODAY',
        icon: t.icon || (t.category === 'Electrical' ? 'bolt' : t.category === 'Plumbing' ? 'plumbing' : t.category === 'Security & CCTV' ? 'shield_person' : 'build'),
        price: t.price || 'Fee on Inspection',
        providerName: t.technicianName || (rawStatus === 'PENDING' ? 'Awaiting Provider' : 'Verified Specialist'),
        providerRole: t.technicianRole || (rawStatus === 'PENDING' ? 'Pending Acceptance' : 'Service Specialist'),
        providerPhone: t.technicianPhone || '',
        address: t.address ? `${t.address}${t.area ? `, ${t.area}` : ''}` : 'Dhaka',
        isCompleted,
        rating: isCompleted ? 5 : undefined,
        originalData: t
      });
    });

    // 2. Pick & Drop requests
    pickDropRequests.forEach((pd) => {
      if (seenIds.has(pd.id)) return;
      seenIds.add(pd.id);

      const isCompleted = pd.status === 'COMPLETED';
      let rawStatus: 'PENDING' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED' = 'PENDING';
      let statusLabel = 'Pending Driver Acceptance';

      if (pd.status === 'COMPLETED') {
        rawStatus = 'COMPLETED';
        statusLabel = 'Cargo Delivered';
      } else if (pd.status === 'CONFIRMED' || pd.status === 'ON_TRIP') {
        rawStatus = 'CONFIRMED';
        statusLabel = 'Confirmed • Moving Deal Locked';
      } else if (pd.status === 'ACTIVE' || pd.status === 'ACCEPTED') {
        rawStatus = 'ACTIVE';
        statusLabel = 'Active • Driver Assigned';
      } else {
        rawStatus = 'PENDING';
        statusLabel = 'Pending Driver Acceptance';
      }

      list.push({
        id: pd.id,
        title: `Pick & Drop (${pd.vehicle || 'Truck'})`,
        serviceType: 'Pick & Drop',
        category: 'Pick & Drop',
        serviceGroup: 'Pick & Drop',
        status: statusLabel,
        rawStatus,
        time: pd.createdAt ? new Date(pd.createdAt).toLocaleDateString() : 'TODAY',
        icon: 'local_shipping',
        price: pd.fare ? `৳ ${pd.fare}` : 'Pending Fare',
        providerName: pd.driverName || (rawStatus === 'PENDING' ? 'Awaiting Driver' : 'Assigned Driver'),
        providerRole: `${pd.vehicle || 'Truck'} Logistics`,
        providerPhone: pd.driverPhone || '',
        address: `${pd.pickupArea || 'Pickup'} ➔ ${pd.dropArea || 'Drop'}`,
        isCompleted,
        rating: isCompleted ? 5 : undefined,
        originalData: pd
      });
    });

    // 3. Scheduled visits (if not duplicated by a ticket)
    scheduledVisits.forEach((v) => {
      if (seenIds.has(v.id) || (v.ticketId && seenIds.has(v.ticketId))) return;
      seenIds.add(v.id);

      const isCompleted = v.status === 'COMPLETED' || v.status === 'CANCELLED';
      const rawStatus: 'PENDING' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED' = isCompleted ? 'COMPLETED' : 'CONFIRMED';
      let statusLabel = 'Scheduled Visit';
      if (v.availabilityConfirmed) statusLabel = 'Availability Confirmed';
      else if (v.status === 'NOTIFIED_PENDING') statusLabel = 'Check Required';
      else if (v.status === 'COMPLETED') statusLabel = 'Visit Finished';

      list.push({
        id: v.id,
        title: v.serviceTitle,
        serviceType: v.serviceType,
        category: v.serviceType,
        serviceGroup: detectServiceGroup(v.id, v.serviceType, v.serviceTitle),
        status: statusLabel,
        rawStatus,
        time: v.scheduledTime || 'TODAY',
        icon: v.serviceType.toLowerCase().includes('elec') ? 'bolt' : v.serviceType.toLowerCase().includes('plumb') ? 'plumbing' : 'build',
        price: 'Scheduled Service',
        providerName: v.providerName,
        providerRole: v.providerRole,
        providerPhone: v.providerPhone,
        address: v.address,
        isCompleted,
        rating: isCompleted ? 5 : undefined,
        originalData: v
      });
    });

    return list;
  }, [tickets, pickDropRequests, scheduledVisits]);

  // Group-level pending filter state
  const [pendingGroupFilter, setPendingGroupFilter] = useState<'ALL' | ServiceGroup>('ALL');
  const [cancellingRequest, setCancellingRequest] = useState<UnifiedServiceItem | null>(null);

  // Categorize counts
  const pendingServices = useMemo(() => allServices.filter(s => s.rawStatus === 'PENDING'), [allServices]);
  const pendingCount = pendingServices.length;
  const activeCount = useMemo(() => allServices.filter(s => s.rawStatus === 'ACTIVE').length, [allServices]);
  const confirmedCount = useMemo(() => allServices.filter(s => s.rawStatus === 'CONFIRMED').length, [allServices]);
  const completedCount = useMemo(() => allServices.filter(s => s.rawStatus === 'COMPLETED').length, [allServices]);

  // Pending service count per group
  const pendingGroupCounts = useMemo(() => {
    const counts: Record<ServiceGroup, number> = {
      'Maintenance': 0,
      'Security': 0,
      'Maid': 0,
      'Pick & Drop': 0
    };
    pendingServices.forEach(s => {
      if (counts[s.serviceGroup] !== undefined) {
        counts[s.serviceGroup]++;
      } else {
        counts['Maintenance']++;
      }
    });
    return counts;
  }, [pendingServices]);

  // Filtered pending services based on selected group
  const displayedPendingServices = useMemo(() => {
    if (pendingGroupFilter === 'ALL') return pendingServices;
    return pendingServices.filter(s => s.serviceGroup === pendingGroupFilter);
  }, [pendingServices, pendingGroupFilter]);

  // Handle cancellation of pending service request
  const handleConfirmCancelRequest = () => {
    if (!cancellingRequest) return;
    haptics.selection();
    const isPd = cancellingRequest.id.startsWith('PD-') || cancellingRequest.category === 'Pick & Drop';
    if (isPd) {
      deletePickDropRequest(cancellingRequest.id);
    } else {
      deleteMaintenanceTicket(cancellingRequest.id);
    }
    showToast(isBn 
      ? `অনুরোধ #${cancellingRequest.id} সফলভাবে বাতিল করা হয়েছে।` 
      : `Service request #${cancellingRequest.id} has been cancelled.`);
    setCancellingRequest(null);
    refreshData();
  };

  // Filter items based on active tab
  const displayedList = useMemo(() => {
    if (filter === 'ALL') return allServices;
    if (filter === 'PENDING') return allServices.filter(s => s.rawStatus === 'PENDING');
    if (filter === 'ACTIVE') return allServices.filter(s => s.rawStatus === 'ACTIVE');
    if (filter === 'CONFIRMED') return allServices.filter(s => s.rawStatus === 'CONFIRMED');
    if (filter === 'COMPLETED') return allServices.filter(s => s.rawStatus === 'COMPLETED');
    return allServices;
  }, [allServices, filter]);

  // Handler for provider acceptance simulation
  const handleAcceptByProvider = (srv: UnifiedServiceItem) => {
    haptics.bookingConfirmed();
    const isPd = srv.id.startsWith('PD-') || srv.category === 'Pick & Drop';
    
    if (isPd) {
      acceptPickDropRequest(srv.id, {
        name: 'Rakibul Islam',
        phone: '+880 1819-234567',
        vehicleNo: 'Dhaka Metro-Ta 14-8821'
      });
      showToast(`Moving request #${srv.id} accepted! Status is now ACTIVE.`);
    } else {
      const isSec = srv.category === 'Security & CCTV' || srv.title.toLowerCase().includes('security') || srv.title.toLowerCase().includes('guard');
      const isMaid = srv.title.toLowerCase().includes('maid') || srv.title.toLowerCase().includes('housekeeping');
      
      acceptMaintenanceTicket(srv.id, {
        name: isSec ? 'Habibur Rahman' : isMaid ? 'Fatema Begum' : 'Md. Kabir Hossain',
        role: isSec ? 'Senior Security Officer • 5.0★' : isMaid ? 'Verified Housekeeper • 4.9★' : 'Licensed Senior Specialist • 4.9★',
        phone: isSec ? '+880 1855-667788' : isMaid ? '+880 1744-889900' : '+880 1712-984512'
      });
      showToast(`Request #${srv.id} accepted by provider! Status is now ACTIVE.`);
    }

    refreshData();
  };

  // Handler for marking confirmed job complete
  const handleCompleteJob = (srv: UnifiedServiceItem) => {
    haptics.selection();
    const isPd = srv.id.startsWith('PD-') || srv.category === 'Pick & Drop';
    if (isPd) {
      updatePickDropStatus(srv.id, 'COMPLETED');
    } else {
      completeMaintenanceTicket(srv.id);
    }
    showToast(`Service #${srv.id} completed! Moved to Past History.`);
    refreshData();
  };

  // Handler for Price Mismatch / Cancel & Re-broadcast to other providers
  const handlePriceMismatchRebroadcast = (srv: UnifiedServiceItem) => {
    haptics.selection();
    const isPd = srv.id.startsWith('PD-') || srv.category === 'Pick & Drop';
    if (isPd) {
      releasePickDropRequestToPending(srv.id, 'Price negotiation did not meet agreement');
    } else {
      releaseMaintenanceTicketToPending(srv.id, 'Price negotiation did not meet agreement');
    }
    showToast(isBn 
      ? `দরদাম না মেলায় অনুরোধটি পুনরায় অপেক্ষমাণ (PENDING) তালিকায় অন্তর্ভুক্ত ও সম্প্রচার করা হয়েছে!` 
      : `Price did not meet. Request returned to PENDING and re-broadcast to all approved service providers!`);
    setFilter('PENDING');
    refreshData();
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-background-dark font-display max-w-[430px] mx-auto overflow-hidden text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="glass-card bg-[#0e211e]/95 border border-primary/40 rounded-2xl p-3.5 shadow-[0_10px_30px_rgba(19,236,218,0.3)] flex items-center gap-3 backdrop-blur-xl">
            <span className="material-symbols-outlined text-primary text-xl font-black shrink-0">check_circle</span>
            <p className="text-white text-xs font-bold leading-snug flex-1">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-5 pt-14 pb-3 shrink-0 flex flex-col gap-4 relative z-10 bg-background-dark/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack} 
              className="size-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/10"
              title="Back"
            >
              <span className="material-symbols-outlined text-white/60">arrow_back</span>
            </button>
            <div>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.25em] italic leading-none">
                {userProfile?.full_name 
                  ? (isBn ? `${userProfile.full_name}-এর অনুরোধ ও ইতিহাস` : `${userProfile.full_name}'s Orders`) 
                  : (isBn ? 'আমার সেবা অনুরোধ ও ইতিহাস' : 'My Requests')}
              </p>
              <h1 className="text-white tracking-tight text-2xl font-black italic uppercase mt-1">
                {isBn ? 'সেবা ও কাজের ইতিহাস' : 'Service History'}
              </h1>
            </div>
          </div>
          <button 
            onClick={() => onNavigate(Screen.SERVICES_HUB)}
            className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary active:scale-90 transition-all hover:bg-primary/20 shadow-[0_0_15px_rgba(19,236,218,0.15)]"
            title={isBn ? 'নতুন সেবার আবেদন' : 'Book new service'}
          >
            <span className="material-symbols-outlined text-lg font-black">add</span>
          </button>
        </div>
        
        {/* Multi-Stage Filter Tabs: ALL -> PENDING -> ACTIVE -> CONFIRMED -> PAST */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setFilter('ALL');
            }}
            className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              filter === 'ALL' 
                ? 'bg-white text-background-dark shadow-md' 
                : 'bg-white/5 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            <span>{isBn ? 'সকল ইতিহাস' : 'ALL'}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${filter === 'ALL' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/60'}`}>
              {allServices.length}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setFilter('PENDING');
            }}
            className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              filter === 'PENDING' 
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20' 
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>{isBn ? 'অপেক্ষমাণ' : 'PENDING'}</span>
            {pendingCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${filter === 'PENDING' ? 'bg-black/30 text-black' : 'bg-amber-400/20 text-amber-300'}`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setFilter('ACTIVE');
            }}
            className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              filter === 'ACTIVE' 
                ? 'bg-primary text-background-dark shadow-md shadow-primary/20' 
                : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
            }`}
          >
            <span className="size-1.5 rounded-full bg-primary animate-ping"></span>
            <span>{isBn ? 'চলমান' : 'ACTIVE'}</span>
            {activeCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${filter === 'ACTIVE' ? 'bg-background-dark/30 text-background-dark' : 'bg-primary/20 text-primary'}`}>
                {activeCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setFilter('CONFIRMED');
            }}
            className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              filter === 'CONFIRMED' 
                ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            <span className="material-symbols-outlined text-xs">verified</span>
            <span>{isBn ? 'নিশ্চিতকৃত' : 'CONFIRMED'}</span>
            {confirmedCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${filter === 'CONFIRMED' ? 'bg-black/30 text-black' : 'bg-emerald-400/20 text-emerald-300'}`}>
                {confirmedCount}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => {
              haptics.selection();
              setFilter('COMPLETED');
            }}
            className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
              filter === 'COMPLETED' 
                ? 'bg-white/20 text-white shadow-md' 
                : 'bg-white/5 text-white/40 hover:text-white border border-white/5'
            }`}
          >
            <span>{isBn ? 'সম্পন্ন ইতিহাস' : 'PAST'}</span>
            {completedCount > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${filter === 'COMPLETED' ? 'bg-black/20 text-white' : 'bg-white/10 text-white/40'}`}>
                {completedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Request Stream */}
      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-40 no-scrollbar relative z-10">
        <div className="flex flex-col gap-4">
          {displayedList.map((srv) => {
            const isPending = srv.rawStatus === 'PENDING';
            const isActive = srv.rawStatus === 'ACTIVE';
            const isConfirmed = srv.rawStatus === 'CONFIRMED';
            const isCompleted = srv.rawStatus === 'COMPLETED';

            return (
              <div 
                key={srv.id} 
                className={`glass-card rounded-[2rem] p-5 flex flex-col gap-4 border shadow-2xl transition-all ${
                  isPending 
                    ? 'border-amber-500/30 bg-amber-500/[0.03]' 
                    : isActive 
                    ? 'border-primary/40 bg-primary/[0.04] shadow-[0_0_25px_rgba(19,236,218,0.1)]' 
                    : isConfirmed 
                    ? 'border-emerald-500/40 bg-emerald-500/[0.04] shadow-[0_0_25px_rgba(52,211,153,0.1)]' 
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {/* Header & Icon */}
                <div className="flex items-start gap-4">
                  <div className={`size-14 rounded-[1.2rem] flex items-center justify-center shrink-0 border ${
                    isPending 
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                      : isActive 
                      ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_15px_rgba(19,236,218,0.2)]' 
                      : isConfirmed 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]' 
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}>
                    <span className="material-symbols-outlined text-3xl font-light">{srv.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-white text-base font-black italic tracking-tighter uppercase truncate pr-2">
                        {srv.title}
                      </h4>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest shrink-0 mt-0.5">
                        {srv.time}
                      </span>
                    </div>

                    {/* Prominent Stage Badges */}
                    <div className="flex items-center gap-2 mt-1.5">
                      {isPending && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300">
                          <span className="size-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          <span className="text-[9.5px] font-black uppercase tracking-wider">{isBn ? 'অপেক্ষমাণ আবেদন' : 'PENDING REQUEST'}</span>
                        </div>
                      )}

                      {isActive && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/50 text-primary">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                          <span className="text-[9.5px] font-black uppercase tracking-wider">{isBn ? 'চলমান • গৃহীত' : 'ACTIVE • ACCEPTED'}</span>
                        </div>
                      )}

                      {isConfirmed && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          <span className="text-[9.5px] font-black uppercase tracking-wider">{isBn ? 'নিশ্চিতকৃত চুক্তি' : 'CONFIRMED REQUEST'}</span>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/60">
                          <span className="material-symbols-outlined text-xs">done_all</span>
                          <span className="text-[9.5px] font-black uppercase tracking-wider">{isBn ? 'সম্পূর্ণ হয়েছে' : 'COMPLETED'}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2 italic truncate">
                      {isBn ? 'আইডি' : 'ID'}: <span className="text-white/70">#{srv.id}</span> • {srv.price}
                    </p>
                    <p className="text-white/30 text-[9px] truncate mt-0.5">
                      📍 {srv.address}
                    </p>
                    {srv.originalData?.description && (
                      <p className="text-primary/90 text-[10px] font-medium mt-1.5 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 line-clamp-2">
                        ⏱️ {srv.originalData.description}
                      </p>
                    )}
                    {srv.originalData?.itemDetails && (
                      <div className="mt-1.5 bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm text-black">
                        <span className="text-[9px] font-black uppercase text-gray-500 block">
                          {isBn ? 'পরিবহনের মালামাল:' : 'Moving Items:'}
                        </span>
                        <p className="text-[10.5px] font-semibold text-black italic line-clamp-2">
                          "{srv.originalData.itemDetails}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1. STAGE: PENDING - Awaiting Provider Acceptance */}
                {isPending && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-white flex flex-col gap-2.5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        <span>{isBn ? 'সেবা প্রদানকারীর অনুমোদনের অপেক্ষায়' : 'Pending Provider Acceptance'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[8.5px]">
                        {isBn ? 'প্রচারিত' : 'Broadcasted'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-white/80 leading-relaxed font-medium">
                      {isBn 
                        ? `আপনার ${srv.price} মূল্যের সেবা অনুরোধটি সিস্টেমে যুক্ত হয়েছে। বিশেষজ্ঞ বা কর্মী এটি গ্রহণ করলেই সরাসরি চ্যাট ও দরদাম শুরু হবে।` 
                        : `Your service request of ${srv.price} has been broadcasted. Once a specialist or guard accepts, this request becomes ACTIVE to start chat and price negotiations.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAcceptByProvider(srv)}
                      className="mt-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-amber-400/25"
                    >
                      <span className="material-symbols-outlined text-base font-black">handshake</span>
                      <span>{isBn ? 'সেবা প্রদানকারী হিসেবে আবেদন গ্রহণ করুন' : 'Accept Request as Service Provider'}</span>
                    </button>
                  </div>
                )}

                {/* 2. STAGE: ACTIVE - Provider Accepted, Ready for Chat & Negotiation */}
                {isActive && (
                  <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-white flex flex-col gap-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        <span>{isBn ? 'বিশেষজ্ঞ নির্ধারিত ও সক্রিয়' : 'Specialist Assigned & Active'}</span>
                      </div>
                      <span className="text-[9px] text-primary/80 font-bold uppercase">
                        {isBn ? 'দরদাম করার জন্য প্রস্তুত' : 'Ready to Negotiate'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-white/80 leading-relaxed font-medium">
                      {isBn 
                        ? `${srv.providerName} (${srv.providerRole}) আপনার আবেদন গ্রহণ করেছেন। চূড়ান্ত মূল্য ও শর্ত নির্ধারণের জন্য চ্যাট শুরু করুন।`
                        : `${srv.providerName} (${srv.providerRole}) has accepted your request. Open chat to negotiate final price and lock in the agreement.`}
                    </p>
                  </div>
                )}

                {/* 3. STAGE: CONFIRMED - Negotiated via Chat & Confirmed */}
                {isConfirmed && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white flex flex-col gap-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>{isBn ? 'চ্যাটে চুক্তি চূড়ান্ত ও নিশ্চিত হয়েছে' : 'Agreement Confirmed in Chat'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8.5px] font-bold">
                        {isBn ? 'চুক্তি সম্পন্ন' : 'Deal Locked'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-white/80 leading-relaxed font-medium">
                      {isBn
                        ? `${srv.price} মূল্যে চুক্তি চূড়ান্ত ও নিশ্চিত হয়েছে। দায়িত্ব পেয়েছেন ${srv.providerName}। লাইভ সেবা ও পরিদর্শনের জন্য প্রস্তুত।`
                        : `Deal negotiated and confirmed at ${srv.price}. Assigned to ${srv.providerName}. Ready for dispatch and live service.`}
                    </p>
                  </div>
                )}

                {/* 30-Minute Availability Check if active visit */}
                {!srv.isCompleted && (() => {
                  const matchingVisit = scheduledVisits.find(v => 
                    v.id === srv.id || 
                    (v.ticketId && v.ticketId === srv.id) || 
                    srv.id.includes(v.id)
                  );
                  
                  if (!matchingVisit) return null;

                  return (
                    <div className="mt-1">
                      {matchingVisit.availabilityConfirmed ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                          <span>{isBn ? 'আগমনের জন্য উপস্থিতি নিশ্চিত' : 'Availability Confirmed for Arrival'}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            haptics.selection();
                            setConfirmModalVisit(matchingVisit);
                          }}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-[0.98]"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm animate-pulse">alarm</span>
                            <span>{isBn ? '৩০ মিনিট পূর্বের যাচাই: উপস্থিতি নিশ্চিত করুন' : '30m Pre-Visit Check: Confirm Availability'}</span>
                          </span>
                          <span className="material-symbols-outlined text-xs">arrow_forward_ios</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Action Buttons for Each Stage */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  {/* PENDING ACTIONS */}
                  {isPending && (
                    <div className="flex gap-2 w-full">
                      <button 
                        type="button"
                        onClick={() => handleAcceptByProvider(srv)}
                        className="flex-1 h-12 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-[10px] font-black tracking-widest shadow-lg shadow-amber-400/20 active:scale-95 uppercase italic flex items-center justify-center gap-2 transition-all"
                      >
                        <span className="material-symbols-outlined text-base font-black">handshake</span>
                        <span>{isBn ? 'আবেদন গ্রহণ করুন (প্রোভাইডার)' : 'ACCEPT REQUEST (PROVIDER)'}</span>
                      </button>
                    </div>
                  )}

                  {/* ACTIVE ACTIONS: CHAT & NEGOTIATE OR PRICE MISMATCH RE-BROADCAST */}
                  {isActive && (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 w-full">
                        <button 
                          type="button"
                          onClick={() => onChat(srv)}
                          className="flex-1 h-12 rounded-xl bg-primary text-background-dark text-[10px] font-black tracking-widest shadow-lg shadow-primary/25 active:scale-95 uppercase italic flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                        >
                          <span className="material-symbols-outlined text-base font-black">forum</span>
                          <span>{isBn ? 'চ্যাট ও দরদাম করুন' : 'CHAT & NEGOTIATE'}</span>
                        </button>
                        {srv.providerPhone && (
                          <a 
                            href={`tel:${srv.providerPhone}`}
                            className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-all text-emerald-400 hover:bg-white/10 shrink-0"
                            title={isBn ? 'ফোন করুন' : 'Call specialist'}
                          >
                            <span className="material-symbols-outlined text-xl">call</span>
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePriceMismatchRebroadcast(srv)}
                        className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-[9.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm font-black">sync_problem</span>
                        <span>{isBn ? 'দরদাম মেলেনি? বাতিল ও পুনরায় সম্প্রচার' : "Price Doesn't Meet? Cancel & Re-broadcast"}</span>
                      </button>
                    </div>
                  )}

                  {/* CONFIRMED ACTIONS: TRACK LIVE, VIEW CHAT, COMPLETE */}
                  {isConfirmed && (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 w-full">
                        <button 
                          type="button"
                          onClick={() => onTrack(srv)}
                          className="flex-1 h-12 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-[10px] font-black tracking-widest shadow-lg shadow-emerald-400/25 active:scale-95 uppercase italic flex items-center justify-center gap-2 transition-all"
                        >
                          <span className="material-symbols-outlined text-base font-black">near_me</span>
                          <span>{isBn ? 'লাইভ ট্র্যাকিং দেখুন' : 'TRACK LIVE'}</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => onChat(srv)}
                          className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-all text-white/70 hover:text-white hover:bg-white/10 shrink-0"
                          title={isBn ? 'চ্যাট করুন' : 'Chat with specialist'}
                        >
                          <span className="material-symbols-outlined text-xl">forum</span>
                        </button>
                        {srv.providerPhone && (
                          <a 
                            href={`tel:${srv.providerPhone}`}
                            className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-all text-emerald-400 hover:bg-white/10 shrink-0"
                            title={isBn ? 'ফোন করুন' : 'Call specialist'}
                          >
                            <span className="material-symbols-outlined text-xl">call</span>
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCompleteJob(srv)}
                        className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[9px] font-black uppercase tracking-wider transition-colors"
                      >
                        {isBn ? 'কাজটি সম্পন্ন হয়েছে চিহ্নিত করুন ✓' : 'Mark Job As Completed ✓'}
                      </button>
                    </div>
                  )}

                  {/* COMPLETED ACTIONS */}
                  {isCompleted && (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span 
                            key={i} 
                            className="material-symbols-outlined text-xs text-amber-400" 
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        ))}
                        <span className="text-[9px] text-white/50 font-black uppercase ml-1 italic">
                          {isBn ? 'যাচাইকৃত সম্পন্ন' : 'Verified Complete'}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => onNavigate(Screen.SERVICES_HUB)}
                        className="px-4 h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary text-[9px] font-black tracking-widest uppercase italic hover:bg-primary/20 active:scale-95 transition-all"
                      >
                        {isBn ? 'পুনরায় বুক করুন' : 'Book Again'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {displayedList.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center glass-card rounded-3xl p-8 border border-white/5 mx-2 my-4">
            <div className="size-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined text-4xl">
                {filter === 'PENDING' ? 'hourglass_top' : filter === 'ACTIVE' ? 'forum' : filter === 'CONFIRMED' ? 'verified' : 'history'}
              </span>
            </div>
            <h3 className="text-white font-black text-sm uppercase tracking-wider mb-1">
              {isBn 
                ? (filter === 'ALL' ? 'কোনো সেবার ইতিহাস নেই' : `কোনো ${filter === 'PENDING' ? 'অপেক্ষমাণ' : filter === 'ACTIVE' ? 'চলমান' : filter === 'CONFIRMED' ? 'নিশ্চিতকৃত' : 'সম্পন্ন'} অনুরোধ নেই`)
                : `No ${filter === 'ALL' ? 'Service' : filter} Requests`}
            </h3>
            <p className="text-white/40 text-xs max-w-xs leading-relaxed mb-6">
              {isBn 
                ? (filter === 'PENDING' 
                    ? 'বর্তমানে অনুমোদনের অপেক্ষায় আপনার কোনো অনুরোধ নেই।' 
                    : filter === 'ACTIVE'
                    ? 'এই মুহূর্তে চ্যাট ও দরদামের জন্য কোনো সক্রিয় অনুরোধ নেই।'
                    : filter === 'CONFIRMED'
                    ? 'বর্তমানে কোনো নিশ্চিতকৃত সেবার চুক্তি নেই।'
                    : 'আপনার সকল সেবা অনুরোধ ও কাজের ইতিহাস এখানে পর্যায়ক্রমে দেখা যাবে।')
                : (filter === 'PENDING' 
                    ? 'You have no requests currently awaiting provider acceptance.' 
                    : filter === 'ACTIVE'
                    ? 'No active requests ready for chat and negotiations right now.'
                    : filter === 'CONFIRMED'
                    ? 'No confirmed service requests at the moment.'
                    : 'Service requests submitted will appear in their respective stages here.')}
            </p>
            <button
              type="button"
              onClick={() => onNavigate(Screen.SERVICES_HUB)}
              className="px-6 py-3.5 rounded-xl bg-primary text-background-dark font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>{isBn ? 'সেবাসমূহ দেখুন' : 'Explore Services'}</span>
            </button>
          </div>
        )}
      </main>

      <AvailabilityConfirmModal
        isOpen={Boolean(confirmModalVisit)}
        visit={confirmModalVisit}
        onClose={() => setConfirmModalVisit(null)}
        onConfirmed={() => {
          setConfirmModalVisit(null);
          refreshData();
        }}
      />

      <BottomNav activeTab="HISTORY" onNavigate={onNavigate} lang={lang} />

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default ServiceHistory;
