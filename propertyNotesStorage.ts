export interface PropertyNote {
  id: string;
  propertyTitle: string;
  location: string;
  notes: string;
  checklist: {
    waterPressure: boolean;
    electricalSafety: boolean;
    naturalLight: boolean;
    noiseLevel: boolean;
    parkingSpace: boolean;
    securityGuard: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'duyar_property_inspection_notes';

export function getPropertyNotes(): PropertyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse property notes:', e);
    return [];
  }
}

export function savePropertyNote(note: Omit<PropertyNote, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): PropertyNote {
  const notes = getPropertyNotes();
  const now = new Date().toISOString();
  
  if (note.id) {
    const index = notes.findIndex((n) => n.id === note.id);
    if (index !== -1) {
      const updated = {
        ...notes[index],
        ...note,
        updatedAt: now
      };
      notes[index] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      return updated;
    }
  }

  const newNote: PropertyNote = {
    id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    propertyTitle: note.propertyTitle || 'Untitled Inspection Note',
    location: note.location || 'Dhaka',
    notes: note.notes || '',
    checklist: note.checklist || {
      waterPressure: false,
      electricalSafety: false,
      naturalLight: false,
      noiseLevel: false,
      parkingSpace: false,
      securityGuard: false
    },
    createdAt: now,
    updatedAt: now
  };

  notes.unshift(newNote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  return newNote;
}

export function deletePropertyNote(id: string): void {
  const notes = getPropertyNotes().filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
