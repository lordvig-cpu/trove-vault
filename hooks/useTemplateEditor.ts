'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition, FieldType } from '@/types/field';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  FlexSizing,
  isFlexLayoutConfig,
  createDefaultFlexLayout,
  findFlexNode,
  defaultChildDirection,
  resolveDirection,
  findParentFlexContainer,
  collectPlacedFieldIds,
  halveCssLength,
  parsePxValue,
} from '@/types/layout';
import { DockContent } from '@/hooks/usePanelDockDrag';
import { errorMessage } from '@/lib/errors';
import { toFieldDefinition, toItemTemplate, toJson } from '@/lib/data/mappers';

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
      const { error } = await supabase
        .from('item_templates')
        .update({ layout_config: toJson(pending.layout) })
        .eq('id', pending.id);
      // Warn once per session so a missing layout_config column is visible, not silent
      if (error && !remoteSaveWarned.current) {
        remoteSaveWarned.current = true;
        console.warn('Template layout was not saved to the database (kept in this browser only):', error.message);
      }
    } catch {
      // Non-fatal: the browser copy is still saved
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

      const [{ data: tmplData, error: tmplErr }, { data: fieldsData, error: fieldsErr }] =
        await Promise.all([
          supabase.from('item_templates').select('*').eq('id', rawId).single(),
          supabase
            .from('item_template_fields')
            .select('*')
            .eq('template_id', rawId)
            .order('display_order', { ascending: true }),
        ]);

      if (tmplErr) throw tmplErr;
      if (fieldsErr) throw fieldsErr;

      const loadedTemplate: ItemTemplate = toItemTemplate(tmplData, (fieldsData || []).map(toFieldDefinition));

      // Resolve Layout: Check localStorage -> tmplData.layout_config -> generate default flex layout
      let rawConfig: unknown = null;
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`trovevault_template_layout_${rawId}`);
          if (cached) rawConfig = JSON.parse(cached);
        } catch {
          // Ignore
        }
      }

      if (!rawConfig && tmplData.layout_config) {
        rawConfig = tmplData.layout_config;
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

        const { data, error: updateErr } = await supabase
          .from('item_templates')
          .update({
            name: name.trim(),
            description: description?.trim() || null,
            icon: icon.trim() || '📦',
          })
          .eq('id', editingTemplateId)
          .select()
          .single();

        if (updateErr) throw updateErr;

        setActiveTemplate((prev) =>
          prev ? { ...prev, name: data.name, description: data.description, icon: data.icon ?? '📦' } : null
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

        const newFieldPayload = {
          template_id: editingTemplateId,
          name: baseName || `field_${Date.now()}`,
          label,
          field_type: initialType,
          options: initialType === 'select' ? ['Option 1', 'Option 2'] : null,
          is_required: false,
          display_order: nextOrder,
        };

        const { data: createdField, error: insertErr } = await supabase
          .from('item_template_fields')
          .insert(newFieldPayload)
          .select()
          .single();

        if (insertErr) throw insertErr;

        const formattedField: FieldDefinition = toFieldDefinition(createdField);

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

        const updatePayload: Partial<Pick<FieldDefinition, 'name' | 'label' | 'field_type' | 'options' | 'is_required' | 'display_order'>> = {};
        if (partial.name !== undefined) updatePayload.name = partial.name;
        if (partial.label !== undefined) updatePayload.label = partial.label;
        if (partial.field_type !== undefined) updatePayload.field_type = partial.field_type;
        if (partial.options !== undefined) updatePayload.options = partial.options;
        if (partial.is_required !== undefined) updatePayload.is_required = partial.is_required;
        if (partial.display_order !== undefined) updatePayload.display_order = partial.display_order;

        const { data: updated, error: updateErr } = await supabase
          .from('item_template_fields')
          .update(updatePayload)
          .eq('id', fieldId)
          .select()
          .single();

        if (updateErr) throw updateErr;

        const formattedUpdated: FieldDefinition = toFieldDefinition(updated);

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

        const { error: deleteErr } = await supabase
          .from('item_template_fields')
          .delete()
          .eq('id', fieldId);

        if (deleteErr) throw deleteErr;

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

        // Update in Supabase
        const updates = orderedFieldIds.map((id, index) =>
          supabase
            .from('item_template_fields')
            .update({ display_order: index + 1 })
            .eq('id', id)
        );

        await Promise.all(updates);
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
      const newId = `cont-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const parentNode = findFlexNode(flexLayoutConfig.root, targetContainerId);
      const parentContainer =
        parentNode?.nodeType === 'container' ? parentNode : flexLayoutConfig.root;
      const newContainer: FlexContainerNode = {
        id: newId,
        nodeType: 'container',
        label: options.label || 'Container Box',
        direction: options.direction || defaultChildDirection(parentContainer, parentContainer.id === flexLayoutConfig.root.id),
        gap: options.gap !== undefined ? options.gap : 0,
        wrap: options.wrap !== undefined ? options.wrap : true,
        align: options.align || 'stretch',
        justify: options.justify || 'start',
        padding: options.padding !== undefined ? options.padding : 0,
        sizing: options.sizing || { type: 'fill' },
        isCard: options.isCard !== undefined ? options.isCard : false,
        children: options.children || [],
      };

      const target = findFlexNode(flexLayoutConfig.root, targetContainerId)
        ? targetContainerId
        : flexLayoutConfig.root.id;

      function insertIntoTarget(node: FlexContainerNode): FlexContainerNode {
        if (node.id === target) {
          return { ...node, children: [...node.children, newContainer] };
        }
        return {
          ...node,
          children: node.children.map((c) =>
            c.nodeType === 'container' ? insertIntoTarget(c) : c
          ),
        };
      }

      const nextRoot = insertIntoTarget(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
      setSelectedNodeId(newId);
      return newId;
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

      const newId = `cont-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newContainer: FlexContainerNode = {
        id: newId,
        nodeType: 'container',
        label: options.label || 'New Container',
        direction: options.direction || defaultChildDirection(parent, parent.id === flexLayoutConfig.root.id),
        gap: options.gap !== undefined ? options.gap : 0,
        wrap: options.wrap !== undefined ? options.wrap : true,
        align: options.align || 'stretch',
        justify: options.justify || 'start',
        padding: options.padding !== undefined ? options.padding : 0,
        sizing: options.sizing || { type: 'fill' },
        isCard: options.isCard !== undefined ? options.isCard : false,
        children: options.children || [],
      };

      function insertSibling(node: FlexContainerNode): FlexContainerNode {
        if (node.id === parent!.id) {
          const targetIndex = node.children.findIndex((c) => c.id === targetContainerId);
          if (targetIndex === -1) return node;
          const nextChildren = [...node.children];
          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          nextChildren.splice(insertIndex, 0, newContainer);
          return { ...node, children: nextChildren };
        }
        return {
          ...node,
          children: node.children.map((c) =>
            c.nodeType === 'container' ? insertSibling(c) : c
          ),
        };
      }

      const nextRoot = insertSibling(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
      setSelectedNodeId(newId);
      return newId;
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
      if (targetContainerId === flexLayoutConfig.root.id) return '';

      const parent = findParentFlexContainer(flexLayoutConfig.root, targetContainerId);
      if (!parent) return '';

      const foundNode = findFlexNode(flexLayoutConfig.root, targetContainerId);
      if (!foundNode || foundNode.nodeType !== 'container') return '';
      const targetContainer: FlexContainerNode = foundNode;


      // Calculate base name by stripping any previous "(X of Y)"
      const rawLabel = targetContainer.label || 'Container';
      const baseName = rawLabel.replace(/\s*\(\d+\s+of\s+\d+\)$/i, '').trim() || 'Container';
      const targetLabel = `${baseName} (1 / 2)`;
      const newContainerLabel = `${baseName} (2 / 2)`;

      const parentDir = parent.direction;
      const targetSizing: FlexSizing = targetContainer.sizing || { type: 'fill' };
      const targetWidthRaw =
        (targetSizing.type === 'fixed' && targetSizing.value) || targetContainer.width || undefined;
      const targetHeightRaw = targetContainer.height || targetSizing.height || undefined;
      const targetHeightPx = /px$/i.test(targetHeightRaw || '') ? parsePxValue(targetHeightRaw) : null;

      // Rows stack children of a column parent; columns sit side by side in a row parent.
      // In any other parent, wrap the two halves in a new container so neither the parent's
      // direction nor its other children are disturbed.
      const inPlace = splitType === 'columns' ? parentDir === 'row' : parentDir === 'column';

      // Height: columns share the target's height; rows split it (px only).
      const halfHeight =
        splitType === 'rows' && targetHeightPx !== null
          ? `${Math.max(0, targetHeightPx / 2)}px`
          : targetHeightRaw;

      // Width / basis of each half
      let halfSizing: FlexSizing;
      if (splitType === 'columns') {
        halfSizing = {
          type: 'fixed',
          value: inPlace ? halveCssLength(targetWidthRaw) : '50%',
        };
      } else {
        halfSizing =
          inPlace && targetSizing.type === 'fixed' && targetSizing.value
            ? { type: 'fixed', value: targetSizing.value }
            : { type: 'fixed', value: '100%' };
      }

      const withDims = (node: FlexContainerNode, sizing: FlexSizing, height?: string): FlexContainerNode => ({
        ...node,
        width: undefined,
        height,
        sizing: { ...sizing, height, minHeight: node.minHeight ?? sizing.minHeight },
      });

      const newId = `cont-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const updatedTarget = withDims(
        { ...targetContainer, label: targetLabel },
        halfSizing,
        halfHeight
      );

      const newContainer = withDims(
        {
          id: newId,
          nodeType: 'container',
          label: newContainerLabel,
          direction: resolveDirection(targetContainer, false),
          gap: targetContainer.gap !== undefined ? targetContainer.gap : 0,
          wrap: targetContainer.wrap !== undefined ? targetContainer.wrap : true,
          align: targetContainer.align || 'stretch',
          justify: targetContainer.justify || 'start',
          padding: targetContainer.padding ?? 0,
          sizing: halfSizing,
          isCard: targetContainer.isCard !== undefined ? targetContainer.isCard : false,
          children: [],
        },
        halfSizing,
        halfHeight
      );

      // Node(s) that replace the target inside its parent
      let replacement: FlexContainerNode[];
      if (inPlace) {
        replacement = [updatedTarget, newContainer];
      } else {
        // The wrapper inherits the target's original footprint inside the parent
        replacement = [
          {
            id: `cont-split-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            nodeType: 'container',
            label: `${baseName} Split`,
            direction: splitType === 'columns' ? 'row' : 'column',
            gap: 0,
            wrap: false,
            align: 'stretch',
            justify: 'start',
            padding: 0,
            sizing: { ...targetSizing },
            width: targetContainer.width,
            height: targetContainer.height,
            isCard: false,
            children: [updatedTarget, newContainer],
          },
        ];
      }

      function transformTree(node: FlexContainerNode): FlexContainerNode {
        if (node.id === parent?.id) {
          const childIdx = node.children.findIndex((c) => c.id === targetContainerId);
          if (childIdx === -1) return node;
          const nextChildren = [...node.children];
          nextChildren.splice(childIdx, 1, ...replacement);
          return { ...node, children: nextChildren };
        }

        return {
          ...node,
          children: node.children.map((c) =>
            c.nodeType === 'container' ? transformTree(c) : c
          ),
        };
      }

      const nextRoot = transformTree(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
      setSelectedNodeId(newId);
      return newId;
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const updateFlexContainer = useCallback(
    (containerId: string, partial: Partial<FlexContainerNode>) => {
      if (!flexLayoutConfig) return;
      function updateInTree(node: FlexContainerNode): FlexContainerNode {
        if (node.id === containerId) {
          return { ...node, ...partial };
        }
        return {
          ...node,
          children: node.children.map((c) =>
            c.nodeType === 'container' ? updateInTree(c) : c
          ),
        };
      }
      const nextRoot = updateInTree(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const removeFlexContainer = useCallback(
    (containerId: string) => {
      if (!flexLayoutConfig || containerId === flexLayoutConfig.root.id) return;
      function removeFromTree(node: FlexContainerNode): FlexContainerNode {
        return {
          ...node,
          children: node.children
            .filter((c) => c.id !== containerId)
            .map((c) => (c.nodeType === 'container' ? removeFromTree(c) : c)),
        };
      }
      const nextRoot = removeFromTree(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
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
      const newId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newComp: FlexComponentNode = {
        ...options,
        id: newId,
        nodeType: 'component',
      };

      const target = findFlexNode(flexLayoutConfig.root, targetContainerId)
        ? targetContainerId
        : flexLayoutConfig.root.id;

      function insertIntoTarget(node: FlexContainerNode): FlexContainerNode {
        if (node.id === target) {
          return { ...node, children: [...node.children, newComp] };
        }
        return {
          ...node,
          children: node.children.map((c) =>
            c.nodeType === 'container' ? insertIntoTarget(c) : c
          ),
        };
      }

      const nextRoot = insertIntoTarget(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
      setSelectedNodeId(newId);
      return newId;
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const updateFlexComponent = useCallback(
    (componentId: string, partial: Partial<FlexComponentNode>) => {
      if (!flexLayoutConfig) return;
      function updateInTree(node: FlexContainerNode): FlexContainerNode {
        return {
          ...node,
          children: node.children.map((c) => {
            if (c.nodeType === 'component') {
              return c.id === componentId ? { ...c, ...partial } : c;
            }
            return updateInTree(c);
          }),
        };
      }
      const nextRoot = updateInTree(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
    },
    [flexLayoutConfig, saveFlexLayoutConfig]
  );

  const removeFlexComponent = useCallback(
    (componentId: string) => {
      if (!flexLayoutConfig) return;
      function removeFromTree(node: FlexContainerNode): FlexContainerNode {
        return {
          ...node,
          children: node.children
            .filter((c) => c.id !== componentId)
            .map((c) => (c.nodeType === 'container' ? removeFromTree(c) : c)),
        };
      }
      const nextRoot = removeFromTree(flexLayoutConfig.root);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: nextRoot });
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

