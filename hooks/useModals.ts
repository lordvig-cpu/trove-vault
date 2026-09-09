'use client';

import { useState, useCallback } from 'react';
import { CollectionRecord } from '@/types/collection';
import { ItemRecord } from '@/types/item';

export type ActiveModal =
  | { type: 'template_manager'; collectionId: number; collectionName: string }
  | { type: 'delete_collection'; collection: CollectionRecord }
  | { type: 'create_item'; collectionId: number; parentItemId?: number | null }
  | { type: 'edit_item'; item: ItemRecord; collectionId: number }
  | { type: 'delete_item'; item: ItemRecord; collectionId: number }
  | null;

export function useModals() {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const openTemplateManager = useCallback((collectionId: number, collectionName: string) => {
    setActiveModal({ type: 'template_manager', collectionId, collectionName });
  }, []);

  const openDeleteCollection = useCallback((collection: CollectionRecord) => {
    setActiveModal({ type: 'delete_collection', collection });
  }, []);

  const openCreateItem = useCallback((collectionId: number, parentItemId: number | null = null) => {
    setActiveModal({ type: 'create_item', collectionId, parentItemId });
  }, []);

  const openEditItem = useCallback((item: ItemRecord, collectionId: number) => {
    setActiveModal({ type: 'edit_item', item, collectionId });
  }, []);

  const openDeleteItem = useCallback((item: ItemRecord, collectionId: number) => {
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