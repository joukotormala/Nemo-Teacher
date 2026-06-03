export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE /api/student-delete
// Body: { studentId }
// Requires: Authorization: Bearer <access_token>
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { studentId } = body;
    if (!studentId) {
      return Response.json({ error: 'studentId is required' }, { status: 400 });
    }

    // Find all parent IDs for this user
    const { data: parents } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('auth_user_id', user.id);

    const parentIds = (parents ?? []).map((p: any) => p.id);
    if (parentIds.length === 0) {
      return Response.json({ error: 'Parent account not found' }, { status: 404 });
    }

    // Verify the student belongs to one of these parents before deleting
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, parent_id')
      .eq('id', studentId)
      .in('parent_id', parentIds)
      .maybeSingle();

    if (!student) {
      return Response.json({ error: 'Student not found or does not belong to this account' }, { status: 404 });
    }

    // Delete the student
    const { error: deleteErr } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', studentId);

    if (deleteErr) {
      console.error('student-delete error:', deleteErr);
      return Response.json({ error: deleteErr.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('student-delete error:', err);
    return Response.json({ error: err?.message ?? 'Failed to delete student' }, { status: 500 });
  }
}
