'use client';

import React from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { SubjectCard } from '@/components/subject-card';
import { subjects, getSubjectsForGrade } from '@/lib/subjects';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { FeedbackButton } from '@/components/feedback-button';

export default function DashboardPage() {
  const { activeStudent, user } = useAuth();
  const { t, locale } = useLanguage();
  const displayName = activeStudent?.nickname_thai ?? activeStudent?.nickname_english ?? activeStudent?.name_english ?? activeStudent?.name_thai ?? user?.user_metadata?.full_name ?? user?.email?.split?.('@')?.[0] ?? '';
  const gradeLevel = activeStudent?.current_grade;
  const filteredSubjects = gradeLevel ? getSubjectsForGrade(gradeLevel) : subjects;

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
        </div>
        {gradeLevel ? (
          <p className="text-muted-foreground">
            {t('dashboard.grade')} {gradeLevel}
          </p>
        ) : null}
        <p className="text-muted-foreground mt-1">{t('dashboard.selectSubject')}</p>
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
