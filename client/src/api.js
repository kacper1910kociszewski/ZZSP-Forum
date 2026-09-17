// Route API calls at the backend on port 4000.
// When the page is opened over the LAN (e.g. from a phone), window.location.hostname
// is the PC's IP, so we call the backend directly there. That keeps guest uploads
// queued for teacher approval instead of being treated as host via the localhost proxy.
// On plain localhost dev it falls back to relative paths served through Vite's proxy.
function apiBase() {
  const h = window.location.hostname;
  return h ? `http://${h}:4000` : '';
}
const BASE = apiBase();

export async function getForums() {
  const res = await fetch(`${BASE}/api/forums`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Failed to load forums');
  return res.json();
}

export async function getForum(slug) {
  const res = await fetch(`${BASE}/api/forums/${encodeURIComponent(slug)}`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Forum not found');
  return res.json();
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: fd, credentials: 'same-origin' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Upload failed');
  }
  return res.json();
}

export async function getPending() {
  const res = await fetch(`${BASE}/api/pending`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Failed to load submissions');
  return res.json();
}

export async function getPendingForum(slug) {
  const res = await fetch(`${BASE}/api/pending/${encodeURIComponent(slug)}`, { credentials: 'same-origin' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load submission');
  }
  return res.json();
}

export async function approveForum(slug, meta = {}) {
  const res = await fetch(`${BASE}/api/pending/${encodeURIComponent(slug)}/approve`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Approval failed');
  }
  return res.json();
}

export async function rejectForum(slug) {
  const res = await fetch(`${BASE}/api/pending/${encodeURIComponent(slug)}`, { method: 'DELETE', credentials: 'same-origin' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Rejection failed');
  }
}

export async function deleteForum(slug) {
  const res = await fetch(`${BASE}/api/forums/${encodeURIComponent(slug)}`, { method: 'DELETE', credentials: 'same-origin' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Delete failed');
  }
}
