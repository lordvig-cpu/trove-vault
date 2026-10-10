'use client';

import { useEffect } from 'react';
import { TemplateComponentActionMenu, TemplateContainerActionMenu } from '@/components/TemplateLayoutActionMenu';
import {
  GLOBAL_MENU_CLOSE_EVENT,
  GLOBAL_MENU_OPEN_EVENT,
  holdMenuPin,
  releaseMenuPin,
  type TreeActionMenuApi,
} from '@/hooks/useTreeActionMenu';
import {
  closeFloatingNodeMenu,
  floatingMenuIdFor,
  moveFloatingNodeMenu,
  openFloatingNodeMenu,
  useFloatingNodeMenu,
} from '@/lib/floatingNodeMenu';
import { LayoutNavigationProvider } from '@/context/LayoutNavigationContext';
import { findFlexNode, findParentFlexContainer, type FlexComponentNode, type FlexContainerNode } from '@/types/layout';
import type { FieldDefinition } from '@/types/field';

const MIN_VISIBLE_PX = 120; // how much of the title bar must stay on screen while dragging
const noop = () => {};

interface FloatingNodeMenuHostProps {
  root: FlexContainerNode;
  fields: FieldDefinition[];
  onSelectNode?: (nodeId: string | null) => void;
  onAddContainer?: (targetContainerId: string, options?: Partial<FlexContainerNode>) => string;
  onInsertContainerSibling?: (targetContainerId: string, position: 'before' | 'after', options?: Partial<FlexContainerNode>) => string;
  onSplitContainer?: (containerId: string, splitType: 'columns' | 'rows', measuredPx: number) => void;
  onUpdateContainer?: (containerId: string, partial: Partial<FlexContainerNode>) => void;
  onRemoveContainer?: (containerId: string) => void;
  onUpdateComponent?: (componentId: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent?: (componentId: string) => void;
}

/**
 * Draws the floating node menu (lib/floatingNodeMenu.ts) in the template editor: the same container /
 * content flyout a Layout-tree row opens, given the layout\'s own callbacks, but as a window -- open until
 * its close button, Escape, or another menu opening; dragged by its title bar. While it is open it holds the
 * gear pin (so hovering a gear doesn't open another menu over it) and announces itself with the tree menus'
 * open / close events, which closes any tree flyout and lets the toolbar gear show it as open.
 */
export default function FloatingNodeMenuHost({ root, fields, onSelectNode, ...callbacks }: FloatingNodeMenuHostProps) {
  const floating = useFloatingNodeMenu();
  const node = floating ? findFlexNode(root, floating.nodeId) : null;
  const menuId = floating && node ? floatingMenuIdFor(floating.nodeId, node.nodeType === 'container') : null;

  // Its node was deleted (or the layout replaced): nothing left to show
  useEffect(() => {
    if (floating && !node) closeFloatingNodeMenu();
  }, [floating, node]);

  // Leaving the editor closes it
  useEffect(() => () => closeFloatingNodeMenu(), []);

  const openCount = floating?.openCount;
  useEffect(() => {
    if (!menuId) return;
    holdMenuPin(menuId);
    window.dispatchEvent(new CustomEvent(GLOBAL_MENU_OPEN_EVENT, { detail: menuId }));
    const onOtherMenuOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== menuId) closeFloatingNodeMenu();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      closeFloatingNodeMenu();
    };
    window.addEventListener(GLOBAL_MENU_OPEN_EVENT, onOtherMenuOpen);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener(GLOBAL_MENU_OPEN_EVENT, onOtherMenuOpen);
      document.removeEventListener('keydown', onKeyDown);
      releaseMenuPin(menuId);
      window.dispatchEvent(new CustomEvent(GLOBAL_MENU_CLOSE_EVENT, { detail: menuId }));
    };
  }, [menuId, openCount]);

  if (!floating || !node) return null;

  // The flyouts take a useTreeActionMenu result; this one is always open and pinned, at the stored spot,
  // and only closes explicitly.
  const menu: TreeActionMenuApi = {
    isMenuOpen: true,
    isPinned: true,
    menuCoords: { top: floating.top, left: floating.left },
    handleGearKeyDown: noop,
    handleGearClick: noop,
    handleRowContextMenu: noop,
    handleGearMouseEnter: noop,
    handleMenuMouseEnter: noop,
    handleMouseLeave: noop,
    closeMenu: closeFloatingNodeMenu,
    // It has no panel to be hidden
    setPanelHiddenHandler: noop,
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    const { left, top } = floating;
    const onMove = (ev: PointerEvent) => {
      const nextLeft = Math.min(Math.max(left + ev.clientX - startX, MIN_VISIBLE_PX - 280), window.innerWidth - MIN_VISIBLE_PX);
      const nextTop = Math.min(Math.max(top + ev.clientY - startY, 0), window.innerHeight - 48);
      moveFloatingNodeMenu(nextLeft, nextTop);
    };
    const onEnd = () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
  };
  const chrome = { onClose: closeFloatingNodeMenu, onTitlePointerDown: startDrag };
  // Remounts on every open, so it starts on the tab it was asked to open on
  const key = `${floating.nodeId}-${floating.openCount}`;

  // Select Previous / Next: select that node and become its menu, right where this one is
  const navigation = {
    root,
    fields,
    goTo: (nodeId: string) => {
      onSelectNode?.(nodeId);
      openFloatingNodeMenu(nodeId, floating.left, floating.top, 'actions');
    },
  };

  return (
    <LayoutNavigationProvider value={navigation}>
    {node.nodeType === 'container' ? (
    <TemplateContainerActionMenu
      key={key}
      container={node}
      menu={menu}
      position="left"
      floating={chrome}
      initialTab={floating.tab}
      onAddContainer={callbacks.onAddContainer}
      onInsertContainerSibling={callbacks.onInsertContainerSibling}
      onSplitContainer={callbacks.onSplitContainer}
      onUpdateContainer={callbacks.onUpdateContainer}
      onRemoveContainer={callbacks.onRemoveContainer}
    />
  ) : (
    <TemplateComponentActionMenu
      key={key}
      component={node}
      parentContainer={findParentFlexContainer(root, node.id)}
      fields={fields}
      menu={menu}
      position="left"
      floating={chrome}
      initialTab={floating.tab}
      onUpdateComponent={callbacks.onUpdateComponent}
      onRemoveComponent={callbacks.onRemoveComponent}
      onSelectNode={onSelectNode}
    />
    )}
    </LayoutNavigationProvider>
  );
}
