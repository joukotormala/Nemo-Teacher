import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
// Strip leading/trailing quotes if present
supabaseUrl = supabaseUrl.replace(/^['"]|['"]$/g, '').trim();

if (!supabaseUrl || supabaseUrl === 'undefined') {
  supabaseUrl = 'https://placeholder-url-during-build.supabase.co';
}

let supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
// Strip leading/trailing quotes if present
supabaseAnonKey = supabaseAnonKey.replace(/^['"]|['"]$/g, '').trim();

if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  supabaseAnonKey = 'placeholder-key-during-build';
}

let serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
serviceRoleKey = serviceRoleKey.replace(/^['"]|['"]$/g, '').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseAnonKey);

