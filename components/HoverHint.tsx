'use client';

import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import '@/app/styles/components/TreeActionMenu.css';
import { HelpCircleIcon } from '@/components/icons/LayoutIcons';

const HINT_WIDTH_PX = 307; // keep in step with .hoverHint's width (19.2rem)
const GAP_PX = 6;
const EDGE_PX = 8;

/** One option a control offers: shown bold, then what it does. */
export interface HintSetting {
  name: string;
  text: React.ReactNode;
}

/**
 * What a help bubble says. Every bubble has the same shape: a title bar (with the `?` at the
 * right), then an optional "Settings" section (one line per option) and an optional "Notes"
 * section. Inside `text` / `notes`, wrap any mention of a setting or property in <strong> (bold light
 * blue, matching the Settings names) and any object being described, like the Body, in <em>.
 */
export interface HintContent {
  title: string;
  settings?: HintSetting[];
  notes?: React.ReactNode;
}

/**
 * A small help popup for an inline icon (the `?` beside a label) or a button, for help too long for
 * a native tooltip. Styled like the tree action menus (`.hoverHint` in TreeActionMenu.css: title
 * pill, then the same shadowed-rule sub-headings as the Properties sections) and portaled to the
 * body so it isn't clipped by a scrolling flyout. Opens on hover or keyboard focus; below the
 * trigger (above it when the trigger is low on the screen), right-aligned to it.
 */
export default function HoverHint({
  hint,
  children,
  interactive = false,
}: {
  hint: HintContent;
  children: React.ReactNode;
  /** The child is itself a focusable control (a button): don't add a second tab stop. */
  interactive?: boolean;
}) {
  const id = useId();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const show = (el: HTMLElement) => setRect(el.getBoundingClientRect());
  const hide = () => setRect(null);

  let style: React.CSSProperties | null = null;
  if (rect) {
    const left = Math.min(
      Math.max(rect.right - HINT_WIDTH_PX, EDGE_PX),
      Math.max(window.innerWidth - HINT_WIDTH_PX - EDGE_PX, EDGE_PX)
    );
    style =
      rect.bottom > window.innerHeight * 0.7
        ? { left, bottom: window.innerHeight - rect.top + GAP_PX }
        : { left, top: rect.bottom + GAP_PX };
  }

  return (
    <>
      <span
        tabIndex={interactive ? undefined : 0}
        aria-describedby={rect ? id : undefined}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={hide}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={hide}
        className={interactive ? 'inline-flex' : 'inline-flex cursor-help'}
      >
        {children}
      </span>
      {style &&
        createPortal(
          <div id={id} role="tooltip" className="hoverHint" style={style}>
            <div className="headerPill">
              <span className="headerTitle">{hint.title}</span>
              <span className="headerIcon">
                <HelpCircleIcon className="w-4 h-4" />
              </span>
            </div>
            {hint.settings && hint.settings.length > 0 && (
              <>
                <div className="properties-section-heading">
                  <hr aria-hidden="true" />
                  <h3>Settings</h3>
                </div>
                <dl className="hoverHintList">
                  {hint.settings.map((setting) => (
                    <React.Fragment key={setting.name}>
                      <dt>{setting.name}</dt>
                      <dd>{setting.text}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </>
            )}
            {hint.notes && (
              <>
                <div className="properties-section-heading">
                  <hr aria-hidden="true" />
                  <h3>Notes</h3>
                </div>
                <p className="hoverHintNotes">{hint.notes}</p>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
