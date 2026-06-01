'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/contexts/language-context';
import type { SubjectInfo } from '@/lib/subjects';
import { ArrowRight, X, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubjectCardProps {
  subject: SubjectInfo;
  index: number;
}

export function SubjectCard({ subject, index }: SubjectCardProps) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const Icon = subject?.icon;
  const name = locale === 'th' ? (subject?.name_th ?? '') : (subject?.name_en ?? '');
  const desc = locale === 'th' ? (subject?.description_th ?? '') : (subject?.description_en ?? '');

  const hasSuggestions = (subject?.suggestions?.length ?? 0) > 0;

  function handleCardClick(e: React.MouseEvent) {
    e.preventDefault();
    if (hasSuggestions) {
      setShowPicker(true);
    } else {
      router.push(`/chat/${subject?.slug ?? ''}`);
    }
  }

  function handleTopicClick(labelEn: string, labelTh: string) {
    const label = locale === 'th' ? labelTh : labelEn;
    router.push(`/chat/${subject?.slug ?? ''}?topic=${encodeURIComponent(label)}`);
    setShowPicker(false);
  }

  function handleExploreAll() {
    router.push(`/chat/${subject?.slug ?? ''}`);
    setShowPicker(false);
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

      {/* Topic Picker Modal — only rendered client-side to avoid SSR hydration mismatch */}
      {mounted && (
        <AnimatePresence>
        {showPicker && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPicker(false)}
            />

            {/* Modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div
                  className="px-6 py-5 flex items-center gap-4"
                  style={{ background: `linear-gradient(135deg, ${subject?.color ?? '#8B5CF6'}18, ${subject?.color ?? '#8B5CF6'}08)` }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${subject?.color ?? '#8B5CF6'}20`, border: `1px solid ${subject?.color ?? '#8B5CF6'}40` }}
                  >
                    {Icon ? <Icon className="w-6 h-6" style={{ color: subject?.color ?? '#8B5CF6' }} /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-bold text-lg text-foreground">{name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {locale === 'th' ? 'เลือกหัวข้อที่ต้องการเรียน' : 'Choose a topic to study'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Topic list */}
                <div className="p-3 space-y-1 max-h-[60vh] overflow-y-auto">
                  {subject?.suggestions?.map((s, idx) => {
                    const label = locale === 'th' ? s.label_th : s.label_en;
                    const sublabel = locale === 'th' ? s.label_en : s.label_th;
                    return (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.2 }}
                        onClick={() => handleTopicClick(s.label_en, s.label_th)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-left
                          hover:bg-muted/80 active:scale-[0.98] transition-all duration-150 group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${subject?.color ?? '#8B5CF6'}15` }}
                          >
                            <Sparkles className="w-4 h-4" style={{ color: subject?.color ?? '#8B5CF6' }} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{sublabel}</p>
                          </div>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0"
                        />
                      </motion.button>
                    );
                  })}

                  {/* Divider */}
                  <div className="border-t border-border/50 my-2" />

                  {/* Explore all (free chat) option */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (subject?.suggestions?.length ?? 0) * 0.04 + 0.1 }}
                    onClick={handleExploreAll}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-left
                      hover:bg-muted/80 active:scale-[0.98] transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {locale === 'th' ? 'สำรวจทุกหัวข้อ' : 'Explore all topics'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {locale === 'th' ? `ถามอะไรก็ได้เกี่ยวกับ${name}` : `Ask anything about ${name}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
        </AnimatePresence>
      )}
    </>
  );
}
