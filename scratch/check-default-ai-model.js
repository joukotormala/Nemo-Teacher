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
    const { data: students, error } = await supabaseAdmin
      .from('students')
      .select('id, name_thai, name_english, preferred_ai_model')
      .limit(5);

    if (error) {
      console.log('Query failed:', error.message);
    } else {
      console.log('Students in DB:');
      students.forEach(s => {
        console.log(`Student: ${s.name_english || s.name_thai}, model in DB: "${s.preferred_ai_model}"`);
      });
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

run();
