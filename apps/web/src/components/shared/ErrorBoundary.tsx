import React from 'react';

interface ErrorBoundaryProps {
  /** Short label shown in the fallback, e.g. "Settings" */
  label: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Keeps one broken panel (RSS, voice, …) from blanking the whole app —
 * the KO original degraded per-feature, so the port should too.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.label}]`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="alert alert-warning my-2" role="alert">
          {this.props.label} hit an error and was disabled for this session.
          Reload the page to try again.
        </div>
      );
    }
    return this.props.children;
  }
}
