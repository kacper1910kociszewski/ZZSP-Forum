import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '../components/CodeBlock.jsx';
import { uploadFile } from '../api.js';
import CategoryModal from '../components/CategoryModal.jsx';

const components = {
  code: ({ className, children }) => <CodeBlock className={className} children={children} />,
};

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [awaiting, setAwaiting] = useState(false);
  const [pendingSlug, setPendingSlug] = useState(null);
  const [pendingTitle, setPendingTitle] = useState('');

  function handleFile(f) {
    if (!f) return;
    // Only accept Markdown files; reject anything else with a clear red warning.
    const name = (f.name || '').toLowerCase();
    if (!name.endsWith('.md')) {
      setError('Only .md files are allowed — please choose a Markdown file.');
      setFile(null);
      setText('');
      return;
    }
    setFile(f);
    setText('');
    setError(null);
    f.text()
      .then((t) => setText(t))
      .catch(() => setError('Could not read this file'));
  }

  async function submit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const forum = await uploadFile(file);
      if (forum.canDelete) {
        // Host: queue the file for tag assignment, then open the same modal
        // used in moderation so teachers tag at upload time.
        setPendingSlug(forum.slug);
        setPendingTitle(forum.title || forum.slug);
        return;
      }
      if (forum.pending) { setAwaiting(true); }
      else { navigate(`/forum/${forum.slug}`); }
    } catch (e) {
      setError(e.message);
    } finally {
      // Always clear the loading state so the button can be used again,
      // including right after opening the tag modal for host uploads.
      setUploading(false);
    }
  }

  function reset() {
    setFile(null);
    setText('');
    setError(null);
  }

  return (
    <section className="upload">
      <div className="desc-panel upload-card">
        <h1 className="upload-title">Upload an algorithm</h1>
        <p className="muted">Drop a <code>.md</code> file. The first <code>#</code> heading becomes the title.</p>
        <p className="muted">Not sure how to format it? See the <Link to="/guide" className="accent">markdown standard</Link> with a ready-to-copy template.</p>
        <p className="format-warning">⚠️ Only <code>.md</code> files are allowed — no other file format will be accepted.</p>

        <label
          className={`dropzone ${dragging ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            accept=".md,text/markdown"
            hidden
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {awaiting ? `📄 ${file?.name}` : file ? `📄 ${file.name}` : 'Click or drop your .md file here'}
        </label>

        {error && <p className="error">{error}</p>}

        {awaiting ? (
          <div className="awaiting">
            <p className="awaiting-title">⏳ Submitted for review</p>
            <p className="muted">Your file is awaiting approval. A teacher on the host machine will check it and assign categories before it appears in the forum.</p>
          </div>
        ) : file ? (
          <>
            <div className="preview">
              <div className="preview-head">
                <span className="preview-label">Preview — how it will look</span>
                <span className="muted preview-filename">{file.name}</span>
              </div>
              <div className="preview-body preview-render">
                {text ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{text}</ReactMarkdown>
                ) : (
                  <p className="muted">Reading file…</p>
                )}
              </div>
            </div>

            <div className="upload-actions">
              <button type="button" className="btn btn-ghost" onClick={reset}>Change file</button>
              <button type="button" className="btn btn-upload" onClick={submit} disabled={uploading || !text}>
                {uploading ? 'Submitting…' : 'Upload'}
              </button>
            </div>
          </>
        ) : (
          <p className="muted upload-hint">Select a file above to preview it before submitting.</p>
        )}
      </div>

      {pendingSlug && (
        <CategoryModal
          slug={pendingSlug}
          title={pendingTitle || pendingSlug}
          onClose={() => setPendingSlug(null)}
          onApproved={(res) => {
            setPendingSlug(null);
            navigate(`/forum/${res ? res.slug : pendingSlug}`);
          }}
        />
      )}
    </section>
  );
}
