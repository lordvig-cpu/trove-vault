'use client';

import { createContext, useContext } from 'react';

export const ExplorerPanelContext = createContext<{ isPinned: boolean; isFlyout: boolean } | null>(null);
export const useExplorerPanel = () => useContext(ExplorerPanelContext);
