/**
 * Duyar Expenditure Storage & Monthly Spending Tracker
 * Tracks rental outflows (flat rent, service charge, advance amortized)
 * and home services expenditures (electrical, plumbing, maid, pick & drop, security).
 */

import { haptics } from './haptics';

export type ExpenditureCategory = 
  | 'RENTAL'
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'CLEANING'
  | 'PICK_DROP'
  | 'SECURITY'
  | 'OTHER_SERVICE';

export type ExpenditureType = 'RENTAL' | 'SERVICE';

export interface ExpenditureItem {
  id: string;
  type: ExpenditureType;
  category: ExpenditureCategory;
  categoryLabel: string;
  title: string;
  amount: number;
  date: string; // ISO date string
  month: string; // "YYYY-MM", e.g. "2026-10"
  paymentMethod: 'Duyar Wallet' | 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash';
  receiptNo?: string;
  providerOrLandlord?: string;
  color: string;
  icon: string;
  notes?: string;
}

export interface CategorySummary {
  category: ExpenditureCategory;
  label: string;
  type: ExpenditureType;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  icon: string;
  items: ExpenditureItem[];
}

export interface MonthlyBreakdown {
  month: string;
  monthName: string;
  totalSpent: number;
  rentalTotal: number;
  rentalPercentage: number;
  serviceTotal: number;
  servicePercentage: number;
  budgetCap: number;
  budgetUsedPercentage: number;
  previousMonthTotal: number;
  monthOverMonthDiff: number; // percentage change vs previous month
  categorySummaries: CategorySummary[];
  items: ExpenditureItem[];
}

const STORAGE_KEY = 'duyar_monthly_expenditures_v1';
export const EXPENDITURES_UPDATED_EVENT = 'duyar_expenditures_updated';

