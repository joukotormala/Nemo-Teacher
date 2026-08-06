'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Trophy, ChevronRight, X, Mic, MicOff, Send } from 'lucide-react';

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
  { value: 1, emoji: '😕', labelEn: 'Not really', labelTh: 'ยังไม่เข้าใจ', labelSv: 'Inte direkt' },
  { value: 2, emoji: '😐', labelEn: 'A little',   labelTh: 'เข้าใจนิดหน่อย', labelSv: 'Lite grann' },
  { value: 3, emoji: '🙂', labelEn: 'Mostly',     labelTh: 'เข้าใจส่วนใหญ่', labelSv: 'Mestadelen' },
  { value: 4, emoji: '😊', labelEn: 'Well',       labelTh: 'เข้าใจดี',       labelSv: 'Bra' },
  { value: 5, emoji: '🤩', labelEn: 'Perfectly!', labelTh: 'เข้าใจมาก!',    labelSv: 'Perfekt!' },
];

type Step = 'confidence' | 'loading' | 'quiz' | 'result';

// Check if a typed/spoken answer matches one of the options.
// Returns the matched option index, or -1 if no match.
function matchAnswer(input: string, options: string[]): number {
  const normalise = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\u0e00-\u0e7f]/gi, '').trim();

  const inp = normalise(input);
  if (!inp) return -1;

  // Exact letter match: "a", "b", "c", "d"
  const letterIdx = ['a', 'b', 'c', 'd'].indexOf(inp);
  if (letterIdx !== -1 && letterIdx < options.length) return letterIdx;

  // Exact number match: "1", "2", "3", "4"
  const numIdx = parseInt(inp) - 1;
  if (!isNaN(numIdx) && numIdx >= 0 && numIdx < options.length) return numIdx;

  // Substring match against option text (lowercased)
  const idx = options.findIndex(opt => normalise(opt).includes(inp) || inp.includes(normalise(opt)));
  return idx;
}

