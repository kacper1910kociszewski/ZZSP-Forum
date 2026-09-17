import { useState } from 'react';
import { Link } from 'react-router-dom';

// The exact markdown a student must write so the server parser reads it correctly.
// Built as an array of lines (double-quoted) so backticks and code fences stay literal.
const TEMPLATE = [
  '# Binary Search — what is it',
  'Binary search finds the position of a value inside a **sorted** array in `O(log n)` time.',
  'It splits the search interval in half every step and drops the side that cannot hold the target.',
  '',
  '## How it works (important)',
  '- The array **must be sorted** before searching.',
  '- Compare the target with the middle element.',
  '- If equal, return that index.',
  '- If the target is smaller, search the left half; otherwise the right half.',
  '- Complexity: `O(log n)` time, `O(1)` space (iterative).',
  '',
  '## Visual representation',
  'Three pointers move toward the answer:',
  '',
  'array = [1, 3, 5, 7, 9, 11, 13],   target = 7',
  'lo = 0, hi = 6, mid = 3 -> array[3] = 7 == target  => found at index 3',
  '',
  '## Example usage in C++',
  '```cpp',
  '#include <vector>',
  'using namespace std;',
  '',
  'int binarySearch(vector<int>& a, int target) {',
  '    int lo = 0, hi = (int)a.size() - 1;',
  '    while (lo <= hi) {',
  '        int mid = lo + (hi - lo) / 2;',
  '        if (a[mid] == target) return mid;',
  '        if (a[mid] < target) lo = mid + 1;',
  '        else hi = mid - 1;',
  '    }',
  '    return -1;',
  '}',
  '```',
  '',
].join('\n');

const HEADINGS = [
  ['First `#` heading', 'Title + intro — what the algorithm is'],
  ['Heading containing "important"', 'Important information section'],
  ['Heading containing "visual"', 'Visual representation section'],
  ['Heading containing "c++" or "example usage"', 'C++ code section (syntax highlighted)'],
  ['Any other heading', 'Generic text section'],
];

const RULES = [
  'Save the file with a `.md` extension — no other file type is accepted.',
  'The first `#` heading becomes the entry title and intro, so write "Name + what it is".',
  'Start each new part with its own top-level `#` heading — every heading begins a new block.',
  'Wrap C++ code in ```cpp fences so it gets syntax highlighting.',
  'You do not need to add tags — the teacher assigns difficulty, language, category and exam when reviewing your submission.',
  'Link images by full URL or keep them in the server data folder — plain relative image paths are not uploaded with the file.',
];

const MISTAKES = [
  'Using `##` for everything so each line becomes its own tiny section — use `#` for main sections.',
  'Writing ``` without a language, so C++ code is shown unhighlighted.',
  'Putting tags as comments instead of a front-matter block, so they never become filterable chips.',
  'Typo in a difficulty name — pick one from the tag picker (Easy / Medium / Hard …).',
];

export default function Guide() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(TEMPLATE);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = TEMPLATE;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([TEMPLATE], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'algo-template.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="guide">
      <h1 className="post-title">Markdown standard</h1>
      <p className="guide-sub">
        Every entry is just a <code>.md</code> file. This page explains the exact format so the parser turns it into a nice page automatically.
      </p>

      <div className="desc-panel">
        <h2 className="section-title">Rules</h2>
        <ul className="rule-list">
          {RULES.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>

      <div className="desc-panel">
        <h2 className="section-title">Template</h2>
        <p className="muted">Copy this, rename it to something like <code>binary_search.md</code>, fill it in, and upload it.</p>
        <div className="copy-actions">
          <button type="button" className="btn btn-upload" onClick={copy}>{copied ? 'Copied!' : 'Copy template'}</button>
          <button type="button" className="btn btn-ghost" onClick={download}>Download .md</button>
          <Link to="/upload" className="btn btn-ghost">Go to upload →</Link>
        </div>
        <pre className="prism-code"><code>{TEMPLATE}</code></pre>
      </div>

      <div className="desc-panel">
        <h2 className="section-title">How headings are parsed</h2>
        <p className="muted">Each top-level heading becomes a section. The keyword it contains decides how it is shown.</p>
        <table className="spec-table">
          <thead>
            <tr><th>Heading contains…</th><th>Becomes…</th></tr>
          </thead>
          <tbody>
            {HEADINGS.map((h, i) => (
              <tr key={i}><td><code>{h[0]}</code></td><td>{h[1]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="desc-panel">
        <h2 className="section-title">Tags are assigned by the teacher</h2>
        <p className="muted">You don't write any tags. When a teacher reviews your submission they set four things from the tag picker:</p>
        <ul className="rule-list">
          <li><strong>Difficulty</strong> — e.g. Easy, Medium, Hard (each can be its own colored chip).</li>
          <li><strong>Languages</strong> — e.g. C++.</li>
          <li><strong>Categories</strong> — e.g. Arrays, Sorting.</li>
          <li><strong>Exams</strong> — e.g. INF-03, INF-04.</li>
        </ul>
        <p className="muted">These become the colored chips under each entry and make it filterable on the Browse page.</p>
      </div>

      <div className="desc-panel">
        <h2 className="section-title">Common mistakes</h2>
        <ul className="mistake-list">
          {MISTAKES.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </div>
    </section>
  );
}