import { supabase } from '@/lib/supabase';
import { toFieldDefinition, toItemTemplate } from '@/lib/data/mappers';
import { ItemTemplate } from '@/types/template';

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
