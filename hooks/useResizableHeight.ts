'use client';

import { useCallback, useRef } from 'react';
import { useResizableDimension } from './useResizableDimension';

interface UseResizableHeightOptions {
  initialHeight?: number;
  minHeight?: number;
  minGap?: number;
  onHeightChange?: (height: number) => void;
}

export function useResizableHeight({ initialHeight = 220, minHeight = 140, minGap = 48, onHeightChange }: UseResizableHeightOptions = {}) {
  const panelElementRef = useRef<HTMLElement | null>(null);
  // The workspace boundary stays fixed while the closed panel is translated.
  const getBottom = useCallback(() => panelElementRef.current?.parentElement?.getBoundingClientRect().bottom ?? window.innerHeight - 56, []);
  const getMaximum = useCallback(() => getBottom() - 56 - minGap, [getBottom, minGap]);
  const getPointerSize = useCallback((event: PointerEvent) => getBottom() - event.clientY, [getBottom]);
  const resize = useResizableDimension({ initialSize: initialHeight, minSize: minHeight, getMaximum, getPointerSize, cursor: 'row-resize', onChange: onHeightChange, growKey: 'ArrowUp' });
  return { maxHeight: resize.maximum, panelHeight: resize.size, isDragging: resize.isDragging, handlePointerDown: resize.handlePointerDown, handleResetHeight: resize.handleReset, handleKeyDown: resize.handleKeyDown, panelElementRef };
}
