'use client';

import { useCallback, useState } from 'react';
import { ItemTemplate } from '@/types/template';
import {
  TemplateFlexLayoutConfig,
  FlexContainerNode,
  FlexComponentNode,
  createDefaultFlexLayout,
  findFlexNode,
  defaultChildDirection,
  findParentFlexContainer,
  collectPlacedFieldIds,
} from '@/types/layout';
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

interface UseTemplateLayoutTreeOptions {
  flexLayoutConfig: TemplateFlexLayoutConfig | null;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  /** Sets the layout (local state) and schedules its localStorage + debounced remote save. */
  saveFlexLayoutConfig: (nextFlex: TemplateFlexLayoutConfig) => void;
  activeTemplate: ItemTemplate | null;
}

/**
 * The flex layout tree's selection and CRUD (add/insert/split/update/remove containers and
 * components, plus placing a field). Split out of `useTemplateEditor` so the tree-editing logic
 * lives on its own; it operates entirely on the layout state that hook owns and passes in, the
 * same way `useHierarchyState` takes the editor's return value as its argument.
 */
export function useTemplateLayoutTree({
  flexLayoutConfig,
  selectedNodeId,
  setSelectedNodeId,
  saveFlexLayoutConfig,
  activeTemplate,
}: UseTemplateLayoutTreeOptions) {
  // The selected node itself, resolved from its id every render (never cached, since the tree
  // reference changes on every edit).
  const selectedNode =
    flexLayoutConfig?.root && selectedNodeId
      ? findFlexNode(flexLayoutConfig.root, selectedNodeId)
      : null;

  // The container tools (toolbar, resize handles) always act on a container: when a component is
  // selected, that's its parent; with nothing selected, it's the root Body.
  const selectedContainer: FlexContainerNode | null =
    selectedNode?.nodeType === 'container'
      ? selectedNode
      : selectedNode?.nodeType === 'component' && flexLayoutConfig?.root && selectedNodeId
      ? findParentFlexContainer(flexLayoutConfig.root, selectedNodeId)
      : flexLayoutConfig?.root || null;

  const selectedComponent: FlexComponentNode | null =
    selectedNode?.nodeType === 'component' ? selectedNode : null;

  // Where new containers/components/fields land when no explicit target is given (e.g. the
  // palette's "Add" buttons, placeField without a drop target).
  const activeContainerId: string =
    selectedContainer?.id || flexLayoutConfig?.root?.id || 'root-container';

  const placedFieldIds: number[] = flexLayoutConfig?.root
    ? collectPlacedFieldIds(flexLayoutConfig.root)
    : [];

  const selectNode = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
    },
    [setSelectedNodeId]
  );

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
    [flexLayoutConfig, saveFlexLayoutConfig, setSelectedNodeId]
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
    [flexLayoutConfig, saveFlexLayoutConfig, addFlexContainer, setSelectedNodeId]
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
    (targetContainerId: string, splitType: 'columns' | 'rows', measuredPx: number): string => {
      if (!flexLayoutConfig) return '';
      const result = splitContainer(flexLayoutConfig.root, targetContainerId, splitType, measuredPx);
      if (!result) return '';
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: result.root });
      // The container that was split stays selected, not the new half
      setSelectedNodeId(targetContainerId);
      return result.newId;
    },
    [flexLayoutConfig, saveFlexLayoutConfig, setSelectedNodeId]
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
      const parent = findParentFlexContainer(flexLayoutConfig.root, containerId);
      saveFlexLayoutConfig({ ...flexLayoutConfig, root: removeNode(flexLayoutConfig.root, containerId) });
      if (selectedNodeId === containerId) {
        // Prefer the previous sibling (what you'd land on next in the tree), then the next one,
        // falling back to the parent container, and only to the Body if the parent couldn't be found.
        if (parent) {
          const childIndex = parent.children.findIndex((child) => child.id === containerId);
          const sibling = parent.children[childIndex - 1] ?? parent.children[childIndex + 1];
          setSelectedNodeId(sibling ? sibling.id : parent.id);
        } else {
          setSelectedNodeId(flexLayoutConfig.root.id);
        }
      }
    },
    [flexLayoutConfig, selectedNodeId, saveFlexLayoutConfig, setSelectedNodeId]
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
    [flexLayoutConfig, saveFlexLayoutConfig, setSelectedNodeId]
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
    [flexLayoutConfig, selectedNodeId, saveFlexLayoutConfig, setSelectedNodeId]
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
  }, [activeTemplate, saveFlexLayoutConfig, setSelectedNodeId]);

  // Which containers currently have children that don't fit their own row at their set widths
  // (wrapped onto a second line, or overflowed with wrap off) -- reported by FlexContainerRenderer,
  // which is the only thing that can actually measure it (it depends on the live rendered size,
  // not anything derivable from the layout tree data alone). Read by the Structure tree for its
  // warning badge, and by the container itself for its dashed-red border.
  const [overflowingContainerIds, setOverflowingContainerIds] = useState<Set<string>>(new Set());
  const reportContainerOverflow = useCallback((containerId: string, isOverflowing: boolean) => {
    setOverflowingContainerIds((prev) => {
      const wasOverflowing = prev.has(containerId);
      if (wasOverflowing === isOverflowing) return prev;
      const next = new Set(prev);
      if (isOverflowing) next.add(containerId);
      else next.delete(containerId);
      return next;
    });
  }, []);

  return {
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
    overflowingContainerIds,
    reportContainerOverflow,
  };
}
