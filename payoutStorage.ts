import { supabase } from './supabase';

export type PayoutMethod = 'bKash' | 'Nagad' | 'Upay' | 'Rocket';
export type PayoutStatus = 'PENDING' | 'PROCESSED' | 'REJECTED' | 'HOLD';

export interface PayoutRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  method: PayoutMethod;
  accountNumber: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: PayoutStatus;
  userNotes?: string;
  adminTrxId?: string;
  adminNotes?: string;
  created_at: string;
  processed_at?: string;
  user_avatar?: string;
}

const STORAGE_KEY = 'duyar_payout_requests_v1';
const BALANCE_STORAGE_KEY = 'duyar_user_balance_v1';

const INITIAL_REQUESTS: PayoutRequest[] = [];

// Helper to get all payout requests (local + supabase sync)
export const getPayoutRequests = async (): Promise<PayoutRequest[]> => {
  let localRequests: PayoutRequest[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      localRequests = JSON.parse(raw);
    } else {
      localRequests = INITIAL_REQUESTS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localRequests));
    }
  } catch (e) {
    localRequests = INITIAL_REQUESTS;
  }

  // Attempt to sync from Supabase if table exists
  try {
    const { data, error } = await supabase.from('payout_requests').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      const mergedMap = new Map<string, PayoutRequest>();
      localRequests.forEach(r => mergedMap.set(r.id, r));
      data.forEach(dbItem => {
        const mapped: PayoutRequest = {
          id: dbItem.id || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
          user_id: dbItem.user_id || 'user-unknown',
          user_name: dbItem.user_name || 'User',
          user_phone: dbItem.user_phone || dbItem.phone || '01XXXXXXXXX',
          method: (dbItem.method as PayoutMethod) || 'bKash',
          accountNumber: dbItem.account_number || dbItem.number || '01XXXXXXXXX',
          amount: Number(dbItem.amount) || 0,
          fee: 0,
          netAmount: Number(dbItem.amount) || 0,
          status: (dbItem.status as PayoutStatus) || 'PENDING',
          userNotes: dbItem.user_notes || dbItem.description,
          adminTrxId: dbItem.admin_trx_id,
          adminNotes: dbItem.admin_notes,
          created_at: dbItem.created_at || new Date().toISOString()
        };
        mergedMap.set(mapped.id, mapped);
      });
      const result = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      } catch (e) {}
      return result;
    }
  } catch (e) {
    // Supabase unavailable or table empty; fall back to local
  }

  return localRequests.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// Create a new payout request
export const createPayoutRequest = async (
  data: Omit<PayoutRequest, 'id' | 'created_at' | 'status' | 'fee' | 'netAmount'> & { fee?: number }
): Promise<PayoutRequest> => {
  const newId = `PO-${Math.floor(1000 + Math.random() * 9000)}`;
  const fee = data.fee ?? 0;
  const netAmount = data.amount - fee;

  const newRequest: PayoutRequest = {
    ...data,
    id: newId,
    fee,
    netAmount,
    status: 'PENDING',
    created_at: new Date().toISOString()
  };

  // 1. Save to LocalStorage immediately
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: PayoutRequest[] = raw ? JSON.parse(raw) : INITIAL_REQUESTS;
    const updated = [newRequest, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save payout locally:', e);
  }

  // 2. Log in local transactions
  try {
    const txnKey = 'duyar_transactions_v1';
    const rawTxns = localStorage.getItem(txnKey);
    const existingTxns = rawTxns ? JSON.parse(rawTxns) : [];
    existingTxns.unshift({
      id: `TXN-${Date.now()}`,
      type: 'withdraw',
      amount: newRequest.amount,
      method: newRequest.method,
      accountNumber: newRequest.accountNumber,
      status: 'pending',
      description: `Withdrawal to ${newRequest.method} (${newRequest.accountNumber})`,
      created_at: newRequest.created_at
    });
    localStorage.setItem(txnKey, JSON.stringify(existingTxns.slice(0, 30)));
  } catch (e) {}

  // 3. Sync to Supabase in background
  try {
    await supabase.from('payout_requests').insert([{
      id: newRequest.id,
      user_id: newRequest.user_id,
      amount: newRequest.amount,
      method: newRequest.method,
      status: 'PENDING',
      notes: `${newRequest.method} to ${newRequest.accountNumber}`
    }]);

    await supabase.from('transactions').insert([{
      user_id: newRequest.user_id,
      type: 'withdraw',
      amount: newRequest.amount,
      status: 'pending',
      description: `Withdrawal to ${newRequest.method} (${newRequest.accountNumber})`
    }]);
  } catch (e) {
    // Supabase error non-blocking
  }

  return newRequest;
};

// Update status (Admin actions: PROCESSED, REJECTED, HOLD)
export const updatePayoutStatus = async (
  id: string,
  status: PayoutStatus,
  adminDetails?: { adminTrxId?: string; adminNotes?: string }
): Promise<void> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: PayoutRequest[] = raw ? JSON.parse(raw) : INITIAL_REQUESTS;
    list = list.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status,
          adminTrxId: adminDetails?.adminTrxId || item.adminTrxId,
          adminNotes: adminDetails?.adminNotes || item.adminNotes,
          processed_at: status === 'PROCESSED' ? new Date().toISOString() : item.processed_at
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update payout locally:', e);
  }

  // Update in Supabase
  try {
    await supabase
      .from('payout_requests')
      .update({
        status: status === 'PROCESSED' ? 'APPROVED' : status,
        admin_trx_id: adminDetails?.adminTrxId,
        admin_notes: adminDetails?.adminNotes
      })
      .eq('id', id);
  } catch (e) {
    // Non-blocking
  }
};

// User balance helpers for persistent deductions
export const getUserBalance = (userId: string, defaultBalance: number = 0): number => {
  try {
    const raw = localStorage.getItem(BALANCE_STORAGE_KEY);
    if (raw) {
      const balances = JSON.parse(raw);
      if (balances[userId] !== undefined) {
        return Number(balances[userId]);
      }
    }
  } catch (e) {}
  return defaultBalance;
};

export const setUserBalance = (userId: string, newBalance: number): void => {
  try {
    const raw = localStorage.getItem(BALANCE_STORAGE_KEY);
    const balances = raw ? JSON.parse(raw) : {};
    balances[userId] = Math.max(0, newBalance);
    localStorage.setItem(BALANCE_STORAGE_KEY, JSON.stringify(balances));
  } catch (e) {}
};
