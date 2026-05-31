'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, GraduationCap, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithGoogle, user, loading, profileComplete } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(profileComplete ? '/dashboard' : '/onboarding');
    }
  }, [user, loading, profileComplete, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error?.message ?? 'Login failed');
      } else {
        toast.success(t('auth.loginSuccess'));
      }
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
      if (error) {
        toast.error(error?.message ?? 'Failed to send reset email');
      } else {
        toast.success(t('auth.resetSentSuccess'));
        setShowForgot(false);
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      toast.error(err?.message ?? 'Google sign-in failed');
    }
  };

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
          <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-4">
            AI Teacher Nemo
          </h1>
          <p className="text-lg text-white/80">
            ระบบครูอัจฉริยะสำหรับการเรียนรู้
          </p>
          <p className="text-sm text-white/60 mt-2">
            AI-Powered Learning for Every Student
          </p>
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                if (locale === 'th') setLocale('en');
                else if (locale === 'en') setLocale('sv');
                else setLocale('th');
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-muted/50"
            >
              <Globe className="w-4 h-4" />
              {locale === 'th' ? 'EN' : locale === 'en' ? 'SV' : 'ไทย'}
            </button>
          </div>

          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">{t('app.name')}</h1>
          </div>

          <div className="bg-card rounded-xl p-8 shadow-2xl border border-border/50">
            <AnimatePresence mode="wait">
              {showForgot ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-1">
                    {t('auth.forgotPassword')}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">
                    {t('auth.enterEmailReset')}
                  </p>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t('auth.sendResetLink')}
                    </Button>

                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="text-sm text-primary hover:underline"
                      >
                        {t('auth.backToLogin')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="text-2xl font-display font-bold tracking-tight mb-1">
                    {t('auth.welcome')}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">{t('auth.login')}</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">{t('auth.password')}</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors"
                        >
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {t('auth.login')}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground">{t('auth.or')}</span>
                    </div>
                  </div>

                  <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn}>
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
