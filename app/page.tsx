'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { ItemRecord } from '@/types/item';
import { useCollections } from '@/hooks/useCollections';
import { useModals } from '@/hooks/useModals';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useExplorerCategories } from '@/hooks/useExplorerCategories';
import { usePanelDockDrag, DockablePanelId, DockDropTargetZone, isDockZoneAllowed, DockContent, DockContents } from '@/hooks/usePanelDockDrag';
import NavigationHeader from '@/components/NavigationHeader';
import NavigationFooter from '@/components/NavigationFooter';
import MainContent from '@/components/MainContent';
import PrimarySidePanel from '@/components/PrimarySidePanel';
import PrimarySidePanelHeader from '@/components/PrimarySidePanelHeader';
import SecondarySidePanel from '@/components/SecondarySidePanel';
import BottomPanel from '@/components/BottomPanel';
import PanelDockDropZones from '@/components/PanelDockDropZones';
import { ExplorerPanelContext } from '@/context/ExplorerPanelContext';
import ExplorerContent from '@/components/ExplorerContent';
import ModalContainers from '@/components/ModalContainers';
import DynamicWatermark from '@/components/DynamicWatermark';
import TemplateFieldInspector from '@/components/TemplateFieldInspector';
import TemplateLayoutBuilder from '@/components/TemplateLayoutBuilder';
import TemplateLayoutPalette from '@/components/TemplateLayoutPalette';
import TemplatePropertiesInspector from '@/components/TemplatePropertiesInspector';
import TemplateHierarchyTree, { getAllContainerIds, countElements } from '@/components/TemplateHierarchyTree';
import { useTemplateEditor } from '@/hooks/useTemplateEditor';
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
    renameTemplate,
    deleteTemplate,
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
  const activeExplorerTab: ExplorerTab = 'items';
  const [activeSearchPanel, setActiveSearchPanel] = useState<'explorer' | 'collections' | 'templates'>('explorer');
  const [collectionsFilterIds, setCollectionsFilterIds] = useState<number[]>([]);
  const [templatesFilterIds, setTemplatesFilterIds] = useState<number[]>([]);
  const [filterCollectionIds, setFilterCollectionIds] = useState<number[]>([]);

  const handleToggleFilterCollection = (id: number) => {
    setFilterCollectionIds((prev) => 
      prev.includes(id) ? prev.filter((colId) => colId !== id) : [...prev, id]
    );
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

  const collectionsForest = useMemo(() => filterExplorerForest(
    unifiedForest, collectionsFilterIds, 'collections', allItems, allCollections, templates
  ), [unifiedForest, collectionsFilterIds, allItems, allCollections, templates]);
  const collectionsTree = useExplorerCategories(collectionsForest);
  const handleToggleCollectionsFilter = (id: number) => {
    setCollectionsFilterIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]);
  };

  const templatesForest = useMemo(() => filterExplorerForest(
    unifiedForest, templatesFilterIds, 'templates', allItems, allCollections, templates
  ), [unifiedForest, templatesFilterIds, allItems, allCollections, templates]);
  const templatesTree = useExplorerCategories(templatesForest, false);
  const handleToggleTemplatesFilter = (id: number) => {
    setTemplatesFilterIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]);
  };

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
     5.1 TEMPLATE BLUEPRINT EDITOR & TAB PRESERVATION
     ------------------------------------------------------------------------ */
  const templateEditor = useTemplateEditor({
    onRefreshData: fetchAllData,
    getTabSnapshot: () => ({
      primaryTabs,
      primaryActiveTab,
      secondaryTabs,
      secondaryActiveTab,
      isPrimarySidePanelOpen,
      isSecondaryOpen,
      isPinned,
      isSecondaryPinned,
      bottomPanelContent,
      isBottomPanelOpen,
      isBottomPinned,
    }),
    onRestoreTabs: (snapshot) => {
      setPrimaryTabs(snapshot.primaryTabs);
      setPrimaryActiveTab(snapshot.primaryActiveTab);
      setSecondaryTabs(snapshot.secondaryTabs);
      setSecondaryActiveTab(snapshot.secondaryActiveTab);
      setIsPrimarySidePanelOpen(snapshot.isPrimarySidePanelOpen);
      setIsSecondaryOpen(snapshot.isSecondaryOpen);
      setIsPinned(snapshot.isPinned);
      setIsSecondaryPinned(snapshot.isSecondaryPinned);
      setBottomPanelContent(snapshot.bottomPanelContent);
      setIsBottomPanelOpen(snapshot.isBottomPanelOpen);
      setIsBottomPinned(snapshot.isBottomPinned);
    },
    onOpenPrimaryPanel: (tabs, activeTab) => {
      setPrimaryTabs(tabs);
      setPrimaryActiveTab(activeTab);
      setIsPrimarySidePanelOpen(true);
    },
    onOpenSecondaryPanel: (tabs, activeTab) => {
      setSecondaryTabs(tabs);
      setSecondaryActiveTab(activeTab);
      setIsSecondaryOpen(true);
    },
    onOpenBottomPanel: (content) => {
      setBottomPanelContent(content);
      setIsBottomPanelOpen(true);
    },
  });

  /* ------------------------------------------------------------------------
     5.1 TEMPLATE STRUCTURE HIERARCHY STATE & SELECTION SYNC
     ------------------------------------------------------------------------ */
  const [hierarchyExpandedIds, setHierarchyExpandedIds] = useState<Set<string>>(
    () => new Set(['root-container'])
  );

  const allHierarchyContainerIds = useMemo(() => {
    const root = templateEditor.flexLayoutConfig?.root;
    if (!root) return [];
    return getAllContainerIds(root);
  }, [templateEditor.flexLayoutConfig]);

  const hierarchyNodeCount = useMemo(() => {
    const root = templateEditor.flexLayoutConfig?.root;
    if (!root) return 0;
    const stats = countElements(root);
    return stats.containers + stats.components;
  }, [templateEditor.flexLayoutConfig]);

  const isAllHierarchyExpanded = useMemo(() => {
    if (allHierarchyContainerIds.length <= 1) return true;
    return allHierarchyContainerIds.every((id) => hierarchyExpandedIds.has(id));
  }, [allHierarchyContainerIds, hierarchyExpandedIds]);

  const toggleAllHierarchy = useCallback(() => {
    if (isAllHierarchyExpanded) {
      setHierarchyExpandedIds(new Set(['root-container']));
    } else {
      setHierarchyExpandedIds(new Set(allHierarchyContainerIds));
    }
  }, [isAllHierarchyExpanded, allHierarchyContainerIds]);

  const toggleHierarchyExpand = useCallback((id: string) => {
    setHierarchyExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleOpenProperties = useCallback((nodeId?: string | null) => {
    if (nodeId) {
      templateEditor.selectNode(nodeId);
    }
  }, [templateEditor]);

  /* ------------------------------------------------------------------------
     6. PANEL CONTENT MOVING & SWAPPING (Smooth Fluid Slide Transition)
     ------------------------------------------------------------------------ */
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
          panelId === 'explorer' ||
          panelId === 'collections' ||
          panelId === 'templates' ||
          panelId === 'grabbed_content' ||
          panelId === 'template_editor' ||
          panelId === 'template_builder'
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
          panelId === 'explorer' ||
          panelId === 'collections' ||
          panelId === 'templates' ||
          panelId === 'grabbed_content' ||
          panelId === 'template_editor' ||
          panelId === 'template_builder'
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

  /* ------------------------------------------------------------------------
     8. GLOBAL KEYBOARD SHORTCUTS
     ------------------------------------------------------------------------ */
  const searchFocusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (searchFocusTimer.current) clearTimeout(searchFocusTimer.current);
  }, []);

  const focusTreeSearch = (content: 'explorer' | 'collections' | 'templates') => {
    if (activeModal) return;
    if (searchFocusTimer.current) clearTimeout(searchFocusTimer.current);
    setActiveSearchPanel(content);
    setIsPrimaryFlyoutOpen(false);
    setIsCollectionsFlyoutOpen(false);
    setIsTemplatesFlyoutOpen(false);
    if (primaryTabs.includes(content)) {
      setPrimaryActiveTab(content);
      setIsPrimarySidePanelOpen(true);
    } else if (secondaryTabs.includes(content)) {
      setSecondaryActiveTab(content);
      setIsSecondaryOpen(true);
    } else if (content === 'explorer') {
      setIsPrimaryFlyoutOpen(true);
    } else if (content === 'collections') {
      setIsCollectionsFlyoutOpen(true);
    } else {
      setIsTemplatesFlyoutOpen(true);
    }

    const attemptFocus = (remaining: number) => {
      const searchTarget = content === 'explorer' ? 'items' : content === 'templates' ? 'templates' : 'collections';
      const inputs = document.querySelectorAll<HTMLInputElement>(
        `[data-tree-search="${searchTarget}"]`
      );
      const input = Array.from(inputs).find(element => !element.closest('[inert]') && element.getClientRects().length > 0);
      if (input) {
        input.focus();
        input.select();
      } else if (remaining > 0) {
        searchFocusTimer.current = setTimeout(() => attemptFocus(remaining - 1), 50);
      }
    };
    searchFocusTimer.current = setTimeout(() => attemptFocus(10), 50);
  };

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

        if (isCollectionsFlyoutOpen) {
          setIsCollectionsFlyoutOpen(false);
          return;
        }

        if (isTemplatesFlyoutOpen) {
          setIsTemplatesFlyoutOpen(false);
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
      action: () => focusTreeSearch('explorer'),
    },
    {
      key: 'l',
      ctrl: true,
      allowInInputs: true,
      action: () => focusTreeSearch('collections'),
    },
    {
      key: ';',
      ctrl: true,
      allowInInputs: true,
      action: () => focusTreeSearch('templates'),
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
    setIsPrimaryFlyoutOpen(false);
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
  const closeTreeFlyout = (content: 'explorer' | 'collections' | 'templates') => {
    if (content === 'collections') setIsCollectionsFlyoutOpen(false);
    else if (content === 'templates') setIsTemplatesFlyoutOpen(false);
    else setIsPrimaryFlyoutOpen(false);
  };

  const renderExplorerTree = (pos: 'left' | 'right', content: 'explorer' | 'collections' | 'templates' = 'explorer', isFlyout = false) => {
    const tree = content === 'collections' ? collectionsTree : content === 'templates' ? templatesTree : { searchQuery, expandedCategoryIds, handleToggleCategory };
    const forest = content === 'collections' ? collectionsForest : content === 'templates' ? templatesForest : filteredForest;
    return (
    <ExplorerPanelContext.Provider value={{ isFlyout, isPinned: !isFlyout && (pos === 'left' ? isPinned : isSecondaryPinned) }}>
    <ExplorerContent
      treeView={content === 'collections' ? 'collections' : content === 'templates' ? 'templates' : 'items'}
      unifiedForest={forest}
      searchQuery={tree.searchQuery}
      activeCollectionId={activeCollectionId}
      selectedItemId={selectedItem?.id || null}
      expandedCategoryIds={tree.expandedCategoryIds}
      onToggleCategory={tree.handleToggleCategory}
      onSelectCollection={(colId) => {
        setActiveSearchPanel(content);
        if (content !== 'templates') {
          setActiveCollectionId(colId);
        }
        closeTreeFlyout(content);
      }}
      onSelectItem={(item, collectionId) => {
        setActiveSearchPanel(content);
        if (content === 'collections' || content === 'templates') {
          selectItemWithChildren(item, collectionId);
          closeTreeFlyout(content);
        } else handleTreeSelectItem(item, collectionId);
      }}
      onSelectSearchResult={activeSearchPanel === content ? selectItemWithChildren : undefined}
      onAddSubItem={openCreateItem}
      onAddSubCollection={openCreateCollection}
      onEditTemplate={(templateId: number) => {
        setIsTemplatesFlyoutOpen(false);
        setIsCollectionsFlyoutOpen(false);
        setIsPrimaryFlyoutOpen(false);
        templateEditor.startEditing(templateId);
      }}
      onEditCollection={(col) => openTemplateManager(col.id, col.name)}
      onDeleteCollection={openDeleteCollection}
      onDeleteTemplate={deleteTemplate}
      onEditItem={handleTriggerEditItem}
      onDeleteItem={handleTriggerDeleteItem}
      onRenameCollection={renameCollection}
      onRenameTemplate={renameTemplate}
      onRenameItem={renameItem}
      position={pos}
    />
    </ExplorerPanelContext.Provider>
  );
  };

  const renderPanelBody = (content: DockContent, pos: 'left' | 'right' | 'bottom') => {
    if (content === 'explorer' || content === 'collections' || content === 'templates') {
      return renderExplorerTree(pos === 'bottom' ? 'left' : pos, content);
    }
    if (content === 'template_editor') {
      return (
        <TemplateFieldInspector
          template={templateEditor.activeTemplate}
          selectedFieldId={templateEditor.selectedFieldId}
          isRootSelected={templateEditor.isRootSelected}
          searchQuery={templateEditor.fieldSearchQuery}
          filterFieldTypes={templateEditor.filterFieldTypes}
          placedFieldIds={templateEditor.placedFieldIds}
          onPlaceField={templateEditor.placeField}
          onSelectField={templateEditor.setSelectedFieldId}
          onSelectRoot={templateEditor.selectRoot}
          onUpdateField={templateEditor.updateField}
          onAddField={templateEditor.addField}
          onDeleteField={templateEditor.deleteField}
          onReorderFields={templateEditor.reorderFields}
          onUpdateTemplateMeta={templateEditor.updateTemplateMetadata}
          onCloseEditor={templateEditor.stopEditing}
          isLoading={templateEditor.isLoading}
          isSaving={templateEditor.isSaving}
          error={templateEditor.error}
          successMsg={templateEditor.successMsg}
          position={pos === 'bottom' ? 'right' : pos}
        />
      );
    }
    if (content === 'template_properties') {
      return (
        <TemplatePropertiesInspector
          template={templateEditor.activeTemplate}
          selectedNode={templateEditor.selectedNode}
          parentNode={templateEditor.selectedContainer}
          onUpdateContainer={templateEditor.updateFlexContainer}
          onUpdateComponent={templateEditor.updateFlexComponent}
          onRemoveNode={(id) => {
            if (templateEditor.selectedNode?.nodeType === 'container') {
              templateEditor.removeFlexContainer(id);
            } else {
              templateEditor.removeFlexComponent(id);
            }
          }}
          onSelectNode={templateEditor.selectNode}
        />
      );
    }
    if (content === 'template_builder') {
      return (
        <TemplateLayoutPalette
          selectedContainer={templateEditor.selectedContainer}
          onAddContainer={(preset) => {
            const mapped =
              preset === '2-col' ? 'split-2' : preset === '3-col' ? 'split-3' : preset;
            templateEditor.addFlexPrimitive(mapped);
          }}
          onAddComponent={(comp) => {
            templateEditor.addFlexComponent(templateEditor.activeContainerId, comp);
          }}
          onResetLayout={templateEditor.resetFlexLayoutToDefault}
        />
      );
    }
    if (content === 'template_hierarchy') {
      return (
        <TemplateHierarchyTree
          flexLayoutConfig={templateEditor.flexLayoutConfig}
          selectedNodeId={templateEditor.selectedNodeId}
          activeContainerId={templateEditor.activeContainerId}
          fields={templateEditor.activeTemplate?.fields || []}
          expandedIds={hierarchyExpandedIds}
          onToggleExpand={toggleHierarchyExpand}
          onSelectNode={templateEditor.selectNode}
          onOpenProperties={handleOpenProperties}
          onUpdateContainer={templateEditor.updateFlexContainer}
          onUpdateComponent={templateEditor.updateFlexComponent}
          onRemoveContainer={templateEditor.removeFlexContainer}
          onRemoveComponent={templateEditor.removeFlexComponent}
        />
      );
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

  const getPanelTitle = (tabs: DockContent[], activeTab: DockContent, defaultTitle: string) => {
    if (tabs.length === 0) return defaultTitle;
    if (tabs.length === 1) {
      if (tabs[0] === 'explorer') return 'ITEMS';
      if (tabs[0] === 'collections') return 'COLLECTIONS';
      if (tabs[0] === 'templates') return 'TEMPLATES';
      if (tabs[0] === 'template_editor') return 'TEMPLATE INSPECTOR';
      if (tabs[0] === 'template_properties') return 'PROPERTIES';
      if (tabs[0] === 'template_builder') return 'LAYOUT BUILDER';
      if (tabs[0] === 'template_hierarchy') return 'STRUCTURE';
      if (tabs[0] === 'grabbed_content') return 'GRABBED CONTENT';
    }
    if (activeTab === 'explorer') return 'ITEMS';
    if (activeTab === 'collections') return 'COLLECTIONS';
    if (activeTab === 'templates') return 'TEMPLATES';
    if (activeTab === 'template_editor') return 'TEMPLATE INSPECTOR';
    if (activeTab === 'template_properties') return 'PROPERTIES';
    if (activeTab === 'template_builder') return 'LAYOUT BUILDER';
    if (activeTab === 'template_hierarchy') return 'STRUCTURE';
    if (activeTab === 'grabbed_content') return 'GRABBED CONTENT';
    return defaultTitle;
  };

  const treeHeaderProps = (content: DockContent) => {
    const isCollections = content === 'collections';
    const isTemplates = content === 'templates';
    const isInspector = content === 'template_editor';
    const isBuilder = content === 'template_builder';
    const isHierarchy = content === 'template_hierarchy';
    const isProperties = content === 'template_properties';

    // Calculate field type counts for template editor
    const fieldTypeCounts: Record<string, number> = {};
    if (templateEditor.activeTemplate?.fields) {
      for (const f of templateEditor.activeTemplate.fields) {
        fieldTypeCounts[f.field_type] = (fieldTypeCounts[f.field_type] || 0) + 1;
      }
    }

    const isEmpty = content === 'empty';

    return {
      treeView: (isEmpty ? undefined : isCollections ? 'collections' : isTemplates ? 'templates' : 'items') as ExplorerTab,
      activeTab: (isEmpty
        ? 'empty'
        : isInspector
        ? 'template_editor'
        : isBuilder
        ? 'template_builder'
        : isProperties
        ? 'template_properties'
        : isHierarchy
        ? 'template_hierarchy'
        : isCollections
        ? 'collections'
        : isTemplates
        ? 'templates'
        : content) as ExplorerTab | DockContent,
      searchQuery: isInspector
        ? templateEditor.fieldSearchQuery
        : isCollections
        ? collectionsTree.searchQuery
        : isTemplates
        ? templatesTree.searchQuery
        : searchQuery,
      onSearchChange: (query: string) => {
        if (isInspector) {
          templateEditor.setFieldSearchQuery(query);
        } else {
          setActiveSearchPanel(isCollections ? 'collections' : isTemplates ? 'templates' : 'explorer');
          if (isCollections) collectionsTree.setSearchQuery(query);
          else if (isTemplates) templatesTree.setSearchQuery(query);
          else setSearchQuery(query);
        }
      },
      isAnyCategoryExpanded: isHierarchy
        ? isAllHierarchyExpanded
        : isCollections
        ? collectionsTree.isAnyCategoryExpanded
        : isTemplates
        ? templatesTree.isAnyCategoryExpanded
        : isAnyCategoryExpanded,
      onToggleAllCategories: isHierarchy
        ? toggleAllHierarchy
        : isCollections
        ? collectionsTree.handleToggleAllCategories
        : isTemplates
        ? templatesTree.handleToggleAllCategories
        : handleToggleAllCategories,
      hierarchyNodeCount: isHierarchy ? hierarchyNodeCount : undefined,
      filterCollectionIds: isCollections ? collectionsFilterIds : isTemplates ? templatesFilterIds : filterCollectionIds,
      onToggleFilterCollection: isCollections ? handleToggleCollectionsFilter : isTemplates ? handleToggleTemplatesFilter : handleToggleFilterCollection,
      onClearCollectionFilters: isCollections ? () => setCollectionsFilterIds([]) : isTemplates ? () => setTemplatesFilterIds([]) : handleClearCollectionFilters,
      filterFieldTypes: templateEditor.filterFieldTypes,
      onToggleFilterFieldType: templateEditor.toggleFieldTypeFilter,
      onClearFieldTypeFilters: templateEditor.clearFieldTypeFilters,
      fieldTypeCounts,
      onAddNewField: () => templateEditor.addField('text'),
    };
  };

  const explorerFlyoutPanel = (
    <PrimarySidePanel
      title="ITEMS"
      {...treeHeaderProps('explorer')}
      hasDockedContent
      variant="flyout"
      position="left"
      isOpen={isPrimaryFlyoutOpen}
      onClose={() => setIsPrimaryFlyoutOpen(false)}
      onDock={(position) => handleDropPanel('explorer', position)}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('explorer', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
    >
      {renderExplorerTree('left', 'explorer', true)}
    </PrimarySidePanel>
  );

  const collectionsFlyoutPanel = (
    <PrimarySidePanel
      title="COLLECTIONS"
      {...treeHeaderProps('collections')}
      hasDockedContent
      variant="flyout"
      position="left"
      isOpen={isCollectionsFlyoutOpen}
      onClose={() => setIsCollectionsFlyoutOpen(false)}
      onDock={(position) => handleDropPanel('collections', position)}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('collections', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
    >
      {renderExplorerTree('left', 'collections', true)}
    </PrimarySidePanel>
  );

  const templatesFlyoutPanel = (
    <PrimarySidePanel
      title="TEMPLATES"
      {...treeHeaderProps('templates')}
      hasDockedContent
      variant="flyout"
      position="left"
      isOpen={isTemplatesFlyoutOpen}
      onClose={() => setIsTemplatesFlyoutOpen(false)}
      onDock={(position) => handleDropPanel('templates', position)}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('templates', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
    >
      {renderExplorerTree('left', 'templates', true)}
    </PrimarySidePanel>
  );

  const primaryMoveTooltip =
    primaryTabs.length === 0
      ? 'Content must be docked first'
      : isBottomActive && bottomPanelContent === 'empty' && primaryTabs.length === 1 && primaryTabs[0] === 'grabbed_content'
      ? 'Move Grabbed Content to Bottom Panel'
      : secondaryTabs.length > 0
      ? `Swap ${getPanelTitle(primaryTabs, primaryActiveTab, 'Primary')} and ${getPanelTitle(secondaryTabs, secondaryActiveTab, 'Secondary')}`
      : `Move ${getPanelTitle(primaryTabs, primaryActiveTab, 'Side Bar')} to Secondary Side Bar`;

  const secondaryMoveTooltip =
    secondaryTabs.length === 0
      ? 'Content must be docked first'
      : isBottomActive && bottomPanelContent === 'empty' && secondaryTabs.length === 1 && secondaryTabs[0] === 'grabbed_content'
      ? 'Move Grabbed Content to Bottom Panel'
      : primaryTabs.length > 0
      ? `Swap ${getPanelTitle(secondaryTabs, secondaryActiveTab, 'Secondary')} and ${getPanelTitle(primaryTabs, primaryActiveTab, 'Primary')}`
      : `Move ${getPanelTitle(secondaryTabs, secondaryActiveTab, 'Side Bar')} to Primary Side Bar`;

  const canMovePrimary = primaryTabs.length > 0 && !slidingState;
  const canMoveSecondary = secondaryTabs.length > 0 && !slidingState;

  const explorerSidebarPanel = (
    <PrimarySidePanel
      title={getPanelTitle(primaryTabs, primaryActiveTab, 'PRIMARY SIDE PANEL')}
      {...treeHeaderProps(primaryActiveTab)}
      tabs={primaryTabs}
      activeTab={primaryActiveTab}
      onTabChange={handlePrimaryTabChange}
      hasDockedContent={primaryTabs.length > 0}
      isContentSliding={slidingState !== null && !(slidingState.incomingContent && slidingState.from === 'left' && slidingState.isMoving)}
      showSearchFilter={primaryActiveTab === 'explorer' || primaryActiveTab === 'collections' || primaryActiveTab === 'templates' || primaryActiveTab === 'template_editor'}
      hierarchyNodeCount={hierarchyNodeCount}
      variant="sidebar"
      position="left"
      onTogglePosition={primaryTabs.length > 0 ? handleMovePrimaryContent : undefined}
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
      reservedWidth={isSecondaryActive ? secondaryPanelWidth : 0}
      onWidthChange={setPrimaryPanelWidth}
      loading={loading}
      error={error}
      onAddNewItem={() => openCreateItem(null, null)}
      onAddNewCollection={() => openCreateCollection(null)}
      onAddNewTemplate={() => openTemplateManager(null, undefined)}
      collections={allCollections}
      onHandlePointerDown={(e) => startDockDrag('primary', e)}
      onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
      isDragging={isDraggingPanel}
      reorderInfo={tabReorderInfo}
    >
      {renderPanelBody(primaryActiveTab, 'left')}
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
      {!templateEditor.isEditing && (
        <DynamicWatermark
          isHovered={isLogoHovered}
          onHoverChange={setIsLogoHovered}
          isAudioEnabled={isAudioEnabled}
        />
      )}

      {/* Primary Application Shell */}
      <div className="flex flex-col h-full w-full">
        {/* Tier 1: Top Navigation Header */}
        <div className="shrink-0 relative z-[80]">
          <NavigationHeader
            activeCollectionName={activeCollection ? activeCollection.name : 'Select Collection'}
            onOpenTemplateManager={() => {
              if (activeCollection) {
                openTemplateManager(activeCollection.id, activeCollection.name);
              } else {
                openTemplateManager(null, undefined);
              }
            }}
            isPrimarySidePanelOpen={isPrimaryFlyoutOpen}
            onTogglePrimarySidePanel={() => { setIsCollectionsFlyoutOpen(false); setIsTemplatesFlyoutOpen(false); setIsPrimaryFlyoutOpen(!isPrimaryFlyoutOpen); }}
            unpinnedPrimaryPanel={explorerFlyoutPanel}
            collectionsFlyoutPanel={collectionsFlyoutPanel}
            isCollectionsOpen={isCollectionsFlyoutOpen}
            onToggleCollections={() => { setIsPrimaryFlyoutOpen(false); setIsTemplatesFlyoutOpen(false); setIsCollectionsFlyoutOpen(!isCollectionsFlyoutOpen); }}
            collectionsDockedSide={primaryTabs.includes('collections') ? 'left' : secondaryTabs.includes('collections') ? 'right' : null}
            onStartCollectionsDrag={e => startDockDrag('collections', e)}
            templatesFlyoutPanel={templatesFlyoutPanel}
            isTemplatesOpen={isTemplatesFlyoutOpen}
            onToggleTemplates={() => { setIsPrimaryFlyoutOpen(false); setIsCollectionsFlyoutOpen(false); setIsTemplatesFlyoutOpen(!isTemplatesFlyoutOpen); }}
            templatesDockedSide={primaryTabs.includes('templates') ? 'left' : secondaryTabs.includes('templates') ? 'right' : null}
            onStartTemplatesDrag={e => startDockDrag('templates', e)}
            explorerDockedSide={primaryTabs.includes('explorer') ? 'left' : secondaryTabs.includes('explorer') ? 'right' : null}
            onStartExplorerDrag={(e) => startDockDrag('explorer', e)}
            onStartGrabbedContentDrag={(e) => startDockDrag('grabbed_content', e)}
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
            isTabReorder={isTabReorder}
            primaryPanelContent={primaryActiveTab}
            secondaryPanelContent={secondaryActiveTab}
            bottomPanelContent={bottomPanelContent}
            primaryTabs={primaryTabs}
            secondaryTabs={secondaryTabs}
            primaryActiveTab={primaryActiveTab}
            secondaryActiveTab={secondaryActiveTab}
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
              editingTemplate={templateEditor.isEditing ? templateEditor.activeTemplate : null}
              selectedFieldId={templateEditor.selectedFieldId}
              onSelectField={templateEditor.setSelectedFieldId}
              onDoneEditingTemplate={templateEditor.stopEditing}
              onAddFieldToTemplate={() => templateEditor.addField('text')}
              flexLayoutConfig={templateEditor.flexLayoutConfig}
              selectedNodeId={templateEditor.selectedNodeId}
              activeContainerId={templateEditor.activeContainerId}
              onSelectNode={handleOpenProperties}
              onAddPrimitive={templateEditor.addFlexPrimitive}
              onAddFlexContainer={templateEditor.addFlexContainer}
              onUpdateFlexContainer={templateEditor.updateFlexContainer}
              onRemoveFlexContainer={templateEditor.removeFlexContainer}
              onAddFlexComponent={templateEditor.addFlexComponent}
              onUpdateFlexComponent={templateEditor.updateFlexComponent}
              onRemoveFlexComponent={templateEditor.removeFlexComponent}
              onPlaceField={templateEditor.placeField}
              onResetFlexLayout={templateEditor.resetFlexLayoutToDefault}
              layoutConfig={templateEditor.layoutConfig}
              selectedBlockId={templateEditor.selectedBlockId}
              canvasMode={templateEditor.canvasMode}
              onSelectBlock={templateEditor.setSelectedBlockId}
              onAddSection={templateEditor.addSection}
              onRemoveSection={templateEditor.removeSection}
              onUpdateSection={templateEditor.updateSection}
              onAddBlock={templateEditor.addBlock}
              onUpdateBlock={templateEditor.updateBlock}
              onRemoveBlock={templateEditor.removeBlock}
              onResetLayout={templateEditor.resetLayoutToDefault}
              onToggleCanvasMode={templateEditor.toggleCanvasMode}
            />
          </div>

          {/* Dockable Bottom Panel */}
          <BottomPanel
            isOpen={isBottomActive}
            isPinned={isBottomPinned}
            title={
              bottomPanelContent === 'template_builder'
                ? 'LAYOUT BUILDER'
                : bottomPanelContent === 'grabbed_content'
                ? 'GRABBED CONTENT'
                : 'BOTTOM PANEL'
            }
            tabLabel={
              bottomPanelContent === 'template_builder'
                ? 'Builder'
                : bottomPanelContent === 'grabbed_content'
                ? 'Grabbed Content'
                : undefined
            }
            tabTitle={
              bottomPanelContent === 'template_builder'
                ? 'Template Layout Builder (drag to move tab)'
                : bottomPanelContent === 'grabbed_content'
                ? 'Grabbed Content (drag to move tab)'
                : undefined
            }
            onStartTabDrag={(e) => {
              if (bottomPanelContent !== 'empty') {
                startDockDrag(bottomPanelContent, e);
              }
            }}
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
            {bottomPanelContent !== 'empty' ? renderPanelBody(bottomPanelContent, 'bottom') : null}
          </BottomPanel>

          {/* Secondary Side Panel (Details / Inspector Drawer / Grabbed Content) - Sits Above Main Content (z-40) */}
          <SecondarySidePanel
            title={getPanelTitle(secondaryTabs, secondaryActiveTab, 'SECONDARY SIDE PANEL')}
            {...treeHeaderProps(secondaryActiveTab)}
            tabs={secondaryTabs}
            activeTab={secondaryActiveTab}
            onTabChange={handleSecondaryTabChange}
            hasDockedContent={secondaryTabs.length > 0}
            isContentSliding={slidingState !== null && !(slidingState.incomingContent && slidingState.from === 'right' && slidingState.isMoving)}
            showSearchFilter={secondaryActiveTab === 'explorer' || secondaryActiveTab === 'collections' || secondaryActiveTab === 'templates' || secondaryActiveTab === 'template_editor'}
            hierarchyNodeCount={hierarchyNodeCount}
            isOpen={isSecondaryActive}
            isPinned={isSecondaryPinned}
            position="right"
            onTogglePosition={secondaryTabs.length > 0 ? handleMoveSecondaryContent : undefined}
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
            reservedWidth={isPrimaryActive ? primaryPanelWidth : 0}
            onWidthChange={setSecondaryPanelWidth}
            onAddNewItem={() => openCreateItem(null, null)}
            onAddNewCollection={() => openCreateCollection(null)}
            onAddNewTemplate={() => openTemplateManager(null, undefined)}
            collections={allCollections}
            onHandlePointerDown={(e) => startDockDrag('secondary', e)}
            onStartTabDrag={(tab, e) => startDockDrag(tab, e)}
            isDragging={isDraggingPanel}
            reorderInfo={tabReorderInfo}
          >
            {renderPanelBody(secondaryActiveTab, 'right')}
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
                title={getPanelTitle(slidingState.tabs, slidingState.activeTab, 'SIDE PANEL')}
                {...treeHeaderProps(slidingState.activeTab)}
                tabs={slidingState.tabs}
                activeTab={slidingState.activeTab}
                hasDockedContent={slidingState.tabs.length > 0}
                showSearchFilter={slidingState.activeTab === 'explorer' || slidingState.activeTab === 'collections' || slidingState.activeTab === 'templates'}
                variant="sidebar"
                isPinned={slidingState.to === 'left' ? isPinned : isSecondaryPinned}
                position={slidingState.to}
                onTogglePin={() => {}}
                onClose={() => {}}
              />
              <div className={`flex-1 min-h-0 overflow-hidden ${slidingState.activeTab !== 'empty' ? 'px-2.5 pt-0 pb-3' : 'p-0'} min-w-0 primary-panel-scroll flex flex-col`}>
                {renderPanelBody(slidingState.activeTab, slidingState.to)}
              </div>
              <div
                className={`panel-bottom-topper ${
                  slidingState.tabs.length > 0 ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
                } shrink-0 select-none pointer-events-none`}
                aria-hidden="true"
              />
            </aside>
          )}

          {slidingState?.secondaryTabs && (
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
                title={getPanelTitle(slidingState.secondaryTabs, slidingState.secondaryActiveTab ?? 'empty', 'SIDE PANEL')}
                hasDockedContent={slidingState.secondaryTabs.length > 0}
                showSearchFilter={slidingState.secondaryActiveTab === 'explorer' || slidingState.secondaryActiveTab === 'collections'}
                variant="sidebar"
                isPinned={slidingState.to === 'right' ? isPinned : isSecondaryPinned}
                position={slidingState.to === 'right' ? 'left' : 'right'}
                {...treeHeaderProps(slidingState.secondaryActiveTab ?? 'empty')}
                tabs={slidingState.secondaryTabs}
                activeTab={slidingState.secondaryActiveTab}
                onTogglePin={() => {}}
                onClose={() => {}}
              />
              <div className={`flex-1 min-h-0 overflow-hidden ${slidingState.secondaryActiveTab !== 'empty' ? 'px-2.5 pt-0 pb-3' : 'p-0'} min-w-0 primary-panel-scroll flex flex-col`}>
                {renderPanelBody(slidingState.secondaryActiveTab ?? 'empty', slidingState.to === 'right' ? 'left' : 'right')}
              </div>
              <div
                className={`panel-bottom-topper ${
                  slidingState.secondaryTabs.length > 0 ? 'panel-bottom-topper-occupied' : 'panel-bottom-topper-empty'
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
