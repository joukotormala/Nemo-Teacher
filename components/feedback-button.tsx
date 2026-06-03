'use client';

import React, { useState, useCallback } from 'react';
import { MessageSquare, X, CheckCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { toast } from 'sonner';

interface FeedbackButtonProps {
  subjectContext?: string;
}

export function FeedbackButton({ subjectContext }: FeedbackButtonProps) {
  const { activeStudent } = useAuth();
  const { locale } = useLanguage();

  const studentName =
    activeStudent?.nickname_thai ??
    activeStudent?.nickname_english ??
    activeStudent?.name_english ??
    activeStudent?.name_thai ?? '';

  const [showFeedback, setShowFeedback] = useState(false);
  const [fbRating, setFbRating] = useState(0);
  const [fbCategory, setFbCategory] = useState<'great' | 'improve' | 'bug' | 'general'>('general');
  const [fbMessage, setFbMessage] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbDone, setFbDone] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!fbMessage.trim() || fbSubmitting) return;
    setFbSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeStudent?.id,
          studentName,
          rating: fbRating || null,
          category: fbCategory,
          message: fbMessage.trim(),
          subjectContext: subjectContext ?? null,
        }),
      });
      setFbDone(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFbDone(false);
        setFbRating(0);
        setFbCategory('general');
        setFbMessage('');
      }, 2500);
    } catch {
      toast.error(locale === 'th' ? 'ส่งไม่ได้ กรุณาลองใหม่' : 'Could not send, please try again');
    } finally {
      setFbSubmitting(false);
    }
  }, [fbMessage, fbRating, fbCategory, fbSubmitting, activeStudent, studentName, subjectContext, locale]);

  return (
    <>
      {/* ── Floating button ─────────────────────────────── */}
      <div className="fixed bottom-32 right-3 z-40 flex flex-col items-center gap-1">
        <button
          onClick={() => setShowFeedback(true)}
          title={locale === 'th' ? 'ส่งความคิดเห็นถึงผู้พัฒนา' : 'Send feedback to developer'}
          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ring-2 ring-purple-400/30"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
        <span className="text-[9px] font-semibold text-purple-500 dark:text-purple-400 leading-none tracking-tight">
          {locale === 'th' ? 'ความเห็น' : 'Feedback'}
        </span>
      </div>

      {/* ── Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowFeedback(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-purple-600 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-semibold text-sm">
                    {locale === 'th' ? 'บอกเราว่าคิดอะไรกับ Nemo AI' : 'Tell us what you think about Nemo AI'}
                  </span>
                </div>
                <button onClick={() => setShowFeedback(false)} className="text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {fbDone ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCheck className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="font-semibold text-base">{locale === 'th' ? 'ขอบคุณมากครับ! 🙏' : 'Thank you so much! 🙏'}</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {locale === 'th' ? 'ความคิดเห็นของคุณจะช่วยให้ Nemo ดีขึ้นเรื่อยๆ' : 'Your feedback helps make Nemo better every day!'}
                  </p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Star rating */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {locale === 'th' ? 'คุณชอบ Nemo แค่ไหน?' : 'How much do you like Nemo?'}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => setFbRating(star === fbRating ? 0 : star)}
                          className={`text-2xl transition-transform hover:scale-110 active:scale-95 ${star <= fbRating ? 'opacity-100' : 'opacity-25'}`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {locale === 'th' ? 'ประเภทความคิดเห็น' : 'Type of feedback'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'great',   emoji: '😊', th: 'ชอบมาก',        en: 'Love it' },
                        { id: 'improve', emoji: '💡', th: 'อยากให้ดีขึ้น',   en: 'Could improve' },
                        { id: 'bug',     emoji: '🐛', th: 'มีปัญหา',        en: 'Found a bug' },
                      ] as const).map(c => (
                        <button
                          key={c.id}
                          onClick={() => setFbCategory(c.id)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                            fbCategory === c.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                              : 'border-border bg-card/50 hover:bg-muted/40 text-muted-foreground'
                          }`}
                        >
                          <span className="text-lg">{c.emoji}</span>
                          <span>{locale === 'th' ? c.th : c.en}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {locale === 'th' ? 'บอกเราเพิ่มเติม (จำเป็น)' : 'Tell us more (required)'}
                    </p>
                    <textarea
                      value={fbMessage}
                      onChange={e => setFbMessage(e.target.value)}
                      rows={3}
                      placeholder={locale === 'th' ? 'เขียนความคิดเห็นของคุณที่นี่...' : 'Write your feedback here...'}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!fbMessage.trim() || fbSubmitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 font-semibold text-sm"
                  >
                    {fbSubmitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {locale === 'th' ? 'กำลังส่ง...' : 'Sending...'}</>
                    ) : (
                      locale === 'th' ? '📨 ส่งความคิดเห็น' : '📨 Send Feedback'
                    )}
                  </Button>

                  <p className="text-center text-[10px] text-muted-foreground/60">
                    {locale === 'th'
                      ? 'ความคิดเห็นจะถูกส่งถึงทีมพัฒนา Nemo โดยตรง'
                      : 'Your feedback goes directly to the Nemo development team'}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
