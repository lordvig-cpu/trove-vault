'use client';

import { useCallback, useState } from 'react';
import type { useTemplateEditor } from '@/hooks/useTemplateEditor';

type TemplateEditor = ReturnType<typeof useTemplateEditor>;

interface LeaveOptions {
  /** Close the editor before continuing (the default). False when what follows opens another
      template in the editor, which takes over the open editor instead. */
  closeEditor?: boolean;
}

/**
 * Leaving the template editor for something else (an item, another template) goes through here. With
 * no unsaved layout changes it simply closes the editor and continues; with some, it holds the
 * navigation and `prompt` asks to Save or Discard them first (or keep editing).
 */
export function useLeaveTemplateEditorGuard(templateEditor: TemplateEditor) {
  const [pending, setPending] = useState<{ next: () => void; closeEditor: boolean } | null>(null);
  const { isEditing, hasUnsavedLayoutChanges, stopEditing, saveLayoutChanges, discardLayoutChanges } = templateEditor;

  const leaveEditorThen = useCallback(
    (next: () => void, { closeEditor = true }: LeaveOptions = {}) => {
      if (!isEditing) {
        next();
        return;
      }
      if (hasUnsavedLayoutChanges()) {
        setPending({ next, closeEditor });
        return;
      }
      if (closeEditor) stopEditing();
      next();
    },
    [isEditing, hasUnsavedLayoutChanges, stopEditing]
  );

  const finish = useCallback(
    async (keep: boolean) => {
      if (!pending) return;
      await (keep ? saveLayoutChanges() : discardLayoutChanges());
      setPending(null);
      if (pending.closeEditor) stopEditing();
      pending.next();
    },
    [pending, saveLayoutChanges, discardLayoutChanges, stopEditing]
  );

  return {
    leaveEditorThen,
    prompt: pending
      ? {
          templateName: templateEditor.activeTemplate?.name ?? 'this template',
          onSave: () => finish(true),
          onDiscard: () => finish(false),
          onCancel: () => setPending(null),
        }
      : null,
  };
}
