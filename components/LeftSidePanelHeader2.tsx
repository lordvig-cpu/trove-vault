'use client';

import React from 'react';
import {
  FolderCollapseIcon,
  FolderExpandIcon,
  PinFilledIcon,
  PinOutlineIcon,
} from '@/components/icons/ExplorerIcons';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Props for LeftSidePanelHeader2.
 * @property variant - Presentation variant: floating popover ('flyout') or docked split column ('sidebar')
 * @property isPinned - Controls icon display state (filled vs outline) for docking/pinning
 * @property searchQuery - Current text query bound to the search input
 * @property onSearchChange - Callback updating active search text in the parent hook
 * @property isAnyFolderExpanded - Dictates whether bulk toggle shows Expand All or Collapse All
 * @property onToggleAllFolders - Optional handler to expand or collapse all collection folders
 * @property onTogglePin - Toggles docked sidebar status vs unpinned floating state
 * @property onClose - Dismissal handler invoked by the flyout close (✕) button
 */
interface LeftSidePanelHeaderProps {
  variant: 'flyout' | 'sidebar';
  isPinned: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  isAnyFolderExpanded?: boolean;
  onToggleAllFolders?: () => void;
  onTogglePin: () => void;
  onClose: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: LeftSidePanelHeader2
   ========================================================================== */

export default function LeftSidePanelHeader2({
  variant,
  isPinned,
  searchQuery,
  onSearchChange,
  isAnyFolderExpanded = false,
  onToggleAllFolders,
  onTogglePin,
  onClose,
}: LeftSidePanelHeaderProps) {
  return (
    <div className="left-side-panel-header px-2.5 py-2 flex items-center justify-between gap-2 border-b border-border-subtle shrink-0">
      {/* --------------------------------------------------------------------
          2.1 SEARCH INPUT & SHORTCUT BADGE
          Dynamic input variant with clear button and global Ctrl+K indicator.
          Styled via pure rgba tokens in leftSidePanel.css.
          -------------------------------------------------------------------- */}
      <div className="relative flex-1 min-w-0 max-w-[280px]">
        {/* Leading Search Glyph */}
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none text-xs select-none">
          🔍
        </span>

        {/* Input Target */}
        <input
          id={`explorer-search-input-${variant}`}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className={[
            'explorer-search-input',
            searchQuery.length > 0 ? 'explorer-search-input-active' : '',
          ].join(' ')}
        />

        {/* Clear Search Trigger (Rendered when text is entered) */}
        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="group absolute right-1.5 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary transition-colors text-xs cursor-pointer p-0.5"
            title="Clear search"
          >
            <span className="inline-block origin-center transition-transform duration-200 group-hover:scale-115">
              ✕
            </span>
          </button>
        ) : (
          /* Keyboard Accelerator Hint */
          <kbd className="explorer-search-kbd">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* --------------------------------------------------------------------
          2.2 ACTION CONTROLS
          Buttons for bulk folder toggling, pin mode switching, and closing.
          -------------------------------------------------------------------- */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Bulk Expand / Collapse Accordion Toggle */}
        {onToggleAllFolders && (
          <button
            type="button"
            onClick={onToggleAllFolders}
            disabled={searchQuery.trim().length > 0}
            className="left-side-panel-pin-btn group disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed"
            title={
              searchQuery.trim().length > 0
                ? 'Folder expansion disabled during search'
                : isAnyFolderExpanded
                ? 'Collapse all folders'
                : 'Expand all folders'
            }
          >
            {isAnyFolderExpanded ? (
              <FolderCollapseIcon className="w-3.5 h-3.5 text-content-muted" />
            ) : (
              <FolderExpandIcon className="w-3.5 h-3.5 text-content-muted" />
            )}
          </button>
        )}

        {/* Pin / Dock Mode Toggle */}
        <button
          type="button"
          onClick={onTogglePin}
          className="left-side-panel-pin-btn group"
          title={isPinned ? 'Unpin LeftSidePanel' : 'Pin LeftSidePanel'}
        >
          {variant === 'flyout' || !isPinned ? (
            <PinOutlineIcon className="w-3.5 h-3.5 text-content-muted" />
          ) : (
            <PinFilledIcon className="w-3.5 h-3.5 text-content-primary" />
          )}
        </button>

        {/* Close Button (Flyout Mode Only) */}
        {variant === 'flyout' && (
          <button
            type="button"
            onClick={onClose}
            className="left-side-panel-pin-btn group"
            title="Close Explorer"
          >
            <span className="inline-block origin-center transition-transform duration-200 ease-out group-hover:scale-115 text-xs text-content-primary px-1.5 select-none">
              ✕
            </span>
          </button>
        )}
      </div>
    </div>
  );
}