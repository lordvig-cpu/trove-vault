import { supabase } from '@/lib/supabase';
import { CollectionTemplate } from '@/types/template';

export async function fetchTemplateCatalog(): Promise<CollectionTemplate[]> {
  const [{ data: templates, error: templateError }, { data: fields, error: fieldError }] =
    await Promise.all([
      supabase
        .from('collection_templates')
        .select('*')
        .order('is_system_preset', { ascending: false })
        .order('id', { ascending: true }),
      supabase
        .from('template_fields')
        .select('*')
        .order('display_order', { ascending: true }),
    ]);

  if (templateError) throw templateError;
  if (fieldError) throw fieldError;

  return (templates || []).map((template) => ({
    ...template,
    fields: (fields || []).filter((field) => field.template_id === template.id),
  }));
}
