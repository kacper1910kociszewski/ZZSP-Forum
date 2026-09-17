import express from 'express';
import multer from 'multer';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');          // published algorithms
const PENDING_DIR = path.join(__dirname, 'pending');    // awaiting teacher approval

await fs.mkdir(DATA_DIR, { recursive: true });
await fs.mkdir(PENDING_DIR, { recursive: true });

const app = express();
app.use(express.json());
// Allow the dev frontend (and phone accessing over LAN) to call the API cross-origin.
app.use(cors());
// Serve uploaded .md files and any images they reference so relative links work.
app.use('/uploads', express.static(DATA_DIR));

const storage = multer.diskStorage({
  // Every upload lands in the pending folder first so tags can be assigned by the
  // teacher (host) before it goes live — via moderation or the upload page itself.
  destination: (req, _file, cb) => cb(null, PENDING_DIR),
  filename: (req, file, cb) => {
    const base = path.basename(file.originalname).replace(/\.[^/.]+$/, '');
    let slug = slugify(base);
    if (!slug) slug = 'submission';
    // Avoid clobbering an existing published or pending file with the same name.
    let name = slug + '.md', i = 2;
    while (existsSync(path.join(DATA_DIR, name)) || existsSync(path.join(PENDING_DIR, name))) {
      name = `${slug}-${i}.md`;
      i++;
    }
    cb(null, name);
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.md')) cb(null, true);
    else cb(new Error('Only .md files are allowed'));
  },
});

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// --- Optional YAML front-matter (category metadata stored inside each .md) ---
function stripQuotes(v) {
  v = v.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

// Minimal YAML reader for our controlled format: `key: value` and `key: [a, b]`.
function parseYamlBlock(text) {
  const meta = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      meta[key] = inner ? inner.split(',').map(stripQuotes).filter(Boolean) : [];
    } else {
      meta[key] = stripQuotes(val);
    }
  }
  return meta;
}

function fmStr(v) {
  return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

// Build a front-matter block from category metadata (empty fields omitted).
function renderFrontMatter(meta) {
  const lines = [];
  if (meta.difficulty != null && meta.difficulty !== '') {
    // Difficulty may be a single value or an array of several levels.
    if (Array.isArray(meta.difficulty)) {
      const arr = meta.difficulty.filter((x) => x !== '');
      if (arr.length) lines.push('difficulty: [' + arr.map(fmStr).join(', ') + ']');
    } else {
      lines.push('difficulty: ' + fmStr(meta.difficulty));
    }
  }
  for (const k of ['languages', 'categories', 'exams']) {
    const arr = Array.isArray(meta[k]) ? meta[k].filter((x) => x !== '') : [];
    if (arr.length) lines.push(k + ': [' + arr.map(fmStr).join(', ') + ']');
  }
  return '---\n' + lines.join('\n') + (lines.length ? '\n' : '') + '---\n\n';
}

// Pull front-matter off the top of a markdown file; return { meta, body }.
function extractFrontMatter(md) {
  const m = md.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: {}, body: md };
  return { meta: parseYamlBlock(m[1]), body: md.slice(m[0].length) };
}

// Only requests coming from the host machine (localhost) may delete / approve.
function isLocalHost(req) {
  const ip = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '');
  return ip === '127.0.0.1' || ip === '::1';
}

// Split markdown into ordered sections by top-level headings (# ...).
function parseForum(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      if (cur) sections.push(cur);
      cur = { heading: h[1].trim(), body: [] };
    } else if (cur) {
      cur.body.push(line);
    }
  }
  if (cur) sections.push(cur);

  return sections.map((s, i) => ({
    type: i === 0 ? 'intro' : classify(s.heading),
    heading: s.heading,
    markdown: resolveImages(s.body.join('\n').trim()),
  }));
}

function classify(heading) {
  const h = heading.toLowerCase();
  if (h.includes('visual')) return 'visual';
  if (h.includes('important')) return 'important';
  if (/c\+\+|example usage/.test(h)) return 'code';
  return 'generic';
}

// Point relative image links at the served uploads folder.
function resolveImages(md) {
  return md.replace(/!\[[^\]]*\]\(([^)]+)\)/g, (_m, src) => {
    if (/^(https?:)?\//.test(src)) return _m;
    const name = path.basename(src);
    return `![](/uploads/${name})`;
  });
}

async function parsePath(file) {
  const raw = await fs.readFile(file, 'utf8');
  const { meta, body } = extractFrontMatter(raw);
  const sections = parseForum(body);
  return { slug: path.basename(file, '.md'), title: sections[0]?.heading ?? path.basename(file, '.md'), sections, meta };
}

// Full path for a base name that does not already exist in `dir`.
function uniquePath(dir, baseSlug) {
  let name = baseSlug + '.md', i = 2;
  while (existsSync(path.join(dir, name))) { name = `${baseSlug}-${i}.md`; i++; }
  return path.join(dir, name);
}

