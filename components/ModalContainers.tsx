'use client';

import React from 'react';
import { ActiveModal } from '@/hooks/useModals';
import { ItemRecord } from '@/types/item';
import TemplateManagerModal from '@/components/TemplateManagerModal';
import DeleteCollectionModal from '@/components/DeleteCollectionModal';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

/**
 * Props for ModalContainers orchestrator.
 * @property activeModal - Discriminated union tracking the active dialog and its payload (or null)
 * @property closeModal - Dismissal callback resetting activeModal state
 * @property allItems - Complete item list used to derive valid parent items for nested creations
 * @property selectedItem - Currently active item shown in the main viewport canvas
 * @property setSelectedItem - State setter to clear selection if the active item is deleted
 * @property fetchAllData - Data layer refresher called to resync Supabase cache after mutations
 */
interface ModalContainersProps {
  activeModal: ActiveModal;
  closeModal: () => void;
  allItems: ItemRecord[];
  selectedItem: ItemRecord | null;
  setSelectedItem: (item: ItemRecord | null) => void;
  fetchAllData: (preferredActiveCollectionId?: number | null) => Promise<void>;
}

/* ==========================================================================
   2. MAIN COMPONENT: ModalContainers
   Acts as a centralized mount switchboard for application modal dialogs,
   keeping page.tsx decoupled from modal imports and mounting logic.
   ========================================================================== */

export default function ModalContainers({
  activeModal,
  closeModal,
  allItems,
  selectedItem,
  setSelectedItem,
  fetchAllData,
}: ModalContainersProps) {
  // Early return if no modal dialog is requested
  if (!activeModal) return null;

  return (
    <>
      {/* --------------------------------------------------------------------
          2.1 TEMPLATE MANAGER MODAL
          Manages custom schemas and applies preset field structures to collections.
          -------------------------------------------------------------------- */}
      {activeModal.type === 'template_manager' && (
        <TemplateManagerModal
          isOpen={true}
          onClose={closeModal}
          collectionId={activeModal.collectionId}
          collectionName={activeModal.collectionName}
          onTemplateApplied={() => fetchAllData()}
        />
      )}

      {/* --------------------------------------------------------------------
          2.2 DELETE COLLECTION MODAL
          Confirms cascading deletion of a collection and all nested items/fields.
          Resets active collection selection upon deletion.
          -------------------------------------------------------------------- */}
      {activeModal.type === 'delete_collection' && (
        <DeleteCollectionModal
          isOpen={true}
          onClose={closeModal}
          onCollectionDeleted={() => fetchAllData(null)}
          collection={activeModal.collection}
        />
      )}

      {/* --------------------------------------------------------------------
          2.3 CREATE ITEM MODAL
          Instantiates a new record under a collection, as a standalone root item,
          or nested under an existing parent item.
          -------------------------------------------------------------------- */}
      {activeModal.type === 'create_item' && (
        <CreateItemModal
          isOpen={true}
          onClose={closeModal}
          onItemCreated={() => fetchAllData(activeModal.collectionId)}
          collectionId={activeModal.collectionId}
          availableParents={allItems.filter((i) =>
            activeModal.collectionId !== null
              ? i.collection_id === activeModal.collectionId
              : i.collection_id === null
          )}
          initialParentId={activeModal.parentItemId || null}
        />
      )}

      {/* --------------------------------------------------------------------
          2.4 EDIT ITEM MODAL
          Modifies custom attributes, title, and metadata for a specific record.
          -------------------------------------------------------------------- */}
      {activeModal.type === 'edit_item' && (
        <EditItemModal
          isOpen={true}
          onClose={closeModal}
          onItemUpdated={() => fetchAllData(activeModal.collectionId)}
          item={activeModal.item}
        />
      )}

      {/* --------------------------------------------------------------------
          2.5 DELETE ITEM MODAL
          Confirms record deletion. Clears viewport selection if the deleted
          record is currently active before resyncing.
          -------------------------------------------------------------------- */}
      {activeModal.type === 'delete_item' && (
        <DeleteItemModal
          isOpen={true}
          onClose={closeModal}
          onItemDeleted={() => {
            if (activeModal.item.id === selectedItem?.id) {
              setSelectedItem(null);
            }
            fetchAllData(activeModal.collectionId);
          }}
          item={activeModal.item}
        />
      )}
    </>
  );
}