export function QuizModal({
  isOpen, onClose, onComplete,
  messages, subject, subjectEmoji, studentName, locale, numQuestions = 3,
}: QuizModalProps) {
  const th = locale === 'th';
  const sv = locale === 'sv';

  const [step, setStep] = useState<Step>('confidence');
  const [confidence, setConfidence] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState('');

  // Typing / STT state
  const [typedAnswer, setTypedAnswer] = useState('');
  const [typeError, setTypeError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getSpeechLang = () => {
    if (locale === 'th') return 'th-TH';
    if (locale === 'sv') return 'sv-SE';
    return 'en-US';
  };

  const reset = useCallback(() => {
    setStep('confidence');
    setConfidence(0);
    setQuestions([]);
    setCurrentQ(0);
    setSelected(null);
    setAnswers([]);
    setShowExplanation(false);
    setError('');
    setTypedAnswer('');
    setTypeError('');
    setIsListening(false);
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Stop mic when modal closes or step changes away from quiz
  useEffect(() => {
    if (!isOpen || step !== 'quiz') {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [isOpen, step]);

  // Reset typed answer when question changes
  useEffect(() => {
    setTypedAnswer('');
    setTypeError('');
  }, [currentQ]);

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
    setTypedAnswer('');
    setTypeError('');
    // Stop mic if active
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    isListeningRef.current = false;
  }, [selected]);

  // Submit typed / spoken answer
  const handleSubmitTyped = useCallback(() => {
    if (selected !== null || !typedAnswer.trim()) return;
    const q = questions[currentQ];
    if (!q) return;

    const matchIdx = matchAnswer(typedAnswer, q.options);
    if (matchIdx === -1) {
      setTypeError(
        th ? '❓ ไม่เข้าใจคำตอบ — ลองพิมพ์ A, B, C หรือ D หรือส่วนหนึ่งของคำตอบ'
          : sv ? '❓ Förstår inte svaret — prova att skriva A, B, C eller D'
          : '❓ Couldn\'t match your answer — try typing A, B, C or D'
      );
      return;
    }
    setTypeError('');
    handleAnswer(matchIdx);
  }, [selected, typedAnswer, questions, currentQ, th, sv, handleAnswer]);

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

  // Speech recognition toggle
  const toggleListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop if running
    if (isListeningRef.current && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    // Request mic permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechLang();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTypedAnswer(transcript);
        setTypeError('');
      };

      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        recognitionRef.current = null;
        // Auto-submit after voice input finishes
        setTimeout(() => {
          setTypedAnswer(prev => {
            if (prev.trim()) {
              const q = questions[currentQ];
              if (q && selected === null) {
                const matchIdx = matchAnswer(prev, q.options);
                if (matchIdx !== -1) {
                  handleAnswer(matchIdx);
                }
              }
            }
            return prev;
          });
        }, 400);
      };

      recognition.onerror = () => {
        setIsListening(false);
        isListeningRef.current = false;
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
    } catch {
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [questions, currentQ, selected, handleAnswer]);

  const score = answers.filter(Boolean).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const scoreMsg = () => {
    if (pct === 100) return th ? '🏆 เยี่ยมมาก! คะแนนเต็ม!' : sv ? '🏆 Perfekt resultat!' : '🏆 Perfect score!';
    if (pct >= 66)  return th ? '🎉 ดีมาก! เกือบเต็มเลย!'  : sv ? '🎉 Bra jobbat!' : '🎉 Great job!';
    if (pct >= 33)  return th ? '💪 ไม่เป็นไร ลองทบทวนอีกครั้ง!' : sv ? '💪 Fortsätt så, repetera och försök igen!' : '💪 Keep going, review and try again!';
    return th ? '📚 ทบทวนบทเรียนนี้อีกครั้งนะ!' : sv ? '📚 Repetera denna läxa och försök igen!' : '📚 Review this lesson and try again!';
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
                {step === 'confidence' && (th ? 'เข้าใจบทเรียนนี้แค่ไหน?' : sv ? 'Hur väl förstod du?' : 'How well did you understand?')}
                {step === 'loading'    && (th ? 'กำลังสร้างแบบทดสอบ...' : sv ? 'Skapar ditt prov...' : 'Creating your quiz...')}
                {step === 'quiz'       && (th ? `ข้อที่ ${currentQ + 1} จาก ${questions.length}` : sv ? `Fråga ${currentQ + 1} av ${questions.length}` : `Question ${currentQ + 1} of ${questions.length}`)}
                {step === 'result'     && (th ? 'ผลการทดสอบ 🎯' : sv ? 'Provresultat 🎯' : 'Quiz Results 🎯')}
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
                    {th
                      ? `${studentName} เข้าใจสิ่งที่เรียนวันนี้แค่ไหน?`
                      : sv
                      ? `Hur väl förstår du det du har lärt dig idag, ${studentName}?`
                      : `How well do you understand what you learned today, ${studentName}?`}
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
                          {th ? opt.labelTh : sv ? opt.labelSv : opt.labelEn}
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
                    {th ? 'ต่อไป — ทำแบบทดสอบ' : sv ? 'Nästa — Ta provet' : 'Next — Take the quiz'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={handleClose} className="w-full text-xs text-muted-foreground hover:text-foreground text-center">
                    {th ? 'ข้ามการทดสอบ' : sv ? 'Hoppa över provet' : 'Skip quiz'}
                  </button>
                </div>
              )}

              {/* STEP 2: Loading */}
              {step === 'loading' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">
                    {th ? 'Nemo กำลังสร้างคำถามสำหรับคุณ...' : sv ? 'Nemo skapar frågor åt dig...' : 'Nemo is creating questions just for you...'}
                  </p>
                </div>
              )}

              {/* STEP 3: Quiz */}
              {step === 'quiz' && q && (
                <div className="space-y-4">
                  <p className="font-semibold text-base leading-snug">{q.question}</p>

                  {/* Multiple-choice buttons */}
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

                  {/* ── Type / Speak your answer ── */}
                  {selected === null && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <p className="text-xs text-muted-foreground text-center">
                        {th ? '— หรือพิมพ์ / พูดคำตอบ —'
                          : sv ? '— eller skriv / säg ditt svar —'
                          : '— or type / speak your answer —'}
                      </p>
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={typedAnswer}
                          onChange={e => { setTypedAnswer(e.target.value); setTypeError(''); }}
                          onKeyDown={e => { if (e.key === 'Enter') handleSubmitTyped(); }}
                          placeholder={th ? 'พิมพ์คำตอบ หรือ A B C D...' : sv ? 'Skriv ditt svar eller A B C D...' : 'Type your answer or A B C D...'}
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        {/* Mic button */}
                        <button
                          onClick={toggleListening}
                          title={isListening
                            ? (th ? 'หยุดฟัง' : sv ? 'Sluta lyssna' : 'Stop listening')
                            : (th ? 'พูดคำตอบ' : sv ? 'Tala ditt svar' : 'Speak your answer')}
                          className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1 text-sm font-medium ${
                            isListening
                              ? 'bg-red-500 border-red-500 text-white animate-pulse'
                              : 'border-border hover:border-purple-400 hover:text-purple-500'
                          }`}
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        {/* Submit button */}
                        <button
                          onClick={handleSubmitTyped}
                          disabled={!typedAnswer.trim()}
                          title={th ? 'ส่งคำตอบ' : sv ? 'Skicka svar' : 'Submit answer'}
                          className="px-3 py-2 rounded-xl text-white disabled:opacity-40 transition-all flex items-center"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      {typeError && (
                        <p className="text-amber-500 text-xs text-center">{typeError}</p>
                      )}
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {showExplanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`rounded-xl px-4 py-3 text-sm ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'}`}
                      >
                        <span className="font-semibold">{isCorrect ? (th ? '✅ ถูกต้อง! ' : sv ? '✅ Rätt! ' : '✅ Correct! ') : (th ? '❌ ไม่ถูก — ' : sv ? '❌ Inte riktigt — ' : '❌ Not quite — ')}</span>
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
                        ? (th ? 'ดูผลลัพธ์ 🎯' : sv ? 'Visa resultat 🎯' : 'See results 🎯')
                        : (th ? 'ข้อถัดไป →' : sv ? 'Nästa →' : 'Next →')}
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
                        : sv
                        ? `Du fick ${score} av ${total} rätt (${pct}%)`
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
                    {th ? 'เสร็จสิ้น! ดูความก้าวหน้า 📊' : sv ? 'Klar! Visa mina framsteg 📊' : 'Done! View my progress 📊'}
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
