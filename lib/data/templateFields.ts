import { supabase } from '@/lib/supabase';
import { toFieldDefinition } from '@/lib/data/mappers';
import type { FieldDefinition, FieldType } from '@/types/field';

export interface NewFieldInput {
  templateId: number;
  name: string;
  label: string;
  fieldType: FieldType;
  options: string[] | null;
  displayOrder: number;
}

export async function createTemplateField(input: NewFieldInput): Promise<FieldDefinition> {
  const { data, error } = await supabase
    .from('item_template_fields')
    .insert({
      template_id: input.templateId,
      name: input.name,
      label: input.label,
      field_type: input.fieldType,
      options: input.options,
      is_required: false,
      display_order: input.displayOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return toFieldDefinition(data);
}

type EditableField = Pick<FieldDefinition, 'name' | 'label' | 'field_type' | 'options' | 'is_required' | 'display_order'>;

/** Saves only the properties present in `partial`. */
export async function updateTemplateField(id: number, partial: Partial<FieldDefinition>): Promise<FieldDefinition> {
  const payload: Partial<EditableField> = {};
  if (partial.name !== undefined) payload.name = partial.name;
  if (partial.label !== undefined) payload.label = partial.label;
  if (partial.field_type !== undefined) payload.field_type = partial.field_type;
  if (partial.options !== undefined) payload.options = partial.options;
  if (partial.is_required !== undefined) payload.is_required = partial.is_required;
  if (partial.display_order !== undefined) payload.display_order = partial.display_order;

  const { data, error } = await supabase
    .from('item_template_fields')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toFieldDefinition(data);
}

export async function deleteTemplateField(id: number): Promise<void> {
  const { error } = await supabase.from('item_template_fields').delete().eq('id', id);
  if (error) throw error;
}

/** Numbers the fields 1..n in the given order. Fails if any single update fails. */
export async function reorderTemplateFields(orderedFieldIds: number[]): Promise<void> {
  const results = await Promise.all(
    orderedFieldIds.map((id, index) =>
      supabase.from('item_template_fields').update({ display_order: index + 1 }).eq('id', id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
