'use client';

import { useState, useMemo, useCallback } from 'react';
import { getAllContainerIds, countElements } from '@/components/TemplateHierarchyTree';
import type { useTemplateEditor } from '@/hooks/useTemplateEditor';
import { findAncestorContainerIds, type FlexContainerNode } from '@/types/layout';

/* ==========================================================================
   Structure tree state for the template editor: which containers are expanded, and the helpers
   that keep the tree in step with the canvas (opening a container when something is added to it,
   selecting a node). Moved out of app/page.tsx without changing behavior.
   ========================================================================== */

type TemplateEditor = ReturnType<typeof useTemplateEditor>;

export function useHierarchyState(templateEditor: TemplateEditor) {
  const [hierarchyExpandedIds, setHierarchyExpandedIds] = useState<Set<string>>(
    () => new Set(['root-container'])
  );

  // Whatever gets selected (canvas click, gear sync, undo/redo, initial load) must be visible in
  // the tree. Keyed on the ancestor *path*, not just the selected id: an action like Split keeps
  // the target container's id but re-parents it under a new wrapper, so the id alone wouldn't
  // change. Detected during render, same as SizeField's draft re-sync in
  // TemplateContainerSizing.tsx, rather than an effect — expands its ancestors without touching
  // sibling branches the user already collapsed.
  const selectedNodeId = templateEditor.selectedNodeId;
  const root = templateEditor.flexLayoutConfig?.root;

  // Start a fresh editing session fully expanded (matches useTreeCategories' initialExpanded for
  // the Items/Collections trees), rather than only the ancestors of whatever got auto-selected.
  // editingTemplateId is set before the template's layout finishes loading, so this waits for
  // `root` to actually arrive before expanding, and does it once per session (not on every edit).
  const editingTemplateId = templateEditor.editingTemplateId;
  const [expandedInitForId, setExpandedInitForId] = useState<number | null>(null);
  if (editingTemplateId !== expandedInitForId) {
    if (editingTemplateId !== null && root) {
      setExpandedInitForId(editingTemplateId);
      setHierarchyExpandedIds(new Set(getAllContainerIds(root)));
    } else if (editingTemplateId === null) {
      setExpandedInitForId(null);
    }
  }

  const ancestorIds = useMemo(
    () => (selectedNodeId && root ? findAncestorContainerIds(root, selectedNodeId) : []),
    [selectedNodeId, root]
  );
  const ancestorPathKey = ancestorIds.join('>');
  const [prevAncestorPathKey, setPrevAncestorPathKey] = useState(ancestorPathKey);
  if (ancestorPathKey !== prevAncestorPathKey) {
    setPrevAncestorPathKey(ancestorPathKey);
    if (ancestorIds.length > 0) {
      setHierarchyExpandedIds((prev) => {
        if (ancestorIds.every((id) => prev.has(id))) return prev;
        const next = new Set(prev);
        ancestorIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

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

  const handlePlaceField = useCallback((fieldId: number, targetContainerId?: string) => {
    templateEditor.placeField(fieldId, targetContainerId);
    if (targetContainerId) {
      setHierarchyExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(targetContainerId);
        return next;
      });
    }
  }, [templateEditor]);

  const handlePlaceLoremIpsum = useCallback((targetContainerId?: string) => {
    templateEditor.placeLoremIpsum(targetContainerId);
    if (targetContainerId) {
      setHierarchyExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(targetContainerId);
        return next;
      });
    }
  }, [templateEditor]);

  const handleAddContainer = useCallback(
    (targetContainerId: string, options?: Partial<FlexContainerNode>) => {
      const newId = templateEditor.addFlexContainer(targetContainerId, options);
      if (targetContainerId) {
        setHierarchyExpandedIds((prev) => {
          const next = new Set(prev);
          next.add(targetContainerId);
          return next;
        });
      }
      return newId;
    },
    [templateEditor]
  );

  return {
    hierarchyExpandedIds,
    hierarchyNodeCount,
    isAllHierarchyExpanded,
    toggleAllHierarchy,
    toggleHierarchyExpand,
    handleOpenProperties,
    handlePlaceField,
    handlePlaceLoremIpsum,
    handleAddContainer,
  };
}
