import { supabase } from './supabase';

export interface PickDropRequest {
  id: string;
  vehicle: string;
  helpers: number;
  items: string[];
  itemDetails: string;
  specialNotes: string[];
  pickupFloor?: string;
  dropFloor?: string;
  driverInstructions?: string;
  pickupArea: string;
  pickupAddress: string;
  dropArea: string;
  dropAddress: string;
  fare: string;
  weightCategory: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'CONFIRMED' | 'ON_TRIP' | 'COMPLETED';
  driverName?: string;
  driverPhone?: string;
  driverVehicleNo?: string;
  userId?: string;
  userPhone?: string;
}

const STORAGE_KEY = 'duyar_pickdrop_active_request_v3';
const HISTORY_KEY = 'duyar_pickdrop_history_v3';

export const INITIAL_PICKDROP_REQUESTS: PickDropRequest[] = [];

export const DEFAULT_PICKDROP_REQUEST: PickDropRequest | null = null;

export const getActivePickDropRequest = (): PickDropRequest | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {
    console.error('Failed to load active pick & drop request:', e);
  }
  return null;
};

export const getAllPickDropHistory = (): PickDropRequest[] => {
  try {
    const historyRaw = localStorage.getItem(HISTORY_KEY);
    if (!historyRaw) {
      return [];
    }
    const list: PickDropRequest[] = JSON.parse(historyRaw);
    if (!Array.isArray(list)) {
      return [];
    }
    return list;
  } catch (e) {
    return [];
  }
};

export const getUserPickDropRequests = (userPhone?: string, userId?: string): PickDropRequest[] => {
  const all = getAllPickDropHistory();
  if (!userPhone && !userId) {
    return all.filter(r => (r as any).isSessionBooking && !r.userId);
  }

  const cleanPhone = userPhone ? userPhone.replace(/[\s-]/g, '') : '';
  return all.filter(req => {
    if ((req as any).isSessionBooking) return true;
    if (userId && req.userId && req.userId === userId) return true;
    if (cleanPhone && req.userPhone) {
      const reqPhoneClean = req.userPhone.replace(/[\s-]/g, '');
      if (reqPhoneClean === cleanPhone || reqPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(reqPhoneClean)) {
        return true;
      }
    }
    return false;
  });
};

export const updatePickDropStatus = (requestId: string, status: PickDropRequest['status']): void => {
  try {
    const history = getAllPickDropHistory();
    const updated = history.map(item => item.id === requestId ? { ...item, status } : item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    const active = getActivePickDropRequest();
    if (active && active.id === requestId) {
      const updatedActive = { ...active, status };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActive));
      window.dispatchEvent(new CustomEvent('duyar_pickdrop_updated', { detail: updatedActive }));
    } else {
      window.dispatchEvent(new CustomEvent('duyar_pickdrop_updated', { detail: { id: requestId, status } }));
    }
    // Sync with remote Supabase database
    if (supabase) {
      Promise.resolve(supabase.from('pickdrop_requests').update({ status }).eq('id', requestId)).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to update pick drop status:', e);
  }
};

export const saveActivePickDropRequest = (req: PickDropRequest): void => {
  try {
    const tagged = { ...req, isSessionBooking: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tagged));
    
    // Also append to history
    const history = getAllPickDropHistory();
    const updated = [tagged, ...history.filter(h => h.id !== req.id)].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

    // Dispatch custom event for real-time state sync across screens
    window.dispatchEvent(new CustomEvent('duyar_pickdrop_updated', { detail: tagged }));

    // Sync with remote Supabase database
    if (supabase) {
      Promise.resolve(supabase.from('pickdrop_requests').upsert({
        id: req.id,
        vehicle_type: req.vehicle,
        helpers_count: req.helpers,
        items: req.items || [],
        item_details: req.itemDetails || 'Relocation items',
        special_notes: req.specialNotes || [],
        pickup_floor: req.pickupFloor || null,
        drop_floor: req.dropFloor || null,
        pickup_area: req.pickupArea,
        pickup_address: req.pickupAddress,
        drop_area: req.dropArea,
        drop_address: req.dropAddress,
        fare: req.fare,
        weight_category: req.weightCategory || 'Standard',
        status: req.status,
        driver_name: req.driverName || null,
        driver_phone: req.driverPhone || null,
        driver_vehicle_no: req.driverVehicleNo || null,
        user_id: req.userId || null,
        user_phone: req.userPhone || null
      })).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to save pick drop request:', e);
  }
};

