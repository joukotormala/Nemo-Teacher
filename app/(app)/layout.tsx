'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { DashboardNav } from '@/components/dashboard-nav';
import { Loader2 } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profileComplete, refreshProfile } = useAuth();
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (!profileComplete) {
        router.replace('/onboarding');
      }
    }
  }, [user, loading, profileComplete, router]);

  // iOS Safari workaround: unlock Web Speech API globally on first interaction
  useEffect(() => {
    const unlockSpeech = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          const u = new SpeechSynthesisUtterance('');
          u.volume = 0;
          u.rate = 1;
          window.speechSynthesis.speak(u);
        } catch (e) {}
      }
      document.removeEventListener('touchstart', unlockSpeech);
      document.removeEventListener('click', unlockSpeech);
    };
    document.addEventListener('touchstart', unlockSpeech, { once: true });
    document.addEventListener('click', unlockSpeech, { once: true });
    return () => {
      document.removeEventListener('touchstart', unlockSpeech);
      document.removeEventListener('click', unlockSpeech);
    };
  }, []);

  // Refresh profile from DB on every page load so deleted/added students
  // are reflected immediately without requiring a full browser reload
  useEffect(() => {
    if (user && !loading) {
      refreshProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-background to-cyan-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <DashboardNav />
      <main className="pt-16">{children}</main>
    </div>
  );
}
