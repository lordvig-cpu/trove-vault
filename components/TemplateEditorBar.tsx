'use client';

import TemplateEditorBarTop from '@/components/TemplateEditorBarTop';

/* ==========================================================================
   Template editor bar: the chrome for the top panel, hanging from the top navigation header.
   Template-wide tools only (icon + name, View toggle, Zoom, Width/Fit, Undo/Redo, Save) — the
   selected container's own tools live in their own panel anchored to the footer instead
   (TemplateEditorBarBottom), so the two never fight for space in one bar.
   ========================================================================== */

interface TemplateEditorBarProps {
  templateIcon?: string;
  templateName: string;
  canvasMode: 'edit' | 'preview';
  onToggleCanvasMode: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave: () => void;
  /** False until the template has a layout: width and zoom have no canvas to act on yet. */
  hasLayout: boolean;
}

export default function TemplateEditorBar({
  templateIcon,
  templateName,
  canvasMode,
  onToggleCanvasMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  hasLayout,
}: TemplateEditorBarProps) {
  return (
    <div
      className="tmpl-edge-panel tmpl-edge-panel-top select-none pointer-events-auto flex flex-col max-w-[calc(100vw-2rem)]"
      onClick={(e) => e.stopPropagation()}
    >
      <TemplateEditorBarTop
        icon={templateIcon}
        name={templateName}
        canvasMode={canvasMode}
        onToggleCanvasMode={onToggleCanvasMode}
        hasLayout={hasLayout}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        onSave={onSave}
      />
    </div>
  );
}
