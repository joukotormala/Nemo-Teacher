export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/feedback/reply  — admin saves a reply to a specific feedback
// Protected by ADMIN_PASSWORD env var
export async function PATCH(req: NextRequest) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD ?? '';
    const authHeader = req.headers.get('x-admin-secret') ?? '';
    if (!adminPassword || authHeader !== adminPassword) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedbackId, reply } = await req.json();
    if (!feedbackId || !reply?.trim()) {
      return Response.json({ error: 'feedbackId and reply are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('feedback')
      .update({
        admin_reply: reply.trim(),
        replied_at: new Date().toISOString(),
        reply_seen: false,   // student hasn't seen this yet
      })
      .eq('id', feedbackId);

    if (error) {
      console.error('Reply DB error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

// GET /api/feedback/reply?studentId=xxx  — student fetches replies to their own feedback
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId');
  if (!studentId) return Response.json({ replies: [] });

  const { data, error } = await supabaseAdmin
    .from('feedback')
    .select('id, message, rating, category, admin_reply, replied_at, reply_seen, created_at, subject_context')
    .eq('student_id', studentId)
    .not('admin_reply', 'is', null)
    .order('replied_at', { ascending: false })
    .limit(10);

  if (error) return Response.json({ replies: [] });

  return Response.json({ replies: data ?? [] });
}

// POST /api/feedback/reply?markSeen=id  — mark a reply as seen
export async function POST(req: NextRequest) {
  const { feedbackId } = await req.json();
  if (!feedbackId) return Response.json({ ok: false });

  await supabaseAdmin
    .from('feedback')
    .update({ reply_seen: true })
    .eq('id', feedbackId);

  return Response.json({ ok: true });
}
