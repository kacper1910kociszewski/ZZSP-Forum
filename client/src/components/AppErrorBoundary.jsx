import { Component } from 'react';

// Catches render-time errors so one broken subtree (e.g. a bad modal) blanks the
// whole app. Shows a friendly message + the error instead of a white screen, which
// also makes bugs like the old Accept crash visible instead of silent.
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught an error:', error, info);
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;
    if (!error) return children;
    return (
      <div className="desc-panel error">
          <h1 className="page-title">Something went wrong</h1>
          <p className="muted">A component threw while rendering. Reload the page to continue.</p>
          <pre style={{ whiteSpace: 'wrap', color: '#fca5a5', marginTop: 12 }}>
            {error && error.message ? error.message : String(error)}
          </pre>
          <button className="btn btn-upload" onClick={() => window.location.reload()} style={{ marginTop: 12 }}>
            Reload page
          </button>
        </div>
    );
  }
}
