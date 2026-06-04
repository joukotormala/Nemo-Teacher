'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { SubjectCard } from '@/components/subject-card';
import { subjects, getSubjectsForGrade } from '@/lib/subjects';
import { motion } from 'framer-motion';
import { Sparkles, BarChart2, Flame } from 'lucide-react';
import Link from 'next/link';
import { FeedbackButton } from '@/components/feedback-button';

export default function DashboardPage() {
  const { activeStudent, user } = useAuth();
  const { t, locale } = useLanguage();
  const th = locale === 'th';
  const displayName = activeStudent?.nickname_thai ?? activeStudent?.nickname_english ?? activeStudent?.name_english ?? activeStudent?.name_thai ?? user?.user_metadata?.full_name ?? user?.email?.split?.('@')?.[0] ?? '';
  const gradeLevel = activeStudent?.current_grade;
  const filteredSubjects = gradeLevel ? getSubjectsForGrade(gradeLevel) : subjects;

  // Quick streak for dashboard badge
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    if (!activeStudent?.id) return;
    fetch(`/api/progress?studentId=${activeStudent.id}`)
      .then(r => r.json())
      .then(d => {
        const evts = d.events ?? [];
        const days = Array.from(new Set(evts.map((e: any) => e.created_at.slice(0, 10)))) as string[];
        const sorted = days.sort().reverse();
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        if (!sorted.length || (sorted[0] !== today && sorted[0] !== yesterday)) return;
        let s = 1;
        for (let i = 1; i < sorted.length; i++) {
          const diff = (new Date(sorted[i-1]).getTime() - new Date(sorted[i]).getTime()) / 864e5;
          if (diff === 1) s++; else break;
        }
        setStreak(s);
      }).catch(() => {});
  }, [activeStudent?.id]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <h1 className="text-3xl font-display font-bold tracking-tight">
            {t('dashboard.welcome')}, <span className="text-primary">{displayName}</span>
          </h1>
          {streak > 0 && (
            <span className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3" /> {streak} {th ? 'วัน' : 'day'}{streak > 1 && !th ? 's' : ''}
            </span>
          )}
        </div>
        {gradeLevel ? (
          <p className="text-muted-foreground">
            {t('dashboard.grade')} {gradeLevel}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-1">{t('dashboard.selectSubject')}</p>
      </motion.div>

      {/* Progress card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
        <Link href="/progress" className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 hover:border-purple-500/40 transition-all group"
          style={{ background: 'linear-gradient(135deg,#7c3aed11,#db287711)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2877)' }}>
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">{th ? 'ความก้าวหน้าของฉัน' : 'My Progress'}</p>
              <p className="text-xs text-muted-foreground">{th ? 'ดูคะแนนแบบทดสอบและแผนภูมิ' : 'Quiz scores, confidence charts & streaks'}</p>
            </div>
          </div>
          <span className="text-purple-500 text-sm font-bold group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </motion.div>

      {/* Subject grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects?.map?.((subj: any, idx: number) => (
          <SubjectCard key={subj?.id ?? idx} subject={subj} index={idx} />
        )) ?? []}
      </div>

      <FeedbackButton subjectContext="dashboard" showBanner />
    </div>
  );
}
