'use client';

import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

/** The collapsible sections of a container / Body / content flyout's Actions tab. */
export type ActionSectionId = 'select' | 'addContainer' | 'addContent' | 'split';

/** Everything starts collapsed, to its heading. Module-level, so useLocalStorage's default stays one object. */
const DEFAULT_ACTION_SECTIONS: Record<ActionSectionId, boolean> = {
  select: false,
  addContainer: false,
  addContent: false,
  split: false,
};

/**
 * Which Actions sections are open: one setting per section shared by every flyout (collapse Split Container
 * once and it stays collapsed in every container's menu), remembered across sessions. useLocalStorage keeps
 * every open menu in the same tab in step.
 */
export function useActionSections() {
  const [open, setOpen] = useLocalStorage('uc_action_sections', DEFAULT_ACTION_SECTIONS);
  const isOpen = useCallback((id: ActionSectionId) => open[id] ?? false, [open]);
  const toggle = useCallback(
    (id: ActionSectionId) => setOpen((current) => ({ ...DEFAULT_ACTION_SECTIONS, ...current, [id]: !(current[id] ?? false) })),
    [setOpen]
  );
  return { isOpen, toggle };
}
