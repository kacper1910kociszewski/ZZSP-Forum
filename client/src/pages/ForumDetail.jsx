import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../components/CodeBlock.jsx';
import { getForum, getPendingForum, deleteForum } from '../api.js';
import { difficultyColor } from '../metaOptions.js';

const components = {
  code: ({ className, children }) => <CodeBlock className={className} children={children} />,
};

export default function ForumDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Previewing a queued (not-yet-published) submission from the moderation page.
  const isPending = searchParams.get('preview') === 'pending';
  const [forum, setForum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (isPending ? getPendingForum(slug) : getForum(slug))
      .then((f) => { setForum(f); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [slug, isPending]);

  async function handleDelete() {
    if (!confirm(`Delete "${forum.title}"? This cannot be undone.`)) return;
    try {
      await deleteForum(slug);
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (error || !forum) return <p className="error">{error || 'Not found'}</p>;

  const { title, sections } = forum;
  const intro = sections[0];
  const rest = sections.slice(1);

  return (
    <article className="detail">
      <div className="detail-head">
        <Link to="/" className="back">← All algorithms</Link>
        {!isPending && forum.canDelete && (
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        )}
      </div>

      <h1 className="post-title">{title}</h1>

      {forum.meta && Object.keys(forum.meta).length > 0 && (
        <div className="meta-bar">
          {(Array.isArray(forum.meta.difficulty) ? forum.meta.difficulty : [forum.meta.difficulty])
            .filter(Boolean)
            .map((d) => (
              <span key={d} className="chip chip-diff" style={{ '--chip-bg': difficultyColor(d) }}>
                🎯 {d}
              </span>
            ))}
          {(forum.meta.languages || []).map((l) => (
            <span key={l} className="chip chip-lang">{l}</span>
          ))}
          {(forum.meta.categories || []).map((c) => (
            <span key={c} className="chip cat-tag">{c}</span>
          ))}
          {(forum.meta.exams || []).map((e) => (
            <span key={e} className="chip chip-exam">📚 {e}</span>
          ))}
        </div>
      )}

      <div className="desc-panel">
        {intro && intro.markdown && (
          <section className={`block block-intro ${intro.type}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{intro.markdown}</ReactMarkdown>
          </section>
        )}

        {rest.map((s, i) => (
          <section key={i} className={`block block-${s.type}`}>
            {s.heading && <h2 className="section-title">{s.heading}</h2>}
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{s.markdown}</ReactMarkdown>
          </section>
        ))}
      </div>
    </article>
  );
}
