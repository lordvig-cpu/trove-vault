import { supabase } from '@/lib/supabase';
import { toItemTemplate } from '@/lib/data/mappers';
import type { ItemTemplate } from '@/types/template';

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
