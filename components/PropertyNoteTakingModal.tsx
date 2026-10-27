import React, { useState, useEffect } from 'react';
import { 
  getPropertyNotes, 
  savePropertyNote, 
  deletePropertyNote, 
  PropertyNote 
} from '../propertyNotesStorage';
import { haptics } from '../haptics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPropertyTitle?: string;
  initialLocation?: string;
}

export const PropertyNoteTakingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialPropertyTitle = '',
  initialLocation = ''
}) => {
  const [notesList, setNotesList] = useState<PropertyNote[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  const [title, setTitle] = useState(initialPropertyTitle || '');
  const [location, setLocation] = useState(initialLocation || '');
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState({
    waterPressure: true,
    electricalSafety: true,
    naturalLight: true,
    noiseLevel: false,
    parkingSpace: true,
    securityGuard: true
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNotesList(getPropertyNotes());
      if (initialPropertyTitle) setTitle(initialPropertyTitle);
      if (initialLocation) setLocation(initialLocation);
    }
  }, [isOpen, initialPropertyTitle, initialLocation]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a property name or address.');
      return;
    }

    haptics.bookingConfirmed();
    savePropertyNote({
      propertyTitle: title.trim(),
      location: location.trim() || 'Dhaka',
      notes: notes.trim(),
      checklist
    });

    setSavedSuccess(true);
    setNotesList(getPropertyNotes());
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('list');
    }, 900);
  };

  const handleDelete = (id: string) => {
    haptics.selection();
    deletePropertyNote(id);
    setNotesList(getPropertyNotes());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-3xl bg-[#0a1211] border border-primary/30 shadow-2xl text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                Property Inspection Notes
                <span className="text-[9px] uppercase font-black bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">
                  PWA Note Taking
                </span>
              </h2>
              <p className="text-[11px] text-[#92c9c9]">Inspect, checklist, and record offline notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-[#102220]">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            New Inspection Note
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            Saved Notes ({notesList.length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'create' ? (
            <div className="space-y-4">
              {/* Property Title & Location */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-primary">Property / Apartment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Green Luxury Residency, Flat 4B"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-primary">Area / Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Dhanmondi, Road 8/A"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Inspection Checklist */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-primary">Physical Inspection Checklist</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'waterPressure', label: 'Strong Water Pressure' },
                    { key: 'electricalSafety', label: 'Circuit Breaker / Wiring OK' },
                    { key: 'naturalLight', label: 'Ample Natural Sunlight' },
                    { key: 'noiseLevel', label: 'Quiet / Low Road Noise' },
                    { key: 'parkingSpace', label: 'Dedicated Car Parking' },
                    { key: 'securityGuard', label: '24/7 Security Guard' }
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => {
                        haptics.selection();
                        setChecklist((prev: any) => ({ ...prev, [item.key]: !prev[item.key] }));
                      }}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        (checklist as any)[item.key]
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-white/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {(checklist as any)[item.key] ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes TextArea */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-primary">Inspection Observations & Landlord Terms</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Write your notes here... (e.g. advance deposit terms, balcony view, elevator brand, maintenance fee)"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-3 rounded-xl bg-primary text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{savedSuccess ? 'Saved to Offline Storage!' : 'Save Inspection Note'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {notesList.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <span className="material-symbols-outlined text-4xl text-white/20 mb-2">note_add</span>
                  <p className="text-sm">No inspection notes saved yet.</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-3 text-xs text-primary font-bold hover:underline"
                  >
                    Create your first note &rarr;
                  </button>
                </div>
              ) : (
                notesList.map((note) => (
                  <div key={note.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{note.propertyTitle}</h4>
                        <p className="text-xs text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          {note.location}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-white/40 hover:text-rose-400 p-1 transition-colors"
                        title="Delete Note"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>

                    {note.notes && (
                      <p className="text-xs text-[#92c9c9] bg-black/30 p-2.5 rounded-xl border border-white/5">
                        {note.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(note.checklist || {})
                        .filter(([_, val]) => val)
                        .map(([key]) => (
                          <span key={key} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✓ {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </span>
                        ))}
                    </div>

                    <div className="text-[10px] text-white/30 pt-1">
                      Saved {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyNoteTakingModal;
