'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import {
  usePanelDockDrag,
  DockablePanelId,
  DockDropTargetZone,
  isDockZoneAllowed,
  DockContent,
  DockContents,
} from '@/hooks/usePanelDockDrag';

/* ==========================================================================
   Workspace docking: which content (tabs) sits in the primary (left) and secondary (right) side
   panels and the bottom panel, which panels and flyouts are open, their sizes, the slide animation
   when content changes sides, and drag-and-drop docking. Kept separate from the page so the page
   only composes. The behavior is unchanged from when it lived in app/page.tsx.
   ========================================================================== */

interface SlidingContentState {
  tabs: DockContent[];
  activeTab: DockContent;
  secondaryTabs?: DockContent[];
  secondaryActiveTab?: DockContent;
  from: 'left' | 'right';
  to: 'left' | 'right';
  width: number;
  secondaryWidth: number;
  isMoving: boolean;
  incomingContent?: Exclude<DockContent, 'empty'>;
}

export function useWorkspaceDock() {
  const { isPinned, isSecondaryPinned, isBottomPinned, animationsEnabled } = useUIPreferences();

  const [isCollectionsFlyoutOpen, setIsCollectionsFlyoutOpen] = useState(false);
  const [isTemplatesFlyoutOpen, setIsTemplatesFlyoutOpen] = useState(false);
  const [isPrimaryFlyoutOpen, setIsPrimaryFlyoutOpen] = useState<boolean>(false);
  const [isPrimarySidePanelOpen, setIsPrimarySidePanelOpen] = useState<boolean>(false);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState<boolean>(false);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(false);
  const [bottomPanelContent, setBottomPanelContent] = useState<'empty' | 'grabbed_content' | 'template_builder'>('empty');
  const isBottomActive = isBottomPanelOpen || isBottomPinned;
  const [primaryPanelWidth, setPrimaryPanelWidth] = useState<number>(304);
  const [secondaryPanelWidth, setSecondaryPanelWidth] = useState<number>(304);
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(220);

  const [primaryTabs, setPrimaryTabs] = useState<DockContent[]>([]);
  const [primaryActiveTab, setPrimaryActiveTab] = useState<DockContent>('empty');
  const [secondaryTabs, setSecondaryTabs] = useState<DockContent[]>([]);
  const [secondaryActiveTab, setSecondaryActiveTab] = useState<DockContent>('empty');

  const isPrimaryActive = isPinned || isPrimarySidePanelOpen;
  const isSecondaryActive = isSecondaryPinned || isSecondaryOpen;
  const dockContents: DockContents = {
    primary: primaryActiveTab,
    secondary: secondaryActiveTab,
    bottom: bottomPanelContent,
    primaryTabs,
    secondaryTabs,
    primaryActiveTab,
    secondaryActiveTab,
  };

  const handlePrimaryTabChange = useCallback((tab: DockContent) => {
    setPrimaryActiveTab(tab);
  }, []);

  const handleSecondaryTabChange = useCallback((tab: DockContent) => {
    setSecondaryActiveTab(tab);
  }, []);

  // Dynamic occupied widths for main content margin adjustments (only when pinned)
  const leftOccupiedWidth = isPinned && isPrimaryActive ? primaryPanelWidth : 0;
  const rightOccupiedWidth = isSecondaryPinned && isSecondaryActive ? secondaryPanelWidth : 0;

  /* ------------------------------------------------------------------------
     6. PANEL CONTENT MOVING & SWAPPING (Smooth Fluid Slide Transition)
     ------------------------------------------------------------------------ */

  const [slidingState, setSlidingState] = useState<SlidingContentState | null>(null);
  const slideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    };
  }, []);

  const handleMovePrimaryContent = useCallback(() => {
    if (primaryTabs.length === 0 || slidingState) return;

    // Check bottom panel routing: if bottom panel is active, empty, and primary has grabbed_content as only tab
    if (isBottomActive && bottomPanelContent === 'empty' && primaryTabs.length === 1 && primaryTabs[0] === 'grabbed_content') {
      setBottomPanelContent('grabbed_content');
      setPrimaryTabs([]);
      setPrimaryActiveTab('empty');
      setIsBottomPanelOpen(true);
      return;
    }

    const currentPrimaryTabs = [...primaryTabs];
    const currentPrimaryActive = primaryActiveTab;
    const currentSecondaryTabs = [...secondaryTabs];
    const currentSecondaryActive = secondaryActiveTab;

    if (!animationsEnabled) {
      setSecondaryTabs(currentPrimaryTabs);
      setSecondaryActiveTab(currentPrimaryActive);
      setPrimaryTabs(currentSecondaryTabs);
      setPrimaryActiveTab(currentSecondaryActive);
      setIsSecondaryOpen(true);
      return;
    }

    setIsSecondaryOpen(true);
    setPrimaryTabs([]);
    setPrimaryActiveTab('empty');
    setSecondaryTabs([]);
    setSecondaryActiveTab('empty');

    setSlidingState({
      tabs: currentPrimaryTabs,
      activeTab: currentPrimaryActive,
      secondaryTabs: currentSecondaryTabs.length > 0 ? currentSecondaryTabs : undefined,
      secondaryActiveTab: currentSecondaryTabs.length > 0 ? currentSecondaryActive : undefined,
      from: 'left',
      to: 'right',
      width: primaryPanelWidth,
      secondaryWidth: secondaryPanelWidth,
      isMoving: false,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlidingState((prev) => (prev ? { ...prev, isMoving: true } : null));
      });
    });

    if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = setTimeout(() => {
      setSecondaryTabs(currentPrimaryTabs);
      setSecondaryActiveTab(currentPrimaryActive);
      setPrimaryTabs(currentSecondaryTabs);
      setPrimaryActiveTab(currentSecondaryActive);
      setSlidingState(null);
    }, 500);
  }, [primaryTabs, primaryActiveTab, secondaryTabs, secondaryActiveTab, bottomPanelContent, isBottomActive, slidingState, animationsEnabled, primaryPanelWidth, secondaryPanelWidth]);

  const handleMoveSecondaryContent = useCallback(() => {
    if (secondaryTabs.length === 0 || slidingState) return;

    if (isBottomActive && bottomPanelContent === 'empty' && secondaryTabs.length === 1 && secondaryTabs[0] === 'grabbed_content') {
      setBottomPanelContent('grabbed_content');
      setSecondaryTabs([]);
      setSecondaryActiveTab('empty');
      setIsBottomPanelOpen(true);
      return;
    }

    const currentPrimaryTabs = [...primaryTabs];
    const currentPrimaryActive = primaryActiveTab;
    const currentSecondaryTabs = [...secondaryTabs];
    const currentSecondaryActive = secondaryActiveTab;

    if (!animationsEnabled) {
      setPrimaryTabs(currentSecondaryTabs);
      setPrimaryActiveTab(currentSecondaryActive);
      setSecondaryTabs(currentPrimaryTabs);
      setSecondaryActiveTab(currentPrimaryActive);
      setIsPrimarySidePanelOpen(true);
      return;
    }

    setIsPrimarySidePanelOpen(true);
    setPrimaryTabs([]);
    setPrimaryActiveTab('empty');
    setSecondaryTabs([]);
    setSecondaryActiveTab('empty');

    setSlidingState({
      tabs: currentSecondaryTabs,
      activeTab: currentSecondaryActive,
      secondaryTabs: currentPrimaryTabs.length > 0 ? currentPrimaryTabs : undefined,
      secondaryActiveTab: currentPrimaryTabs.length > 0 ? currentPrimaryActive : undefined,
      from: 'right',
      to: 'left',
      width: secondaryPanelWidth,
      secondaryWidth: primaryPanelWidth,
      isMoving: false,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlidingState((prev) => (prev ? { ...prev, isMoving: true } : null));
      });
    });

    if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = setTimeout(() => {
      setPrimaryTabs(currentSecondaryTabs);
      setPrimaryActiveTab(currentSecondaryActive);
      setSecondaryTabs(currentPrimaryTabs);
      setSecondaryActiveTab(currentPrimaryActive);
      setSlidingState(null);
    }, 500);
  }, [primaryTabs, primaryActiveTab, secondaryTabs, secondaryActiveTab, bottomPanelContent, isBottomActive, slidingState, animationsEnabled, primaryPanelWidth, secondaryPanelWidth]);

  /* ------------------------------------------------------------------------
     7. PANEL DOCK DRAG & DROP ORCHESTRATION (Pointer Events API)
     ------------------------------------------------------------------------ */
  const displacePanelContent = useCallback((from: 'left' | 'right', incoming: Exclude<DockContent, 'empty'>) => {
    const displacedTabs = from === 'left' ? [...primaryTabs] : [...secondaryTabs];
    const displacedActive = from === 'left' ? primaryActiveTab : secondaryActiveTab;

    setIsPrimarySidePanelOpen(true);
    setIsSecondaryOpen(true);
    setIsPrimaryFlyoutOpen(false);
    setIsCollectionsFlyoutOpen(false);

    if (!animationsEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (from === 'left') {
        setPrimaryTabs([incoming]);
        setPrimaryActiveTab(incoming);
        setSecondaryTabs(displacedTabs);
        setSecondaryActiveTab(displacedActive);
      } else {
        setSecondaryTabs([incoming]);
        setSecondaryActiveTab(incoming);
        setPrimaryTabs(displacedTabs);
        setPrimaryActiveTab(displacedActive);
      }
      return;
    }

    setPrimaryTabs([]);
    setPrimaryActiveTab('empty');
    setSecondaryTabs([]);
    setSecondaryActiveTab('empty');

    setSlidingState({
      tabs: displacedTabs,
      activeTab: displacedActive,
      incomingContent: incoming,
      from,
      to: from === 'left' ? 'right' : 'left',
      width: from === 'left' ? primaryPanelWidth : secondaryPanelWidth,
      secondaryWidth: from === 'left' ? secondaryPanelWidth : primaryPanelWidth,
      isMoving: false,
    });

    requestAnimationFrame(() => requestAnimationFrame(() => {
      setSlidingState(prev => prev ? { ...prev, isMoving: true } : null);
      requestAnimationFrame(() => {
        if (from === 'left') {
          setPrimaryTabs([incoming]);
          setPrimaryActiveTab(incoming);
        } else {
          setSecondaryTabs([incoming]);
          setSecondaryActiveTab(incoming);
        }
      });
      slideTimeoutRef.current = setTimeout(() => {
        if (from === 'left') {
          setSecondaryTabs(displacedTabs);
          setSecondaryActiveTab(displacedActive);
        } else {
          setPrimaryTabs(displacedTabs);
          setPrimaryActiveTab(displacedActive);
        }
        setSlidingState(null);
      }, 500);
    }));
  }, [primaryTabs, primaryActiveTab, secondaryTabs, secondaryActiveTab, animationsEnabled, primaryPanelWidth, secondaryPanelWidth]);

  const canMoveBottomLeft = !slidingState && isDockZoneAllowed('bottom', 'left', dockContents);
  const canMoveBottomRight = !slidingState && isDockZoneAllowed('bottom', 'right', dockContents);

  const handleDropPanel = useCallback(
    (panelId: DockablePanelId, targetZone: DockDropTargetZone, dropIndex?: number) => {
      if (slidingState) return;
      if (!isDockZoneAllowed(panelId, targetZone, dockContents)) return;

      setIsCollectionsFlyoutOpen(false);
      setIsTemplatesFlyoutOpen(false);
      setIsPrimaryFlyoutOpen(false);

      const getIncoming = (): DockContent => {
        if (
          panelId === 'items' ||
          panelId === 'collections' ||
          panelId === 'templates' ||
          panelId === 'grabbed_content' ||
          panelId === 'template_editor' ||
          panelId === 'template_builder' ||
          panelId === 'template_properties' ||
          panelId === 'template_hierarchy'
        )
          return panelId;
        if (panelId === 'primary') return primaryActiveTab;
        if (panelId === 'secondary') return secondaryActiveTab;
        if (panelId === 'bottom') return bottomPanelContent;
        return 'empty';
      };

      const incoming = getIncoming();
      if (incoming === 'empty' && targetZone !== 'remove') return;

      // Helper to remove a tab from a sidebar
      const removeTabFromPrimary = (item: DockContent) => {
        setPrimaryTabs((prev) => {
          const updated = prev.filter((t) => t !== item);
          setPrimaryActiveTab((curActive) => {
            if (curActive === item) {
              return updated.length > 0 ? updated[0] : 'empty';
            }
            return curActive;
          });
          return updated;
        });
      };

      const removeTabFromSecondary = (item: DockContent) => {
        setSecondaryTabs((prev) => {
          const updated = prev.filter((t) => t !== item);
          setSecondaryActiveTab((curActive) => {
            if (curActive === item) {
              return updated.length > 0 ? updated[0] : 'empty';
            }
            return curActive;
          });
          return updated;
        });
      };

      // 1. Remove
      if (targetZone === 'remove') {
        if (panelId === 'primary') {
          if (primaryActiveTab !== 'empty') removeTabFromPrimary(primaryActiveTab);
        } else if (panelId === 'secondary') {
          if (secondaryActiveTab !== 'empty') removeTabFromSecondary(secondaryActiveTab);
        } else if (panelId === 'bottom') {
          setBottomPanelContent('empty');
        } else if (
          panelId === 'items' ||
          panelId === 'collections' ||
          panelId === 'templates' ||
          panelId === 'grabbed_content' ||
          panelId === 'template_editor' ||
          panelId === 'template_builder' ||
          panelId === 'template_properties' ||
          panelId === 'template_hierarchy'
        ) {
          removeTabFromPrimary(panelId);
          removeTabFromSecondary(panelId);
          if (bottomPanelContent === panelId) setBottomPanelContent('empty');
        }
        return;
      }

      // 2. Add as tab to Left (Primary Side Bar) / Reorder
      if (targetZone === 'left-tab') {
        if (incoming === 'empty') return;
        removeTabFromSecondary(incoming);
        if (bottomPanelContent === incoming) setBottomPanelContent('empty');

        setPrimaryTabs((prev) => {
          const filtered = prev.filter((t) => t !== incoming);
          if (filtered.length >= 3) return prev;
          if (dropIndex !== undefined) {
            const clamped = Math.max(0, Math.min(dropIndex, filtered.length));
            return [...filtered.slice(0, clamped), incoming, ...filtered.slice(clamped)];
          }
          if (prev.includes(incoming)) return prev;
          return [...filtered, incoming];
        });
        setPrimaryActiveTab(incoming);
        setIsPrimarySidePanelOpen(true);
        return;
      }

      // 3. Add as tab to Right (Secondary Side Bar) / Reorder
      if (targetZone === 'right-tab') {
        if (incoming === 'empty') return;
        removeTabFromPrimary(incoming);
        if (bottomPanelContent === incoming) setBottomPanelContent('empty');

        setSecondaryTabs((prev) => {
          const filtered = prev.filter((t) => t !== incoming);
          if (filtered.length >= 3) return prev;
          if (dropIndex !== undefined) {
            const clamped = Math.max(0, Math.min(dropIndex, filtered.length));
            return [...filtered.slice(0, clamped), incoming, ...filtered.slice(clamped)];
          }
          if (prev.includes(incoming)) return prev;
          return [...filtered, incoming];
        });
        setSecondaryActiveTab(incoming);
        setIsSecondaryOpen(true);
        return;
      }

      // 4. Replace Left (Primary Side Bar) or Dock to empty Left
      if (targetZone === 'left-replace' || targetZone === 'left') {
        if (incoming === 'empty') {
          setIsPrimarySidePanelOpen(true);
          return;
        }

        // Direct drag from secondary header (swap full panels)
        if (panelId === 'secondary') {
          const curSecTabs = [...secondaryTabs];
          const curSecActive = secondaryActiveTab;
          const curPriTabs = [...primaryTabs];
          const curPriActive = primaryActiveTab;
          setPrimaryTabs(curSecTabs);
          setPrimaryActiveTab(curSecActive);
          setSecondaryTabs(curPriTabs);
          setSecondaryActiveTab(curPriActive);
          setIsPrimarySidePanelOpen(true);
          return;
        }

        if (panelId === 'primary') {
          setIsPrimarySidePanelOpen(true);
          return;
        }

        // Displace if primary has tabs and secondary is empty and incoming is not already there
        if (
          primaryTabs.length > 0 &&
          secondaryTabs.length === 0 &&
          !primaryTabs.includes(incoming)
        ) {
          displacePanelContent('left', incoming as Exclude<DockContent, 'empty'>);
          if (bottomPanelContent === incoming) setBottomPanelContent('empty');
        } else {
          // Standard replace
          removeTabFromSecondary(incoming);
          if (bottomPanelContent === incoming) setBottomPanelContent('empty');
          setPrimaryTabs([incoming]);
          setPrimaryActiveTab(incoming);
          setIsPrimarySidePanelOpen(true);
        }
        return;
      }

      // 5. Replace Right (Secondary Side Bar) or Dock to empty Right
      if (targetZone === 'right-replace' || targetZone === 'right') {
        if (incoming === 'empty') {
          setIsSecondaryOpen(true);
          return;
        }

        // Direct drag from primary header (swap full panels)
        if (panelId === 'primary') {
          const curPriTabs = [...primaryTabs];
          const curPriActive = primaryActiveTab;
          const curSecTabs = [...secondaryTabs];
          const curSecActive = secondaryActiveTab;
          setSecondaryTabs(curPriTabs);
          setSecondaryActiveTab(curPriActive);
          setPrimaryTabs(curSecTabs);
          setPrimaryActiveTab(curSecActive);
          setIsSecondaryOpen(true);
          return;
        }

        if (panelId === 'secondary') {
          setIsSecondaryOpen(true);
          return;
        }

        // Displace if secondary has tabs and primary is empty
        if (
          secondaryTabs.length > 0 &&
          primaryTabs.length === 0 &&
          !secondaryTabs.includes(incoming)
        ) {
          displacePanelContent('right', incoming as Exclude<DockContent, 'empty'>);
          if (bottomPanelContent === incoming) setBottomPanelContent('empty');
        } else {
          // Standard replace
          removeTabFromPrimary(incoming);
          if (bottomPanelContent === incoming) setBottomPanelContent('empty');
          setSecondaryTabs([incoming]);
          setSecondaryActiveTab(incoming);
          setIsSecondaryOpen(true);
        }
        return;
      }

      // 6. Dock to Bottom Panel
      if (targetZone === 'bottom') {
        if (incoming === 'grabbed_content' || incoming === 'template_builder') {
          setBottomPanelContent(incoming);
          removeTabFromPrimary(incoming);
          removeTabFromSecondary(incoming);
          setIsBottomPanelOpen(true);
        } else if (panelId === 'bottom') {
          setIsBottomPanelOpen(true);
        }
      }
    },
    [
      primaryTabs,
      primaryActiveTab,
      secondaryTabs,
      secondaryActiveTab,
      bottomPanelContent,
      slidingState,
      displacePanelContent,
      dockContents,
    ]
  );

  const {
    isDragging: isDraggingPanel,
    draggingPanel,
    hoveredZone,
    cursorPos,
    tabReorderInfo,
    isTabReorder,
    handlePointerDown: startDockDrag,
    cancelDrag,
  } = usePanelDockDrag({ onDropPanel: handleDropPanel, contents: dockContents });

  return {
    isCollectionsFlyoutOpen,
    setIsCollectionsFlyoutOpen,
    isTemplatesFlyoutOpen,
    setIsTemplatesFlyoutOpen,
    isPrimaryFlyoutOpen,
    setIsPrimaryFlyoutOpen,
    isPrimarySidePanelOpen,
    setIsPrimarySidePanelOpen,
    isSecondaryOpen,
    setIsSecondaryOpen,
    isBottomPanelOpen,
    setIsBottomPanelOpen,
    bottomPanelContent,
    setBottomPanelContent,
    primaryPanelWidth,
    setPrimaryPanelWidth,
    secondaryPanelWidth,
    setSecondaryPanelWidth,
    bottomPanelHeight,
    setBottomPanelHeight,
    primaryTabs,
    setPrimaryTabs,
    primaryActiveTab,
    setPrimaryActiveTab,
    secondaryTabs,
    setSecondaryTabs,
    secondaryActiveTab,
    setSecondaryActiveTab,
    slidingState,
    isBottomActive,
    isPrimaryActive,
    isSecondaryActive,
    handlePrimaryTabChange,
    handleSecondaryTabChange,
    leftOccupiedWidth,
    rightOccupiedWidth,
    handleMovePrimaryContent,
    handleMoveSecondaryContent,
    canMoveBottomLeft,
    canMoveBottomRight,
    handleDropPanel,
    isDraggingPanel,
    draggingPanel,
    hoveredZone,
    cursorPos,
    tabReorderInfo,
    isTabReorder,
    startDockDrag,
    cancelDrag,
  };
}
