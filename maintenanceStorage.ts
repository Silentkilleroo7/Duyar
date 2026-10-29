import { supabase } from './supabase';

export type MaintenanceTicketStatus = 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

export interface MaintenanceStep {
  name: 'Pending' | 'Active' | 'Accepted' | 'Confirmed' | 'Assigned' | 'In Progress' | 'Completed';
  key: MaintenanceTicketStatus;
  label: string;
  description: string;
  icon: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
}

export type MaintenanceCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'AC & Appliance'
  | 'Security & CCTV'
  | 'Carpentry'
  | 'Maid & Housekeeping'
  | 'Pick & Drop'
  | 'Security'
  | 'General'
  | string;

export interface MaintenanceTicket {
  id: string;
  title: string;
  category: MaintenanceCategory;
  icon: string;
  priority: 'Emergency' | 'High' | 'Standard';
  customerName: string;
  customerPhone: string;
  userId?: string;
  address: string;
  area: string;
  scheduledTime: string;
  price: string;
  status: MaintenanceTicketStatus;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  technicianName: string;
  technicianRole: string;
  technicianPhone: string;
  description: string;
  image?: string;
  notes?: string[];
  updatedAt: string;
}

const STORAGE_KEY = 'duyar_maintenance_tickets_v3';
const EVENT_KEY = 'duyar_maintenance_tickets_updated';

export const SEED_TICKETS: MaintenanceTicket[] = [];

// Helper to notify listeners
function notifySubscribers() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_KEY));
  }
}

// Get all tickets from local storage or database
export function getStoredMaintenanceTickets(): MaintenanceTicket[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (err) {
    console.error('Error reading maintenance tickets:', err);
    return [];
  }
}

export const getAllMaintenanceTickets = getStoredMaintenanceTickets;

// Save tickets to local storage & attempt supabase sync
export function saveMaintenanceTickets(tickets: MaintenanceTicket[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    notifySubscribers();

    // Async sync to Supabase if database table is available
    if (supabase) {
      syncToSupabase(tickets).catch(err => {
        // Non-blocking fallback
        console.debug('Supabase sync background note:', err?.message || err);
      });
    }
  } catch (err) {
    console.error('Failed to save maintenance tickets:', err);
  }
}

async function syncToSupabase(tickets: MaintenanceTicket[]) {
  try {
    // Attempt upserting to maintenance_tickets table if present
    const payload = tickets.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      status: t.status,
      address: t.address,
      scheduled_time: t.scheduledTime,
      price: t.price,
      assigned_at: t.assignedAt,
      started_at: t.startedAt || null,
      completed_at: t.completedAt || null,
      technician_name: t.technicianName,
      customer_name: t.customerName,
      customer_phone: t.customerPhone,
      updated_at: t.updatedAt
    }));
    await (supabase as any).from('maintenance_tickets').upsert(payload, { onConflict: 'id' });
  } catch {
    // Graceful fallback to local database
  }
}

// Asynchronous fetch from database strictly for current user
export async function fetchMaintenanceTicketsFromDB(userPhone?: string, userId?: string): Promise<MaintenanceTicket[]> {
  if (!userPhone && !userId) {
    return getUserMaintenanceTickets(userPhone, userId);
  }
  try {
    if (supabase) {
      let query = (supabase as any).from('maintenance_tickets').select('*');
      if (userId && userPhone) {
        query = query.or(`userId.eq.${userId},customer_phone.eq.${userPhone}`);
      } else if (userId) {
        query = query.eq('userId', userId);
      } else if (userPhone) {
        query = query.eq('customer_phone', userPhone);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const local = getStoredMaintenanceTickets();
        const merged: MaintenanceTicket[] = data.map((row: any) => {
          const existing = local.find(l => l.id === row.id);
          return {
            id: row.id,
            title: row.title || existing?.title || 'Maintenance Task',
            category: row.category || existing?.category || 'Electrical',
            icon: existing?.icon || 'build',
            priority: row.priority || existing?.priority || 'Standard',
            customerName: row.customer_name || existing?.customerName || 'Customer',
            customerPhone: row.customer_phone || existing?.customerPhone || '',
            address: row.address || existing?.address || '',
            area: existing?.area || 'Dhaka',
            scheduledTime: row.scheduled_time || existing?.scheduledTime || 'Today',
            price: row.price || existing?.price || '৳ 1,000',
            status: (row.status as MaintenanceTicketStatus) || existing?.status || 'ASSIGNED',
            assignedAt: row.assigned_at || existing?.assignedAt || 'Today',
            startedAt: row.started_at || existing?.startedAt,
            completedAt: row.completed_at || existing?.completedAt,
            technicianName: row.technician_name || existing?.technicianName || 'Specialist',
            technicianRole: existing?.technicianRole || 'Verified Specialist',
            technicianPhone: existing?.technicianPhone || '+880 1712-984512',
            description: existing?.description || '',
            image: existing?.image,
            notes: existing?.notes,
            updatedAt: row.updated_at || new Date().toISOString()
          };
        });
        saveMaintenanceTickets(merged);
        return merged;
      }
    }
  } catch (e) {
    console.debug('Using local database for maintenance tickets:', e);
  }
  return getUserMaintenanceTickets(userPhone, userId);
}

