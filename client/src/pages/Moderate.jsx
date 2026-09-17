import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPending, rejectForum } from '../api.js';
import CategoryModal from '../components/CategoryModal.jsx';

// True when the page is opened over a non-loopback address (LAN IP, Tailscale IP,
// or a hostname). The server only trusts loopback as "host", so moderation
// cannot work over a network address; we tell the user where to open it instead.
function looksRemoteHost() {
  const h = (window.location.hostname || '').toLowerCase();
  if (!h) return false; // relative/proxy path -> served through Vite -> fine
  if (h === 'localhost') return false;
  if (h === '::1') return false;
  if (/^127\.\d{1,3}(\.\d{1,3}){2}$/.test(h)) return false;
  return true;
}

export default function Moderate() {
  const [canDelete, setCanDelete] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [pendingItem, setPendingItem] = useState(null);

  async function load() {
    try {
      const d = await getPending();
      setCanDelete(d.canDelete);
      setItems(d.pending);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function flash(msg) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2500);
  }

  // Open the category editor; approval happens inside the modal so the teacher
  // assigns difficulty / language / category / exam before it goes live.
  function handleAccept(slug, title) {
    setPendingItem({ slug, title });
  }

  async function handleReject(slug, title) {
    if (!confirm(`Reject and delete “${title}”? This cannot be undone.`)) return;
    try {
      await rejectForum(slug);
      flash(`Rejected “${title}”.`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <p className="muted">Loading submissions…</p>;

  return (
    <section className="moderate desc-panel">
      <div className="moderate-head">
        <h1 className="page-title">Moderation</h1>
        <span className="muted">Review algorithm submissions before they go live.</span>
      </div>

      {message && <p className="status">{message}</p>}
      {error && <p className="error">{error}</p>}

      {looksRemoteHost() && (
        <p className="host-note remote-host">
          ⚠️ You opened moderation over your network/Tailscale address, so you can't approve or
          reject submissions here. Moderation only runs on the machine hosting the server — open
          <strong> http://localhost:5173/moderate </strong>
          on that computer.
        </p>
      )}

      {!canDelete && !looksRemoteHost() && (
        <p className="host-note muted">
          You are not on the host machine, so you cannot approve or reject submissions.
          Open this page at <strong>http://localhost:5173/moderate</strong> on the computer running the server.
        </p>
      )}

      {items.length === 0 ? (
        <div className="moderate-empty">
          <p className="muted">No submissions awaiting approval.</p>
          <Link to="/upload" className="btn btn-upload">Upload one</Link>
        </div>
      ) : (
        <>
        <div className="cat-summary muted">
          💡 Click <strong>Accept</strong> to assign difficulty, language, category and exam tags before publishing.
        </div>
        <div className="lc-table">
          <div className="lc-table-head">
            <span className="lc-col-title">Title</span>
            <span className="lc-col-status">Actions</span>
          </div>
          {items.map((f) => (
            <div key={f.slug} className="lc-row moderate-row">
              <span className="lc-col-title">
                <Link to={`/forum/${f.slug}?preview=pending`} target="_blank" rel="noreferrer">{f.title}</Link>
              </span>
              <span className="lc-col-status">
                <button className="btn btn-accept" onClick={() => handleAccept(f.slug, f.title)}>Accept</button>
                <button className="btn btn-reject" onClick={() => handleReject(f.slug, f.title)}>Reject</button>
              </span>
            </div>
          ))}
        </div>
        </>
      )}

      {pendingItem && (
        <CategoryModal
          slug={pendingItem.slug}
          title={pendingItem.title}
          onClose={() => setPendingItem(null)}
          onApproved={() => { flash(`“${pendingItem.title}” published with tags.`); setPendingItem(null); load(); }}
        />
      )}
    </section>
  );
}
