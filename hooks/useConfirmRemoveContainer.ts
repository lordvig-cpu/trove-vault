'use client';

import { useCallback, useState } from 'react';
import { findFlexNode, type FlexContainerNode } from '@/types/layout';
import type { useTemplateEditor } from '@/hooks/useTemplateEditor';

type TemplateEditor = ReturnType<typeof useTemplateEditor>;

/**
 * Every "delete container" (Layout tree flyout, canvas, toolbar, floating menu) goes through
 * `requestRemoveContainer`: an empty container is deleted at once, one that holds anything waits for
 * `prompt` (DeleteContainerModal) to be confirmed, listing what goes with it.
 */
export function useConfirmRemoveContainer(templateEditor: TemplateEditor) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { flexLayoutConfig, removeFlexContainer, activeTemplate } = templateEditor;

  const requestRemoveContainer = useCallback(
    (containerId: string) => {
      const node = flexLayoutConfig ? findFlexNode(flexLayoutConfig.root, containerId) : null;
      if (node?.nodeType === 'container' && node.children.length > 0) setPendingId(containerId);
      else removeFlexContainer(containerId);
    },
    [flexLayoutConfig, removeFlexContainer]
  );

  const pending = pendingId && flexLayoutConfig ? findFlexNode(flexLayoutConfig.root, pendingId) : null;
  const container = pending?.nodeType === 'container' ? (pending as FlexContainerNode) : null;

  return {
    requestRemoveContainer,
    prompt: container
      ? {
          container,
          fields: activeTemplate?.fields ?? [],
          onConfirm: () => {
            removeFlexContainer(container.id);
            setPendingId(null);
          },
          onCancel: () => setPendingId(null),
        }
      : null,
  };
}
