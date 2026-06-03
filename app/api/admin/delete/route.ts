export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? 'nemo_admin_jwt_secret_key_2026'
);

async function verifyAdminSession(req: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return false;
    await jose.jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// POST /api/admin/delete
// Body: { type: 'kid' | 'parent', id: string }
// Requires valid admin session cookie
export async function POST(req: NextRequest) {
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, id } = await req.json();

    if (!id || !type) {
      return Response.json({ error: 'type and id are required' }, { status: 400 });
    }

    if (type === 'kid') {
      const { error } = await supabaseAdmin.from('students').delete().eq('id', id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    if (type === 'parent') {
      // Delete all students belonging to this parent first
      await supabaseAdmin.from('students').delete().eq('parent_id', id);
      // Then delete the parent
      const { error } = await supabaseAdmin.from('parents').delete().eq('id', id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    console.error('admin delete error:', err);
    return Response.json({ error: err?.message ?? 'Delete failed' }, { status: 500 });
  }
}
