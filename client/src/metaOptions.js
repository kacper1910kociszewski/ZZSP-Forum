// Persisted, editable category option lists (host-only, stored in localStorage).
// Difficulty / language / category / exam options can be added to by the teacher.
const KEYS = {
  difficulty: 'zzsp.opts.difficulty',
  languages: 'zzsp.opts.languages',
  categories: 'zzsp.opts.categories',
  exams: 'zzsp.opts.exams',
};

// Legacy singular keys, kept only to migrate data saved by earlier versions.
const LEGACY_KEYS = {
  languages: 'zzsp.opts.language',
  categories: 'zzsp.opts.category',
  exams: 'zzsp.opts.exam',
};

const DEFAULTS = {
  difficulty: ['Easy', 'Medium', 'Hard'],
  languages: ['C++'],
  categories: [],
  exams: ['INF-03', 'INF-04'],
};

function load(kind) {
  try {
    const raw = localStorage.getItem(KEYS[kind]);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt storage */ }
  // Migrate legacy singular keys to the plural form so earlier options survive.
  const legacy = LEGACY_KEYS[kind];
  if (legacy) {
    try {
      const raw = localStorage.getItem(legacy);
      if (raw) {
        const arr = JSON.parse(raw);
        save(kind, arr);
        return arr;
      }
    } catch { /* ignore corrupt storage */ }
  }
  return DEFAULTS[kind].slice();
}

function save(kind, arr) {
  try { localStorage.setItem(KEYS[kind], JSON.stringify(arr)); } catch { /* ignore */ }
}

export function getOptions(kind) {
  return load(kind);
}

// Add a new option (deduped, trimmed). Returns the updated list.
export function addOption(kind, value) {
  const v = String(value || '').trim();
  if (!v) return load(kind);
  const arr = load(kind);
  if (!arr.includes(v)) arr.push(v);
  save(kind, arr);
  return arr;
}

export function removeOption(kind, value) {
  const arr = load(kind).filter((x) => x !== value);
  save(kind, arr);
  return arr;
}

// Difficulty chips are color-coded. Known levels get semantic colors; custom
// ones cycle through a small palette so they stay distinguishable.
const KNOWN_COLORS = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
};

const FALLBACK = ['#3b82f6', '#a855f7', '#14b8a6', '#ec4899', '#f97316', '#6366f1'];

export function difficultyColor(name) {
  const key = String(name || '').trim();
  if (KNOWN_COLORS[key]) return KNOWN_COLORS[key];
  // Deterministic color from the name so the same custom level always looks alike.
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK[Math.abs(hash) % FALLBACK.length];
}
