'use client';

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ItemTemplate } from '@/types/template';
import { FieldDefinition, FieldType } from '@/types/field';
import { TemplateLayoutConfig, LayoutSection, LayoutBlock } from '@/types/layout';
import { DockContent } from '@/hooks/usePanelDockDrag';

export interface WorkspaceTabSnapshot {
  primaryTabs: DockContent[];
  primaryActiveTab: DockContent;
  secondaryTabs: DockContent[];
  secondaryActiveTab: DockContent;
  isPrimarySidePanelOpen: boolean;
  isSecondaryOpen: boolean;
  isPinned: boolean;
  isSecondaryPinned: boolean;
  bottomPanelContent: 'empty' | 'grabbed_content';
  isBottomPanelOpen: boolean;
  isBottomPinned: boolean;
}

interface UseTemplateEditorOptions {
  onRefreshData?: () => Promise<void> | void;
  getTabSnapshot?: () => WorkspaceTabSnapshot;
  onRestoreTabs?: (snapshot: WorkspaceTabSnapshot) => void;
  onOpenSecondaryPanel?: (tabs: DockContent[], activeTab: DockContent) => void;
}

export function createDefaultLayout(fields: FieldDefinition[]): TemplateLayoutConfig {
  const blocks: LayoutBlock[] = fields.map((f) => ({
    id: `block-${f.id}`,
    type: 'field',
    field_id: f.id,
    label: f.label,
    col_span: 6,
    row_span: 1,
    variant: 'standard',
  }));

  return {
    version: 1,
    sections: [
      {
        id: 'sec-general',
        title: 'General Information',
        columns: 12,
        blocks,
      },
    ],
  };
}