// Default Seed Expenditures
function getSeedExpenditures(): ExpenditureItem[] {
  return [];
  /*
      id: 'EXP-2026-10-01',
      type: 'RENTAL',
      category: 'RENTAL',
      categoryLabel: 'Apartment Rent',
      title: 'October Apartment Rent (Banani Block D, Apt 4B)',
      amount: 28000,
      date: '2026-10-02T10:00:00Z',
      month: '2026-10',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'RENT-OCT-9921',
      providerOrLandlord: 'Al-Haj Rafiqul Islam (Landlord)',
      color: '#13ecda', // Primary Teal
      icon: 'apartment',
      notes: 'Monthly residence rental with digital landlord receipt'
    },
    {
      id: 'EXP-2026-10-02',
      type: 'RENTAL',
      category: 'RENTAL',
      categoryLabel: 'Service Charge',
      title: 'Building Lift, Generator & Common Area Service Charge',
      amount: 4500,
      date: '2026-10-04T11:30:00Z',
      month: '2026-10',
      paymentMethod: 'bKash',
      receiptNo: 'BLDG-OCT-112',
      providerOrLandlord: 'Banani Resident Welfare Society',
      color: '#06b6d4', // Cyan
      icon: 'corporate_fare',
      notes: 'Monthly building maintenance & generator backup fund'
    },
    {
      id: 'EXP-2026-10-03',
      type: 'SERVICE',
      category: 'ELECTRICAL',
      categoryLabel: 'Electrical Repair',
      title: 'Circuit Breaker Fix & LED Chandelier Setup',
      amount: 1850,
      date: '2026-10-08T14:15:00Z',
      month: '2026-10',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'SRV-ELEC-4401',
      providerOrLandlord: 'Md. Kabir Hossain (Licensed Specialist)',
      color: '#f59e0b', // Amber
      icon: 'bolt',
      notes: 'MCB replacement and diagnostic load balancing'
    },
    {
      id: 'EXP-2026-10-04',
      type: 'SERVICE',
      category: 'CLEANING',
      categoryLabel: 'Maid & Housekeeping',
      title: 'Bi-Weekly Apartment Deep Sanitization & Kitchen Cleaning',
      amount: 3200,
      date: '2026-10-12T09:00:00Z',
      month: '2026-10',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'SRV-CLEAN-889',
      providerOrLandlord: 'Duyar Verified Maid Service',
      color: '#10b981', // Emerald
      icon: 'sanitizer',
      notes: 'Floor scrubbing, kitchen degreasing & balcony clean'
    },
    {
      id: 'EXP-2026-10-05',
      type: 'SERVICE',
      category: 'PICK_DROP',
      categoryLabel: 'Pick & Drop Logistics',
      title: 'Office Documents & Heavy Appliance Shift (Uttara to Banani)',
      amount: 2450,
      date: '2026-10-15T16:45:00Z',
      month: '2026-10',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'SRV-PICK-771',
      providerOrLandlord: 'Rakibul Islam (Mini Truck Pilot)',
      color: '#a855f7', // Purple
      icon: 'local_shipping',
      notes: 'Fast 45-min transit with live GPS tracking'
    },
    {
      id: 'EXP-2026-10-06',
      type: 'SERVICE',
      category: 'PLUMBING',
      categoryLabel: 'Plumbing & Drainage',
      title: 'Bathroom Concealed Cistern & Kitchen Basin Leak Fix',
      amount: 1650,
      date: '2026-10-18T11:20:00Z',
      month: '2026-10',
      paymentMethod: 'Nagad',
      receiptNo: 'SRV-PLUMB-302',
      providerOrLandlord: 'Master Plumber Jahangir',
      color: '#38bdf8', // Light Sky Blue
      icon: 'plumbing',
      notes: 'High-pressure seal replacement & valve testing'
    },
    {
      id: 'EXP-2026-10-07',
      type: 'SERVICE',
      category: 'SECURITY',
      categoryLabel: 'Security & Guard',
      title: 'Building Night Shift Security Guard Shared Contribution',
      amount: 1200,
      date: '2026-10-19T08:00:00Z',
      month: '2026-10',
      paymentMethod: 'Cash',
      receiptNo: 'SEC-OCT-40',
      providerOrLandlord: 'Guard Force Banani Team',
      color: '#f43f5e', // Rose
      icon: 'shield_person',
      notes: 'Resident monthly shared night guard wages'
    },

    // Previous Month (September 2026)
    {
      id: 'EXP-2026-09-01',
      type: 'RENTAL',
      category: 'RENTAL',
      categoryLabel: 'Apartment Rent',
      title: 'September Apartment Rent (Banani Block D, Apt 4B)',
      amount: 28000,
      date: '2026-09-02T10:00:00Z',
      month: '2026-09',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'RENT-SEP-8812',
      providerOrLandlord: 'Al-Haj Rafiqul Islam (Landlord)',
      color: '#13ecda',
      icon: 'apartment'
    },
    {
      id: 'EXP-2026-09-02',
      type: 'RENTAL',
      category: 'RENTAL',
      categoryLabel: 'Service Charge',
      title: 'Building Lift, Generator & Security Charge',
      amount: 4500,
      date: '2026-09-05T11:30:00Z',
      month: '2026-09',
      paymentMethod: 'bKash',
      receiptNo: 'BLDG-SEP-099',
      providerOrLandlord: 'Banani Resident Welfare Society',
      color: '#06b6d4',
      icon: 'corporate_fare'
    },
    {
      id: 'EXP-2026-09-03',
      type: 'SERVICE',
      category: 'CLEANING',
      categoryLabel: 'Maid & Housekeeping',
      title: 'Deep Home Cleaning & Disinfection',
      amount: 3200,
      date: '2026-09-14T10:00:00Z',
      month: '2026-09',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'SRV-CLEAN-712',
      color: '#10b981',
      icon: 'sanitizer'
    },
    {
      id: 'EXP-2026-09-04',
      type: 'SERVICE',
      category: 'ELECTRICAL',
      categoryLabel: 'Electrical Repair',
      title: 'Geyser Wiring & Switch Replacement',
      amount: 1400,
      date: '2026-09-20T12:00:00Z',
      month: '2026-09',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'SRV-ELEC-391',
      color: '#f59e0b',
      icon: 'bolt'
    },
    {
      id: 'EXP-2026-09-05',
      type: 'SERVICE',
      category: 'SECURITY',
      categoryLabel: 'Security & Guard',
      title: 'Night Security Guard Shared Contribution',
      amount: 1200,
      date: '2026-09-22T08:00:00Z',
      month: '2026-09',
      paymentMethod: 'Cash',
      color: '#f43f5e',
      icon: 'shield_person'
    },

    // Prior Month (August 2026)
    {
      id: 'EXP-2026-08-01',
      type: 'RENTAL',
      category: 'RENTAL',
      categoryLabel: 'Apartment Rent',
      title: 'August Apartment Rent (Banani Block D, Apt 4B)',
      amount: 28000,
      date: '2026-08-02T10:00:00Z',
      month: '2026-08',
      paymentMethod: 'Duyar Wallet',
      receiptNo: 'RENT-AUG-7701',
      color: '#13ecda',
      icon: 'apartment'
    },
    {
      id: 'EXP-2026-08-02',
      type: 'RENTAL',
      category: 'RENTAL',
      categoryLabel: 'Service Charge',
      title: 'Building Lift, Generator & Security Charge',
      amount: 4500,
      date: '2026-08-05T11:30:00Z',
      month: '2026-08',
      paymentMethod: 'bKash',
      color: '#06b6d4',
      icon: 'corporate_fare'
    },
    {
      id: 'EXP-2026-08-03',
      type: 'SERVICE',
      category: 'PLUMBING',
      categoryLabel: 'Plumbing & Drainage',
      title: 'Water Tank Float Sensor Repair',
      amount: 2200,
      date: '2026-08-11T13:00:00Z',
      month: '2026-08',
      paymentMethod: 'Duyar Wallet',
      color: '#38bdf8',
      icon: 'plumbing'
    },
    {
      id: 'EXP-2026-08-04',
      type: 'SERVICE',
      category: 'CLEANING',
      categoryLabel: 'Maid & Housekeeping',
      title: 'Apartment Deep Cleaning',
      amount: 3000,
      date: '2026-08-18T10:00:00Z',
      month: '2026-08',
      paymentMethod: 'Duyar Wallet',
      color: '#10b981',
      icon: 'sanitizer'
    }
  ];
  */
}

