import { createClient } from '@supabase/supabase-js'

// Supabase configuration storage keys
const SUPABASE_URL_KEY = 'dazzevent_supabase_url'
const SUPABASE_KEY_KEY = 'dazzevent_supabase_key'

export function getStoredSupabaseConfig() {
  if (typeof window === 'undefined') {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    }
  }
  const url = localStorage.getItem(SUPABASE_URL_KEY) || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = localStorage.getItem(SUPABASE_KEY_KEY) || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return { url, key }
}

export function saveSupabaseConfig(url, key) {
  if (url) localStorage.setItem(SUPABASE_URL_KEY, url.trim())
  else localStorage.removeItem(SUPABASE_URL_KEY)

  if (key) localStorage.setItem(SUPABASE_KEY_KEY, key.trim())
  else localStorage.removeItem(SUPABASE_KEY_KEY)
}

let supabaseInstance = null

export function getSupabase() {
  const { url, key } = getStoredSupabaseConfig()
  if (!url || !key) return null

  if (!supabaseInstance || supabaseInstance.supabaseUrl !== url) {
    try {
      supabaseInstance = createClient(url, key)
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err)
      return null
    }
  }
  return supabaseInstance
}

/**
 * Returns SQL setup script for Supabase
 */
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- DAZZEVENT SUPABASE SETUP SCRIPT
-- Jalankan skrip ini di Supabase SQL Editor
-- ==========================================

-- 1. Buat Tabel Acara (Events)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  venue TEXT,
  host_name TEXT,
  welcome_msg TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat Tabel Foto (Photos)
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_note TEXT,
  photo_url TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Aktifkan Realtime untuk tabel photos
ALTER PUBLICATION supabase_realtime ADD TABLE photos;

-- 4. Kebijakan Keamanan (Row Level Security) untuk akses publik
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Events" ON events FOR SELECT USING (true);
CREATE POLICY "Public Insert Events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Events" ON events FOR UPDATE USING (true);

CREATE POLICY "Public Read Photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public Insert Photos" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Photos" ON photos FOR UPDATE USING (true);
CREATE POLICY "Public Delete Photos" ON photos FOR DELETE USING (true);

-- 5. Buat Storage Bucket untuk foto beresolusi tinggi
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Bucket Access" ON storage.objects
FOR ALL USING (bucket_id = 'event-photos')
WITH CHECK (bucket_id = 'event-photos');
`
