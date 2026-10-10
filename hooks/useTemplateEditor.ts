'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTemplate, saveTemplateLayout, updateTemplateMetadata as saveTemplateMetadata } from '@/lib/data/templates';
import { createTemplateField, deleteTemplateField, reorderTemplateFields, updateTemplateField } from '@/lib/data/templateFields';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition, FieldType } from '@/types/field';
import { TemplateFlexLayoutConfig, createDefaultFlexLayout, findFlexNode } from '@/types/layout';
import { HierarchyFilterCategory, HIERARCHY_FILTER_METAS } from '@/lib/hierarchyFilterMetas';
import { BLUEPRINT_GROUPS, type BlueprintGroupId } from '@/lib/blueprintGroups';
import { DockContent } from '@/hooks/usePanelDockDrag';
import { errorMessage } from '@/lib/errors';
import { useTemplateLayoutTree } from '@/hooks/useTemplateLayoutTree';
import { layoutCacheKey, readCachedLayout, resolveSavedLayout } from '@/lib/layoutStorage';
import { useLayoutHistory } from '@/hooks/useLayoutHistory';

// Sentinels for the "select none" filter state -- see selectNoneFieldTypeFilter /
// selectNoneHierarchyTypeFilter below.
const NONE_FIELD_TYPE_FILTER = '__none__' as BlueprintGroupId;
const NONE_HIERARCHY_TYPE_FILTER = '__none__' as HierarchyFilterCategory;

export interface WorkspaceTabSnapshot {
  primaryTabs: DockContent[];
  primaryActiveTab: DockContent;
  secondaryTabs: DockContent[];
  secondaryActiveTab: DockContent;
  isPrimarySidePanelOpen: boolean;
  isSecondaryOpen: boolean;
  isPinned: boolean;
  isSecondaryPinned: boolean;
  bottomPanelContent: 'empty' | 'grabbed_content' | 'template_builder';
  isBottomPanelOpen: boolean;
  isBottomPinned: boolean;
}

interface UseTemplateEditorOptions {
  onRefreshData?: () => Promise<void> | void;
  getTabSnapshot?: () => WorkspaceTabSnapshot;
  onRestoreTabs?: (snapshot: WorkspaceTabSnapshot) => void;
  onOpenPrimaryPanel?: (tabs: DockContent[], activeTab: DockContent) => void;
  onOpenSecondaryPanel?: (tabs: DockContent[], activeTab: DockContent) => void;
  onOpenBottomPanel?: (content: 'template_builder') => void;
}

