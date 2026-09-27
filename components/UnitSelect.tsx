'use client';

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@/components/icons/PanelIcons';
import { barControlHeight } from '@/components/editorBarStyles';
import '@/app/styles/components/unitSelect.css';

interface UnitSelectProps {
  value: 'px' | '%';
  onChange: (unit: 'px' | '%') => void;
  label: string;
  /** Sits flush against a length input to its left (default), or stands alone with its own corners. */
  attached?: boolean;
  /** Shown but not changeable (a field that only takes pixels). */
  disabled?: boolean;
}

const OPTIONS: Array<'px' | '%'> = ['px', '%'];

/**
 * The px / % pulldown attached to the right of a length input (Padding, Content Width; the input
 * squares off its right corners, and the two share one edge). A custom dropdown, built and
 * portaled the same way the top toolbar's own Add/Split pulldowns are (TemplateEditorContainerBar's
 * ToolGroup) and HoverHint is, rather than a native <select> -- Chromium's native option-list
 * styling turned out unreliable (it kept rendering a plain black-on-white system list no CSS on the
 * <option>s could override, even with color-scheme: dark and !important), so a native control's
 * list could no longer be trusted to pick up the app's theme at all, let alone match the closed
 * trigger. The list is portaled to <body> and positioned from the trigger's own on-screen rect
 * rather than rendered inline, which is what the native <select> gave up for free: a flyout's
 * scrolling body would otherwise clip it.
 */
export default function UnitSelect({ value, onChange, label, attached = true, disabled = false }: UnitSelectProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = rect !== null;

  const close = () => setRect(null);

  const toggle = () => {
    if (disabled) return;
    if (open) {
      close();
    } else if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
  };

  // Outside-click / Escape dismissal has to check both the trigger and the portaled list -- the
  // list isn't a DOM descendant of the trigger's own wrapper once it's portaled to <body>, so the
  // shared useDismissOnOutsideOrEscape (single ref) would treat a click on an option as "outside"
  // and close the menu on pointerdown, before the option's own onClick ever got to fire.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative shrink-0 ${attached ? '-ml-px' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={label}
        disabled={disabled}
        onClick={toggle}
        className={`unitSelectTrigger relative ${barControlHeight} pl-2 pr-5 ${
          attached ? 'rounded-r-lg rounded-l-none' : 'rounded-md'
        } border text-xs font-semibold cursor-pointer transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {value}
        <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5" />
      </button>
      {rect &&
        createPortal(
          <div
            ref={menuRef}
            // When this trigger sits inside a TreeSubMenu flyout, that flyout's own outside-click
            // and hover-out dismissal (useTreeActionMenu.ts) both check for `[data-tree-menu]` to
            // decide whether a click/hover is "still inside the menu" -- since this list is
            // portaled to <body>, it's outside the flyout's own DOM subtree, so without this
            // attribute picking an option read as a click outside the flyout and closed the whole
            // flyout along with the pulldown.
            data-tree-menu
            role="listbox"
            aria-label={label}
            className="tmpl-edge-panel tmpl-edge-menu unitSelectMenu flex flex-col"
            style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, minWidth: rect.width, zIndex: 89 }}
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={value === opt}
                onClick={() => {
                  onChange(opt);
                  close();
                }}
                className={`unitSelectOption ${value === opt ? 'unitSelectOption-selected' : ''} px-2 py-1 border text-left text-[11px] font-semibold cursor-pointer transition`}
              >
                {opt}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
