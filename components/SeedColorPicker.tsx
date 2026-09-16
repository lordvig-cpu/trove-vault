'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Hsv = { h: number; s: number; v: number };
const clamp = (value: number) => Math.max(0, Math.min(100, value));

function fromHex(hex: string): Hsv {
  const [r, g, b] = hex.slice(1).match(/../g)!.map(c => parseInt(c, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const h = !delta ? 0 : max === r ? ((g - b) / delta + 6) % 6
    : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return { h: h * 60, s: max ? delta / max * 100 : 0, v: max * 100 };
}

function toHex({ h, s, v }: Hsv): string {
  const c = v / 100 * s / 100, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v / 100 - c;
  const rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + rgb.map(n => Math.round((n + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export default function SeedColorPicker({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; bottom: number } | null>(null);

  useEffect(() => {
    if (!position) return;
    function outside(event: PointerEvent) {
      if (!panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setPosition(null);
    }
    function dismiss() { setPosition(null); }
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', dismiss);
    };
  }, [position]);

  return (
    <>
      <button
        ref={trigger}
        className="oklch-seed-picker"
        type="button"
        style={{ backgroundColor: value }}
        aria-label={`Choose ${label.toLowerCase()} color`}
        title={`Choose ${label.toLowerCase()} color`}
        aria-expanded={!!position}
        aria-controls={position ? id : undefined}
        aria-haspopup="dialog"
        onClick={() => {
          if (position) { setPosition(null); return; }
          const rect = trigger.current!.getBoundingClientRect();
          setPosition({
            left: Math.max(8, Math.min(rect.left, window.innerWidth - 256)),
            bottom: window.innerHeight - rect.top + 8,
          });
        }}
      />
      {position && createPortal(
        <div
          ref={panel}
          id={id}
          role="dialog"
          aria-label={`${label} color`}
          className="seed-color-popover"
          style={position}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              setPosition(null);
              trigger.current?.focus();
            }
          }}
          onBlur={event => {
            if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)
              && event.relatedTarget !== trigger.current) setPosition(null);
          }}
        >
          <ColorPlane label={label} value={value} onChange={onChange} />
        </div>, document.body
      )}
    </>
  );
}

function ColorPlane({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const plane = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [selection, setSelection] = useState(() => ({ ...fromHex(value), hex: value }));
  // Retain hue at black/white and full precision while dragging. External HEX
  // edits still synchronize the picker without an effect-driven update loop.
  const hsv = selection.hex === value ? selection : fromHex(value);
  useEffect(() => { plane.current?.focus(); }, []);

  function update(next: Hsv) {
    const hex = toHex(next);
    setSelection({ ...next, hex });
    onChange(hex);
  }

  function pick(x: number, y: number) {
    const rect = plane.current!.getBoundingClientRect();
    update({ ...hsv, s: clamp((x - rect.left) / rect.width * 100), v: clamp((1 - (y - rect.top) / rect.height) * 100) });
  }

  return (
    <>
      <div
        ref={plane}
        className="seed-color-plane"
        style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
        tabIndex={0}
        role="slider"
        aria-label={`${label} saturation and brightness`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s)}
        aria-valuetext={`${Math.round(hsv.s)}% saturation, ${Math.round(hsv.v)}% brightness`}
        aria-describedby={hintId}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          pick(event.clientX, event.clientY);
        }}
        onPointerMove={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) pick(event.clientX, event.clientY);
        }}
        onPointerUp={event => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onKeyDown={event => {
          const step = event.shiftKey ? 10 : 1;
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            update({ ...hsv,
              s: event.key === 'Home' ? 0 : event.key === 'End' ? 100 : clamp(hsv.s + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0)),
              v: clamp(hsv.v + (event.key === 'ArrowUp' ? step : event.key === 'ArrowDown' ? -step : 0)),
            });
          }
        }}
      >
        <span className="seed-color-cursor" style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} />
      </div>
      <span className="sr-only" id={hintId}>Left and right change saturation. Up and down change brightness. Hold Shift for larger steps. Escape closes the picker.</span>
      <input
        type="range"
        className="seed-color-hue"
        min={0}
        max={360}
        step={1}
        value={hsv.h}
        aria-label={`${label} hue`}
        aria-valuetext={`${Math.round(hsv.h)} degrees`}
        onChange={event => update({ ...hsv, h: Number(event.target.value) })}
      />
    </>
  );
}
