import { FieldDefinition } from './field';

export interface CollectionTemplate {
  id: number;
  name: string;
  description: string | null;
  icon: string;
  is_system_preset: boolean;
  fields?: FieldDefinition[];
}