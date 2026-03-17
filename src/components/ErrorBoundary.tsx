import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props  { children: ReactNode; fallback?: ReactNode; }
interface State  { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Could wire to Sentry here in future
    console.error('[Spitfact ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          textAlign: 'center',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>⚠️</div>

        <h2
          className="font-heading"
          style={{ fontSize: 20, fontWeight: 700, color: '#F5F5F5', margin: 0 }}
        >
          Something went wrong
        </h2>

        <p style={{ fontSize: 14, color: '#8A9BB8', maxWidth: 320, margin: 0 }}>
          An unexpected error occurred. Try refreshing the page — your data is safe.
        </p>

        {this.state.error && (
          <details style={{ marginTop: 8 }}>
            <summary style={{
              fontSize: 12, color: '#536280', cursor: 'pointer',
              fontFamily: 'Roboto Mono, monospace',
            }}>
              Error details
            </summary>
            <pre style={{
              marginTop: 8, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(11,30,61,0.8)',
              border: '1px solid rgba(239,68,68,0.2)',
              fontSize: 11, color: '#f87171',
              fontFamily: 'Roboto Mono, monospace',
              textAlign: 'left', maxWidth: 480,
              overflowX: 'auto', whiteSpace: 'pre-wrap',
            }}>
              {this.state.error.message}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            className="btn btn-gold btn-md"
            onClick={() => window.location.reload()}
          >
            Refresh page
          </button>
          <a
            href="#/"
            className="btn btn-subtle btn-md"
            style={{ textDecoration: 'none' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
