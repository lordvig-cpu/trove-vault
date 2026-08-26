interface PinIconProps {
  className?: string;
}

// Unpinned: Upright outline -> fills white & rotates 45° to preview the pinned state
export function PinOutlineIcon({ className = 'w-4 h-4' }: PinIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="transparent"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} transition-all duration-200 ease-out group-hover:fill-white group-hover:stroke-white group-hover:rotate-45`}
    >
      <path d="M12 17v5" />
      <path d="M9 2h6" />
      <path d="M10 2v5.5L7 11v2h10v-2l-3-3.5V2" />
      <path d="M7 13h10" />
    </svg>
  );
}

// Pinned: 45° solid pin -> clears fill to transparent outline & rotates upright (-45°) to preview the unpinned state
export function PinFilledIcon({ className = 'w-4 h-4' }: PinIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} transition-all duration-200 ease-out group-hover:fill-transparent group-hover:stroke-white group-hover:-rotate-45`}
    >
      <path d="M16.5 3.5a1 1 0 0 1 1.4 0l2.6 2.6a1 1 0 0 1 0 1.4l-2 2-1.5-1.5-3.5 3.5 1 4-1.5 1.5-3.5-3.5-5 5-1-1 5-5-3.5-3.5 1.5-1.5 4 1 3.5-3.5-1.5-1.5 2-2z" />
    </svg>
  );
}