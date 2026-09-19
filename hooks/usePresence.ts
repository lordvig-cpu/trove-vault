'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const client = () => true;
const server = () => false;

/** Share portal hydration and delayed removal without effect-driven opening. */
export function usePresence(isOpen: boolean, duration: number, animate = true) {
  const mounted = useSyncExternalStore(subscribe, client, server);
  const [retained, setRetained] = useState(isOpen);
  const [previousOpen, setPreviousOpen] = useState(isOpen);
  if (previousOpen !== isOpen) {
    setPreviousOpen(isOpen);
    if (isOpen) setRetained(true);
  }
  const isClosing = !isOpen && retained && animate;
  useEffect(() => {
    if (isOpen || !retained) return;
    const timer = setTimeout(() => setRetained(false), animate ? duration : 0);
    return () => clearTimeout(timer);
  }, [isOpen, retained, animate, duration]);
  return { mounted, renderMenu: isOpen || isClosing, isClosing };
}
