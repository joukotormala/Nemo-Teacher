import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihuchnabexntvpwnpown.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlodWNobmFiZXhudHZwd25wb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY4NjU1MSwiZXhwIjoyMDk1MjYyNTUxfQ.jqJ058OfQiJnZEeLWj2zm9VPfbQHQgJaHpHwNChuvXc';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: 'public' },
});

async function main() {
  // Step 1: Create an RPC function that runs our SQL  
  const createFnRes = await fetch(`${supabaseUrl}/rest/v1/rpc/add_llama_8b_model`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  
  const createFnText = await createFnRes.text();
  console.log('RPC attempt:', createFnRes.status, createFnText);
  
  // Since we can't create RPC functions via REST, we need the SQL editor.
  // Let's try the alternative: change column type to TEXT using ALTER via pg_net or similar
  
  // Actually, let's check if we can use the Supabase Management API
  // Try the /query endpoint (some Supabase versions have it)
  const queryRes = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'OPTIONS',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
  });
  console.log('API endpoints status:', queryRes.status);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  Cannot modify enum via REST API.');
  console.log('Please run these 2 SQL statements in Supabase SQL Editor:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log("ALTER TYPE ai_model ADD VALUE IF NOT EXISTS 'llama-8b';");
  console.log("UPDATE students SET preferred_ai_model = 'llama-8b';\n");
  console.log('Go to: https://supabase.com/dashboard/project/ihuchnabexntvpwnpown/sql/new');
}

main().catch(console.error);
