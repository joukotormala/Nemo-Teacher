'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Button } from '@/components/ui/button';
import { GraduationCap, LayoutDashboard, BarChart3, Settings, LogOut, Globe, Brain } from 'lucide-react';
import { toast } from 'sonner';

export function DashboardNav() {
  const { signOut, students, activeStudent, switchActiveStudent, user, changeLanguage } = useAuth();
  const { t, locale } = useLanguage();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success(
        locale === 'th'
          ? 'ออกจากระบบสำเร็จ'
          : locale === 'sv'
          ? 'Utloggad framgångsrikt'
          : 'Logged out successfully'
      );
    } catch {}
  };

  const navItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/progress', label: t('nav.progress'), icon: BarChart3 },
    { href: '/memory', label: locale === 'th' ? 'หน่วยความจำ' : locale === 'sv' ? 'Minne' : 'Memory', icon: Brain },
    { href: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:inline">
            {t('app.name')}
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems?.map?.((item: any) => {
            const Icon = item?.icon;
            const isActive = pathname === item?.href || pathname?.startsWith?.(item?.href + '/');
            return (
              <Link key={item?.href} href={item?.href ?? '/dashboard'}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={`gap-1.5 ${isActive ? '' : 'text-muted-foreground'}`}
                >
                  {Icon ? <Icon className="w-4 h-4" /> : null}
                  <span className="hidden sm:inline">{item?.label ?? ''}</span>
                </Button>
              </Link>
            );
          }) ?? []}
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-0.5 bg-muted/40 p-1 rounded-xl border border-border/30">
            <button
              onClick={() => changeLanguage('th')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-fast ${
                locale === 'th'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              TH
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-fast ${
                locale === 'en'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => changeLanguage('sv')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-fast ${
                locale === 'sv'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              SV
            </button>
          </div>

          {/* Child Switcher Dropdown */}
          {students.length > 0 && activeStudent ? (
            <div className="relative flex items-center bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl px-2.5 py-1 text-primary transition-all shadow-sm">
              <span className="text-xs font-semibold mr-1.5 hidden md:inline text-primary/70">
                {locale === 'th' ? 'ผู้เรียน:' : locale === 'sv' ? 'Elev:' : 'Student:'}
              </span>
              <select
                value={activeStudent.id}
                onChange={(e) => {
                  switchActiveStudent(e.target.value);
                  toast.success(
                    locale === 'th'
                      ? 'สลับโปรไฟล์ผู้เรียนสำเร็จ'
                      : locale === 'sv'
                      ? 'Elevprofil ändrad framgångsrikt'
                      : 'Switched student profile successfully'
                  );
                }}
                className="bg-transparent text-sm font-semibold text-primary outline-none cursor-pointer pr-1 py-0.5"
              >
                {students.map((kid) => {
                  const kidName =
                    locale === 'th'
                      ? (kid.nickname_thai ?? kid.name_thai)
                      : (kid.nickname_english ?? kid.name_english ?? kid.nickname_thai ?? kid.name_thai);
                  return (
                    <option key={kid.id} value={kid.id} className="text-foreground bg-background font-sans">
                      {kidName} ({t(`onboarding.grade.${kid.current_grade}`)})
                    </option>
                  );
                })}
              </select>
            </div>
          ) : user ? (
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user?.email?.split('@')[0]}
            </span>
          ) : null}

          {/* Logout */}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl p-2.5 h-9 w-9">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