export const acceptPickDropRequest = (
  requestId: string,
  driver?: { name?: string; phone?: string; vehicleNo?: string }
): PickDropRequest | null => {
  try {
    const history = getAllPickDropHistory();
    const index = history.findIndex(h => h.id === requestId);
    const active = getActivePickDropRequest();
    
    let current: PickDropRequest = index !== -1 
      ? history[index] 
      : (active && active.id === requestId 
          ? active 
          : {
              id: requestId,
              vehicle: 'Pickup 1 Ton',
              helpers: 1,
              items: ['Cargo Shipment'],
              itemDetails: 'Relocation goods',
              specialNotes: [],
              pickupArea: 'Gulshan-2',
              pickupAddress: 'Road 71, Gulshan, Dhaka',
              dropArea: 'Dhanmondi',
              dropAddress: 'Road 27, Dhanmondi, Dhaka',
              fare: '1,500',
              weightCategory: 'Up to 1000 kg',
              createdAt: new Date().toISOString(),
              status: 'PENDING'
            });

    const updated: PickDropRequest = {
      ...current,
      status: 'ACTIVE',
      driverName: driver?.name || current.driverName || 'Assigned Logistics Pilot',
      driverPhone: driver?.phone || current.driverPhone || '+880 1819-234567',
      driverVehicleNo: driver?.vehicleNo || current.driverVehicleNo || 'Dhaka Metro Verified'
    };

    saveActivePickDropRequest(updated);
    window.dispatchEvent(new CustomEvent('duyar_pickdrop_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to accept pick drop request:', e);
    return null;
  }
};

export const confirmPickDropRequest = (
  requestId: string,
  agreedFare: string
): PickDropRequest | null => {
  try {
    const history = getAllPickDropHistory();
    const index = history.findIndex(h => h.id === requestId);
    const active = getActivePickDropRequest();

    const current = index !== -1 ? history[index] : (active && active.id === requestId ? active : null);
    if (!current) return null;

    const cleanFare = agreedFare.replace(/[^0-9]/g, '') || current.fare;
    const updated: PickDropRequest = {
      ...current,
      status: 'CONFIRMED',
      fare: cleanFare
    };

    saveActivePickDropRequest(updated);
    window.dispatchEvent(new CustomEvent('duyar_pickdrop_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to confirm pick drop request:', e);
    return null;
  }
};

// Release an active pick & drop request back to PENDING if price negotiation fails or either party cancels
export const releasePickDropRequestToPending = (
  requestId: string,
  reason?: string
): PickDropRequest | null => {
  try {
    const history = getAllPickDropHistory();
    const index = history.findIndex(h => h.id === requestId);
    const active = getActivePickDropRequest();

    const current = index !== -1 ? history[index] : (active && active.id === requestId ? active : null);
    if (!current) return null;

    const updated: PickDropRequest = {
      ...current,
      status: 'PENDING',
      driverName: undefined,
      driverPhone: undefined,
      driverVehicleNo: undefined
    };

    saveActivePickDropRequest(updated);
    window.dispatchEvent(new CustomEvent('duyar_pickdrop_updated', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Failed to release pick drop request to pending:', e);
    return null;
  }
};

// Delete or cancel a pick & drop request
export const deletePickDropRequest = (requestId: string): boolean => {
  try {
    const history = getAllPickDropHistory();
    const filtered = history.filter(h => h.id !== requestId);
    if (filtered.length === history.length) return false;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));

    const active = getActivePickDropRequest();
    if (active && active.id === requestId) {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('duyar_pickdrop_updated', { detail: { id: requestId, deleted: true } }));
    return true;
  } catch (e) {
    console.error('Failed to delete pick drop request:', e);
    return false;
  }
};




