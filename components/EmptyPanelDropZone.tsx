'use client';

import React from 'react';

interface EmptyPanelDropZoneProps {
  panelTitle: string;
  position?: 'left' | 'right' | 'bottom';
  description?: string;
  className?: string;
}

export default function EmptyPanelDropZone({
  panelTitle,
  position = 'left',
  description = 'Please drag-and-drop to populate it',
  className = '',
}: EmptyPanelDropZoneProps) {
  return (
    <div className={`w-full h-full flex-1 flex flex-col p-3 select-none ${className}`}>
      <div className="empty-panel-dropzone group">
        <div className="empty-panel-dropzone-badge">
          <span className="text-xl leading-none" aria-hidden="true">
            {position === 'bottom' ? '⬓' : position === 'right' ? '◨' : '◧'}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1 max-w-[220px]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-strong,rgba(226,232,240,1))]">
            {panelTitle} is empty
          </h4>
          <p className="text-[11px] text-[var(--text-muted,rgba(148,163,184,1))] leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
