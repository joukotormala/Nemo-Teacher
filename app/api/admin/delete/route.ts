export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'nemo_admin_jwt_secret_key_2026';

// POST /api/admin/delete
// Body: { type: 'kid' | 'parent', id: string }
// Requires valid admin session cookie (nemo_admin_token)
export async function POST(req: NextRequest) {
  // Verify admin session — same pattern as other admin routes
  const cookieStore = await cookies();
  const token = cookieStore.get('nemo_admin_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    jwt.verify(token, ADMIN_JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, id } = await req.json();

    if (!id || !type) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    if (type === 'kid') {
      const { error } = await supabaseAdmin.from('students').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (type === 'parent') {
      // Delete all students belonging to this parent first
      await supabaseAdmin.from('students').delete().eq('parent_id', id);
      // Then delete the parent
      const { error } = await supabaseAdmin.from('parents').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err: any) {
    console.error('admin delete error:', err);
    return NextResponse.json({ error: err?.message ?? 'Delete failed' }, { status: 500 });
  }
}

