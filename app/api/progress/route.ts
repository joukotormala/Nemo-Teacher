export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/progress — save a quiz result or confidence rating
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, subject, eventType, score, total, confidence, details } = body;

    if (!studentId || !subject || !eventType) {
      return Response.json({ error: 'studentId, subject, eventType required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('progress_events').insert({
      student_id: studentId,
      subject,
      event_type: eventType,
      score: score ?? null,
      total: total ?? null,
      confidence: confidence ?? null,
      details: details ?? null,
    });

    if (error) {
      console.error('Progress insert error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}

// GET /api/progress?studentId=xxx — fetch all progress events for a student
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get('studentId');
  if (!studentId) return Response.json({ events: [] });

  const { data, error } = await supabaseAdmin
    .from('progress_events')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return Response.json({ events: [] });
  return Response.json({ events: data ?? [] });
}
