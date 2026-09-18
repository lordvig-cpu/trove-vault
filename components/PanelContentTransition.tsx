'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useUIPreferences } from '@/context/UIPreferencesContext';

/** Retain outgoing content briefly while the sidebar shell stays mounted. */
export default function PanelContentTransition({
  contentKey,
  suppressTransition = false,
  children,
}: {
  contentKey: string;
  suppressTransition?: boolean;
  children: React.ReactNode;
}) {
  const { animationsEnabled } = useUIPreferences();
  const [displayedKey, setDisplayedKey] = useState(contentKey);
  const [reducedMotion, setReducedMotion] = useState(false);
  const retainedContent = useRef(children);
  const [transitionContext, setTransitionContext] = useState({
    key: contentKey,
    suppressed: suppressTransition,
    skip: suppressTransition,
  });
  // Suppress both the moving clone's departure and its handoff back to the sidebar.
  if (transitionContext.key !== contentKey || transitionContext.suppressed !== suppressTransition) {
    setTransitionContext({
      key: contentKey,
      suppressed: suppressTransition,
      skip: transitionContext.key !== contentKey
        ? suppressTransition || transitionContext.suppressed
        : suppressTransition || transitionContext.skip,
    });
  }
  const animate = animationsEnabled && !reducedMotion && !suppressTransition && !transitionContext.skip;
  if (!animate && displayedKey !== contentKey) setDisplayedKey(contentKey);
  const isExiting = animate && displayedKey !== contentKey;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isExiting) retainedContent.current = children;
  }, [children, isExiting]);

  useEffect(() => {
    if (displayedKey === contentKey) return;
    const timer = setTimeout(() => setDisplayedKey(contentKey), animate ? 160 : 0);
    return () => clearTimeout(timer);
  }, [contentKey, displayedKey, animate]);

  return (
    <div
      key={animate ? displayedKey : contentKey}
      className={`flex flex-1 min-h-0 flex-col ${animate ? isExiting ? 'panel-content-exit' : 'panel-content-enter' : ''}`}
      inert={isExiting}
      aria-hidden={isExiting || undefined}
    >
      {isExiting ? retainedContent.current : children}
    </div>
  );
}