// Update a ticket's status ('ASSIGNED' -> 'IN_PROGRESS' -> 'COMPLETED')
export function updateTicketStatus(
  ticketId: string,
  newStatus: MaintenanceTicketStatus,
  note?: string
): MaintenanceTicket | null {
  const tickets = getStoredMaintenanceTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date();
  const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  
  const current = tickets[index];
  const updated: MaintenanceTicket = {
    ...current,
    status: newStatus,
    updatedAt: now.toISOString()
  };

  if (newStatus === 'ASSIGNED') {
    // Reset or keep assigned
    updated.startedAt = undefined;
    updated.completedAt = undefined;
  } else if (newStatus === 'IN_PROGRESS') {
    if (!updated.startedAt) {
      updated.startedAt = timeStr;
    }
    updated.completedAt = undefined;
  } else if (newStatus === 'COMPLETED') {
    if (!updated.startedAt) {
      updated.startedAt = 'Today, 10:00 AM';
    }
    updated.completedAt = timeStr;
  }

  if (note) {
    updated.notes = [...(updated.notes || []), `${timeStr}: ${note}`];
  }

  tickets[index] = updated;
  saveMaintenanceTickets(tickets);
  return updated;
}

// Add a newly booked maintenance ticket
export function addMaintenanceTicket(ticketData: {
  title: string;
  category: MaintenanceCategory;
  icon?: string;
  priority?: 'Emergency' | 'High' | 'Standard';
  customerName: string;
  customerPhone: string;
  userId?: string;
  address: string;
  area: string;
  scheduledTime?: string;
  price: string;
  description?: string;
  status?: MaintenanceTicketStatus;
  technicianName?: string;
  technicianRole?: string;
  technicianPhone?: string;
  image?: string;
}): MaintenanceTicket {
  const tickets = getStoredMaintenanceTickets();
  const now = new Date();
  const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const initialStatus: MaintenanceTicketStatus = ticketData.status || 'PENDING';

  const newTicket: MaintenanceTicket = {
    id: `MA-${Math.floor(1000 + Math.random() * 9000)}`,
    title: ticketData.title,
    category: ticketData.category,
    icon: ticketData.icon || 'build',
    priority: ticketData.priority || 'Standard',
    customerName: ticketData.customerName,
    customerPhone: ticketData.customerPhone,
    userId: ticketData.userId,
    address: ticketData.address,
    area: ticketData.area,
    scheduledTime: ticketData.scheduledTime || timeStr,
    price: ticketData.price,
    status: initialStatus,
    assignedAt: timeStr,
    technicianName: ticketData.technicianName || (initialStatus === 'PENDING' ? 'Awaiting Provider Acceptance' : 'Field Specialist'),
    technicianRole: ticketData.technicianRole || (initialStatus === 'PENDING' ? 'Pending Provider Acceptance' : 'Licensed Field Specialist'),
    technicianPhone: ticketData.technicianPhone || (initialStatus === 'PENDING' ? '' : '+880 1712-984512'),
    description: ticketData.description || 'Service request submitted.',
    image: ticketData.image,
    notes: [initialStatus === 'PENDING' ? `${timeStr}: Service request posted, awaiting provider acceptance` : `${timeStr}: Ticket assigned to technician`],
    updatedAt: now.toISOString(),
    ...({ isSessionBooking: true } as any)
  };

  const updated = [newTicket, ...tickets];
  saveMaintenanceTickets(updated);
  return newTicket;
}

