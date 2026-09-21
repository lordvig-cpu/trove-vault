'use client';

import React from 'react';

interface ItemModalShellProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  /** Render the subtitle in the small monospace style (used for ids). */
  monoSubtitle?: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  error: string | null;
  children: React.ReactNode;
}

/**
 * The frame both item modals share: backdrop, header with close button, a scrolling form body, and
 * a footer that stays in view with the error message and the Cancel / submit buttons.
 */
export default function ItemModalShell({
  title,
  subtitle,
  monoSubtitle = false,
  onClose,
  onSubmit,
  submitting,
  submitLabel,
  submittingLabel,
  error,
  children,
}: ItemModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 item-modal-backdrop flex items-center justify-center p-4">
      <div className="item-modal-dialog rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="item-modal-header flex items-center justify-between p-5 shrink-0">
          <div>
            <h2 className="text-base font-bold item-modal-primary-text">{title}</h2>
            <p className={`item-modal-muted ${monoSubtitle ? 'text-[11px] font-mono' : 'text-xs'}`}>{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 min-h-0 flex flex-col">
          {/* Form body (scrolls) */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">{children}</div>

          {/* Footer (always visible): error and actions */}
          <div className="px-5 pb-5 pt-4 shrink-0 item-modal-property-divider space-y-3">
            {error && (
              <div role="alert" className="item-modal-error p-3 text-xs rounded-lg">
                {error}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="item-modal-primary-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
              >
                {submitting ? submittingLabel : submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
