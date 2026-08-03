'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { motion } from 'framer-motion';
import { Brain, Sparkles, BookOpen, Star, Trophy, Target, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function NemoMemoryCard() {
  const { activeStudent } = useAuth();
  const { locale } = useLanguage();
  const th = locale === 'th';
  const sv = locale === 'sv';

  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState<any>(null);
  const [stats, setStats] = useState<{ totalQuizzes: number; overallAccuracy: number } | null>(null);

  const fetchMemory = async () => {
    if (!activeStudent?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/memory?studentId=${activeStudent.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.memory) setMemory(data.memory);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load memory card:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeStudent?.id) {
      fetchMemory();
    }
  }, [activeStudent?.id]);

  if (!activeStudent) return null;

  const nickname = activeStudent.nickname_english || activeStudent.nickname_thai || activeStudent.name_english || activeStudent.name_thai || 'Student';
  const mem = memory || activeStudent.nemo_memory || {};

  const completedTopicsMap = mem.completed_topics ?? {};
  const completedTopicsList: { subject: string; count: number }[] = Object.entries(completedTopicsMap).map(([subj, topics]: [string, any]) => ({
    subject: subj.toUpperCase(),
    count: Array.isArray(topics) ? topics.length : 0,
  }));
  const totalTopicsCount = completedTopicsList.reduce((acc, item) => acc + item.count, 0);

  const lastLesson = mem.last_lesson_summary || (th ? 'พร้อมเริ่มเรียนบทเรียนแรกแล้ว!' : sv ? 'Redo att starta din första läxa!' : 'Ready to start your first lesson!');
  const interestsList = mem.interests || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8 overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/90 via-purple-800 to-indigo-900 text-white shadow-xl shadow-purple-900/20"
    >
      <div className="p-6">
        {/* Header line */}
        <div className="flex items-center justify-between gap-3 mb-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-purple-400 flex items-center justify-center p-0.5 shadow-lg">
                <img
                  src="/nemo_avatar.jpg"
                  alt="Nemo"
                  className="w-full h-full rounded-2xl object-cover"
                  onError={(e) => {
                    // Fallback to icon if avatar missing
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Brain className="w-6 h-6 text-white absolute" style={{ display: 'none' }} />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white ring-2 ring-purple-900">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <h2 className="font-display font-bold text-lg leading-tight">
                  {th ? `เนโมจำได้: ${nickname}` : sv ? `Nemo kommer ihåg: ${nickname}` : `Nemo Remembers ${nickname}`}
                </h2>
              </div>
              <p className="text-xs text-purple-200/80">
                {th
                  ? 'อ่านความทรงจำและผลการเรียนทุกครั้งที่คุณเข้าสู่ระบบ 🎓'
                  : sv
                  ? 'Läser dina minnen och framsteg varje gång du loggar in 🎓'
                  : 'Reading your memory & progress every time you log in 🎓'}
              </p>
            </div>
          </div>

          <Link
            href="/memory"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 transition-all border border-white/15 text-white/90 shrink-0"
          >
            <Brain className="w-3.5 h-3.5 text-purple-300" />
            {th ? 'ดูความทรงจำ' : sv ? 'Visa minnen' : 'View Memory'}
          </Link>
        </div>

        {/* Core memory content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Last Lesson Memory */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-200 mb-2">
                <BookOpen className="w-4 h-4 text-cyan-300" />
                {th ? 'บทเรียนล่าสุด' : sv ? 'Senaste läxan' : 'Last Lesson Summary'}
              </div>
              <p className="text-sm font-medium text-white/90 leading-relaxed line-clamp-3">
                "{lastLesson}"
              </p>
            </div>
            <p className="text-[11px] text-cyan-200/70 mt-3 font-mono">
              {mem.last_active_at ? `Updated ${new Date(mem.last_active_at).toLocaleDateString()}` : 'Just active'}
            </p>
          </div>

          {/* Card 2: Mastered Topics & Progress */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-200 mb-2">
                <Trophy className="w-4 h-4 text-yellow-300" />
                {th ? 'หัวข้อที่ผ่านการทดสอบ' : sv ? 'Avklarade ämnen' : 'Topics & Quiz Mastery'}
              </div>

              {stats && stats.totalQuizzes > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-purple-200">{th ? 'ความแม่นยำเฉลี่ย' : sv ? 'Genomsnittlig noggrannhet' : 'Overall Quiz Accuracy'}:</span>
                    <span className="font-bold text-yellow-300 text-sm">{stats.overallAccuracy}%</span>
                  </div>
                  <div className="w-full bg-white/15 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-green-400 h-full rounded-full"
                      style={{ width: `${stats.overallAccuracy}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/70">
                    {stats.totalQuizzes} {th ? 'แบบทดสอบเสร็จสมบูรณ์' : sv ? 'prov genomförda' : 'quizzes completed'} ({totalTopicsCount} {th ? 'หัวข้อเรียนรู้แล้ว' : sv ? 'ämnen avklarade' : 'topics mastered'})
                  </p>
                </div>
              ) : (
                <p className="text-xs text-white/70">
                  {th ? 'ยังไม่มีแบบทดสอบ ทำแบบทดสอบในวิชาใดก็ได้เพื่อสะสมคะแนน!' : sv ? 'Inga prov än. Ta ett prov i valfritt ämne för att samla poäng!' : 'No quizzes taken yet. Complete a quiz in any subject to build memory!'}
                </p>
              )}
            </div>

            <Link
              href="/progress"
              className="text-xs text-cyan-300 hover:text-cyan-200 font-semibold inline-flex items-center gap-1 mt-3"
            >
              {th ? 'ดูแผนภูมิความก้าวหน้า' : sv ? 'Visa framstegsdiagram' : 'Detailed progress charts'} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 3: Interests & Personalized Recommendation */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-200 mb-2">
                <Star className="w-4 h-4 text-pink-300" />
                {th ? 'คำแนะนำจากเนโม' : sv ? 'Nemos rekommendation' : 'Nemo\'s Recommendation'}
              </div>

              {interestsList.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {interestsList.slice(0, 3).map((item: string, i: number) => (
                    <span key={i} className="text-[10px] bg-pink-500/30 text-pink-200 border border-pink-400/30 rounded-full px-2 py-0.5 font-medium">
                      ★ {item}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-purple-100/90 leading-snug">
                {th
                  ? `วันนี้พร้อมเรียนวิชาโปรดของคุณต่อหรือยัง? คลิกที่วิชาด้านล่างเพื่อคุยกับเนโม!`
                  : sv
                  ? `Redo att fortsätta lära dig idag? Klicka på ett ämne nedan för att prata med Nemo!`
                  : `Ready to continue learning today? Click any subject below to chat with Nemo!`}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-purple-300 font-medium">
                {mem.learning_style ? `Style: ${mem.learning_style}` : 'Adaptive AI Tutor'}
              </span>
              <button
                onClick={fetchMemory}
                disabled={loading}
                className="text-white/60 hover:text-white transition-colors p-1"
                title="Refresh memory"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