// Accept a pending service request (e.g. guard or technician accepting request)
export function acceptMaintenanceTicket(
  ticketId: string,
  provider?: {
    name?: string;
    role?: string;
    phone?: string;
  }
): MaintenanceTicket | null {
  const tickets = getStoredMaintenanceTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date();
  const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const current = tickets[index];

  const assignedName = provider?.name || (current.category === 'Security & CCTV' ? 'Security Specialist' : 'Field Technician');
  const assignedRole = provider?.role || (current.category === 'Security & CCTV' ? 'Senior Security Specialist' : 'Licensed Field Specialist');
  const assignedPhone = provider?.phone || (current.category === 'Security & CCTV' ? '+880 1855-667788' : '+880 1712-984512');

  const updated: MaintenanceTicket = {
    ...current,
    status: 'ACTIVE',
    technicianName: assignedName,
    technicianRole: assignedRole,
    technicianPhone: assignedPhone,
    updatedAt: now.toISOString(),
    notes: [...(current.notes || []), `${timeStr}: Request accepted by ${assignedName}. Status is ACTIVE. Chat and negotiation opened.`]
  };

  tickets[index] = updated;
  saveMaintenanceTickets(tickets);
  return updated;
}

// Confirm negotiated price & terms through chat negotiations (transitions to CONFIRMED service)
export function confirmNegotiatedTicket(
  ticketId: string,
  agreedPrice: string,
  note?: string
): MaintenanceTicket | null {
  const tickets = getStoredMaintenanceTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date();
  const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const current = tickets[index];

  const updated: MaintenanceTicket = {
    ...current,
    price: agreedPrice.startsWith('৳') ? agreedPrice : `৳ ${agreedPrice}`,
    status: 'CONFIRMED',
    startedAt: timeStr,
    updatedAt: now.toISOString(),
    notes: [...(current.notes || []), `${timeStr}: Service confirmed via chat negotiations at ${agreedPrice}. ${note || 'Agreement finalized.'}`]
  };

  tickets[index] = updated;
  saveMaintenanceTickets(tickets);
  return updated;
}

// Release an active ticket back to PENDING if price negotiation fails or either party cancels
export function releaseMaintenanceTicketToPending(
  ticketId: string,
  reason?: string
): MaintenanceTicket | null {
  const tickets = getStoredMaintenanceTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date();
  const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const current = tickets[index];

  const updated: MaintenanceTicket = {
    ...current,
    status: 'PENDING',
    technicianName: 'Awaiting Provider Acceptance',
    technicianRole: 'Pending Provider Acceptance',
    technicianPhone: '',
    startedAt: undefined,
    completedAt: undefined,
    updatedAt: now.toISOString(),
    notes: [
      ...(current.notes || []),
      `${timeStr}: Price negotiation did not meet agreement. Request released & re-broadcasted to pending queue for authorized providers. ${reason ? `(${reason})` : ''}`
    ]
  };

  tickets[index] = updated;
  saveMaintenanceTickets(tickets);
  return updated;
}

// Complete a confirmed service ticket
export function completeMaintenanceTicket(
  ticketId: string,
  note?: string
): MaintenanceTicket | null {
  const tickets = getStoredMaintenanceTickets();
  const index = tickets.findIndex(t => t.id === ticketId);
  if (index === -1) return null;

  const now = new Date();
  const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const current = tickets[index];

  const updated: MaintenanceTicket = {
    ...current,
    status: 'COMPLETED',
    completedAt: timeStr,
    updatedAt: now.toISOString(),
    notes: [...(current.notes || []), `${timeStr}: Service completed. ${note || ''}`]
  };

  tickets[index] = updated;
  saveMaintenanceTickets(tickets);
  return updated;
}

// Delete or cancel a maintenance ticket
export function deleteMaintenanceTicket(ticketId: string): boolean {
  const tickets = getStoredMaintenanceTickets();
  const filtered = tickets.filter(t => t.id !== ticketId);
  if (filtered.length === tickets.length) return false;
  saveMaintenanceTickets(filtered);
  return true;
}

