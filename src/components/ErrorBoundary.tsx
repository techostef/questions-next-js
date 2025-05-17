'use client';

import { sendErrorToServer } from '@/lib/error';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our API
    this.logErrorToServer(error, errorInfo);
  }

  logErrorToServer = async (error: Error, errorInfo: ErrorInfo): Promise<void> => {
   sendErrorToServer(error, {
     componentStack: errorInfo.componentStack
   });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 bg-red-50 rounded-lg shadow-md mx-auto my-8 max-w-md">
          <h2 className="text-2xl font-semibold text-red-700 mb-4">Something went wrong</h2>
          <p className="text-gray-700 mb-4">The application encountered an error. We&apos;ve been notified and will look into it.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded overflow-auto max-h-60">
              <p className="font-mono text-sm text-gray-800">{this.state.error.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
