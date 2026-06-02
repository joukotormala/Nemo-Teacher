'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  GraduationCap,
  Globe,
  Sparkles,
  User,
  Users,
  Calendar,
  School,
  BookOpen,
  Phone,
  ArrowLeft,
  UserPlus,
  Mail,
  LogOut,
} from 'lucide-react';

type UserRole = 'parent' | 'student' | null;

const GRADE_OPTIONS = [
  'kindergarten',
  'primary_1', 'primary_2', 'primary_3', 'primary_4', 'primary_5', 'primary_6',
  'secondary_1', 'secondary_2', 'secondary_3', 'secondary_4', 'secondary_5', 'secondary_6',
  'university_1', 'university_2', 'university_3', 'university_4',
  'graduate',
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'thai', labelKey: 'onboarding.langThai' },
  { value: 'english', labelKey: 'onboarding.langEnglish' },
  { value: 'swedish', labelKey: 'onboarding.langSwedish' },
  { value: 'bilingual', labelKey: 'onboarding.langBilingual' },
] as const;

export default function OnboardingPage() {
  const { user, parent, activeStudent, loading, profileComplete, refreshProfile, signOut } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const router = useRouter();

  const [role, setRole] = useState<UserRole>(null);

  // Parent fields
  const [parentNameThai, setParentNameThai] = useState('');
  const [parentNameEnglish, setParentNameEnglish] = useState('');
  const [phone, setPhone] = useState('');

  // Student fields
  const [studentNameThai, setStudentNameThai] = useState('');
  const [studentNameEnglish, setStudentNameEnglish] = useState('');
  const [nicknameThai, setNicknameThai] = useState('');
  const [nicknameEnglish, setNicknameEnglish] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [languagePref, setLanguagePref] = useState('thai');
  const [schoolName, setSchoolName] = useState('');

  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && profileComplete) {
      router.replace('/dashboard');
    }
  }, [loading, user, profileComplete, router]);

  // Pre-fill from user metadata
  useEffect(() => {
    if (user && !parent) {
      const fullName = user.user_metadata?.full_name || '';
      setParentNameEnglish(fullName);
      setStudentNameEnglish(fullName);
    }
    if (parent) {
      setParentNameThai(parent.name_thai || '');
      setParentNameEnglish(parent.name_english || '');
      setPhone(parent.phone || '');
    }
    if (activeStudent) {
      setStudentNameThai(activeStudent.name_thai || '');
      setStudentNameEnglish(activeStudent.name_english || '');
      setNicknameThai(activeStudent.nickname_thai || '');
      setNicknameEnglish(activeStudent.nickname_english || '');
      setBirthDate(activeStudent.birth_date || '');
      setGradeLevel(activeStudent.current_grade || '');
      setLanguagePref(activeStudent.language_preference || 'thai');
      setSchoolName(activeStudent.school_name || '');
    }
  }, [user, parent, activeStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === 'parent') {
      if (!parentNameThai.trim()) {
        toast.error(locale === 'th' ? 'กรุณากรอกชื่อผู้ปกครอง (ภาษาไทย)' : 'Please enter parent name (Thai)');
        return;
      }
      if (!phone.trim()) {
        toast.error(locale === 'th' ? 'กรุณากรอกเบอร์โทรศัพท์' : 'Please enter your phone number');
        return;
      }
    }

    if (!studentNameThai.trim()) {
      toast.error(locale === 'th' ? 'กรุณากรอกชื่อนักเรียน (ภาษาไทย)' : 'Please enter student name (Thai)');
      return;
    }
    if (!gradeLevel) {
      toast.error(locale === 'th' ? 'กรุณาเลือกระดับชั้นเรียน' : 'Please select a grade level');
      return;
    }
    if (!birthDate) {
      toast.error(locale === 'th' ? 'กรุณากรอกวันเกิด' : 'Please enter date of birth');
      return;
    }

    setSaving(true);
    try {
      // Timeout guard — never hang longer than 15s
      const savePromise = (async () => {
        let parentId = parent?.id;

        // For student self-registration, create a minimal parent record (linked to themselves)
        const isStudentSelf = role === 'student';
        const pNameThai = isStudentSelf ? studentNameThai.trim() : parentNameThai.trim();
        const pNameEn = isStudentSelf ? (studentNameEnglish.trim() || null) : (parentNameEnglish.trim() || null);
        // Phone is UNIQUE + NOT NULL in DB — use a placeholder for students without phone
        const pPhone = phone.trim() || `student-${user!.id.substring(0, 8)}`;

        if (!parentId) {
          const { data: newParent, error: parentError } = await supabase
            .from('parents')
            .insert({
              auth_user_id: user!.id,
              name_thai: pNameThai,
              name_english: pNameEn,
              phone: pPhone,
              email: user!.email!,
              language_preference: languagePref,
            })
            .select('id')
            .single();

          if (parentError) throw parentError;
          parentId = newParent.id;
        } else {
          const { error: parentError } = await supabase
            .from('parents')
            .update({
              name_thai: pNameThai,
              name_english: pNameEn,
              phone: pPhone,
              language_preference: languagePref,
              updated_at: new Date().toISOString(),
            })
            .eq('id', parentId);

          if (parentError) throw parentError;
        }

        if (!activeStudent?.id) {
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              parent_id: parentId,
              name_thai: studentNameThai.trim(),
              name_english: studentNameEnglish.trim() || null,
              nickname_thai: nicknameThai.trim() || null,
              nickname_english: nicknameEnglish.trim() || null,
              birth_date: birthDate,
              current_grade: gradeLevel,
              language_preference: languagePref,
              school_name: schoolName.trim() || null,
              preferred_ai_model: 'llama-8b',
            });

          if (studentError) throw studentError;
        } else {
          const { error: studentError } = await supabase
            .from('students')
            .update({
              name_thai: studentNameThai.trim(),
              name_english: studentNameEnglish.trim() || null,
              nickname_thai: nicknameThai.trim() || null,
              nickname_english: nicknameEnglish.trim() || null,
              birth_date: birthDate,
              current_grade: gradeLevel,
              language_preference: languagePref,
              school_name: schoolName.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', activeStudent.id);

          if (studentError) throw studentError;
        }

        if (languagePref === 'english') {
          setLocale('en');
        } else if (languagePref === 'thai') {
          setLocale('th');
        } else if (languagePref === 'swedish') {
          setLocale('sv');
        }

        await refreshProfile();
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Save timed out — please check your internet connection and try again.')), 15000)
      );

      await Promise.race([savePromise, timeoutPromise]);

      toast.success(locale === 'th' ? 'บันทึกข้อมูลสำเร็จ!' : 'Profile saved successfully!');
      router.replace('/dashboard');
    } catch (err: any) {
      console.error('Onboarding error:', err);
      const msg = err?.message ?? '';
      if (msg.includes('parents_phone_key') || msg.includes('duplicate key')) {
        toast.error(locale === 'th'
          ? 'เบอร์โทรศัพท์นี้ถูกใช้แล้ว กรุณาใช้เบอร์อื่น'
          : 'This phone number is already registered. Please use a different number.');
      } else {
        toast.error(msg || (locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong. Please try again.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const [dateRange, setDateRange] = useState({ min: '2001-01-01', max: '2021-01-01' });

  useEffect(() => {
    const now = new Date();
    setDateRange({
      max: new Date(now.getFullYear() - 5, now.getMonth(), now.getDate()).toISOString().split('T')[0],
      min: new Date(now.getFullYear() - 25, now.getMonth(), now.getDate()).toISOString().split('T')[0],
    });
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ========== ROLE SELECTION SCREEN ==========
  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-border shadow-sm p-1 rounded-full">
          <button
            onClick={() => setLocale('th')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              locale === 'th'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            TH
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              locale === 'en'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale('sv')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              locale === 'sv'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SV
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-8 md:p-10">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg"
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                {t('onboarding.title')}
              </h1>
              <p className="text-muted-foreground mt-2">
                {t('onboarding.whoAreYou')}
              </p>
            </div>

            <div className="space-y-4">
              {/* Parent option */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setRole('parent')}
                className="w-full text-left p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base">
                      {t('onboarding.iAmParent')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('onboarding.parentDesc')}
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Student option */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => setRole('student')}
                className="w-full text-left p-5 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base">
                      {t('onboarding.iAmStudent')}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t('onboarding.studentDesc')}
                    </p>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {locale === 'th' ? 'เนโมพร้อมช่วยคุณเรียนรู้แล้ว! 🎓' : 'Nemo is ready to help you learn! 🎓'}
          </p>
          <button
            onClick={async () => { await signOut(); router.replace('/login'); }}
            className="mt-3 mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3 h-3" />
            {locale === 'th' ? 'ออกจากระบบ / ใช้บัญชีอื่น' : 'Sign out / Use different account'}
          </button>
        </motion.div>
      </div>
    );
  }

  // ========== PROFILE FORM SCREEN ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-border shadow-sm p-1 rounded-full">
        <button
          onClick={() => setLocale('th')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            locale === 'th'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          TH
        </button>
        <button
          onClick={() => setLocale('en')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            locale === 'en'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLocale('sv')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
            locale === 'sv'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          SV
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-8 md:p-10">
          {/* Header with back button */}
          <div className="mb-6">
            <button
              onClick={() => setRole(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {locale === 'th' ? 'เปลี่ยนตัวเลือก' : 'Change selection'}
            </button>
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg"
              >
                <GraduationCap className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                {t('onboarding.title')}
              </h1>
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-muted/50 text-sm text-muted-foreground">
                {role === 'parent' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {role === 'parent' ? t('onboarding.iAmParent') : t('onboarding.iAmStudent')}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* === PARENT SECTION (only shown for parent role) === */}
            {role === 'parent' ? (
              <div className="space-y-4 p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                <h3 className="text-base font-display font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <Users className="w-4 h-4" />
                  {t('onboarding.parentTitle')}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t('onboarding.nameThai')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      required
                      value={parentNameThai}
                      onChange={(e) => setParentNameThai(e.target.value)}
                      placeholder={t('onboarding.nameThaiPlaceholder')}
                      className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      {t('onboarding.nameEnglish')}
                    </Label>
                    <Input
                      value={parentNameEnglish}
                      onChange={(e) => setParentNameEnglish(e.target.value)}
                      placeholder={t('onboarding.nameEnglishPlaceholder')}
                      className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="w-4 h-4 text-purple-500" />
                    {locale === 'th' ? 'อีเมล' : 'Email'}
                  </Label>
                  <Input
                    type="email"
                    value={user?.email ?? ''}
                    readOnly
                    className="h-11 rounded-xl bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-muted-foreground cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Phone className="w-4 h-4 text-purple-500" />
                    {t('onboarding.contactPhone')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('onboarding.phonePlaceholder')}
                    className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            ) : null}

            {/* === STUDENT SECTION === */}
            <div className="space-y-4 p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/30">
              <h3 className="text-base font-display font-semibold flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                <User className="w-4 h-4" />
                {role === 'parent' ? t('onboarding.childTitle') : t('onboarding.studentSelfTitle')}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('onboarding.nameThai')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={studentNameThai}
                    onChange={(e) => setStudentNameThai(e.target.value)}
                    placeholder={locale === 'th' ? 'ชื่อ-นามสกุล (ไทย)' : 'Full name (Thai)'}
                    className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {t('onboarding.nameEnglish')}
                  </Label>
                  <Input
                    value={studentNameEnglish}
                    onChange={(e) => setStudentNameEnglish(e.target.value)}
                    placeholder={locale === 'th' ? 'ชื่อ-นามสกุล (อังกฤษ)' : 'Full name (English)'}
                    className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('onboarding.nickname')} (TH)</Label>
                  <Input
                    value={nicknameThai}
                    onChange={(e) => setNicknameThai(e.target.value)}
                    placeholder={t('onboarding.nicknamePlaceholder')}
                    className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">{t('onboarding.nickname')} (EN)</Label>
                  <Input
                    value={nicknameEnglish}
                    onChange={(e) => setNicknameEnglish(e.target.value)}
                    placeholder="e.g. Nemo"
                    className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-cyan-500" />
                  {t('onboarding.birthDate')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  min={dateRange.min}
                  max={dateRange.max}
                  className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              {/* Grade & School */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="w-4 h-4 text-cyan-500" />
                    {t('onboarding.gradeLevel')} <span className="text-red-500">*</span>
                  </Label>
                  <select
                    required
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-colors"
                  >
                    <option value="">{t('onboarding.selectGrade')}</option>
                    {GRADE_OPTIONS.map((grade) => (
                      <option key={grade} value={grade}>
                        {t(`onboarding.grade.${grade}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <School className="w-4 h-4 text-cyan-500" />
                    {t('onboarding.schoolName')}
                  </Label>
                  <Input
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder={t('onboarding.schoolPlaceholder')}
                    className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </div>
              </div>

              {/* Email + Phone for student self-registration */}
              {role === 'student' ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="w-4 h-4 text-cyan-500" />
                      {locale === 'th' ? 'อีเมล' : 'Email'}
                    </Label>
                    <Input
                      type="email"
                      value={user?.email ?? ''}
                      readOnly
                      className="h-11 rounded-xl bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="w-4 h-4 text-cyan-500" />
                      {t('onboarding.yourPhone')}
                    </Label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('onboarding.phonePlaceholder')}
                      className="h-11 rounded-xl bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>
                </>
              ) : null}
            </div>

            {/* Language Preference */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4 text-cyan-500" />
                {t('onboarding.language')}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguagePref(lang.value)}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                      languagePref === lang.value
                        ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20'
                        : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                  >
                    {t(lang.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold text-base shadow-lg shadow-purple-500/20 transition-all"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('onboarding.saving')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('onboarding.submit')}
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {locale === 'th' ? 'เนโมพร้อมช่วยคุณเรียนรู้แล้ว! 🎓' : 'Nemo is ready to help you learn! 🎓'}
        </p>
      </motion.div>
    </div>
  );
}