app.get('/api/forums', async (_req, res) => {
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith('.md'));
  const forums = await Promise.all(files.map(async (f) => {
    const slug = f.replace(/\.md$/, '');
    try {
      const forum = await parsePath(path.join(DATA_DIR, f));
      return { slug, title: forum.title, meta: forum.meta || {} };
    } catch {
      return { slug, title: slug, meta: {} };
    }
  }));
  // Aggregate the distinct tag values actually in use, so the front end can build
  // filter options that reflect real content (works for host and guest alike).
  const facets = { difficulties: new Set(), languages: new Set(), categories: new Set(), exams: new Set() };
  for (const f of forums) {
    const m = f.meta || {};
    // Normalize difficulty to an array so multiple levels are each counted as a facet.
    if (m.difficulty) (Array.isArray(m.difficulty) ? m.difficulty : [m.difficulty]).forEach((x) => facets.difficulties.add(x));
    (m.languages || []).forEach((x) => facets.languages.add(x));
    (m.categories || []).forEach((x) => facets.categories.add(x));
    (m.exams || []).forEach((x) => facets.exams.add(x));
  }
  res.json({ canDelete: isLocalHost(_req), forums, facets: {
    difficulties: [...facets.difficulties],
    languages: [...facets.languages],
    categories: [...facets.categories],
    exams: [...facets.exams],
  }});
});

app.get('/api/forums/:slug', async (req, res) => {
  const file = path.join(DATA_DIR, req.params.slug + '.md');
  try { await fs.access(file); } catch { return res.status(404).json({ error: 'Not found' }); }
  try {
    const forum = await parsePath(file);
    res.json({ ...forum, canDelete: isLocalHost(req) });
  } catch {
    res.status(400).json({ error: 'Could not parse this file' });
  }
});

// Upload. Host publishes instantly; everyone else queues for approval.
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No .md file was uploaded' });
  const isHost = isLocalHost(req);
  try {
    const forum = await parsePath(req.file.path);
    // Everything queues for tag assignment first. canDelete tells the front end
    // whether to open the tag modal (host) or show "awaiting review" (guest).
    res.json({ ...forum, canDelete: isHost, pending: true });
  } catch {
    await fs.unlink(req.file.path).catch(() => {});
    res.status(400).json({ error: 'Could not parse this file' });
  }
});

// List submissions awaiting approval (list is open; approve/reject are host-only).
app.get('/api/pending', async (_req, res) => {
  const files = (await fs.readdir(PENDING_DIR)).filter((f) => f.endsWith('.md'));
  const pending = await Promise.all(files.map(async (f) => {
    try {
      const { slug, title } = await parsePath(path.join(PENDING_DIR, f));
      return { slug, title };
    } catch {
      return null;
    }
  }));
  res.json({ canDelete: isLocalHost(_req), pending: pending.filter(Boolean) });
});

// Read one pending submission's full content. Host only (guests cannot preview queued files).
app.get('/api/pending/:slug', async (req, res) => {
  if (!isLocalHost(req)) return res.status(403).json({ error: 'Only the host can view submissions' });
  const file = path.join(PENDING_DIR, req.params.slug + '.md');
  try { await fs.access(file); } catch { return res.status(404).json({ error: 'Not found' }); }
  try {
    const forum = await parsePath(file);
    res.json({ ...forum, canDelete: true });
  } catch {
    res.status(400).json({ error: 'Could not parse this file' });
  }
});

// Approve -> move from pending into the published folder, writing category
// metadata (from req.body.meta) as front-matter. Host only.
app.post('/api/pending/:slug/approve', async (req, res) => {
  if (!isLocalHost(req)) return res.status(403).json({ error: 'Only the host can approve' });
  const src = path.join(PENDING_DIR, req.params.slug + '.md');
  try { await fs.access(src); } catch { return res.status(404).json({ error: 'Not found' }); }
  try {
    const raw = await fs.readFile(src, 'utf8');
    const { body } = extractFrontMatter(raw);
    const meta = (req.body && req.body.meta) || {};
    const destPath = uniquePath(DATA_DIR, req.params.slug);
    await fs.writeFile(destPath, renderFrontMatter(meta) + body.replace(/^\n+/, ''));
    await fs.unlink(src);
    res.json(await parsePath(destPath));
  } catch (e) {
    res.status(500).json({ error: 'Could not approve submission' });
  }
});

// Reject -> delete the pending file. Host only.
app.delete('/api/pending/:slug', async (req, res) => {
  if (!isLocalHost(req)) return res.status(403).json({ error: 'Only the host can reject' });
  const src = path.join(PENDING_DIR, req.params.slug + '.md');
  try { await fs.unlink(src); res.json({ ok: true }); }
  catch { res.status(404).json({ error: 'Not found' }); }
});

app.delete('/api/forums/:slug', async (req, res) => {
  if (!isLocalHost(req)) return res.status(403).json({ error: 'Only the host can delete' });
  const file = path.join(DATA_DIR, req.params.slug + '.md');
  try { await fs.unlink(file); res.json({ ok: true }); }
  catch { res.status(404).json({ error: 'Not found' }); }
});

// Turn multer / validation errors into JSON responses.
app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Upload failed' });
});

app.listen(PORT, () => console.log(`Forum server running on http://localhost:${PORT}`));
