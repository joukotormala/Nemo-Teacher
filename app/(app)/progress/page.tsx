'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { subjects } from '@/lib/subjects';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { ArrowLeft, Trophy, Flame, BookOpen } from 'lucide-react';

interface ProgressEvent {
  id: string;
  student_id: string;
  subject: string;
  event_type: string;
  score: number | null;
  total: number | null;
  confidence: number | null;
  details: any;
  created_at: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  mathematics: '#6366f1', science: '#10b981', english: '#f59e0b',
  thai: '#ef4444', social_studies: '#8b5cf6', computer_science: '#06b6d4',
  health: '#f97316', art: '#ec4899', music: '#14b8a6', default: '#a78bfa',
};
function getColor(subject: string) {
  const key = subject.toLowerCase().replace(/[\s-]+/g, '_');
  return SUBJECT_COLORS[key] ?? SUBJECT_COLORS.default;
}
function calcStreak(events: ProgressEvent[]): number {
  if (!events.length) return 0;
  const days = Array.from(new Set(events.map(e => e.created_at.slice(0, 10)))).sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 864e5;
    if (diff === 1) streak++; else break;
  }
  return streak;
}

export default function ProgressPage() {
  const { activeStudent } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const th = locale === 'th';

  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeStudent?.id) return;
    fetch(`/api/progress?studentId=${activeStudent.id}`)
      .then(r => r.json()).then(d => setEvents(d.events ?? []))
      .catch(() => {}).finally(() => setLoading(false));
  }, [activeStudent?.id]);

  const quizEvents = useMemo(() => events.filter(e => e.event_type === 'quiz'), [events]);
  const confEvents = useMemo(() => events.filter(e => e.event_type === 'confidence'), [events]);
  const streak     = useMemo(() => calcStreak(events), [events]);

  const radarData = useMemo(() => {
    const map: Record<string, number[]> = {};
    confEvents.forEach(e => { if (e.confidence) { map[e.subject] = map[e.subject] ?? []; map[e.subject].push(e.confidence); } });
    return Object.entries(map).map(([subj, vals]) => ({
      subject: subj.length > 12 ? subj.slice(0, 12) + '…' : subj,
      confidence: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 20),
      fullMark: 100,
    }));
  }, [confEvents]);

  const lineData = useMemo(() =>
    quizEvents.slice(0, 20).reverse().map(e => ({
      name: new Date(e.created_at).toLocaleDateString(th ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short' }),
      score: e.total ? Math.round(((e.score ?? 0) / e.total) * 100) : 0,
    })), [quizEvents, th]);

  const subjectStats = useMemo(() => {
    const map: Record<string, { quizzes: number; totalScore: number }> = {};
    quizEvents.forEach(e => {
      map[e.subject] = map[e.subject] ?? { quizzes: 0, totalScore: 0 };
      map[e.subject].quizzes++;
      map[e.subject].totalScore += e.total ? ((e.score ?? 0) / e.total) * 100 : 0;
    });
    return Object.entries(map).map(([subj, s]) => ({
      subject: subj, quizzes: s.quizzes,
      avgScore: Math.round(s.totalScore / s.quizzes),
    }));
  }, [quizEvents]);

  const displayName = activeStudent?.nickname_thai ?? activeStudent?.nickname_english ?? activeStudent?.name_english ?? '';

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8 pb-28">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {th ? 'กลับ' : 'Back'}
        </button>
        <h1 className="text-3xl font-bold">
          {th ? `ความก้าวหน้าของ ${displayName} 📊` : `${displayName}'s Progress 📊`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {th ? 'ดูคะแนนแบบทดสอบและความมั่นใจของคุณ' : 'Your quiz scores and confidence over time'}
        </p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Flame className="w-5 h-5 text-orange-500" />, value: streak, label: th ? 'วันติดต่อกัน 🔥' : 'Day streak 🔥', grad: 'from-orange-500/10 to-red-500/10 border-orange-500/20' },
          { icon: <Trophy className="w-5 h-5 text-yellow-500" />, value: quizEvents.length, label: th ? 'แบบทดสอบ' : 'Quizzes done', grad: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20' },
          { icon: <BookOpen className="w-5 h-5 text-purple-500" />, value: new Set(quizEvents.map(e => e.subject)).size, label: th ? 'วิชา' : 'Subjects', grad: 'from-purple-500/10 to-pink-500/10 border-purple-500/20' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${s.grad} border rounded-2xl p-4 flex flex-col items-center text-center gap-1`}>
            {s.icon}
            <span className="text-3xl font-bold">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {events.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-muted-foreground">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-xl font-semibold mb-2">{th ? 'ยังไม่มีข้อมูล' : 'No data yet'}</h2>
          <p className="text-sm">{th ? 'เรียนกับ Nemo แล้วกด "จบบทเรียน" เพื่อทำแบบทดสอบ!' : 'Finish a lesson and take a quiz to see your progress here!'}</p>
        </motion.div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {lineData.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-4">{th ? '📈 คะแนนแบบทดสอบ' : '📈 Quiz Scores Over Time'}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: any) => [`${v}%`, th ? 'คะแนน' : 'Score']} />
                    <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5}
                      dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {radarData.length >= 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-bold mb-4">{th ? '🕸️ ความมั่นใจในแต่ละวิชา' : '🕸️ Confidence by Subject'}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name={th ? 'ความมั่นใจ' : 'Confidence'} dataKey="confidence"
                      stroke="#db2777" fill="#db2777" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Subject cards */}
          {subjectStats.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="text-sm font-bold mb-3">{th ? '📚 สรุปรายวิชา' : '📚 Subject Summary'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjectStats.map(s => {
                  const color = getColor(s.subject);
                  const subj = subjects.find(x => x.name_en?.toLowerCase() === s.subject.toLowerCase() || x.id === s.subject.replace(/\s+/g,'_').toLowerCase());
                  const Icon = (subj as any)?.icon as React.ComponentType<{ className?: string; style?: React.CSSProperties }> | undefined;
                  return (
                    <div key={s.subject} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: `${color}22`, border: `2px solid ${color}44` }}>
                        {Icon ? <Icon className="w-5 h-5" style={{ color }} /> : <span>📖</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.subject}</p>
                        <p className="text-xs text-muted-foreground">{s.quizzes} {th ? 'ครั้ง' : 'quizzes'}</p>
                        <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${s.avgScore}%`, background: color }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold" style={{ color }}>{s.avgScore}%</p>
                        <p className="text-[10px] text-muted-foreground">{th ? 'เฉลี่ย' : 'avg'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Recent history */}
          {quizEvents.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
              <h3 className="text-sm font-bold mb-3">{th ? '🕐 ประวัติล่าสุด' : '🕐 Recent Sessions'}</h3>
              <div className="space-y-2">
                {quizEvents.slice(0, 10).map(e => {
                  const pct = e.total ? Math.round(((e.score ?? 0) / e.total) * 100) : 0;
                  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '👍' : '💪';
                  const confE = confEvents.find(c => c.subject === e.subject && Math.abs(new Date(c.created_at).getTime() - new Date(e.created_at).getTime()) < 6e5);
                  return (
                    <div key={e.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                      <span className="text-xl">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{e.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleDateString(th ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {confE?.confidence ? <> · {'⭐'.repeat(confE.confidence)}</> : null}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: getColor(e.subject) }}>{e.score ?? 0}/{e.total ?? 3}</p>
                        <p className="text-[10px] text-muted-foreground">{pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
