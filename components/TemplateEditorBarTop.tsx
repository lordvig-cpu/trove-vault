'use client';

import { PencilIcon, EyeIcon, UndoIcon, RedoIcon, SaveIcon } from '@/components/icons/LayoutIcons';
import { PreviewWidthPicker, ZoomControls } from '@/components/CanvasViewControls';
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
   Left: template icon + name. Center: Edit / Preview toggle, then Width / Fit (both apply
   universally, unlike the second row's container-specific tools). Right: Undo / Redo, then Save.
   ========================================================================== */

const iconOnlyBtn = `w-[26px] ${barControlHeight} rounded-md border transition flex items-center justify-center shrink-0`;
const divider = 'h-4 w-px bg-[color-mix(in_oklch,var(--secondary-accent)_40%,transparent)] shrink-0 mx-0.5';

interface TemplateEditorBarTopProps {
  icon?: string;
  name: string;
  canvasMode: 'edit' | 'preview';
  onToggleCanvasMode: () => void;
  /** False until the template has a layout: Width/Fit have no canvas to act on yet. */
  hasLayout: boolean;
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
  hasLayout,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
}: TemplateEditorBarTopProps) {
  return (
    <div className="flex items-center px-2.5 py-1.5 min-w-[30rem]">
      <div className="flex items-center gap-2 min-w-0 shrink-0">
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

      {/* A fixed gap from the name (not one derived from matching column widths, which forced this
          group's distance from each neighbor to track however wide that neighbor happened to be). */}
      <div className="flex items-center gap-2 ml-8 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-tree-item-text)] mr-1">View:</span>
        <div className={barToggleGroup} role="group" aria-label="Canvas mode">
          <button
            type="button"
            onClick={() => {
              if (canvasMode !== 'edit') onToggleCanvasMode();
            }}
            aria-pressed={canvasMode === 'edit'}
            title="Edit the layout"
            aria-label="Edit"
            className={`${barToggleBtn} cursor-pointer ${
              canvasMode === 'edit' ? `border ${activeBtn}` : ghostBtn
            }`}
          >
            <PencilIcon className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (canvasMode !== 'preview') onToggleCanvasMode();
            }}
            aria-pressed={canvasMode === 'preview'}
            title="Preview the layout with a live item"
            aria-label="Preview"
            className={`${barToggleBtn} cursor-pointer ${
              canvasMode === 'preview' ? `border ${activeBtn}` : ghostBtn
            }`}
          >
            <EyeIcon className="w-3 h-3" />
          </button>
        </div>

        {hasLayout && (
          <>
            <div className={divider} aria-hidden="true" />
            <ZoomControls />
            <div className={divider} aria-hidden="true" />
            {/* Preview width applies to the whole canvas, not the selected container, but stays
                visible no matter what's selected so switching containers doesn't hide it. */}
            <PreviewWidthPicker />
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-8">
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
          aria-label="Save"
          className={`${iconOnlyBtn} ${idleBtn} cursor-pointer`}
        >
          <SaveIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
