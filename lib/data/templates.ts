import { supabase } from '@/lib/supabase';
import { toFieldDefinition, toItemTemplate, toJson } from '@/lib/data/mappers';
import type { ItemTemplate } from '@/types/template';
import type { TemplateFlexLayoutConfig } from '@/types/layout';

export interface NewTemplateInput {
  name: string;
  description: string;
  icon: string;
}

/** Creates a user (non-system) item blueprint with no fields yet. */
export async function createTemplate(input: NewTemplateInput): Promise<ItemTemplate> {
  const { data, error } = await supabase
    .from('item_templates')
    .insert({
      name: input.name,
      description: input.description,
      icon: input.icon,
      is_system_preset: false,
    })
    .select()
    .single();
  if (error) throw error;
  return toItemTemplate(data);
}

/** Every template with its fields, system presets first. */
export async function fetchTemplateCatalog(): Promise<ItemTemplate[]> {
  const [{ data: templates, error: templateError }, { data: fields, error: fieldError }] =
    await Promise.all([
      supabase
        .from('item_templates')
        .select('*')
        .order('is_system_preset', { ascending: false })
        .order('id', { ascending: true }),
      supabase
        .from('item_template_fields')
        .select('*')
        .order('display_order', { ascending: true }),
    ]);

  if (templateError) throw templateError;
  if (fieldError) throw fieldError;

  const fieldDefinitions = (fields || []).map(toFieldDefinition);
  return (templates || []).map((template) =>
    toItemTemplate(
      template,
      fieldDefinitions.filter((field) => field.template_id === template.id)
    )
  );
}

/** One template with its fields (in display order) and any stored layout. */
export async function fetchTemplate(id: number): Promise<ItemTemplate> {
  const [{ data: template, error: templateError }, { data: fields, error: fieldError }] =
    await Promise.all([
      supabase.from('item_templates').select('*').eq('id', id).single(),
      supabase
        .from('item_template_fields')
        .select('*')
        .eq('template_id', id)
        .order('display_order', { ascending: true }),
    ]);
  if (templateError) throw templateError;
  if (fieldError) throw fieldError;
  return toItemTemplate(template, (fields || []).map(toFieldDefinition));
}

export interface TemplateMetadata {
  name: string;
  description: string | null;
  icon: string;
}

export async function updateTemplateMetadata(id: number, metadata: TemplateMetadata): Promise<ItemTemplate> {
  const { data, error } = await supabase
    .from('item_templates')
    .update({
      name: metadata.name.trim(),
      description: metadata.description?.trim() || null,
      icon: metadata.icon.trim() || '📦',
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toItemTemplate(data);
}

export async function renameTemplate(id: number, name: string): Promise<void> {
  const { error } = await supabase.from('item_templates').update({ name }).eq('id', id);
  if (error) throw error;
}

export async function deleteTemplate(id: number): Promise<void> {
  const { error } = await supabase.from('item_templates').delete().eq('id', id);
  if (error) throw error;
}

/** Stores the template's layout. Throws when the database rejects it (e.g. no layout_config column yet). */
export async function saveTemplateLayout(id: number, layout: TemplateFlexLayoutConfig): Promise<void> {
  const { error } = await supabase
    .from('item_templates')
    .update({ layout_config: toJson(layout) })
    .eq('id', id);
  if (error) throw error;
}
