'use client';

import React, { useId } from 'react';
import Image from 'next/image';
import { ActionMenuSection } from '@/components/TreeSubMenu';
import { PropertiesSaveBar, PropertyField } from '@/components/TreeMenuProperties';
import FieldValueInput from '@/components/item-form/FieldValueInput';
import { CameraIcon, FileIcon, ImageIcon, ListIcon } from '@/components/icons/ContentIcons';
import { TagIcon } from '@/components/icons/GlyphIcons';
import { AdHocAttributeRows } from '@/components/item-form/AdHocAttributesEditor';
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_MAX_BYTES } from '@/lib/storage';
import { idleBtn, menuTextBtn } from '@/components/editorBarStyles';
import type { useItemEditor } from '@/hooks/useItemEditor';

export type ItemPropertySection = 'template' | 'photo' | 'fields' | 'custom';

interface TreeItemPropertiesProps {
  /** The item's editor (useItemEditor), owned by the flyout so unsaved edits survive it closing. */
  editor: ReturnType<typeof useItemEditor>;
  /** Which cards are open, owned by the flyout for the same reason. */
  openSections: Record<ItemPropertySection, boolean>;
  onToggleSection: (section: ItemPropertySection) => void;
  /** Runs after a successful save (refreshes the workspace data). */
  onSaved?: () => void;
}

const INPUT = 'actionMenuRenameInput w-full';

/**
 * An item flyout's Properties tab: everything the Edit Item modal edits -- name, template, photo, the
 * template's fields and extra custom fields -- as the template flyouts' cards, saved together with Save
 * (useItemEditor: the modal's own load and save).
 */
export default function TreeItemProperties({ editor, openSections, onToggleSection, onSaved }: TreeItemPropertiesProps) {
  const { form, isLoaded, isDirty, save, revert } = editor;
  const formId = useId();
  if (!isLoaded) {
    return <p className="px-3 py-3 text-[11px] text-content-muted">{form.error ?? 'Loading...'}</p>;
  }

  const fields = form.activeTemplateFields;
  const template = form.availableTemplates.find((t) => t.id === form.selectedTemplateId);
  const imageUrl = form.previewUrl || form.existingImageUrl;

  return (
    <form
      id={formId}
      // noValidate: a required field inside a closed card isn't rendered, so the browser couldn't check it --
      // they are checked here instead, whichever cards are open
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const missing = fields.filter((field) => {
          const value = form.dynamicValues[field.name];
          return field.is_required && field.field_type !== 'boolean' && (value === undefined || value === null || value === '');
        });
        if (missing.length > 0) {
          form.setError(`Fill in the required field${missing.length === 1 ? '' : 's'}: ${missing.map((field) => field.label).join(', ')}`);
          if (!openSections.fields) onToggleSection('fields');
          return;
        }
        void save(onSaved);
      }}
      className="pt-1"
    >
      <PropertyField label="Item Name" required flush>
        <input type="text" required value={form.name} onChange={(e) => form.setName(e.target.value)} className={INPUT} />
      </PropertyField>

      <ActionMenuSection
        label="Template"
        icon={<FileIcon className="w-5 h-5" />}
        subtitle={template ? template.name : 'No template'}
        isOpen={openSections.template}
        onToggle={() => onToggleSection('template')}
      >
        <div className="px-3 pt-0 pb-2 flex flex-col gap-1.5">
          <select value={form.selectedTemplateId || 'blank'} onChange={(e) => form.selectTemplate(e.target.value)} className={INPUT}>
            {form.availableTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name} ({t.fields?.length || 0} fields)
              </option>
            ))}
            <option value="blank">Blank / Custom (No Template)</option>
          </select>
        </div>
      </ActionMenuSection>

      <ActionMenuSection
        label="Photo"
        icon={<ImageIcon className="w-5 h-5" />}
        subtitle={form.selectedFile ? 'New photo, saved with Save' : imageUrl ? 'Has a photo' : 'No photo'}
        isOpen={openSections.photo}
        onToggle={() => onToggleSection('photo')}
      >
        <div className="px-3 pt-0 pb-2">
          {imageUrl ? (
            <div className="flex flex-col gap-1.5">
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border-subtle bg-surface-popover">
                <Image src={imageUrl} alt="Item photo" fill unoptimized className="object-contain" />
              </div>
              <div className="actionMenuRenameActions">
                <button type="button" onClick={form.removeImage} className={`${menuTextBtn} menuBtnAction ${idleBtn}`}>
                  Remove
                </button>
                <label className={`${menuTextBtn} menuBtnAction ${idleBtn}`}>
                  Replace
                  <input type="file" accept={IMAGE_UPLOAD_ACCEPT} onChange={form.chooseFile} className="sr-only" />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-subtle p-3 cursor-pointer text-content-muted hover:text-content-primary transition">
              <CameraIcon className="w-5 h-5" />
              <span className="text-[11px] font-medium">Choose a photo</span>
              <span className="text-[10px]">PNG, JPG, WEBP, GIF or AVIF up to {IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024)}MB</span>
              <input type="file" accept={IMAGE_UPLOAD_ACCEPT} onChange={form.chooseFile} className="sr-only" />
            </label>
          )}
        </div>
      </ActionMenuSection>

      {fields.length > 0 && (
        <ActionMenuSection
          label="Fields"
          icon={<ListIcon className="w-5 h-5" />}
          subtitle={template?.name ?? 'The template'}
          isOpen={openSections.fields}
          onToggle={() => onToggleSection('fields')}
        >
          <div className="pt-0 pb-1">
            {fields.map((field) => (
              <PropertyField key={field.id} label={field.label} required={field.is_required}>
                <FieldValueInput
                  field={field}
                  value={form.dynamicValues[field.name]}
                  onChange={form.changeDynamicValue}
                  inputClassName={INPUT}
                  checkboxLabelClassName="text-content-primary"
                />
              </PropertyField>
            ))}
          </div>
        </ActionMenuSection>
      )}

      <ActionMenuSection
        label="Custom Fields"
        icon={<TagIcon className="w-5 h-5" />}
        subtitle="Extra values beyond the template"
        isOpen={openSections.custom}
        onToggle={() => onToggleSection('custom')}
      >
        <div className="px-3 pt-0 pb-2 flex flex-col gap-1.5">
          <AdHocAttributeRows
            attributes={form.adHocAttributes}
            onChange={form.changeAdHocRow}
            onRemove={form.removeAdHocRow}
            rowClassName="flex gap-1.5 items-center"
            inputClassName={`${INPUT} min-w-0`}
            removeClassName="shrink-0 p-1 rounded text-content-muted hover:text-danger-text cursor-pointer"
            removeIconClassName="w-3 h-3"
          />
          <div className="actionMenuRenameActions">
            <button type="button" onClick={form.addAdHocRow} className={`${menuTextBtn} menuBtnAction ${idleBtn}`}>
              + Add Custom Field
            </button>
          </div>
        </div>
      </ActionMenuSection>

      <PropertiesSaveBar
        formId={formId}
        isDirty={isDirty}
        saving={form.submitting}
        error={form.error}
        canSave={Boolean(form.name.trim())}
        onRevert={revert}
      />
    </form>
  );
}
