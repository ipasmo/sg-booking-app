import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Supabase client with service role key (server-side only, never expose to frontend)
export const supabase = createClient(supabaseUrl, supabaseKey);

/** Returns true if Supabase is configured (not just placeholder values) */
export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.startsWith('https://') &&
    supabaseKey.length > 20
  );
}
