'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { MessageSquare, X, CheckCheck, Loader2, Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { toast } from 'sonner';

interface FeedbackButtonProps {
  subjectContext?: string;
}

interface FeedbackReply {
  id: string;
  message: string;
  rating: number | null;
  category: string;
  admin_reply: string;
  replied_at: string;
  reply_seen: boolean;
  created_at: string;
  subject_context: string | null;
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

  // Replies from admin
  const [replies, setReplies] = useState<FeedbackReply[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [repliesOpen, setRepliesOpen] = useState(false);

  // Load replies when student is known
  useEffect(() => {
    if (!activeStudent?.id) return;
    fetchReplies();
  }, [activeStudent?.id]);

  const fetchReplies = useCallback(async () => {
    if (!activeStudent?.id) return;
    try {
      const res = await fetch(`/api/feedback/reply?studentId=${activeStudent.id}`);
      const data = await res.json();
      const list: FeedbackReply[] = data.replies ?? [];
      setReplies(list);
      setUnreadCount(list.filter(r => !r.reply_seen).length);
    } catch {
      // silent
    }
  }, [activeStudent?.id]);

  // When modal opens, auto-expand replies if there are unread ones
  useEffect(() => {
    if (showFeedback && unreadCount > 0) {
      setRepliesOpen(true);
    }
  }, [showFeedback, unreadCount]);

  // Mark replies as seen when student reads them
  const markRepliesSeen = useCallback(async (ids: string[]) => {
    for (const id of ids) {
      try {
        await fetch('/api/feedback/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackId: id }),
        });
      } catch {
        // silent
      }
    }
    setUnreadCount(0);
    setReplies(prev => prev.map(r => ({ ...r, reply_seen: true })));
  }, []);

  const handleOpenReplies = useCallback(() => {
    setRepliesOpen(v => !v);
    const unseen = replies.filter(r => !r.reply_seen).map(r => r.id);
    if (unseen.length) markRepliesSeen(unseen);
  }, [replies, markRepliesSeen]);

  const handleSubmit = useCallback(async () => {
    if (!fbMessage.trim() || fbSubmitting) return;
    setFbSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
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
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'Failed');
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

  const categoryLabels: Record<string, { th: string; en: string; emoji: string }> = {
    great:   { emoji: '😊', th: 'ชอบมาก',        en: 'Love it' },
    improve: { emoji: '💡', th: 'อยากให้ดีขึ้น',   en: 'Could improve' },
    bug:     { emoji: '🐛', th: 'มีปัญหา',        en: 'Found a bug' },
    general: { emoji: '💬', th: 'ทั่วไป',          en: 'General' },
  };

  return (
    <>
      {/* ── Floating button ─────────────────────────────── */}
      <div className="fixed bottom-32 right-3 z-40 flex flex-col items-center gap-1">
        <button
          onClick={() => setShowFeedback(true)}
          title={locale === 'th' ? 'ส่งความคิดเห็นถึงผู้พัฒนา' : 'Send feedback to developer'}
          className="relative w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ring-2 ring-purple-400/30"
        >
          <MessageSquare className="w-5 h-5" />
          {/* Unread reply badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
              {unreadCount}
            </span>
          )}
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
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="bg-purple-600 px-5 py-4 flex items-center justify-between shrink-0">
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

              <div className="overflow-y-auto flex-1">
                {/* ── Replies section ── */}
                {replies.length > 0 && (
                  <div className="border-b border-border">
                    <button
                      onClick={handleOpenReplies}
                      className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Reply className="w-4 h-4 text-purple-500" />
                        <span>{locale === 'th' ? 'คำตอบจากทีมพัฒนา' : 'Replies from the Nemo team'}</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} {locale === 'th' ? 'ใหม่' : 'new'}
                          </span>
                        )}
                      </div>
                      {repliesOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </button>

                    <AnimatePresence>
                      {repliesOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            {replies.map(reply => {
                              const cat = categoryLabels[reply.category] ?? categoryLabels.general;
                              const stars = '⭐'.repeat(reply.rating ?? 0);
                              return (
                                <div key={reply.id} className={`rounded-xl border p-3 space-y-2 ${!reply.reply_seen ? 'border-purple-400/60 bg-purple-50 dark:bg-purple-950/20' : 'border-border bg-muted/20'}`}>
                                  {/* Original feedback */}
                                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                    <span>{cat.emoji} {locale === 'th' ? cat.th : cat.en}</span>
                                    {stars && <span>{stars}</span>}
                                    {reply.subject_context && <span className="opacity-60">· {reply.subject_context}</span>}
                                    <span className="opacity-50 ml-auto">{new Date(reply.created_at).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-xs text-foreground/70 italic border-l-2 border-muted-foreground/30 pl-2">
                                    "{reply.message}"
                                  </p>
                                  {/* Admin reply */}
                                  <div className="flex gap-2 pt-1">
                                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-white text-[10px] font-bold">N</span>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mb-0.5">
                                        {locale === 'th' ? 'ทีม Nemo ตอบกลับ:' : 'Nemo team replied:'}
                                      </p>
                                      <p className="text-sm leading-relaxed">{reply.admin_reply}</p>
                                      <p className="text-[10px] text-muted-foreground/50 mt-1">
                                        {new Date(reply.replied_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── Submit section ── */}
                {fbDone ? (
                  <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
                    <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCheck className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="font-semibold text-base">{locale === 'th' ? 'ขอบคุณมากครับ! 🙏' : 'Thank you so much! 🙏'}</p>
                    <p className="text-sm text-muted-foreground text-center">
                      {locale === 'th' ? 'ทีมพัฒนาจะอ่านและตอบกลับโดยเร็ว' : 'The Nemo team will read and reply soon!'}
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
                        {(['great', 'improve', 'bug'] as const).map(id => {
                          const c = categoryLabels[id];
                          return (
                            <button
                              key={id}
                              onClick={() => setFbCategory(id)}
                              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-medium transition-all ${
                                fbCategory === id
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                                  : 'border-border bg-card/50 hover:bg-muted/40 text-muted-foreground'
                              }`}
                            >
                              <span className="text-lg">{c.emoji}</span>
                              <span>{locale === 'th' ? c.th : c.en}</span>
                            </button>
                          );
                        })}
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
                        ? 'ทีมพัฒนาจะอ่านและอาจตอบกลับให้คุณในที่นี้'
                        : 'The Nemo team will read your message and may reply right here'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
