'use client';

import { ItemRecord } from '@/types/item';
import Image from 'next/image';

/* ==========================================================================
   1. TYPE DEFINITIONS & INTERFACES
   ========================================================================== */

interface ItemDetailViewProps {
  item: ItemRecord | null;
  onAddSubItem: (parent: ItemRecord) => void;
  onEditItem: () => void;
  onDeleteItem: () => void;
}

/* ==========================================================================
   2. MAIN COMPONENT: ItemDetailView
   Displays active record details, schema properties, media attachments,
   and direct child items on the workspace canvas.
   ========================================================================== */

export default function ItemDetailView({
  item,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
}: ItemDetailViewProps) {
  if (!item) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col items-center justify-center text-center p-8 content-card">
          <span className="text-4xl mb-3">🔍</span>
          <h3 className="text-base font-semibold detail-heading">No Item Selected</h3>
          <p className="text-xs detail-muted mt-1 max-w-sm">
            Select an item from the tree or create a new one to view its attributes, hierarchy, and metadata.
          </p>
        </div>

        {/* 100% Full Width Canvas Verification Filler Text */}
        <div className="content-card p-6 space-y-4">
          <div className="flex items-center justify-between detail-divider border-b pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider detail-muted">
              Main Canvas 100% Full-Width Layout Verification
            </h2>
            <span className="text-xs font-mono detail-muted">Full Width Stream</span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed detail-muted">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc.
            </p>
            <p>
              Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan porttitor, facilisis luctus, metus. Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus. Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi. Pellentesque fermentum dolor. Aliquam quam lectus, facilisis auctor, ultrices ut, elementum vulputate, nunc. Sed adipiscing ornare risus. Morbi est est, blandit sit amet, sagittis vel, euismod vel, velit. Pellentesque egestas sem. Suspendisse commodo ullamcorper magna.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="content-pill p-4 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider detail-heading">Column A (33.3%)</span>
              <p className="text-xs detail-muted leading-relaxed">
                Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.
              </p>
            </div>
            <div className="content-pill p-4 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider detail-heading">Column B (33.3%)</span>
              <p className="text-xs detail-muted leading-relaxed">
                Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat.
              </p>
            </div>
            <div className="content-pill p-4 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider detail-heading">Column C (33.3%)</span>
              <p className="text-xs detail-muted leading-relaxed">
                Phasellus ultrices nulla quis nibh. Quisque a lectus. Donec consectetuer ligula vulputate sem tristique cursus. Nam nulla quam, gravida non, commodo a, sodales sit amet, nisi.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const attributes = item.attributes || {};
  const attributeEntries = Object.entries(attributes);
  const imageUrl = [item.image_url, attributes.image_url, attributes.photo_url]
    .find((value): value is string => typeof value === 'string' && value.length > 0);

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="content-card p-5 flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="detail-item-badge px-2 py-0.5 rounded text-[11px] font-mono font-medium">
              ITEM #{item.id}
            </span>
            {item.parent_id ? (
              <span className="detail-parent-badge px-2 py-0.5 rounded text-[11px] font-mono">
                Parent ID: {item.parent_id}
              </span>
            ) : (
              <span className="badge-root-item">
                Root Item
              </span>
            )}
            {(!item.collection_ids || item.collection_ids.length === 0) && item.collection_id === null && (
              <span className="detail-standalone-badge px-2 py-0.5 rounded text-[11px] font-mono">
                Standalone
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold detail-heading tracking-tight">{item.name}</h1>
          {item.created_at && (
            <p className="text-xs detail-muted">
              Created: {new Date(item.created_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEditItem}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5',
              'text-xs font-semibold detail-action-secondary rounded-lg',
              'cursor-pointer transition',
            ].join(' ')}
          >
            <span>✏️</span> Edit
          </button>

          <button
            type="button"
            onClick={() => onAddSubItem(item)}
            className="content-btn-primary"
          >
            <span>+</span> Add Sub-Item
          </button>

          <button
            type="button"
            onClick={onDeleteItem}
            className="content-btn-danger"
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>

      {/* GRID: IMAGE & ATTRIBUTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Preview Card */}
        <div className="md:col-span-1 content-card p-5 flex flex-col items-center justify-center text-center min-h-[200px]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              width={400}
              height={224}
              unoptimized
              alt={item.name}
              className="detail-image max-h-56 w-auto rounded-lg object-contain border"
            />
          ) : (
            <div
              className={[
                'flex flex-col items-center justify-center gap-2 w-full h-full p-6',
                'detail-empty-image border border-dashed rounded-xl',
              ].join(' ')}
            >
              <span className="text-3xl detail-empty-icon">📷</span>
              <span className="text-xs">No image uploaded</span>
            </div>
          )}
        </div>

        {/* Attributes Card */}
        <div className="md:col-span-2 content-card p-5 space-y-4 flex flex-col">
          <div className="flex items-center justify-between detail-divider border-b pb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider detail-muted">
              Custom Attributes (JSONB)
            </h2>
            <span className="text-xs font-mono detail-muted">
              {attributeEntries.length} {attributeEntries.length === 1 ? 'Field' : 'Fields'}
            </span>
          </div>

          {attributeEntries.length === 0 ? (
            <p className="text-xs detail-muted italic py-4">No custom fields assigned to this item.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attributeEntries.map(([key, value]) => (
                <div key={key} className="content-pill flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider detail-muted">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold detail-accent break-words">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SUB-ITEMS LIST CARD */}
      {item.children && item.children.length > 0 && (
        <div className="content-card p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider detail-muted detail-divider border-b pb-2">
            Direct Sub-Items ({item.children.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {item.children.map((child) => (
              <div key={child.id} className="content-pill flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs">📄</span>
                  <span className="text-xs font-medium detail-heading truncate">{child.name}</span>
                </div>
                <span className="text-[10px] font-mono detail-muted shrink-0">#{child.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXTENDED NOTES & LORE (100% Full-Width Layout Verification Filler Text) */}
      <div className="content-card p-6 space-y-4">
        <div className="flex items-center justify-between detail-divider border-b pb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider detail-muted">
            Extended Notes & Lore (100% Full-Width Canvas Verification)
          </h2>
          <span className="text-xs font-mono detail-muted">Full Width View</span>
        </div>

        <div className="space-y-3 text-xs leading-relaxed detail-muted">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>
          <p>
            At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="content-pill p-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider detail-heading">Column 1 (33.3% Width)</span>
            <p className="text-xs detail-muted leading-relaxed">
              Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.
            </p>
          </div>
          <div className="content-pill p-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider detail-heading">Column 2 (33.3% Width)</span>
            <p className="text-xs detail-muted leading-relaxed">
              Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.
            </p>
          </div>
          <div className="content-pill p-4 flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider detail-heading">Column 3 (33.3% Width)</span>
            <p className="text-xs detail-muted leading-relaxed">
              Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
