const KEY_PREFIX = "dj_notes_";

export const StorageManager = {
  _key: (address) => KEY_PREFIX + address,

  load: (address) => {
    try {
      const raw = localStorage.getItem(KEY_PREFIX + address);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  save: (address, notes) => {
    localStorage.setItem(KEY_PREFIX + address, JSON.stringify(notes));
  },

  addNote: (address, entry) => {
    const notes = StorageManager.load(address);
    // avoid duplicates on re-render
    const exists = notes.find(n => n.id === entry.id);
    if (exists) return notes;
    const updated = [entry, ...notes];
    StorageManager.save(address, updated);
    return updated;
  },

  updateNote: (address, id, patch) => {
    const notes = StorageManager.load(address).map(n =>
      n.id === id ? { ...n, ...patch } : n
    );
    StorageManager.save(address, notes);
    return notes;
  },

  deleteNote: (address, id) => {
    const notes = StorageManager.load(address).filter(n => n.id !== id);
    StorageManager.save(address, notes);
    return notes;
  },

  genId: () => "note_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
};
