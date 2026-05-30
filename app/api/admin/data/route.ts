import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'nemo_admin_jwt_secret_key_2026';

export async function GET(request: NextRequest) {
  console.log('[Admin Data API] GET request received');
  try {
    // 1. Authenticate via JWT Cookie
    const cookieStore = cookies();
    const token = cookieStore.get('nemo_admin_token')?.value;

    console.log('[Admin Data API] Token cookie present:', !!token);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    try {
      jwt.verify(token, ADMIN_JWT_SECRET);
      console.log('[Admin Data API] Token verified successfully');
    } catch (err: any) {
      console.warn('[Admin Data API] Token verification failed:', err.message);
      return NextResponse.json({ success: false, error: 'Unauthorized: Session invalid or expired' }, { status: 401 });
    }

    // 2. Fetch Data from Supabase
    console.log('[Admin Data API] Fetching tables in parallel...');
    
    console.time('[Admin Data API] Supabase Query Time');
    const [parentsRes, studentsRes, conversationsRes, sessionsRes] = await Promise.all([
      supabaseAdmin.from('parents').select('id, name_thai, name_english, phone, email, language_preference, created_at'),
      supabaseAdmin.from('students').select('id, parent_id, name_thai, name_english, nickname_thai, nickname_english, birth_date, current_grade, school_name, language_preference, preferred_ai_model, created_at'),
      supabaseAdmin.from('conversations').select('id, student_id, title, message_count, updated_at'),
      supabaseAdmin.from('learning_sessions').select('id, student_id, subject_id, started_at, ended_at, duration_minutes')
    ]);
    console.timeEnd('[Admin Data API] Supabase Query Time');

    // Handle Supabase errors gracefully
    if (parentsRes.error) console.error('[Admin Data API] Error fetching parents:', parentsRes.error.message);
    if (studentsRes.error) console.error('[Admin Data API] Error fetching students:', studentsRes.error.message);
    if (conversationsRes.error) console.error('[Admin Data API] Error fetching conversations:', conversationsRes.error.message);
    if (sessionsRes.error) console.error('[Admin Data API] Error fetching sessions:', sessionsRes.error.message);

    const parents = parentsRes.data || [];
    const students = studentsRes.data || [];
    const conversations = conversationsRes.data || [];
    const sessions = sessionsRes.data || [];

    console.log(`[Admin Data API] Fetched parents: ${parents.length}, students: ${students.length}, conversations: ${conversations.length}, sessions: ${sessions.length}`);

    // 3. Aggregate Data in Memory
    console.log('[Admin Data API] Aggregating metrics in memory...');
    const studentStats: Record<string, {
      conversationsCount: number;
      messagesCount: number;
      sessionsCount: number;
      studyMinutes: number;
      lastActive: string | null;
    }> = {};

    // Initialize stats for each student
    students.forEach((student) => {
      studentStats[student.id] = {
        conversationsCount: 0,
        messagesCount: 0,
        sessionsCount: 0,
        studyMinutes: 0,
        lastActive: null,
      };
    });

    // Aggregate conversations
    conversations.forEach((conv) => {
      const sId = conv.student_id;
      if (sId && studentStats[sId]) {
        studentStats[sId].conversationsCount += 1;
        studentStats[sId].messagesCount += Number(conv.message_count || 0);
        
        if (conv.updated_at) {
          const currentLast = studentStats[sId].lastActive;
          if (!currentLast || new Date(conv.updated_at) > new Date(currentLast)) {
            studentStats[sId].lastActive = conv.updated_at;
          }
        }
      }
    });

    // Aggregate sessions
    sessions.forEach((sess) => {
      const sId = sess.student_id;
      if (sId && studentStats[sId]) {
        studentStats[sId].sessionsCount += 1;
        studentStats[sId].studyMinutes += Number(sess.duration_minutes || 0);

        if (sess.started_at) {
          const currentLast = studentStats[sId].lastActive;
          if (!currentLast || new Date(sess.started_at) > new Date(currentLast)) {
            studentStats[sId].lastActive = sess.started_at;
          }
        }
      }
    });

    // 4. Construct Parents List and Kids List with Aggregated Metrics
    const parentsMap = new Map(parents.map(p => [p.id, p]));

    const kidsList = students.map((student) => {
      const stats = studentStats[student.id] || {
        conversationsCount: 0,
        messagesCount: 0,
        sessionsCount: 0,
        studyMinutes: 0,
        lastActive: null,
      };

      const parentInfo = student.parent_id ? parentsMap.get(student.parent_id) : null;

      return {
        ...student,
        stats,
        parent: parentInfo ? {
          id: parentInfo.id,
          name_thai: parentInfo.name_thai,
          name_english: parentInfo.name_english,
          email: parentInfo.email,
        } : null,
      };
    });

    const parentsList = parents.map((parent) => {
      const parentKids = kidsList.filter(k => k.parent_id === parent.id);
      
      const totalConversations = parentKids.reduce((sum, kid) => sum + kid.stats.conversationsCount, 0);
      const totalMessages = parentKids.reduce((sum, kid) => sum + kid.stats.messagesCount, 0);
      const totalStudyMinutes = parentKids.reduce((sum, kid) => sum + kid.stats.studyMinutes, 0);
      
      let lastActive: string | null = null;
      parentKids.forEach((kid) => {
        if (kid.stats.lastActive) {
          if (!lastActive || new Date(kid.stats.lastActive) > new Date(lastActive)) {
            lastActive = kid.stats.lastActive;
          }
        }
      });

      return {
        ...parent,
        kidsCount: parentKids.length,
        kids: parentKids.map(k => ({
          id: k.id,
          name_thai: k.name_thai,
          name_english: k.name_english,
        })),
        stats: {
          conversationsCount: totalConversations,
          messagesCount: totalMessages,
          studyMinutes: totalStudyMinutes,
          lastActive,
        }
      };
    });

    // 5. Overall System Totals
    const overallStats = {
      totalParents: parents.length,
      totalKids: students.length,
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, conv) => sum + Number(conv.message_count || 0), 0),
      totalStudyMinutes: sessions.reduce((sum, sess) => sum + Number(sess.duration_minutes || 0), 0),
    };

    console.log('[Admin Data API] Returning success response payload');
    return NextResponse.json({
      success: true,
      stats: overallStats,
      parentsList,
      kidsList,
    });
  } catch (error: any) {
    console.error('[Admin Data API] Fatal handler error:', error.message || error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
