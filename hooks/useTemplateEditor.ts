'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchTemplate, saveTemplateLayout, updateTemplateMetadata as saveTemplateMetadata } from '@/lib/data/templates';
import { createTemplateField, deleteTemplateField, reorderTemplateFields, updateTemplateField } from '@/lib/data/templateFields';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition, FieldType } from '@/types/field';
import { TemplateFlexLayoutConfig, isFlexLayoutConfig, createDefaultFlexLayout } from '@/types/layout';
import { DockContent } from '@/hooks/usePanelDockDrag';
import { errorMessage } from '@/lib/errors';
import { useTemplateLayoutTree } from '@/hooks/useTemplateLayoutTree';

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

  // The flex layout tree's selection and CRUD (add/insert/split/update/remove/place) lives in its
  // own hook; it operates on the layout state owned here and persisted via saveFlexLayoutConfig.
  const layoutTree = useTemplateLayoutTree({
    flexLayoutConfig,
    selectedNodeId,
    setSelectedNodeId,
    saveFlexLayoutConfig,
    activeTemplate,
  });

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
    ...layoutTree,
    canvasMode,
    setCanvasMode,
    toggleCanvasMode,
  };
}

