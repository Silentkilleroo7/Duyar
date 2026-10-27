import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import { 
  getStoredApplications, 
  saveStoredApplications, 
  approveProviderApplication, 
  rejectProviderApplication, 
  subscribeToApplications, 
  ProviderApplication, 
  ProviderRoleKey 
} from './providerApplicationsStorage';
import { 
  getAllMaintenanceTickets, 
  updateTicketStatus, 
  releaseMaintenanceTicketToPending, 
  MaintenanceTicket 
} from './maintenanceStorage';
import { 
  getAllPickDropHistory, 
  updatePickDropStatus, 
  releasePickDropRequestToPending, 
  PickDropRequest 
} from './pickDropStorage';
import { 
  getDepositRequests, 
  approveManualDeposit, 
  rejectManualDeposit, 
  subscribeToDeposits, 
  completeWithdrawalPayout, 
  rejectWithdrawalPayout, 
  performAdminWalletAdjustment, 
  ManualDepositRequest 
} from './adminFinanceStorage';
import { 
  getPayoutRequests, 
  PayoutRequest 
} from './payoutStorage';
import { 
  getStoredPublishedProperties, 
  updatePropertyVerification, 
  subscribeToProperties 
} from './propertyStorage';
import { Property } from './types';
import { 
  getAuditLogs, 
  addAuditLog, 
  subscribeToAuditLogs, 
  AuditLogEntry 
} from './adminAuditStorage';
import { haptics } from './haptics';

export type AdminTab = 'OVERVIEW' | 'APPROVALS' | 'LIVE_SERVICES' | 'FINANCES' | 'LOCATORS' | 'AUDIT_LOGS';

interface Props {
  onBackToApp?: () => void;
}

