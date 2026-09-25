'use client';

import React, { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import '@/app/styles/components/TreeActionMenu.css';
import { HelpCircleIcon } from '@/components/icons/LayoutIcons';
import { HintCautionIcon, HintTipIcon, HintUseIcon } from '@/components/icons/HintIcons';

const NOTE_ICONS: Record<HintNoteKind, React.ReactNode> = {
  use: <HintUseIcon />,
  tip: <HintTipIcon />,
  caution: <HintCautionIcon />,
};

const HINT_WIDTH_PX = 307; // keep in step with .hoverHint's width (19.2rem)
const GAP_PX = 6;
const EDGE_PX = 8;

/**
 * Inside a note: a reference to a control the user can see, shown as a miniature of its button
 * (the same icon in a small outlined chip) followed by its name in the setting color, so nobody has
 * to guess which button "Link sides" or "Fill" means.
 */
export function HintRef({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="hintRef">
      <span className="hintRefIcon">{icon}</span>
      <strong>{children}</strong>
    </span>
  );
}

/** One option a control offers: shown bold, then what it does. */
export interface HintSetting {
  name: string;
  /** The control's own icon, shown in a mini button chip before the name (see HintRef). */
  icon?: React.ReactNode;
  text: React.ReactNode;
}

/** What kind of note a point is; each kind has its own icon in the bubble. */
export type HintNoteKind = 'use' | 'tip' | 'caution';

/** Notes always read in the same order in every bubble -- how to use it, then tips, then cautions --
 *  whatever order they were written in (the sort is stable, so points of one kind keep theirs). */
const NOTE_ORDER: Record<HintNoteKind, number> = { use: 0, tip: 1, caution: 2 };
const sortNotes = (notes: HintNote[]) => [...notes].sort((a, b) => NOTE_ORDER[a.kind] - NOTE_ORDER[b.kind]);

/** One point in a bubble's Notes: how to use the control, a helpful tip, or a caution. */
export interface HintNote {
  kind: HintNoteKind;
  text: React.ReactNode;
}

/**
 * What a help bubble says. Every bubble has the same shape: a title bar (with the `?` at the
 * right), then an optional "Settings" section (one line per option) and an optional "Notes"
 * section (a list of typed points, each with its own icon). Inside `text` / `notes`: wrap a setting or property name in <strong> (bold light blue, like
 * the Settings names), a component being referred to (the Body) in <em> (bold italic amber), and a
 * literal value (100%, px, Row) in <code> (bold white).
 */
export interface HintContent {
  title: string;
  settings?: HintSetting[];
  notes?: HintNote[];
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
                      <dt>
                        {setting.icon ? (
                          <span className="hintRef">
                            <span className="hintRefIcon">{setting.icon}</span>
                            {setting.name}
                          </span>
                        ) : (
                          setting.name
                        )}
                      </dt>
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
                <ul className="hoverHintNotes">
                  {sortNotes(hint.notes).map((note, i) => (
                    <li key={i} className={`hoverHintNote hoverHintNote-${note.kind}`}>
                      <span className="hoverHintNoteIcon">{NOTE_ICONS[note.kind]}</span>
                      <span>{note.text}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