export function useTemplateEditor({
  onRefreshData,
  getTabSnapshot,
  onRestoreTabs,
  onOpenSecondaryPanel,
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

  // Layout Engine States
  const [layoutConfig, setLayoutConfigState] = useState<TemplateLayoutConfig | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
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
   * Save layout configuration to state, localStorage, and attempt remote save
   */
  const saveLayoutConfig = useCallback(
    async (nextLayout: TemplateLayoutConfig) => {
      setLayoutConfigState(nextLayout);
      if (editingTemplateId) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              `trovevault_template_layout_${editingTemplateId}`,
              JSON.stringify(nextLayout)
            );
          } catch (e) {
            console.warn('Could not cache layout in localStorage:', e);
          }
        }

        // Attempt remote save in Supabase if column is available
        try {
          await supabase
            .from('item_templates')
            .update({ layout_config: nextLayout } as any)
            .eq('id', editingTemplateId);
        } catch {
          // Non-fatal if column does not yet exist
        }
      }
    },
    [editingTemplateId]
  );

  /**
   * Fetch full template data (including fields and layout) for a given template ID
   */
  const loadTemplate = useCallback(async (templateId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const [{ data: tmplData, error: tmplErr }, { data: fieldsData, error: fieldsErr }] =
        await Promise.all([
          supabase.from('item_templates').select('*').eq('id', templateId).single(),
          supabase
            .from('item_template_fields')
            .select('*')
            .eq('template_id', templateId)
            .order('display_order', { ascending: true }),
        ]);

      if (tmplErr) throw tmplErr;
      if (fieldsErr) throw fieldsErr;

      const loadedTemplate: ItemTemplate = {
        ...tmplData,
        fields: (fieldsData || []).map((f) => ({
          ...f,
          options: Array.isArray(f.options) ? f.options : null,
        })),
      };

      // Resolve Layout: Check localStorage -> tmplData.layout_config -> generate default
      let resolvedLayout: TemplateLayoutConfig | null = null;
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`trovevault_template_layout_${templateId}`);
          if (cached) resolvedLayout = JSON.parse(cached);
        } catch {
          // Ignore
        }
      }

      if (!resolvedLayout && tmplData.layout_config) {
        resolvedLayout = tmplData.layout_config;
      }

      if (!resolvedLayout) {
        resolvedLayout = createDefaultLayout(loadedTemplate.fields || []);
      }

      setActiveTemplate(loadedTemplate);
      setLayoutConfigState(resolvedLayout);

      // Select first field if available
      if (loadedTemplate.fields && loadedTemplate.fields.length > 0) {
        setSelectedFieldId(loadedTemplate.fields[0].id);
        setIsRootSelected(false);
      } else {
        setSelectedFieldId(null);
        setIsRootSelected(true);
      }

      return loadedTemplate;
    } catch (err: any) {
      console.error('Failed to load template:', err);
      setError(err?.message || 'Failed to load template details');
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
   * 4. Focuses both Inspector and Builder tabs in right sidebar
   */
  const startEditing = useCallback(
    async (templateId: number) => {
      // 1. Snapshot current tab setup if not already in editing mode
      if (getTabSnapshot && !tabSnapshotRef.current) {
        const snapshot = getTabSnapshot();
        tabSnapshotRef.current = snapshot;
      }

      setEditingTemplateId(templateId);
      setFieldSearchQuery('');
      setFilterFieldTypes([]);
      setSuccessMsg(null);
      setCanvasMode('edit');

      // 2. Open right panel with both template_editor and template_builder docked!
      if (onOpenSecondaryPanel) {
        onOpenSecondaryPanel(['template_editor', 'template_builder'], 'template_builder');
      }

      // 3. Load the template
      await loadTemplate(templateId);
    },
    [getTabSnapshot, loadTemplate, onOpenSecondaryPanel]
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

        setActiveTemplate((prev) => (prev ? { ...prev, ...data } : null));
        setSuccessMsg('Template metadata updated');
        if (onRefreshData) await onRefreshData();
      } catch (err: any) {
        console.error('Failed to update template metadata:', err);
        setError(err?.message || 'Failed to update template');
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

        const formattedField: FieldDefinition = {
          ...createdField,
          options: Array.isArray(createdField.options) ? createdField.options : null,
        };

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
      } catch (err: any) {
        console.error('Failed to add field:', err);
        setError(err?.message || 'Failed to add field');
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

        const updatePayload: any = {};
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

        const formattedUpdated: FieldDefinition = {
          ...updated,
          options: Array.isArray(updated.options) ? updated.options : null,
        };

        setActiveTemplate((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            fields: (prev.fields || []).map((f) => (f.id === fieldId ? formattedUpdated : f)),
          };
        });

        setSuccessMsg('Field updated');
        if (onRefreshData) await onRefreshData();
      } catch (err: any) {
        console.error('Failed to update field:', err);
        setError(err?.message || 'Failed to update field');
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
      } catch (err: any) {
        console.error('Failed to delete field:', err);
        setError(err?.message || 'Failed to delete field');
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
      } catch (err: any) {
        console.error('Failed to reorder fields:', err);
        setError(err?.message || 'Failed to save field order');
        await loadTemplate(editingTemplateId);
      } finally {
        setIsSaving(false);
      }
    },
    [editingTemplateId, activeTemplate, onRefreshData, loadTemplate]
  );

  /* ------------------------------------------------------------------------
     LAYOUT ENGINE MUTATIONS
     ------------------------------------------------------------------------ */

  const addSection = useCallback(
    (title: string = 'New Section') => {
      const newSec: LayoutSection = {
        id: `sec-${Date.now()}`,
        title,
        columns: 12,
        blocks: [],
      };
      const nextLayout: TemplateLayoutConfig = {
        version: 1,
        sections: [...(layoutConfig?.sections || []), newSec],
      };
      saveLayoutConfig(nextLayout);
    },
    [layoutConfig, saveLayoutConfig]
  );

  const removeSection = useCallback(
    (sectionId: string) => {
      if (!layoutConfig) return;
      const nextSections = layoutConfig.sections.filter((s) => s.id !== sectionId);
      saveLayoutConfig({ ...layoutConfig, sections: nextSections });
    },
    [layoutConfig, saveLayoutConfig]
  );

  const updateSection = useCallback(
    (sectionId: string, partial: Partial<LayoutSection>) => {
      if (!layoutConfig) return;
      const nextSections = layoutConfig.sections.map((s) =>
        s.id === sectionId ? { ...s, ...partial } : s
      );
      saveLayoutConfig({ ...layoutConfig, sections: nextSections });
    },
    [layoutConfig, saveLayoutConfig]
  );

  const reorderSections = useCallback(
    (orderedIds: string[]) => {
      if (!layoutConfig) return;
      const secMap = new Map(layoutConfig.sections.map((s) => [s.id, s]));
      const nextSections = orderedIds.map((id) => secMap.get(id)).filter(Boolean) as LayoutSection[];
      saveLayoutConfig({ ...layoutConfig, sections: nextSections });
    },
    [layoutConfig, saveLayoutConfig]
  );

  const addBlock = useCallback(
    (sectionId: string, block: Omit<LayoutBlock, 'id'>) => {
      if (!layoutConfig) return;
      const newBlock: LayoutBlock = {
        ...block,
        id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      const nextSections = layoutConfig.sections.map((sec) => {
        if (sec.id === sectionId) {
          return { ...sec, blocks: [...sec.blocks, newBlock] };
        }
        return sec;
      });
      saveLayoutConfig({ ...layoutConfig, sections: nextSections });
      setSelectedBlockId(newBlock.id);
    },
    [layoutConfig, saveLayoutConfig]
  );

  const updateBlock = useCallback(
    (sectionId: string, blockId: string, partial: Partial<LayoutBlock>) => {
      if (!layoutConfig) return;
      const nextSections = layoutConfig.sections.map((sec) => {
        if (sec.id === sectionId) {
          const nextBlocks = sec.blocks.map((b) => (b.id === blockId ? { ...b, ...partial } : b));
          return { ...sec, blocks: nextBlocks };
        }
        return sec;
      });
      saveLayoutConfig({ ...layoutConfig, sections: nextSections });
    },
    [layoutConfig, saveLayoutConfig]
  );

  const removeBlock = useCallback(
    (sectionId: string, blockId: string) => {
      if (!layoutConfig) return;
      const nextSections = layoutConfig.sections.map((sec) => {
        if (sec.id === sectionId) {
          return { ...sec, blocks: sec.blocks.filter((b) => b.id !== blockId) };
        }
        return sec;
      });
      saveLayoutConfig({ ...layoutConfig, sections: nextSections });
      if (selectedBlockId === blockId) {
        setSelectedBlockId(null);
      }
    },
    [layoutConfig, selectedBlockId, saveLayoutConfig]
  );

  const moveBlock = useCallback(
    (fromSectionId: string, toSectionId: string, blockId: string, toIndex?: number) => {
      if (!layoutConfig) return;
      let targetBlock: LayoutBlock | undefined;
      // Extract block
      const sectionsAfterExtract = layoutConfig.sections.map((sec) => {
        if (sec.id === fromSectionId) {
          targetBlock = sec.blocks.find((b) => b.id === blockId);
          return { ...sec, blocks: sec.blocks.filter((b) => b.id !== blockId) };
        }
        return sec;
      });

      if (!targetBlock) return;

      // Insert into destination
      const nextSections = sectionsAfterExtract.map((sec) => {
        if (sec.id === toSectionId) {
          const list = [...sec.blocks];
          if (typeof toIndex === 'number') {
            list.splice(toIndex, 0, targetBlock!);
          } else {
            list.push(targetBlock!);
          }
          return { ...sec, blocks: list };
        }
        return sec;
      });

      saveLayoutConfig({ ...layoutConfig, sections: nextSections });
    },
    [layoutConfig, saveLayoutConfig]
  );

  const resetLayoutToDefault = useCallback(() => {
    if (!activeTemplate) return;
    const defaultLayout = createDefaultLayout(activeTemplate.fields || []);
    saveLayoutConfig(defaultLayout);
  }, [activeTemplate, saveLayoutConfig]);

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
    tabSnapshot: tabSnapshotRef.current,
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
    // Layout Engine APIs
    layoutConfig,
    selectedBlockId,
    setSelectedBlockId,
    canvasMode,
    setCanvasMode,
    toggleCanvasMode,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    resetLayoutToDefault,
  };
}

