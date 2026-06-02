'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, GraduationCap, UserCircle, ChevronLeft, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StudentOption {
  id: string;
  name: string;
  avatarUrl?: string;
  hasPin: boolean;
}

export default function LoginPage() {
  const [tab, setTab] = useState<'parent' | 'student'>('parent');

  // Parent login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Student login state
  const [studentEmail, setStudentEmail] = useState('');
  const [studentEmailSubmitted, setStudentEmailSubmitted] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  const { signIn, signInWithGoogle, user, loading, profileComplete } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(profileComplete ? '/dashboard' : '/onboarding');
    }
  }, [user, loading, profileComplete, router]);

  // ── Parent login ──────────────────────────────────────────────────────────
  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) toast.error(error?.message ?? 'Login failed');
      else toast.success(t('auth.loginSuccess'));
    } catch (err: any) {
      toast.error(err?.message ?? 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) toast.error(error?.message ?? 'Failed to send reset email');
      else { toast.success(t('auth.resetSentSuccess')); setShowForgot(false); }
    } catch (err: any) {
      toast.error(err?.message ?? 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Student login ─────────────────────────────────────────────────────────
  const lookupStudents = async () => {
    if (!studentEmail.trim()) return;
    setLoadingStudents(true);
    setStudents([]);
    setSelectedStudent(null);
    setPin('');
    try {
      const res = await fetch(`/api/student-login?parentEmail=${encodeURIComponent(studentEmail.trim())}`);
      const data = await res.json();
      if (!data.students?.length) {
        toast.error(locale === 'th' ? 'ไม่พบบัญชีนี้' : 'No account found for that email');
        return;
      }
      setStudents(data.students);
      setStudentEmailSubmitted(true);
    } catch {
      toast.error('Could not load student profiles');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handlePinDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setPinError('');
    if (next.length === 4) verifyPin(next);
  };

  const handlePinDelete = () => setPin(p => p.slice(0, -1));

  const verifyPin = useCallback(async (p: string) => {
    if (!selectedStudent) return;
    setVerifyingPin(true);
    setPinError('');
    try {
      const res = await fetch('/api/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentEmail: studentEmail.trim(), studentId: selectedStudent.id, pin: p }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error ?? 'Wrong PIN');
        setPin('');
        return;
      }

      // Success — sign in as parent via magic link or direct sign-in prompt
      if (data.magicLink) {
        // Use the magic link to establish session
        window.location.href = data.magicLink;
      } else {
        // Fallback: store studentId and redirect to login with parent credentials
        // For now, prompt parent password entry after PIN success
        localStorage.setItem('nemo_active_student_id', data.studentId);
        toast.success(locale === 'th' ? `ยินดีต้อนรับ ${data.studentName}! 🎉` : `Welcome ${data.studentName}! 🎉`);
        // Sign in needs the parent's credentials — but we can use the stored studentId
        // to pre-select after login. Direct them to parent login with email pre-filled.
        setTab('parent');
        setEmail(studentEmail.trim());
        toast.info(locale === 'th' ? 'กรุณาให้ผู้ปกครองใส่รหัสผ่านด้วย' : 'Please ask your parent to enter their password once to activate the session.');
      }
    } catch {
      setPinError('Something went wrong. Try again.');
      setPin('');
    } finally {
      setVerifyingPin(false);
    }
  }, [selectedStudent, studentEmail, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-cyan-500 opacity-90" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-12"
        >
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-4">AI Teacher Nemo</h1>
          <p className="text-lg text-white/80">ระบบครูอัจฉริยะสำหรับการเรียนรู้</p>
          <p className="text-sm text-white/60 mt-2">AI-Powered Learning for Every Student</p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Language switcher */}
          <div className="flex justify-end mb-6">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/30">
              {(['th', 'en', 'sv'] as const).map(l => (
                <button key={l} onClick={() => setLocale(l)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${locale === l ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
                  {l === 'th' ? 'ไทย' : l === 'en' ? 'English' : 'Svenska'}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">{t('app.name')}</h1>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-muted/60 p-1 rounded-2xl mb-4 border border-border/30">
            <button
              onClick={() => setTab('parent')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'parent' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              👨‍👩‍👧 {locale === 'th' ? 'ผู้ปกครอง' : locale === 'sv' ? 'Förälder' : 'Parent'}
            </button>
            <button
              onClick={() => setTab('student')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'student' ? 'bg-gradient-to-r from-purple-500 to-cyan-500 shadow text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              🎒 {locale === 'th' ? 'นักเรียน' : locale === 'sv' ? 'Elev' : 'Student'}
            </button>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border/50">
            <AnimatePresence mode="wait">

              {/* ── PARENT TAB ─────────────────────────────────────── */}
              {tab === 'parent' && (
                <motion.div key="parent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <AnimatePresence mode="wait">
                    {showForgot ? (
                      <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-2xl font-display font-bold mb-1">{t('auth.forgotPassword')}</h2>
                        <p className="text-muted-foreground text-sm mb-6">{t('auth.enterEmailReset')}</p>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">{t('auth.email')}</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="reset-email" type="email" placeholder="name@example.com" value={email}
                                onChange={e => setEmail(e.target.value)} className="pl-10" required />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {t('auth.sendResetLink')}
                          </Button>
                          <div className="text-center">
                            <button type="button" onClick={() => setShowForgot(false)} className="text-sm text-primary hover:underline">
                              {t('auth.backToLogin')}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    ) : (
                      <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-2xl font-display font-bold mb-1">{t('auth.welcome')}</h2>
                        <p className="text-muted-foreground text-sm mb-6">{t('auth.login')}</p>
                        <form onSubmit={handleParentSubmit} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">{t('auth.email')}</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="email" type="email" placeholder="name@example.com" value={email}
                                onChange={e => setEmail(e.target.value)} className="pl-10" required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="password">{t('auth.password')}</Label>
                              <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-primary hover:underline">
                                {t('auth.forgotPassword')}
                              </button>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="password" type="password" placeholder="••••••••" value={password}
                                onChange={e => setPassword(e.target.value)} className="pl-10" required />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {t('auth.login')}
                          </Button>
                        </form>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-3 text-muted-foreground">{t('auth.or')}</span>
                          </div>
                        </div>
                        <Button type="button" variant="outline" className="w-full" onClick={() => signInWithGoogle().catch(err => toast.error(err?.message))}>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          {t('auth.google')}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── STUDENT TAB ────────────────────────────────────── */}
              {tab === 'student' && (
                <motion.div key="student" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <AnimatePresence mode="wait">

                    {/* Step 1 — enter parent email */}
                    {!studentEmailSubmitted && (
                      <motion.div key="email-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-2xl font-display font-bold mb-1">
                          {locale === 'th' ? '🎒 เข้าสู่ระบบนักเรียน' : locale === 'sv' ? '🎒 Elevinloggning' : '🎒 Student Login'}
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                          {locale === 'th' ? 'ใส่อีเมลของผู้ปกครองเพื่อค้นหาบัญชีของคุณ' : locale === 'sv' ? 'Ange förälderns e-post' : "Enter your parent's email to find your account"}
                        </p>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="student-email">
                              {locale === 'th' ? 'อีเมลผู้ปกครอง' : locale === 'sv' ? 'Förälderns e-post' : "Parent's Email"}
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input id="student-email" type="email" placeholder="parent@example.com"
                                value={studentEmail} onChange={e => setStudentEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && lookupStudents()}
                                className="pl-10" />
                            </div>
                          </div>
                          <Button className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white"
                            onClick={lookupStudents} disabled={loadingStudents || !studentEmail.trim()}>
                            {loadingStudents ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {locale === 'th' ? 'ค้นหาบัญชีของฉัน' : locale === 'sv' ? 'Hitta mitt konto' : 'Find My Account'}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2 — pick student profile */}
                    {studentEmailSubmitted && !selectedStudent && (
                      <motion.div key="picker-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex items-center gap-2 mb-4">
                          <button onClick={() => { setStudentEmailSubmitted(false); setStudents([]); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <h2 className="font-display font-bold text-lg">
                            {locale === 'th' ? 'เลือกโปรไฟล์ของคุณ' : locale === 'sv' ? 'Välj din profil' : 'Pick your profile'}
                          </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {students.map(s => (
                            <motion.button key={s.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                              onClick={() => { setSelectedStudent(s); setPin(''); setPinError(''); }}
                              className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-border hover:border-purple-400 bg-muted/30 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 transition-all">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center shadow-md">
                                {s.avatarUrl
                                  ? <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                                  : <UserCircle className="w-10 h-10 text-white" />}
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-sm">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {s.hasPin ? '🔒 PIN set' : '⚠️ No PIN yet'}
                                </p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3 — enter PIN */}
                    {selectedStudent && (
                      <motion.div key="pin-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex items-center gap-2 mb-4">
                          <button onClick={() => { setSelectedStudent(null); setPin(''); setPinError(''); }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <h2 className="font-display font-bold text-lg">
                            {locale === 'th' ? `สวัสดี ${selectedStudent.name}! 👋` : `Hi ${selectedStudent.name}! 👋`}
                          </h2>
                        </div>

                        <p className="text-center text-muted-foreground text-sm mb-6">
                          {locale === 'th' ? 'ใส่รหัส PIN 4 หลักของคุณ' : locale === 'sv' ? 'Ange din 4-siffriga PIN' : 'Enter your 4-digit PIN'}
                        </p>

                        {/* PIN dots */}
                        <div className="flex justify-center gap-4 mb-6">
                          {[0, 1, 2, 3].map(i => (
                            <motion.div key={i}
                              animate={{ scale: pin.length === i + 1 ? [1, 1.3, 1] : 1 }}
                              transition={{ duration: 0.15 }}
                              className={`w-5 h-5 rounded-full border-2 transition-all ${
                                i < pin.length
                                  ? 'bg-gradient-to-br from-purple-500 to-cyan-500 border-purple-500'
                                  : 'border-muted-foreground/40'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Error */}
                        {pinError && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className="text-center text-red-500 text-sm mb-4 font-medium">
                            {pinError}
                          </motion.p>
                        )}

                        {verifyingPin && (
                          <div className="flex justify-center mb-4">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                          </div>
                        )}

                        {/* Number pad */}
                        {!verifyingPin && (
                          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                            {['1','2','3','4','5','6','7','8','9','',  '0','⌫'].map((d, i) => (
                              d === '' ? <div key={i} /> :
                              d === '⌫' ? (
                                <motion.button key="del" whileTap={{ scale: 0.9 }}
                                  onClick={handlePinDelete}
                                  className="h-14 rounded-2xl bg-muted flex items-center justify-center text-xl font-semibold hover:bg-muted/80 transition-colors">
                                  <Delete className="w-5 h-5" />
                                </motion.button>
                              ) : (
                                <motion.button key={d} whileTap={{ scale: 0.9 }}
                                  onClick={() => handlePinDigit(d)}
                                  className="h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-950/30 dark:to-cyan-950/30 border border-border/50 text-xl font-bold hover:from-purple-100 hover:to-cyan-100 dark:hover:from-purple-900/40 dark:hover:to-cyan-900/40 transition-all shadow-sm">
                                  {d}
                                </motion.button>
                              )
                            ))}
                          </div>
                        )}

                        {!selectedStudent.hasPin && (
                          <p className="text-center text-amber-600 dark:text-amber-400 text-xs mt-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
                            {locale === 'th'
                              ? '⚠️ ยังไม่มี PIN — ให้ผู้ปกครองตั้ง PIN ในหน้า Settings ก่อน'
                              : '⚠️ No PIN set yet — ask your parent to set a PIN in Settings first'}
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {t('auth.noAccount')}{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              {t('auth.signup')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
