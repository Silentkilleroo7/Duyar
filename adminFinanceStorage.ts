import { supabase } from './supabase';
import { addAuditLog } from './adminAuditStorage';
import { 
  getPayoutRequests, 
  updatePayoutStatus, 
  getUserBalance, 
  setUserBalance, 
  PayoutRequest 
} from './payoutStorage';

export interface ManualDepositRequest {
  id: string;
  userId: string;
  userPhone: string;
  userName: string;
  amount: number;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay';
  trxId: string;
  senderNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
  adminNotes?: string;
}

const DEPOSIT_STORAGE_KEY = 'duyar_pending_deposits_v2';
const DEPOSIT_EVENT_KEY = 'duyar_deposits_updated';

// Fresh production deposit list
const SEED_DEPOSITS: ManualDepositRequest[] = [];

export function getDepositRequests(): ManualDepositRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEPOSIT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export function saveDepositRequests(list: ManualDepositRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEPOSIT_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(DEPOSIT_EVENT_KEY, { detail: list }));
  } catch (e) {}
}

export function subscribeToDeposits(callback: (list: ManualDepositRequest[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: any) => {
    callback(e.detail || getDepositRequests());
  };
  window.addEventListener(DEPOSIT_EVENT_KEY, handler);
  return () => window.removeEventListener(DEPOSIT_EVENT_KEY, handler);
}

// Submit a new manual deposit (called from user app recharge form)
export function submitManualDeposit(data: {
  amount: number | string;
  trxId: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay';
  senderNumber: string;
  userPhone?: string;
  userName?: string;
  userId?: string;
}): ManualDepositRequest {
  const current = getDepositRequests();
  const numAmount = typeof data.amount === 'string' ? parseFloat(data.amount.replace(/[^0-9.]/g, '')) || 0 : data.amount;
  const newReq: ManualDepositRequest = {
    id: `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: data.userId || 'resident-user',
    userPhone: data.userPhone || '+8801977347402',
    userName: data.userName || 'Resident User',
    amount: numAmount,
    method: data.method,
    trxId: data.trxId.toUpperCase(),
    senderNumber: data.senderNumber,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  const updated = [newReq, ...current];
  saveDepositRequests(updated);

  addAuditLog({
    action: 'DEPOSIT_SUBMITTED',
    category: 'Deposits',
    title: `New Manual Deposit Submitted (৳ ${numAmount.toLocaleString()})`,
    details: `${data.method} deposit of ৳ ${numAmount.toLocaleString()} submitted with TrxID: ${data.trxId} by ${data.senderNumber}.`,
    targetId: newReq.id,
    targetName: data.userName || data.userPhone,
    status: 'INFO',
    amount: numAmount
  });

  return newReq;
}

// Approve manual deposit & credit resident balance
export async function approveManualDeposit(
  depositId: string, 
  adminNotes: string = 'Payment verified via MFS Gateway'
): Promise<boolean> {
  const current = getDepositRequests();
  const target = current.find(d => d.id === depositId);
  if (!target) return false;

  const updated = current.map(d => {
    if (d.id === depositId) {
      return {
        ...d,
        status: 'APPROVED' as const,
        approvedAt: new Date().toISOString(),
        adminNotes
      };
    }
    return d;
  });
  saveDepositRequests(updated);

  // 1. Credit local user balance
  const currentBal = getUserBalance(target.userId, 0);
  const newBal = currentBal + target.amount;
  setUserBalance(target.userId, newBal);

  // 2. Also update transactions storage for user visibility
  if (typeof window !== 'undefined') {
    try {
      const rawTxns = localStorage.getItem('duyar_transactions_v1');
      const txns = rawTxns ? JSON.parse(rawTxns) : [];
      txns.unshift({
        id: `TX-${Date.now()}`,
        user_id: target.userId,
        phone: target.userPhone,
        type: 'deposit',
        amount: target.amount,
        status: 'success',
        description: `Manual Recharge (${target.method} TrxID: ${target.trxId}) Approved by Admin`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('duyar_transactions_v1', JSON.stringify(txns));
      window.dispatchEvent(new CustomEvent('duyar_transactions_updated'));
    } catch (e) {}
  }

  // 3. Sync to Supabase in background
  if (supabase) {
    try {
      if (target.userPhone) {
        await supabase
          .from('profiles')
          .update({ balance: newBal })
          .eq('phone', target.userPhone);
      }
      await supabase.from('transactions').insert([{
        user_id: target.userId,
        type: 'deposit',
        amount: target.amount,
        status: 'success',
        description: `Manual Deposit Approved (${target.method} ${target.trxId})`,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {}
  }

  // 4. Log to Audit Trail
  addAuditLog({
    action: 'APPROVE_DEPOSIT',
    category: 'Deposits',
    title: `Approved ৳ ${target.amount.toLocaleString()} Deposit`,
    details: `Admin confirmed receipt of ৳ ${target.amount.toLocaleString()} via ${target.method} (TrxID: ${target.trxId}). Credited user account ${target.userPhone}. Note: ${adminNotes}`,
    targetId: target.id,
    targetName: target.userName || target.userPhone,
    status: 'SUCCESS',
    amount: target.amount
  });

  return true;
}

// Reject manual deposit
export async function rejectManualDeposit(
  depositId: string, 
  reason: string = 'Invalid Transaction ID or Amount Mismatch'
): Promise<boolean> {
  const current = getDepositRequests();
  const target = current.find(d => d.id === depositId);
  if (!target) return false;

  const updated = current.map(d => {
    if (d.id === depositId) {
      return {
        ...d,
        status: 'REJECTED' as const,
        adminNotes: reason
      };
    }
    return d;
  });
  saveDepositRequests(updated);

  // Log to Audit Trail
  addAuditLog({
    action: 'REJECT_DEPOSIT',
    category: 'Deposits',
    title: `Rejected ৳ ${target.amount.toLocaleString()} Deposit Request`,
    details: `Deposit ${target.id} (${target.method} TrxID: ${target.trxId}) rejected by Admin. Reason: ${reason}.`,
    targetId: target.id,
    targetName: target.userName || target.userPhone,
    status: 'REJECTED',
    amount: target.amount
  });

  return true;
}

// Complete a manual withdrawal payout
export async function completeWithdrawalPayout(
  payoutId: string,
  adminTrxId: string = `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
  adminNotes: string = 'Dispatched from Duyar Corporate Account'
): Promise<boolean> {
  try {
    const list = await getPayoutRequests();
    const target = list.find(p => p.id === payoutId);
    await updatePayoutStatus(payoutId, 'PROCESSED', {
      adminTrxId,
      adminNotes
    });

    addAuditLog({
      action: 'COMPLETE_WITHDRAWAL',
      category: 'Withdrawals',
      title: `Completed ৳ ${target?.amount ? target.amount.toLocaleString() : 'Payout'} Withdrawal`,
      details: `Dispatched payment to ${target?.method} (${target?.accountNumber}). Admin Trx Ref: ${adminTrxId}. Note: ${adminNotes}.`,
      targetId: payoutId,
      targetName: target?.user_name || target?.user_phone,
      status: 'SUCCESS',
      amount: target?.amount
    });

    return true;
  } catch (e) {
    console.error('Failed to complete withdrawal:', e);
    return false;
  }
}

// Reject a manual withdrawal payout & refund balance
export async function rejectWithdrawalPayout(
  payoutId: string,
  reason: string = 'Invalid recipient account information'
): Promise<boolean> {
  try {
    const list = await getPayoutRequests();
    const target = list.find(p => p.id === payoutId);
    await updatePayoutStatus(payoutId, 'REJECTED', {
      adminNotes: reason
    });

    // Refund the user's wallet
    if (target && target.user_id) {
      const currentBal = getUserBalance(target.user_id, 0);
      const refundedBal = currentBal + target.amount;
      setUserBalance(target.user_id, refundedBal);
    }

    addAuditLog({
      action: 'REJECT_WITHDRAWAL',
      category: 'Withdrawals',
      title: `Rejected ৳ ${target?.amount ? target.amount.toLocaleString() : 'Payout'} Withdrawal Request`,
      details: `Withdrawal request ${payoutId} for ${target?.method} (${target?.accountNumber}) rejected by Admin. Refunded ৳ ${target?.amount || 0} back to user balance. Reason: ${reason}.`,
      targetId: payoutId,
      targetName: target?.user_name || target?.user_phone,
      status: 'REJECTED',
      amount: target?.amount
    });

    return true;
  } catch (e) {
    console.error('Failed to reject withdrawal:', e);
    return false;
  }
}

// Direct Manual Wallet Adjustment by Admin (Credit or Debit)
export async function performAdminWalletAdjustment(data: {
  userPhone: string;
  userName?: string;
  userId?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  reason: string;
}): Promise<number> {
  const currentBal = getUserBalance(data.userId || data.userPhone, 0);
  const newBal = data.type === 'CREDIT' 
    ? currentBal + data.amount 
    : Math.max(0, currentBal - data.amount);

  setUserBalance(data.userId || data.userPhone, newBal);

  if (typeof window !== 'undefined') {
    try {
      const rawTxns = localStorage.getItem('duyar_transactions_v1');
      const txns = rawTxns ? JSON.parse(rawTxns) : [];
      txns.unshift({
        id: `TX-ADJ-${Date.now()}`,
        user_id: data.userId || data.userPhone,
        phone: data.userPhone,
        type: data.type === 'CREDIT' ? 'deposit' : 'withdraw',
        amount: data.amount,
        status: 'success',
        description: `Admin Direct Adjustment: ${data.reason}`,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('duyar_transactions_v1', JSON.stringify(txns));
      window.dispatchEvent(new CustomEvent('duyar_transactions_updated'));
    } catch (e) {}
  }

  if (supabase) {
    try {
      await supabase
        .from('profiles')
        .update({ balance: newBal })
        .eq('phone', data.userPhone);
    } catch (e) {}
  }

  addAuditLog({
    action: data.type === 'CREDIT' ? 'ADMIN_DIRECT_CREDIT' : 'ADMIN_DIRECT_DEBIT',
    category: 'Deposits',
    title: `Admin Direct ${data.type} of ৳ ${data.amount.toLocaleString()}`,
    details: `Direct ${data.type.toLowerCase()} of ৳ ${data.amount.toLocaleString()} applied to user ${data.userPhone}. Reason: ${data.reason}. New balance: ৳ ${newBal.toLocaleString()}.`,
    targetName: data.userName || data.userPhone,
    status: 'SUCCESS',
    amount: data.amount
  });

  return newBal;
}
