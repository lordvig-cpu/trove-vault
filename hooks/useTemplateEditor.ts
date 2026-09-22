'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTemplate, saveTemplateLayout, updateTemplateMetadata as saveTemplateMetadata } from '@/lib/data/templates';
import { createTemplateField, deleteTemplateField, reorderTemplateFields, updateTemplateField } from '@/lib/data/templateFields';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition, FieldType } from '@/types/field';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  isFlexLayoutConfig,
  createDefaultFlexLayout,
  findFlexNode,
  defaultChildDirection,
  findParentFlexContainer,
  collectPlacedFieldIds,
} from '@/types/layout';
import { DockContent } from '@/hooks/usePanelDockDrag';
import { errorMessage } from '@/lib/errors';
import {
  buildContainer,
  insertChild,
  insertSibling,
  newNodeId,
  removeNode,
  splitContainer,
  updateComponent,
  updateContainer,
} from '@/lib/layoutTree';

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
  const [filterFieldTypes, setFilterFieldTypes] = useState<FieldType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Layout Engine States (Flexbox & Legacy)
  const [flexLayoutConfig, setFlexLayoutConfigState] = useState<TemplateFlexLayoutConfig | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<'edit' | 'preview'>('edit');

  const toggleFieldTypeFilter = useCallback((type: FieldType) => {
    setFilterFieldTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const clearFieldTypeFilters = useCallback(() => {
    setFilterFieldTypes([]);
  }, []);

  const toggleCanvasMode = useCallback(() => {
    setCanvasMode((prev) => (prev === 'edit' ? 'preview' : 'edit'));
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
          localStorage.setItem(`trovevault_template_layout_${templateId}`, JSON.stringify(layout));
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
      setFlexLayoutConfigState(nextFlex);
      if (editingTemplateId) persistLayout(editingTemplateId, nextFlex);
    },
    [editingTemplateId, persistLayout]
  );

  /**
   * Fetch full template data (including fields and layout) for a given template ID
   */
  const loadTemplate = useCallback(async (templateId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const rawId = Math.abs(templateId);
      if (!rawId || rawId === 999) {
        setError('Invalid template ID');
        return null;
      }

      const loadedTemplate: ItemTemplate = await fetchTemplate(rawId);

      // Resolve Layout: Check localStorage -> the template's stored layout -> generate default flex layout
      let rawConfig: unknown = null;
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`trovevault_template_layout_${rawId}`);
          if (cached) rawConfig = JSON.parse(cached);
        } catch {
          // Ignore
        }
      }

      if (!rawConfig && loadedTemplate.layout_config) {
        rawConfig = loadedTemplate.layout_config;
      }

      // Only current (flex, version 2) layouts are loaded; anything else starts from the default
      const resolvedFlex: TemplateFlexLayoutConfig = isFlexLayoutConfig(rawConfig)
        ? rawConfig
        : createDefaultFlexLayout(loadedTemplate.fields || []);

      setActiveTemplate(loadedTemplate);
      setFlexLayoutConfigState(resolvedFlex);

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
  }, []);

  /**
   * Start editing a template:
   * 1. Takes snapshot of existing docked tabs
   * 2. Sets editingTemplateId
   * 3. Loads template & fields & layout
   * 4. Focuses Inspector and Properties tabs in right sidebar, and Builder in bottom panel
   */
  const startEditing = useCallback(
    async (templateId: number) => {
      const rawId = Math.abs(templateId);
      if (!rawId || rawId === 999) return;

      // 1. Snapshot current tab setup if not already in editing mode
      if (getTabSnapshot && !tabSnapshotRef.current) {
        const snapshot = getTabSnapshot();
        tabSnapshotRef.current = snapshot;
      }

      setEditingTemplateId(rawId);
      setFieldSearchQuery('');
      setFilterFieldTypes([]);
      setSuccessMsg(null);
      setCanvasMode('edit');

      // 2. Open left panel with Content (Hierarchy)
      if (onOpenPrimaryPanel) {
        onOpenPrimaryPanel(['template_hierarchy'], 'template_hierarchy');
      }

      // 3. Open right panel with Template Inspector
      if (onOpenSecondaryPanel) {
        onOpenSecondaryPanel(['template_editor'], 'template_editor');
      }

      // 4. Open bottom panel with Builder (Layout & Components tabs)
      if (onOpenBottomPanel) {
        onOpenBottomPanel('template_builder');
      }

      // 5. Load the template
      await loadTemplate(rawId);
    },
    [getTabSnapshot, loadTemplate, onOpenPrimaryPanel, onOpenSecondaryPanel, onOpenBottomPanel]
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
    setError(null);
    setSuccessMsg(null);
  }, [onRestoreTabs]);

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

  // ==========================================================================
  // FLEXBOX LAYOUT ENGINE STATE & MUTATIONS
  // ==========================================================================

  const selectedNode =
    flexLayoutConfig?.root && selectedNodeId
      ? findFlexNode(flexLayoutConfig.root, selectedNodeId)
      : null;

  const selectedContainer: FlexContainerNode | null =
    selectedNode?.nodeType === 'container'
      ? selectedNode
      : selectedNode?.nodeType === 'component' && flexLayoutConfig?.root && selectedNodeId
      ? findParentFlexContainer(flexLayoutConfig.root, selectedNodeId)
      : flexLayoutConfig?.root || null;

  const selectedComponent: FlexComponentNode | null =
    selectedNode?.nodeType === 'component' ? selectedNode : null;

  const activeContainerId: string =
    selectedContainer?.id || flexLayoutConfig?.root?.id || 'root-container';

  const placedFieldIds: number[] = flexLayoutConfig?.root
    ? collectPlacedFieldIds(flexLayoutConfig.root)
    : [];

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  }, []);

  const addFlexContainer = useCallback(
    (targetContainerId: string, options: Partial<FlexContainerNode> = {}): string => {
      if (!flexLayoutConfig) return '';
      const root = flexLayoutConfig.root;
      const parentNode = findFlexNode(root, targetContainerId);
      const parentContainer = parentNode?.nodeType === 'container' ? parentNode : root;
      const newContainer = buildContainer(
        options,
        'Container Box',
        defaultChildDirection(parentContainer, parentContainer.id === root.id)
      );
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: insertChild(root, targetContainerId, newContainer) });
      setSelectedNodeId(newContainer.id);
      return newContainer.id;
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const insertFlexContainerSibling = useCallback(
    (
      targetContainerId: string,
      position: 'before' | 'after',
      options: Partial<FlexContainerNode> = {}
    ): string => {
      if (!flexLayoutConfig) return '';

      // Root Body has no siblings; if target is root, we only support 'after' which appends to root children
      if (targetContainerId === flexLayoutConfig.root.id) {
        if (position === 'after') {
          return addFlexContainer(flexLayoutConfig.root.id, {
            label: options.label || 'New Container',
            ...options,
          });
        }
        return '';
      }

      const parent = findParentFlexContainer(flexLayoutConfig.root, targetContainerId);
      if (!parent) return '';

      const newContainer = buildContainer(
        options,
        'New Container',
        defaultChildDirection(parent, parent.id === flexLayoutConfig.root.id)
      );
      const nextRoot = insertSibling(flexLayoutConfig.root, parent.id, targetContainerId, position, newContainer);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
      setSelectedNodeId(newContainer.id);
      return newContainer.id;
    },
    [flexLayoutConfig, saveFlexLayoutConfig, addFlexContainer]
  );

  const addFlexPrimitive = useCallback(
    (
      primitiveType: 'row' | 'column' | 'split-2' | 'split-3' | 'card',
      targetContainerId?: string
    ) => {
      const target = targetContainerId || activeContainerId;
      if (primitiveType === 'row') {
        return addFlexContainer(target, {
          label: 'Row Container',
          direction: 'row',
          gap: 0,
          wrap: true,
          isCard: false,
          padding: 0,
        });
      }
      if (primitiveType === 'column') {
        return addFlexContainer(target, {
          label: 'Column Container',
          direction: 'column',
          gap: 0,
          wrap: false,
          isCard: false,
          padding: 0,
        });
      }
      if (primitiveType === 'card') {
        return addFlexContainer(target, {
          label: 'Card Frame',
          direction: 'column',
          gap: 0,
          wrap: false,
          isCard: true,
          padding: 0,
        });
      }
      if (primitiveType === 'split-2') {
        const splitId = Date.now();
        const leftCol: FlexContainerNode = {
          id: `cont-left-${splitId}`,
          nodeType: 'container',
          label: 'Left Column',
          direction: 'column',
          gap: 0,
          wrap: false,
          align: 'stretch',
          justify: 'start',
          padding: 0,
          sizing: { type: 'fixed', value: '50%' },
          isCard: true,
          children: [],
        };
        const rightCol: FlexContainerNode = {
          id: `cont-right-${splitId}`,
          nodeType: 'container',
          label: 'Right Column',
          direction: 'column',
          gap: 0,
          wrap: false,
          align: 'stretch',
          justify: 'start',
          padding: 0,
          sizing: { type: 'fixed', value: '50%' },
          isCard: true,
          children: [],
        };
        return addFlexContainer(target, {
          label: '2-Col Split',
          direction: 'row',
          gap: 0,
          wrap: false,
          align: 'stretch',
          justify: 'between',
          padding: 0,
          isCard: false,
          children: [leftCol, rightCol],
        });
      }
      if (primitiveType === 'split-3') {
        const splitId = Date.now();
        const makeCol = (num: number, label: string): FlexContainerNode => ({
          id: `cont-col${num}-${splitId}`,
          nodeType: 'container',
          label,
          direction: 'column',
          gap: 0,
          wrap: false,
          align: 'stretch',
          justify: 'start',
          padding: 0,
          sizing: { type: 'fixed', value: '33.333%' },
          isCard: true,
          children: [],
        });
        return addFlexContainer(target, {
          label: '3-Col Split',
          direction: 'row',
          gap: 0,
          wrap: false,
          align: 'stretch',
          justify: 'between',
          padding: 0,
          isCard: false,
          children: [makeCol(1, 'Column 1'), makeCol(2, 'Column 2'), makeCol(3, 'Column 3')],
        });
      }
      return '';
    },
    [activeContainerId, addFlexContainer]
  );

  const splitFlexContainer = useCallback(
    (targetContainerId: string, splitType: 'columns' | 'rows'): string => {
      if (!flexLayoutConfig) return '';
      const result = splitContainer(flexLayoutConfig.root, targetContainerId, splitType);
      if (!result) return '';
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: result.root });
      // The container that was split stays selected, not the new half
      setSelectedNodeId(targetContainerId);
      return result.newId;
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const updateFlexContainer = useCallback(
    (containerId: string, partial: Partial<FlexContainerNode>) => {
      if (!flexLayoutConfig) return;
      saveFlexLayoutConfig({
        ...flexLayoutConfig,
        root: updateContainer(flexLayoutConfig.root, containerId, partial),
      });
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const removeFlexContainer = useCallback(
    (containerId: string) => {
      if (!flexLayoutConfig || containerId === flexLayoutConfig.root.id) return;
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: removeNode(flexLayoutConfig.root, containerId) });
      if (selectedNodeId === containerId) {
        setSelectedNodeId(flexLayoutConfig.root.id);
      }
    },
    [flexLayoutConfig, selectedNodeId, saveFlexLayoutConfig]
  );

  const addFlexComponent = useCallback(
    (
      targetContainerId: string,
      options: Omit<FlexComponentNode, 'id' | 'nodeType'>
    ): string => {
      if (!flexLayoutConfig) return '';
      const newComponent: FlexComponentNode = {
        ...options,
        id: newNodeId('comp'),
        nodeType: 'component',
      };
      saveFlexLayoutConfig({
        ...flexLayoutConfig,
        root: insertChild(flexLayoutConfig.root, targetContainerId, newComponent),
      });
      setSelectedNodeId(newComponent.id);
      return newComponent.id;
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const updateFlexComponent = useCallback(
    (componentId: string, partial: Partial<FlexComponentNode>) => {
      if (!flexLayoutConfig) return;
      saveFlexLayoutConfig({
        ...flexLayoutConfig,
        root: updateComponent(flexLayoutConfig.root, componentId, partial),
      });
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const removeFlexComponent = useCallback(
    (componentId: string) => {
      if (!flexLayoutConfig) return;
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: removeNode(flexLayoutConfig.root, componentId) });
      if (selectedNodeId === componentId) {
        setSelectedNodeId(null);
      }
    },
    [flexLayoutConfig, selectedNodeId, saveFlexLayoutConfig]
  );

  const placeField = useCallback(
    (fieldId: number, targetContainerId?: string) => {
      const fieldDef = activeTemplate?.fields?.find((f) => f.id === fieldId);
      if (!fieldDef) return;
      const target = targetContainerId || activeContainerId;
      addFlexComponent(target, {
        componentType: 'field',
        field_id: fieldId,
        label: fieldDef.label,
        variant: 'standard',
        sizing: { type: 'fixed', value: '48%' },
      });
    },
    [activeTemplate, activeContainerId, addFlexComponent]
  );

  const resetFlexLayoutToDefault = useCallback(() => {
    if (!activeTemplate) return;
    const defaultFlex = createDefaultFlexLayout(activeTemplate.fields || []);
    saveFlexLayoutConfig(defaultFlex);
    setSelectedNodeId(defaultFlex.root.children[0]?.id || defaultFlex.root.id);
  }, [activeTemplate, saveFlexLayoutConfig]);

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
    toggleFieldTypeFilter,
    clearFieldTypeFilters,
    isLoading,
    isSaving,
    error,
    successMsg,
    setFieldSearchQuery,
    setFilterFieldTypes,
    setSelectedFieldId: (id: number | null) => {
      setSelectedFieldId(id);
      setIsRootSelected(id === null);
    },
    selectRoot: () => {
      setSelectedFieldId(null);
      setIsRootSelected(true);
    },
    clearMessages: () => {
      setError(null);
      setSuccessMsg(null);
    },
    startEditing,
    stopEditing,
    loadTemplate,
    updateTemplateMetadata,
    addField,
    updateField,
    deleteField,
    reorderFields,
    // Modern Flexbox Layout Engine APIs
    flexLayoutConfig,
    selectedNodeId,
    selectedNode,
    selectedContainer,
    selectedComponent,
    activeContainerId,
    placedFieldIds,
    selectNode,
    addFlexContainer,
    insertFlexContainerSibling,
    addFlexPrimitive,
    splitFlexContainer,
    updateFlexContainer,
    removeFlexContainer,
    addFlexComponent,
    updateFlexComponent,
    removeFlexComponent,
    placeField,
    resetFlexLayoutToDefault,
    canvasMode,
    setCanvasMode,
    toggleCanvasMode,
  };
}

