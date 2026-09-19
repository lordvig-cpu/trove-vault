'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface Options {
  initialSize: number;
  minSize: number;
  getMaximum: () => number;
  getPointerSize: (event: globalThis.PointerEvent) => number;
  cursor: 'col-resize' | 'row-resize';
  onChange?: (size: number) => void;
  growKey: 'ArrowRight' | 'ArrowLeft' | 'ArrowUp';
}

/** Shared resize bounds, keyboard controls, and pointer cleanup. */
export function useResizableDimension({ initialSize, minSize, getMaximum, getPointerSize, cursor, onChange, growKey }: Options) {
  const [size, setSize] = useState(initialSize);
  const [maximum, setMaximum] = useState(Math.max(minSize, initialSize));
  const [isDragging, setIsDragging] = useState(false);
  const sizeRef = useRef(initialSize);
  const cleanupRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef({ minSize, getMaximum, getPointerSize, onChange });

  useEffect(() => {
    optionsRef.current = { minSize, getMaximum, getPointerSize, onChange };
  }, [minSize, getMaximum, getPointerSize, onChange]);

  const update = useCallback((requested: number) => {
    const options = optionsRef.current;
    const maximum = Math.max(options.minSize, options.getMaximum());
    setMaximum(maximum);
    const next = Math.min(maximum, Math.max(options.minSize, requested));
    if (next === sizeRef.current) return;
    sizeRef.current = next;
    setSize(next);
    options.onChange?.(next);
  }, []);

  useEffect(() => {
    const clamp = () => update(sizeRef.current);
    clamp();
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, [getMaximum, minSize, update]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault();
    cleanupRef.current?.();
    const pointerId = event.pointerId;
    const { userSelect, cursor: previousCursor } = document.body.style;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = cursor;
    setIsDragging(true);
    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerId === pointerId) update(optionsRef.current.getPointerSize(e));
    };
    const finish = (e?: globalThis.PointerEvent) => {
      if (e && e.pointerId !== pointerId) return;
      cleanup();
      setIsDragging(false);
    };
    const blur = () => finish();
    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('blur', blur);
      document.body.style.userSelect = userSelect;
      document.body.style.cursor = previousCursor;
      cleanupRef.current = null;
    };
    cleanupRef.current = cleanup;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('blur', blur);
  }, [cursor, update]);

  const handleReset = useCallback(() => update(initialSize), [initialSize, update]);
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const shrinkKey = growKey === 'ArrowUp' ? 'ArrowDown' : growKey === 'ArrowRight' ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === growKey || event.key === shrinkKey) {
      event.preventDefault();
      update(sizeRef.current + (event.key === growKey ? 1 : -1) * (event.shiftKey ? 40 : 10));
    } else if (event.key === 'Home') {
      event.preventDefault();
      update(minSize);
    } else if (event.key === 'End') {
      event.preventDefault();
      update(optionsRef.current.getMaximum());
    }
  }, [growKey, minSize, update]);

  return { size, maximum, isDragging, handlePointerDown, handleReset, handleKeyDown };
}
