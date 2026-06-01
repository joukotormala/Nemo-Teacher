const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.log('List users failed with error:', error.message);
    } else {
      console.log('List users succeeded! Total auth users:', data.users ? data.users.length : null);
    }
  } catch (err) {
    console.error('Fatal admin api error:', err.message);
  }
}

run();
