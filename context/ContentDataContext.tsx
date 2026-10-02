'use client';

import { createContext, useContext } from 'react';
import type { ContentData } from '@/lib/layoutContent';

/**
 * The data a layout is drawn with: the item whose values content elements show (and the names of its
 * collections). The template editor provides a sample item from the template's own items for its
 * canvas and preview; the item view will provide the item being viewed. With no provider, or no item,
 * content shows stand-in sample values.
 */
const ContentDataContext = createContext<ContentData>({});

export const ContentDataProvider = ContentDataContext.Provider;

export function useContentData(): ContentData {
  return useContext(ContentDataContext);
}
