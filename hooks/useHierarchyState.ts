'use client';

import { useState, useMemo, useCallback } from 'react';
import { getAllContainerIds, countElements } from '@/components/TemplateHierarchyTree';
import type { useTemplateEditor } from '@/hooks/useTemplateEditor';
import type { FlexContainerNode } from '@/types/layout';

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
    handleAddContainer,
  };
}
