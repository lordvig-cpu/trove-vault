'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar, { SearchScope } from '@/components/Navbar';
import TreeNode, { ItemRecord } from '@/components/TreeNode';
import ItemDetailView from '@/components/ItemDetailView';
import CreateItemModal from '@/components/CreateItemModal';
import EditItemModal from '@/components/EditItemModal';
import DeleteItemModal from '@/components/DeleteItemModal';
import DeleteCollectionModal from '@/components/DeleteCollectionModal';
import FieldManagerModal from '@/components/FieldManagerModal';
import TemplateManagerModal from '@/components/TemplateManagerModal';
import { CollectionRecord } from '@/components/CollectionDropdown';

interface HierarchicalCollection extends CollectionRecord {
  items: ItemRecord[];
}

interface UniversalSearchResultItem extends ItemRecord {
  collection_name?: string;
}

function buildItemHierarchy(items: ItemRecord[], parentId: number | null = null): ItemRecord[] {
  return items
    .filter((item) => item.parent_id === parentId)
    .map((item) => ({
      ...item,
      children: buildItemHierarchy(items, item.id),
    }));
}

function itemMatchesQuery(item: ItemRecord, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();

  if (item.name.toLowerCase().includes(q)) return true;

  if (item.attributes) {
    for (const [key, value] of Object.entries(item.attributes)) {
      if (key.toLowerCase().includes(q)) return true;
      if (String(value).toLowerCase().includes(q)) return true;
    }
  }

  return false;
}

function filterHierarchy(nodes: ItemRecord[], query: string): ItemRecord[] {
  if (!query.trim()) return nodes;

  const filtered: ItemRecord[] = [];

  for (const node of nodes) {
    const matchingChildren = filterHierarchy(node.children || [], query);
    const selfMatches = itemMatchesQuery(node, query);

    if (selfMatches || matchingChildren.length > 0) {
      filtered.push({
        ...node,
        children: matchingChildren,
      });
    }
  }

  return filtered;
}

