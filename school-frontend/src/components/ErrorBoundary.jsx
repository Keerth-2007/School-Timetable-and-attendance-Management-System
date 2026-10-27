import React from 'react';
import { IconAlertTriangle, IconRefreshCw } from './Icons';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card" style={{ maxWidth: 500, textAlign: 'center', padding: '2.5rem 2rem' }}>
            <div style={{ color: '#ef4444', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <IconAlertTriangle size={48} />
            </div>
            <h2 style={{ marginBottom: '0.5rem', color: '#0f172a' }}>Something went wrong</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {this.state.error?.message || 'An unexpected application error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn btn-primary"
            >
              <IconRefreshCw size={16} />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
