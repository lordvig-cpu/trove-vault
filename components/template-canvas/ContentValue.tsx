'use client';

import React from 'react';
import Image from 'next/image';
import type { FieldDefinition } from '@/types/field';
import type { ContentBinding, ContentDisplayStyle, FlexComponentNode } from '@/types/layout';
import { useContentData } from '@/context/ContentDataContext';
import {
  effectiveDisplayStyle,
  effectiveLabelStyle,
  effectiveTextStyle,
  formatDate,
  isLabelShown,
  labelTextOf,
  resolveValue,
  textStyleCss,
  type ResolvedValue,
} from '@/lib/layoutContent';
import { CheckIcon } from '@/components/icons/GlyphIcons';
import { CameraIcon } from '@/components/icons/ContentIcons';

/* ==========================================================================
   CONTENT VALUE
   Draws one bound content element: its label (when shown) and its value in the chosen display style,
   with the element's own typography. Used by the editor canvas in both modes and, later, the item
   view. It has no layout, spacing or size of its own: its container positions and sizes it.
   ========================================================================== */

const EMPTY = '—';

/** A small tinted capsule: the badge / pill / chip look, drawn from the theme's accent. */
const CAPSULE =
  'inline-flex items-center px-2 py-0.5 rounded-full border border-[color-mix(in_oklch,var(--primary-accent)_40%,transparent)] bg-[color-mix(in_oklch,var(--primary-accent)_14%,transparent)]';

function BooleanValue({ value, style }: { value: boolean | null; style: ContentDisplayStyle }) {
  if (value === null) return <span>{EMPTY}</span>;
  if (style === 'yesno') return <span>{value ? 'Yes' : 'No'}</span>;
  if (style === 'pill') return <span className={CAPSULE}>{value ? 'Yes' : 'No'}</span>;
  if (style === 'toggle') {
    return (
      <span
        role="img"
        aria-label={value ? 'On' : 'Off'}
        className={`relative inline-block w-8 h-[18px] rounded-full border border-[var(--primary-border-strong)] ${
          value ? 'bg-[var(--primary-accent)]' : 'bg-[color-mix(in_oklab,var(--text-muted)_25%,transparent)]'
        }`}
      >
        <span
          className={`absolute top-[2px] w-3 h-3 rounded-full bg-[var(--pole-label)] transition-all ${
            value ? 'left-[16px]' : 'left-[2px]'
          }`}
        />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={value ? 'Checked' : 'Unchecked'}
      className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded border border-[var(--primary-border-strong)] ${
        value ? 'bg-[var(--primary-accent)] text-[var(--pole-label)]' : ''
      }`}
    >
      {value && <CheckIcon className="w-3 h-3" />}
    </span>
  );
}

function ImageValue({ url, style, aspectRatio, alt }: { url: string | null; style: ContentDisplayStyle; aspectRatio?: string; alt: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-md"
      style={{ aspectRatio: aspectRatio || '4 / 3' }}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          className={style === 'image-contain' ? 'object-contain' : 'object-cover'}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center border border-dashed border-[var(--primary-border-subtle)] rounded-md text-[var(--text-muted)]">
          <CameraIcon className="w-6 h-6 opacity-60" />
        </div>
      )}
    </div>
  );
}

function renderValue(
  resolved: ResolvedValue,
  style: ContentDisplayStyle,
  aspectRatio: string | undefined,
  alt: string
): React.ReactNode {
  switch (resolved.kind) {
    case 'image':
      return <ImageValue url={resolved.value} style={style} aspectRatio={aspectRatio} alt={alt} />;
    case 'boolean':
      return <BooleanValue value={resolved.value} style={style} />;
    case 'number': {
      if (resolved.value === null) return EMPTY;
      const shown = resolved.value.toLocaleString('en-US');
      if (style === 'badge') return <span className={CAPSULE}>{shown}</span>;
      return <span className={style === 'stat' ? 'tabular-nums' : undefined}>{shown}</span>;
    }
    case 'date':
      return resolved.value ? formatDate(resolved.value, style) : EMPTY;
    case 'list':
      if (resolved.value.length === 0) return EMPTY;
      return style === 'chips' ? (
        <span className="flex flex-wrap gap-1">
          {resolved.value.map((name, i) => (
            <span key={`${name}-${i}`} className={CAPSULE}>{name}</span>
          ))}
        </span>
      ) : (
        <ul className="list-disc pl-4 m-0">
          {resolved.value.map((name, i) => (
            <li key={`${name}-${i}`}>{name}</li>
          ))}
        </ul>
      );
    default:
      if (!resolved.value) return EMPTY;
      return style === 'badge' ? <span className={CAPSULE}>{resolved.value}</span> : resolved.value;
  }
}

export default function ContentValue({
  component,
  binding,
  fields,
}: {
  component: FlexComponentNode;
  binding: ContentBinding;
  fields: FieldDefinition[];
}) {
  const data = useContentData();
  const resolved = resolveValue(binding, data, fields);
  const displayStyle = effectiveDisplayStyle(component, binding, fields);
  const labelText = labelTextOf(component, binding, fields);
  const showLabel = isLabelShown(component, binding) && labelText !== '';
  const labelBeside = component.contentLabel?.position === 'left';
  const valueStyle = effectiveTextStyle(component, binding);

  return (
    <div
      className={`flex min-w-0 ${labelBeside ? 'flex-row items-baseline gap-2' : 'flex-col gap-1'}`}
    >
      {showLabel && (
        <span
          className="text-[var(--text-muted)] shrink-0"
          style={textStyleCss(effectiveLabelStyle(component))}
        >
          {labelText}
        </span>
      )}
      <div className="min-w-0 break-words text-[var(--text-primary)]" style={textStyleCss(valueStyle)}>
        {renderValue(resolved, displayStyle, component.display?.aspectRatio, labelText || 'Image')}
      </div>
    </div>
  );
}
