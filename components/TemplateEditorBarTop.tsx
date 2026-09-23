'use client';

import { PencilIcon, EyeIcon, UndoIcon, RedoIcon, SaveIcon } from '@/components/icons/LayoutIcons';
import {
  activeBtn,
  barControlHeight,
  barToggleBtn,
  barToggleGroup,
  disabledBtn,
  ghostBtn,
  idleBtn,
} from '@/components/editorBarStyles';

/* ==========================================================================
   Top row of the template editor bar.
   Left: template icon + name. Center: Edit / Preview toggle. Right: Undo / Redo, then Save.
   ========================================================================== */

const iconOnlyBtn = `w-[26px] ${barControlHeight} rounded-md border transition flex items-center justify-center shrink-0`;

interface TemplateEditorBarTopProps {
  icon?: string;
  name: string;
  canvasMode: 'edit' | 'preview';
  onToggleCanvasMode: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Leaves the editor (edits are already saved as they are made). */
  onSave: () => void;
}

export default function TemplateEditorBarTop({
  icon,
  name,
  canvasMode,
  onToggleCanvasMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
}: TemplateEditorBarTopProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-2.5 py-1.5 min-w-[30rem]">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-[26px] h-[26px] rounded-md bg-black/40 border border-[color-mix(in_oklch,var(--secondary-accent)_35%,transparent)] flex items-center justify-center text-sm shrink-0"
          aria-hidden="true"
        >
          {icon || '📦'}
        </span>
        <h1 className="text-[13px] font-bold text-white tracking-wide truncate max-w-[30ch]" title={name}>
          {name}
        </h1>
      </div>

      <div className={barToggleGroup} role="group" aria-label="Canvas mode">
        <button
          type="button"
          onClick={() => {
            if (canvasMode !== 'edit') onToggleCanvasMode();
          }}
          aria-pressed={canvasMode === 'edit'}
          title="Edit the layout"
          className={`${barToggleBtn} gap-1 cursor-pointer ${
            canvasMode === 'edit' ? `border ${activeBtn}` : ghostBtn
          }`}
        >
          <PencilIcon className="w-3 h-3" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (canvasMode !== 'preview') onToggleCanvasMode();
          }}
          aria-pressed={canvasMode === 'preview'}
          title="Preview the layout with a live item"
          className={`${barToggleBtn} gap-1 cursor-pointer ${
            canvasMode === 'preview' ? `border ${activeBtn}` : ghostBtn
          }`}
        >
          <EyeIcon className="w-3 h-3" />
          <span>Preview</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 justify-self-end">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo"
          aria-label="Undo"
          className={`${iconOnlyBtn} ${idleBtn} ${canUndo ? "cursor-pointer" : disabledBtn}`}
        >
          <UndoIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo"
          aria-label="Redo"
          className={`${iconOnlyBtn} ${idleBtn} ${canRedo ? "cursor-pointer" : disabledBtn}`}
        >
          <RedoIcon className="w-3.5 h-3.5" />
        </button>

        <div
          className="h-4 w-px bg-[color-mix(in_oklch,var(--secondary-accent)_40%,transparent)] shrink-0 mx-0.5"
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={onSave}
          title="Save and exit the template editor"
          className={`px-2 ${barControlHeight} rounded-md border transition flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer shrink-0 ${idleBtn}`}
        >
          <SaveIcon className="w-3.5 h-3.5" />
          <span>Save</span>
        </button>
      </div>
    </div>
  );
}
