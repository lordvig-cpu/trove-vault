'use client';

import React from 'react';
import type { FieldDefinition } from '@/types/field';
import type { FlexComponentNode, TextStyle } from '@/types/layout';
import {
  BUILTIN_LABELS,
  TEXT_PRESETS,
  applyTextPreset,
  bindingOf,
  bindingPatch,
  contentNameOf,
  displayStylesFor,
  effectiveDisplayStyle,
  effectiveTextStyle,
  isLabelShown,
  mergeTextStyle,
} from '@/lib/layoutContent';
import {
  BUILTIN_ORDER,
  CONTENT_LABEL_HINT,
  CONTENT_SOURCE_HINT,
  CONTENT_TEXT_HINT,
  DISPLAY_LABELS,
  PRESET_OPTIONS,
} from '@/components/TemplateContentControls';
import {
  BarSectionLabel,
  BarToggle,
  DeleteButton,
  EditableName,
  GroupHeading,
  GroupOption,
  ToolGroup,
  TreeGearButton,
  VisibilityButton,
  barDivider,
} from '@/components/editorBarControls';
import { activeBtn, barToggleBtn, barToggleGroup, ghostBtn, ghostTextBtn } from '@/components/editorBarStyles';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
} from '@/components/icons/TextIcons';

/* ==========================================================================
   The content toolbar: TemplateEditorContainerBar's counterpart when a content element is selected,
   in the same header slot. Name, then quick versions of the Content Properties flyout's sections --
   Shows (the binding) and Display (Content), Label (off / above / beside), Text (a starting style,
   bold / italic / underline, alignment) -- then the eye, the gear (the full flyout: static text,
   label text and style, size, color, Appearance, ...) and delete. Every edit is the same patch the
   flyout writes, so the two always agree.
   ========================================================================== */

interface TemplateEditorContentBarProps {
  component: FlexComponentNode;
  fields: FieldDefinition[];
  onUpdateComponent?: (id: string, partial: Partial<FlexComponentNode>) => void;
  onRemoveComponent?: (id: string) => void;
  onSelectNode?: (id: string | null) => void;
  isLayoutPanelOpen?: boolean;
  onOpenLayoutPanel?: () => void;
  layoutPanelSelector?: string;
  isHidden?: boolean;
  onToggleHidden?: (id: string) => void;
}

const ALIGNS: { value: NonNullable<TextStyle['align']>; title: string; icon: React.ReactNode }[] = [
  { value: 'left', title: 'Align left', icon: <TextAlignLeftIcon /> },
  { value: 'center', title: 'Align center', icon: <TextAlignCenterIcon /> },
  { value: 'right', title: 'Align right', icon: <TextAlignRightIcon /> },
];

