-- =============================================================================
-- UNIVERSAL COLLECTIONS APP — TEARDOWN & REBUILD SCRIPT
-- =============================================================================

-- 1. CLEAN TEARDOWN
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP FUNCTION IF EXISTS update_sys_updated_at_column CASCADE;

-- 2. GLOBAL SYSTEM TRIGGERS
CREATE OR REPLACE FUNCTION update_sys_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.sys_updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- 3. COLLECTIONS TABLE
CREATE TABLE collections (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sys_active BOOLEAN DEFAULT true,
  sys_created_at TIMESTAMPTZ DEFAULT NOW(),
  sys_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_sys_updated_at_column();

-- 4. ITEMS TABLE (Hierarchical with JSONB attributes)
CREATE TABLE items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  collection_id BIGINT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  attributes JSONB DEFAULT '{}'::jsonb,
  sys_active BOOLEAN DEFAULT true,
  sys_created_at TIMESTAMPTZ DEFAULT NOW(),
  sys_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER tr_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_sys_updated_at_column();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Allow public insert collections" ON collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update collections" ON collections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete collections" ON collections FOR DELETE USING (true);

CREATE POLICY "Allow public read items" ON items FOR SELECT USING (true);
CREATE POLICY "Allow public insert items" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update items" ON items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete items" ON items FOR DELETE USING (true);

-- 6. SEED DATA (With Explicit IDs to Guarantee Tree Linking)
INSERT INTO collections (id, name, description)
OVERRIDING SYSTEM VALUE
VALUES (1, 'Test Collection', 'A test collection with nested item hierarchy');

-- Root Items (parent_id = NULL)
INSERT INTO items (id, collection_id, parent_id, name, attributes)
OVERRIDING SYSTEM VALUE
VALUES 
  (1, 1, NULL, 'Item 1', '{"condition": "Mint", "rarity": "Common"}'::jsonb),
  (2, 1, NULL, 'Item 2', '{"condition": "Good", "rarity": "Uncommon"}'::jsonb),
  (3, 1, NULL, 'Item 3', '{"condition": "Near Mint", "rarity": "Rare"}'::jsonb);

-- Sub-Items under Item 3 (id: 3)
INSERT INTO items (id, collection_id, parent_id, name, attributes)
OVERRIDING SYSTEM VALUE
VALUES 
  (4, 1, 3, 'Sub-item 3A (Part 1)', '{"part_number": "A-01"}'::jsonb),
  (5, 1, 3, 'Sub-item 3B (Part 2)', '{"part_number": "A-02"}'::jsonb);

-- Sub-sub-item under Sub-item 3B (id: 5)
INSERT INTO items (id, collection_id, parent_id, name, attributes)
OVERRIDING SYSTEM VALUE
VALUES 
  (6, 1, 5, 'Sub-sub-item 3B', '{"scale": "1:18"}'::jsonb);

-- 7. SYNCHRONIZE IDENTITY SEQUENCES (Prevents future insert collisions)
SELECT setval(pg_get_serial_sequence('collections', 'id'), COALESCE(max(id), 1) + 1, false) FROM collections;
SELECT setval(pg_get_serial_sequence('items', 'id'), COALESCE(max(id), 1) + 1, false) FROM items;