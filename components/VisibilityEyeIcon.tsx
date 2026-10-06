'use client';

import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/icons/LayoutIcons';

/**
 * The show / hide eye (Layout-tree rows and the selection toolbars): an open eye while shown, a slashed
 * one while hidden. Whenever `hidden` changes after the first render -- from a click here, or from the
 * other place the same node can be toggled -- it blinks (squints shut and opens on the new state; the
 * `.eye-blink` keyframes in TreePrimitives.css). The first render never blinks, so a tree full of eyes
 * doesn't all animate at once.
 */
export default function VisibilityEyeIcon({ hidden, className }: { hidden: boolean; className?: string }) {
  const [prevHidden, setPrevHidden] = useState(hidden);
  const [blinks, setBlinks] = useState(0);
  if (prevHidden !== hidden) {
    setPrevHidden(hidden);
    setBlinks(blinks + 1);
  }
  return (
    // Keyed on the blink count, so each toggle remounts the wrapper and the animation plays again.
    <span key={blinks} className={`inline-flex ${blinks > 0 ? 'eye-blink' : ''}`}>
      {hidden ? <EyeOffIcon className={className} /> : <EyeIcon className={className} />}
    </span>
  );
}
