'use client';

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/SystemIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

interface RightPanelProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 720;

export default function RightPanel({
  isOpen,
  onOpen,
  onClose,
  title = "Details",
  children,
}: RightPanelProps) {
  const { animationsEnabled } = useUIPreferences();
  
  const [panelWidth, setPanelWidth] = useState<number>(360);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  // Synchronize drag state into a ref for global window listeners
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      // Calculate panel width from viewport right edge
      const rawWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.min(Math.max(rawWidth, MIN_WIDTH), Math.min(MAX_WIDTH, window.innerWidth * 0.75));
      setPanelWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // While dragging, turn off transitions completely so resizing has zero input latency
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
        <ChevronLeftIcon
          className="w-3.5 h-3.5 origin-center transition-transform duration-200 ease-out group-hover:-translate-x-0.5 group-hover:scale-115"
        />
      </button>

      {/* 2. DOCKED RIGHT PANEL */}
      <aside
        style={{
          width: isOpen ? `${panelWidth}px` : undefined,
        }}
        className={[
          'right-side-panel relative',
          transitionClass,
          isOpen ? 'right-panel-docked-open' : 'right-panel-docked-closed',
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
            className="group/handle absolute top-0 -left-1.5 w-3 h-full cursor-col-resize z-50 flex items-center justify-center select-none"
            title="Drag to resize panel"
          >
            {/* Full-height amber seam line */}
            <div
              className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[5px] transition-all duration-150 pointer-events-none ${
                isDragging
                  ? 'bg-accent-secondary opacity-100'
                  : 'opacity-0 group-hover/handle:opacity-100 group-hover/handle:bg-accent-secondary'
              }`}
            />

            {/* Visual indicator handle pill */}
            <div 
              className={`relative z-10 w-1 h-12 rounded-full transition-all duration-200 pointer-events-none ${
                isDragging 
                  ? 'bg-accent-secondary w-1.5 h-20 opacity-100' 
                  : 'bg-accent-secondary/60 group-hover/handle:bg-accent-secondary group-hover/handle:h-16 group-hover/handle:opacity-100 opacity-0'
              }`} 
            />
          </div>
        )}

        {/* Panel Header */}
        <div className="right-side-panel-header">
          <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
            {title}
          </span>

          {/* Collapse Button */}
          <button
            type="button"
            onClick={onClose}
            className="right-side-panel-btn group"
            title="Collapse Panel"
          >
            <ChevronRightIcon
              className="w-3.5 h-3.5 text-content-muted group-hover:text-content-primary origin-center transition-all duration-200 ease-out group-hover:translate-x-0.5 group-hover:scale-115"
            />
          </button>
        </div>

        {/* Panel Body with Left-Rail Scrollbar */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pl-3 pr-2 py-3"
          style={{ direction: 'rtl' }}
        >
          <div 
            className="space-y-4 text-content-primary"
            style={{ direction: 'ltr' }}
          >
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