'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FieldDefinition } from '@/types/field';
import {
  FlexContainerNode,
  FlexComponentNode,
  normalizeAlign,
  normalizeJustify,
  parsePxValue,
  resolvePaddingCss,
} from '@/types/layout';
import ContainerResizeHandles from '@/components/ContainerResizeHandles';
import FlexComponentRenderer from '@/components/template-canvas/FlexComponentRenderer';

/* ==========================================================================
   RECURSIVE FLEX CONTAINER RENDERER
   ========================================================================== */

export default function FlexContainerRenderer({
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
  onPlaceLoremIpsum,
  parentStacked,
  onOverflowChange,
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
  /** Reports whether this container's own row currently has more children than it has room for
      (wrapped onto a second line, or overflowed with wrap off) -- see the dashed-red border below. */
  onOverflowChange?: (containerId: string, isOverflowing: boolean) => void;
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
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent?: (id: string) => void;
  onPlaceField?: (fieldId: number, targetContainerId?: string) => void;
  onPlaceLoremIpsum?: (targetContainerId?: string) => void;
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

  // Flags a row whose children all have their own explicit pixel width, but together don't fit:
  // wrapped onto a second line (Wrap Children on) or clipped past the edge (Wrap Children off).
  // Scoped to rows where *every* child has a fixed px width -- that's the only case where "doesn't
  // fit" means a real conflict, because it's the only case where every sibling committed to a
  // specific size that should sit on one line. A percentage width (e.g. two children at 48% each,
  // wrapping into a 2-per-row grid) is Wrap Children working exactly as designed, not a conflict --
  // percentages scale with whatever room they get, so wrapping among them proves nothing. A capped
  // Height (Max H) already has its own, intentional scrollbar, so column overflow isn't flagged.
  // Measured on the actual rendered box, not derived from the layout data, since the parent's real
  // available width isn't knowable without it (it cascades from the Body's width, the current
  // preview width, and zoom).
  const innerRef = useRef<HTMLDivElement>(null);
  const isRowLayout = container.direction === 'row' && !isStacked;
  const allChildrenFixedPx =
    container.children.length >= 2 &&
    container.children.every(
      (child) => child.sizing?.type === 'fixed' && parsePxValue(child.sizing.value) !== null
    );
  const [isOverflowing, setIsOverflowing] = useState(false);
  useEffect(() => {
    const el = innerRef.current;
    if (!el || !isRowLayout || !allChildrenFixedPx || container.children.length < 2) {
      setIsOverflowing(false);
      onOverflowChange?.(container.id, false);
      return;
    }
    const measure = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      const overflowed =
        kids.length < 2
          ? false
          : container.wrap
          ? kids.some((kid) => kid.offsetTop !== kids[0].offsetTop)
          : el.scrollWidth > el.clientWidth + 1; // +1: subpixel rounding
      setIsOverflowing(overflowed);
      onOverflowChange?.(container.id, overflowed);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((kid) => ro.observe(kid));
    return () => {
      ro.disconnect();
      onOverflowChange?.(container.id, false);
    };
  }, [isRowLayout, allChildrenFixedPx, container.wrap, container.children.length, container.id, onOverflowChange]);


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

  const justify = normalizeJustify(container.justify);
  const justifyStyle =
    justify === 'between'
      ? 'space-between'
      : justify === 'around'
      ? 'space-around'
      : justify === 'center'
      ? 'center'
      : justify === 'end'
      ? 'flex-end'
      : 'flex-start';
  const align = normalizeAlign(container.align);
  const alignItemsStyle = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align;

  // In a column parent the main axis is vertical: a container must keep its content height
  // (the body scrolls) and take its width from cross-axis stretch, not from flex-basis -- unless
  // the parent itself has an explicit (Custom) height: that's a fixed box, not a page, so an Auto
  // child (no explicit height of its own) grows to fill it instead, the same way an Auto-width
  // child already fills a Custom-width row. A child with its own explicit height still keeps that
  // size regardless, same as a Custom-width child already does.
  const parentIsColumn =
    !!parentContainer &&
    (parentContainer.direction === 'column' ||
      ((!parentContainer.direction || parentContainer.direction === 'none') &&
        parentContainer.id === 'root-container'));
  const parentHasExplicitHeight = !!(parentContainer?.height || parentContainer?.sizing?.height);
  const hasOwnHeight = !!(container.height || container.sizing?.height);

  const outerStyle: React.CSSProperties = {
    flex: container.sizing?.type === 'auto'
      ? '0 0 auto'
      : parentIsColumn
      ? parentHasExplicitHeight && !hasOwnHeight
        ? '1 1 0%'
        : '0 0 auto'
      : container.sizing?.type === 'fixed'
      ? `1 1 ${container.sizing.value || 'auto'}`
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
    // Now that the toolbar lives outside the container, a capped height can safely scroll. A
    // Custom height (explicit, whether from Split or the Sizing panel) is a commitment the same
    // way Max H is: content that doesn't fit scrolls instead of silently stretching the box (and
    // the layout around it) to whatever the dropped-in content needs. Auto containers are
    // unaffected -- they have no explicit height, so they keep growing with their content.
    overflowY: container.maxHeight || container.height || container.sizing?.height ? 'auto' : undefined,
    // Auto/Custom-less Fit containers hug their content across a column too, unless the parent's own
    // Align Items already positions its children (then that alignment decides).
    alignSelf:
      parentIsColumn && container.sizing?.type === 'auto'
        ? normalizeAlign(parentContainer?.align) === 'stretch'
          ? 'flex-start'
          : undefined
        : parentIsColumn && container.sizing?.type !== 'fixed' && !container.width
        ? 'stretch'
        : undefined,
    minWidth: container.minWidth || 0,
    // Outside spacing, set from the flyout's Spacing box; never on the Body.
    ...(!isRoot && container.margin ? { margin: container.margin } : null),
    // Look (Appearance section). Inline, so it wins over the edit-mode tints and the card frame's
    // classes in both modes. The shadow is drawn at 40% strength so it stays soft in any color.
    ...(container.background ? { backgroundColor: container.background } : null),
    ...(container.borderWidth
      ? { border: `${container.borderWidth}px solid ${container.borderColor || 'var(--primary-border-subtle)'}` }
      : null),
    ...(container.borderRadius ? { borderRadius: `${container.borderRadius}px` } : null),
    ...(container.shadowY || container.shadowBlur
      ? {
          boxShadow: `0 ${container.shadowY ?? 0}px ${container.shadowBlur ?? 0}px color-mix(in srgb, ${
            container.shadowColor || 'black'
          } 40%, transparent)`,
        }
      : null),
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
    alignItems: alignItemsStyle,
    justifyContent: justifyStyle,
    padding: resolvePaddingCss(container.padding),
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
        if (e.dataTransfer.getData('application/x-trove-lorem-ipsum')) {
          onPlaceLoremIpsum?.(container.id);
          onSelectNode?.(container.id);
          return;
        }
        const fieldIdStr =
          e.dataTransfer.getData('application/x-trove-field-id') || e.dataTransfer.getData('text/plain');
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
          : isOverflowing
          ? 'rounded-2xl outline-2 outline-dashed outline-[var(--editor-invalid)] -outline-offset-2 bg-[color-mix(in_oklch,var(--editor-invalid)_10%,transparent)] shadow-lg shadow-[color-mix(in_oklch,var(--editor-invalid)_20%,transparent)]'
          : isSelected
          ? 'rounded-2xl outline-2 outline-white -outline-offset-2 bg-[color-mix(in_oklch,var(--primary-accent)_8%,transparent)] shadow-xl shadow-white/10'
          : isActive
          ? 'rounded-2xl outline outline-1 outline-[color-mix(in_oklch,var(--primary-accent)_50%,transparent)] -outline-offset-1 bg-[color-mix(in_oklch,var(--primary-accent)_6%,transparent)]'
          : isCard
          ? 'rounded-2xl bg-[color-mix(in_oklch,var(--panel-surface-bg)_60%,transparent)] hover:border-[color-mix(in_oklch,var(--primary-accent)_40%,var(--primary-border-subtle))]'
          : // Dashed = nothing dropped in here yet; solid = it holds at least one field/container.
            container.children.length === 0
          ? 'rounded-2xl outline outline-1 outline-dashed outline-[var(--primary-border-subtle)] -outline-offset-1 bg-[color-mix(in_oklch,var(--panel-surface-bg)_25%,transparent)] hover:outline-[color-mix(in_oklch,var(--primary-accent)_40%,var(--primary-border-subtle))]'
          : 'rounded-2xl outline outline-1 outline-[var(--primary-border-subtle)] -outline-offset-1 bg-[color-mix(in_oklch,var(--panel-surface-bg)_25%,transparent)] hover:outline-[color-mix(in_oklch,var(--primary-accent)_40%,var(--primary-border-subtle))]'
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
      <div ref={innerRef} style={innerFlexStyle} className="w-full flex-1 min-h-0">
        {container.children.length === 0 ? (
          canvasMode === 'edit' ? (
            // No forced min-height: the empty state used to reserve 140/220px for its icon and
            // "EMPTY" label, which forced a scrollbar on any Custom-height container smaller than
            // that (e.g. one half of a Split). "Empty" is now shown by the container's own dashed
            // border below instead, so this only needs room for the drag-over hint while it's
            // actually relevant.
            <div
              title="Drag and drop to add content"
              className={`w-full py-4 px-4 flex items-center justify-center text-center select-none transition-all cursor-pointer ${
                isDragOver ? 'rounded-xl bg-[color-mix(in_oklch,var(--primary-accent)_20%,transparent)]' : ''
              }`}
            >
              {isDragOver && (
                <span className="text-xs font-bold text-[var(--primary-accent)] flex items-center gap-1.5 animate-pulse">
                  <span>📥</span> Drop field to insert into {container.label || (isRoot ? 'Body' : 'Container')}
                </span>
              )}
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
                  onPlaceLoremIpsum={onPlaceLoremIpsum}
                  onOverflowChange={onOverflowChange}
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
