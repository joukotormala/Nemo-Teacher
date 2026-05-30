import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// Test with the service role key configured by the user
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Using Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Starting DB Queries with service_role key ---');
  
  console.time('parents');
  try {
    const { data, error } = await supabase.from('parents').select('*').limit(5);
    console.timeEnd('parents');
    if (error) {
      console.error('Parents query error:', error.message);
    } else {
      console.log('Parents found:', data?.length, data);
    }
  } catch (err: any) {
    console.error('Parents catch error:', err.message);
  }

  console.time('students');
  try {
    const { data, error } = await supabase.from('students').select('*').limit(5);
    console.timeEnd('students');
    if (error) {
      console.error('Students query error:', error.message);
    } else {
      console.log('Students found:', data?.length, data);
    }
  } catch (err: any) {
    console.error('Students catch error:', err.message);
  }

  console.time('conversations');
  try {
    const { data, error } = await supabase.from('conversations').select('*').limit(5);
    console.timeEnd('conversations');
    if (error) {
      console.error('Conversations query error:', error.message);
    } else {
      console.log('Conversations found:', data?.length);
    }
  } catch (err: any) {
    console.error('Conversations catch error:', err.message);
  }

  console.log('--- Done ---');
  process.exit(0);
}

run();
