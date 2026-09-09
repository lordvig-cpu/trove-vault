'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useActionMenu(id: string, defaultMenuHeight: number = 215) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const activeGearRectRef = useRef<DOMRect | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);

  // Listen for other action menus opening across ANY tree instance
  useEffect(() => {
    const handleGlobalMenuOpen = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail !== id) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsMenuOpen(false);
        setIsRenaming(false);
      }
    };

    window.addEventListener('trove-action-menu-open', handleGlobalMenuOpen);
    return () => {
      window.removeEventListener('trove-action-menu-open', handleGlobalMenuOpen);
    };
  }, [id]);

  const computeCoordinates = useCallback(
    (rect: DOMRect, menuHeight: number) => {
      const bottomNavReserve = 64;
      const maxAllowedTop = window.innerHeight - menuHeight - bottomNavReserve;

      let calculatedTop = Math.round(rect.top - 4);
      if (calculatedTop > maxAllowedTop) {
        calculatedTop = Math.max(16, maxAllowedTop);
      }

      return {
        top: calculatedTop,
        left: Math.round(rect.right + 6),
      };
    },
    []
  );

  const handleGearMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, customHeight?: number) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const rect = e.currentTarget.getBoundingClientRect();
      activeGearRectRef.current = rect;

      const height = customHeight ?? defaultMenuHeight;
      setMenuCoords(computeCoordinates(rect, height));

      // Broadcast to all other trees to close immediately
      window.dispatchEvent(
        new CustomEvent('trove-action-menu-open', { detail: id })
      );

      setIsMenuOpen(true);
    },
    [id, defaultMenuHeight, computeCoordinates]
  );

  useEffect(() => {
    if (!isMenuOpen || !activeGearRectRef.current) return;
    const expandedHeight = defaultMenuHeight + (isRenaming ? 42 : 0);
    setMenuCoords(computeCoordinates(activeGearRectRef.current, expandedHeight));
  }, [isRenaming, isMenuOpen, defaultMenuHeight, computeCoordinates]);

  const handleMenuMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isRenaming) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      setIsRenaming(false);
    }, 350);
  }, [isRenaming]);

  const closeMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsMenuOpen(false);
    setIsRenaming(false);
  }, []);

  return {
    isMenuOpen,
    menuCoords,
    isRenaming,
    setIsRenaming,
    handleGearMouseEnter,
    handleMenuMouseEnter,
    handleMouseLeave,
    closeMenu,
  };
}