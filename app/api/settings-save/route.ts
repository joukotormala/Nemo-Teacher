export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/settings-save
// Saves parent + active student info via service role (bypasses RLS)
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

    // Lookup parent by auth_user_id
    const { data: parent } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!parent) {
      return Response.json({ error: 'Parent account not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      parentNameThai, parentNameEnglish, parentPhone, languagePreference,
      studentId, studentNameThai, studentNameEnglish,
      nicknameThai, nicknameEnglish,
      gradeLevel, schoolName, schoolProgram, preferredModel,
    } = body;

    // Update parent record
    const { error: parentErr } = await supabaseAdmin
      .from('parents')
      .update({
        name_thai: parentNameThai?.trim() ?? '',
        name_english: parentNameEnglish?.trim() || null,
        phone: parentPhone?.trim() ?? '',
        language_preference: languagePreference,
      })
      .eq('id', parent.id);

    if (parentErr) {
      console.error('settings-save parent update error:', parentErr);
      return Response.json({ error: parentErr.message }, { status: 500 });
    }

    // Update student record — verify it belongs to this parent first
    if (studentId) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('id', studentId)
        .eq('parent_id', parent.id)
        .maybeSingle();

      if (!student) {
        return Response.json({ error: 'Student not found or does not belong to this account' }, { status: 404 });
      }

      const { error: studentErr } = await supabaseAdmin
        .from('students')
        .update({
          name_thai: studentNameThai?.trim() ?? '',
          name_english: studentNameEnglish?.trim() || null,
          nickname_thai: nicknameThai?.trim() || null,
          nickname_english: nicknameEnglish?.trim() || null,
          current_grade: gradeLevel || null,
          school_name: schoolName?.trim() || null,
          school_program: schoolProgram || null,
          language_preference: languagePreference,
          preferred_ai_model: preferredModel,
        })
        .eq('id', studentId);

      if (studentErr) {
        console.error('settings-save student update error:', studentErr);
        return Response.json({ error: studentErr.message }, { status: 500 });
      }
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('settings-save error:', err);
    return Response.json({ error: err?.message ?? 'Failed to save settings' }, { status: 500 });
  }
}
