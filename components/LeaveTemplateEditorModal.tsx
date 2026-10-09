'use client';

import CautionModal from '@/components/CautionModal';

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
  return (
    <CautionModal
      title="Unsaved Template Changes"
      cancelLabel="Keep Editing"
      onCancel={onCancel}
      actions={[
        { label: 'Discard Changes', busyLabel: 'Discarding...', kind: 'danger', onClick: onDiscard },
        { label: 'Save Changes', busyLabel: 'Saving...', kind: 'primary', onClick: onSave },
      ]}
    >
      <p className="text-sm confirm-modal-item leading-relaxed">
        You changed the layout of <strong className="confirm-modal-item-name">&quot;{templateName}&quot;</strong>. Save
        those changes to the template, or discard them to put the layout back as it was when you opened the editor.
      </p>
    </CautionModal>
  );
}