export function useTemplateEditor({
  onRefreshData,
  getTabSnapshot,
  onRestoreTabs,
  onOpenPrimaryPanel,
  onOpenSecondaryPanel,
  onOpenBottomPanel,
}: UseTemplateEditorOptions = {}) {
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<ItemTemplate | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [isRootSelected, setIsRootSelected] = useState<boolean>(false);
  const [fieldSearchQuery, setFieldSearchQuery] = useState<string>('');
  // The Blueprint tree's group filter (its Advanced filter menu): the groups to show, empty = all.
  const [filterFieldTypes, setFilterFieldTypes] = useState<BlueprintGroupId[]>([]);
  // The Blueprint header's "missing only" toggle: hide what is already placed in the layout. Session-only.
  const [showUnplacedOnly, setShowUnplacedOnly] = useState(false);
  const toggleShowUnplacedOnly = useCallback(() => setShowUnplacedOnly((on) => !on), []);
  // The Blueprint tree's collapsed groups (all open by default). Session-only.
  const [collapsedBlueprintGroups, setCollapsedBlueprintGroups] = useState<ReadonlySet<BlueprintGroupId>>(new Set());
  const toggleBlueprintGroup = useCallback((id: BlueprintGroupId) => {
    setCollapsedBlueprintGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  /** Expand / collapse all: collapses every group while any is open, else opens them all. */
  const toggleAllBlueprintGroups = useCallback(() => {
    setCollapsedBlueprintGroups((prev) =>
      prev.size < BLUEPRINT_GROUPS.length ? new Set(BLUEPRINT_GROUPS.map((g) => g.type)) : new Set()
    );
  }, []);
  const [hierarchySearchQuery, setHierarchySearchQuery] = useState<string>('');
  const [filterHierarchyTypes, setFilterHierarchyTypes] = useState<HierarchyFilterCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Layout Engine States (Flexbox & Legacy)
  const [flexLayoutConfig, setFlexLayoutConfigState] = useState<TemplateFlexLayoutConfig | null>(null);
  // The newest layout, readable from callbacks that may hold a stale render's state (history needs the true "before").
  const flexLayoutRef = useRef<TemplateFlexLayoutConfig | null>(null);
  const layoutHistory = useLayoutHistory();
  const { record: recordLayoutEdit, clear: clearLayoutHistory } = layoutHistory;
  const setFlexLayout = useCallback((next: TemplateFlexLayoutConfig) => {
    flexLayoutRef.current = next;
    setFlexLayoutConfigState(next);
  }, []);
  // The layout as it was when the editor opened (or was last saved). Edits are written as they happen
  // (so nothing is lost on a crash), but leaving the editor with a layout that differs from this asks
  // whether to keep it (Save) or put this one back (Discard).
  const savedLayoutRef = useRef<TemplateFlexLayoutConfig | null>(null);
  const captureSavedLayoutRef = useRef(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<'edit' | 'preview'>('edit');

  // An empty filter array means "nothing excluded" -- shown as every box checked, not every box
  // unchecked, since that's what it actually does (matches everything). So toggling treats "empty"
  // as "everything currently selected" and unchecking one; toggling back up to the full set
  // collapses back to empty rather than sitting at a redundant "all N explicitly listed" state,
  // which would needlessly show the "filter applied" indicator for a filter that changes nothing.
  const toggleFieldTypeFilter = useCallback((type: BlueprintGroupId) => {
    setFilterFieldTypes((prev) => {
      const allTypes = BLUEPRINT_GROUPS.map((m) => m.type);
      const effective = prev.length === 0 ? allTypes : prev;
      const next = effective.includes(type) ? effective.filter((t) => t !== type) : [...effective, type];
      return next.length === allTypes.length ? [] : next;
    });
  }, []);

  const clearFieldTypeFilters = useCallback(() => {
    setFilterFieldTypes([]);
  }, []);

  // "Select none" needs a state distinct from the reserved "empty = everything" one, so it's
  // represented as a single-entry array holding a value that can never equal a real group --
  // every `.includes()` check downstream then naturally excludes every real type, while the array
  // stays non-empty (so it isn't mistaken for "no filter applied").
  const selectNoneFieldTypeFilter = useCallback(() => {
    setFilterFieldTypes([NONE_FIELD_TYPE_FILTER]);
  }, []);

  const toggleHierarchyTypeFilter = useCallback((type: HierarchyFilterCategory) => {
    setFilterHierarchyTypes((prev) => {
      const allTypes = HIERARCHY_FILTER_METAS.map((m) => m.type);
      const effective = prev.length === 0 ? allTypes : prev;
      const next = effective.includes(type) ? effective.filter((t) => t !== type) : [...effective, type];
      return next.length === allTypes.length ? [] : next;
    });
  }, []);

  const clearHierarchyTypeFilters = useCallback(() => {
    setFilterHierarchyTypes([]);
  }, []);

  // Same "select none" sentinel trick as selectNoneFieldTypeFilter, above.
  const selectNoneHierarchyTypeFilter = useCallback(() => {
    setFilterHierarchyTypes([NONE_HIERARCHY_TYPE_FILTER]);
  }, []);

  const toggleCanvasMode = useCallback(() => {
    setCanvasMode((prev) => (prev === 'edit' ? 'preview' : 'edit'));
  }, []);

  // Layout-tree nodes hidden from the edit canvas (the eye on each tree row), to cut clutter while
  // working on one area. Editor-only like zoom: never saved into the layout, ignored by Preview and the
  // item view, and cleared whenever the editor opens. Hiding a container hides everything inside it.
  const [hiddenNodeIds, setHiddenNodeIds] = useState<Set<string>>(() => new Set());
  const toggleNodeHidden = useCallback((nodeId: string) => {
    setHiddenNodeIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(nodeId)) next.add(nodeId);
      return next;
    });
  }, []);

  // Tab snapshot saved when entering edit mode
  const tabSnapshotRef = useRef<WorkspaceTabSnapshot | null>(null);

  /**
   * Layout persistence. The browser copy (localStorage) is written on every change so a refresh
   * never loses work. The remote copy is debounced: a resize drag or a burst of edits sends ONE
   * request after things settle, not one per mouse move.
   */
  const REMOTE_SAVE_DELAY_MS = 800;
  const remoteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteSavePending = useRef<{ id: number; layout: TemplateFlexLayoutConfig } | null>(null);
  const remoteSaveWarned = useRef(false);

  const flushRemoteSave = useCallback(async () => {
    if (remoteSaveTimer.current) {
      clearTimeout(remoteSaveTimer.current);
      remoteSaveTimer.current = null;
    }
    const pending = remoteSavePending.current;
    if (!pending) return;
    remoteSavePending.current = null;
    try {
      await saveTemplateLayout(pending.id, pending.layout);
    } catch (err) {
      // Warn once per session so a missing layout_config column is visible, not silent.
      // The browser copy is still saved, so this is not fatal.
      if (!remoteSaveWarned.current) {
        remoteSaveWarned.current = true;
        console.warn('Template layout was not saved to the database (kept in this browser only):', errorMessage(err, 'unknown error'));
      }
    }
  }, []);

  const persistLayout = useCallback(
    (templateId: number, layout: TemplateFlexLayoutConfig) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(layoutCacheKey(templateId), JSON.stringify(layout));
        } catch (e) {
          console.warn('Could not cache layout in localStorage:', e);
        }
      }
      remoteSavePending.current = { id: templateId, layout };
      if (remoteSaveTimer.current) clearTimeout(remoteSaveTimer.current);
      remoteSaveTimer.current = setTimeout(() => {
        void flushRemoteSave();
      }, REMOTE_SAVE_DELAY_MS);
    },
    [flushRemoteSave]
  );

  // Send any pending remote save when the page is hidden or closed
  useEffect(() => {
    const flush = () => {
      void flushRemoteSave();
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flushRemoteSave]);

  const saveFlexLayoutConfig = useCallback(
    (nextFlex: TemplateFlexLayoutConfig) => {
      if (flexLayoutRef.current) recordLayoutEdit(flexLayoutRef.current, nextFlex);
      setFlexLayout(nextFlex);
      if (editingTemplateId) persistLayout(editingTemplateId, nextFlex);
    },
    [editingTemplateId, persistLayout, recordLayoutEdit, setFlexLayout]
  );

  /**
   * Fetch full template data (including fields and layout) for a given template ID
   */
  const loadTemplate = useCallback(async (templateId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const rawId = Math.abs(templateId);
      if (!rawId) {
        setError('Invalid template ID');
        return null;
      }

      const loadedTemplate: ItemTemplate = await fetchTemplate(rawId);

      // The same copy the item view draws (a valid browser copy, else the stored layout), else the default
      const resolvedFlex: TemplateFlexLayoutConfig =
        resolveSavedLayout(readCachedLayout(rawId), loadedTemplate.layout_config) ??
        createDefaultFlexLayout(loadedTemplate.fields || []);

      setActiveTemplate(loadedTemplate);
      setFlexLayout(resolvedFlex);
      if (captureSavedLayoutRef.current) {
        captureSavedLayoutRef.current = false;
        savedLayoutRef.current = resolvedFlex;
      }

      // Select first child container if present, else root
      const initialNodeId = resolvedFlex.root.children[0]?.id || resolvedFlex.root.id;
      setSelectedNodeId(initialNodeId);

      // Select first field if available
      if (loadedTemplate.fields && loadedTemplate.fields.length > 0) {
        setSelectedFieldId(loadedTemplate.fields[0].id);
        setIsRootSelected(false);
      } else {
        setSelectedFieldId(null);
        setIsRootSelected(true);
      }

      return loadedTemplate;
    } catch (err) {
      console.error('Failed to load template:', err);
      setError(errorMessage(err, 'Failed to load template details'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setFlexLayout]);

  /**
   * Start editing a template:
   * 1. Takes snapshot of existing docked tabs
   * 2. Sets editingTemplateId
   * 3. Loads template & fields & layout
   * 4. Focuses Content and Properties tabs in right sidebar, and Components in bottom panel
   */
  const startEditing = useCallback(
    async (templateId: number) => {
      const rawId = Math.abs(templateId);
      if (!rawId) return;

      // 1. Snapshot current tab setup if not already in editing mode
      if (getTabSnapshot && !tabSnapshotRef.current) {
        const snapshot = getTabSnapshot();
        tabSnapshotRef.current = snapshot;
      }

      setEditingTemplateId(rawId);
      setFieldSearchQuery('');
      setFilterFieldTypes([]);
      setShowUnplacedOnly(false);
      setCollapsedBlueprintGroups(new Set());
      setHierarchySearchQuery('');
      setFilterHierarchyTypes([]);
      setSuccessMsg(null);
      setCanvasMode('edit');
      setHiddenNodeIds(new Set());
      clearLayoutHistory();

      // 2. Open left panel with Layout (the container hierarchy)
      if (onOpenPrimaryPanel) {
        onOpenPrimaryPanel(['template_hierarchy'], 'template_hierarchy');
      }

      // 3. Open right panel with Content
      if (onOpenSecondaryPanel) {
        onOpenSecondaryPanel(['template_editor'], 'template_editor');
      }

      // 4. Open bottom panel with Components (its own Layout & Components sub-tabs)
      if (onOpenBottomPanel) {
        onOpenBottomPanel('template_builder');
      }

      // 5. Load the template (its layout is the one Discard puts back)
      captureSavedLayoutRef.current = true;
      await loadTemplate(rawId);
    },
    [getTabSnapshot, loadTemplate, clearLayoutHistory, onOpenPrimaryPanel, onOpenSecondaryPanel, onOpenBottomPanel]
  );

  /**
   * Stop editing template:
   * 1. Restores prior tab configuration
   * 2. Clears editing state
   */
  const stopEditing = useCallback(() => {
    if (tabSnapshotRef.current && onRestoreTabs) {
      onRestoreTabs(tabSnapshotRef.current);
      tabSnapshotRef.current = null;
    }
    setEditingTemplateId(null);
    setActiveTemplate(null);
    setSelectedFieldId(null);
    setIsRootSelected(false);
    setFieldSearchQuery('');
    setFilterFieldTypes([]);
    setHierarchySearchQuery('');
    setFilterHierarchyTypes([]);
    setError(null);
    setSuccessMsg(null);
    clearLayoutHistory();
    savedLayoutRef.current = null;
  }, [onRestoreTabs, clearLayoutHistory]);

  /** Dismisses the status message (StatusToast). Stable, so the toast's auto-dismiss timer isn't restarted. */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMsg(null);
  }, []);

  /** Whether the layout differs from the one the editor opened with (or last saved). */
  const hasUnsavedLayoutChanges = useCallback(() => {
    const saved = savedLayoutRef.current;
    const current = flexLayoutRef.current;
    if (!saved || !current) return false;
    return JSON.stringify(saved) !== JSON.stringify(current);
  }, []);

  /** Keep the layout as it is: finish the pending database write now and make it the saved layout. */
  const saveLayoutChanges = useCallback(async () => {
    await flushRemoteSave();
    savedLayoutRef.current = flexLayoutRef.current;
  }, [flushRemoteSave]);

  /** Put back the layout the editor opened with (or last saved), in this browser and the database. */
  const discardLayoutChanges = useCallback(async () => {
    const saved = savedLayoutRef.current;
    if (!saved || !editingTemplateId) return;
    setFlexLayout(saved);
    persistLayout(editingTemplateId, saved);
    await flushRemoteSave();
  }, [editingTemplateId, persistLayout, flushRemoteSave, setFlexLayout]);

  /** The toolbar Save: save, then close the editor. */
  const saveAndClose = useCallback(async () => {
    await saveLayoutChanges();
    stopEditing();
  }, [saveLayoutChanges, stopEditing]);

  /**
   * Update template top-level metadata (name, description, icon)
   */
  const updateTemplateMetadata = useCallback(
    async (name: string, description: string | null, icon: string) => {
      if (!editingTemplateId) return;
      try {
        setIsSaving(true);
        setError(null);

        const updated = await saveTemplateMetadata(editingTemplateId, { name, description, icon });

        setActiveTemplate((prev) =>
          prev ? { ...prev, name: updated.name, description: updated.description, icon: updated.icon } : null
        );
        setSuccessMsg('Template metadata updated');
        if (onRefreshData) await onRefreshData();
      } catch (err) {
        console.error('Failed to update template metadata:', err);
        setError(errorMessage(err, 'Failed to update template'));
      } finally {
        setIsSaving(false);
      }
    },
    [editingTemplateId, onRefreshData]
  );

  /**
   * Add a new field to the active template
   */
  const addField = useCallback(
    async (initialType: FieldType = 'text', customLabel?: string) => {
      if (!editingTemplateId || !activeTemplate) return;
      try {
        setIsSaving(true);
        setError(null);

        const currentFields = activeTemplate.fields || [];
        const nextOrder = currentFields.length > 0 ? Math.max(...currentFields.map((f) => f.display_order)) + 1 : 1;
        const baseName = customLabel
          ? customLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
          : `field_${Date.now().toString().slice(-4)}`;
        const label = customLabel || `New ${initialType.charAt(0).toUpperCase() + initialType.slice(1)} Field`;

        const formattedField: FieldDefinition = await createTemplateField({
          templateId: editingTemplateId,
          name: baseName || `field_${Date.now()}`,
          label,
          fieldType: initialType,
          options: initialType === 'select' ? ['Option 1', 'Option 2'] : null,
          displayOrder: nextOrder,
        });

        setActiveTemplate((prev) =>
          prev
            ? {
                ...prev,
                fields: [...(prev.fields || []), formattedField],
              }
            : null
        );
        setSelectedFieldId(formattedField.id);
        setIsRootSelected(false);
        setSuccessMsg(`Added field "${formattedField.label}"`);
        if (onRefreshData) await onRefreshData();
      } catch (err) {
        console.error('Failed to add field:', err);
        setError(errorMessage(err, 'Failed to add field'));
      } finally {
        setIsSaving(false);
      }
    },
    [editingTemplateId, activeTemplate, onRefreshData]
  );

  /**
   * Update an existing field in Supabase
   */
  const updateField = useCallback(
    async (fieldId: number, partial: Partial<FieldDefinition>) => {
      if (!editingTemplateId || !activeTemplate) return;
      try {
        setIsSaving(true);
        setError(null);

        // Optimistic local update
        setActiveTemplate((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            fields: (prev.fields || []).map((f) => (f.id === fieldId ? { ...f, ...partial } : f)),
          };
        });

        const formattedUpdated: FieldDefinition = await updateTemplateField(fieldId, partial);

        setActiveTemplate((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            fields: (prev.fields || []).map((f) => (f.id === fieldId ? formattedUpdated : f)),
          };
        });

        setSuccessMsg('Field updated');
        if (onRefreshData) await onRefreshData();
      } catch (err) {
        console.error('Failed to update field:', err);
        setError(errorMessage(err, 'Failed to update field'));
        // Reload to revert on error
        await loadTemplate(editingTemplateId);
      } finally {
        setIsSaving(false);
      }
    },
    [editingTemplateId, activeTemplate, onRefreshData, loadTemplate]
  );

  /**
   * Delete a field from the template
   */
  const deleteField = useCallback(
    async (fieldId: number) => {
      if (!editingTemplateId || !activeTemplate) return;
      try {
        setIsSaving(true);
        setError(null);

        await deleteTemplateField(fieldId);

        setActiveTemplate((prev) => {
          if (!prev) return null;
          const nextFields = (prev.fields || []).filter((f) => f.id !== fieldId);
          return {
            ...prev,
            fields: nextFields,
          };
        });

        if (selectedFieldId === fieldId) {
          const remaining = (activeTemplate.fields || []).filter((f) => f.id !== fieldId);
          if (remaining.length > 0) {
            setSelectedFieldId(remaining[0].id);
          } else {
            setSelectedFieldId(null);
            setIsRootSelected(true);
          }
        }

        setSuccessMsg('Field removed from template');
        if (onRefreshData) await onRefreshData();
      } catch (err) {
        console.error('Failed to delete field:', err);
        setError(errorMessage(err, 'Failed to delete field'));
      } finally {
        setIsSaving(false);
      }
    },
    [editingTemplateId, activeTemplate, selectedFieldId, onRefreshData]
  );

  /**
   * Reorder fields (move up / down or drag reorder)
   */
  const reorderFields = useCallback(
    async (orderedFieldIds: number[]) => {
      if (!editingTemplateId || !activeTemplate) return;
      try {
        setIsSaving(true);
        setError(null);

        // Optimistically update order
        const currentFields = activeTemplate.fields || [];
        const fieldMap = new Map(currentFields.map((f) => [f.id, f]));
        const updatedFields: FieldDefinition[] = orderedFieldIds
          .map((id, index) => {
            const f = fieldMap.get(id);
            return f ? { ...f, display_order: index + 1 } : null;
          })
          .filter(Boolean) as FieldDefinition[];

        setActiveTemplate((prev) => (prev ? { ...prev, fields: updatedFields } : null));

        await reorderTemplateFields(orderedFieldIds);
        if (onRefreshData) await onRefreshData();
      } catch (err) {
        console.error('Failed to reorder fields:', err);
        setError(errorMessage(err, 'Failed to save field order'));
        await loadTemplate(editingTemplateId);
      } finally {
        setIsSaving(false);
      }
    },
    [editingTemplateId, activeTemplate, onRefreshData, loadTemplate]
  );

  // The flex layout tree's selection and CRUD (add/insert/split/update/remove/place) lives in its
  // own hook; it operates on the layout state owned here and persisted via saveFlexLayoutConfig.
  const layoutTree = useTemplateLayoutTree({
    flexLayoutConfig,
    selectedNodeId,
    setSelectedNodeId,
    saveFlexLayoutConfig,
    activeTemplate,
  });

  // Undo / redo step the layout through the session's history. They are not new edits, so they
  // bypass saveFlexLayoutConfig (which would record them), but the result is still persisted.
  const { stepBack, stepForward } = layoutHistory;
  const applyHistoryStep = useCallback(
    (layout: TemplateFlexLayoutConfig) => {
      setFlexLayout(layout);
      if (editingTemplateId) persistLayout(editingTemplateId, layout);
      // A node the step removed can't stay selected
      if (selectedNodeId && !findFlexNode(layout.root, selectedNodeId)) setSelectedNodeId(layout.root.id);
    },
    [editingTemplateId, persistLayout, selectedNodeId, setFlexLayout]
  );
  const undoLayout = useCallback(() => {
    if (!flexLayoutRef.current) return;
    const layout = stepBack(flexLayoutRef.current);
    if (layout) applyHistoryStep(layout);
  }, [stepBack, applyHistoryStep]);
  const redoLayout = useCallback(() => {
    if (!flexLayoutRef.current) return;
    const layout = stepForward(flexLayoutRef.current);
    if (layout) applyHistoryStep(layout);
  }, [stepForward, applyHistoryStep]);

  const selectedField = activeTemplate?.fields?.find((f) => f.id === selectedFieldId) || null;

  return {
    editingTemplateId,
    isEditing: editingTemplateId !== null,
    activeTemplate,
    selectedFieldId,
    selectedField,
    isRootSelected,
    fieldSearchQuery,
    filterFieldTypes,
    showUnplacedOnly,
    toggleShowUnplacedOnly,
    collapsedBlueprintGroups,
    toggleBlueprintGroup,
    toggleAllBlueprintGroups,
    toggleFieldTypeFilter,
    clearFieldTypeFilters,
    selectNoneFieldTypeFilter,
    hierarchySearchQuery,
    filterHierarchyTypes,
    toggleHierarchyTypeFilter,
    clearHierarchyTypeFilters,
    selectNoneHierarchyTypeFilter,
    isLoading,
    isSaving,
    error,
    successMsg,
    setFieldSearchQuery,
    setFilterFieldTypes,
    setHierarchySearchQuery,
    setFilterHierarchyTypes,
    setSelectedFieldId: (id: number | null) => {
      setSelectedFieldId(id);
      setIsRootSelected(id === null);
    },
    selectRoot: () => {
      setSelectedFieldId(null);
      setIsRootSelected(true);
    },
    clearMessages,
    startEditing,
    stopEditing,
    saveAndClose,
    hasUnsavedLayoutChanges,
    saveLayoutChanges,
    discardLayoutChanges,
    loadTemplate,
    updateTemplateMetadata,
    addField,
    updateField,
    deleteField,
    reorderFields,
    // Modern Flexbox Layout Engine APIs
    flexLayoutConfig,
    selectedNodeId,
    ...layoutTree,
    canUndoLayout: layoutHistory.canUndo,
    canRedoLayout: layoutHistory.canRedo,
    undoLayout,
    redoLayout,
    canvasMode,
    setCanvasMode,
    hiddenNodeIds,
    toggleNodeHidden,
    toggleCanvasMode,
  };
}

