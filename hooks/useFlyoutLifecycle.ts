'use client';

import { usePresence } from './usePresence';

export function useFlyoutLifecycle(isOpen: boolean, isPinned: boolean, animationsEnabled: boolean, variant: 'flyout' | 'sidebar') {
  return usePresence(variant === 'flyout' && isOpen, 300, animationsEnabled && !isPinned);
}
