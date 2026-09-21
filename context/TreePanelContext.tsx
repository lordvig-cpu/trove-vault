'use client';

import { createContext, useContext } from 'react';

export const TreePanelContext = createContext<{ isPinned: boolean; isFlyout: boolean } | null>(null);
export const useTreePanel = () => useContext(TreePanelContext);