export default function Home() {
  const [allCollections, setAllCollections] = useState<CollectionRecord[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [currentCollection, setCurrentCollection] = useState<HierarchicalCollection | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);

  // Search state & scope
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('current');
  const [universalResults, setUniversalResults] = useState<UniversalSearchResultItem[]>([]);
  const [isSearchingUniversal, setIsSearchingUniversal] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Popovers & Modals
  const [isColDropdownOpen, setIsColDropdownOpen] = useState(false);
  const [isFieldManagerOpen, setIsFieldManagerOpen] = useState(false);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<CollectionRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function fetchCollectionsList(preferredId?: number | null) {
    try {
      setError(null);
      const { data, error: colListError } = await supabase
        .from('collections')
        .select('*')
        .order('id', { ascending: true });

      if (colListError) throw colListError;

      const collections = data || [];
      setAllCollections(collections);

      if (collections.length > 0) {
        const targetId = preferredId !== undefined ? preferredId : activeCollectionId;
        const exists = collections.some((c) => c.id === targetId);
        const nextValidId = exists && targetId ? targetId : collections[0].id;

        setActiveCollectionId(nextValidId);
        fetchActiveCollectionData(nextValidId);
      } else {
        setActiveCollectionId(null);
        setCurrentCollection(null);
        setSelectedItem(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Failed to load collections list:', err);
      setError(err?.message || 'Failed to load collections');
      setLoading(false);
    }
  }

  async function fetchActiveCollectionData(collectionId: number, targetSelectId?: number | null) {
    try {
      setLoading(true);
      setError(null);

      const { data: collectionData, error: colError } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .maybeSingle();

      if (colError) throw colError;

      if (!collectionData) {
        setCurrentCollection(null);
        setSelectedItem(null);
        return;
      }

      const { data: rawItems, error: itError } = await supabase
        .from('items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('id', { ascending: true });

      if (itError) throw itError;

      const nestedItems = buildItemHierarchy(rawItems as ItemRecord[]);

      setCurrentCollection({
        ...collectionData,
        items: nestedItems,
      });

      const activeId = targetSelectId !== undefined ? targetSelectId : selectedItem?.id;
      if (activeId) {
        const found = (rawItems as ItemRecord[]).find((i) => i.id === activeId);
        if (found) {
          setSelectedItem({
            ...found,
            children: buildItemHierarchy(rawItems as ItemRecord[], found.id),
          });
        } else {
          setSelectedItem(nestedItems.length > 0 ? nestedItems[0] : null);
        }
      } else {
        setSelectedItem(nestedItems.length > 0 ? nestedItems[0] : null);
      }
    } catch (err: any) {
      console.error('Failed to load collection data:', err);
      setError(err?.message || 'Query error');
    } finally {
      setLoading(false);
    }
  }

  // Cross-Collection Global Search Query
  useEffect(() => {
    async function runUniversalSearch() {
      if (searchScope !== 'all' || !searchQuery.trim()) {
        setUniversalResults([]);
        return;
      }

      try {
        setIsSearchingUniversal(true);
        const { data, error: queryErr } = await supabase
          .from('items')
          .select('*, collections(name)')
          .order('id', { ascending: true });

        if (queryErr) throw queryErr;

        const allItems = (data || []).map((item: any) => ({
          ...item,
          collection_name: item.collections?.name || 'Unknown Collection',
        }));

        const matching = allItems.filter((it: ItemRecord) => itemMatchesQuery(it, searchQuery));
        setUniversalResults(matching);
      } catch (err: any) {
        console.error('Universal search error:', err);
      } finally {
        setIsSearchingUniversal(false);
      }
    }

    runUniversalSearch();
  }, [searchQuery, searchScope]);

  useEffect(() => {
    fetchCollectionsList();
  }, []);

  const visibleCurrentItems = useMemo(() => {
    if (!currentCollection) return [];
    return filterHierarchy(currentCollection.items, searchQuery);
  }, [currentCollection, searchQuery]);

  // Jump directly to an item found via universal search
  const handleSelectUniversalResult = (item: UniversalSearchResultItem) => {
    if (item.collection_id !== activeCollectionId) {
      setActiveCollectionId(item.collection_id);
      fetchActiveCollectionData(item.collection_id, item.id);
    } else {
      setSelectedItem(item);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchScope={searchScope}
        onSearchScopeChange={setSearchScope}
        activeCollectionName={currentCollection ? currentCollection.name : 'Select Collection'}
        collections={allCollections}
        activeCollectionId={activeCollectionId}
        onSelectCollection={(newId) => {
          setActiveCollectionId(newId);
          fetchActiveCollectionData(newId);
        }}
        onCollectionsUpdated={() => fetchCollectionsList()}
        isDropdownOpen={isColDropdownOpen}
        setIsDropdownOpen={setIsColDropdownOpen}
        onRequestDeleteCollection={(col) => setCollectionToDelete(col)}
        onOpenFieldManager={() => setIsFieldManagerOpen(true)}
        onOpenTemplateManager={() => setIsTemplateManagerOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR */}
        <aside className="w-84 border-r border-slate-800 bg-slate-900/40 p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {searchScope === 'all' && searchQuery ? 'Universal Search Results' : 'Explorer'}
              </span>
              {currentCollection && searchScope === 'current' && (
                <button
                  onClick={() => {
                    setModalParentId(null);
                    setIsCreateOpen(true);
                  }}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  + New Item
                </button>
              )}
            </div>
            <h2 className="text-sm font-bold text-white mt-1 truncate">
              {searchScope === 'all' && searchQuery
                ? `Matches across all collections (${universalResults.length})`
                : currentCollection
                ? currentCollection.name
                : 'No Collection Selected'}
            </h2>
          </div>

          {loading && (
            <div className="text-xs text-amber-400 p-3 bg-slate-900 border border-slate-800 rounded-lg animate-pulse">
              ⏳ Syncing data...
            </div>
          )}

          {error && (
            <div className="text-xs text-rose-300 p-3 bg-rose-950/60 border border-rose-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Active Filter Scope Badge */}
          {searchQuery && (
            <div className="flex items-center justify-between text-xs bg-indigo-950/60 border border-indigo-800/70 rounded-xl px-3 py-2 text-indigo-200 shadow-sm shadow-indigo-950/50">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-indigo-400 shrink-0">
                  {searchScope === 'current' ? '📁' : '🌐'}
                </span>
                <span className="truncate">
                  {searchScope === 'current' ? 'In collection: ' : 'All collections: '}
                  <strong className="text-white">"{searchQuery}"</strong>
                </span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-medium text-indigo-400 hover:text-white shrink-0 ml-2 px-1.5 py-0.5 rounded hover:bg-indigo-900/60 transition"
              >
                Clear
              </button>
            </div>
          )}

          {/* UNIVERSAL SEARCH RESULTS VIEW */}
          {searchScope === 'all' && searchQuery ? (
            <div className="space-y-2">
              {isSearchingUniversal ? (
                <div className="text-xs text-slate-500 text-center py-6 animate-pulse">
                  Searching all collections...
                </div>
              ) : universalResults.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-6">
                  No matches found across any collection.
                </div>
              ) : (
                universalResults.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectUniversalResult(item)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-indigo-950/70 border-indigo-700 shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{item.name}</span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-1.5 py-0.2 rounded">
                          #{item.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span className="truncate">🗂️ {item.collection_name}</span>
                        {item.parent_id && <span>↳ Sub-Item</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* STANDARD SINGLE-COLLECTION TREE VIEW */
            <>
              {currentCollection && visibleCurrentItems.length === 0 && !loading && (
                <div className="text-xs text-slate-500 text-center py-6">
                  {searchQuery ? 'No items match your search.' : 'No items yet. Create your first item above!'}
                </div>
              )}

              {currentCollection && visibleCurrentItems.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {visibleCurrentItems.map((item) => (
                    <TreeNode
                      key={item.id}
                      item={item}
                      level={0}
                      selectedItemId={selectedItem?.id || null}
                      onSelectItem={(clickedItem) => setSelectedItem(clickedItem)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </aside>

        {/* MAIN DETAIL PANEL */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
          <div className="max-w-4xl mx-auto">
            <ItemDetailView
              item={selectedItem}
              onAddSubItem={(parent) => {
                setModalParentId(parent.id);
                setIsCreateOpen(true);
              }}
              onEditItem={() => setIsEditOpen(true)}
              onDeleteItem={() => setIsDeleteOpen(true)}
            />
          </div>
        </main>
      </div>

      {/* Master Template Manager Modal */}
      {currentCollection && (
        <TemplateManagerModal
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          collectionId={currentCollection.id}
          collectionName={currentCollection.name}
          onTemplateApplied={() => {}}
        />
      )}

      {/* Field Schema Manager Modal */}
      {currentCollection && (
        <FieldManagerModal
          isOpen={isFieldManagerOpen}
          onClose={() => setIsFieldManagerOpen(false)}
          collectionId={currentCollection.id}
          collectionName={currentCollection.name}
          onFieldsUpdated={() => {}}
        />
      )}

      {/* Delete Collection Modal */}
      <DeleteCollectionModal
        isOpen={Boolean(collectionToDelete)}
        onClose={() => setCollectionToDelete(null)}
        onCollectionDeleted={() => fetchCollectionsList(null)}
        collection={collectionToDelete}
      />

      {/* Creation Modal */}
      {currentCollection && (
        <CreateItemModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onItemCreated={() => fetchActiveCollectionData(currentCollection.id)}
          collectionId={currentCollection.id}
          availableParents={currentCollection.items || []}
          initialParentId={modalParentId}
        />
      )}

      {/* Edit Modal */}
      <EditItemModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onItemUpdated={() =>
          currentCollection && fetchActiveCollectionData(currentCollection.id, selectedItem?.id)
        }
        item={selectedItem}
      />

      {/* Delete Item Modal */}
      <DeleteItemModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onItemDeleted={() =>
          currentCollection && fetchActiveCollectionData(currentCollection.id, null)
        }
        item={selectedItem}
      />
    </div>
  );
}