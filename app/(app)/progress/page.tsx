'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { subjects } from '@/lib/subjects';
import { motion } from 'framer-motion';
import { BarChart3, Clock, BookOpen, TrendingUp, Calendar } from 'lucide-react';

interface SessionData {
  id: string;
  subject_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

export default function ProgressPage() {
  const { activeStudent } = useAuth();
  const { t, locale } = useLanguage();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!activeStudent?.id) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('learning_sessions')
          .select('id, subject_id, started_at, ended_at, duration_minutes')
          .eq('student_id', activeStudent.id)
          .order('started_at', { ascending: false })
          .limit(50);
        setSessions(data ?? []);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [activeStudent?.id]);

  const totalSessions = sessions?.length ?? 0;
  const totalMinutes = (sessions ?? []).reduce((acc: number, s: SessionData) => acc + (s?.duration_minutes ?? 0), 0);
  const uniqueSubjects = new Set((sessions ?? []).map((s: SessionData) => s?.subject_id).filter(Boolean))?.size ?? 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  const statCards = [
    {
      label: t('progress.totalSessions'),
      value: totalSessions.toString(),
      icon: BarChart3,
      color: '#8B5CF6',
    },
    {
      label: t('progress.totalTime'),
      value: totalHours > 0 ? `${totalHours} ${t('progress.hours')} ${remainingMinutes} ${t('progress.minutes')}` : `${totalMinutes} ${t('progress.minutes')}`,
      icon: Clock,
      color: '#06B6D4',
    },
    {
      label: t('progress.subjectsStudied'),
      value: uniqueSubjects.toString(),
      icon: BookOpen,
      color: '#10B981',
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-display font-bold tracking-tight mb-1 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-primary" />
          {t('progress.title')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {locale === 'th'
            ? 'ติดตามความก้าวหน้าและสถิติการเรียนรู้'
            : locale === 'sv'
            ? 'Följ dina framsteg och inlärningsstatistik'
            : 'Track your learning progress and stats'}
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards?.map?.((card: any, idx: number) => {
          const Icon = card?.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-card rounded-xl p-6"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card?.color ?? '#8B5CF6'}15` }}
                >
                  {Icon ? <Icon className="w-5 h-5" style={{ color: card?.color ?? '#8B5CF6' }} /> : null}
                </div>
                <span className="text-sm text-muted-foreground">{card?.label ?? ''}</span>
              </div>
              <p className="text-2xl font-display font-bold tracking-tight">{card?.value ?? '0'}</p>
            </motion.div>
          );
        }) ?? []}
      </div>

      {/* Recent sessions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h2 className="text-xl font-display font-semibold tracking-tight mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          {t('progress.recentSessions')}
        </h2>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
          </div>
        ) : totalSessions === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t('progress.noSessions')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions?.map?.((session: SessionData, idx: number) => {
              const subjectInfo = subjects?.find?.((s: any) => s?.id === session?.subject_id);
              const SubjIcon = subjectInfo?.icon ?? BookOpen;
              const name = locale === 'th'
                ? (subjectInfo?.name_th ?? session?.subject_id ?? '')
                : (subjectInfo?.name_en ?? session?.subject_id ?? '');
              const dateStr = session?.started_at
                ? new Date(session.started_at).toLocaleDateString(
                    locale === 'th' ? 'th-TH' : locale === 'sv' ? 'sv-SE' : 'en-US',
                    {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <motion.div
                  key={session?.id ?? idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${subjectInfo?.color ?? '#8B5CF6'}15` }}
                  >
                    <SubjIcon className="w-5 h-5" style={{ color: subjectInfo?.color ?? '#8B5CF6' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">{dateStr}</p>
                  </div>
                  {session?.duration_minutes ? (
                    <span className="text-sm font-mono text-muted-foreground">
                      {session.duration_minutes} {t('progress.minutes')}
                    </span>
                  ) : null}
                </motion.div>
              );
            }) ?? []}
          </div>
        )}
      </motion.div>
    </div>
  );
}
