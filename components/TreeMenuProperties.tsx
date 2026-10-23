'use client';

import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMenuFooter } from '@/components/TreeSubMenu';
import { errorMessage } from '@/lib/errors';
import { idleBtn, menuTextBtn } from '@/components/editorBarStyles';

/* ==========================================================================
   Pieces of the Items / Collections / Templates trees' Properties tabs, which edit something saved in the
   database. Unlike a template flyout's properties (which apply instantly, with undo), these are saved
   together with Save -- one all-or-nothing write -- or thrown away with Revert. They wear the template
   flyouts' look: the Container Name field's label, input and buttons, and ActionMenuSection cards.
   ========================================================================== */

/** A labelled control, laid out like a template flyout's Container Name. */
export function PropertyField({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 px-3 pb-2">
      <span className="menu-field-label text-[10px] font-semibold tracking-[0.04em] text-content-strong">
        {label}
        {required && <span className="text-danger-text"> *</span>}
      </span>
      {children}
    </label>
  );
}

/**
 * The end of a Properties tab: the last save's error, if it failed, then Revert and Save. Both only act
 * while there are unsaved changes; Save is the surrounding form's submit button, so the form's own
 * validation (required fields) runs first. It stays in view at the bottom while the tab scrolls.
 */
export function PropertiesSaveBar({
  formId,
  isDirty,
  saving,
  error,
  canSave = true,
  onRevert,
}: {
  /** The id of the form Save submits: the bar is drawn in the menu's footer, outside that form. */
  formId: string;
  isDirty: boolean;
  saving: boolean;
  error?: string | null;
  canSave?: boolean;
  onRevert: () => void;
}) {
  // Drawn in the menu's footer, on its bottom edge outside the scrolling content, when there is one
  const footer = useMenuFooter();
  const bar = (
    <div className="propertiesSaveBar">
      {error && (
        <p className="text-[11px] leading-snug text-danger-text" role="alert">
          {error}
        </p>
      )}
      <div className="actionMenuRenameActions">
        {isDirty && !saving && <span className="propertiesSaveHint">Unsaved changes</span>}
        <button type="button" onClick={onRevert} disabled={!isDirty || saving} className={`${menuTextBtn} ${idleBtn} disabled:opacity-40`}>
          Revert
        </button>
        <button type="submit" form={formId} disabled={!isDirty || saving || !canSave} className={`${menuTextBtn} menuBtnAction ${idleBtn} disabled:opacity-40`}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
  return footer ? createPortal(bar, footer) : bar;
}

/** The Properties tab of something whose only property today is its name (a collection, a template). */
export function NameProperties({ name, onSave }: { name: string; onSave: (nextName: string) => Promise<void> | void }) {
  const formId = useId();
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adjust state during render, not in an effect, when the saved name changes
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [prevName, setPrevName] = useState(name);
  if (prevName !== name) {
    setPrevName(name);
    setDraft(name);
  }

  const trimmed = draft.trim();
  const isDirty = draft !== name;
  const revert = () => {
    setDraft(name);
    setError(null);
  };

  return (
    <form
      id={formId}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!trimmed) return;
        if (trimmed === name) {
          setDraft(name); // only whitespace changed
          return;
        }
        setSaving(true);
        setError(null);
        try {
          await onSave(trimmed);
        } catch (err) {
          setError(errorMessage(err, 'Could not save the name'));
        } finally {
          setSaving(false);
        }
      }}
      className="pt-1"
    >
      <PropertyField label="Name" required>
        <input
          type="text"
          required
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && isDirty) {
              e.preventDefault();
              e.stopPropagation();
              revert();
            }
          }}
          className="actionMenuRenameInput"
        />
      </PropertyField>
      <PropertiesSaveBar formId={formId} isDirty={isDirty} saving={saving} error={error} canSave={Boolean(trimmed)} onRevert={revert} />
    </form>
  );
}
