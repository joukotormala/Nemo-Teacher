export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH /api/feedback/reply — admin saves a reply
// No custom header auth needed — admin panel is already protected by 2FA
export async function PATCH(req: NextRequest) {
  try {
    const { feedbackId, reply } = await req.json();
    if (!feedbackId || !reply?.trim()) {
      return Response.json({ error: 'feedbackId and reply are required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('feedback')
      .update({
        admin_reply: reply.trim(),
        replied_at: new Date().toISOString(),
        reply_seen: false,
      })
      .eq('id', feedbackId);

    if (error) {
      console.error('Reply DB error:', error.message, error.details);
      // Helpful hint if the columns are missing
      if (error.message?.includes('column') || error.code === '42703') {
        return Response.json({
          error: 'Missing DB columns — run this SQL in Supabase:\n' +
            'ALTER TABLE feedback ADD COLUMN IF NOT EXISTS admin_reply text;\n' +
            'ALTER TABLE feedback ADD COLUMN IF NOT EXISTS replied_at timestamptz;\n' +
            'ALTER TABLE feedback ADD COLUMN IF NOT EXISTS reply_seen boolean DEFAULT false;'
        }, { status: 500 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('Reply route error:', err);
    return Response.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}

// GET /api/feedback/reply?studentId=xxx — student reads their replies
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

  if (error) {
    console.error('Fetch replies error:', error.message);
    return Response.json({ replies: [] });
  }

  return Response.json({ replies: data ?? [] });
}

// POST /api/feedback/reply — mark a reply as seen by student
export async function POST(req: NextRequest) {
  try {
    const { feedbackId } = await req.json();
    if (!feedbackId) return Response.json({ ok: false });

    await supabaseAdmin
      .from('feedback')
      .update({ reply_seen: true })
      .eq('id', feedbackId);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
