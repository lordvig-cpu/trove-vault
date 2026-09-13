'use client';

import { useState, useCallback } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';

/* ==========================================================================
   1. TYPE DEFINITIONS
   ========================================================================== */

/**
 * Discriminated union defining all possible modal states and their required payloads.
 *
 * - `template_manager`: Schema/preset manager for a given collection.
 * - `delete_collection`: Confirmation dialog to delete a collection.
 * - `create_item`: Creation dialog for an item (accepts nullable collectionId for standalone items).
 * - `edit_item`: Modification dialog for an existing item record.
 * - `delete_item`: Deletion confirmation dialog for an existing item record.
 * - `null`: All modals are closed.
 */
export type ActiveModal =
  | { type: 'template_manager'; collectionId: number; collectionName: string }
  | { type: 'delete_collection'; collection: CollectionRecord }
  | { type: 'create_item'; collectionId: number | null; parentItemId?: number | null }
  | { type: 'edit_item'; item: ItemRecord; collectionId: number | null }
  | { type: 'delete_item'; item: ItemRecord; collectionId: number | null }
  | null;

/* ==========================================================================
   2. CUSTOM HOOK: useModals
   Centralized modal state manager abstracting dialog toggles and payloads.
   ========================================================================== */

export function useModals() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  /**
   * Resets active modal state to dismiss any open dialog.
   */
  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  /**
   * Opens the Template Manager dialog for managing collection schemas/presets.
   */
  const openTemplateManager = useCallback((collectionId: number, collectionName: string) => {
    setActiveModal({ type: 'template_manager', collectionId, collectionName });
  }, []);

  /**
   * Opens the deletion confirmation dialog for a collection.
   */
  const openDeleteCollection = useCallback((collection: CollectionRecord) => {
    setActiveModal({ type: 'delete_collection', collection });
  }, []);

  /**
   * Opens the creation dialog to add a new item (collectionId can be null for standalone items).
   */
  const openCreateItem = useCallback(
    (collectionId: number | null, parentItemId: number | null = null) => {
      setActiveModal({ type: 'create_item', collectionId, parentItemId });
    },
    []
  );

  /**
   * Opens the editor dialog for an existing item record.
   */
  const openEditItem = useCallback((item: ItemRecord, collectionId: number | null) => {
    setActiveModal({ type: 'edit_item', item, collectionId });
  }, []);

  /**
   * Opens the deletion confirmation dialog for an individual item.
   */
  const openDeleteItem = useCallback((item: ItemRecord, collectionId: number | null) => {
    setActiveModal({ type: 'delete_item', item, collectionId });
  }, []);

  return {
    activeModal,
    setActiveModal,
    closeModal,
    openTemplateManager,
    openDeleteCollection,
    openCreateItem,
    openEditItem,
    openDeleteItem,
  };
}