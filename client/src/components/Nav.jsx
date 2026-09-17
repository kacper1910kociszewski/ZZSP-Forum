import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { getPending } from '../api.js';

export default function Nav() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    getPending()
      .then((d) => setPendingCount(d.pending.length))
      .catch(() => {});
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return (
    <header className="nav">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">ZZSP</span>
        ZZSP Forum
      </Link>

      <div className="nav-spacer" />

      <nav className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Browse</NavLink>
        <NavLink to="/guide" className={({ isActive }) => (isActive ? 'active' : '')}>Guide</NavLink>
        <NavLink to="/moderate" className={({ isActive }) => (isActive ? 'active' : '')}>
          Moderation
          {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
        </NavLink>
      </nav>

      <div className="nav-actions">
        <Link to="/upload" className="btn btn-upload">Upload</Link>
        <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
