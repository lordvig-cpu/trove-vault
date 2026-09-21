/**
 * Database types for the Supabase client, written by hand from `.supabase/schema.sql` in the same
 * shape the Supabase CLI generates (`supabase gen types typescript`). When the CLI is set up,
 * regenerate this file and keep `Json` and `Database` as the exported names; the app's own record
 * types (ItemRecord, ItemTemplate, ...) are produced from these rows in `lib/data/mappers.ts`.
 *
 * Keep in sync with schema.sql. `item_templates.layout_config` is NOT in schema.sql yet (see the
 * "To do before real template saving" section of CLAUDE.md).
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      collections: {
        Row: {
          id: number;
          parent_id: number | null;
          name: string;
          description: string | null;
          icon: string | null;
          sys_active: boolean | null;
          sys_created_by: string | null;
          sys_updated_by: string | null;
          sys_created_at: string | null;
          sys_updated_at: string | null;
        };
        Insert: {
          id?: number;
          parent_id?: number | null;
          name: string;
          description?: string | null;
          icon?: string | null;
          sys_active?: boolean | null;
          sys_created_by?: string | null;
          sys_updated_by?: string | null;
          sys_created_at?: string | null;
          sys_updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['collections']['Insert']>;
        Relationships: [];
      };
      item_templates: {
        Row: {
          id: number;
          user_id: string | null;
          name: string;
          description: string | null;
          icon: string | null;
          is_system_preset: boolean;
          sys_created_at: string | null;
          sys_updated_at: string | null;
          layout_config?: Json | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          name: string;
          description?: string | null;
          icon?: string | null;
          is_system_preset?: boolean;
          sys_created_at?: string | null;
          sys_updated_at?: string | null;
          layout_config?: Json | null;
        };
        Update: Partial<Database['public']['Tables']['item_templates']['Insert']>;
        Relationships: [];
      };
      item_template_fields: {
        Row: {
          id: number;
          template_id: number;
          name: string;
          label: string;
          field_type: string;
          options: Json | null;
          is_required: boolean;
          display_order: number;
          sys_created_at: string | null;
          sys_updated_at: string | null;
        };
        Insert: {
          id?: number;
          template_id: number;
          name: string;
          label: string;
          field_type?: string;
          options?: Json | null;
          is_required?: boolean;
          display_order?: number;
          sys_created_at?: string | null;
          sys_updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['item_template_fields']['Insert']>;
        Relationships: [];
      };
      items: {
        Row: {
          id: number;
          template_id: number | null;
          parent_id: number | null;
          name: string;
          attributes: Json | null;
          sys_active: boolean | null;
          sys_created_by: string | null;
          sys_updated_by: string | null;
          sys_created_at: string | null;
          sys_updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          template_id?: number | null;
          parent_id?: number | null;
          name: string;
          attributes?: Json | null;
          sys_active?: boolean | null;
          sys_created_by?: string | null;
          sys_updated_by?: string | null;
          sys_created_at?: string | null;
          sys_updated_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['items']['Insert']>;
        Relationships: [];
      };
      item_collections: {
        Row: {
          item_id: number;
          collection_id: number;
          sys_created_by: string | null;
          sys_created_at: string | null;
        };
        Insert: {
          item_id: number;
          collection_id: number;
          sys_created_by?: string | null;
          sys_created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['item_collections']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