export const AdminWebDashboard: React.FC<Props> = ({ onBackToApp }) => {
  // Navigation & State
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data Sources
  const [applications, setApplications] = useState<Record<ProviderRoleKey, ProviderApplication[]>>(() => getStoredApplications());
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>(() => getAllMaintenanceTickets());
  const [pickDropRequests, setPickDropRequests] = useState<PickDropRequest[]>(() => getAllPickDropHistory());
  const [deposits, setDeposits] = useState<ManualDepositRequest[]>(() => getDepositRequests());
  const [withdrawals, setWithdrawals] = useState<PayoutRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => getAuditLogs());
  const [properties, setProperties] = useState<Property[]>(() => getStoredPublishedProperties());

  // Sub-Filters
  const [approvalRoleFilter, setApprovalRoleFilter] = useState<'ALL' | ProviderRoleKey>('ALL');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  
  const [serviceStatusFilter, setServiceStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<'ALL' | 'Maintenance' | 'Housekeeping' | 'Security' | 'PickDrop'>('ALL');

  const [financeSubTab, setFinanceSubTab] = useState<'DEPOSITS' | 'WITHDRAWALS' | 'ADJUSTMENT'>('DEPOSITS');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'ALL' | 'Approvals' | 'Deposits' | 'Withdrawals' | 'Services'>('ALL');

  // Locator Network & Earnings Filters
  const [locatorTimeframe, setLocatorTimeframe] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('MONTH');
  const [selectedLocatorPhone, setSelectedLocatorPhone] = useState<string>('ALL');
  const [locatorStatusFilter, setLocatorStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Modals
  const [selectedApp, setSelectedApp] = useState<ProviderApplication | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [selectedPickDrop, setSelectedPickDrop] = useState<PickDropRequest | null>(null);
  const [depositModalItem, setDepositModalItem] = useState<ManualDepositRequest | null>(null);
  const [withdrawalModalItem, setWithdrawalModalItem] = useState<PayoutRequest | null>(null);
  const [selectedLocatorProp, setSelectedLocatorProp] = useState<Property | null>(null);
  
  // Action Forms
  const [adminPayoutTrxRef, setAdminPayoutTrxRef] = useState('');
  const [adminPayoutNotes, setAdminPayoutNotes] = useState('');
  const [adminRejectReason, setAdminRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null); // holds ID of item being rejected

  // Direct Wallet Adjustment Form
  const [adjPhone, setAdjPhone] = useState('');
  const [adjAmount, setAdjAmount] = useState('');
  const [adjType, setAdjType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjReason, setAdjReason] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    try { haptics.selection(); } catch (_) {}
    setTimeout(() => setToast(null), 3500);
  };

  // Load live data & bind real-time event listeners
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      setApplications(getStoredApplications());
      setMaintenanceTickets(getAllMaintenanceTickets());
      setPickDropRequests(getAllPickDropHistory());
      setDeposits(getDepositRequests());
      setAuditLogs(getAuditLogs());
      setProperties(getStoredPublishedProperties());
      const payouts = await getPayoutRequests();
      setWithdrawals(payouts);
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAllData();

    const unsubApps = subscribeToApplications(setApplications);
    const unsubDeposits = subscribeToDeposits(setDeposits);
    const unsubAudit = subscribeToAuditLogs(setAuditLogs);
    const unsubProps = subscribeToProperties(() => setProperties(getStoredPublishedProperties()));

    const handleServiceUpdate = () => {
      setMaintenanceTickets(getAllMaintenanceTickets());
      setPickDropRequests(getAllPickDropHistory());
    };

    window.addEventListener('duyar_tickets_updated', handleServiceUpdate);
    window.addEventListener('duyar_pickdrop_updated', handleServiceUpdate);
    window.addEventListener('duyar_transactions_updated', refreshAllData);

    return () => {
      unsubApps();
      unsubDeposits();
      unsubAudit();
      unsubProps();
      window.removeEventListener('duyar_tickets_updated', handleServiceUpdate);
      window.removeEventListener('duyar_pickdrop_updated', handleServiceUpdate);
      window.removeEventListener('duyar_transactions_updated', refreshAllData);
    };
  }, []);

  // Compute Central KPIs
  const allAppsList = useMemo(() => {
    const list: ProviderApplication[] = [];
    Object.keys(applications).forEach((k) => {
      const arr = applications[k as ProviderRoleKey] || [];
      list.push(...arr);
    });
    return list;
  }, [applications]);

  const pendingAppsCount = useMemo(() => {
    return allAppsList.filter(a => a.status === 'PENDING').length;
  }, [allAppsList]);

  const pendingDepositsCount = useMemo(() => {
    return deposits.filter(d => d.status === 'PENDING').length;
  }, [deposits]);

  const pendingWithdrawalsCount = useMemo(() => {
    return withdrawals.filter(w => w.status === 'PENDING').length;
  }, [withdrawals]);

  const liveOrdersCount = useMemo(() => {
    const maintActive = maintenanceTickets.filter(t => t.status === 'ACTIVE' || t.status === 'IN_PROGRESS' || t.status === 'PENDING').length;
    const pdActive = pickDropRequests.filter(p => p.status === 'PENDING' || p.status === 'ACTIVE' || p.status === 'IN_PROGRESS' || p.status === 'CONFIRMED').length;
    return maintActive + pdActive;
  }, [maintenanceTickets, pickDropRequests]);

  const totalDepositedVolume = useMemo(() => {
    return deposits
      .filter(d => d.status === 'APPROVED')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [deposits]);

  // Handle Switch to Resident App
  const handleExitAdmin = () => {
    try {
      localStorage.removeItem('duyar_admin_portal_active');
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.pathname + url.search);
    } catch (_) {}

    if (onBackToApp) {
      onBackToApp();
    } else {
      window.location.reload();
    }
  };

  // Handlers for Provider Approvals
  const handleApproveApp = async (app: ProviderApplication) => {
    const ok = approveProviderApplication(app.id);
    if (ok) {
      addAuditLog({
        action: 'APPROVE_PROVIDER',
        category: 'Approvals',
        title: `Approved ${app.role} (${app.name})`,
        details: `Application ID: ${app.id}. Phone: ${app.applicantPhone}. Verified documents and enabled live service dispatch.`,
        targetId: app.id,
        targetName: app.name,
        status: 'SUCCESS'
      });
      showToast(`Approved ${app.name} (${app.role})`, 'success');
      setSelectedApp(null);
      refreshAllData();
    } else {
      showToast('Could not approve application', 'error');
    }
  };

  const handleRejectApp = async (appId: string, reason: string) => {
    const ok = rejectProviderApplication(appId, reason);
    if (ok) {
      addAuditLog({
        action: 'REJECT_PROVIDER',
        category: 'Approvals',
        title: `Rejected Provider Application ${appId}`,
        details: `Application rejected by Admin. Reason: ${reason || 'Incomplete credentials or document mismatch'}.`,
        targetId: appId,
        status: 'REJECTED'
      });
      showToast('Application rejected', 'info');
      setSelectedApp(null);
      setShowRejectDialog(null);
      setAdminRejectReason('');
      refreshAllData();
    }
  };

  // Handlers for Manual Deposits
  const handleApproveDeposit = async (dep: ManualDepositRequest) => {
    const ok = await approveManualDeposit(dep.id, 'Verified via Bank & MFS Gateway Desk');
    if (ok) {
      showToast(`Deposit of ৳ ${dep.amount.toLocaleString()} approved & credited!`, 'success');
      setDepositModalItem(null);
      refreshAllData();
    } else {
      showToast('Deposit approval failed', 'error');
    }
  };

  const handleRejectDeposit = async (depId: string, reason: string) => {
    const ok = await rejectManualDeposit(depId, reason || 'Transaction ID not verified on gateway');
    if (ok) {
      showToast('Deposit rejected', 'info');
      setDepositModalItem(null);
      setShowRejectDialog(null);
      setAdminRejectReason('');
      refreshAllData();
    }
  };

  // Handlers for Manual Withdrawals
  const handleCompletePayout = async (payout: PayoutRequest) => {
    const ref = adminPayoutTrxRef.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const notes = adminPayoutNotes.trim() || 'Dispatched from Duyar Corporate Master Account';
    const ok = await completeWithdrawalPayout(payout.id, ref, notes);
    if (ok) {
      showToast(`Payout of ৳ ${payout.amount.toLocaleString()} marked PROCESSED!`, 'success');
      setWithdrawalModalItem(null);
      setAdminPayoutTrxRef('');
      setAdminPayoutNotes('');
      refreshAllData();
    } else {
      showToast('Payout completion failed', 'error');
    }
  };

  const handleRejectPayout = async (payoutId: string, reason: string) => {
    const ok = await rejectWithdrawalPayout(payoutId, reason || 'Invalid recipient details / User requested cancellation');
    if (ok) {
      showToast('Payout request rejected & refunded to user wallet', 'info');
      setWithdrawalModalItem(null);
      setShowRejectDialog(null);
      setAdminRejectReason('');
      refreshAllData();
    }
  };

  // Direct Wallet Adjustment Submit
  const handleDirectAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjPhone.trim()) {
      showToast('Please enter a target phone number', 'error');
      return;
    }
    const num = parseFloat(adjAmount);
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    const note = adjReason.trim() || 'Manual Admin adjustment via Web Portal';
    
    await performAdminWalletAdjustment({
      userPhone: adjPhone.trim(),
      amount: num,
      type: adjType,
      reason: note
    });

    showToast(`Successfully ${adjType === 'CREDIT' ? 'credited' : 'debited'} ৳ ${num.toLocaleString()} to ${adjPhone}`, 'success');
    setAdjAmount('');
    setAdjReason('');
    refreshAllData();
  };

  // Filtered Applications List
  const filteredApps = useMemo(() => {
    return allAppsList.filter(app => {
      if (approvalRoleFilter !== 'ALL' && app.roleKey !== approvalRoleFilter) return false;
      if (approvalStatusFilter !== 'ALL' && app.status !== approvalStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesPhone = app.applicantPhone.toLowerCase().includes(q);
        const matchesRole = app.role.toLowerCase().includes(q);
        const matchesId = app.id.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesRole || matchesId;
      }
      return true;
    });
  }, [allAppsList, approvalRoleFilter, approvalStatusFilter, searchQuery]);

  // Combined Service Requests List
  const combinedServiceRequests = useMemo(() => {
    const results: Array<{
      id: string;
      source: 'MAINTENANCE' | 'PICKDROP';
      category: string;
      title: string;
      customerName: string;
      customerPhone: string;
      providerName?: string;
      price: string;
      status: string;
      date: string;
      address: string;
      raw: MaintenanceTicket | PickDropRequest;
    }> = [];

    maintenanceTickets.forEach(t => {
      let mappedCat = 'Maintenance';
      const c = t.category?.toLowerCase() || '';
      if (c.includes('maid') || c.includes('clean') || c.includes('housekeep')) mappedCat = 'Housekeeping';
      else if (c.includes('security') || c.includes('guard')) mappedCat = 'Security';
      else if (c.includes('elect') || c.includes('plumb') || c.includes('appliance') || c.includes('carpent')) mappedCat = 'Maintenance';

      results.push({
        id: t.id,
        source: 'MAINTENANCE',
        category: mappedCat,
        title: t.title,
        customerName: t.customerName || 'Resident',
        customerPhone: t.customerPhone || '',
        providerName: t.technicianName && !t.technicianName.includes('Awaiting') ? t.technicianName : undefined,
        price: t.price || '৳ 0',
        status: t.status,
        date: t.date || 'Today',
        address: t.address ? `${t.address} (${t.area || ''})` : (t.area || 'Banani, Dhaka'),
        raw: t
      });
    });

    pickDropRequests.forEach(p => {
      results.push({
        id: p.id,
        source: 'PICKDROP',
        category: 'PickDrop',
        title: `${p.vehicle} Logistics Move (${p.items?.join(', ') || 'Household Goods'})`,
        customerName: 'Resident Customer',
        customerPhone: p.userPhone || '',
        providerName: p.driverName && !p.driverName.includes('Awaiting') ? p.driverName : undefined,
        price: `৳ ${p.fare || 0}`,
        status: p.status,
        date: new Date(p.createdAt).toLocaleDateString(),
        address: `${p.pickupArea} ➔ ${p.dropArea}`,
        raw: p
      });
    });

    return results.filter(item => {
      if (serviceCategoryFilter !== 'ALL' && item.category !== serviceCategoryFilter) return false;
      if (serviceStatusFilter !== 'ALL' && item.status !== serviceStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.customerPhone.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.providerName && item.providerName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [maintenanceTickets, pickDropRequests, serviceCategoryFilter, serviceStatusFilter, searchQuery]);

  // Locator Network Analysis & Calculations
  const allLocatorProperties = useMemo(() => {
    return properties.filter(p => {
      const isRoleLocator = p.metadata?.posterRole === 'LOCATOR';
      const isIdLocator = p.id.startsWith('prop-loc-');
      const hasLocStatus = !!p.metadata?.locatorStatus && p.metadata?.locatorStatus !== 'NONE';
      const hasBounty = p.metadata?.locatorBountyBDT !== undefined && p.metadata?.locatorBountyBDT > 0;
      return isRoleLocator || isIdLocator || hasLocStatus || hasBounty;
    });
  }, [properties]);

  const pendingLocatorPropertiesCount = useMemo(() => {
    return allLocatorProperties.filter(p => 
      p.metadata?.locatorStatus === 'PENDING_VERIFICATION' || 
      (!p.isVerified && p.metadata?.locatorStatus !== 'REJECTED')
    ).length;
  }, [allLocatorProperties]);

  const verifiedLocatorPropertiesCount = useMemo(() => {
    return allLocatorProperties.filter(p => p.isVerified && p.metadata?.locatorStatus !== 'REJECTED').length;
  }, [allLocatorProperties]);

  // Group by Locator User to calculate posts and monthly earnings at ৳ 5 / post
  const locatorUsersSummary = useMemo(() => {
    const map = new Map<string, {
      name: string;
      phone: string;
      totalPosts: number;
      todayPosts: number;
      weekPosts: number;
      monthPosts: number;
      monthlyEarningsBDT: number; // monthPosts * 5 BDT
      verifiedCount: number;
      pendingCount: number;
      rejectedCount: number;
      properties: Property[];
    }>();

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    allLocatorProperties.forEach(p => {
      const phone = p.metadata?.locatorPhone || p.metadata?.ownerPhone || '+8801777889900';
      const name = p.metadata?.locatorName || 'Area Locator';
      
      let entry = map.get(phone);
      if (!entry) {
        entry = {
          name,
          phone,
          totalPosts: 0,
          todayPosts: 0,
          weekPosts: 0,
          monthPosts: 0,
          monthlyEarningsBDT: 0,
          verifiedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          properties: []
        };
        map.set(phone, entry);
      }

      entry.totalPosts += 1;
      entry.properties.push(p);

      const pTime = p.metadata?.createdAt ? new Date(p.metadata.createdAt).getTime() : now;
      const diff = now - pTime;

      if (diff <= oneDayMs) entry.todayPosts += 1;
      if (diff <= sevenDaysMs) entry.weekPosts += 1;
      if (diff <= thirtyDaysMs) entry.monthPosts += 1;

      if (p.isVerified) {
        entry.verifiedCount += 1;
      } else if (p.metadata?.locatorStatus === 'REJECTED') {
        entry.rejectedCount += 1;
      } else {
        entry.pendingCount += 1;
      }
    });

    return Array.from(map.values()).map(loc => {
      // Ensure effective month count accounts for current month's submissions
      const effectiveMonthPosts = Math.max(loc.monthPosts, loc.todayPosts, loc.weekPosts, loc.totalPosts > 0 ? 1 : 0);
      return {
        ...loc,
        monthPosts: effectiveMonthPosts,
        monthlyEarningsBDT: effectiveMonthPosts * 5 // ৳ 5 BDT per location posting
      };
    });
  }, [allLocatorProperties]);

  // Filtered Locator Properties according to Timeframe, User, Status, and Search Query
  const filteredLocatorProperties = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    return allLocatorProperties.filter(p => {
      const pTime = p.metadata?.createdAt ? new Date(p.metadata.createdAt).getTime() : now;
      const diff = now - pTime;

      if (locatorTimeframe === 'TODAY' && diff > oneDayMs) return false;
      if (locatorTimeframe === 'WEEK' && diff > sevenDaysMs) return false;
      if (locatorTimeframe === 'MONTH' && diff > thirtyDaysMs) return false;

      const pPhone = p.metadata?.locatorPhone || p.metadata?.ownerPhone || '';
      if (selectedLocatorPhone !== 'ALL' && pPhone !== selectedLocatorPhone) return false;

      const isPending = !p.isVerified && p.metadata?.locatorStatus !== 'REJECTED';
      const isApproved = p.isVerified;
      const isRejected = p.metadata?.locatorStatus === 'REJECTED';

      if (locatorStatusFilter === 'PENDING' && !isPending) return false;
      if (locatorStatusFilter === 'APPROVED' && !isApproved) return false;
      if (locatorStatusFilter === 'REJECTED' && !isRejected) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesLoc = p.location.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesPhone = pPhone.toLowerCase().includes(q);
        const matchesName = (p.metadata?.locatorName || '').toLowerCase().includes(q);
        return matchesTitle || matchesLoc || matchesId || matchesPhone || matchesName;
      }

      return true;
    });
  }, [allLocatorProperties, locatorTimeframe, selectedLocatorPhone, locatorStatusFilter, searchQuery]);

  const totalMonthlyLocatorEarnings = useMemo(() => {
    return locatorUsersSummary.reduce((acc, loc) => acc + loc.monthlyEarningsBDT, 0);
  }, [locatorUsersSummary]);

  // Handlers for Locator Properties Verification & Bounties
  const handleVerifyLocatorProperty = async (prop: Property) => {
    const ok = updatePropertyVerification(
      prop.id, 
      true, 
      'Admin Verified (৳ 5 Bounty Credited)', 
      'APPROVED'
    );
    if (ok) {
      const locatorPhone = prop.metadata?.locatorPhone || prop.metadata?.ownerPhone || '+8801777889900';
      const locatorName = prop.metadata?.locatorName || 'Area Locator';

      // Credit ৳ 5 bounty to locator's wallet
      await performAdminWalletAdjustment({
        userPhone: locatorPhone,
        amount: 5,
        type: 'CREDIT',
        reason: `Locator Property Bounty (৳ 5) Credited for #${prop.id} - ${prop.title}`
      });

      addAuditLog({
        action: 'APPROVE_LOCATOR_PROPERTY',
        category: 'Approvals',
        title: `Verified Locator Property #${prop.id}`,
        details: `Property "${prop.title}" in ${prop.location} tagged as VERIFIED PROPERTY. Credited ৳ 5.00 BDT bounty to locator ${locatorName} (${locatorPhone}).`,
        targetId: prop.id,
        targetName: prop.title,
        amount: 5,
        status: 'SUCCESS'
      });

      showToast(`Verified "${prop.title}"! Credited ৳ 5 bounty to ${locatorName}.`, 'success');
      setSelectedLocatorProp(null);
      refreshAllData();
    } else {
      showToast('Could not verify property listing', 'error');
    }
  };

  const handleRejectLocatorProperty = async (propId: string, reason: string) => {
    const ok = updatePropertyVerification(
      propId, 
      false, 
      reason || 'Listing rejected by Admin Desk', 
      'REJECTED'
    );
    if (ok) {
      addAuditLog({
        action: 'REJECT_LOCATOR_PROPERTY',
        category: 'Approvals',
        title: `Rejected Locator Property #${propId}`,
        details: `Listing rejected by Administrator. Reason: ${reason || 'Incomplete details or invalid property'}.`,
        targetId: propId,
        status: 'REJECTED'
      });

      showToast(`Listing #${propId} rejected`, 'info');
      setSelectedLocatorProp(null);
      setShowRejectDialog(null);
      setAdminRejectReason('');
      refreshAllData();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070d0c] font-display text-white selection:bg-primary/30 flex flex-col antialiased">
      {/* Toast Feedback */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 backdrop-blur-xl ${
          toast.type === 'success' ? 'bg-primary/20 border-primary text-primary shadow-[0_0_30px_rgba(19,236,218,0.3)]' :
          toast.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]' :
          'bg-blue-500/20 border-blue-500 text-blue-300'
        }`}>
          <span className="material-symbols-outlined text-lg font-black">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'cancel' : 'info'}
          </span>
          <span className="text-xs font-black uppercase tracking-wider">{toast.msg}</span>
        </div>
      )}

      {/* TOP COMMAND BAR */}
      <header className="h-16 border-b border-white/10 bg-[#0a1211]/90 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(19,236,218,0.4)]">
              <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wider uppercase text-white">DUYAR WEB OS</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/20 text-primary border border-primary/30 tracking-widest">
                  ADMIN DESK
                </span>
              </div>
              <p className="text-[10px] text-white/40 font-mono tracking-tight">Autonomous Real Estate & Services Controller</p>
            </div>
          </div>
        </div>

        {/* Global Search & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden md:flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-white/40 text-sm">search</span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search providers, TrxID, phone, orders..."
              className="w-72 h-9 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button 
            type="button"
            onClick={refreshAllData}
            title="Refresh All System Data"
            className="size-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95"
          >
            <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
              refresh
            </span>
          </button>

          {/* Database Live Pulse */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Supabase Sync Live</span>
          </div>

          {/* Exit / Switch to Resident Mobile App */}
          <button
            type="button"
            onClick={handleExitAdmin}
            className="h-9 px-4 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(19,236,218,0.2)]"
          >
            <span className="material-symbols-outlined text-sm font-black">smartphone</span>
            <span>Switch to Resident App</span>
          </button>
        </div>
      </header>

      {/* DASHBOARD BODY (SIDEBAR + MAIN CONTENT) */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-64 border-r border-white/10 bg-[#091110] flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-6">
            <div className="px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Core Operations</span>
            </div>

            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => { setActiveTab('OVERVIEW'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'OVERVIEW' 
                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(19,236,218,0.3)]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">dashboard</span>
                  <span>Overview</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('APPROVALS'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'APPROVALS' 
                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(19,236,218,0.3)]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">how_to_reg</span>
                  <span>Provider Approvals</span>
                </div>
                {pendingAppsCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    activeTab === 'APPROVALS' ? 'bg-black text-primary' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {pendingAppsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('LIVE_SERVICES'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'LIVE_SERVICES' 
                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(19,236,218,0.3)]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">radar</span>
                  <span>Live Services & Dispatch</span>
                </div>
                {liveOrdersCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    activeTab === 'LIVE_SERVICES' ? 'bg-black text-primary' : 'bg-primary/20 text-primary border border-primary/30'
                  }`}>
                    {liveOrdersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('FINANCES'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'FINANCES' 
                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(19,236,218,0.3)]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                  <span>Manual Finances</span>
                </div>
                {(pendingDepositsCount + pendingWithdrawalsCount) > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    activeTab === 'FINANCES' ? 'bg-black text-primary' : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {pendingDepositsCount + pendingWithdrawalsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('LOCATORS'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'LOCATORS' 
                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(19,236,218,0.3)]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">add_location_alt</span>
                  <span>Locators & Earnings</span>
                </div>
                {pendingLocatorPropertiesCount > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    activeTab === 'LOCATORS' ? 'bg-black text-primary' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {pendingLocatorPropertiesCount}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-primary/70">৳5/post</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('AUDIT_LOGS'); setSearchQuery(''); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'AUDIT_LOGS' 
                    ? 'bg-primary text-black shadow-[0_0_20px_rgba(19,236,218,0.3)]' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">history_edu</span>
                  <span>Audit Trail</span>
                </div>
                <span className="text-[10px] text-white/30 font-mono">{auditLogs.length}</span>
              </button>
            </nav>
          </div>

          {/* Admin Identity Card in Sidebar */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center text-xs border border-primary/30">
                ZA
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate">Zahid Anwar</p>
                <p className="text-[9px] text-primary uppercase font-bold tracking-wider">Super Administrator</p>
              </div>
            </div>
            <div className="text-[9px] text-white/40 pt-1 border-t border-white/5 flex items-center justify-between font-mono">
              <span>Gate: SSL / RBAC Level 5</span>
              <span>v2.4.0</span>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gradient-to-b from-[#070d0c] to-[#040807]">
          {/* TAB 1: OVERVIEW CONTROL DESK */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Welcome Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-emerald-500/5 to-transparent border border-primary/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="relative z-10 space-y-1.5">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em]">
                    <span className="size-2 rounded-full bg-primary animate-ping"></span>
                    <span>System Control Center</span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight text-white">
                    Administrator Command Deck
                  </h1>
                  <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
                    Live administrative oversight of provider verification approvals, real-time dispatch monitoring across Dhaka, and manual wallet deposit / withdrawal settlements.
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('APPROVALS')}
                    className="px-4 py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(19,236,218,0.3)]"
                  >
                    <span className="material-symbols-outlined text-sm font-black">how_to_reg</span>
                    <span>Review Approvals ({pendingAppsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('FINANCES'); setFinanceSubTab('DEPOSITS'); }}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider border border-white/10 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    <span>Clear Deposits ({pendingDepositsCount})</span>
                  </button>
                </div>
              </div>

              {/* KPI STAT CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Card 1: Provider Approvals */}
                <div 
                  onClick={() => setActiveTab('APPROVALS')}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Provider Approvals</span>
                    <div className="size-8 rounded-lg bg-amber-400/10 text-amber-300 flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">badge</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{pendingAppsCount}</span>
                    <span className="text-[10px] text-amber-300 font-bold uppercase">Pending Review</span>
                  </div>
                  <p className="text-[10px] text-white/40">Total verified providers: {allAppsList.filter(a => a.status === 'APPROVED').length}</p>
                </div>

                {/* Card 2: Live Active Services */}
                <div 
                  onClick={() => setActiveTab('LIVE_SERVICES')}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Active Services</span>
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">radar</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-primary">{liveOrdersCount}</span>
                    <span className="text-[10px] text-primary/80 font-bold uppercase">In Field / Pending</span>
                  </div>
                  <p className="text-[10px] text-white/40">Guards, Maids, Technicians & Moving</p>
                </div>

                {/* Card 3: Locator Network & Earnings */}
                <div 
                  onClick={() => setActiveTab('LOCATORS')}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Locator Network</span>
                    <div className="size-8 rounded-lg bg-teal-400/10 text-teal-300 flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">add_location_alt</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-teal-300">৳ {totalMonthlyLocatorEarnings.toLocaleString()}</span>
                    <span className="text-[9px] text-teal-400 font-bold uppercase">Month Bounties</span>
                  </div>
                  <p className="text-[10px] text-white/40">{pendingLocatorPropertiesCount} pending review • ৳ 5/post bounty</p>
                </div>

                {/* Card 4: Pending Manual Deposits */}
                <div 
                  onClick={() => { setActiveTab('FINANCES'); setFinanceSubTab('DEPOSITS'); }}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Manual Deposits</span>
                    <div className="size-8 rounded-lg bg-emerald-400/10 text-emerald-300 flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">add_card</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-400">{pendingDepositsCount}</span>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase">Awaiting Action</span>
                  </div>
                  <p className="text-[10px] text-white/40">bKash, Nagad, Rocket & Upay TrxIDs</p>
                </div>

                {/* Card 5: Pending Withdrawals */}
                <div 
                  onClick={() => { setActiveTab('FINANCES'); setFinanceSubTab('WITHDRAWALS'); }}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-primary/40 transition-all cursor-pointer group space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Withdrawals Queue</span>
                    <div className="size-8 rounded-lg bg-purple-400/10 text-purple-300 flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">outbox</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-purple-300">{pendingWithdrawalsCount}</span>
                    <span className="text-[10px] text-purple-300 font-bold uppercase">Pending Payout</span>
                  </div>
                  <p className="text-[10px] text-white/40">Deposit volume: ৳ {totalDepositedVolume.toLocaleString()}</p>
                </div>
              </div>

              {/* TWO COLUMN SUMMARY: Recent Approvals & Recent Audit Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Urgent Provider Applications Awaiting Action */}
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-white">Pending Provider Applications</h3>
                      <p className="text-[10px] text-white/40">Applications requiring NID & credentials verification</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('APPROVALS')}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      View All →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {allAppsList.filter(a => a.status === 'PENDING').slice(0, 4).map(app => (
                      <div key={app.id} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={app.img} alt={app.name} className="size-10 rounded-xl object-cover border border-white/10 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white truncate">{app.name}</p>
                            <p className="text-[10px] text-primary font-semibold truncate">{app.role}</p>
                            <p className="text-[9px] text-white/40">{app.applicantPhone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[10px] font-bold"
                          >
                            Inspect
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveApp(app)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-black text-[10px] font-black uppercase hover:brightness-110 active:scale-95 transition-all"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}

                    {allAppsList.filter(a => a.status === 'PENDING').length === 0 && (
                      <div className="py-8 text-center text-white/40 text-xs">
                        ✓ All provider applications are reviewed and up to date!
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Live Audit Trail Feed */}
                <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-white">Recent System Audit Log</h3>
                      <p className="text-[10px] text-white/40">Tamper-evident record of administrator actions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('AUDIT_LOGS')}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Audit Explorer →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {auditLogs.slice(0, 4).map(log => (
                      <div key={log.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3">
                        <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-black ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          <span className="material-symbols-outlined text-sm">
                            {log.category === 'Approvals' ? 'how_to_reg' : log.category === 'Deposits' ? 'add_card' : log.category === 'Withdrawals' ? 'outbox' : 'terminal'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-white truncate">{log.title}</p>
                            <span className="text-[9px] text-white/30 font-mono shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/60 line-clamp-2 mt-0.5">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROVIDER APPROVALS CENTER */}
          {activeTab === 'APPROVALS' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header & Role Filter Tabs */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                    <span>Provider Approvals Desk</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 not-italic font-black">
                      {filteredApps.length} Shown
                    </span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">Review NID, trade licenses, property deeds, and certification credentials.</p>
                </div>

                {/* Status Toggle (Pending vs Approved vs All) */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start md:self-auto">
                  {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setApprovalStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        approvalStatusFilter === st 
                          ? 'bg-primary text-black shadow-sm' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Filter Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['ALL', 'Landlords', 'Maids', 'Security', 'Maintenance', 'PickDrop', 'Locators', 'Ads'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setApprovalRoleFilter(role)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border shrink-0 transition-all ${
                      approvalRoleFilter === role 
                        ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]' 
                        : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {role === 'PickDrop' ? 'Pick & Drop Drivers' : role}
                  </button>
                ))}
              </div>

              {/* Applications Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredApps.map(app => (
                  <div key={app.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={app.img} alt={app.name} className="size-12 rounded-xl object-cover border border-white/10" />
                          <div>
                            <h4 className="text-sm font-black text-white">{app.name}</h4>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wide block">{app.role}</span>
                            <span className="text-[10px] text-white/40 font-mono">{app.applicantPhone}</span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                          app.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          app.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          'bg-amber-400/10 text-amber-300 border-amber-400/30'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      {/* Submitted Documents Badges */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] text-white/40 uppercase font-black tracking-wider block">Submitted Documents:</span>
                        <div className="flex flex-wrap gap-1">
                          {app.docs.map((doc, i) => (
                            <span key={i} className="text-[9px] bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10">
                              📄 {doc}
                            </span>
                          ))}
                        </div>
                      </div>

                      {app.propertyName && (
                        <p className="text-[10px] text-white/60 bg-white/5 p-2 rounded-lg">
                          🏢 <span className="text-white font-bold">{app.propertyName}</span> ({app.propertyAddress || 'Dhaka'})
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Inspect Dossier
                      </button>

                      {app.status !== 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleApproveApp(app)}
                          className="px-4 py-2.5 rounded-xl bg-primary text-black text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(19,236,218,0.25)]"
                        >
                          Approve
                        </button>
                      )}

                      {app.status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowRejectDialog(app.id);
                            setAdminRejectReason('');
                          }}
                          className="px-3 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-black uppercase active:scale-95 transition-all"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredApps.length === 0 && (
                  <div className="col-span-full py-16 text-center text-white/40 text-sm">
                    No applications found matching the selected filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE SERVICE REQUESTS & DISPATCH MONITOR */}
          {activeTab === 'LIVE_SERVICES' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                    <span>Live Service Dispatch Controller</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 not-italic font-black">
                      {combinedServiceRequests.length} Active
                    </span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">Live tracking of Maintenance, Security, Housekeeping, and Logistics orders.</p>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto no-scrollbar">
                  {(['ALL', 'PENDING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setServiceStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        serviceStatusFilter === st 
                          ? 'bg-primary text-black shadow-sm' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Category Tabs */}
              <div className="flex gap-2">
                {[
                  { id: 'ALL', label: 'All Services' },
                  { id: 'Maintenance', label: 'Electrical & Plumbing' },
                  { id: 'Housekeeping', label: 'Maid Chores' },
                  { id: 'Security', label: 'Guards & CCTV' },
                  { id: 'PickDrop', label: 'Pick & Drop Moves' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setServiceCategoryFilter(cat.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                      serviceCategoryFilter === cat.id 
                        ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(19,236,218,0.2)]' 
                        : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Services Table */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-white/40 uppercase font-black text-[9px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Order / Ticket</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Assigned Provider</th>
                        <th className="py-3 px-4">Agreed Budget</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Admin Override</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {combinedServiceRequests.map(order => (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">
                            <span className="font-mono text-primary text-[10px] block">#{order.id}</span>
                            <span className="truncate max-w-[200px] block">{order.title}</span>
                          </td>
                          <td className="py-3.5 px-4 text-white/70">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-semibold">
                              {order.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">{order.customerName}</p>
                            <p className="text-[10px] text-white/40 font-mono">{order.customerPhone}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            {order.providerName ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                <span>{order.providerName}</span>
                              </span>
                            ) : (
                              <span className="text-amber-300 font-medium italic flex items-center gap-1 text-[11px]">
                                <span className="size-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                <span>Broadcasting to providers</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-400">
                            {order.price}
                          </td>
                          <td className="py-3.5 px-4 text-white/60 max-w-[180px] truncate" title={order.address}>
                            📍 {order.address}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              order.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                              order.status === 'IN_PROGRESS' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                              order.status === 'ACTIVE' ? 'bg-primary/15 text-primary border-primary/30' :
                              order.status === 'PENDING' ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' :
                              'bg-red-500/15 text-red-400 border-red-500/30'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                            {order.status !== 'PENDING' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (order.source === 'MAINTENANCE') {
                                    releaseMaintenanceTicketToPending(order.id, 'Admin manual reset to broadcast');
                                  } else {
                                    releasePickDropRequestToPending(order.id, 'Admin manual reset to broadcast');
                                  }
                                  showToast(`Released order #${order.id} back to PENDING broadcast`, 'info');
                                  refreshAllData();
                                }}
                                title="Reset to PENDING queue for other providers"
                                className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-[10px] font-bold"
                              >
                                Re-broadcast
                              </button>
                            )}

                            {order.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (order.source === 'MAINTENANCE') {
                                    updateTicketStatus(order.id, 'COMPLETED');
                                  } else {
                                    updatePickDropStatus(order.id, 'COMPLETED');
                                  }
                                  showToast(`Marked #${order.id} as COMPLETED`, 'success');
                                  refreshAllData();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-400/15 hover:bg-emerald-400/25 border border-emerald-400/30 text-emerald-400 text-[10px] font-black uppercase"
                              >
                                Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}

                      {combinedServiceRequests.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-white/40">
                            No service orders match the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FINANCIAL MANAGEMENT (MANUAL DEPOSITS & WITHDRAWALS) */}
          {activeTab === 'FINANCES' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                    <span>Financial Management Desk</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 not-italic font-black">
                      Live Balance Sync
                    </span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">Manual deposit verification, withdrawal clearance, and direct balance adjustments.</p>
                </div>

                {/* Sub Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('DEPOSITS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      financeSubTab === 'DEPOSITS' ? 'bg-primary text-black shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <span>Manual Deposits</span>
                    {pendingDepositsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black text-primary font-black">
                        {pendingDepositsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('WITHDRAWALS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      financeSubTab === 'WITHDRAWALS' ? 'bg-primary text-black shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <span>Manual Withdrawals</span>
                    {pendingWithdrawalsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black text-primary font-black">
                        {pendingWithdrawalsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinanceSubTab('ADJUSTMENT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      financeSubTab === 'ADJUSTMENT' ? 'bg-primary text-black shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <span>Direct Adjustment</span>
                  </button>
                </div>
              </div>

              {/* SUB TAB 1: MANUAL DEPOSITS (RECHARGES) */}
              {financeSubTab === 'DEPOSITS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">info</span>
                      Approving a deposit instantly updates the resident's wallet balance in Supabase and logs an audit record.
                    </span>
                    <span className="text-white/50 font-mono">bKash / Nagad / Rocket / Upay</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {deposits.map(dep => (
                      <div key={dep.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-primary block">#{dep.id}</span>
                              <span className="text-2xl font-black text-emerald-400">৳ {dep.amount.toLocaleString()}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              dep.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              dep.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                              'bg-amber-400/10 text-amber-300 border-amber-400/30'
                            }`}>
                              {dep.status}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-white/5 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/40">Gateway:</span>
                              <span className="font-bold text-white">{dep.method}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">TrxID:</span>
                              <span className="font-mono font-black text-primary select-all">{dep.trxId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Sender Number:</span>
                              <span className="font-mono text-white/90">{dep.senderNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Submitted:</span>
                              <span className="text-white/60">{new Date(dep.createdAt).toLocaleString()}</span>
                            </div>
                          </div>

                          {dep.adminNotes && (
                            <p className="text-[10px] text-white/50 italic px-1">
                              Note: "{dep.adminNotes}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {dep.status === 'PENDING' ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => handleApproveDeposit(dep)}
                              className="flex-1 py-2.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(19,236,218,0.3)] flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                              <span>Approve & Credit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRejectDialog(dep.id);
                                setAdminRejectReason('');
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-black uppercase active:scale-95 transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-white/40 pt-2 border-t border-white/5 text-center font-mono">
                            {dep.status === 'APPROVED' ? `Approved • Balance credited to user` : `Rejected by Admin`}
                          </div>
                        )}
                      </div>
                    ))}

                    {deposits.length === 0 && (
                      <div className="col-span-full py-16 text-center text-white/40 text-sm">
                        No manual deposits recorded in the system.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 2: MANUAL WITHDRAWALS (PAYOUTS) */}
              {financeSubTab === 'WITHDRAWALS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
                    <span className="text-purple-300 font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">info</span>
                      When paying out funds to resident/provider bank accounts, record your bank transaction reference ID to mark complete.
                    </span>
                    <span className="text-white/50 font-mono">MFS & BEFTN / NPSB</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {withdrawals.map(req => (
                      <div key={req.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-purple-300 block">#{req.id}</span>
                              <span className="text-2xl font-black text-white">৳ {req.amount.toLocaleString()}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              req.status === 'PROCESSED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              req.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                              'bg-amber-400/10 text-amber-300 border-amber-400/30'
                            }`}>
                              {req.status}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-white/5 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-white/40">Recipient:</span>
                              <span className="font-bold text-white">{req.user_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Method:</span>
                              <span className="font-bold text-white">{req.method}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">A/C Number:</span>
                              <span className="font-mono text-primary font-bold">{req.accountNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/40">Phone:</span>
                              <span className="font-mono text-white/70">{req.user_phone}</span>
                            </div>
                            {req.adminTrxId && (
                              <div className="flex justify-between border-t border-white/5 pt-1">
                                <span className="text-emerald-400">Admin Trx Ref:</span>
                                <span className="font-mono text-emerald-300 font-bold">{req.adminTrxId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => {
                                setWithdrawalModalItem(req);
                                setAdminPayoutTrxRef('');
                                setAdminPayoutNotes('');
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm font-black">send</span>
                              <span>Process Payout</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowRejectDialog(req.id);
                                setAdminRejectReason('');
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-black uppercase active:scale-95 transition-all"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-white/40 pt-2 border-t border-white/5 text-center font-mono">
                            {req.status === 'PROCESSED' ? `Processed on ${req.processed_at ? new Date(req.processed_at).toLocaleDateString() : 'Done'}` : 'Rejected'}
                          </div>
                        )}
                      </div>
                    ))}

                    {withdrawals.length === 0 && (
                      <div className="col-span-full py-16 text-center text-white/40 text-sm">
                        No withdrawal payout requests in queue.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUB TAB 3: DIRECT WALLET ADJUSTMENT */}
              {financeSubTab === 'ADJUSTMENT' && (
                <div className="max-w-xl mx-auto p-6 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
                  <div>
                    <h3 className="text-lg font-black uppercase text-white">Direct Resident Balance Adjustment</h3>
                    <p className="text-xs text-white/50 mt-0.5">Directly credit or debit a user's wallet with mandatory audit trail explanation.</p>
                  </div>

                  <form onSubmit={handleDirectAdjustment} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="text-white/60 font-bold uppercase tracking-wider text-[10px]">User Phone Number</label>
                      <input 
                        type="text"
                        value={adjPhone}
                        onChange={(e) => setAdjPhone(e.target.value)}
                        placeholder="e.g. +8801977347402 or 017XXXXXXXX"
                        className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-primary outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-white/60 font-bold uppercase tracking-wider text-[10px]">Adjustment Type</label>
                        <select
                          value={adjType}
                          onChange={(e) => setAdjType(e.target.value as any)}
                          className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary outline-none"
                        >
                          <option value="CREDIT" className="bg-[#091110]">CREDIT (+ Add Funds)</option>
                          <option value="DEBIT" className="bg-[#091110]">DEBIT (- Deduct Funds)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-white/60 font-bold uppercase tracking-wider text-[10px]">Amount (৳ BDT)</label>
                        <input 
                          type="number"
                          value={adjAmount}
                          onChange={(e) => setAdjAmount(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-black text-sm focus:border-primary outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-white/60 font-bold uppercase tracking-wider text-[10px]">Administrative Reason (Audit Trail)</label>
                      <textarea
                        rows={3}
                        value={adjReason}
                        onChange={(e) => setAdjReason(e.target.value)}
                        placeholder="e.g. Customer compensation for delayed electrical visit ticket #889"
                        className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary outline-none resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(19,236,218,0.4)] flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm font-black">sync_alt</span>
                      <span>Apply Wallet Balance Adjustment</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT TRAIL EXPLORER */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                    <span>Audit Trail & Activity Log</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20 not-italic font-mono">
                      {auditLogs.length} Events
                    </span>
                  </h2>
                  <p className="text-xs text-white/50 mt-1">Immutable audit ledger tracking every single approval, payout, deposit, and status override.</p>
                </div>

                {/* Category Filters */}
                <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto no-scrollbar">
                  {(['ALL', 'Approvals', 'Deposits', 'Withdrawals', 'Services'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAuditCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        auditCategoryFilter === cat ? 'bg-primary text-black shadow-sm' : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Table */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-white/40 uppercase font-black text-[9px] tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Operator</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Title & Details</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {auditLogs
                        .filter(l => auditCategoryFilter === 'ALL' || l.category === auditCategoryFilter)
                        .filter(l => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            l.title.toLowerCase().includes(q) ||
                            l.details.toLowerCase().includes(q) ||
                            l.operator.toLowerCase().includes(q) ||
                            l.id.toLowerCase().includes(q)
                          );
                        })
                        .map(log => (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 text-white/50 text-[10px] whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-white font-bold whitespace-nowrap">
                              <span className="block">{log.operator}</span>
                              <span className="text-[9px] text-white/40 font-normal">{log.operatorRole}</span>
                            </td>
                            <td className="py-3 px-4 text-primary font-bold">
                              {log.action}
                            </td>
                            <td className="py-3 px-4 text-white/70">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                                {log.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-sans min-w-[280px]">
                              <p className="font-bold text-white text-xs">{log.title}</p>
                              <p className="text-[11px] text-white/60 leading-relaxed mt-0.5">{log.details}</p>
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-400">
                              {log.amount ? `৳ ${log.amount.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                log.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                'bg-primary/10 text-primary border-primary/30'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOCATOR NETWORK & EARNINGS TRACKING */}
          {activeTab === 'LOCATORS' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-500/10 via-primary/5 to-transparent border border-teal-500/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                <div className="space-y-1.5 relative z-10">
                  <div className="flex items-center gap-2 text-teal-300 font-black text-[10px] uppercase tracking-[0.2em]">
                    <span className="size-2 rounded-full bg-teal-400 animate-ping"></span>
                    <span>Locator Property Desk & Bounty Settlement</span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight text-white">
                    Locator Network & Earnings Control
                  </h2>
                  <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
                    Review and verify property postings submitted by community Locators. Only Landlord-approved users' posts are auto-verified; Locator-submitted properties require Admin/Moderator verification before earning the <span className="text-primary font-bold">VERIFIED PROPERTY</span> tag and crediting the <span className="text-emerald-400 font-bold">৳ 5.00 BDT</span> per-post bounty.
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-3">
                  <div className="px-4 py-2.5 rounded-2xl bg-black/40 border border-teal-500/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-teal-400 text-xl">monetization_on</span>
                    <div>
                      <span className="text-[9px] text-white/40 uppercase font-black tracking-widest block">Standard Locator Bounty</span>
                      <span className="text-sm font-black text-emerald-400">৳ 5.00 BDT / Location Post</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* LOCATOR KPI SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Total Locator Posts</span>
                    <span className="material-symbols-outlined text-base text-primary">add_location_alt</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{filteredLocatorProperties.length}</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">In Timeframe</span>
                  </div>
                  <p className="text-[10px] text-white/40">Total across system: {allLocatorProperties.length} listings</p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Pending Verification</span>
                    <span className="size-2 rounded-full bg-amber-400 animate-ping"></span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-400">{pendingLocatorPropertiesCount}</span>
                    <span className="text-[10px] text-amber-300 font-bold uppercase">Requires Action</span>
                  </div>
                  <p className="text-[10px] text-white/40">Awaiting Admin / Moderator audit</p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Verified Properties</span>
                    <span className="material-symbols-outlined text-base text-emerald-400">verified</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-400">{verifiedLocatorPropertiesCount}</span>
                    <span className="text-[10px] text-emerald-300 font-bold uppercase">Live On Map</span>
                  </div>
                  <p className="text-[10px] text-white/40">Tagged as VERIFIED PROPERTY</p>
                </div>

                <div className="p-5 rounded-2xl bg-teal-500/[0.03] border border-teal-500/30 space-y-2 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">Monthly Bounty Payouts</span>
                    <span className="material-symbols-outlined text-base text-teal-400">payments</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-teal-300">৳ {totalMonthlyLocatorEarnings.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Earned This Month</span>
                  </div>
                  <p className="text-[10px] text-white/40">Calculated as: Month Posts × ৳ 5 BDT</p>
                </div>
              </div>

              {/* TIMEFRAME & USER FILTER CONTROLS */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                {/* Timeframe Selectors: Date / Week / Month / All */}
                <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/40 px-2.5">Timeframe:</span>
                  {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as const).map(tf => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setLocatorTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                        locatorTimeframe === tf 
                          ? 'bg-primary text-black shadow-md' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tf === 'TODAY' ? 'Today' : tf === 'WEEK' ? 'This Week' : tf === 'MONTH' ? 'This Month (30D)' : 'All Time'}
                    </button>
                  ))}
                </div>

                {/* Sub-Filters: Locator User & Status Filter */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* User Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Locator User:</span>
                    <select
                      value={selectedLocatorPhone}
                      onChange={(e) => setSelectedLocatorPhone(e.target.value)}
                      className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold outline-none focus:border-primary"
                    >
                      <option value="ALL">All Locators ({locatorUsersSummary.length} Active)</option>
                      {locatorUsersSummary.map(loc => (
                        <option key={loc.phone} value={loc.phone}>
                          {loc.name} ({loc.monthPosts} posts this month • ৳ {loc.monthlyEarningsBDT})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-white/40 tracking-wider">Status:</span>
                    <select
                      value={locatorStatusFilter}
                      onChange={(e) => setLocatorStatusFilter(e.target.value as any)}
                      className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white font-bold outline-none focus:border-primary"
                    >
                      <option value="ALL">All Verification Statuses</option>
                      <option value="PENDING">Pending Verification ({pendingLocatorPropertiesCount})</option>
                      <option value="APPROVED">Verified Properties ({verifiedLocatorPropertiesCount})</option>
                      <option value="REJECTED">Rejected Listings</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION: LOCATOR USER PERFORMANCE & MONTHLY EARNINGS CARDS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-400 text-lg">leaderboard</span>
                    <span>Locators Performance & Monthly Earnings (৳ 5 / Post)</span>
                  </h3>
                  <span className="text-[10px] text-white/40 font-mono">
                    Based on {locatorUsersSummary.length} registered area locator users
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {locatorUsersSummary.map(loc => {
                    const isSelected = selectedLocatorPhone === loc.phone;
                    return (
                      <div 
                        key={loc.phone}
                        className={`p-5 rounded-2xl border transition-all ${
                          isSelected 
                            ? 'bg-teal-500/10 border-teal-400 shadow-[0_0_25px_rgba(20,184,166,0.2)]' 
                            : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-11 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 font-black text-sm flex items-center justify-center shrink-0">
                              {loc.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-white truncate">{loc.name}</h4>
                              <p className="text-[10px] font-mono text-white/50">{loc.phone}</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedLocatorPhone(isSelected ? 'ALL' : loc.phone)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              isSelected 
                                ? 'bg-teal-400 text-black' 
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {isSelected ? 'Filtering' : 'Filter User'}
                          </button>
                        </div>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-3 gap-2 py-3 text-center">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[9px] text-white/40 uppercase font-black block">Today</span>
                            <span className="text-sm font-black text-white">{loc.todayPosts}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[9px] text-white/40 uppercase font-black block">This Week</span>
                            <span className="text-sm font-black text-white">{loc.weekPosts}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-[9px] text-white/40 uppercase font-black block">This Month</span>
                            <span className="text-sm font-black text-primary">{loc.monthPosts}</span>
                          </div>
                        </div>

                        {/* Monthly Earnings Highlight (monthPosts * 5 BDT) */}
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-emerald-400/80 uppercase font-black tracking-wider block">
                              Monthly Earnings (৳ 5 / Post)
                            </span>
                            <span className="text-lg font-black text-emerald-400 leading-tight">
                              ৳ {loc.monthlyEarningsBDT.toLocaleString()} BDT
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-white/40 block">Total Lifetime</span>
                            <span className="text-xs font-bold text-white/80">{loc.totalPosts} listings</span>
                          </div>
                        </div>

                        {/* Verification Status Breakdown */}
                        <div className="pt-2.5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                          <span className="text-emerald-400 font-bold">{loc.verifiedCount} Verified</span>
                          <span className="text-amber-400 font-bold">{loc.pendingCount} Pending</span>
                          <span className="text-red-400 font-bold">{loc.rejectedCount} Rejected</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION: LOCATOR SUBMITTED PROPERTIES AUDIT & VERIFICATION LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">domain_verification</span>
                    <span>Locator Property Submissions ({filteredLocatorProperties.length})</span>
                  </h3>
                  <span className="text-[10px] text-white/40">
                    Showing properties matching current filters
                  </span>
                </div>

                {filteredLocatorProperties.length === 0 ? (
                  <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-3">
                    <span className="material-symbols-outlined text-4xl text-white/20">search_off</span>
                    <p className="text-sm font-bold text-white/60">No locator property postings found matching the filters</p>
                    <button
                      type="button"
                      onClick={() => {
                        setLocatorTimeframe('ALL');
                        setSelectedLocatorPhone('ALL');
                        setLocatorStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-primary text-xs font-black uppercase"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-white/[0.02] border border-white/10 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 border-b border-white/10 text-white/40 uppercase text-[9px] font-black tracking-widest">
                          <tr>
                            <th className="py-3 px-4">Property & Image</th>
                            <th className="py-3 px-4">Location & Specs</th>
                            <th className="py-3 px-4">Submitted By (Locator)</th>
                            <th className="py-3 px-4">Submission Date</th>
                            <th className="py-3 px-4">Verification Status</th>
                            <th className="py-3 px-4">Bounty</th>
                            <th className="py-3 px-4 text-right">Administrative Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredLocatorProperties.map(prop => {
                            const isPending = !prop.isVerified && prop.metadata?.locatorStatus !== 'REJECTED';
                            const isApproved = prop.isVerified;
                            const isRejected = prop.metadata?.locatorStatus === 'REJECTED';
                            const locatorName = prop.metadata?.locatorName || 'Area Locator';
                            const locatorPhone = prop.metadata?.locatorPhone || prop.metadata?.ownerPhone || 'N/A';
                            const submittedDate = prop.metadata?.createdAt ? new Date(prop.metadata.createdAt).toLocaleDateString() : 'Recent';

                            return (
                              <tr key={prop.id} className="hover:bg-white/[0.02] transition-colors">
                                {/* Photo & Title */}
                                <td className="py-3.5 px-4 min-w-[220px]">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={prop.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'} 
                                      alt={prop.title}
                                      className="size-12 rounded-xl object-cover border border-white/10 shrink-0" 
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-black text-white truncate">{prop.title}</p>
                                      <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{prop.price}</p>
                                      <p className="text-[9px] text-white/30 font-mono">ID: {prop.id}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Location & Specs */}
                                <td className="py-3.5 px-4 min-w-[180px]">
                                  <p className="text-white text-xs font-bold leading-tight truncate">📍 {prop.location}</p>
                                  <p className="text-[10px] text-white/50 mt-1">
                                    {prop.beds} Beds • {prop.baths} Baths • {prop.sqft} SQFT
                                  </p>
                                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase bg-white/5 border border-white/10 text-white/60">
                                    {prop.type || prop.tag}
                                  </span>
                                </td>

                                {/* Submitted By Locator */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <p className="text-white font-bold text-xs">{locatorName}</p>
                                  <p className="text-[10px] font-mono text-teal-300 mt-0.5">{locatorPhone}</p>
                                  <span className="text-[9px] text-white/40 uppercase font-black tracking-wider">Certified Locator</span>
                                </td>

                                {/* Submission Date */}
                                <td className="py-3.5 px-4 text-white/60 text-xs font-mono whitespace-nowrap">
                                  {submittedDate}
                                </td>

                                {/* Verification Status Badge */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {isApproved && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                                      <span className="material-symbols-outlined text-xs">verified</span>
                                      <span>VERIFIED PROPERTY</span>
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-400/15 text-amber-300 border border-amber-400/40">
                                      <span className="size-1.5 rounded-full bg-amber-400 animate-ping"></span>
                                      <span>PENDING VERIFICATION</span>
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/40">
                                      <span className="material-symbols-outlined text-xs">cancel</span>
                                      <span>REJECTED</span>
                                    </span>
                                  )}
                                </td>

                                {/* Bounty */}
                                <td className="py-3.5 px-4 font-black text-emerald-400 whitespace-nowrap">
                                  ৳ 5.00 BDT
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedLocatorProp(prop)}
                                      className="size-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center border border-white/10"
                                      title="Inspect Property Dossier"
                                    >
                                      <span className="material-symbols-outlined text-sm">visibility</span>
                                    </button>

                                    {isPending && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleVerifyLocatorProperty(prop)}
                                          className="h-8 px-3 rounded-lg bg-primary hover:brightness-110 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(19,236,218,0.3)] transition-all active:scale-95"
                                        >
                                          <span className="material-symbols-outlined text-xs font-black">verified</span>
                                          <span>Verify & Credit ৳ 5</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setShowRejectDialog(prop.id)}
                                          className="size-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center transition-all active:scale-95"
                                          title="Reject Property Listing"
                                        >
                                          <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                      </>
                                    )}

                                    {isApproved && (
                                      <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Verified
                                      </span>
                                    )}

                                    {isRejected && (
                                      <button
                                        type="button"
                                        onClick={() => handleVerifyLocatorProperty(prop)}
                                        className="h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[9.5px] font-bold uppercase"
                                      >
                                        Re-evaluate
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: INSPECT PROVIDER APPLICATION DOSSIER */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0a1211] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <img src={selectedApp.img} alt={selectedApp.name} className="size-12 rounded-xl object-cover border border-white/10" />
                <div>
                  <h3 className="text-base font-black text-white">{selectedApp.name}</h3>
                  <p className="text-[10px] text-primary uppercase font-bold">{selectedApp.role}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedApp(null)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Phone Number:</span>
                  <span className="font-mono text-white font-bold">{selectedApp.applicantPhone}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Application ID:</span>
                  <span className="font-mono text-primary font-bold">{selectedApp.id}</span>
                </div>
                {selectedApp.nidNumber && (
                  <div className="col-span-2">
                    <span className="text-[9px] text-white/40 uppercase font-bold block">National ID (NID):</span>
                    <span className="font-mono text-white font-bold">{selectedApp.nidNumber}</span>
                  </div>
                )}
                {selectedApp.propertyName && (
                  <div className="col-span-2">
                    <span className="text-[9px] text-white/40 uppercase font-bold block">Associated Property:</span>
                    <span className="text-white font-bold">{selectedApp.propertyName} ({selectedApp.propertyAddress || 'Dhaka'})</span>
                  </div>
                )}
              </div>

              {/* Documents List */}
              <div className="space-y-2">
                <span className="text-[10px] text-white/50 uppercase font-black tracking-wider block">Submitted Documents & Proofs:</span>
                <div className="space-y-1.5">
                  {selectedApp.docs.map((doc, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-white/90">
                        <span className="material-symbols-outlined text-sm text-primary">verified</span>
                        <span>{doc}</span>
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold uppercase">Ready for Audit</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedApp.details && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[9px] text-white/40 uppercase font-bold">Applicant Bio / Agency Details:</span>
                  <p className="text-white/80 leading-relaxed italic">{selectedApp.details}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase"
              >
                Close
              </button>
              {selectedApp.status !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleApproveApp(selectedApp)}
                  className="flex-[1.5] py-3 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(19,236,218,0.4)]"
                >
                  Confirm & Approve Provider
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PROCESS WITHDRAWAL PAYOUT */}
      {withdrawalModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a1211] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white">Process Withdrawal Payout</h3>
                <p className="text-[10px] text-purple-300 font-mono">Request #{withdrawalModalItem.id}</p>
              </div>
              <button 
                type="button"
                onClick={() => setWithdrawalModalItem(null)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Amount to Disburse:</span>
                <span className="text-lg font-black text-emerald-400">৳ {withdrawalModalItem.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Pay To:</span>
                <span className="font-bold text-white">{withdrawalModalItem.user_name} ({withdrawalModalItem.user_phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Payment Gateway:</span>
                <span className="font-bold text-primary">{withdrawalModalItem.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Account Number:</span>
                <span className="font-mono font-bold text-white select-all">{withdrawalModalItem.accountNumber}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="text-white/60 font-bold uppercase text-[10px]">Bank / MFS Reference Transaction ID</label>
                <input 
                  type="text"
                  value={adminPayoutTrxRef}
                  onChange={(e) => setAdminPayoutTrxRef(e.target.value)}
                  placeholder="e.g. BKASH-TX-99824 or BEFTN-00129"
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold uppercase text-[10px]">Internal Note (Optional)</label>
                <input 
                  type="text"
                  value={adminPayoutNotes}
                  onChange={(e) => setAdminPayoutNotes(e.target.value)}
                  placeholder="e.g. Sent via corporate portal"
                  className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setWithdrawalModalItem(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCompletePayout(withdrawalModalItem)}
                className="flex-[1.5] py-3 rounded-xl bg-purple-500 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              >
                Confirm Payout Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT LOCATOR PROPERTY DOSSIER */}
      {selectedLocatorProp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#0a1211] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedLocatorProp.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'} 
                  alt={selectedLocatorProp.title} 
                  className="size-14 rounded-2xl object-cover border border-white/10 shadow-lg"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Locator Submission
                    </span>
                    <span className="text-[9px] font-mono text-white/40">ID: #{selectedLocatorProp.id}</span>
                  </div>
                  <h3 className="text-base font-black text-white truncate mt-1">{selectedLocatorProp.title}</h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedLocatorProp(null)}
                className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Image Preview & Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Rent / Sale Price:</span>
                  <span className="text-sm font-black text-emerald-400">{selectedLocatorProp.price}</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Property Type:</span>
                  <span className="font-bold text-white uppercase">{selectedLocatorProp.type || selectedLocatorProp.tag}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Pinpoint Address & Coordinates:</span>
                  <p className="text-white font-medium mt-0.5">📍 {selectedLocatorProp.location}</p>
                  {selectedLocatorProp.lat && selectedLocatorProp.lng && (
                    <span className="text-[9.5px] font-mono text-teal-300 block mt-0.5">
                      GPS: [{selectedLocatorProp.lat.toFixed(4)}, {selectedLocatorProp.lng.toFixed(4)}]
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Bedrooms / Baths:</span>
                  <span className="text-white font-bold">{selectedLocatorProp.beds} Beds • {selectedLocatorProp.baths} Baths</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 uppercase font-bold block">Area Size:</span>
                  <span className="text-white font-bold">{selectedLocatorProp.sqft} SQFT</span>
                </div>
              </div>

              {/* Locator Contributor Card */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                <span className="text-[9.5px] text-teal-300 uppercase font-black tracking-wider block">
                  Contributing Area Locator:
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-sm">{selectedLocatorProp.metadata?.locatorName || 'Area Locator'}</p>
                    <p className="text-[10px] font-mono text-white/60">{selectedLocatorProp.metadata?.locatorPhone || selectedLocatorProp.metadata?.ownerPhone || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase block">Bounty on Verification</span>
                    <span className="text-sm font-black text-emerald-400">৳ 5.00 BDT</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {selectedLocatorProp.amenities && selectedLocatorProp.amenities.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-white/40 uppercase font-bold block">Included Amenities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLocatorProp.amenities.map(a => (
                      <span key={a} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/80 uppercase font-bold">
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedLocatorProp(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase"
              >
                Close
              </button>
              
              {!selectedLocatorProp.isVerified && selectedLocatorProp.metadata?.locatorStatus !== 'REJECTED' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedLocatorProp.id;
                      setSelectedLocatorProp(null);
                      setShowRejectDialog(id);
                    }}
                    className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black uppercase tracking-wider"
                  >
                    Reject Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyLocatorProperty(selectedLocatorProp)}
                    className="flex-[1.5] py-3 rounded-xl bg-primary text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(19,236,218,0.4)] flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm font-black">verified</span>
                    <span>Verify & Credit ৳ 5</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECTION REASON DIALOG */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0a1211] border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-400 font-black text-sm uppercase">
              <span className="material-symbols-outlined text-base">warning</span>
              <span>Confirm Rejection</span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              Please enter an official administrative reason for rejecting item <span className="font-mono text-white font-bold">#{showRejectDialog}</span>:
            </p>

            <textarea
              rows={3}
              value={adminRejectReason}
              onChange={(e) => setAdminRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID not found in MFS merchant statement / Incomplete documents / Invalid location"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-red-400 outline-none resize-none"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectDialog(null);
                  setAdminRejectReason('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = showRejectDialog;
                  const reason = adminRejectReason.trim() || 'Declined by Administrator';
                  
                  // Check if it belongs to deposits, withdrawals, locator properties, or provider applications
                  if (targetId.startsWith('DEP-')) {
                    handleRejectDeposit(targetId, reason);
                  } else if (targetId.startsWith('PO-')) {
                    handleRejectPayout(targetId, reason);
                  } else if (targetId.startsWith('prop-') || targetId.startsWith('prop')) {
                    handleRejectLocatorProperty(targetId, reason);
                  } else {
                    handleRejectApp(targetId, reason);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWebDashboard;
