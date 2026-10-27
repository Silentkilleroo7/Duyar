import { supabase } from './supabase';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operator: string;
  operatorRole: string;
  action: string;
  category: 'Approvals' | 'Deposits' | 'Withdrawals' | 'Services' | 'System' | 'Moderation';
  title: string;
  details: string;
  targetId?: string;
  targetName?: string;
  status: 'SUCCESS' | 'WARNING' | 'REJECTED' | 'INFO';
  amount?: number;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'duyar_admin_audit_logs_v2';
const EVENT_KEY = 'duyar_audit_logs_updated';

const SEED_LOGS: AuditLogEntry[] = [
  {
    id: 'AUD-9081',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    operator: 'Zahid Anwar (Super Admin)',
    operatorRole: 'Master Administrator',
    action: 'APPROVE_PROVIDER',
    category: 'Approvals',
    title: 'Approved Landlord Verification Application',
    details: 'Verified NID and Title Deed for applicant Zahid Anwar (Gulshan Royal Residence). Properties marked verified.',
    targetId: 'L-MASTER',
    targetName: 'Zahid Anwar',
    status: 'SUCCESS'
  },
  {
    id: 'AUD-9080',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    operator: 'System Gateway / Admin',
    operatorRole: 'Automated Finance Engine',
    action: 'APPROVE_DEPOSIT',
    category: 'Deposits',
    title: 'Manual bKash Recharge Approved',
    details: 'Verified TrxID 9K20DF8X for ৳ 5,000. Credited user wallet (+8801977347402).',
    targetId: 'TX-DEP-4491',
    targetName: 'Resident Wallet Recharge',
    amount: 5000,
    status: 'SUCCESS'
  },
  {
    id: 'AUD-9079',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    operator: 'Finance Officer (HQ)',
    operatorRole: 'Finance Administrator',
    action: 'COMPLETE_WITHDRAWAL',
    category: 'Withdrawals',
    title: 'Bank Payout Processed',
    details: 'Payout PO-7712 of ৳ 12,500 transferred to City Bank A/C 21084931. Reference: CB-TX-88219.',
    targetId: 'PO-7712',
    targetName: 'Md. Kabir Hossain',
    amount: 12500,
    status: 'SUCCESS'
  },
  {
    id: 'AUD-9078',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    operator: 'Zahid Anwar (Super Admin)',
    operatorRole: 'Master Administrator',
    action: 'SERVICE_DISPATCH_MONITOR',
    category: 'Services',
    title: 'Electrical Repair Order Dispatched',
    details: 'Work order for AC & Appliance fix assigned to certified specialist Md. Kabir Hossain in Banani.',
    targetId: 'TK-ELECT-01',
    targetName: 'AC Maintenance Ticket',
    status: 'INFO'
  }
];

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return SEED_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LOGS));
      return SEED_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_LOGS;
  } catch (e) {
    return SEED_LOGS;
  }
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'operator' | 'operatorRole'> & {
  operator?: string;
  operatorRole?: string;
}): AuditLogEntry {
  const current = getAuditLogs();
  const newEntry: AuditLogEntry = {
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    operator: entry.operator || 'Master Administrator (Web Panel)',
    operatorRole: entry.operatorRole || 'Super Admin',
    ...entry
  };

  const updated = [newEntry, ...current].slice(0, 100); // Keep last 100 logs
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: updated }));
    } catch (e) {}
  }

  // Non-blocking sync to Supabase if audit log table exists
  if (supabase) {
    (async () => {
      try {
        await supabase.from('admin_audit_logs').insert([{
          id: newEntry.id,
          operator: newEntry.operator,
          action: newEntry.action,
          category: newEntry.category,
          title: newEntry.title,
          details: newEntry.details,
          target_id: newEntry.targetId,
          status: newEntry.status,
          amount: newEntry.amount,
          created_at: newEntry.timestamp
        }]);
      } catch (err) {}
    })();
  }

  return newEntry;
}

export function subscribeToAuditLogs(callback: (logs: AuditLogEntry[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    callback(e.detail || getAuditLogs());
  };
  window.addEventListener(EVENT_KEY, handler);
  return () => window.removeEventListener(EVENT_KEY, handler);
}
