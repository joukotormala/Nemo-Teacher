export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/student-add
// Body: { nameThai, nameEnglish?, nicknameThai?, nicknameEnglish?, birthDate, gradeLevel, schoolName? }
// Requires: Authorization: Bearer <access_token>
export async function POST(req: NextRequest) {
  try {
    // Validate the caller's session
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Find parent record linked to this auth user
    const { data: parent, error: parentErr } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (parentErr || !parent) {
      return Response.json({ error: 'Parent account not found' }, { status: 404 });
    }

    const body = await req.json();
    const { nameThai, nameEnglish, nicknameThai, nicknameEnglish, birthDate, gradeLevel, schoolName } = body;

    if (!nameThai?.trim()) {
      return Response.json({ error: 'Student name (Thai) is required' }, { status: 400 });
    }
    if (!gradeLevel) {
      return Response.json({ error: 'Grade level is required' }, { status: 400 });
    }
    if (!birthDate) {
      return Response.json({ error: 'Date of birth is required' }, { status: 400 });
    }

    // Insert the new student using admin client (bypasses RLS)
    const { data, error: insertErr } = await supabaseAdmin
      .from('students')
      .insert({
        parent_id: parent.id,
        name_thai: nameThai.trim(),
        name_english: nameEnglish?.trim() || null,
        nickname_thai: nicknameThai?.trim() || null,
        nickname_english: nicknameEnglish?.trim() || null,
        birth_date: birthDate,
        current_grade: gradeLevel,
        school_name: schoolName?.trim() || null,
        language_preference: 'thai',
        preferred_ai_model: 'llama-8b',
      })
      .select('id')
      .single();

    if (insertErr) {
      console.error('Insert student error:', insertErr);
      return Response.json({ error: insertErr.message }, { status: 500 });
    }

    return Response.json({ ok: true, studentId: data.id });
  } catch (err: any) {
    console.error('student-add error:', err);
    return Response.json({ error: err?.message ?? 'Failed to add student' }, { status: 500 });
  }
}
