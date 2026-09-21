import { RefObject, useEffect } from 'react';

/** While `active`, calls `onDismiss` on a pointer-down outside `ref` or on Escape. */
export function useDismissOnOutsideOrEscape(
  active: boolean,
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void
) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, ref, onDismiss]);
}
