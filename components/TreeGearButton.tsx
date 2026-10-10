'use client';

import { GearIcon } from '@/components/icons/TreeIcons';
import { activeBtn } from '@/components/editorBarStyles';
import type { useTreeActionMenu } from '@/hooks/useTreeActionMenu';

interface TreeGearButtonProps {
  /** The row's own menu state, from useTreeActionMenu. */
  menu: ReturnType<typeof useTreeActionMenu>;
  /** Accessible name, e.g. "Open Body actions". */
  label: string;
  title?: string;
  /** Runs before the click pins the menu (e.g. select the row's node). */
  onBeforeClick?: () => void;
  /** Set as `data-tree-gear-id`, so a toolbar gear can open this row's menu. */
  gearId?: string;
}

/**
 * A tree row's gear: hover opens its flyout, a click pins it (useTreeActionMenu). Idle it is a muted
 * icon, hovered open it fills white, and pinned it is the toolbar's filled selected pill with the
 * icon rotated in the selected yellow (`.tree-gear-*` in TreePrimitives.css). Every tree uses this one
 * definition so the states never drift apart between trees.
 */
export default function TreeGearButton({ menu, label, title, onBeforeClick, gearId }: TreeGearButtonProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      data-tree-gear
      data-tree-gear-id={gearId}
      aria-label={label}
      aria-expanded={menu.isMenuOpen}
      title={title}
      onKeyDown={menu.handleGearKeyDown}
      onClick={(e) => {
        e.stopPropagation();
        onBeforeClick?.();
        menu.handleGearClick(e); // pins it open (hover alone opens it unpinned)
      }}
      onMouseEnter={menu.handleGearMouseEnter}
      onMouseLeave={menu.handleMouseLeave}
      className={[
        'flex items-center justify-center w-6 h-6 shrink-0 rounded border border-transparent cursor-pointer transition-colors',
        menu.isPinned
          ? `tree-gear-trigger-pinned ${activeBtn}`
          : menu.isMenuOpen
          ? 'tree-gear-trigger-active'
          : 'tree-gear-trigger',
      ].join(' ')}
    >
      <GearIcon
        isActive={menu.isMenuOpen}
        className={[
          'w-[15px] h-[15px] transition-all duration-300 ease-out',
          menu.isPinned ? 'tree-gear-pinned rotate-90' : menu.isMenuOpen ? 'tree-gear-open' : 'tree-gear-closed',
        ].join(' ')}
      />
    </div>
  );
}
