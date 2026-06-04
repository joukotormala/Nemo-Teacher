'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Trophy, ChevronRight, X } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (confidence: number, score: number, total: number) => void;
  messages: { role: string; content: string }[];
  subject: string;
  subjectEmoji?: string | null;
  studentName: string;
  locale: string;
  numQuestions?: number;
}

const CONFIDENCE_OPTIONS = [
  { value: 1, emoji: '😕', labelEn: 'Not really', labelTh: 'ยังไม่เข้าใจ' },
  { value: 2, emoji: '😐', labelEn: 'A little',   labelTh: 'เข้าใจนิดหน่อย' },
  { value: 3, emoji: '🙂', labelEn: 'Mostly',     labelTh: 'เข้าใจส่วนใหญ่' },
  { value: 4, emoji: '😊', labelEn: 'Well',       labelTh: 'เข้าใจดี' },
  { value: 5, emoji: '🤩', labelEn: 'Perfectly!', labelTh: 'เข้าใจมาก!' },
];

type Step = 'confidence' | 'loading' | 'quiz' | 'result';

export function QuizModal({
  isOpen, onClose, onComplete,
  messages, subject, subjectEmoji, studentName, locale, numQuestions = 3,
}: QuizModalProps) {
  const th = locale === 'th';

  const [step, setStep] = useState<Step>('confidence');
  const [confidence, setConfidence] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStep('confidence');
    setConfidence(0);
    setQuestions([]);
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowExplanation(false);
    setError('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleConfidenceNext = useCallback(async () => {
    if (!confidence) return;
    setStep('loading');
    setError('');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, subject, studentName, locale, numQuestions }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error(data.error ?? 'Failed');
      setQuestions(data.questions);
      setStep('quiz');
    } catch (e: any) {
      setError(e.message ?? 'Could not generate quiz');
      setStep('confidence');
    }
  }, [confidence, messages, subject, studentName, locale, numQuestions]);

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplanation(true);
  }, [selected]);

  const handleNextQuestion = useCallback(() => {
    const isCorrect = selected === questions[currentQ]?.correctIndex;
    const newAnswers = [...answers, isCorrect];

    if (currentQ + 1 >= questions.length) {
      setAnswers(newAnswers);
      setStep('result');
      const score = newAnswers.filter(Boolean).length;
      onComplete(confidence, score, questions.length);
    } else {
      setAnswers(newAnswers);
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowExplanation(false);
    }
  }, [selected, questions, currentQ, answers, confidence, onComplete]);

  const score = answers.filter(Boolean).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const scoreMsg = () => {
    if (pct === 100) return th ? '🏆 เยี่ยมมาก! คะแนนเต็ม!' : '🏆 Perfect score!';
    if (pct >= 66)  return th ? '🎉 ดีมาก! เกือบเต็มเลย!'  : '🎉 Great job!';
    if (pct >= 33)  return th ? '💪 ไม่เป็นไร ลองทบทวนอีกครั้ง!' : '💪 Keep going, review and try again!';
    return th ? '📚 ทบทวนบทเรียนนี้อีกครั้งนะ!' : '📚 Review this lesson and try again!';
  };

  const q = questions[currentQ];
  const isCorrect = selected === q?.correctIndex;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4" style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>
              <button onClick={handleClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
                {subjectEmoji ? `${subjectEmoji} ` : ''}{subject}
              </p>
              <h2 className="text-white text-xl font-bold">
                {step === 'confidence' && (th ? 'เข้าใจบทเรียนนี้แค่ไหน?' : 'How well did you understand?')}
                {step === 'loading'    && (th ? 'กำลังสร้างแบบทดสอบ...' : 'Creating your quiz...')}
                {step === 'quiz'       && (th ? `ข้อที่ ${currentQ + 1} จาก ${questions.length}` : `Question ${currentQ + 1} of ${questions.length}`)}
                {step === 'result'     && (th ? 'ผลการทดสอบ 🎯' : 'Quiz Results 🎯')}
              </h2>
              {/* Progress bar for quiz */}
              {step === 'quiz' && (
                <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6">
              {/* STEP 1: Confidence rating */}
              {step === 'confidence' && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground text-center">
                    {th ? `${studentName} เข้าใจสิ่งที่เรียนวันนี้แค่ไหน?` : `How well do you understand what you learned today, ${studentName}?`}
                  </p>
                  <div className="flex justify-center gap-3">
                    {CONFIDENCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setConfidence(opt.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all ${
                          confidence === opt.value
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 scale-110'
                            : 'border-transparent hover:border-purple-300 hover:scale-105'
                        }`}
                      >
                        <span className="text-3xl">{opt.emoji}</span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {th ? opt.labelTh : opt.labelEn}
                        </span>
                      </button>
                    ))}
                  </div>
                  {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                  <button
                    onClick={handleConfidenceNext}
                    disabled={!confidence}
                    className="w-full h-12 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}
                  >
                    {th ? 'ต่อไป — ทำแบบทดสอบ' : 'Next — Take the quiz'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={handleClose} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                    {th ? 'ข้ามการทดสอบ' : 'Skip quiz'}
                  </button>
                </div>
              )}

              {/* STEP 2: Loading */}
              {step === 'loading' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    {th ? 'Nemo กำลังสร้างคำถามสำหรับคุณ...' : 'Nemo is creating questions just for you...'}
                  </p>
                </div>
              )}

              {/* STEP 3: Quiz */}
              {step === 'quiz' && q && (
                <div className="space-y-4">
                  <p className="font-semibold text-base leading-snug">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, idx) => {
                      let variant = 'border-border bg-card/50 hover:bg-muted/30';
                      if (selected !== null) {
                        if (idx === q.correctIndex)  variant = 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
                        else if (idx === selected)   variant = 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
                        else                         variant = 'border-border opacity-50';
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={selected !== null}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-3 ${variant}`}
                        >
                          <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                            {['A','B','C','D'][idx]}
                          </span>
                          {opt}
                          {selected !== null && idx === q.correctIndex && <CheckCircle className="w-4 h-4 ml-auto shrink-0 text-green-500" />}
                          {selected !== null && idx === selected && idx !== q.correctIndex && <XCircle className="w-4 h-4 ml-auto shrink-0 text-red-500" />}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}
                      >
                        <span className="font-semibold">{isCorrect ? (th ? '✅ ถูกต้อง! ' : '✅ Correct! ') : (th ? '❌ ไม่ถูก — ' : '❌ Not quite — ')}</span>
                        {q.explanation}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {selected !== null && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleNextQuestion}
                      className="w-full h-11 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}
                    >
                      {currentQ + 1 >= questions.length
                        ? (th ? 'ดูผลลัพธ์ 🎯' : 'See results 🎯')
                        : (th ? 'ข้อถัดไป →' : 'Next →')}
                    </motion.button>
                  )}
                </div>
              )}

              {/* STEP 4: Result */}
              {step === 'result' && (
                <div className="flex flex-col items-center gap-4 text-center">
                  {/* Score ring */}
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                      <motion.circle
                        cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                        stroke="url(#grad)" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - pct / 100) }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#db2777" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-500 mb-0.5" />
                      <span className="text-2xl font-bold">{score}/{total}</span>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-lg">{scoreMsg()}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {th
                        ? `คุณตอบถูก ${score} จาก ${total} ข้อ (${pct}%)`
                        : `You got ${score} out of ${total} correct (${pct}%)`}
                    </p>
                  </div>

                  {/* Per-question summary */}
                  <div className="flex gap-2">
                    {answers.map((correct, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${correct ? 'bg-green-500' : 'bg-red-400'}`}>
                        {correct ? '✓' : '✗'}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full h-11 rounded-2xl font-semibold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}
                  >
                    {th ? 'เสร็จสิ้น! ดูความก้าวหน้า 📊' : 'Done! View my progress 📊'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
