export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/student-set-pin
// Body: { studentId: string, pin: string }
// Requires: authenticated parent session (via Authorization header or cookie)
export async function POST(req: NextRequest) {
  try {
    const { studentId, pin } = await req.json();
    if (!studentId || !pin) {
      return Response.json({ error: 'Missing studentId or pin' }, { status: 400 });
    }

    if (String(pin).length !== 4 || !/^\d{4}$/.test(String(pin))) {
      return Response.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // Get caller's auth token from cookie
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the token
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Find this parent record
    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!parent) {
      return Response.json({ error: 'Parent account not found' }, { status: 404 });
    }

    // Verify student belongs to this parent
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('id', studentId)
      .eq('parent_id', parent.id)
      .single();

    if (!student) {
      return Response.json({ error: 'Student not found or does not belong to this account' }, { status: 404 });
    }

    // Hash the PIN
    const hash = await bcrypt.hash(String(pin), 10);

    // Save it
    const { error: updateErr } = await supabaseAdmin
      .from('students')
      .update({ pin_hash: hash })
      .eq('id', studentId);

    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('Set PIN error:', err);
    return Response.json({ error: err?.message ?? 'Failed to set PIN' }, { status: 500 });
  }
}
