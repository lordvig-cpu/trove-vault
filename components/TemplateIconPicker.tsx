'use client';

import { useRef, useState } from 'react';
import { useDismissOnOutsideOrEscape } from '@/hooks/useDismissOnOutsideOrEscape';
import { activeBtn, barGhostBtn, barGroupBtn } from '@/components/editorBarStyles';
import { CheckIcon } from '@/components/icons/GlyphIcons';
import { firstGrapheme, TEMPLATE_ICON_CHOICES } from '@/lib/templateIcons';
import { DEFAULT_TEMPLATE_ICON } from '@/types/template';

/**
 * The template's icon on the template-wide toolbar: click it to pick another from a grid of common
 * choices, or type / paste any emoji into the box under them. Opens upward, like the toolbar's Width
 * pulldown (the bar sits on the workspace footer).
 */
export default function TemplateIconPicker({ icon, onChange }: { icon?: string; onChange?: (icon: string) => void }) {
  const current = icon || DEFAULT_TEMPLATE_ICON;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useDismissOnOutsideOrEscape(open, ref, () => setOpen(false));

  const choose = (next: string) => {
    if (next !== current) onChange?.(next);
    setOpen(false);
  };
  const commitDraft = () => {
    const next = firstGrapheme(draft);
    if (next) choose(next);
  };

  if (!onChange) {
    return (
      <span className={`w-[26px] h-[26px] rounded-md border flex items-center justify-center text-sm shrink-0 ${barGroupBtn}`} aria-hidden="true">
        {current}
      </span>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setDraft('');
          setOpen((o) => !o);
        }}
        aria-label="Template icon"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Change the template's icon"
        className={`w-[26px] h-[26px] rounded-md border flex items-center justify-center text-sm cursor-pointer transition ${
          open ? activeBtn : barGroupBtn
        }`}
      >
        {current}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 pb-1 z-10">
          <div role="dialog" aria-label="Choose a template icon" className="tmpl-edge-panel tmpl-edge-menu tmpl-edge-menu-up rounded-xl p-1.5 flex flex-col gap-1.5 w-[11.5rem]">
            <div className="grid grid-cols-6 gap-0.5" role="listbox" aria-label="Icons">
              {TEMPLATE_ICON_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="option"
                  aria-selected={choice === current}
                  onClick={() => choose(choice)}
                  className={`h-7 rounded-md border text-base flex items-center justify-center cursor-pointer ${
                    choice === current ? activeBtn : barGhostBtn
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 pt-1.5 border-t border-[color-mix(in_oklch,var(--secondary-accent)_35%,transparent)]">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitDraft();
                }}
                placeholder="Any emoji"
                aria-label="Any emoji"
                className="flex-1 min-w-0 px-1.5 py-0.5 rounded-md bg-shade/40 border border-[var(--secondary-accent)] text-[11px] text-[var(--flyout-white)] placeholder:text-[var(--flyout-white-faint)] focus:outline-none"
              />
              <button
                type="button"
                onClick={commitDraft}
                disabled={!firstGrapheme(draft)}
                aria-label="Use this emoji"
                title="Use this emoji"
                className={`w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer disabled:cursor-default disabled:opacity-40 ${barGhostBtn}`}
              >
                <CheckIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
