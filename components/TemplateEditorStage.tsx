'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition } from '@/types/field';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  findFlexNode,
} from '@/types/layout';
import { DashedSquareQuestionIcon } from '@/components/icons/LayoutIcons';
import { useCanvasZoom } from '@/context/CanvasZoomContext';
import TemplateEditorBar from '@/components/TemplateEditorBar';
import ContainerResizeHandles from '@/components/ContainerResizeHandles';

/* ==========================================================================
   1. PROPS INTERFACE
   ========================================================================== */

interface TemplateEditorStageProps {
  template: ItemTemplate;
  // Modern Flexbox Layout Engine Props
  flexLayoutConfig?: TemplateFlexLayoutConfig | null;
  selectedNodeId?: string | null;
  activeContainerId?: string;
  onSelectNode?: (nodeId: string | null) => void;
  onAddPrimitive?: (
    primitiveType: 'row' | 'column' | 'split-2' | 'split-3' | 'card',
    targetContainerId?: string
  ) => string;
  onAddFlexContainer?: (
    targetContainerId: string,
    options?: Partial<FlexContainerNode>
  ) => string;
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onUpdateFlexContainer?: (
    containerId: string,
    partial: Partial<FlexContainerNode>
  ) => void;
  onRemoveFlexContainer?: (containerId: string) => void;
  onAddFlexComponent?: (
    targetContainerId: string,
    options: Omit<FlexComponentNode, 'id' | 'nodeType'>
  ) => string;
  onUpdateFlexComponent?: (
    componentId: string,
    partial: Partial<FlexComponentNode>
  ) => void;
  onRemoveFlexComponent?: (componentId: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
  onResetFlexLayout?: () => void;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows') => void;

  canvasMode: 'edit' | 'preview';
  onDoneEditing: () => void;
  onToggleCanvasMode: () => void;
}

/* ==========================================================================
   1b. SCALED CANVAS
   Lays the Body out at its design width and scales it down (never up) to fit the
   available editor area, then applies the user's zoom (header +/-) on top.
   data-canvas-scale / data-body-width let panels report real px.
   ========================================================================== */

function ScaledCanvas({ children }: { children: React.ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [innerHeight, setInnerHeight] = useState(0);
  const [bodyPx, setBodyPx] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;
    const measure = () => {
      setAvailable(host.clientWidth);
      setInnerHeight(inner.offsetHeight); // layout height: unaffected by the CSS transform
      // The Body as actually laid out (px): reflects zoom reflow and any max content width
      setBodyPx(inner.querySelector<HTMLElement>('[data-container-id]')?.offsetWidth ?? 0);
    };
    const ro = new ResizeObserver(measure);
    const bodyEl = inner.querySelector('[data-container-id]');
    if (bodyEl) ro.observe(bodyEl);
    ro.observe(host);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  const { zoom, previewWidth: bodyWidth, setFitWidth } = useCanvasZoom();

  useEffect(() => {
    if (bodyPx > 0) setFitWidth(bodyPx);
  }, [bodyPx, setFitWidth]);

  // Default view shrinks the Body to fit the editor area (never up); zoom multiplies on top.
  const isFit = bodyWidth === 'fit';
  const fitScale = !isFit && available > 0 ? Math.min(1, available / bodyWidth) : 1;
  const scale = fitScale * zoom;
  // 'fit' bodies reflow like browser zoom: the layout width shrinks as the scale grows.
  const layoutWidth = isFit ? (available ? available / zoom : undefined) : bodyWidth;
  const scaledWidth = layoutWidth ? layoutWidth * scale : undefined;

  return (
    <div
      ref={hostRef}
      // -12px margins cancel the stage's side padding, so the canvas runs edge to edge
      // (the banner above keeps its padding). Fit then uses all the space the panels leave.
      className="overflow-x-auto -mx-3"
      style={{ paddingTop: 8 }}
    >
      <div
        style={{
          width: scaledWidth,
          height: innerHeight ? Math.ceil(innerHeight * scale) : undefined,
          margin: '0 auto',
        }}
      >
        <div
          ref={innerRef}
          data-canvas-scale={scale}
          data-body-width={layoutWidth}
          style={{
            width: layoutWidth,
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. RECURSIVE FLEX CONTAINER RENDERER
   ========================================================================== */

function FlexContainerRenderer({
  container,
  isRoot,
  parentContainer,
  selectedNodeId,
  activeContainerId,
  canvasMode,
  fields,
  onSelectNode,
  onAddPrimitive,
  onAddContainer,
  onInsertContainerSibling,
  onUpdateContainer,
  onRemoveContainer,
  onSplitContainer,
  onUpdateComponent,
  onRemoveComponent,
  onPlaceField,
  parentStacked,
}: {
  container: FlexContainerNode;
  isRoot?: boolean;
  parentContainer?: FlexContainerNode;
  /** The parent row collapsed into a column (its stackBelow width was reached). */
  parentStacked?: boolean;
  selectedNodeId?: string | null;
  activeContainerId?: string;
  canvasMode: 'edit' | 'preview';
  fields: FieldDefinition[];
  onSelectNode?: (id: string | null) => void;
  onAddPrimitive?: (
    type: 'row' | 'column' | 'split-2' | 'split-3' | 'card',
    targetId?: string
  ) => void;
  onAddContainer?: (
    targetContainerId: string,
    options?: Partial<FlexContainerNode>
  ) => string;
  onInsertContainerSibling?: (
    targetContainerId: string,
    position: 'before' | 'after',
    options?: Partial<FlexContainerNode>
  ) => string;
  onUpdateContainer?: (id: string, partial: Partial<FlexContainerNode>) => void;
  onRemoveContainer?: (id: string) => void;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows') => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent?: (id: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = selectedNodeId === container.id;
  const isActive = activeContainerId === container.id;
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive stacking: a row collapses into a column when its own layout width drops below
  // stackBelow. offsetWidth is the pre-transform width, so the editor's scale doesn't skew it.
  const stackBelow = container.direction === 'row' ? container.stackBelow : undefined;
  const [isStacked, setIsStacked] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !stackBelow) {
      setIsStacked(false);
      return;
    }
    const measure = () => setIsStacked(el.offsetWidth < stackBelow);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stackBelow]);


  useEffect(() => {
    if (canvasMode !== 'edit') return;
    // Nested drops stop propagation. Observe the whole drag in capture phase so
    // ancestors and previous targets cannot retain their drop-target rings.
    const trackTarget = (event: DragEvent) => {
      const target = event.target instanceof Element
        ? event.target.closest('[data-container-id]')
        : null;
      setIsDragOver(target?.getAttribute('data-container-id') === container.id);
    };
    const clearTarget = () => setIsDragOver(false);
    window.addEventListener('dragover', trackTarget, true);
    window.addEventListener('drop', clearTarget, true);
    window.addEventListener('dragend', clearTarget, true);
    window.addEventListener('blur', clearTarget);
    return () => {
      window.removeEventListener('dragover', trackTarget, true);
      window.removeEventListener('drop', clearTarget, true);
      window.removeEventListener('dragend', clearTarget, true);
      window.removeEventListener('blur', clearTarget);
    };
  }, [canvasMode, container.id]);

  const justifyStyle =
    container.justify === 'between'
      ? 'space-between'
      : container.justify === 'around'
      ? 'space-around'
      : container.justify === 'center'
      ? 'center'
      : container.justify === 'end'
      ? 'flex-end'
      : 'flex-start';

  // In a column parent the main axis is vertical: a container must keep its content height
  // (the body scrolls) and take its width from cross-axis stretch, not from flex-basis.
  const parentIsColumn =
    !!parentContainer &&
    (parentContainer.direction === 'column' ||
      ((!parentContainer.direction || parentContainer.direction === 'none') &&
        parentContainer.id === 'root-container'));

  const outerStyle: React.CSSProperties = {
    flex: parentIsColumn
      ? '0 0 auto'
      : container.sizing?.type === 'fixed'
        ? `1 1 ${container.sizing.value || 'auto'}`
        : container.sizing?.type === 'auto'
        ? '0 0 auto'
        : '1 1 0%',
    width:
      container.sizing?.type === 'fixed' && container.sizing.value
        ? container.sizing.value
        : container.width || undefined,
    // An explicit Max W wins; otherwise a fixed width doubles as the cap.
    maxWidth:
      container.maxWidth ||
      (container.sizing?.type === 'fixed' && container.sizing.value
        ? container.sizing.value
        : undefined),
    height: container.height || container.sizing?.height || undefined,
    minHeight: container.minHeight || container.sizing?.minHeight || undefined,
    maxHeight: container.maxHeight || undefined,
    // Now that the toolbar lives outside the container, a capped height can safely scroll.
    overflowY: container.maxHeight ? 'auto' : undefined,
    alignSelf: parentIsColumn && container.sizing?.type !== 'fixed' && !container.width ? 'stretch' : undefined,
    minWidth: container.minWidth || 0,
    // Children of a stacked row take the full width, ignoring their row-mode widths.
    ...(parentStacked ? { width: '100%', maxWidth: container.maxWidth || undefined, flex: '0 0 auto' } : null),
  };

  const innerFlexStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection:
      container.direction === 'row'
        ? isStacked
          ? 'column'
          : 'row'
        : container.direction === 'column'
        ? 'column'
        : isRoot
        ? 'column'
        : undefined,
    gap: `${container.gap ?? 0}px`,
    flexWrap: container.wrap ? 'wrap' : 'nowrap',
    alignItems: container.align,
    justifyContent: justifyStyle,
    padding:
      container.padding !== undefined
        ? `${container.padding}px`
        : '0px',
  };

  const isCard = container.isCard;

  return (
    <div
      ref={containerRef}
      data-container-id={container.id}
      onClick={(e) => {
        e.stopPropagation();
        if (canvasMode === 'edit') onSelectNode?.(container.id);
      }}
      onDragOver={(e) => {
        if (canvasMode !== 'edit') return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragEnter={(e) => {
        if (canvasMode !== 'edit') return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        if (canvasMode !== 'edit') return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const fieldIdStr =
          e.dataTransfer.getData('application/x-trove-field-id') ||
          e.dataTransfer.getData('text/plain');
        if (fieldIdStr) {
          const fieldId = parseInt(fieldIdStr, 10);
          if (!isNaN(fieldId)) {
            onPlaceField?.(fieldId, container.id);
            onSelectNode?.(container.id);
          }
        }
      }}
      style={
        !isRoot
          ? outerStyle
          : // Body: optional max content width, centered (blank = stretch to fill)
            container.maxWidth
            ? { maxWidth: container.maxWidth, marginInline: 'auto' }
            : undefined
      }
      className={`transition-all duration-150 relative ${
        isSelected ? 'z-20' : 'z-10'
      } ${
        isRoot ? 'flex-1 flex flex-col min-h-0 w-full' : 'flex flex-col'
      } ${
        canvasMode === 'preview'
          ? isCard
            ? 'rounded-2xl bg-[var(--content-card-bg)] border border-[var(--content-card-border)] shadow-md backdrop-blur-sm'
            : ''
          : isDragOver
          ? 'rounded-2xl outline-2 outline-[var(--primary-accent)] -outline-offset-2 ring-2 ring-[var(--primary-accent)] ring-offset-2 ring-offset-[var(--surface-panel)] bg-[color-mix(in_oklch,var(--primary-accent)_16%,transparent)] shadow-2xl shadow-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)]'
          : isSelected
          ? 'rounded-2xl outline-2 outline-white -outline-offset-2 bg-[color-mix(in_oklch,var(--primary-accent)_8%,transparent)] shadow-xl shadow-white/10'
          : isActive
          ? 'rounded-2xl outline outline-1 outline-[color-mix(in_oklch,var(--primary-accent)_50%,transparent)] -outline-offset-1 bg-[color-mix(in_oklch,var(--primary-accent)_6%,transparent)]'
          : isCard
          ? 'rounded-2xl bg-[color-mix(in_oklch,var(--panel-surface-bg)_60%,transparent)] hover:border-[color-mix(in_oklch,var(--primary-accent)_40%,var(--primary-border-subtle))]'
          : 'rounded-2xl outline outline-1 outline-dashed outline-[var(--primary-border-subtle)] -outline-offset-1 bg-[color-mix(in_oklch,var(--panel-surface-bg)_25%,transparent)] hover:outline-[color-mix(in_oklch,var(--primary-accent)_40%,var(--primary-border-subtle))]'
      } ${
        // Editing outlines are drawn inset with `outline`, so they take no layout space and the
        // canvas matches the live preview to the pixel. A card frame is a real border in both modes.
        canvasMode === 'edit' && isCard ? 'border border-[var(--primary-border-subtle)]' : ''
      }`}
    >
      {/* Drag handles: only for a selected container that is set to Custom sizing */}
      {canvasMode === 'edit' &&
        isSelected &&
        !isRoot &&
        !parentStacked &&
        container.sizing?.type === 'fixed' &&
        onUpdateContainer && (
          <ContainerResizeHandles
            containerRef={containerRef}
            container={container}
            onUpdate={(partial) => onUpdateContainer(container.id, partial)}
          />
        )}

      {/* Children or Empty State */}
      <div style={innerFlexStyle} className="w-full flex-1 min-h-0">
        {container.children.length === 0 ? (
          canvasMode === 'edit' ? (
            <div
              title="Drag and drop to add content"
              className={`w-full ${isRoot ? 'flex-1 min-h-[220px]' : 'min-h-[140px]'} py-6 px-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center gap-2.5 select-none transition-all group cursor-pointer ${
                isDragOver
                  ? 'border-[var(--primary-accent)] bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] shadow-lg shadow-[color-mix(in_oklch,var(--primary-accent)_15%,transparent)]'
                  : 'border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] bg-[color-mix(in_oklch,var(--primary-accent)_5%,transparent)] hover:border-[color-mix(in_oklch,var(--primary-accent)_65%,transparent)] hover:bg-[color-mix(in_oklch,var(--primary-accent)_9%,transparent)]'
              }`}
            >
              {/* Empty Container Icon Badge */}
              <div
                title="Drag and drop to add content"
                className="w-11 h-11 rounded-xl border border-[color-mix(in_oklch,var(--primary-accent)_45%,transparent)] bg-[color-mix(in_oklch,var(--primary-accent)_12%,transparent)] text-[var(--primary-accent)] flex items-center justify-center shadow-lg shadow-black/25 group-hover:scale-105 transition-transform"
              >
                <DashedSquareQuestionIcon className="w-6 h-6" />
              </div>

              {/* Title / Drag Feedback */}
              <div className="flex flex-col items-center gap-0.5" title="Drag and drop to add content">
                {isDragOver ? (
                  <span className="text-xs font-bold text-[var(--primary-accent)] flex items-center gap-1.5 animate-pulse">
                    <span>📥</span> Drop field to insert into {container.label || (isRoot ? 'Body' : 'Container')}
                  </span>
                ) : (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    EMPTY
                  </h4>
                )}
              </div>
            </div>
          ) : null
        ) : (
          container.children.map((child) => {
            if (child.nodeType === 'container') {
              return (
                <FlexContainerRenderer
                  key={child.id}
                  container={child}
                  parentContainer={container}
                  parentStacked={isStacked}
                  selectedNodeId={selectedNodeId}
                  activeContainerId={activeContainerId}
                  canvasMode={canvasMode}
                  fields={fields}
                  onSelectNode={onSelectNode}
                  onAddPrimitive={onAddPrimitive}
                  onAddContainer={onAddContainer}
                  onInsertContainerSibling={onInsertContainerSibling}
                  onUpdateContainer={onUpdateContainer}
                  onRemoveContainer={onRemoveContainer}
                  onSplitContainer={onSplitContainer}
                  onUpdateComponent={onUpdateComponent}
                  onRemoveComponent={onRemoveComponent}
                  onPlaceField={onPlaceField}
                />
              );
            }
            return (
              <FlexComponentRenderer
                key={child.id}
                component={child}
                parentStacked={isStacked}
                selectedNodeId={selectedNodeId}
                canvasMode={canvasMode}
                fields={fields}
                onSelectNode={onSelectNode}
                onRemoveComponent={onRemoveComponent}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   3. FLEX COMPONENT RENDERER
   ========================================================================== */

function FlexComponentRenderer({
  component,
  selectedNodeId,
  canvasMode,
  fields,
  onSelectNode,
  onRemoveComponent,
  parentStacked,
}: {
  component: FlexComponentNode;
  parentStacked?: boolean;
  selectedNodeId?: string | null;
  canvasMode: 'edit' | 'preview';
  fields: FieldDefinition[];
  onSelectNode?: (id: string | null) => void;
  onRemoveComponent?: (id: string) => void;
}) {
  const isSelected = selectedNodeId === component.id;
  const boundField = component.field_id
    ? fields.find((f) => f.id === component.field_id)
    : undefined;
  const label = component.label || boundField?.label || component.componentType;

  const componentStyle: React.CSSProperties = {
    flex:
      component.sizing?.type === 'fixed'
        ? `0 0 ${component.sizing.value || 'auto'}`
        : component.sizing?.type === 'auto'
        ? '0 0 auto'
        : '1 1 0%',
    width:
      component.sizing?.type === 'fixed' && component.sizing.value
        ? component.sizing.value
        : undefined,
    minWidth: 0,
    ...(parentStacked ? { flex: '0 0 auto', width: '100%' } : null),
  };

  return (
    <div
      style={componentStyle}
      onClick={(e) => {
        e.stopPropagation();
        if (canvasMode === 'edit') onSelectNode?.(component.id);
      }}
      className={`transition-all duration-150 relative ${
        canvasMode === 'preview'
          ? 'rounded-xl bg-slate-900/40 border border-slate-800/80 p-3'
          : isSelected
          ? 'rounded-xl ring-2 ring-amber-500/90 bg-amber-950/20 shadow-lg shadow-amber-500/10 border border-amber-500/60 p-3 cursor-pointer'
          : 'rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700/80 p-3 cursor-pointer'
      }`}
    >
      {/* Component Header / Chip in Edit Mode */}
      {canvasMode === 'edit' && (
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/60 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9.5px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700/50">
              {component.componentType}
            </span>
            <span className="text-xs font-semibold text-slate-300 truncate">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-mono text-slate-400">
              {component.sizing.type === 'fill'
                ? 'Fill'
                : component.sizing.value || 'Fixed'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveComponent?.(component.id);
              }}
              className="text-[11px] text-red-400 hover:text-red-200 ml-1 p-0.5 cursor-pointer leading-none"
              title="Remove Component"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Render Component Content by Type */}
      {component.componentType === 'table' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>📊</span>
              <span>{label}</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--primary-accent)]">
              Specifications Table
            </span>
          </div>
          <div className="flex flex-col gap-1 text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Rating:</span>
              <span className="font-semibold text-slate-200">4.8 / 5.0</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Target Audience:</span>
              <span className="font-semibold text-slate-200">
                Collectors & Enthusiasts
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Condition Grade:</span>
              <span className="font-semibold text-slate-200">
                Mint / Near Mint
              </span>
            </div>
          </div>
        </div>
      ) : component.componentType === 'media' ? (
        <div className="flex flex-col gap-2 h-full min-h-[140px] justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>🖼️</span>
              <span>{label}</span>
            </span>
            <span className="text-[9.5px] font-mono text-amber-400">
              Media Gallery
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-4 bg-slate-950/40 rounded-lg border border-dashed border-slate-800 text-center">
            <span className="text-2xl opacity-60">📷</span>
            <span className="text-[11px] text-slate-400 mt-1">
              High-Resolution Photo
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
            <span>Aspect: 16:9 Banner</span>
            <span className="font-mono">Fill Box</span>
          </div>
        </div>
      ) : component.componentType === 'stat' ? (
        <div className="flex flex-col items-center justify-center p-3 gap-1 text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {label}
          </span>
          <span className="text-2xl font-extrabold text-[var(--primary-accent)] font-mono tracking-tight">
            98.5%
          </span>
          <span className="text-[9.5px] text-emerald-400 font-medium">
            ★ Verified Rank
          </span>
        </div>
      ) : component.componentType === 'note' ? (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col gap-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <span>📝</span>
            <span>{label}</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            {canvasMode === 'preview'
              ? 'Condition verified by official registry. Stored in temperature-controlled archive.'
              : 'Add curator remarks, notes, or grading certificates.'}
          </p>
        </div>
      ) : (
        /* Field Attribute Component */
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-200 truncate">
              {label}
            </span>
            {boundField && (
              <span className="text-[9px] font-mono font-bold uppercase px-1 py-0.5 rounded bg-slate-800 text-[var(--primary-accent)] border border-slate-700/60 shrink-0">
                {boundField.field_type}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 truncate">
            {canvasMode === 'preview'
              ? boundField?.options?.[0] || 'Sample attribute value'
              : boundField?.is_required
              ? 'Required Field *'
              : 'Value placeholder...'}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   4. MAIN EXPORT: TemplateEditorStage
   ========================================================================== */

export default function TemplateEditorStage({
  template,
  flexLayoutConfig,
  selectedNodeId,
  activeContainerId,
  onSelectNode,
  onAddPrimitive,
  onAddFlexContainer,
  onInsertContainerSibling,
  onUpdateFlexContainer,
  onRemoveFlexContainer,
  onUpdateFlexComponent,
  onRemoveFlexComponent,
  onPlaceField,
  onResetFlexLayout,
  onSplitContainer,

  canvasMode,
  onDoneEditing,
  onToggleCanvasMode,
}: TemplateEditorStageProps) {
  const fields = template.fields || [];

  // Preview width and zoom are editor-only: every editing session starts at Fit / 100%.
  const { setPreviewWidth, resetZoom } = useCanvasZoom();
  useEffect(
    () => () => {
      setPreviewWidth('fit');
      resetZoom();
    },
    [setPreviewWidth, resetZoom]
  );

  const isFlexActive = Boolean(flexLayoutConfig?.root);

  // The editor bar (container tools, preview width, zoom) lives in the slot under the top header.
  const toolbarSlot =
    typeof document !== 'undefined' ? document.getElementById('template-toolbar-slot') : null;
  const selectedNode =
    flexLayoutConfig?.root && selectedNodeId ? findFlexNode(flexLayoutConfig.root, selectedNodeId) : null;
  const toolbarContainer = selectedNode?.nodeType === 'container' ? selectedNode : null;

  return (
    <div className="w-full mx-auto p-3 flex-1 flex flex-col gap-6 select-none min-h-0">
      {isFlexActive && toolbarSlot &&
        createPortal(
          <TemplateEditorBar
            container={toolbarContainer}
            isRoot={!!toolbarContainer && toolbarContainer.id === flexLayoutConfig?.root.id}
            showContainerTools={canvasMode === 'edit'}
            onUpdateContainer={onUpdateFlexContainer}
            onAddContainer={onAddFlexContainer}
            onInsertContainerSibling={onInsertContainerSibling}
            onSplitContainer={onSplitContainer}
            onRemoveContainer={onRemoveFlexContainer}
            onSelectNode={onSelectNode}
          />,
          toolbarSlot
        )}
      {/* --------------------------------------------------------------------
          1. BLUEPRINT HEADER BANNER & CANVAS TOOLBAR
          -------------------------------------------------------------------- */}
      <div className="tmpl-editor-stage-banner w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_40%,transparent)] flex items-center justify-center text-2xl shadow-md shrink-0">
            {template.icon || '📦'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-wide truncate">
                {template.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)] text-[var(--primary-accent)] border border-[color-mix(in_oklch,var(--primary-accent)_35%,transparent)] shrink-0">
                Auto-Layout Builder
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
              {template.description || 'Custom visual layout schema'}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Canvas Mode Toggle: Edit vs Preview */}
          <div className="flex items-center bg-[color-mix(in_oklch,var(--panel-surface-bg)_80%,transparent)] p-0.5 rounded-xl border border-[color-mix(in_oklch,var(--primary-accent)_25%,var(--primary-border-subtle))]">
            <button
              type="button"
              onClick={() => {
                if (canvasMode !== 'edit') onToggleCanvasMode();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canvasMode === 'edit'
                  ? 'bg-[var(--primary-accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <span>✏️</span>
              <span>Builder Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (canvasMode !== 'preview') onToggleCanvasMode();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                canvasMode === 'preview'
                  ? 'bg-[var(--primary-accent)] text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              <span>👁️</span>
              <span>Live Item Preview</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onDoneEditing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-white shadow-lg shadow-[color-mix(in_oklch,var(--primary-accent)_25%,transparent)] flex items-center gap-1.5 transition hover:scale-[1.02] cursor-pointer"
            title="Exit template editor and restore previous tab workspace"
          >
            <span>✓</span>
            <span>Done Editing</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. VISUAL CANVAS STAGE (Flexbox Engine or Legacy Grid Fallback)
          -------------------------------------------------------------------- */}
      {isFlexActive && flexLayoutConfig?.root ? (
        <ScaledCanvas>
          <FlexContainerRenderer
            container={flexLayoutConfig.root}
            isRoot
            selectedNodeId={selectedNodeId}
            activeContainerId={activeContainerId}
            canvasMode={canvasMode}
            fields={fields}
            onSelectNode={onSelectNode}
            onAddPrimitive={onAddPrimitive}
            onAddContainer={onAddFlexContainer}
            onInsertContainerSibling={onInsertContainerSibling}
            onUpdateContainer={onUpdateFlexContainer}
            onRemoveContainer={onRemoveFlexContainer}
            onSplitContainer={onSplitContainer}
            onUpdateComponent={onUpdateFlexComponent}
            onRemoveComponent={onRemoveFlexComponent}
            onPlaceField={onPlaceField}
          />
        </ScaledCanvas>
      ) : (
        <div className="w-full max-w-6xl mx-auto py-16 flex flex-col items-center justify-center text-center gap-3 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
          <span className="text-sm font-bold text-slate-300">No layout yet</span>
          <p className="text-xs text-slate-500 max-w-sm">
            Generate a starter layout from this template&apos;s fields to begin designing.
          </p>
          <button
            type="button"
            onClick={onResetFlexLayout}
            className="mt-2 px-4 py-2 text-xs font-semibold bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] text-white rounded-xl transition cursor-pointer"
          >
            Auto-Generate Layout
          </button>
        </div>
      )}
    </div>
  );
}
