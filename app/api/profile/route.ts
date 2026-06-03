export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/profile
// Requires: Authorization: Bearer <access_token>
// Returns the parent + students for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate the token and get the user
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch ALL parent records for this auth user (handles duplicate rows gracefully)
    const { data: parents, error: parentErr } = await supabaseAdmin
      .from('parents')
      .select('id, name_thai, name_english, phone, email, language_preference')
      .eq('auth_user_id', user.id)
      .order('id', { ascending: true }); // oldest first = the "real" one

    if (parentErr) {
      console.error('Profile API - parent fetch error:', parentErr.message);
      return Response.json({ error: parentErr.message }, { status: 500 });
    }

    if (!parents || parents.length === 0) {
      return Response.json({ parent: null, students: [] });
    }

    // Use the first (oldest) parent as the canonical one
    const parent = parents[0];
    // Collect all parent IDs to aggregate students across any duplicates
    const parentIds = parents.map((p: any) => p.id);

    // Try fetching students with full columns first
    const fullSelect = 'id, parent_id, name_thai, name_english, nickname_thai, nickname_english, birth_date, current_grade, school_name, language_preference, preferred_ai_model, avatar_url, nemo_memory, interests, learning_style, personality_notes';
    const baseSelect = 'id, parent_id, name_thai, name_english, nickname_thai, nickname_english, birth_date, current_grade, school_name, language_preference, preferred_ai_model, avatar_url';

    let students: any[] = [];
    const fullResult = await supabaseAdmin
      .from('students')
      .select(fullSelect)
      .in('parent_id', parentIds); // fetch across ALL parent IDs

    if (fullResult.error) {
      // Fall back to base columns if extended columns don't exist yet
      const fallback = await supabaseAdmin
        .from('students')
        .select(baseSelect)
        .in('parent_id', parentIds);
      students = fallback.data ?? [];
    } else {
      students = fullResult.data ?? [];
    }

    // Deduplicate students by name_thai + current_grade in case of duplicates
    const seen = new Set<string>();
    const uniqueStudents = students.filter((s: any) => {
      const key = `${s.name_thai}|${s.current_grade}|${s.birth_date}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return Response.json({ parent, students: uniqueStudents });
  } catch (err: any) {
    console.error('Profile API error:', err);
    return Response.json({ error: err?.message ?? 'Failed to load profile' }, { status: 500 });
  }
}

