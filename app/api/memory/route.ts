export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetch: ((url: any, options: any = {}) => fetch(url, { ...options, cache: 'no-store' })) as typeof fetch,
    },
  }
);

// GET /api/memory?studentId=xxx
// Returns the student's current nemo_memory and recent progress summary
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId');
    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    // Fetch student record
    const { data: student, error: studentErr } = await supabaseAdmin
      .from('students')
      .select('id, name_english, name_thai, nickname_english, nickname_thai, current_grade, nemo_memory, interests, learning_style, personality_notes')
      .eq('id', studentId)
      .single();

    if (studentErr || !student) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch recent progress events
    const { data: events } = await supabaseAdmin
      .from('progress_events')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50);

    const progressEvents = events ?? [];

    // Compute stats
    const totalQuizzes = progressEvents.filter((e: any) => e.event_type === 'quiz').length;
    const quizScores = progressEvents.filter((e: any) => e.event_type === 'quiz' && typeof e.score === 'number' && typeof e.total === 'number');
    const totalScore = quizScores.reduce((acc: number, e: any) => acc + (e.score || 0), 0);
    const totalQuestions = quizScores.reduce((acc: number, e: any) => acc + (e.total || 0), 0);
    const overallAccuracy = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

    // Default memory object structure
    const defaultMemory = {
      interests: student.interests ?? [],
      learning_style: student.learning_style ?? '',
      personality: student.personality_notes ?? '',
      strengths: [],
      struggles: [],
      languages_spoken: [],
      fun_facts: [],
      favourites: '',
      completed_topics: {},
      last_lesson_summary: '',
      last_active_at: new Date().toISOString(),
    };

    const currentMemory = {
      ...defaultMemory,
      ...(student.nemo_memory ?? {}),
    };

    return Response.json({
      ok: true,
      studentId: student.id,
      studentName: student.nickname_english || student.name_english || student.nickname_thai || student.name_thai || 'Student',
      gradeLevel: student.current_grade,
      memory: currentMemory,
      stats: {
        totalQuizzes,
        overallAccuracy,
        recentEventsCount: progressEvents.length,
      },
    });
  } catch (err: any) {
    console.error('Get memory error:', err);
    return Response.json({ error: err?.message ?? 'Failed to load memory' }, { status: 500 });
  }
}

// POST /api/memory
// Body: { studentId: string, action?: string, memoryUpdates?: object, lastLessonSummary?: string, completedTopic?: { subject: string, topic: string }, quizResult?: { subject: string, score: number, total: number } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, action, memoryUpdates, lastLessonSummary, completedTopic, quizResult } = body;

    if (!studentId) {
      return Response.json({ error: 'studentId required' }, { status: 400 });
    }

    // Fetch existing student memory
    const { data: student, error: fetchErr } = await supabaseAdmin
      .from('students')
      .select('nemo_memory')
      .eq('id', studentId)
      .single();

    if (fetchErr || !student) {
      return Response.json({ error: 'Student not found' }, { status: 404 });
    }

    const existingMemory = student.nemo_memory ?? {};
    let updatedMemory = { ...existingMemory };

    if (action === 'full_update' && memoryUpdates) {
      updatedMemory = { ...updatedMemory, ...memoryUpdates };
    }

    if (lastLessonSummary) {
      updatedMemory.last_lesson_summary = lastLessonSummary;
      updatedMemory.last_active_at = new Date().toISOString();
    }

    if (completedTopic?.subject && completedTopic?.topic) {
      const subj = completedTopic.subject.toLowerCase();
      const existingTopics = updatedMemory.completed_topics?.[subj] ?? [];
      if (!existingTopics.includes(completedTopic.topic)) {
        updatedMemory.completed_topics = {
          ...(updatedMemory.completed_topics ?? {}),
          [subj]: [...existingTopics, completedTopic.topic],
        };
      }
    }

    if (quizResult?.subject) {
      const { subject, score, total } = quizResult;
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const summaryStr = `Completed ${subject} quiz on ${dateStr} scoring ${score}/${total} (${pct}%)`;
      updatedMemory.last_lesson_summary = summaryStr;
      updatedMemory.last_active_at = new Date().toISOString();

      // Update strengths / struggles based on score
      const subjName = subject;
      const strengths = new Set<string>(updatedMemory.strengths ?? []);
      const struggles = new Set<string>(updatedMemory.struggles ?? []);

      if (pct >= 80) {
        strengths.add(subjName);
        struggles.delete(subjName);
      } else if (pct < 50) {
        struggles.add(subjName);
      }

      updatedMemory.strengths = Array.from(strengths);
      updatedMemory.struggles = Array.from(struggles);
    }

    // Save back to DB
    const { error: updateErr } = await supabaseAdmin
      .from('students')
      .update({ nemo_memory: updatedMemory })
      .eq('id', studentId);

    if (updateErr) {
      console.error('Memory update error:', updateErr);
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    return Response.json({ ok: true, memory: updatedMemory });
  } catch (err: any) {
    console.error('POST memory error:', err);
    return Response.json({ error: err?.message ?? 'Failed to update memory' }, { status: 500 });
  }
}
