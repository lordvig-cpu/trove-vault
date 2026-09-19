'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useExplorerCategories } from '@/hooks/useExplorerCategories';
import { usePanelDockDrag, DockablePanelId, DockDropTargetZone, isDockZoneAllowed } from '@/hooks/usePanelDockDrag';
import NavigationHeader from '@/components/NavigationHeader';
import NavigationFooter from '@/components/NavigationFooter';
import MainContent from '@/components/MainContent';
import PrimarySidePanel from '@/components/PrimarySidePanel';
import PrimarySidePanelHeader from '@/components/PrimarySidePanelHeader';
import SecondarySidePanel from '@/components/SecondarySidePanel';
import BottomPanel from '@/components/BottomPanel';
import PanelDockDropZones from '@/components/PanelDockDropZones';
import ExplorerContent from '@/components/ExplorerContent';
import ModalContainers from '@/components/ModalContainers';
import DynamicWatermark from '@/components/DynamicWatermark';
import { filterExplorerForest, ExplorerTab } from '@/lib/filterExplorerForest';
import { itemMatchesQuery } from '@/lib/explorerUtils';

export default function Home() {
  /* ------------------------------------------------------------------------
     1. DATA LAYER (Supabase Records, Trees & CRUD Mutations)
     ------------------------------------------------------------------------ */
  const {
    allCollections,
    allItems,
    templates,
    activeCollectionId,
    setActiveCollectionId,
    activeCollection,
    selectedItem,
    setSelectedItem,
    selectItemWithChildren,
    unifiedForest,
    loading,
    error,
    fetchAllData,
    renameCollection,
    renameItem,
  } = useCollections();

  /* ------------------------------------------------------------------------
     2. MODAL DIALOG STATE
     ------------------------------------------------------------------------ */
  const {
    activeModal,
    closeModal,
    openTemplateManager,
    openDeleteCollection,
    openCreateCollection,
    openCreateItem,
    openEditItem,
    openDeleteItem,
  } = useModals();

  /* ------------------------------------------------------------------------
     3. EXPLORER TABS, FILTERS & TREE STATE
     ------------------------------------------------------------------------ */
  const [activeExplorerTab, setActiveExplorerTab] = useState<ExplorerTab>('items');
  const [filterCollectionIds, setFilterCollectionIds] = useState<number[]>([]);

  const handleToggleFilterCollection = (id: number) => {
    setFilterCollectionIds((prev) => 
      prev.includes(id) ? prev.filter((colId) => colId !== id) : [...prev, id]
    );
    setActiveExplorerTab('collections');
  };

  const handleClearCollectionFilters = () => {
    setFilterCollectionIds([]);
  };

  const filteredForest = useMemo(() => filterExplorerForest(
    unifiedForest,
    filterCollectionIds,
    activeExplorerTab,
    allItems,
    allCollections,
    templates
  ), [unifiedForest, filterCollectionIds, activeExplorerTab, allItems, allCollections, templates]);

  const {
    searchQuery,
    setSearchQuery,
    expandedCategoryIds,
    isAnyCategoryExpanded,
    handleToggleCategory,
    handleToggleAllCategories,
  } = useExplorerCategories(filteredForest);

  /* ------------------------------------------------------------------------
     4. GLOBAL UI & LAYOUT PREFERENCES
     ------------------------------------------------------------------------ */
  const {
    isPinned,
    setIsPinned,
    isSecondaryPinned,
    setIsSecondaryPinned,
    isBottomPinned,
    setIsBottomPinned,
    isAudioEnabled,
    animationsEnabled,
    isHydrated,
  } = useUIPreferences();

  /* ------------------------------------------------------------------------
     5. LOCAL VIEWPORT & INTERACTION STATES
     ------------------------------------------------------------------------ */
  const [isLogoHovered, setIsLogoHovered] = useState<boolean>(false);
  const [isPrimaryFlyoutOpen, setIsPrimaryFlyoutOpen] = useState<boolean>(false);
  const [isPrimarySidePanelOpen, setIsPrimarySidePanelOpen] = useState<boolean>(false);
  const [isSecondaryOpen, setIsSecondaryOpen] = useState<boolean>(false);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(false);
  const [bottomPanelContent, setBottomPanelContent] = useState<'empty' | 'grabbed_content'>('empty');
  const isBottomActive = isBottomPanelOpen || isBottomPinned;
  const [isColDropdownOpen, setIsColDropdownOpen] = useState<boolean>(false);
  const [primaryPanelWidth, setPrimaryPanelWidth] = useState<number>(304);
  const [secondaryPanelWidth, setSecondaryPanelWidth] = useState<number>(304);
  const [bottomPanelHeight, setBottomPanelHeight] = useState<number>(220);

  const [primaryPanelContent, setPrimaryPanelContent] = useState<'empty' | 'explorer' | 'grabbed_content'>('empty');
  const [secondaryPanelContent, setSecondaryPanelContent] = useState<'empty' | 'explorer' | 'grabbed_content'>('empty');

  const isPrimaryActive = isPinned || isPrimarySidePanelOpen;
  const isSecondaryActive = isSecondaryPinned || isSecondaryOpen;
  const dockContents = { primary: primaryPanelContent, secondary: secondaryPanelContent, bottom: bottomPanelContent };


  // Dynamic occupied widths for main content margin adjustments (only when pinned)
  const leftOccupiedWidth = isPinned && isPrimaryActive ? primaryPanelWidth : 0;
  const rightOccupiedWidth = isSecondaryPinned && isSecondaryActive ? secondaryPanelWidth : 0;

  /* ------------------------------------------------------------------------
     6. PANEL CONTENT MOVING & SWAPPING (Smooth Fluid Slide Transition)
     ------------------------------------------------------------------------ */
  interface SlidingContentState {
    content: 'empty' | 'explorer' | 'grabbed_content';
    secondaryContent?: 'empty' | 'explorer' | 'grabbed_content';
    from: 'left' | 'right';
    to: 'left' | 'right';
    width: number;
    secondaryWidth: number;
    isMoving: boolean;
    incomingContent?: 'explorer' | 'grabbed_content';
  }

  const [slidingState, setSlidingState] = useState<SlidingContentState | null>(null);
  const slideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    };
  }, []);

  const handleMovePrimaryContent = useCallback(() => {
    if (primaryPanelContent === 'empty' || slidingState) return;

    // Check bottom panel routing: if bottom panel is active, empty, and primary content is allowed in bottom ('grabbed_content')
    if (isBottomActive && bottomPanelContent === 'empty' && primaryPanelContent === 'grabbed_content') {
      setBottomPanelContent('grabbed_content');
      setPrimaryPanelContent('empty');
      setIsBottomPanelOpen(true);
      return;
    }

    const currentPrimary = primaryPanelContent;
    const currentSecondary = secondaryPanelContent;

    if (!animationsEnabled) {
      setSecondaryPanelContent(currentPrimary);
      setPrimaryPanelContent(currentSecondary);
      setIsSecondaryOpen(true);
      return;
    }

    // Open destination sidebar to receive incoming content
    setIsSecondaryOpen(true);
    // Temporarily clear static contents while sliding clone animates across
    setPrimaryPanelContent('empty');
    setSecondaryPanelContent('empty');

    setSlidingState({
      content: currentPrimary,
      secondaryContent: currentSecondary !== 'empty' ? currentSecondary : undefined,
      from: 'left',
      to: 'right',
      width: primaryPanelWidth,
      secondaryWidth: secondaryPanelWidth,
      isMoving: false,
    });

    // Double-rAF ensures browser paints initial starting coordinates before initiating transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSlidingState((prev) => (prev ? { ...prev, isMoving: true } : null));
      });
    });

    if (slideTimeoutRef.current) clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = setTimeout(() => {
      setSecondaryPanelContent(currentPrimary);
      setPrimaryPanelContent(currentSecondary);
      setSlidingState(null);
    }, 500);
  }, [primaryPanelContent, secondaryPanelContent, bottomPanelContent, isBottomActive, slidingState, animationsEnabled, primaryPanelWidth, secondaryPanelWidth]);

  const handleMoveSecondaryContent = useCallback(() => {
    if (secondaryPanelContent === 'empty' || slidingState) return;

    // Check bottom panel routing: if bottom panel is active, empty, and secondary content is allowed in bottom ('grabbed_content')
    if (isBottomActive && bottomPanelContent === 'empty' && secondaryPanelContent === 'grabbed_content') {
      setBottomPanelContent('grabbed_content');
      setSecondaryPanelContent('empty');
      setIsBottomPanelOpen(true);
      return;
    }

    const currentPrimary = primaryPanelContent;
    const currentSecondary = secondaryPanelContent;

    if (!animationsEnabled) {
      setPrimaryPanelContent(currentSecondary);
      setSecondaryPanelContent(currentPrimary);
      setIsPrimarySidePanelOpen(true);
      return;
    }

    // Open destination sidebar to receive incoming content
    setIsPrimarySidePanelOpen(true);
    setPrimaryPanelContent('empty');
    setSecondaryPanelContent('empty');

    setSlidingState({
      content: currentSecondary,
      secondaryContent: currentPrimary !== 'empty' ? currentPrimary : undefined,
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
      setPrimaryPanelContent(currentSecondary);
      setSecondaryPanelContent(currentPrimary);
      setSlidingState(null);
    }, 500);
  }, [primaryPanelContent, secondaryPanelContent, bottomPanelContent, isBottomActive, slidingState, animationsEnabled, primaryPanelWidth, secondaryPanelWidth]);

  /* ------------------------------------------------------------------------
     7. PANEL DOCK DRAG & DROP ORCHESTRATION (Pointer Events API)
     ------------------------------------------------------------------------ */
  const displacePanelContent = useCallback((from: 'left' | 'right', incoming: 'explorer' | 'grabbed_content') => {
    const displaced = from === 'left' ? primaryPanelContent : secondaryPanelContent;
    setIsPrimarySidePanelOpen(true);
    setIsSecondaryOpen(true);
    setIsPrimaryFlyoutOpen(false);
    if (!animationsEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPrimaryPanelContent(from === 'left' ? incoming : displaced);
      setSecondaryPanelContent(from === 'right' ? incoming : displaced);
      return;
    }
    setPrimaryPanelContent('empty');
    setSecondaryPanelContent('empty');
    setSlidingState({
      content: displaced,
      incomingContent: incoming,
      from,
      to: from === 'left' ? 'right' : 'left',
      width: from === 'left' ? primaryPanelWidth : secondaryPanelWidth,
      secondaryWidth: from === 'left' ? secondaryPanelWidth : primaryPanelWidth,
      isMoving: false,
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setSlidingState(prev => prev ? { ...prev, isMoving: true } : null);
      // Release fade suppression before introducing the new content.
      requestAnimationFrame(() => {
        if (from === 'left') setPrimaryPanelContent(incoming);
        else setSecondaryPanelContent(incoming);
      });
      slideTimeoutRef.current = setTimeout(() => {
        if (from === 'left') setSecondaryPanelContent(displaced);
        else setPrimaryPanelContent(displaced);
        setSlidingState(null);
      }, 500);
    }));
  }, [primaryPanelContent, secondaryPanelContent, animationsEnabled, primaryPanelWidth, secondaryPanelWidth]);

  const canMoveBottomLeft = !slidingState && isDockZoneAllowed('bottom', 'left', dockContents);
  const canMoveBottomRight = !slidingState && isDockZoneAllowed('bottom', 'right', dockContents);

  const handleDropPanel = useCallback(
    (panelId: DockablePanelId, targetZone: DockDropTargetZone) => {
      if (slidingState) return;
      if (!isDockZoneAllowed(panelId, targetZone, { primary: primaryPanelContent, secondary: secondaryPanelContent, bottom: bottomPanelContent })) return;

      // 1. Remove from sidebar target
      if (targetZone === 'remove') {
        if (panelId === 'primary') {
          setPrimaryPanelContent('empty');
        } else if (panelId === 'secondary') {
          setSecondaryPanelContent('empty');
        } else if (panelId === 'bottom') {
          setBottomPanelContent('empty');
        } else if (panelId === 'explorer') {
          if (primaryPanelContent === 'explorer') setPrimaryPanelContent('empty');
          if (secondaryPanelContent === 'explorer') setSecondaryPanelContent('empty');
          setIsPrimaryFlyoutOpen(false);
        } else if (panelId === 'grabbed_content') {
          if (primaryPanelContent === 'grabbed_content') setPrimaryPanelContent('empty');
          if (secondaryPanelContent === 'grabbed_content') setSecondaryPanelContent('empty');
          if (bottomPanelContent === 'grabbed_content') setBottomPanelContent('empty');
        }
        return;
      }

      // 2. Dock to Left (Primary Side Bar)
      if (targetZone === 'left') {
        const incomingContent: 'empty' | 'explorer' | 'grabbed_content' =
          panelId === 'explorer'
            ? 'explorer'
            : panelId === 'grabbed_content'
            ? 'grabbed_content'
            : panelId === 'secondary'
            ? secondaryPanelContent
            : panelId === 'bottom'
            ? bottomPanelContent
            : primaryPanelContent;

        if (incomingContent === 'empty') {
          setIsPrimarySidePanelOpen(true);
          return;
        }

        if (panelId === 'bottom') {
          if (primaryPanelContent === 'empty') {
            setPrimaryPanelContent(incomingContent);
            setBottomPanelContent('empty');
            setIsPrimarySidePanelOpen(true);
          } else if (secondaryPanelContent === 'empty') {
            displacePanelContent('left', incomingContent);
            setBottomPanelContent('empty');
          }
          return;
        }

        // Direct drag from secondary sidebar header (move / swap)
        if (panelId === 'secondary') {
          const currentSecondary = secondaryPanelContent;
          const currentPrimary = primaryPanelContent;
          setPrimaryPanelContent(currentSecondary);
          setSecondaryPanelContent(currentPrimary);
          setIsPrimarySidePanelOpen(true);
          return;
        }

        if (panelId === 'primary') {
          setIsPrimarySidePanelOpen(true);
          return;
        }

        // Incoming is a new dockable item from header / flyout
        if (
          primaryPanelContent !== 'empty' &&
          primaryPanelContent !== incomingContent &&
          secondaryPanelContent === 'empty'
        ) {
          // User-friendly displacement: move existing primary content to empty secondary sidebar
          displacePanelContent('left', incomingContent);
        } else {
          // Standard dock into primary
          setPrimaryPanelContent(incomingContent);
          if (secondaryPanelContent === incomingContent) {
            setSecondaryPanelContent('empty');
          }
          if (bottomPanelContent === incomingContent) {
            setBottomPanelContent('empty');
          }
          setIsPrimarySidePanelOpen(true);
          setIsPrimaryFlyoutOpen(false);
        }
        return;
      }

      // 3. Dock to Right (Secondary Side Bar)
      if (targetZone === 'right') {
        const incomingContent: 'empty' | 'explorer' | 'grabbed_content' =
          panelId === 'explorer'
            ? 'explorer'
            : panelId === 'grabbed_content'
            ? 'grabbed_content'
            : panelId === 'primary'
            ? primaryPanelContent
            : panelId === 'bottom'
            ? bottomPanelContent
            : secondaryPanelContent;

        if (incomingContent === 'empty') {
          setIsSecondaryOpen(true);
          return;
        }

        if (panelId === 'bottom') {
          if (secondaryPanelContent === 'empty') {
            setSecondaryPanelContent(incomingContent);
            setBottomPanelContent('empty');
            setIsSecondaryOpen(true);
          } else if (primaryPanelContent === 'empty') {
            displacePanelContent('right', incomingContent);
            setBottomPanelContent('empty');
          }
          return;
        }

        // Direct drag from primary sidebar header (move / swap)
        if (panelId === 'primary') {
          const currentPrimary = primaryPanelContent;
          const currentSecondary = secondaryPanelContent;
          setSecondaryPanelContent(currentPrimary);
          setPrimaryPanelContent(currentSecondary);
          setIsSecondaryOpen(true);
          return;
        }

        if (panelId === 'secondary') {
          setIsSecondaryOpen(true);
          return;
        }

        // Incoming is a new dockable item from header / flyout
        if (
          secondaryPanelContent !== 'empty' &&
          secondaryPanelContent !== incomingContent &&
          primaryPanelContent === 'empty'
        ) {
          // User-friendly displacement: move existing secondary content to empty primary sidebar
          displacePanelContent('right', incomingContent);
        } else {
          // Standard dock into secondary
          setSecondaryPanelContent(incomingContent);
          if (primaryPanelContent === incomingContent) {
            setPrimaryPanelContent('empty');
          }
          if (bottomPanelContent === incomingContent) {
            setBottomPanelContent('empty');
          }
          setIsSecondaryOpen(true);
          setIsPrimaryFlyoutOpen(false);
        }
        return;
      }

      // 4. Dock to Bottom Panel
      if (targetZone === 'bottom') {
        const incomingContent: 'empty' | 'explorer' | 'grabbed_content' =
          panelId === 'grabbed_content'
            ? 'grabbed_content'
            : panelId === 'primary'
            ? primaryPanelContent
            : panelId === 'secondary'
            ? secondaryPanelContent
            : bottomPanelContent;

        if (incomingContent === 'grabbed_content') {
          setBottomPanelContent('grabbed_content');
          if (primaryPanelContent === 'grabbed_content') setPrimaryPanelContent('empty');
          if (secondaryPanelContent === 'grabbed_content') setSecondaryPanelContent('empty');
          setIsBottomPanelOpen(true);
        } else if (panelId === 'bottom') {
          setIsBottomPanelOpen(true);
        }
      }
    },
    [primaryPanelContent, secondaryPanelContent, bottomPanelContent, slidingState, displacePanelContent]
  );

  const {
    isDragging: isDraggingPanel,
    draggingPanel,
    hoveredZone,
    cursorPos,
    handlePointerDown: startDockDrag,
    cancelDrag,
  } = usePanelDockDrag({ onDropPanel: handleDropPanel, contents: dockContents });

  /* ------------------------------------------------------------------------
     8. GLOBAL KEYBOARD SHORTCUTS
     ------------------------------------------------------------------------ */
  useKeyboardShortcuts([
    {
      key: 'Escape',
      allowInInputs: true,
      action: () => {
        if (isDraggingPanel) {
          cancelDrag();
          return;
        }

        if (activeModal) {
          closeModal();
          return;
        }

        if (searchQuery.trim().length > 0) {
          setSearchQuery('');
          return;
        }

        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          (document.activeElement as HTMLElement).blur();
          return;
        }

        if (isPrimaryFlyoutOpen) {
          setIsPrimaryFlyoutOpen(false);
          return;
        }

        if (isPrimarySidePanelOpen && !isPinned) {
          setIsPrimarySidePanelOpen(false);
          return;
        }

        if (isSecondaryOpen && !isSecondaryPinned) {
          setIsSecondaryOpen(false);
          return;
        }

        if (isPinned) {
          setIsPinned(false);
          setIsPrimarySidePanelOpen(false);
          return;
        }

        if (isSecondaryPinned) {
          setIsSecondaryPinned(false);
          setIsSecondaryOpen(false);
          return;
        }
      },
    },
    {
      key: 'k',
      ctrl: true,
      allowInInputs: true,
      action: (e) => {
        e.preventDefault();

        // Reveal the panel hosting Explorer if closed
        if (primaryPanelContent === 'explorer') {
          if (!isPrimaryActive) {
            setIsPrimarySidePanelOpen(true);
          }
        } else if (secondaryPanelContent === 'explorer') {
          if (!isSecondaryActive) {
            setIsSecondaryOpen(true);
          }
        } else {
          setIsPrimaryFlyoutOpen(true);
        }

        // Focus the visible search input with retry logic
        const attemptFocus = (retries = 4) => {
          const visibleInput = document.querySelector(
            '.explorer-search-query-input:not([disabled])'
          ) as HTMLInputElement | null;
          if (visibleInput) {
            visibleInput.focus();
            visibleInput.select();
          } else if (retries > 0) {
            setTimeout(() => attemptFocus(retries - 1), 50);
          }
        };

        setTimeout(() => attemptFocus(4), 50);
      },
    },
  ]);

  /* ------------------------------------------------------------------------
     9. EVENT HANDLERS & DELEGATION
     ------------------------------------------------------------------------ */
  const handleTreeSelectItem = (item: ItemRecord, collectionId: number | null) => {
    // Clear the search in the same update so its sole match cannot override this click.
    const pattern = searchQuery.trim();
    if (pattern && !itemMatchesQuery(item, pattern)) {
      setSearchQuery('');
    }
    selectItemWithChildren(item, collectionId);
    if (!isPinned) {
      setIsPrimaryFlyoutOpen(false);
      setIsPrimarySidePanelOpen(false);
    }
  };

  const handleTriggerEditItem = (item: ItemRecord, collectionId: number | null) => {
    setActiveCollectionId(collectionId);
    openEditItem(item, collectionId);
  };

  const handleTriggerDeleteItem = (item: ItemRecord, collectionId: number | null) => {
    setActiveCollectionId(collectionId);
    openDeleteItem(item, collectionId);
  };

  /* ------------------------------------------------------------------------
     10. MEMOIZED EXPLORER SUB-COMPONENTS & PANEL CONTENT RENDERERS
     ------------------------------------------------------------------------ */
  const renderExplorerTree = (pos: 'left' | 'right') => (
    <ExplorerContent
      unifiedForest={filteredForest}
      searchQuery={searchQuery}
      activeCollectionId={activeCollectionId}
      selectedItemId={selectedItem?.id || null}
      expandedCategoryIds={expandedCategoryIds}
      onToggleCategory={handleToggleCategory}
      onSelectCollection={(colId) => {
        setActiveCollectionId(colId);
        if (!isPinned) {
          setIsPrimaryFlyoutOpen(false);
          setIsPrimarySidePanelOpen(false);
        }
      }}
      onSelectItem={handleTreeSelectItem}
      onSelectSearchResult={selectItemWithChildren}
      onAddSubItem={openCreateItem}
      onEditTemplate={(categoryId: number) => {
        const templateId = Math.abs(categoryId);
        console.log('Open Template Editor for Template ID:', templateId);
      }}
      onEditCollection={(col) => openTemplateManager(col.id, col.name)}
      onDeleteCollection={openDeleteCollection}
      onEditItem={handleTriggerEditItem}
      onDeleteItem={handleTriggerDeleteItem}
      onRenameCollection={renameCollection}
      onRenameItem={renameItem}
      position={pos}
    />
  );

  const renderPanelBody = (content: 'empty' | 'explorer' | 'grabbed_content', pos: 'left' | 'right') => {
    if (content === 'explorer') {
      return renderExplorerTree(pos);
    }
    if (content === 'grabbed_content') {
      return (
        <div className="p-4 flex flex-col items-center justify-center text-center gap-3 h-full min-h-[220px] select-none">
          <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_oklch,var(--brand-primary)_15%,transparent)] border border-[color-mix(in_oklch,var(--brand-primary)_35%,transparent)] flex items-center justify-center text-2xl shadow-sm">
            📦
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm font-bold text-[var(--content-primary,rgba(226,232,240,1))] uppercase tracking-wider">
              Grabbed Content
            </div>
            <p className="text-xs text-[var(--text-muted,rgba(148,163,184,1))] max-w-[200px] leading-relaxed">
              This is docked content.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getPanelTitle = (content: 'empty' | 'explorer' | 'grabbed_content', defaultTitle: string) => {
    if (content === 'explorer') return 'EXPLORER';
    if (content === 'grabbed_content') return 'GRABBED CONTENT';
    return defaultTitle;
  };

  const explorerFlyoutPanel = (
    <PrimarySidePanel
      title="EXPLORER"
      variant="flyout"
      position="left"
      isOpen={isPrimaryFlyoutOpen}
      onClose={() => setIsPrimaryFlyoutOpen(false)}
      onDock={(position) => handleDropPanel('explorer', position)}
      activeTab={activeExplorerTab}
      onTabChange={setActiveExplorerTab}
      isAnyCategoryExpanded={isAnyCategoryExpanded}
      onToggleAllCategories={handleToggleAllCategories}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      collections={allCollections}
      filterCollectionIds={filterCollectionIds}
      onToggleFilterCollection={handleToggleFilterCollection}
      onClearCollectionFilters={handleClearCollectionFilters}
      onHandlePointerDown={(e) => startDockDrag('explorer', e)}
    >
      {renderExplorerTree('left')}
    </PrimarySidePanel>
  );

  const primaryMoveTooltip =
    primaryPanelContent === 'empty'
      ? 'Content must be docked first'
      : isBottomActive && bottomPanelContent === 'empty' && primaryPanelContent === 'grabbed_content'
      ? 'Move Grabbed Content to Bottom Panel'
      : `Move ${getPanelTitle(primaryPanelContent, 'Content')} to Secondary Side Bar`;

  const secondaryMoveTooltip =
    secondaryPanelContent === 'empty'
      ? 'Content must be docked first'
      : isBottomActive && bottomPanelContent === 'empty' && secondaryPanelContent === 'grabbed_content'
      ? 'Move Grabbed Content to Bottom Panel'
      : `Move ${getPanelTitle(secondaryPanelContent, 'Content')} to Primary Side Bar`;

  const canMovePrimary = primaryPanelContent !== 'empty' && !slidingState;
  const canMoveSecondary = secondaryPanelContent !== 'empty' && !slidingState;

  const explorerSidebarPanel = (
    <PrimarySidePanel
      title={getPanelTitle(primaryPanelContent, 'PRIMARY SIDE PANEL')}
      hasDockedContent={primaryPanelContent !== 'empty'}
      isContentSliding={slidingState !== null && !(slidingState.incomingContent && slidingState.from === 'left' && slidingState.isMoving)}
      showSearchFilter={primaryPanelContent === 'explorer'}
      variant="sidebar"
      position="left"
      onTogglePosition={primaryPanelContent !== 'empty' ? handleMovePrimaryContent : undefined}
      moveTooltip={primaryMoveTooltip}
      canMove={canMovePrimary}
      isOpen={isPrimaryActive}
      onOpen={() => setIsPrimarySidePanelOpen(true)}
      onClose={() => {
        setIsPrimarySidePanelOpen(false);
        setIsPinned(false);
      }}
      onTogglePin={() => {
        if (!isPinned) {
          setIsPinned(true);
          setIsPrimarySidePanelOpen(true);
        } else {
          setIsPinned(false);
          setIsPrimarySidePanelOpen(true);
        }
      }}
      activeTab={activeExplorerTab}
      onTabChange={setActiveExplorerTab}
      isAnyCategoryExpanded={isAnyCategoryExpanded}
      onToggleAllCategories={handleToggleAllCategories}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      reservedWidth={isSecondaryActive ? secondaryPanelWidth : 0}
      onWidthChange={setPrimaryPanelWidth}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      collections={allCollections}
      filterCollectionIds={filterCollectionIds}
      onToggleFilterCollection={handleToggleFilterCollection}
      onClearCollectionFilters={handleClearCollectionFilters}
      onHandlePointerDown={(e) => startDockDrag('primary', e)}
    >
      {renderPanelBody(primaryPanelContent, 'left')}
    </PrimarySidePanel>
  );

  /* ------------------------------------------------------------------------
     12. VIEWPORT COMPOSITION & PRESENTATION SHELL
     ------------------------------------------------------------------------ */
  return (
    <div
      className={[
        'relative flex flex-col h-full w-full overflow-hidden',
        'bg-canvas text-content-primary studio-grid-canvas',
      ].join(' ')}
    >
      {/* Dynamic Watermark Background & Video Trigger */}
      <DynamicWatermark
        isHovered={isLogoHovered}
        onHoverChange={setIsLogoHovered}
        isAudioEnabled={isAudioEnabled}
      />

      {/* Primary Application Shell */}
      <div className="flex flex-col h-full w-full">
        {/* Tier 1: Top Navigation Header */}
        <div className="shrink-0 relative z-[80]">
          <NavigationHeader
            activeCollectionName={activeCollection ? activeCollection.name : 'Select Collection'}
            collections={allCollections}
            activeCollectionId={activeCollectionId}
            onSelectCollection={(newId) => {
              setActiveCollectionId(newId);
              if (!isPinned) {
                setIsPrimaryFlyoutOpen(false);
                setIsPrimarySidePanelOpen(false);
              }
            }}
            onCollectionsUpdated={() => fetchAllData()}
            isDropdownOpen={isColDropdownOpen}
            setIsDropdownOpen={setIsColDropdownOpen}
            onRequestDeleteCollection={openDeleteCollection}
            onOpenTemplateManager={() => {
              if (activeCollection) {
                openTemplateManager(activeCollection.id, activeCollection.name);
              }
            }}
            isPrimarySidePanelOpen={isPrimaryFlyoutOpen}
            onTogglePrimarySidePanel={() => setIsPrimaryFlyoutOpen(!isPrimaryFlyoutOpen)}
            unpinnedPrimaryPanel={explorerFlyoutPanel}
            explorerDockedSide={primaryPanelContent === 'explorer' ? 'left' : secondaryPanelContent === 'explorer' ? 'right' : null}
            onStartGrabbedContentDrag={(e) => startDockDrag('grabbed_content', e)}
            onStartExplorerDrag={(e) => startDockDrag('explorer', e)}
            onAddNewItem={() => {
              openCreateItem(activeCollectionId, null);
            }}
          />
        </div>

        {/* Tier 2: Center Workspace (Sidebars, Canvas, and Bottom Panel) */}
        <div
          className={[
            'flex flex-1 min-h-0 relative overflow-hidden',
            'transition-opacity duration-500 ease-in-out',
            isLogoHovered && animationsEnabled ? 'opacity-0 pointer-events-none' : 'opacity-100',
          ].join(' ')}
        >
          {/* Visual Dock Drop Targets (OKLCH Dynamic Palette) */}
          <div className="navigation-workspace-shadow" aria-hidden="true" />
          <PanelDockDropZones
            isDragging={isDraggingPanel}
            draggingPanel={draggingPanel}
            hoveredZone={hoveredZone}
            cursorPos={cursorPos}
            primaryPanelContent={primaryPanelContent}
            secondaryPanelContent={secondaryPanelContent}
            bottomPanelContent={bottomPanelContent}
          />

          {/* Primary Side Panel (Explorer Tree / Grabbed Content) - Sits Above Main Content (z-50) */}
          {explorerSidebarPanel}

          {/* Center Main Stage / Detail Canvas (Full-Width Base Layer z-10) */}
          <div
            style={{
              marginLeft: `${leftOccupiedWidth}px`,
              marginRight: `${rightOccupiedWidth}px`,
              height: isBottomPinned && isBottomActive ? `calc(100% - ${bottomPanelHeight}px)` : '100%',
            }}
            className={[
              'w-full h-full flex-1 min-w-0 relative z-10',
              animationsEnabled && isHydrated ? 'transition-[margin,height] duration-500 ease-in-out' : 'transition-none',
            ].join(' ')}
          >
            <MainContent
              selectedItem={selectedItem}
              activeCollectionId={activeCollectionId}
              isBlurred={isPrimaryFlyoutOpen}
              onAddSubItem={openCreateItem}
              onEditItem={handleTriggerEditItem}
              onDeleteItem={handleTriggerDeleteItem}
            />
          </div>

          {/* Dockable Bottom Panel */}
          <BottomPanel
            isOpen={isBottomActive}
            isPinned={isBottomPinned}
            onClose={() => {
              setIsBottomPanelOpen(false);
              setIsBottomPinned(false);
            }}
            onTogglePin={() => {
              setIsBottomPinned(!isBottomPinned);
              setIsBottomPanelOpen(true);
            }}
            reservedLeft={leftOccupiedWidth}
            reservedRight={rightOccupiedWidth}
            canMoveLeft={canMoveBottomLeft}
            canMoveRight={canMoveBottomRight}
            onMoveLeft={() => handleDropPanel('bottom', 'left')}
            onMoveRight={() => handleDropPanel('bottom', 'right')}
            onHandlePointerDown={(e) => startDockDrag('bottom', e)}
            onHeightChange={setBottomPanelHeight}
          >
            {bottomPanelContent === 'grabbed_content' ? renderPanelBody('grabbed_content', 'left') : null}
          </BottomPanel>

          {/* Secondary Side Panel (Details / Inspector Drawer / Grabbed Content) - Sits Above Main Content (z-40) */}
          <SecondarySidePanel
            title={getPanelTitle(secondaryPanelContent, 'SECONDARY SIDE PANEL')}
            hasDockedContent={secondaryPanelContent !== 'empty'}
            isContentSliding={slidingState !== null && !(slidingState.incomingContent && slidingState.from === 'right' && slidingState.isMoving)}
            showSearchFilter={secondaryPanelContent === 'explorer'}
            isOpen={isSecondaryActive}
            isPinned={isSecondaryPinned}
            position="right"
            onTogglePosition={secondaryPanelContent !== 'empty' ? handleMoveSecondaryContent : undefined}
            moveTooltip={secondaryMoveTooltip}
            canMove={canMoveSecondary}
            onOpen={() => setIsSecondaryOpen(true)}
            onClose={() => {
              setIsSecondaryOpen(false);
              setIsSecondaryPinned(false);
            }}
            onTogglePin={() => {
              if (!isSecondaryPinned) {
                setIsSecondaryPinned(true);
                setIsSecondaryOpen(true);
              } else {
                setIsSecondaryPinned(false);
                setIsSecondaryOpen(true);
              }
            }}
            activeTab={activeExplorerTab}
            onTabChange={setActiveExplorerTab}
            isAnyCategoryExpanded={isAnyCategoryExpanded}
            onToggleAllCategories={handleToggleAllCategories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            reservedWidth={isPrimaryActive ? primaryPanelWidth : 0}
            onWidthChange={setSecondaryPanelWidth}
            onAddNewItem={() => openCreateItem(null, null)}
            onAddNewCollection={() => openCreateCollection(null)}
            collections={allCollections}
            filterCollectionIds={filterCollectionIds}
            onToggleFilterCollection={handleToggleFilterCollection}
            onClearCollectionFilters={handleClearCollectionFilters}
            onHandlePointerDown={(e) => startDockDrag('secondary', e)}
          >
            {renderPanelBody(secondaryPanelContent, 'right')}
          </SecondarySidePanel>

          {/* Smooth Sliding Content Transition Layer */}
          {slidingState && (
            <aside
              style={{
                width: `${slidingState.width}px`,
                left: slidingState.isMoving
                  ? slidingState.to === 'right'
                    ? `calc(100% - ${slidingState.width}px)`
                    : '0px'
                  : slidingState.from === 'left'
                  ? '0px'
                  : `calc(100% - ${slidingState.width}px)`,
                zIndex: 55,
              }}
              className={[
                'primary-side-panel absolute top-0 bottom-0 flex flex-col pointer-events-none shadow-2xl',
                slidingState.to === 'right' ? 'primary-side-panel-docked-right' : 'primary-side-panel-docked-left',
                animationsEnabled
                  ? 'transition-[left,transform] duration-500 ease-in-out'
                  : 'transition-none',
              ].join(' ')}
            >
              <PrimarySidePanelHeader
                title={getPanelTitle(slidingState.content, 'SIDE PANEL')}
                hasDockedContent={slidingState.content !== 'empty'}
                showSearchFilter={slidingState.content === 'explorer'}
                variant="sidebar"
                isPinned={slidingState.to === 'left' ? isPinned : isSecondaryPinned}
                position={slidingState.to}
                activeTab={activeExplorerTab}
                searchQuery={searchQuery}
                onTogglePin={() => {}}
                onClose={() => {}}
              />
              <div className={`flex-1 min-h-0 overflow-hidden ${slidingState.content ? 'px-2.5 pt-0 pb-3' : 'p-0'} min-w-0 primary-panel-scroll flex flex-col`}>
                {renderPanelBody(slidingState.content, slidingState.to)}
              </div>
              <div
                className={`panel-bottom-topper ${
                  slidingState.content !== 'empty' ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
                } shrink-0 select-none pointer-events-none`}
                aria-hidden="true"
              />
            </aside>
          )}

          {slidingState?.secondaryContent && (
            <aside
              style={{
                width: `${slidingState.secondaryWidth}px`,
                left: slidingState.isMoving
                  ? slidingState.to === 'right'
                    ? '0px'
                    : `calc(100% - ${slidingState.secondaryWidth}px)`
                  : slidingState.from === 'left'
                  ? `calc(100% - ${slidingState.secondaryWidth}px)`
                  : '0px',
                zIndex: 54,
              }}
              className={[
                'secondary-side-panel absolute top-0 bottom-0 flex flex-col pointer-events-none shadow-2xl',
                slidingState.to === 'right' ? 'secondary-side-panel-left' : 'secondary-side-panel-right',
                animationsEnabled
                  ? 'transition-[left,transform] duration-500 ease-in-out'
                  : 'transition-none',
              ].join(' ')}
            >
              <PrimarySidePanelHeader
                title={getPanelTitle(slidingState.secondaryContent, 'SIDE PANEL')}
                hasDockedContent={slidingState.secondaryContent !== 'empty'}
                showSearchFilter={slidingState.secondaryContent === 'explorer'}
                variant="sidebar"
                isPinned={slidingState.to === 'right' ? isPinned : isSecondaryPinned}
                position={slidingState.to === 'right' ? 'left' : 'right'}
                activeTab={activeExplorerTab}
                searchQuery={searchQuery}
                onTogglePin={() => {}}
                onClose={() => {}}
              />
              <div className={`flex-1 min-h-0 overflow-hidden ${slidingState.secondaryContent ? 'px-2.5 pt-0 pb-3' : 'p-0'} min-w-0 primary-panel-scroll flex flex-col`}>
                {renderPanelBody(slidingState.secondaryContent, slidingState.to === 'right' ? 'left' : 'right')}
              </div>
              <div
                className={`panel-bottom-topper ${
                  slidingState.secondaryContent !== 'empty' ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
                } shrink-0 select-none pointer-events-none`}
                aria-hidden="true"
              />
            </aside>
          )}
        </div>

        {/* Tier 3: Bottom Navigation Footer & Status */}
        <div className="shrink-0 relative z-[60]">
          <NavigationFooter
            activeCollectionName={activeCollection?.name}
            totalItemsCount={allItems.length}
            isPrimaryOpen={isPrimaryActive}
            onTogglePrimary={() => {
              if (isPrimaryActive) {
                setIsPrimarySidePanelOpen(false);
                setIsPinned(false);
              } else {
                setIsPrimarySidePanelOpen(true);
              }
            }}
            isBottomOpen={isBottomActive}
            onToggleBottom={() => {
              if (isBottomActive) {
                setIsBottomPanelOpen(false);
                setIsBottomPinned(false);
              } else {
                setIsBottomPanelOpen(true);
              }
            }}
            isSecondaryOpen={isSecondaryActive}
            onToggleSecondary={() => {
              if (isSecondaryActive) {
                setIsSecondaryOpen(false);
                setIsSecondaryPinned(false);
              } else {
                setIsSecondaryOpen(true);
              }
            }}
          />
        </div>
      </div>

      {/* Modals & Dialog Portals */}
      <ModalContainers
        activeModal={activeModal}
        closeModal={closeModal}
        allItems={allItems}
        collections={allCollections}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        fetchAllData={fetchAllData}
      />
    </div>
  );
}
