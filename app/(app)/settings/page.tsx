'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Settings, Globe, User, Users, Save, Mail, GraduationCap, Phone, School, Loader2, Cpu, Lock } from 'lucide-react';

const GRADE_OPTIONS = [
  'kindergarten',
  'primary_1', 'primary_2', 'primary_3', 'primary_4', 'primary_5', 'primary_6',
  'secondary_1', 'secondary_2', 'secondary_3', 'secondary_4', 'secondary_5', 'secondary_6',
  'university_1', 'university_2', 'university_3', 'university_4',
  'graduate',
] as const;

export default function SettingsPage() {
  const { user, parent, activeStudent, students, refreshProfile, changeLanguage, isStudentMode } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [preferredModel, setPreferredModel] = useState('llama-8b');

  // Add new child states
  const [newStudentNameThai, setNewStudentNameThai] = useState('');
  const [newStudentNameEnglish, setNewStudentNameEnglish] = useState('');
  const [newNicknameThai, setNewNicknameThai] = useState('');
  const [newNicknameEnglish, setNewNicknameEnglish] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [addingChild, setAddingChild] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parent?.id) return;
    if (!newStudentNameThai.trim()) {
      toast.error(locale === 'th' ? 'กรุณากรอกชื่อนักเรียน (ภาษาไทย)' : 'Student name (Thai) is required');
      return;
    }
    if (!newGradeLevel) {
      toast.error(locale === 'th' ? 'กรุณาเลือกระดับชั้นเรียน' : 'Please select a grade level');
      return;
    }
    if (!newBirthDate) {
      toast.error(locale === 'th' ? 'กรุณากรอกวันเกิด' : 'Please enter date of birth');
      return;
    }

    setAddingChild(true);
    try {
      // Get the current session token to authenticate the API call
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast.error(locale === 'th' ? 'กรุณาล็อกอินใหม่อีกครั้ง' : 'Please log in again');
        return;
      }

      // Use the server-side API route (service role) so RLS doesn't block the insert
      const res = await fetch('/api/student-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          nameThai: newStudentNameThai.trim(),
          nameEnglish: newStudentNameEnglish.trim() || null,
          nicknameThai: newNicknameThai.trim() || null,
          nicknameEnglish: newNicknameEnglish.trim() || null,
          birthDate: newBirthDate,
          gradeLevel: newGradeLevel,
          schoolName: newSchoolName.trim() || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Failed to add student');

      toast.success(locale === 'th' ? 'เพิ่มข้อมูลผู้เรียนคนใหม่สำเร็จแล้ว!' : 'New student profile added successfully!');

      setNewStudentNameThai('');
      setNewStudentNameEnglish('');
      setNewNicknameThai('');
      setNewNicknameEnglish('');
      setNewBirthDate('');
      setNewGradeLevel('');
      setNewSchoolName('');
      setShowAddForm(false);

      await refreshProfile();

      if (result.studentId && typeof window !== 'undefined') {
        localStorage.setItem('nemo_active_student_id', result.studentId);
      }
    } catch (err: any) {
      console.error('Add child error:', err);
      toast.error(err?.message ?? (locale === 'th' ? 'เพิ่มผู้เรียนไม่สำเร็จ' : 'Failed to add student profile'));
    } finally {
      setAddingChild(false);
    }
  };

  // Password change fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  // PIN management
  const [pinValues, setPinValues] = useState<Record<string, string>>({});
  const [savingPin, setSavingPin] = useState<string | null>(null);

  const handleSavePin = async (studentId: string) => {
    const pin = pinValues[studentId] ?? '';
    if (!/^\d{4}$/.test(pin)) {
      toast.error(locale === 'th' ? 'PIN ต้องเป็นตัวเลข 4 หลัก' : 'PIN must be exactly 4 digits');
      return;
    }
    setSavingPin(studentId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { toast.error('Not authenticated'); return; }
      const res = await fetch('/api/student-set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ studentId, pin }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to set PIN'); return; }
      toast.success(locale === 'th' ? '✅ ตั้ง PIN สำเร็จ!' : '✅ PIN saved!');
      setPinValues(prev => ({ ...prev, [studentId]: '' }));
    } catch (err: any) {
      toast.error(err?.message ?? 'Error');
    } finally {
      setSavingPin(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error(locale === 'th' ? 'กรุณากรอกรหัสผ่านใหม่' : 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error(locale === 'th' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(locale === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success(locale === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จแล้ว' : 'Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      toast.error(err?.message ?? (locale === 'th' ? 'เปลี่ยนรหัสผ่านไม่สำเร็จ' : 'Failed to change password'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      toast.success(
        locale === 'th'
          ? `ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง ${user.email} แล้ว`
          : `Password reset link sent to ${user.email}`
      );
    } catch (err: any) {
      console.error('Reset email error:', err);
      toast.error(err?.message ?? (locale === 'th' ? 'ส่งลิงก์ไม่สำเร็จ' : 'Failed to send reset link'));
    } finally {
      setSendingReset(false);
    }
  };

  // Populate preferred model from activeStudent or localStorage
  useEffect(() => {
    if (activeStudent?.preferred_ai_model) {
      const dbModel = activeStudent.preferred_ai_model === 'sea-lion-8b' ? 'sea-lion' : activeStudent.preferred_ai_model;
      setPreferredModel(dbModel);
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nemo_preferred_model') || 'llama-8b';
      setPreferredModel(saved);
    }
  }, [activeStudent]);

  // Parent fields
  const [parentNameThai, setParentNameThai] = useState('');
  const [parentNameEnglish, setParentNameEnglish] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  // Student fields
  const [studentNameThai, setStudentNameThai] = useState('');
  const [studentNameEnglish, setStudentNameEnglish] = useState('');
  const [nicknameThai, setNicknameThai] = useState('');
  const [nicknameEnglish, setNicknameEnglish] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolProgram, setSchoolProgram] = useState(''); // 'EP', 'Thai', 'SMTE'

  // Populate form with existing data
  useEffect(() => {
    if (parent) {
      setParentNameThai(parent.name_thai ?? '');
      setParentNameEnglish(parent.name_english ?? '');
      setParentPhone(parent.phone ?? '');
    }
    if (activeStudent) {
      setStudentNameThai(activeStudent.name_thai ?? '');
      setStudentNameEnglish(activeStudent.name_english ?? '');
      setNicknameThai(activeStudent.nickname_thai ?? '');
      setNicknameEnglish(activeStudent.nickname_english ?? '');
      setGradeLevel(activeStudent.current_grade ?? '');
      setSchoolName(activeStudent.school_name ?? '');
      setSchoolProgram((activeStudent as any).school_program ?? '');
    }
  }, [parent, activeStudent]);

  const handleSave = async () => {
    if (!parent?.id || !activeStudent?.id) {
      toast.error(locale === 'th' ? 'ไม่พบข้อมูลโปรไฟล์' : 'Profile data not found');
      return;
    }
    if (!parentNameThai.trim()) {
      toast.error(locale === 'th' ? 'กรุณากรอกชื่อผู้ปกครอง (ภาษาไทย)' : 'Parent name (Thai) is required');
      return;
    }
    if (!parentPhone.trim()) {
      toast.error(locale === 'th' ? 'กรุณากรอกเบอร์โทรศัพท์' : 'Phone number is required');
      return;
    }
    if (!studentNameThai.trim()) {
      toast.error(locale === 'th' ? 'กรุณากรอกชื่อนักเรียน (ภาษาไทย)' : 'Student name (Thai) is required');
      return;
    }

    setSaving(true);
    try {
      const dbLang = locale === 'en' ? 'english' : locale === 'sv' ? 'swedish' : 'thai';

      // Update parent
      const { error: parentErr } = await supabase
        .from('parents')
        .update({
          name_thai: parentNameThai.trim(),
          name_english: parentNameEnglish.trim() || null,
          phone: parentPhone.trim(),
          language_preference: dbLang,
        })
        .eq('id', parent.id);

      if (parentErr) throw parentErr;

      // Update student
      const { error: studentErr } = await supabase
        .from('students')
        .update({
          name_thai: studentNameThai.trim(),
          name_english: studentNameEnglish.trim() || null,
          nickname_thai: nicknameThai.trim() || null,
          nickname_english: nicknameEnglish.trim() || null,
          current_grade: gradeLevel || null,
          school_name: schoolName.trim() || null,
          school_program: schoolProgram || null,
          language_preference: dbLang,
          preferred_ai_model: preferredModel,
        })
        .eq('id', activeStudent.id);

      if (studentErr) throw studentErr;

      await refreshProfile();
      
      // Save preferred model
      if (typeof window !== 'undefined') {
        localStorage.setItem('nemo_preferred_model', preferredModel);
      }

      toast.success(t('settings.saved'));
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.message ?? (locale === 'th' ? 'บันทึกไม่สำเร็จ' : 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-display font-bold tracking-tight mb-1 flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary" />
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mb-4">
          {locale === 'th' ? 'จัดการบัญชีและการตั้งค่า' : 'Manage your account and preferences'}
        </p>
        {isStudentMode && (
          <div className="mb-2 flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3">
            <span className="text-xl">🎒</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {locale === 'th' ? 'โหมดนักเรียน — การตั้งค่าบางส่วนถูกจำกัด' : 'Student Mode — some settings are restricted'}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {locale === 'th'
                  ? 'คุณเปลี่ยนภาษาและโมเดล AI ได้ ผู้ปกครองต้องล็อกอินเพื่อแก้ไขข้อมูลอื่น'
                  : 'You can change language and AI model. Parent must log in to edit other info.'}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="space-y-6">
        {/* Account email (read-only) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t('auth.email')}</p>
              <p className="text-sm font-medium">{user?.email ?? '-'}</p>
            </div>
          </div>
        </motion.div>

        {/* Security / Password section — hidden from students */}
        {!isStudentMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {locale === 'th' ? 'ความปลอดภัยและรหัสผ่าน' : 'Security & Password'}
          </h2>
          
          <form onSubmit={handleChangePassword} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">{locale === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">{locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              variant="outline"
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full sm:w-auto"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {locale === 'th' ? 'กำลังบันทึก...' : 'Updating...'}
                </>
              ) : (
                locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Update Password'
              )}
            </Button>
          </form>

          <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {locale === 'th' ? 'ลืมรหัสผ่าน?' : 'Forgot your password?'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {locale === 'th' 
                  ? 'ส่งลิงก์รีเซ็ตไปยังอีเมลของคุณเพื่อตั้งค่ารหัสผ่านใหม่' 
                  : 'Send a reset link to your email address to set a new password.'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSendResetEmail}
              disabled={sendingReset}
              className="text-primary hover:text-primary hover:bg-primary/5 font-medium shrink-0 self-start sm:self-center"
            >
              {sendingReset ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {locale === 'th' ? 'กำลังส่ง...' : 'Sending reset...'}
                </>
              ) : (
                locale === 'th' ? 'ส่งลิงก์รีเซ็ต' : 'Send reset link'
              )}
            </Button>
          </div>
        </motion.div>
        )}

        {/* Student PIN Management — hidden from students */}
        {!isStudentMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.09 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-500" />
            {locale === 'th' ? '🔑 PIN ของนักเรียน' : '🔑 Student PINs'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {locale === 'th'
              ? 'ตั้ง PIN 4 หลักสำหรับแต่ละคน เพื่อให้นักเรียนล็อกอินด้วยตัวเองได้'
              : 'Set a 4-digit PIN for each child so they can log in independently from the Student tab.'}
          </p>
          <div className="space-y-3">
            {(students ?? []).map(student => {
              const name = student.nickname_english || student.name_english || student.nickname_thai || student.name_thai || 'Student';
              return (
                <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'th' ? 'ใส่ PIN 4 หลัก' : 'Enter 4-digit PIN'}
                    </p>
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pinValues[student.id] ?? ''}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPinValues(prev => ({ ...prev, [student.id]: v }));
                    }}
                    className="w-20 text-center h-10 rounded-xl border border-input bg-background text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  />
                  <Button
                    size="sm"
                    disabled={savingPin === student.id || (pinValues[student.id] ?? '').length !== 4}
                    onClick={() => handleSavePin(student.id)}
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl px-3"
                  >
                    {savingPin === student.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (locale === 'th' ? 'บันทึก' : 'Save')}
                  </Button>
                </div>
              );
            })}
            {(!students || students.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {locale === 'th' ? 'ยังไม่มีนักเรียนในบัญชีนี้' : 'No students in this account yet'}
              </p>
            )}
          </div>
        </motion.div>
        )}

        {/* Parent Info — hidden from students */}
        {!isStudentMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {t('settings.parentInfo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t('onboarding.nameThai')} *</Label>
              <Input value={parentNameThai} onChange={e => setParentNameThai(e.target.value)} placeholder={t('onboarding.nameThaiPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t('onboarding.nameEnglish')}</Label>
              <Input value={parentNameEnglish} onChange={e => setParentNameEnglish(e.target.value)} placeholder={t('onboarding.nameEnglishPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> {t('settings.phone')} *
              </Label>
              <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="08x-xxx-xxxx" />
            </div>
          </div>
        </motion.div>
        )}

        {/* Student Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {t('settings.studentInfo')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t('onboarding.nameThai')} *</Label>
              <Input value={studentNameThai} onChange={e => setStudentNameThai(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t('onboarding.nameEnglish')}</Label>
              <Input value={studentNameEnglish} onChange={e => setStudentNameEnglish(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t('settings.nickname')} (TH)</Label>
              <Input value={nicknameThai} onChange={e => setNicknameThai(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t('settings.nickname')} (EN)</Label>
              <Input value={nicknameEnglish} onChange={e => setNicknameEnglish(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> {t('settings.grade')}
              </Label>
              <select
                value={gradeLevel}
                onChange={e => setGradeLevel(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{locale === 'th' ? 'เลือกระดับชั้น' : 'Select grade'}</option>
                {GRADE_OPTIONS.map(grade => (
                  <option key={grade} value={grade}>{t(`onboarding.grade.${grade}`)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                <School className="w-3.5 h-3.5" /> {t('settings.school')}
              </Label>
              <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1">
                🎓 {locale === 'th' ? 'โปรแกรมการเรียน' : 'School Program'}
              </Label>
              <select
                value={schoolProgram}
                onChange={e => setSchoolProgram(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{locale === 'th' ? 'เลือกโปรแกรม' : 'Select program'}</option>
                <option value="Thai">{locale === 'th' ? 'หลักสูตรปกติ (ภาษาไทย)' : 'Thai Program (Regular)'}</option>
                <option value="EP">English Program (EP)</option>
                <option value="SMTE">SMTE (Science-Math Special)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Add Another Student Form — hidden from students */}
        {!isStudentMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          {!showAddForm ? (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-500" />
                  {locale === 'th' ? 'นักเรียนคนอื่น' : 'Add Another Student'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {locale === 'th' 
                    ? 'เพิ่มบัญชีผู้เรียนคนอื่นภายใต้บัญชีผู้ปกครองเดียวกัน' 
                    : 'Register an additional student profile under your parent account.'}
                </p>
              </div>
              <Button onClick={() => setShowAddForm(true)} variant="outline" className="gap-1.5 rounded-xl">
                <User className="w-4 h-4 text-cyan-500" />
                {locale === 'th' ? 'เพิ่มผู้เรียนใหม่' : 'Add Child'}
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <User className="w-5 h-5" />
                  {locale === 'th' ? 'ลงทะเบียนนักเรียนใหม่' : 'Register New Student'}
                </h2>
                <Button onClick={() => setShowAddForm(false)} variant="ghost" size="sm" className="text-muted-foreground rounded-lg">
                  {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
                </Button>
              </div>

              <form onSubmit={handleAddChild} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('onboarding.nameThai')} *</Label>
                    <Input
                      required
                      value={newStudentNameThai}
                      onChange={e => setNewStudentNameThai(e.target.value)}
                      placeholder="ชื่อ-นามสกุล (ไทย)"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('onboarding.nameEnglish')}</Label>
                    <Input
                      value={newStudentNameEnglish}
                      onChange={e => setNewStudentNameEnglish(e.target.value)}
                      placeholder="Full Name (English)"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('settings.nickname')} (TH)</Label>
                    <Input
                      value={newNicknameThai}
                      onChange={e => setNewNicknameThai(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('settings.nickname')} (EN)</Label>
                    <Input
                      value={newNicknameEnglish}
                      onChange={e => setNewNicknameEnglish(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('settings.grade')} *</Label>
                    <select
                      required
                      value={newGradeLevel}
                      onChange={e => setNewGradeLevel(e.target.value)}
                      className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">{locale === 'th' ? 'เลือกระดับชั้น' : 'Select grade'}</option>
                      {GRADE_OPTIONS.map(grade => (
                        <option key={grade} value={grade}>{t(`onboarding.grade.${grade}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t('onboarding.birthDate')} *</Label>
                    <Input
                      required
                      type="date"
                      value={newBirthDate}
                      onChange={e => setNewBirthDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm font-medium">{t('settings.school')}</Label>
                    <Input
                      value={newSchoolName}
                      onChange={e => setNewSchoolName(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={addingChild}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold shadow-md mt-2"
                >
                  {addingChild ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {locale === 'th' ? 'กำลังลงทะเบียน...' : 'Registering...'}
                    </>
                  ) : (
                    locale === 'th' ? 'ยืนยันการเพิ่มผู้เรียน' : 'Confirm Registration'
                  )}
                </Button>
              </form>
            </div>
          )}
        </motion.div>
        )}

        {/* Language section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t('settings.language')}
          </h2>
          <div className="flex gap-3">
            <Button
              variant={locale === 'th' ? 'default' : 'outline'}
              onClick={() => changeLanguage('th')}
              className="flex-1"
            >
              🇹🇭 ภาษาไทย
            </Button>
            <Button
              variant={locale === 'en' ? 'default' : 'outline'}
              onClick={() => changeLanguage('en')}
              className="flex-1"
            >
              🇬🇧 English
            </Button>
            <Button
              variant={locale === 'sv' ? 'default' : 'outline'}
              onClick={() => changeLanguage('sv')}
              className="flex-1"
            >
              🇸🇪 Svenska
            </Button>
          </div>
        </motion.div>

        {/* AI Model Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="bg-card rounded-xl p-6"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="text-lg font-display font-semibold mb-1 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            {t('settings.modelTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('settings.modelDesc')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'nvidia', label: t('model.nvidia'), desc: 'Nemotron-3-nano (Nvidia Cloud)' },
              { id: 'qwen', label: t('model.qwen'), desc: 'Qwen-3-Next-80B (Nvidia Cloud)' },
              { id: 'cloud', label: t('model.cloud'), desc: 'Llama-3.3-70B (Nvidia Cloud)' },
              { id: 'llama-8b', label: t('model.llama8b'), desc: 'Llama-3.1-8B (Nvidia Cloud)' },
              { id: 'gemma-4b', label: t('model.gemma4b'), desc: 'Gemma-3-4B (Nvidia Cloud)' },
              { id: 'sea-lion', label: t('model.seaLion'), desc: 'Sea-Lion GGUF/MLX (Ollama/LM Studio)' },
              { id: 'nemotron', label: t('model.nemotron'), desc: 'nemotron-mini (Local Ollama)' },
            ].map((m) => {
              const isSelected = preferredModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPreferredModel(m.id)}
                  type="button"
                  className={`flex flex-col items-start p-4 rounded-xl text-left border transition-all duration-fast hover:shadow-sm ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card/50 hover:bg-muted/30'
                  }`}
                >
                  <span className="font-semibold text-sm leading-tight mb-1">{m.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">{m.desc}</span>
                </button>
              );
            })}
          </div>

          {(preferredModel === 'sea-lion' || preferredModel === 'nemotron') && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-medium bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              ⚠️ {t('settings.ollamaRequired')}
            </p>
          )}
        </motion.div>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {t('settings.save')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
