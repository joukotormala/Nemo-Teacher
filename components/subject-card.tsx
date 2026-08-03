'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/language-context';
import { useAuth } from '@/lib/contexts/auth-context';
import type { SubjectInfo } from '@/lib/subjects';
import { ArrowRight, X, ChevronRight, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectCardProps {
  subject: SubjectInfo;
  index: number;
}

export function SubjectCard({ subject, index }: SubjectCardProps) {
  const { locale, t } = useLanguage();
  const router = useRouter();

  const Icon = subject?.icon;
  const name = locale === 'th' ? (subject?.name_th ?? '') : locale === 'sv' ? (subject?.name_sv ?? subject?.name_en ?? '') : (subject?.name_en ?? '');
  const desc = locale === 'th' ? (subject?.description_th ?? '') : locale === 'sv' ? (subject?.description_sv ?? subject?.description_en ?? '') : (subject?.description_en ?? '');

  function handleCardClick(e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/chat/${subject?.slug ?? ''}`);
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`group relative rounded-xl p-6 ${subject?.bgColor ?? 'bg-muted'} hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden animate-fade-in-up`}
        style={{ boxShadow: 'var(--shadow-md)', animationDelay: `${(index ?? 0) * 80}ms` }}
      >
          {/* Subtle background overlay of the icon */}
          <div className="absolute -top-4 -right-4 w-28 h-28 opacity-10 transform rotate-12 transition-transform duration-300 group-hover:scale-110">
            {Icon ? <Icon className="w-full h-full" style={{ color: subject?.color ?? '#8B5CF6' }} /> : null}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                style={{ backgroundColor: `${subject?.color ?? '#8B5CF6'}15`, border: `1px solid ${subject?.color ?? '#8B5CF6'}30` }}
              >
                {Icon ? <Icon className="w-6 h-6" style={{ color: subject?.color ?? '#8B5CF6' }} /> : null}
              </div>
              <h3 className="font-display font-semibold text-xl tracking-tight mb-2 text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>
            </div>

            {subject?.illustrationUrl ? (
              <div className="w-24 h-24 flex-shrink-0 relative overflow-hidden rounded-xl bg-white/40 dark:bg-black/10 p-1 shadow-sm border border-black/5 dark:border-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                <img
                  src={subject.illustrationUrl}
                  alt={name}
                  className="w-full h-full object-contain rounded-lg"
                  loading="lazy"
                />
              </div>
            ) : null}
          </div>
          <div className="mt-6 flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all" style={{ color: subject?.color ?? '#8B5CF6' }}>
            {t('dashboard.startLearning')}
            <ArrowRight className="w-4 h-4" />
          </div>
      </div>

    </>
  );
}
