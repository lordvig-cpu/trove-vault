/** The container's current rendered size (unscaled layout px, not the zoomed CSS box) along the
    axis a split needs -- most containers are Auto with no stored width/height to halve otherwise. */
export function measureContainerPx(containerId: string, axis: 'width' | 'height'): number {
  const el = document.querySelector<HTMLElement>(`[data-container-id="${containerId}"]`);
  const measured = axis === 'width' ? el?.offsetWidth : el?.offsetHeight;
  return measured || 0;
}
