'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage } from '@/lib/errors';
import { CloseIcon, WarningIcon } from '@/components/icons/PanelIcons';

interface LeaveTemplateEditorModalProps {
  templateName: string;
  /** Keep the layout changes, then continue where the user was going. */
  onSave: () => Promise<void>;
  /** Put the layout back as it was, then continue. */
  onDiscard: () => Promise<void>;
  /** Stay in the editor. */
  onCancel: () => void;
}

/** Asked when leaving the template editor with unsaved layout changes: Save or Discard them first. */
export default function LeaveTemplateEditorModal({ templateName, onSave, onDiscard, onCancel }: LeaveTemplateEditorModalProps) {
  const [busy, setBusy] = useState<'save' | 'discard' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const run = async (which: 'save' | 'discard') => {
    setBusy(which);
    setError(null);
    try {
      await (which === 'save' ? onSave() : onDiscard());
    } catch (err) {
      setError(errorMessage(err, which === 'save' ? 'Failed to save the layout' : 'Failed to discard the changes'));
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
      <div role="alertdialog" aria-modal="true" aria-labelledby="leave-template-editor-title" className="confirm-modal-dialog rounded-2xl w-full max-w-md overflow-hidden">
        <div className="confirm-modal-header p-5 flex items-center justify-between">
          <div id="leave-template-editor-title" className="flex items-center gap-2 confirm-modal-caution-heading font-bold text-base">
            <WarningIcon />
            <span>Unsaved Template Changes</span>
          </div>
          <button type="button" onClick={onCancel} className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {error && <div className="confirm-modal-error p-3 text-xs rounded-lg">{error}</div>}
          <p className="text-sm confirm-modal-item leading-relaxed">
            You changed the layout of <strong className="confirm-modal-item-name">&quot;{templateName}&quot;</strong>. Save
            those changes to the template, or discard them to put the layout back as it was when you opened the editor.
          </p>
        </div>

        <div className="confirm-modal-footer flex items-center justify-end gap-2 p-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy !== null}
            className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            Keep Editing
          </button>
          <button
            type="button"
            onClick={() => run('discard')}
            disabled={busy !== null}
            className="item-modal-danger-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {busy === 'discard' ? 'Discarding...' : 'Discard Changes'}
          </button>
          <button
            type="button"
            onClick={() => run('save')}
            disabled={busy !== null}
            className="item-modal-primary-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {busy === 'save' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
