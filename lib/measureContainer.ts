import type { FlexContainerNode } from '@/types/layout';

/** The container's current rendered size (unscaled layout px, not the zoomed CSS box) along the
    axis a split needs -- most containers are Auto with no stored width/height to halve otherwise. */
export function measureContainerPx(containerId: string, axis: 'width' | 'height'): number {
  const el = document.querySelector<HTMLElement>(`[data-container-id="${containerId}"]`);
  const measured = axis === 'width' ? el?.offsetWidth : el?.offsetHeight;
  return measured || 0;
}

/** The update that switches a container to Custom sizing at its current on-screen width, so nothing jumps --
    it only reveals the resize handles. Used by both the top toolbar's Custom and the flyout's. A stale value
    remembered from an earlier Custom session would otherwise pop back in. */
export function customSizingAtCurrentWidth(container: FlexContainerNode): Pick<FlexContainerNode, 'width' | 'sizing'> {
  const measured = measureContainerPx(container.id, 'width');
  const value = measured
    ? `${Math.round(measured)}px`
    : container.sizing?.type === 'fixed'
    ? container.sizing.value || '50%'
    : '50%';
  return { width: value, sizing: { type: 'fixed', value } };
}
