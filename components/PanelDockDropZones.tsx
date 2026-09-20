'use client';

import React from 'react';
import { DockablePanelId, DockDropTargetZone, isDockZoneAllowed, DockContent } from '@/hooks/usePanelDockDrag';
import { TrashCanIcon, ProhibitedIcon } from '@/components/icons/PanelIcons';

interface PanelDockDropZonesProps {
  isDragging: boolean;
  draggingPanel: DockablePanelId | null;
  hoveredZone: DockDropTargetZone | null;
  cursorPos: { x: number; y: number };
  isTabReorder?: boolean;
  primaryPanelContent?: DockContent;
  secondaryPanelContent?: DockContent;
  bottomPanelContent?: 'empty' | 'grabbed_content' | 'template_builder';
  primaryTabs?: DockContent[];
  secondaryTabs?: DockContent[];
  primaryActiveTab?: DockContent;
  secondaryActiveTab?: DockContent;
}

export default function PanelDockDropZones({
  isDragging,
  draggingPanel,
  hoveredZone,
  cursorPos,
  isTabReorder = false,
  primaryPanelContent = 'empty',
  secondaryPanelContent = 'empty',
  bottomPanelContent = 'empty',
  primaryTabs,
  secondaryTabs,
  primaryActiveTab,
  secondaryActiveTab,
}: PanelDockDropZonesProps) {
  if (!isDragging || !draggingPanel || isTabReorder) return null;

  const leftTargetName = 'Primary Side Bar';
  const rightTargetName = 'Secondary Side Bar';

  const pTabs = primaryTabs ?? (primaryPanelContent !== 'empty' ? [primaryPanelContent] : []);
  const sTabs = secondaryTabs ?? (secondaryPanelContent !== 'empty' ? [secondaryPanelContent] : []);

  const getPanelContentName = (content: DockContent) => {
    switch (content) {
      case 'collections':
        return 'Collections';
      case 'explorer':
        return 'Items';
      case 'templates':
        return 'Templates';
      case 'template_editor':
        return 'Template Inspector';
      case 'template_builder':
        return 'Layout Builder';
      case 'template_properties':
        return 'Properties';
      case 'template_hierarchy':
        return 'Content Hierarchy';
      case 'grabbed_content':
        return 'Grabbed Content';
      default:
        return 'Content';
    }
  };

  const getIncomingContent = (id: DockablePanelId): DockContent => {
    switch (id) {
      case 'collections':
        return 'collections';
      case 'explorer':
        return 'explorer';
      case 'templates':
        return 'templates';
      case 'template_editor':
        return 'template_editor';
      case 'template_builder':
        return 'template_builder';
      case 'template_properties':
        return 'template_properties';
      case 'template_hierarchy':
        return 'template_hierarchy';
      case 'grabbed_content':
        return 'grabbed_content';
      case 'primary':
        return primaryActiveTab ?? primaryPanelContent;
      case 'secondary':
        return secondaryActiveTab ?? secondaryPanelContent;
      case 'bottom':
        return bottomPanelContent;
      default:
        return 'empty';
    }
  };

  const incomingContent = getIncomingContent(draggingPanel);
  const draggedItemName = getPanelContentName(incomingContent);
  const contents = {
    primary: primaryPanelContent,
    secondary: secondaryPanelContent,
    bottom: bottomPanelContent,
    primaryTabs: pTabs,
    secondaryTabs: sTabs,
    primaryActiveTab,
    secondaryActiveTab,
  };

  const isLeftTabAllowed = isDockZoneAllowed(draggingPanel, 'left-tab', contents);
  const isRightTabAllowed = isDockZoneAllowed(draggingPanel, 'right-tab', contents);
  const isBottomAllowed = isDockZoneAllowed(draggingPanel, 'bottom', contents);
  const isHoveredZoneAllowed = hoveredZone ? isDockZoneAllowed(draggingPanel, hoveredZone, contents) : true;

  return (
    <div className="dock-drop-overlay">
      {/* --------------------------------------------------------------------
          1. CURSOR-ATTACHED FLOATING DRAG BADGE
          -------------------------------------------------------------------- */}
      <div
        style={{
          transform: `translate3d(${cursorPos.x + 14}px, ${cursorPos.y + 14}px, 0)`,
        }}
        className={`dock-cursor-badge ${
          hoveredZone === 'remove'
            ? 'dock-cursor-badge-remove'
            : hoveredZone && !isHoveredZoneAllowed
            ? 'dock-cursor-badge-prohibited'
            : ''
        }`}
      >
        <span className="dock-cursor-badge-icon">
          {hoveredZone === 'remove' ? (
            <TrashCanIcon className="w-3.5 h-3.5" />
          ) : hoveredZone && !isHoveredZoneAllowed ? (
            <ProhibitedIcon className="w-3.5 h-3.5" />
          ) : (
            <span>❖</span>
          )}
        </span>
        <span>
          {hoveredZone === 'remove' ? (
            <>Remove <em>{draggedItemName}</em> Content</>
          ) : hoveredZone && !isHoveredZoneAllowed ? (
            hoveredZone === 'left-tab' && pTabs.length >= 3 ? (
              <>Max 3 Tabs in {leftTargetName}</>
            ) : hoveredZone === 'left-tab' && pTabs.includes(incomingContent) ? (
              <><em>{draggedItemName}</em> Already Docked as Tab</>
            ) : hoveredZone === 'right-tab' && sTabs.length >= 3 ? (
              <>Max 3 Tabs in {rightTargetName}</>
            ) : hoveredZone === 'right-tab' && sTabs.includes(incomingContent) ? (
              <><em>{draggedItemName}</em> Already Docked as Tab</>
            ) : (
              <>Cannot Dock <em>{draggedItemName}</em> Here</>
            )
          ) : hoveredZone === 'left-tab' ? (
            pTabs.includes(incomingContent) ? (
              <>Reorder <em>{draggedItemName}</em> in {leftTargetName}</>
            ) : (
              <>Dock <em>{draggedItemName}</em> as Tab to {leftTargetName}</>
            )
          ) : hoveredZone === 'left-replace' ? (
            <>Replace {leftTargetName} with <em>{draggedItemName}</em></>
          ) : hoveredZone === 'left' ? (
            <>Dock <em>{draggedItemName}</em> to {leftTargetName}</>
          ) : hoveredZone === 'right-tab' ? (
            sTabs.includes(incomingContent) ? (
              <>Reorder <em>{draggedItemName}</em> in {rightTargetName}</>
            ) : (
              <>Dock <em>{draggedItemName}</em> as Tab to {rightTargetName}</>
            )
          ) : hoveredZone === 'right-replace' ? (
            <>Replace {rightTargetName} with <em>{draggedItemName}</em></>
          ) : hoveredZone === 'right' ? (
            <>Dock <em>{draggedItemName}</em> to {rightTargetName}</>
          ) : hoveredZone === 'bottom' ? (
            <>Dock <em>{draggedItemName}</em> to Bottom Panel</>
          ) : (
            <>Docking: <em>{draggedItemName}</em></>
          )}
        </span>
      </div>

      {/* --------------------------------------------------------------------
          2. WORKSPACE BOUNDARY OVERLAY (Inset between Nav Header & Footer)
          -------------------------------------------------------------------- */}
      <div className="dock-drop-workspace-bounds animate-mount-fade">
        {/* LEFT DOCK TARGET (Split if tabs exist, single card if empty) */}
        {pTabs.length > 0 ? (
          <div className="dock-zone-side-container">
            {/* Tab Drop Zone */}
            <div
              style={{ '--dock-target-color': isLeftTabAllowed ? 'var(--dock-valid-color)' : 'rgba(248,188,9,1)' } as React.CSSProperties}
              className={`dock-zone-side-tab ${
                !isLeftTabAllowed ? 'dock-zone-side-tab-prohibited' : ''
              } ${
                hoveredZone === 'left-tab'
                  ? isLeftTabAllowed
                    ? 'dock-zone-side-tab-active'
                    : 'dock-zone-side-tab-prohibited-active'
                  : ''
              }`}
            >
              <div
                className={`dock-zone-side-pill ${
                  hoveredZone === 'left-tab'
                    ? isLeftTabAllowed
                      ? 'dock-zone-side-pill-active'
                      : 'dock-zone-bottom-pill-prohibited-active'
                    : !isLeftTabAllowed
                    ? 'dock-zone-bottom-pill-prohibited'
                    : ''
                }`}
              >
                <span>⧉</span>
                <span>
                  {!isLeftTabAllowed ? (
                    pTabs.length >= 3 ? (
                      <>Max 3 tabs in {leftTargetName}</>
                    ) : (
                      <>Cannot add tab here</>
                    )
                  ) : pTabs.includes(incomingContent) ? (
                    <>Reorder <em>{draggedItemName}</em> in {leftTargetName}</>
                  ) : (
                    <>Dock <em>{draggedItemName}</em> as Tab</>
                  )}
                </span>
              </div>
              <span
                className={`dock-zone-side-text ${
                  hoveredZone === 'left-tab'
                    ? isLeftTabAllowed
                      ? 'dock-zone-side-text-active'
                      : 'dock-zone-bottom-text-prohibited-active'
                    : ''
                }`}
              >
                {!isLeftTabAllowed ? (
                  pTabs.length >= 3
                    ? 'Maximum limit reached (3 tabs)'
                    : 'Cannot dock here'
                ) : hoveredZone === 'left-tab' ? (
                  pTabs.includes(incomingContent) ? 'Release mouse to reorder tab' : 'Release mouse to add as tab'
                ) : (
                  pTabs.includes(incomingContent) ? 'Drop here to reorder tab' : 'Drop here to add as tab'
                )}
              </span>
            </div>

            {/* Replace Drop Zone */}
            <div
              style={{ '--dock-target-color': 'var(--dock-valid-color)' } as React.CSSProperties}
              className={`dock-zone-side-replace ${
                hoveredZone === 'left-replace' ? 'dock-zone-side-replace-active' : ''
              }`}
            >
              <div
                className={`dock-zone-side-pill ${
                  hoveredZone === 'left-replace' ? 'dock-zone-side-pill-active' : ''
                }`}
              >
                <span>◧</span>
                <span>
                  Replace {leftTargetName} with <em>{draggedItemName}</em>
                </span>
              </div>
              <span
                className={`dock-zone-side-text ${
                  hoveredZone === 'left-replace' ? 'dock-zone-side-text-active' : ''
                }`}
              >
                {hoveredZone === 'left-replace'
                  ? 'Release mouse to replace panel'
                  : 'Drop here to replace panel'}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{ '--dock-target-color': 'var(--dock-valid-color)' } as React.CSSProperties}
            className={`dock-zone-side ${
              hoveredZone === 'left' || hoveredZone === 'left-replace' ? 'dock-zone-side-active' : ''
            }`}
          >
            <div
              className={`dock-zone-side-pill ${
                hoveredZone === 'left' || hoveredZone === 'left-replace'
                  ? 'dock-zone-side-pill-active'
                  : ''
              }`}
            >
              <span>◧</span>
              <span>
                Dock <em>{draggedItemName}</em> to {leftTargetName}
              </span>
            </div>
            <span
              className={`dock-zone-side-text ${
                hoveredZone === 'left' || hoveredZone === 'left-replace'
                  ? 'dock-zone-side-text-active'
                  : ''
              }`}
            >
              {hoveredZone === 'left' || hoveredZone === 'left-replace'
                ? 'Release mouse to dock here'
                : 'Drop Left'}
            </span>
          </div>
        )}

        {/* CENTER COLUMN: TRASH / REMOVE ZONE, CANVAS HINT & BOTTOM DOCK TARGET */}
        <div className="dock-zone-center-column">
          {/* TRASH / REMOVE FROM SIDEBAR TARGET */}
          <div
            className={`dock-zone-remove ${
              hoveredZone === 'remove' ? 'dock-zone-remove-active' : ''
            }`}
          >
            <div
              className={`dock-zone-remove-pill ${
                hoveredZone === 'remove' ? 'dock-zone-remove-pill-active' : ''
              }`}
            >
              <TrashCanIcon className="w-4 h-4 shrink-0" />
              <span>Remove <em>{draggedItemName}</em> Content</span>
            </div>
            <span
              className={`dock-zone-remove-text ${
                hoveredZone === 'remove' ? 'dock-zone-remove-text-active' : ''
              }`}
            >
              {hoveredZone === 'remove' ? 'Release mouse to remove content' : 'Drop here to remove docked content'}
            </span>
          </div>

          <div className="dock-zone-canvas-hint">
            Main Workspace Canvas
          </div>

          {/* BOTTOM DOCK TARGET (Valid or Incompatible State) */}
          <div
            className={`dock-zone-bottom ${
              !isBottomAllowed
                ? `dock-zone-bottom-prohibited ${
                    hoveredZone === 'bottom' ? 'dock-zone-bottom-prohibited-active' : ''
                  }`
                : hoveredZone === 'bottom'
                ? 'dock-zone-bottom-active'
                : ''
            }`}
          >
            <div
              className={`dock-zone-bottom-pill ${
                !isBottomAllowed
                  ? `dock-zone-bottom-pill-prohibited ${
                      hoveredZone === 'bottom' ? 'dock-zone-bottom-pill-prohibited-active' : ''
                    }`
                  : hoveredZone === 'bottom'
                  ? 'dock-zone-bottom-pill-active'
                  : ''
              }`}
            >
              {!isBottomAllowed ? (
                /* Incompatible / Slashed NO Dock Icon */
                <span className="dock-zone-prohibited-icon" aria-hidden="true">
                  <ProhibitedIcon className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span>⬓</span>
              )}
              <span>
                {!isBottomAllowed ? (
                  <>Cannot dock <em>{draggedItemName}</em> to Bottom Panel</>
                ) : (
                  <>Dock <em>{draggedItemName}</em> to Bottom Panel</>
                )}
              </span>
            </div>
            <span
              className={`dock-zone-bottom-text ${
                !isBottomAllowed
                  ? `dock-zone-bottom-text-prohibited ${
                      hoveredZone === 'bottom' ? 'dock-zone-bottom-text-prohibited-active' : ''
                    }`
                  : hoveredZone === 'bottom'
                  ? 'dock-zone-bottom-text-active'
                  : ''
              }`}
            >
              {!isBottomAllowed ? (
                <><em>{draggedItemName}</em> may only be docked to a Side Panel</>
              ) : hoveredZone === 'bottom' ? (
                'Release mouse to dock here'
              ) : (
                'Drop Bottom'
              )}
            </span>
          </div>
        </div>

        {/* RIGHT DOCK TARGET (Split if tabs exist, single card if empty) */}
        {sTabs.length > 0 ? (
          <div className="dock-zone-side-container">
            {/* Tab Drop Zone */}
            <div
              style={{ '--dock-target-color': isRightTabAllowed ? 'var(--dock-valid-color)' : 'rgba(248,188,9,1)' } as React.CSSProperties}
              className={`dock-zone-side-tab ${
                !isRightTabAllowed ? 'dock-zone-side-tab-prohibited' : ''
              } ${
                hoveredZone === 'right-tab'
                  ? isRightTabAllowed
                    ? 'dock-zone-side-tab-active'
                    : 'dock-zone-side-tab-prohibited-active'
                  : ''
              }`}
            >
              <div
                className={`dock-zone-side-pill ${
                  hoveredZone === 'right-tab'
                    ? isRightTabAllowed
                      ? 'dock-zone-side-pill-active'
                      : 'dock-zone-bottom-pill-prohibited-active'
                    : !isRightTabAllowed
                    ? 'dock-zone-bottom-pill-prohibited'
                    : ''
                }`}
              >
                <span>⧉</span>
                <span>
                  {!isRightTabAllowed ? (
                    sTabs.length >= 3 ? (
                      <>Max 3 tabs in {rightTargetName}</>
                    ) : (
                      <>Cannot add tab here</>
                    )
                  ) : sTabs.includes(incomingContent) ? (
                    <>Reorder <em>{draggedItemName}</em> in {rightTargetName}</>
                  ) : (
                    <>Dock <em>{draggedItemName}</em> as Tab</>
                  )}
                </span>
              </div>
              <span
                className={`dock-zone-side-text ${
                  hoveredZone === 'right-tab'
                    ? isRightTabAllowed
                      ? 'dock-zone-side-text-active'
                      : 'dock-zone-bottom-text-prohibited-active'
                    : ''
                }`}
              >
                {!isRightTabAllowed ? (
                  sTabs.length >= 3
                    ? 'Maximum limit reached (3 tabs)'
                    : 'Cannot dock here'
                ) : hoveredZone === 'right-tab' ? (
                  sTabs.includes(incomingContent) ? 'Release mouse to reorder tab' : 'Release mouse to add as tab'
                ) : (
                  sTabs.includes(incomingContent) ? 'Drop here to reorder tab' : 'Drop here to add as tab'
                )}
              </span>
            </div>

            {/* Replace Drop Zone */}
            <div
              style={{ '--dock-target-color': 'var(--dock-valid-color)' } as React.CSSProperties}
              className={`dock-zone-side-replace ${
                hoveredZone === 'right-replace' ? 'dock-zone-side-replace-active' : ''
              }`}
            >
              <div
                className={`dock-zone-side-pill ${
                  hoveredZone === 'right-replace' ? 'dock-zone-side-pill-active' : ''
                }`}
              >
                <span>◨</span>
                <span>
                  Replace {rightTargetName} with <em>{draggedItemName}</em>
                </span>
              </div>
              <span
                className={`dock-zone-side-text ${
                  hoveredZone === 'right-replace' ? 'dock-zone-side-text-active' : ''
                }`}
              >
                {hoveredZone === 'right-replace'
                  ? 'Release mouse to replace panel'
                  : 'Drop here to replace panel'}
              </span>
            </div>
          </div>
        ) : (
          <div
            style={{ '--dock-target-color': 'var(--dock-valid-color)' } as React.CSSProperties}
            className={`dock-zone-side ${
              hoveredZone === 'right' || hoveredZone === 'right-replace' ? 'dock-zone-side-active' : ''
            }`}
          >
            <div
              className={`dock-zone-side-pill ${
                hoveredZone === 'right' || hoveredZone === 'right-replace'
                  ? 'dock-zone-side-pill-active'
                  : ''
              }`}
            >
              <span>◨</span>
              <span>
                Dock <em>{draggedItemName}</em> to {rightTargetName}
              </span>
            </div>
            <span
              className={`dock-zone-side-text ${
                hoveredZone === 'right' || hoveredZone === 'right-replace'
                  ? 'dock-zone-side-text-active'
                  : ''
              }`}
            >
              {hoveredZone === 'right' || hoveredZone === 'right-replace'
                ? 'Release mouse to dock here'
                : 'Drop Right'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
