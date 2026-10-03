import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          fontFamily: 'monospace',
          background: '#1a1a2e',
          color: '#e0e0e0',
          minHeight: '100vh'
        }}>
          <h1 style={{ color: '#ef4444', fontSize: '1.5rem' }}>⚠️ Application Error</h1>
          <pre style={{
            background: '#0d0d1a',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ef4444',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.85rem',
            maxHeight: '300px'
          }}>
            {this.state.error?.toString()}
          </pre>
          <h3 style={{ color: '#facc15', marginTop: '20px' }}>Component Stack:</h3>
          <pre style={{
            background: '#0d0d1a',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #facc15',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '0.8rem',
            maxHeight: '400px'
          }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 24px',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
