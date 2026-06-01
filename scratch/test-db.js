const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('URL:', supabaseUrl);
console.log('Anon key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('Service role key length:', serviceRoleKey ? serviceRoleKey.length : 0);

// Decode service role key to inspect it
try {
  const payload = serviceRoleKey.split('.')[1];
  const decoded = Buffer.from(payload, 'base64').toString('utf8');
  console.log('Decoded service role key payload:', decoded);
} catch (e) {
  console.log('Could not decode service role key:', e.message);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: parentsAnon, error: errAnon } = await supabase.from('parents').select('*');
  console.log('Anon Query Parents count:', parentsAnon ? parentsAnon.length : null);
  if (errAnon) console.error('Anon Error:', errAnon.message);

  const { data: parentsAdmin, error: errAdmin } = await supabaseAdmin.from('parents').select('*');
  console.log('Admin Query Parents count:', parentsAdmin ? parentsAdmin.length : null);
  if (errAdmin) console.error('Admin Error:', errAdmin.message);

  const { data: studentsAdmin, error: errStudents } = await supabaseAdmin.from('students').select('*');
  console.log('Admin Query Students count:', studentsAdmin ? studentsAdmin.length : null);
  if (errStudents) console.error('Admin Error:', errStudents.message);
}

run();
