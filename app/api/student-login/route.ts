export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/student-login
// Body: { parentEmail: string, studentId: string, pin: string }
export async function POST(req: NextRequest) {
  try {
    const { parentEmail, studentId, pin } = await req.json();
    if (!parentEmail || !studentId || !pin) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Find parent by email
    const { data: parent, error: parentErr } = await supabaseAdmin
      .from('parents')
      .select('id, auth_user_id')
      .eq('email', parentEmail.trim().toLowerCase())
      .single();

    if (parentErr || !parent) {
      return Response.json({ error: 'Account not found for that email' }, { status: 404 });
    }

    // Find student belonging to this parent
    const { data: student, error: studentErr } = await supabaseAdmin
      .from('students')
      .select('id, name_english, name_thai, pin_hash')
      .eq('id', studentId)
      .eq('parent_id', parent.id)
      .single();

    if (studentErr || !student) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!student.pin_hash) {
      return Response.json({ error: 'No PIN set for this student. Ask your parent to set a PIN in Settings.' }, { status: 403 });
    }

    // Verify PIN
    const valid = await bcrypt.compare(String(pin), student.pin_hash);
    if (!valid) {
      return Response.json({ error: 'Wrong PIN. Try again!' }, { status: 401 });
    }

    // Generate a short-lived session token for this student using admin client
    // We sign in as the parent — since student is a sub-profile of the parent account
    const { data: sessionData, error: sessionErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: parentEmail.trim().toLowerCase(),
    });

    if (sessionErr || !sessionData?.properties?.action_link) {
      // Fallback: return parent's auth_user_id to be used with custom JWT
      // For now, return the parentEmail and studentId so the client can use them
      return Response.json({
        ok: true,
        parentEmail: parentEmail.trim().toLowerCase(),
        parentAuthUserId: parent.auth_user_id,
        studentId: student.id,
        studentName: student.name_english || student.name_thai,
        // Note: client will need the parent credentials to sign in
        // Use magic link approach
        magicLink: null,
      });
    }

    return Response.json({
      ok: true,
      parentEmail: parentEmail.trim().toLowerCase(),
      parentAuthUserId: parent.auth_user_id,
      studentId: student.id,
      studentName: student.name_english || student.name_thai,
      magicLink: sessionData.properties.action_link,
    });
  } catch (err: any) {
    console.error('Student login error:', err);
    return Response.json({ error: err?.message ?? 'Login failed' }, { status: 500 });
  }
}

// GET /api/student-login?parentEmail=xxx
// Returns list of students for a given parent email (for profile picker)
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('parentEmail')?.trim().toLowerCase();
    if (!email) return Response.json({ students: [] });

    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('email', email)
      .single();

    if (!parent) return Response.json({ students: [] });

    const { data: students } = await supabaseAdmin
      .from('students')
      .select('id, name_english, name_thai, nickname_english, nickname_thai, avatar_url, pin_hash')
      .eq('parent_id', parent.id);

    return Response.json({
      students: (students ?? []).map(s => ({
        id: s.id,
        name: s.nickname_english || s.name_english || s.nickname_thai || s.name_thai || 'Student',
        avatarUrl: s.avatar_url,
        hasPin: !!s.pin_hash,
      })),
    });
  } catch (err: any) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
