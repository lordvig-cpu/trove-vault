'use client';

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface RightPanelProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  title?: string;
  reservedWidth?: number;
  onWidthChange?: (width: number) => void;
  children?: ReactNode;
}

const MIN_WIDTH = 260;
const DEFAULT_WIDTH = 360;
const MIN_WORKSPACE_GAP = 48;

export default function RightPanel({
  isOpen,
  onOpen,
  onClose,
  title = "Details",
  reservedWidth = 0,
  onWidthChange,
  children,
}: RightPanelProps) {
  const { animationsEnabled } = useUIPreferences();
  
  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const panelWidthRef = useRef<number>(panelWidth);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    panelWidthRef.current = panelWidth;
  }, [panelWidth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dynamicMax = Math.max(MIN_WIDTH, window.innerWidth - reservedWidth - MIN_WORKSPACE_GAP);
    setPanelWidth((prev) => (prev > dynamicMax ? dynamicMax : prev));
  }, [reservedWidth]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const rawWidth = window.innerWidth - e.clientX;
      const dynamicMax = Math.max(MIN_WIDTH, window.innerWidth - reservedWidth - MIN_WORKSPACE_GAP);
      const clampedWidth = Math.min(Math.max(rawWidth, MIN_WIDTH), dynamicMax);

      panelWidthRef.current = clampedWidth;
      setPanelWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        onWidthChange?.(panelWidthRef.current);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [reservedWidth, onWidthChange]);

  const transitionClass = (!isDragging && animationsEnabled)
    ? 'transition-all duration-700 ease-in-out' 
    : 'transition-none';

  return (
    <>
      {/* 1. FLOATING EXPAND TAB */}
      <button
        type="button"
        onClick={onOpen}
        className={[
          'right-panel-expand-tab group',
          transitionClass,
          isOpen ? 'right-panel-tab-hidden' : 'right-panel-tab-visible',
        ].filter(Boolean).join(' ')}
        title="Open Side Panel"
      >
        <ChevronLeftIcon className="w-3.5 h-3.5 origin-center transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-hover:scale-115" />
      </button>

      {/* 2. RIGHT PANEL CONTAINER */}
      <aside
        style={{ width: isOpen ? `${panelWidth}px` : 0 }}
        className={[
          'right-side-panel absolute top-0 bottom-0 right-0 z-30 flex flex-col',
          transitionClass,
          isOpen ? 'right-panel-docked-open' : 'right-panel-docked-closed pointer-events-none',
        ].filter(Boolean).join(' ')}
      >
        {/* RESIZE HANDLE STRIP */}
        {isOpen && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
              document.body.style.userSelect = 'none';
              document.body.style.cursor = 'col-resize';
            }}
            onDoubleClick={() => {
              setPanelWidth(DEFAULT_WIDTH);
              onWidthChange?.(DEFAULT_WIDTH);
            }}
            className="group/handle absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-50 flex items-center justify-center select-none"
            title="Drag to resize, double-click to reset"
          >
            <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] transition-all duration-150 pointer-events-none ${
                isDragging ? 'bg-accent-secondary opacity-100' : 'opacity-0 group-hover/handle:opacity-100 group-hover/handle:bg-accent-secondary'
              }`}
            />
            <div className={`relative z-10 w-1 h-12 rounded-full transition-all duration-200 pointer-events-none ${
                isDragging ? 'bg-accent-secondary w-1.5 h-20 opacity-100' : 'bg-accent-secondary/60 group-hover/handle:bg-accent-secondary group-hover/handle:h-16 group-hover/handle:opacity-100 opacity-0'
              }`} 
            />
          </div>
        )}

        {/* RESET WIDTH TAB */}
        {isOpen && panelWidth !== DEFAULT_WIDTH && (
          <button
            type="button"
            onClick={() => {
              setPanelWidth(DEFAULT_WIDTH);
              onWidthChange?.(DEFAULT_WIDTH);
            }}
            className={[
              'group absolute top-16 -left-7 w-7 h-8 z-40',
              'flex items-center justify-center',
              'bg-[var(--panel-surface-bg)] border border-accent-secondary border-r-0 rounded-l-md',
              'hover:bg-surface-hover',
              'shadow-[-4px_0_12px_rgba(0,0,0,0.6)] transition-colors',
              animationsEnabled ? 'animate-mount-fade' : ''
            ].join(' ')}
            title="Reset to default width"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-accent-secondary group-hover:text-white transition-colors"
            >
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        )}

        {/* Panel Header */}
        <div className="right-side-panel-header">
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
            {title}
          </span>
          <div className="flex items-center gap-1">
            {/* Collapse Button */}
            <button type="button" onClick={onClose} className="right-side-panel-btn group" title="Collapse Panel">
              <ChevronRightIcon className="w-3.5 h-3.5 text-content-muted group-hover:text-content-primary origin-center transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:scale-115" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pl-3 pr-2 py-3">
          <div className="space-y-4 text-content-primary">
            {children ? (
              children
            ) : (
              <>
                {Array.from({ length: 80 }).map((_, i) => (
                  <div key={i} className="text-xs font-mono">
                    Test Row #{i + 1}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}