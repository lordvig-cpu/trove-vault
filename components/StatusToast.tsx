'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, WarningIcon } from '@/components/icons/PanelIcons';
import { CheckIcon } from '@/components/icons/GlyphIcons';

/** How long a message stays before it dismisses itself (held while the pointer is over it). */
const AUTO_DISMISS_MS = 5000;

interface StatusToastProps {
  message: string | null;
  kind: 'success' | 'error';
  onDismiss: () => void;
}

/**
 * A status message ("Added field ...", or what went wrong) at the top centre of the app, over the header,
 * rather than tucked inside a panel. It goes by itself after a few seconds, or with its close button.
 */
export default function StatusToast({ message, kind, onDismiss }: StatusToastProps) {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!message || isHovered) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, isHovered, onDismiss]);

  if (!message || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`status-toast ${kind === 'error' ? 'status-toast-error' : 'status-toast-success'} fixed top-2 max-w-[min(32rem,calc(100vw-2rem))] flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl text-xs font-medium`}
    >
      <span className="status-toast-icon flex shrink-0">
        {kind === 'error' ? <WarningIcon /> : <CheckIcon className="w-3.5 h-3.5" />}
      </span>
      <span className="min-w-0 truncate" title={message}>
        {message}
      </span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" title="Dismiss" className="status-toast-close shrink-0 p-1 rounded-lg cursor-pointer transition">
        <CloseIcon />
      </button>
    </div>,
    document.body
  );
}
