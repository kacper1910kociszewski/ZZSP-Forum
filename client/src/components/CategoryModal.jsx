import { useState } from 'react';
import { getOptions, addOption, removeOption, difficultyColor } from '../metaOptions.js';
import { approveForum } from '../api.js';

// Seed defaults so "Publish" works without the teacher touching anything.
function seed() {
  return {
    // Stored as an array like the other fields so multi-select works and
    // multiple difficulties render as separate chips.
    difficulty: [getOptions('difficulty')[0] || 'Easy'],
    languages: ['C++'],
    categories: [],
    exams: ['INF-03', 'INF-04'],
  };
}

export default function CategoryModal({ slug, title, onClose, onApproved }) {
  const [meta, setMeta] = useState(seed);
  const [adding, setAdding] = useState({ difficulty: '', languages: '', categories: '', exams: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function setField(field, value) {
    setMeta((m) => ({ ...m, [field]: value }));
  }

  function toggleList(field, value) {
    setMeta((m) => {
      const cur = m[field];
      return { ...m, [field]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
    });
  }

  function commit(kind) {
    const val = adding[kind];
    if (!val.trim()) return;
    addOption(kind, val);
    setMeta((m) => ({ ...m, [kind]: [...new Set([...m[kind], val.trim()])] }));
    setAdding((a) => ({ ...a, [kind]: '' }));
  }

  async function publish() {
    setBusy(true);
    setError(null);
    try {
      const result = await approveForum(slug, meta);
      onApproved(result);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const kinds = [
    { key: 'difficulty', label: 'Difficulty', multi: true, colorize: true },
    { key: 'languages', label: 'Language', multi: true, colorize: false },
    { key: 'categories', label: 'Category', multi: true, colorize: false },
    { key: 'exams', label: 'For the exam', multi: true, colorize: false },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="modal-eyebrow">Assign before publishing</p>
            <h2 className="modal-title">{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cancel">×</button>
        </div>

        <div className="modal-body">
          {kinds.map((k) => (
            <div key={k.key} className="cat-row">
              <span className="cat-label">{k.label}</span>
              <div className="chip-group">
                {getOptions(k.key).map((opt) => {
                  const selected = meta[k.key].includes(opt);
                  const chipClass = k.colorize && selected ? `chip chip-diff` : 'chip';
                  return (
                    <button
                      key={opt}
                      type="button"
                      className={`${chipClass}${selected ? ' on' : ''}`}
                      style={selected && k.colorize ? { '--chip-bg': difficultyColor(opt) } : undefined}
                      onClick={() => toggleList(k.key, opt)}
                    >
                      {opt}
                      <span
                        className="chip-x"
                        title="Remove this option entirely"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(k.key, opt);
                          setField(k.key, meta[k.key].filter((x) => x !== opt));
                        }}
                      >
                        ×
                      </span>
                    </button>
                  );
                })}
                <div className="cat-add">
                  <input
                    type="text"
                    className="cat-add-input"
                    placeholder={`Add ${k.label.toLowerCase()}…`}
                    value={adding[k.key]}
                    onChange={(e) => setAdding((a) => ({ ...a, [k.key]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(k.key); } }}
                  />
                  <button type="button" className="btn btn-add" disabled={!adding[k.key].trim()} onClick={() => commit(k.key)}>
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))}

          {error && <p className="error">{error}</p>}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-upload" onClick={publish} disabled={busy}>
            {busy ? 'Publishing…' : 'Accept & publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
