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
        <div className="min-h-screen w-screen bg-[#FAF6EC] dark:bg-[#020E0B] text-[#06231B] dark:text-[#FAF6EC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#FAF6EC] dark:bg-[#06231B] border border-[#D9CEB8] dark:border-[#C6A259]/28 luminous-hairline rounded-3xl p-7 shadow-2xl text-center space-y-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EBE2CE] dark:bg-[#114637] border border-[#B49049]/40 dark:border-[#C6A259]/30 text-[#7D602D] dark:text-[#DFC589]">
              <AlertTriangle size={22} />
            </div>
            <h2 className="text-xl font-serif font-medium tracking-tight text-[#06231B] dark:text-[#FAF6EC]">
              Something went wrong
            </h2>
            <p className="text-xs text-[#3D5F53] dark:text-[#9EB5AC] break-words leading-relaxed">
              {parsedReason}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0D3A2E] hover:bg-[#145240] dark:bg-gradient-to-r dark:from-[#DFC589] dark:to-[#B49049] dark:hover:brightness-105 text-[#FAF6EC] dark:text-[#041813] border border-[#B49049]/40 text-xs font-semibold shadow-md transition-all"
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
