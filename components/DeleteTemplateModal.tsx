'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { errorMessage } from '@/lib/errors';

interface DeleteTemplateModalProps {
  templateName: string;
  /** Deletes the template; a thrown error is shown in the modal and keeps it open. */
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/** Styled confirmation for deleting a template, shared by the tree and editor menus. */
export default function DeleteTemplateModal({ templateName, onConfirm, onClose }: DeleteTemplateModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError(errorMessage(err, 'Failed to delete template'));
      setDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 confirm-modal-backdrop flex items-center justify-center p-4">
      <div className="confirm-modal-dialog rounded-2xl w-full max-w-md overflow-hidden">
        <div className="confirm-modal-header p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 confirm-modal-danger-heading font-bold text-base">
            <span>⚠️</span>
            <span>Delete Template</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="item-modal-cancel-button p-1 rounded-lg transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <div className="confirm-modal-error p-3 text-xs rounded-lg">{error}</div>}
          <p className="text-sm confirm-modal-item leading-relaxed">
            Are you sure you want to delete the template{' '}
            <strong className="confirm-modal-item-name">&quot;{templateName}&quot;</strong>? Its fields and
            saved layout are removed. Items that use it are kept.
          </p>
        </div>

        <div className="confirm-modal-footer flex items-center justify-end gap-2 p-5">
          <button
            type="button"
            onClick={onClose}
            className="item-modal-cancel-button px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="item-modal-danger-button px-4 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete Template'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
