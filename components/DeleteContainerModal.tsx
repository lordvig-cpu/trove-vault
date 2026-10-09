'use client';

import CautionModal from '@/components/CautionModal';
import { FlexColumnIcon, FlexRowIcon } from '@/components/icons/LayoutIcons';
import { ComponentTypeIcon } from '@/components/icons/ContentIcons';
import { layoutNodeName } from '@/lib/layoutNavigation';
import { resolveDirection, type FlexContainerNode, type FlexLayoutNode } from '@/types/layout';
import type { FieldDefinition } from '@/types/field';

interface DeleteContainerModalProps {
  container: FlexContainerNode;
  fields: FieldDefinition[];
  onConfirm: () => void;
  onCancel: () => void;
}

/** Everything inside a container, in the Layout tree's order, with how deep each one sits under it. */
function descendantsOf(container: FlexContainerNode): { node: FlexLayoutNode; depth: number }[] {
  const out: { node: FlexLayoutNode; depth: number }[] = [];
  const walk = (node: FlexContainerNode, depth: number) => {
    node.children.forEach((child) => {
      out.push({ node: child, depth });
      if (child.nodeType === 'container') walk(child, depth + 1);
    });
  };
  walk(container, 0);
  return out;
}

// "5 content elements", but just "container" when it is the only thing inside ("The container inside it")
const plural = (n: number, one: string, many: string, alone: boolean) => (alone ? one : `${n} ${n === 1 ? one : many}`);

/** Asked before deleting a container that holds anything: lists the containers and content that go with it. */
export default function DeleteContainerModal({ container, fields, onConfirm, onCancel }: DeleteContainerModalProps) {
  const inside = descendantsOf(container);
  const containers = inside.filter(({ node }) => node.nodeType === 'container').length;
  const content = inside.length - containers;
  const counts = [containers && plural(containers, 'container', 'containers', inside.length === 1), content && plural(content, 'content element', 'content elements', inside.length === 1)]
    .filter(Boolean)
    .join(' and ');

  return (
    <CautionModal
      title="Delete Container"
      onCancel={onCancel}
      actions={[{ label: 'Delete Container', kind: 'danger', onClick: onConfirm }]}
    >
      <p className="text-sm confirm-modal-item leading-relaxed">
        Are you sure you want to delete <strong className="confirm-modal-item-name">&quot;{layoutNodeName(container, fields, false)}&quot;</strong>?
        The {counts} inside it will be deleted too:
      </p>
      <ul className="confirm-modal-list rounded-lg p-2 max-h-60 overflow-y-auto text-xs space-y-0.5" aria-label="Also deleted">
        {inside.map(({ node, depth }) => (
          <li key={node.id} className="flex items-center gap-1.5 min-w-0" style={{ paddingLeft: `${depth * 14}px` }}>
            <span className="shrink-0 text-accent-secondary">
              {node.nodeType === 'container' ? (
                resolveDirection(node, false) === 'row' ? <FlexRowIcon className="w-3.5 h-3.5" /> : <FlexColumnIcon className="w-3.5 h-3.5" />
              ) : (
                <ComponentTypeIcon type={node.componentType} className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="truncate confirm-modal-item">{layoutNodeName(node, fields, false)}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-content-muted">You can still undo this from the toolbar.</p>
    </CautionModal>
  );
}
