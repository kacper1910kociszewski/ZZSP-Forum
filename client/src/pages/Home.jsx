import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getForums } from '../api.js';
import { difficultyColor } from '../metaOptions.js';

const EMPTY_FILTERS = () => ({ difficulty: new Set(), language: new Set(), category: new Set(), exam: new Set() });

export default function Home() {
  const [forums, setForums] = useState([]);
  const [facets, setFacets] = useState({ difficulties: [], languages: [], categories: [], exams: [] });
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getForums()
      .then((data) => { setForums(data.forums); setFacets(data.facets || EMPTY_FILTERS()); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  function toggle(type, value) {
    setFilters((f) => {
      const next = new Set(f[type]);
      next.has(value) ? next.delete(value) : next.add(value);
      return { ...f, [type]: next };
    });
  }

  function clearFilters() { setFilters(EMPTY_FILTERS()); }

  const activeCount = filters.difficulty.size + filters.language.size + filters.category.size + filters.exam.size;

  const filtered = forums.filter((f) => {
    const m = f.meta || {};
    if (query && !f.title.toLowerCase().includes(query.trim().toLowerCase())) return false;
    const _diffs = Array.isArray(m.difficulty) ? m.difficulty : (m.difficulty ? [m.difficulty] : []);
    if (filters.difficulty.size && !_diffs.some((d) => filters.difficulty.has(d))) return false;
    if (filters.language.size && !(m.languages || []).some((l) => filters.language.has(l))) return false;
    if (filters.category.size && !(m.categories || []).some((c) => filters.category.has(c))) return false;
    if (filters.exam.size && !(m.exams || []).some((e) => filters.exam.has(e))) return false;
    return true;
  });

  function chipRow(values, cls, prefix = '') {
    if (!values || values.length === 0) return null;
    return values.map((v) => (
      <span key={v} className={cls}>{prefix}{v}</span>
    ));
  }

  if (loading) return <p className="muted">Loading forums…</p>;
  if (error) return <p className="error">Could not load: {error}</p>;

  if (!forums.length) {
    return (
      <section className="empty">
        <h2>No algorithms yet</h2>
        <p className="muted">The forum is empty. Be the first to upload a markdown file.</p>
        <Link to="/upload" className="btn btn-upload">Upload one</Link>
      </section>
    );
  }

  return (
    <section className="list-page">
      <section className="hero">
        <div className="hero-text">
          <h1>Welcome to the <span className="accent">ZZSP</span> Algo Forum</h1>
          <p>A shared library of algorithms from our programming school. Browse entries written in markdown — each one explains the idea, shows a visual walkthrough, and includes ready-to-use C++ code.</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">{forums.length}</div>
              <div className="lbl">Algorithms</div>
            </div>
            <div className="hero-stat">
              <div className="num">C++</div>
              <div className="lbl">Example code</div>
            </div>
            <div className="hero-stat">
              <div className="num">Free</div>
              <div className="lbl">No login needed</div>
            </div>
          </div>
        </div>
      </section>

      <div className="list-head">
        <h1 className="list-title">Algorithms</h1>
        <input
          type="search"
          className="list-search"
          placeholder="Search algorithms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {(activeCount > 0 || facets.difficulties.length || facetHasAny(facets)) && (
        <div className="filter-bar">
          <span className="filter-label">Filter by</span>
          {facets.difficulties.length > 0 && (
            <div className="filter-group">
              <span className="filter-group-title">Difficulty</span>
              <div className="chip-group filter-chips">
                {facets.difficulties.map((d) => (
                  <button key={d} type="button"
                    className={`chip chip-diff${filters.difficulty.has(d) ? ' on' : ''}`}
                    style={filters.difficulty.has(d) ? { '--chip-bg': difficultyColor(d) } : undefined}
                    onClick={() => toggle('difficulty', d)}>{d}</button>
                ))}
              </div>
            </div>
          )}
          {facets.languages.length > 0 && (
            <div className="filter-group">
              <span className="filter-group-title">Language</span>
              <div className="chip-group filter-chips">
                {facets.languages.map((l) => (
                  <button key={l} type="button"
                    className={`chip chip-lang${filters.language.has(l) ? ' on' : ''}`}
                    onClick={() => toggle('language', l)}>{l}</button>
                ))}
              </div>
            </div>
          )}
          {facets.categories.length > 0 && (
            <div className="filter-group">
              <span className="filter-group-title">Category</span>
              <div className="chip-group filter-chips">
                {facets.categories.map((c) => (
                  <button key={c} type="button"
                    className={`chip cat-tag${filters.category.has(c) ? ' on' : ''}`}
                    onClick={() => toggle('category', c)}>{c}</button>
                ))}
              </div>
            </div>
          )}
          {facets.exams.length > 0 && (
            <div className="filter-group">
              <span className="filter-group-title">Exam</span>
              <div className="chip-group filter-chips">
                {facets.exams.map((e) => (
                  <button key={e} type="button"
                    className={`chip chip-exam${filters.exam.has(e) ? ' on' : ''}`}
                    onClick={() => toggle('exam', e)}>📚 {e}</button>
                ))}
              </div>
            </div>
          )}
          {activeCount > 0 && (
            <button type="button" className="btn btn-ghost btn-clear" onClick={clearFilters}>Clear ({activeCount})</button>
          )}
        </div>
      )}

      <div className="lc-table">
        <div className="lc-table-head">
          <span className="lc-col-title">Title</span>
          <span className="lc-col-status">Tags</span>
        </div>

        {filtered.length === 0 ? (
          <p className="list-empty">No algorithms match your filters.</p>
        ) : (
          filtered.map((f) => {
            const m = f.meta || {};
            return (
              <Link key={f.slug} to={`/forum/${f.slug}`} className="lc-row forum-row">
                <span className="lc-col-title">
                  <span className="lc-chevron" aria-hidden="true">›</span>
                  {f.title}
                </span>
                <span className="lc-col-status">
                  {m.difficulty && (
                    <div className="tag-line">
                      <span className="tag-label">Difficulty</span>
                      <span className="forum-chips">
                        {chipRow(Array.isArray(m.difficulty) ? m.difficulty : [m.difficulty], 'chip chip-diff')}
                      </span>
                    </div>
                  )}
                  {(m.languages || []).length > 0 && (
                    <div className="tag-line">
                      <span className="tag-label">Language</span>
                      <span className="forum-chips">{chipRow(m.languages, 'chip chip-lang')}</span>
                    </div>
                  )}
                  {(m.categories || []).length > 0 && (
                    <div className="tag-line">
                      <span className="tag-label">Category</span>
                      <span className="forum-chips">{chipRow(m.categories, 'chip cat-tag')}</span>
                    </div>
                  )}
                  {(m.exams || []).length > 0 && (
                    <div className="tag-line">
                      <span className="tag-label">Exam</span>
                      <span className="forum-chips">{chipRow(m.exams, 'chip chip-exam', '📚 ')}</span>
                    </div>
                  )}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

// True when any facet has options to show, even if no filter is active yet.
function facetHasAny(f) {
  return !!(f.difficulties.length || f.languages.length || f.categories.length || f.exams.length);
}