/**
 * Get all logged expenditures
 */
export function getExpenditures(): ExpenditureItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load expenditures:', err);
    return [];
  }
}

/**
 * Save expenditures array to localStorage and notify listeners
 */
export function persistExpenditures(items: ExpenditureItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EXPENDITURES_UPDATED_EVENT, { detail: items }));
  } catch (err) {
    console.error('Failed to persist expenditures:', err);
  }
}

/**
 * Add a new expenditure item
 */
export function addExpenditure(item: Omit<ExpenditureItem, 'id' | 'month'>): ExpenditureItem {
  const dateObj = new Date(item.date || Date.now());
  const year = dateObj.getFullYear();
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
  const month = `${year}-${monthStr}`;

  const newItem: ExpenditureItem = {
    ...item,
    id: `EXP-${month}-${Date.now().toString().slice(-4)}`,
    month
  };

  const current = getExpenditures();
  const updated = [newItem, ...current];
  persistExpenditures(updated);

  try {
    haptics.bookingConfirmed();
  } catch {}

  return newItem;
}

/**
 * Delete an expenditure
 */
export function deleteExpenditure(id: string): void {
  const current = getExpenditures();
  const updated = current.filter(item => item.id !== id);
  persistExpenditures(updated);
  try {
    haptics.selection();
  } catch {}
}

/**
 * Available months present in data
 */
export function getAvailableMonths(): { value: string; label: string }[] {
  const items = getExpenditures();
  const uniqueMonths = Array.from(new Set(items.map(i => i.month))).sort().reverse();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return uniqueMonths.map(m => {
    const [y, mNum] = m.split('-');
    const name = monthNames[parseInt(mNum, 10) - 1] || m;
    return {
      value: m,
      label: `${name} ${y}`
    };
  });
}

/**
 * Compute detailed monthly expenditure breakdown with category summaries
 */
export function getMonthlyBreakdown(targetMonth: string = '2026-10'): MonthlyBreakdown {
  const allItems = getExpenditures();
  const monthItems = allItems.filter(item => item.month === targetMonth);

  // Previous month determination for month-over-month analytics
  const [y, m] = targetMonth.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthItems = allItems.filter(item => item.month === prevMonthStr);
  const previousMonthTotal = prevMonthItems.reduce((acc, item) => acc + item.amount, 0);

  const totalSpent = monthItems.reduce((acc, item) => acc + item.amount, 0);
  const rentalTotal = monthItems.filter(i => i.type === 'RENTAL').reduce((acc, i) => acc + i.amount, 0);
  const serviceTotal = monthItems.filter(i => i.type === 'SERVICE').reduce((acc, i) => acc + i.amount, 0);

  const rentalPercentage = totalSpent > 0 ? (rentalTotal / totalSpent) * 100 : 0;
  const servicePercentage = totalSpent > 0 ? (serviceTotal / totalSpent) * 100 : 0;

  // Monthly budget cap reference (default ৳50,000 for standard Dhaka households)
  const budgetCap = 50000;
  const budgetUsedPercentage = Math.min(100, (totalSpent / budgetCap) * 100);

  // Month-over-month % difference
  let monthOverMonthDiff = 0;
  if (previousMonthTotal > 0) {
    monthOverMonthDiff = ((totalSpent - previousMonthTotal) / previousMonthTotal) * 100;
  }

  // Aggregate by category
  const categoryMap = new Map<ExpenditureCategory, {
    label: string;
    type: ExpenditureType;
    amount: number;
    count: number;
    color: string;
    icon: string;
    items: ExpenditureItem[];
  }>();

  for (const item of monthItems) {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, {
        label: item.categoryLabel,
        type: item.type,
        amount: 0,
        count: 0,
        color: item.color,
        icon: item.icon,
        items: []
      });
    }
    const cat = categoryMap.get(item.category)!;
    cat.amount += item.amount;
    cat.count += 1;
    cat.items.push(item);
  }

  const categorySummaries: CategorySummary[] = Array.from(categoryMap.entries()).map(([category, val]) => ({
    category,
    label: val.label,
    type: val.type,
    amount: val.amount,
    percentage: totalSpent > 0 ? (val.amount / totalSpent) * 100 : 0,
    count: val.count,
    color: val.color,
    icon: val.icon,
    items: val.items
  })).sort((a, b) => b.amount - a.amount);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = `${monthNames[m - 1] || targetMonth} ${y}`;

  return {
    month: targetMonth,
    monthName,
    totalSpent,
    rentalTotal,
    rentalPercentage,
    serviceTotal,
    servicePercentage,
    budgetCap,
    budgetUsedPercentage,
    previousMonthTotal,
    monthOverMonthDiff,
    categorySummaries,
    items: monthItems
  };
}
