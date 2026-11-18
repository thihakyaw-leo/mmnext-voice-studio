/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface FirebaseErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class FirebaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  FirebaseErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): FirebaseErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected application error.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      let parsedReason = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed && typeof parsed.error === 'string') {
          parsedReason = `${parsed.operationType?.toUpperCase() || 'FIRESTORE'} (${parsed.path || 'unknown'}): ${parsed.error}`;
        }
      } catch {
        // Keep plain message
      }

      return (
        <div className="min-h-screen w-screen bg-[#FDF7EB] dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/95 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 rounded-3xl p-6 shadow-xl text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Something went wrong</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 break-words leading-relaxed">
              {parsedReason}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 dark:bg-indigo-600 text-[#FDF7EB] dark:text-white text-xs font-medium hover:bg-zinc-700 dark:hover:bg-indigo-500 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;
