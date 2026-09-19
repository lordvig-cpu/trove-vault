'use client';

import { useCallback } from 'react';
import { useResizableDimension } from './useResizableDimension';

interface UseResizablePanelOptions {
  initialWidth?: number;
  minWidth?: number;
  minGap?: number;
  reservedWidth?: number;
  direction?: 'left' | 'right';
  onWidthChange?: (width: number) => void;
}

export function useResizablePanel({ initialWidth = 304, minWidth = 304, minGap = 48, reservedWidth = 0, direction = 'left', onWidthChange }: UseResizablePanelOptions = {}) {
  const getMaximum = useCallback(() => window.innerWidth - reservedWidth - minGap, [reservedWidth, minGap]);
  const getPointerSize = useCallback((event: PointerEvent) => direction === 'left' ? event.clientX : window.innerWidth - event.clientX, [direction]);
  const resize = useResizableDimension({ initialSize: initialWidth, minSize: minWidth, getMaximum, getPointerSize, cursor: 'col-resize', onChange: onWidthChange, growKey: direction === 'left' ? 'ArrowRight' : 'ArrowLeft' });
  return { maxWidth: resize.maximum, panelWidth: resize.size, isDragging: resize.isDragging, handlePointerDown: resize.handlePointerDown, handleResetWidth: resize.handleReset, handleKeyDown: resize.handleKeyDown };
}