// Filter tickets strictly for the authenticated user
export function getUserMaintenanceTickets(userPhone?: string, userId?: string): MaintenanceTicket[] {
  const allTickets = getStoredMaintenanceTickets();
  if (!userPhone && !userId) {
    // If not logged in, only return tickets explicitly created during this local session
    return allTickets.filter(t => (t as any).isSessionBooking && !t.userId);
  }

  const cleanPhone = userPhone ? userPhone.replace(/[\s-]/g, '') : '';

  return allTickets.filter(t => {
    if ((t as any).isSessionBooking) return true;
    if (userId && t.userId && t.userId === userId) return true;
    if (cleanPhone && t.customerPhone) {
      const ticketPhoneClean = t.customerPhone.replace(/[\s-]/g, '');
      if (ticketPhoneClean === cleanPhone || ticketPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(ticketPhoneClean)) {
        return true;
      }
    }
    return false;
  });
}

// Subscribe to real-time updates
export function subscribeToMaintenanceTickets(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = () => callback();
  window.addEventListener(EVENT_KEY, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  });

  return () => {
    window.removeEventListener(EVENT_KEY, handler);
  };
}

// Helper to compute progress bar metadata for a ticket
export function getTicketProgressSteps(ticket: MaintenanceTicket): {
  steps: MaintenanceStep[];
  percentage: number;
  currentStepIndex: number;
  statusLabel: string;
} {
  const isAssigned = ticket.status === 'ASSIGNED';
  const isInProgress = ticket.status === 'IN_PROGRESS';
  const isCompleted = ticket.status === 'COMPLETED';

  const steps: MaintenanceStep[] = [
    {
      name: 'Assigned',
      key: 'ASSIGNED',
      label: 'Assigned',
      description: ticket.assignedAt ? `Assigned • ${ticket.assignedAt}` : 'Dispatched to technician',
      icon: 'assignment_ind',
      timestamp: ticket.assignedAt,
      completed: true, // If the ticket exists, it is at least assigned
      active: isAssigned
    },
    {
      name: 'In Progress',
      key: 'IN_PROGRESS',
      label: 'In Progress',
      description: isInProgress 
        ? (ticket.startedAt ? `Started at ${ticket.startedAt}` : 'Work underway on-site')
        : isCompleted 
          ? `Work completed` 
          : 'Awaiting site arrival',
      icon: 'engineering',
      timestamp: ticket.startedAt,
      completed: isInProgress || isCompleted,
      active: isInProgress
    },
    {
      name: 'Completed',
      key: 'COMPLETED',
      label: 'Completed',
      description: isCompleted 
        ? (ticket.completedAt ? `Finished • ${ticket.completedAt}` : 'Signed off by customer')
        : 'Inspection & sign-off',
      icon: 'task_alt',
      timestamp: ticket.completedAt,
      completed: isCompleted,
      active: isCompleted
    }
  ];

  let percentage = 0;
  let currentStepIndex = 0;
  let statusLabel = 'Assigned to Technician';

  if (isAssigned) {
    percentage = 0; // At Step 1
    currentStepIndex = 0;
    statusLabel = 'Assigned • Ready to Start';
  } else if (isInProgress) {
    percentage = 50; // Halfway (between Step 1 and Step 2/3)
    currentStepIndex = 1;
    statusLabel = 'Work In Progress';
  } else if (isCompleted) {
    percentage = 100; // Complete
    currentStepIndex = 2;
    statusLabel = 'Completed & Verified';
  }

  return {
    steps,
    percentage,
    currentStepIndex,
    statusLabel
  };
}

// Reset data to seeds
export function resetMaintenanceTicketsToDefault(): MaintenanceTicket[] {
  if (typeof window === 'undefined') return SEED_TICKETS;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TICKETS));
  notifySubscribers();
  return SEED_TICKETS;
}

const maintenanceStorage = {
  getStoredMaintenanceTickets,
  saveMaintenanceTickets,
  fetchMaintenanceTicketsFromDB,
  updateTicketStatus,
  addMaintenanceTicket,
  getUserMaintenanceTickets,
  subscribeToMaintenanceTickets,
  getTicketProgressSteps,
  resetMaintenanceTicketsToDefault
};

export default maintenanceStorage;
