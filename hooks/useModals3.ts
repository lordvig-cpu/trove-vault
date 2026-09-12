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
 * Using a discriminated union on `type` guarantees mutual exclusivity—ensuring
 * only one modal dialog can ever be active at a single time and strictly typing
 * the parameters required for each dialog.
 *
 * - `template_manager`: Schema/preset manager for a given collection.
 * - `delete_collection`: Confirmation dialog to delete a collection.
 * - `create_item`: Creation dialog for a new item, optionally nested under a parent.
 * - `edit_item`: Modification dialog for an existing item record.
 * - `delete_item`: Deletion confirmation dialog for an existing item record.
 * - `null`: All modals are closed.
 */
export type ActiveModal =
  | { type: 'template_manager'; collectionId: number; collectionName: string }
  | { type: 'delete_collection'; collection: CollectionRecord }
  | { type: 'create_item'; collectionId: number; parentItemId?: number | null }
  | { type: 'edit_item'; item: ItemRecord; collectionId: number }
  | { type: 'delete_item'; item: ItemRecord; collectionId: number }
  | null;

/* ==========================================================================
   2. CUSTOM HOOK: useModals
   Centralized modal state manager that abstracts dialog toggling and payload
   dispatching across the application.
   ========================================================================== */

export function useModals() {
  // Master state holding the currently active modal configuration or null
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  /**
   * Resets active modal state to dismiss any open dialog.
   */
  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  /**
   * Opens the Template Manager dialog for managing collection schemas/presets.
   *
   * @param collectionId - Unique identifier of the target collection
   * @param collectionName - Display name of the collection
   */
  const openTemplateManager = useCallback((collectionId: number, collectionName: string) => {
    setActiveModal({ type: 'template_manager', collectionId, collectionName });
  }, []);

  /**
   * Opens the deletion confirmation dialog for a collection.
   *
   * @param collection - Full record of the collection pending deletion
   */
  const openDeleteCollection = useCallback((collection: CollectionRecord) => {
    setActiveModal({ type: 'delete_collection', collection });
  }, []);

  /**
   * Opens the creation dialog to add a new item to a collection.
   *
   * @param collectionId - Target collection id where the item will reside
   * @param parentItemId - Optional parent item id for nesting within a hierarchy (defaults to null)
   */
  const openCreateItem = useCallback((collectionId: number, parentItemId: number | null = null) => {
    setActiveModal({ type: 'create_item', collectionId, parentItemId });
  }, []);

  /**
   * Opens the editor dialog for an existing item record.
   *
   * @param item - Full record of the item to modify
   * @param collectionId - ID of the collection the item belongs to
   */
  const openEditItem = useCallback((item: ItemRecord, collectionId: number) => {
    setActiveModal({ type: 'edit_item', item, collectionId });
  }, []);

  /**
   * Opens the deletion confirmation dialog for an individual item.
   *
   * @param item - Full record of the item pending deletion
   * @param collectionId - ID of the collection containing the item
   */
  const openDeleteItem = useCallback((item: ItemRecord, collectionId: number) => {
    setActiveModal({ type: 'delete_item', item, collectionId });
  }, []);

  return {
    // Current state
    activeModal,
    setActiveModal,

    // Dispatcher actions
    closeModal,
    openTemplateManager,
    openDeleteCollection,
    openCreateItem,
    openEditItem,
    openDeleteItem,
  };
}