export default function TemplateEditorContentBar({
  component,
  fields,
  onUpdateComponent,
  onRemoveComponent,
  onSelectNode,
  isLayoutPanelOpen,
  onOpenLayoutPanel,
  layoutPanelSelector,
  isHidden = false,
  onToggleHidden,
}: TemplateEditorContentBarProps) {
  const update = (partial: Partial<FlexComponentNode>) => onUpdateComponent?.(component.id, partial);
  const binding = bindingOf(component);
  // The old table / media / stat placeholder blocks have no data: name and the right-end buttons only.
  const isContent = binding !== null || component.componentType === 'field';

  const name = contentNameOf(component, fields);
  const defaultName = contentNameOf({ ...component, name: undefined }, fields);

  const sourceLabel = !binding
    ? 'Choose...'
    : binding.kind === 'builtin'
    ? BUILTIN_LABELS[binding.key]
    : binding.kind === 'field'
    ? fields.find((f) => f.id === binding.field_id)?.label ?? 'Field'
    : 'Static text';

  const styles = binding ? displayStylesFor(binding, fields) : [];
  const style = binding ? effectiveDisplayStyle(component, binding, fields) : undefined;

  const labelMode = !isLabelShown(component, binding) ? 'off' : component.contentLabel?.position ?? 'above';
  const text = effectiveTextStyle(component, binding);
  const setText = (partial: Partial<TextStyle>) => update({ textStyle: mergeTextStyle(component.textStyle, partial) });
  const isBold = (text.fontWeight ?? 400) >= 700;
  const align = text.align ?? 'left';

  return (
    <div
      className="tmpl-edge-panel tmpl-edge-panel-top select-none pointer-events-auto flex items-center px-2.5 py-2 max-w-[calc(100vw-2rem)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        {/* The eye leads, beside the name it hides. */}
        {onToggleHidden && <VisibilityButton hidden={isHidden} onToggle={() => onToggleHidden(component.id)} />}
        <EditableName
          key={component.id}
          name={name}
          placeholder={defaultName}
          allowEmpty
          ariaLabel="Content name"
          // An empty name, or one equal to the default, goes back to following the label text.
          onCommit={(next) => update({ name: next && next !== defaultName ? next : undefined })}
        />
        <span className="text-[9px] font-bold text-[var(--primary-accent)] px-1 rounded bg-[color-mix(in_oklch,var(--primary-accent)_12%,transparent)] border border-[color-mix(in_oklch,var(--primary-accent)_30%,transparent)] shrink-0">
          Content
        </span>
      </div>

      {isContent && (
        <div className="flex items-center gap-1.5 ml-8 shrink-0">
          <BarSectionLabel label="Shows" hint={CONTENT_SOURCE_HINT} />
          <ToolGroup label={sourceLabel} title="What this element shows" set={!!binding}>
            <GroupHeading label="Item" />
            {BUILTIN_ORDER.map((key) => (
              <GroupOption
                key={key}
                label={BUILTIN_LABELS[key]}
                title={`Show the item's ${BUILTIN_LABELS[key]}`}
                active={binding?.kind === 'builtin' && binding.key === key}
                onClick={() => update(bindingPatch({ kind: 'builtin', key }))}
              />
            ))}
            {fields.length > 0 && <GroupHeading label="Fields" />}
            {fields.map((f) => (
              <GroupOption
                key={f.id}
                label={f.label}
                title={`Show the ${f.label} field`}
                active={binding?.kind === 'field' && binding.field_id === f.id}
                onClick={() => update(bindingPatch({ kind: 'field', field_id: f.id }))}
              />
            ))}
            <GroupHeading label="Fixed" />
            <GroupOption
              label="Static text"
              title="Fixed text you type (edit it in the gear's Content section)"
              active={binding?.kind === 'static'}
              onClick={() => {
                if (binding?.kind !== 'static') update(bindingPatch({ kind: 'static', text: 'Your text' }));
              }}
            />
          </ToolGroup>

          {styles.length > 1 && style && (
            <ToolGroup label={DISPLAY_LABELS[style]} title="How the value is drawn">
              {styles.map((s) => (
                <GroupOption
                  key={s}
                  label={DISPLAY_LABELS[s]}
                  title={`Display as ${DISPLAY_LABELS[s]}`}
                  active={s === style}
                  onClick={() => update({ display: { ...component.display, style: s } })}
                />
              ))}
            </ToolGroup>
          )}

          <div className={barDivider} aria-hidden="true" />

          <BarSectionLabel label="Label" hint={CONTENT_LABEL_HINT} />
          <div className={barToggleGroup} role="group" aria-label="Label">
            {(
              [
                { value: 'off', label: 'Off', title: 'No label' },
                { value: 'above', label: 'Above', title: 'Label above the value' },
                { value: 'left', label: 'Beside', title: 'Label beside the value' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                title={opt.title}
                aria-pressed={labelMode === opt.value}
                onClick={() =>
                  update({
                    contentLabel:
                      opt.value === 'off'
                        ? { show: false, position: component.contentLabel?.position ?? 'above' }
                        : { show: true, position: opt.value },
                  })
                }
                className={`${barToggleBtn} cursor-pointer ${labelMode === opt.value ? `border ${activeBtn}` : ghostTextBtn}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className={barDivider} aria-hidden="true" />

          <BarSectionLabel label="Text" hint={CONTENT_TEXT_HINT} />
          <ToolGroup label="Style" title="Start from a text style (size, weight and spacing)">
            {PRESET_OPTIONS.map((p) => (
              <GroupOption
                key={p.value}
                label={`${p.label} (${TEXT_PRESETS[p.value].fontSize}px)`}
                title={`Start from the ${p.label} style`}
                onClick={() => update({ textStyle: mergeTextStyle(undefined, applyTextPreset(text, p.value)) })}
              />
            ))}
          </ToolGroup>
          <BarToggle on={isBold} title="Bold" onClick={() => setText({ fontWeight: isBold ? 400 : 700 })}>
            <BoldIcon />
          </BarToggle>
          <BarToggle on={!!text.italic} title="Italic" onClick={() => setText({ italic: text.italic ? undefined : true })}>
            <ItalicIcon />
          </BarToggle>
          <BarToggle
            on={!!text.underline}
            title="Underline"
            onClick={() => setText({ underline: text.underline ? undefined : true })}
          >
            <UnderlineIcon />
          </BarToggle>
          <div className={barToggleGroup} role="group" aria-label="Text alignment">
            {ALIGNS.map((a) => (
              <button
                key={a.value}
                type="button"
                title={a.title}
                aria-label={a.title}
                aria-pressed={align === a.value}
                onClick={() => setText({ align: a.value })}
                className={`${barToggleBtn} cursor-pointer ${align === a.value ? `border ${activeBtn}` : ghostBtn}`}
              >
                {a.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-8 shrink-0">
        <TreeGearButton
          nodeId={component.id}
          menuIdPrefix={`tree-comp-${component.id}`}
          title="Content Properties"
          onSelectNode={onSelectNode}
          isLayoutPanelOpen={isLayoutPanelOpen}
          onOpenLayoutPanel={onOpenLayoutPanel}
          layoutPanelSelector={layoutPanelSelector}
        />
        <DeleteButton title="Delete Content" onDelete={onRemoveComponent ? () => onRemoveComponent(component.id) : undefined} />
      </div>
    </div>
  );
}
