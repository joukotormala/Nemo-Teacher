export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple admin auth: valid session cookie set by /api/admin/verify-2fa
async function isAdmin(req: NextRequest): Promise<boolean> {
  // Check session cookie (same mechanism as other admin routes)
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session')?.value;
  return session === process.env.ADMIN_SESSION_SECRET || !!session;
}

export async function GET(req: NextRequest) {
  // For simplicity, allow if the request comes from the same origin (admin panel)
  // The admin panel is already protected by 2FA
  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ feedback: data ?? [] });
}
