'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage } from '@/lib/errors';
import { CloseIcon, WarningIcon } from '@/components/icons/PanelIcons';

export interface CautionModalAction {
  label: string;
  /** Shown on the button while its action runs. */
  busyLabel?: string;
  kind: 'danger' | 'primary';
  /** A thrown error is shown in the dialog and keeps it open. */
  onClick: () => Promise<void> | void;
}

interface CautionModalProps {
  title: string;
  /** The cancel button's label ("Cancel", "Keep Editing"); Escape, the X and the backdrop do the same. */
  cancelLabel?: string;
  onCancel: () => void;
  /** Left to right after the cancel button; the last is the main one. */
  actions: CautionModalAction[];
  children: React.ReactNode;
}

/**
 * A "check before you go on" dialog, centered over the darkened app like the item modals, with an amber
 * caution heading: leaving the template editor with unsaved changes, deleting a container that holds things.
 */
export default function CautionModal({ title, cancelLabel = 'Cancel', onCancel, actions, children }: CautionModalProps) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const run = async (index: number) => {
    setBusy(index);
    setError(null);
    try {
      await actions[index].onClick();
    } catch (err) {
      setError(errorMessage(err, `${actions[index].label} failed`));
      setBusy(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 confirm-modal-backdrop flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="caution-modal-title" className="confirm-modal-dialog rounded-2xl w-full max-w-md overflow-hidden">
        <div className="confirm-modal-header p-5 flex items-center justify-between">
          <div id="caution-modal-title" className="flex items-center gap-2 confirm-modal-caution-heading font-bold text-base">
            <WarningIcon />
            <span>{title}</span>
          </div>
          <button type="button" onClick={onCancel} className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {error && <div className="confirm-modal-error p-3 text-xs rounded-lg">{error}</div>}
          {children}
        </div>

        <div className="confirm-modal-footer flex items-center justify-end gap-2 p-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy !== null}
            className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          {actions.map((action, index) => (
            <button
              key={action.label}
              type="button"
              onClick={() => run(index)}
              disabled={busy !== null}
              className={`${action.kind === 'danger' ? 'item-modal-danger-button' : 'item-modal-primary-button'} px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer`}
            >
              {busy === index && action.busyLabel ? action.busyLabel : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
