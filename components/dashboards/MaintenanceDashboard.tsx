
import React, { useState, useEffect, useMemo } from 'react';
import SmartHomeControl from '../SmartHomeControl';
import TicketProgressBar from '../TicketProgressBar';
import { haptics } from '../../haptics';
import {
  MaintenanceTicket,
  MaintenanceTicketStatus,
  getStoredMaintenanceTickets,
  fetchMaintenanceTicketsFromDB,
  updateTicketStatus,
  acceptMaintenanceTicket,
  releaseMaintenanceTicketToPending,
  subscribeToMaintenanceTickets,
  resetMaintenanceTicketsToDefault
} from '../../maintenanceStorage';

interface Props {
  onBack: () => void;
  onNavigate: () => void;
  userProfile?: any;
}

const MaintenanceDashboard: React.FC<Props> = ({ onBack, onNavigate, userProfile }) => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [filterQueue, setFilterQueue] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  const specialistName = userProfile?.full_name || 'Rafiqul Islam';
  const specialistPhone = userProfile?.phone || '+880 1855-667788';

  // Load tickets from database on mount & subscribe to real-time updates
  useEffect(() => {
    // Initial sync from local storage
    const initial = getStoredMaintenanceTickets();
    setTickets(initial);
    if (initial.length > 0 && !selectedTicketId) {
      // Pick first active or in-progress ticket, otherwise first ticket
      const active = initial.find(t => t.status === 'IN_PROGRESS') || initial.find(t => t.status === 'ASSIGNED') || initial[0];
      setSelectedTicketId(active.id);
    }

    // Async sync from Supabase DB if available
    fetchMaintenanceTicketsFromDB().then(dbTickets => {
      if (dbTickets && dbTickets.length > 0) {
        setTickets(dbTickets);
        if (!selectedTicketId) {
          const active = dbTickets.find(t => t.status === 'IN_PROGRESS') || dbTickets.find(t => t.status === 'ASSIGNED') || dbTickets[0];
          setSelectedTicketId(active.id);
        }
      }
    });

    // Real-time listener for database / storage updates
    const unsubscribe = subscribeToMaintenanceTickets(() => {
      const refreshed = getStoredMaintenanceTickets();
      setTickets(refreshed);
    });

    return unsubscribe;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Find currently active ticket
  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  // Active tickets (Assigned or In Progress)
  const activeTickets = tickets.filter(t => t.status !== 'COMPLETED');
  const completedTickets = tickets.filter(t => t.status === 'COMPLETED');
  const pendingTickets = tickets.filter(t => 
    t.status === 'PENDING' && 
    t.category !== 'Security & CCTV' && 
    (t.category as any) !== 'Maid & Housekeeping' && 
    !t.title.toLowerCase().includes('guard') && 
    !t.title.toLowerCase().includes('maid') && 
    !t.title.toLowerCase().includes('housekeeping')
  );

  const handleAcceptPendingTicket = (ticketId: string) => {
    acceptMaintenanceTicket(ticketId, {
      name: specialistName,
      role: 'Approved Maintenance Specialist • 4.9★',
      phone: specialistPhone
    });
    setSelectedTicketId(ticketId);
    showToast(`Work order #${ticketId} accepted! Status is now ACTIVE.`);
  };

  const handleReleasePriceMismatch = (ticketId: string) => {
    haptics.selection();
    releaseMaintenanceTicketToPending(ticketId, 'Specialist could not agree on price');
    showToast(`Work order #${ticketId} released due to price disagreement. Re-broadcasted to pending queue for other specialists.`);
    const refreshed = getStoredMaintenanceTickets();
    setTickets(refreshed);
    const active = refreshed.find(t => t.status === 'IN_PROGRESS') || refreshed.find(t => t.status === 'ASSIGNED') || refreshed[0];
    if (active) setSelectedTicketId(active.id);
  };

  // Handle status update in the database
  const handleStatusChange = (newStatus: MaintenanceTicketStatus) => {
    if (!activeTicket) return;
    const updated = updateTicketStatus(activeTicket.id, newStatus);
    if (updated) {
      const statusLabel = 
        newStatus === 'ASSIGNED' ? 'Assigned' :
        newStatus === 'IN_PROGRESS' ? 'In Progress' : 'Completed';
      showToast(`Ticket #${activeTicket.id} updated to "${statusLabel}" in database`);
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeTicket) return;
    updateTicketStatus(activeTicket.id, activeTicket.status, newNoteText.trim());
    setNewNoteText('');
    setIsAddingNote(false);
    showToast('Technician note saved to database');
  };

  const handleResetData = () => {
    const defaultData = resetMaintenanceTicketsToDefault();
    setTickets(defaultData);
    if (defaultData.length > 0) {
      setSelectedTicketId(defaultData[0].id);
    }
    showToast('Database reset to standard work orders');
  };

  // Filtered queue items
  const queueTickets = tickets.filter(t => {
    if (filterQueue === 'ACTIVE') return t.status !== 'COMPLETED';
    if (filterQueue === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  // Generate live updates for 'Technician En-Route' or 'Service In-Progress'
  const tickerItems = useMemo(() => {
    const list: Array<{
      id: string;
      ticketId?: string;
      title: string;
      statusType: 'EN_ROUTE' | 'IN_PROGRESS';
      statusLabel: 'Technician En-Route' | 'Service In-Progress';
      technician: string;
      location: string;
      eta: string;
      price?: string;
    }> = [];

    // Map active tickets from state
    activeTickets.forEach(t => {
      const isInProgress = t.status === 'IN_PROGRESS';
      list.push({
        id: `ticket-${t.id}`,
        ticketId: t.id,
        title: t.title,
        statusType: isInProgress ? 'IN_PROGRESS' : 'EN_ROUTE',
        statusLabel: isInProgress ? 'Service In-Progress' : 'Technician En-Route',
        technician: t.technicianName || 'Ahmed Hassan',
        location: t.area || t.address || 'Dhaka',
        eta: isInProgress ? 'Active On-Site' : (t.scheduledTime || 'ETA ~15m'),
        price: t.price
      });
    });

    // Supplementary fleet telemetry so ticker is continuously populated and animated
    const sampleFleet = [
      {
        id: 'fleet-ac',
        title: 'AC Inverter Gas Refill & Coil Wash',
        statusType: 'EN_ROUTE' as const,
        statusLabel: 'Technician En-Route' as const,
        technician: 'Kawsar Mahmud',
        location: 'Gulshan-2, Road 71',
        eta: 'ETA ~12 mins',
        price: '৳1,800'
      },
      {
        id: 'fleet-elec',
        title: 'Main Circuit Breaker & Spark Repair',
        statusType: 'IN_PROGRESS' as const,
        statusLabel: 'Service In-Progress' as const,
        technician: 'Ahmed Hassan',
        location: 'Banani, Block D',
        eta: 'Work In-Progress (65%)',
        price: '৳1,250'
      },
      {
        id: 'fleet-plumb',
        title: 'Under-Sink Pipe Leak & Valve Seal',
        statusType: 'EN_ROUTE' as const,
        statusLabel: 'Technician En-Route' as const,
        technician: 'Md. Faruk Hossain',
        location: 'Dhanmondi, Road 27',
        eta: 'ETA ~18 mins',
        price: '৳950'
      },
      {
        id: 'fleet-appliance',
        title: 'Refrigerator Compressor Inspection',
        statusType: 'IN_PROGRESS' as const,
        statusLabel: 'Service In-Progress' as const,
        technician: 'Habibur Rahman',
        location: 'Uttara Sector 7',
        eta: 'Diagnostics On-Site',
        price: '৳1,400'
      }
    ];

    if (list.length === 0) return sampleFleet;
    if (list.length < 4) return [...list, ...sampleFleet.slice(0, 4 - list.length)];
    return list;
  }, [activeTickets]);

  const handleTickerItemClick = (item: typeof tickerItems[0]) => {
    haptics.selection();
    if (item.ticketId) {
      setSelectedTicketId(item.ticketId);
      showToast(`Selected #${item.ticketId}: ${item.statusLabel}`);
      setTimeout(() => {
        document.getElementById('active-task-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else {
      showToast(`Fleet Dispatch: ${item.statusLabel} • ${item.technician}`);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark font-display text-white overflow-x-hidden pb-16 relative">
      {/* Real-time Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[90%] bg-primary text-background-dark px-4 py-2.5 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2 border border-white/20 animate-in fade-in slide-in-from-top-3 duration-200">
          <span className="material-symbols-outlined text-base font-black">sync_saved_locally</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 pt-12 flex items-center justify-between backdrop-blur-xl bg-background-dark/80 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            id="maintenance-back-btn"
            onClick={onBack} 
            className="size-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors border border-white/10 active:scale-95"
            aria-label="Go Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="size-11 rounded-full bg-cover bg-center ring-2 ring-primary/40 p-0.5" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCg5jLn7IFO5q0DQqMw2byZIoYVpUCahuq6V12O-BaKd0-ANsqqAq4F4cnBiyjTYa7Ztw02xyKApwfW2A1noIQCBzYcvsHCP9XrYRHAbqPRRZ-Yh3MaskW1wpUyKZ8DjCjrqN8U0yD90ct0f2WgkIZTGmT-7TxtwXB0pB6tea4x-U83DpItXDuCo8GXJCT53VdyMhE-kqkybb6yld9qSwSJezo4k8AOYeH2_aKsln537RJ5RJaVZu27ghc1lOT9ZDmz87js595GruM')"}}></div>
          <div>
            <h1 className="text-sm font-black italic tracking-tight text-white uppercase leading-none">Ahmed Hassan</h1>
            <p className="text-[9px] text-primary uppercase tracking-[0.2em] font-black mt-1.5">Chief Technician</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-2xl border border-primary/20 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[9px] font-black tracking-widest text-primary uppercase italic">LIVE SYNC</span>
          </div>
        </div>
      </header>

      {/* Horizontal Status Ticker / Scrolling Marquee */}
      <section 
        aria-label="Live Active Bookings Ticker"
        className="w-full bg-[#081514] border-b border-primary/25 backdrop-blur-xl relative z-40 shadow-[0_4px_25px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="flex items-center h-11 max-w-[100vw]">
          {/* Pinned Left Radar Indicator */}
          <div className="flex items-center gap-1.5 px-3 h-full bg-black/90 border-r border-primary/30 shrink-0 z-20 shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black tracking-widest text-primary uppercase italic whitespace-nowrap">LIVE RADAR</span>
              <span className="text-[8px] font-black bg-primary/20 text-primary px-1 rounded border border-primary/30">
                {tickerItems.length}
              </span>
            </div>
          </div>

          {/* Left and Right Edge Fade Masks */}
          <div className="pointer-events-none absolute left-[105px] top-0 bottom-0 w-8 bg-gradient-to-r from-[#081514] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#081514] to-transparent z-10" />

          {/* Infinite Scrolling Marquee Track */}
          <div className="overflow-hidden flex-1 relative flex items-center h-full group">
            <div className="animate-marquee flex items-center gap-3 whitespace-nowrap pl-2 group-hover:[animation-play-state:paused]">
              {[...tickerItems, ...tickerItems].map((item, idx) => {
                const isProgress = item.statusType === 'IN_PROGRESS';
                return (
                  <button
                    type="button"
                    key={`${item.id}-${idx}`}
                    onClick={() => handleTickerItemClick(item)}
                    title={`Click to view ${item.title}`}
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl border backdrop-blur-md transition-all active:scale-95 shrink-0 select-none text-left cursor-pointer ${
                      isProgress
                        ? 'bg-amber-500/10 hover:bg-amber-500/25 border-amber-500/40 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                        : 'bg-primary/10 hover:bg-primary/25 border-primary/40 text-emerald-200 shadow-[0_0_15px_rgba(19,236,218,0.1)]'
                    }`}
                  >
                    {/* Live Pulse Dot + Status Badge */}
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isProgress ? 'bg-amber-400' : 'bg-primary'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                          isProgress ? 'bg-amber-400' : 'bg-primary'
                        }`}></span>
                      </span>
                      <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isProgress
                          ? 'bg-amber-400/20 text-amber-300 font-extrabold'
                          : 'bg-primary/20 text-primary font-extrabold'
                      }`}>
                        {item.statusLabel}
                      </span>
                    </span>

                    {/* Service Title */}
                    <span className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[170px]">
                      {item.title}
                    </span>

                    <span className="text-white/20 text-xs">•</span>

                    {/* Specialist */}
                    <span className="text-[10px] text-white/70 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-primary">
                        {isProgress ? 'construction' : 'two_wheeler'}
                      </span>
                      <span>{item.technician}</span>
                    </span>

                    <span className="text-white/20 text-xs">•</span>

                    {/* Location */}
                    <span className="text-[10px] text-white/50 font-medium">
                      📍 {item.location}
                    </span>

                    {/* ETA Badge */}
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      isProgress
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30'
                    }`}>
                      {item.eta}
                    </span>

                    {item.price && (
                      <span className="text-[9.5px] font-black text-white/50 pl-0.5">
                        {item.price}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-md mx-auto p-4 space-y-7 mt-2">
        {/* Performance Grid from Database */}
        <section className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/5 shadow-xl">
            <span className="material-symbols-outlined text-primary mb-1 text-xl">pending_actions</span>
            <p className="text-2xl font-black italic">{activeTickets.length}</p>
            <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">Active</p>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-white/5 shadow-xl">
            <span className="material-symbols-outlined text-emerald-400 mb-1 text-xl">task_alt</span>
            <p className="text-2xl font-black italic text-emerald-400">{completedTickets.length}</p>
            <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mt-1">Done</p>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-primary/20 bg-primary/5 shadow-xl">
            <span className="material-symbols-outlined text-primary mb-1 text-xl">account_balance_wallet</span>
            <p className="text-xl font-black text-primary italic">৳18.8k</p>
            <p className="text-[9px] text-primary/40 uppercase font-black tracking-widest mt-1">Earnings</p>
          </div>
        </section>

        {/* Broadcasted Resident Work Requests */}
        {pendingTickets.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black italic uppercase tracking-tight flex items-center gap-1.5 text-amber-300">
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                <span>Broadcasted Resident Requests ({pendingTickets.length})</span>
              </h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black uppercase">
                Awaiting Technician
              </span>
            </div>

            <div className="space-y-2.5">
              {pendingTickets.map((t) => (
                <div key={t.id} className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 space-y-3 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white text-xs font-black uppercase tracking-tight">{t.title}</h4>
                      <p className="text-[10px] text-white/50 font-bold mt-0.5">📍 {t.address || t.area || 'Dhaka'}</p>
                      {t.description && (
                        <p className="text-[10px] text-white/70 italic mt-1 line-clamp-2">"{t.description}"</p>
                      )}
                    </div>
                    <span className="text-amber-300 font-black text-xs shrink-0 ml-2">{t.price}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAcceptPendingTicket(t.id)}
                    className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/20"
                  >
                    <span className="material-symbols-outlined text-sm font-black">handshake</span>
                    <span>Accept & Assign to Self</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Task Section with Visual Progress Bar */}
        {activeTicket ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black italic uppercase tracking-tight">Active Work Order</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/10 text-white/60 font-mono font-bold">
                  {activeTicket.id}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                  activeTicket.priority === 'Emergency' 
                    ? 'bg-red-600/20 border-red-600/30 text-red-400 animate-pulse'
                    : 'bg-primary/20 border-primary/30 text-primary'
                }`}>
                  {activeTicket.priority}
                </span>
              </div>
            </div>

            {/* Active Ticket Switcher Tabs (if multiple tickets) */}
            {activeTickets.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {activeTickets.map(t => (
                  <button
                    key={`tab-${t.id}`}
                    type="button"
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 border transition-all flex items-center gap-1.5 ${
                      selectedTicketId === t.id
                        ? 'bg-primary text-background-dark border-primary shadow-sm'
                        : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {t.status === 'IN_PROGRESS' ? 'engineering' : 'assignment_ind'}
                    </span>
                    <span className="truncate max-w-[120px]">{t.title}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Main Active Task Card */}
            <div id="active-task-card" className="glass-card rounded-[2.5rem] overflow-hidden border-2 border-primary/30 active-glow relative shadow-2xl bg-white/[0.02]">
              {/* Card Banner */}
              <div 
                className="relative h-40 w-full bg-cover bg-center grayscale brightness-75 contrast-125" 
                style={{backgroundImage: `url('${activeTicket.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuDrulnHgKyC9Fhw3ri4gawWmANt8uMIC5QFIEkiEY7SDX0xOzLw69Q5HYMfhDqKipkVArhX5pLPke2Y75MUvULiQV45q4oOinbWWop8bs2HMnmVCkf882M0OVW8Rsj85DMhYFYiGMGw-jt5GMYwLgAqpiC3Pu53DTNdAQr-H0AxA7m3F3k96ApUrxChDgJDxPJY8lOU49PvaM2hlrU_Eo5rDC90yQaZlub2qBh-CsNiJTbL530yP4vsZ63OB6h6XgfKKKDBdItDOd0"}')`}}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent opacity-95"></div>
                
                {/* Status pill on image */}
                <div className="absolute top-4 left-5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary animate-ping"></span>
                  <span className="bg-background-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-primary/40 text-[9px] font-black text-primary uppercase tracking-widest">
                    {activeTicket.category} • {activeTicket.price}
                  </span>
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                  <h4 className="text-xl font-black italic tracking-tighter uppercase leading-tight text-white drop-shadow-md">
                    {activeTicket.title}
                  </h4>
                  <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    <span>Scheduled: {activeTicket.scheduledTime}</span>
                  </p>
                </div>
              </div>

              <div className="p-6 pt-4 space-y-5">
                {/* Location & Resident Details */}
                <div className="flex items-start gap-3.5 bg-white/5 rounded-2xl p-3.5 border border-white/5">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 text-primary">
                     <span className="material-symbols-outlined text-xl">location_on</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black italic uppercase tracking-tighter text-white/90 truncate">
                      {activeTicket.address}
                    </p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                      Resident: {activeTicket.customerName} • {activeTicket.customerPhone}
                    </p>
                  </div>
                  <a 
                    href={`tel:${activeTicket.customerPhone}`}
                    className="size-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center border border-primary/20 shrink-0 active:scale-95 transition-all"
                    title="Call Resident"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                  </a>
                </div>

                {/* VISUAL PROGRESS BAR COMPONENT */}
                <div className="bg-[#0b1413] rounded-2xl p-4 border border-primary/20 shadow-inner">
                  <TicketProgressBar 
                    ticket={activeTicket}
                    onStatusChange={handleStatusChange}
                    interactive={true}
                  />
                </div>

                {/* Description & Technician Notes */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">
                      Diagnosis & Scope
                    </span>
                    <button 
                      type="button"
                      onClick={() => setIsAddingNote(!isAddingNote)}
                      className="text-[9px] text-primary hover:underline font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">note_add</span>
                      <span>{isAddingNote ? 'Cancel' : 'Add Note'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed font-sans">
                    {activeTicket.description}
                  </p>

                  {/* Add Note Input Form */}
                  {isAddingNote && (
                    <form onSubmit={handleAddNote} className="mt-2 space-y-2 animate-in fade-in duration-200">
                      <input
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Type on-site note (e.g., Replaced 32A breaker)..."
                        className="w-full bg-white/5 border border-white/15 focus:border-primary rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingNote(false)}
                          className="px-3 py-1 bg-white/5 text-white/50 text-[10px] rounded-lg font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-primary text-background-dark text-[10px] rounded-lg font-black uppercase tracking-wider"
                        >
                          Save Note
                        </button>
                      </div>
                    </form>
                  )}

                  {/* History / Step Log list */}
                  {activeTicket.notes && activeTicket.notes.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-1">
                      <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">
                        Activity Logs (DB):
                      </p>
                      <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                        {activeTicket.notes.map((n, i) => (
                          <div key={i} className="text-[10px] text-white/50 flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-primary shrink-0"></span>
                            <span className="truncate">{n}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    id="btn-active-navigate"
                    onClick={onNavigate} 
                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic active:scale-95 shadow-inner"
                  >
                    <span className="material-symbols-outlined text-lg text-primary">navigation</span>
                    <span>Navigate</span>
                  </button>
                  
                  {activeTicket.status === 'PENDING' && (
                    <button 
                      type="button"
                      id="btn-active-accept-job"
                      onClick={() => {
                        acceptMaintenanceTicket(activeTicket.id, {
                          name: 'Md. Kabir Hossain',
                          role: 'Licensed Senior Specialist • 4.9★',
                          phone: '+880 1712-984512'
                        });
                        showToast('Request Accepted! Status is now ACTIVE • Ready for chat.');
                      }}
                      className="flex-[1.4] flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-black h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-400/30 italic active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg font-black">handshake</span>
                      <span>Accept Request</span>
                    </button>
                  )}

                  {(activeTicket.status === 'ASSIGNED' || activeTicket.status === 'ACTIVE' || activeTicket.status === 'CONFIRMED') && (
                    <button 
                      type="button"
                      id="btn-active-start-job"
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="flex-[1.4] flex items-center justify-center gap-2 bg-primary text-background-dark h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/30 italic active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg font-black">engineering</span>
                      <span>Start Job</span>
                    </button>
                  )}

                  {activeTicket.status === 'IN_PROGRESS' && (
                    <button 
                      type="button"
                      id="btn-active-mark-complete"
                      onClick={() => handleStatusChange('COMPLETED')}
                      className="flex-[1.4] flex items-center justify-center gap-2 bg-emerald-400 text-background-dark h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-400/30 italic active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg font-black">check_circle</span>
                      <span>Mark Complete</span>
                    </button>
                  )}

                  {activeTicket.status === 'COMPLETED' && (
                    <button 
                      type="button"
                      id="btn-active-reopen"
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="flex-[1.4] flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-primary h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic active:scale-95"
                    >
                      <span className="material-symbols-outlined text-lg">replay</span>
                      <span>Reopen Work</span>
                    </button>
                  )}
                </div>

                {/* Price Mismatch / Release to Queue Option */}
                {activeTicket.status !== 'COMPLETED' && activeTicket.status !== 'PENDING' && (
                  <button
                    type="button"
                    onClick={() => handleReleasePriceMismatch(activeTicket.id)}
                    className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    title="If price negotiation does not meet, release request back to PENDING for other specialists"
                  >
                    <span className="material-symbols-outlined text-sm font-black">sync_problem</span>
                    <span>Price Mismatch • Release Request to Other Specialists</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <div className="glass-card rounded-2xl p-6 text-center border border-white/10">
            <span className="material-symbols-outlined text-primary text-4xl mb-2">task</span>
            <p className="text-sm font-black uppercase italic">No Active Tickets</p>
            <p className="text-xs text-white/40 mt-1">All dispatched work orders have been completed.</p>
          </div>
        )}

        {/* Smart Home Control Panel */}
        <SmartHomeControl />

        {/* All Work Orders / Today's Queue with Visual Progress Status */}
        <section className="space-y-4 pb-8">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-black italic uppercase tracking-tight">Today's Queue</h3>
              <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
                Work orders stored in live database
              </p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setFilterQueue('ALL')}
                className={`px-2 py-1 rounded-lg transition-all ${filterQueue === 'ALL' ? 'bg-primary text-background-dark' : 'text-white/40'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterQueue('ACTIVE')}
                className={`px-2 py-1 rounded-lg transition-all ${filterQueue === 'ACTIVE' ? 'bg-primary text-background-dark' : 'text-white/40'}`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFilterQueue('COMPLETED')}
                className={`px-2 py-1 rounded-lg transition-all ${filterQueue === 'COMPLETED' ? 'bg-primary text-background-dark' : 'text-white/40'}`}
              >
                Done
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {queueTickets.map((task) => {
              const isSelected = activeTicket && activeTicket.id === task.id;
              const isAssigned = task.status === 'ASSIGNED';
              const isInProgress = task.status === 'IN_PROGRESS';
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div 
                  key={task.id} 
                  onClick={() => {
                    setSelectedTicketId(task.id);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className={`glass-card rounded-2xl p-4 flex flex-col gap-3 border transition-all cursor-pointer group ${
                    isSelected 
                      ? 'border-primary/50 bg-primary/5 shadow-[0_0_20px_rgba(19,236,218,0.15)] ring-1 ring-primary/30' 
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                  }`}
                  role="button"
                  tabIndex={0}
                  title="Click to view full progress bar in active task view"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-primary text-2xl">{task.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-black italic uppercase tracking-tighter text-white/90 truncate">
                          {task.title}
                        </h5>
                        <span className="text-[8px] font-mono font-bold text-white/40 shrink-0">
                          {task.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5 italic truncate">
                        {task.address} • {task.scheduledTime}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border ${
                        isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : isInProgress
                            ? 'bg-primary/10 border-primary/20 text-primary animate-pulse'
                            : 'bg-white/5 border-white/10 text-amber-400'
                      }`}>
                        {task.status === 'ASSIGNED' && 'Assigned'}
                        {task.status === 'IN_PROGRESS' && 'In Progress'}
                        {task.status === 'COMPLETED' && 'Completed'}
                      </span>
                    </div>
                  </div>

                  {/* Micro 3-step progress bar inside queue card */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] uppercase tracking-widest">
                    {/* Visual 3-node bar */}
                    <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                      {/* Step 1: Assigned */}
                      <div className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-primary"></span>
                        <span className="text-primary font-bold text-[8px]">Assigned</span>
                      </div>
                      <div className={`h-0.5 flex-1 rounded-full ${isInProgress || isCompleted ? 'bg-primary' : 'bg-white/10'}`}></div>

                      {/* Step 2: In Progress */}
                      <div className="flex items-center gap-1">
                        <span className={`size-2 rounded-full ${isInProgress ? 'bg-primary animate-ping' : isCompleted ? 'bg-primary' : 'bg-white/20'}`}></span>
                        <span className={`font-bold text-[8px] ${isInProgress ? 'text-primary' : isCompleted ? 'text-white/60' : 'text-white/20'}`}>
                          In Progress
                        </span>
                      </div>
                      <div className={`h-0.5 flex-1 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-white/10'}`}></div>

                      {/* Step 3: Completed */}
                      <div className="flex items-center gap-1">
                        <span className={`size-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-white/20'}`}></span>
                        <span className={`font-bold text-[8px] ${isCompleted ? 'text-emerald-400' : 'text-white/20'}`}>
                          Done
                        </span>
                      </div>
                    </div>

                    <span className="text-white/40 font-bold text-[8px] ml-2">
                      {task.price}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Database Control Bar */}
          <div className="pt-4 flex items-center justify-between px-2 text-[10px] text-white/40">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
              <span>Supabase / Local DB Active</span>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="text-primary hover:underline text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">restart_alt</span>
              <span>Reset Sample Tickets</span>
            </button>
          </div>
        </section>
      </main>

      <style>{`
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .active-glow {
            box-shadow: 0 0 30px rgba(19, 236, 218, 0.1);
        }
        @keyframes marquee-scroll {
            0% {
                transform: translateX(0%);
            }
            100% {
                transform: translateX(-50%);
            }
        }
        .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee-scroll 34s linear infinite;
            will-change: transform;
        }
        .animate-marquee:hover {
            animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default MaintenanceDashboard;
