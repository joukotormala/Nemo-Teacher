export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAIL = process.env.ADMIN_FEEDBACK_EMAIL || 'jouko@nemo-teacher.app';

// POST /api/feedback
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, studentName, rating, category, message, subjectContext } = body;

    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Save to Supabase
    const { error: dbErr } = await supabaseAdmin
      .from('feedback')
      .insert({
        student_id: studentId || null,
        student_name: studentName || 'Anonymous',
        rating: rating || null,
        category: category || 'general',
        message: message.trim(),
        subject_context: subjectContext || null,
      });

    if (dbErr) {
      console.error('Feedback DB error:', dbErr);
      return Response.json({ error: dbErr.message }, { status: 500 });
    }

    // 2. Send email notification via Resend (only if API key is configured)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const stars = '⭐'.repeat(rating || 0) || 'No rating';
      const categoryLabels: Record<string, string> = {
        great: '😊 What I love',
        improve: '💡 What could be better',
        bug: '🐛 Something is broken',
        general: '💬 General feedback',
      };
      const categoryLabel = categoryLabels[category] || category;

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #f8f8f8; border-radius: 12px; overflow: hidden;">
          <div style="background: #7c3aed; padding: 24px; color: white;">
            <h2 style="margin: 0; font-size: 20px;">💬 New Student Feedback — Nemo AI</h2>
          </div>
          <div style="padding: 24px; background: white; margin: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="color: #888; padding: 6px 0; font-size: 13px; width: 130px;">Student</td><td style="font-weight: 600; font-size: 14px;">${studentName || 'Anonymous'}</td></tr>
              <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Rating</td><td style="font-size: 16px;">${stars}</td></tr>
              <tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Category</td><td style="font-size: 14px;">${categoryLabel}</td></tr>
              ${subjectContext ? `<tr><td style="color: #888; padding: 6px 0; font-size: 13px;">Subject</td><td style="font-size: 14px;">${subjectContext}</td></tr>` : ''}
            </table>
            <div style="margin-top: 16px; background: #f3f0ff; border-left: 3px solid #7c3aed; border-radius: 4px; padding: 12px 16px;">
              <p style="margin: 0; font-size: 15px; color: #1a1a1a; line-height: 1.6;">${message.trim().replace(/\n/g, '<br>')}</p>
            </div>
          </div>
          <p style="text-align: center; color: #aaa; font-size: 11px; padding-bottom: 16px;">Nemo AI Teacher · Feedback System</p>
        </div>
      `;

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Nemo Feedback <feedback@nemo-teacher.app>',
            to: [ADMIN_EMAIL],
            subject: `💬 ${studentName || 'A student'} sent feedback — ${stars}`,
            html: htmlBody,
          }),
        });
      } catch (emailErr) {
        // Don't fail the whole request if email fails — feedback is already saved
        console.error('Email send failed (feedback still saved):', emailErr);
      }
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('Feedback route error:', err);
    return Response.json({ error: err?.message ?? 'Failed to save feedback' }, { status: 500 });
  }
}

// GET /api/feedback — for admin panel
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return Response.json({ error: 'Invalid session' }, { status: 401 });

    const { data, error: dbErr } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 });

    return Response.json({ feedback: data ?? [] });
  } catch (err: any) {
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
