import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
if (!supabaseUrl || supabaseUrl === 'undefined') {
  supabaseUrl = 'https://placeholder-url-during-build.supabase.co';
}

let supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  supabaseAnonKey = 'placeholder-key-during-build';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey);

