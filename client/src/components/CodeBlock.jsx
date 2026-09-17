import { Highlight, themes } from 'prism-react-renderer';

const KNOWN = ['cpp', 'c', 'javascript', 'js', 'typescript', 'ts', 'python', 'py', 'rust', 'go', 'java', 'text'];

// prism-react-renderer v2 gives `tokens` as a 2D array: tokens[lineIndex] is an
// array of leaf tokens { types: string[], content: string }. Its normalizeTokens
// only inserts "\n" for blank lines, so it does NOT emit line breaks between
// normal non-empty lines — without the explicit "\n" below every code block
// collapses onto a single overflowing line. We add one per rendered line.
export default function CodeBlock({ className, children }) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const lang = KNOWN.includes(language) ? language : 'text';
  const code = String(children).replace(/\n$/, '');

  return (
    <Highlight theme={themes.oneDark} code={code} language={lang}>
      {({ tokens, style, getLineProps, getTokenProps }) => (
        <pre className={`prism-code language-${lang}`} style={style}>
          <code>
            {tokens.map((line, i) => (
              <span key={i} {...getLineProps({ line })}>
                {line.map((token, j) => (
                  <span key={j} {...getTokenProps({ token })}>{token.content}</span>
                ))}
                {"\n"}
              </span>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}
