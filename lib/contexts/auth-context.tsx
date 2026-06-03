'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { useLanguage } from '@/lib/contexts/language-context';

import { Locale } from '@/lib/translations';

interface ParentProfile {
  id: string;
  name_thai: string;
  name_english: string | null;
  phone: string;
  email: string;
  language_preference: string;
}

interface StudentProfile {
  id: string;
  parent_id: string;
  name_thai: string;
  name_english: string | null;
  nickname_thai: string | null;
  nickname_english: string | null;
  birth_date: string;
  current_grade: string;
  school_name: string | null;
  language_preference: string;
  preferred_ai_model: string;
  avatar_url: string | null;
  nemo_memory: Record<string, any> | null;
  interests: string[] | null;
  learning_style: string | null;
  personality_notes: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  parent: ParentProfile | null;
  students: StudentProfile[];
  activeStudent: StudentProfile | null;
  loading: boolean;
  profileComplete: boolean;
  isStudentMode: boolean;          // true when a child logged in via PIN
  setStudentMode: (v: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchActiveStudent: (studentId: string) => void;
  changeLanguage: (locale: Locale) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  parent: null,
  students: [],
  activeStudent: null,
  loading: true,
  profileComplete: false,
  isStudentMode: false,
  setStudentMode: () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  switchActiveStudent: () => {},
  changeLanguage: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Student mode: true when a child logged in via PIN (not a full parent login)
  const [isStudentMode, setIsStudentMode] = useState(
    typeof window !== 'undefined' && localStorage.getItem('nemo_student_mode') === 'true'
  );
  const setStudentMode = useCallback((v: boolean) => {
    setIsStudentMode(v);
    if (typeof window !== 'undefined') {
      if (v) localStorage.setItem('nemo_student_mode', 'true');
      else localStorage.removeItem('nemo_student_mode');
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, accessToken?: string) => {
    try {
      // Use the provided token, or fall back to fetching the current session
      let token = accessToken;
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      }

      if (!token) {
        setParent(null);
        setStudents([]);
        setActiveStudent(null);
        return;
      }

      // Use the server-side API route (service role key) to bypass RLS
      // Add timestamp to bust any CDN/edge cache at all levels
      const res = await fetch(`/api/profile?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        console.warn('fetchProfile API error:', res.status);
        setParent(null);
        setStudents([]);
        setActiveStudent(null);
        return;
      }

      const { parent: parentData, students: studentData } = await res.json();

      if (!parentData) {
        // No parent record yet — new user needs onboarding
        setParent(null);
        setStudents([]);
        setActiveStudent(null);
        return;
      }

      setParent(parentData);

      const childList: any[] = studentData ?? [];
      setStudents(childList);

      if (childList.length > 0) {
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('nemo_active_student_id') : null;
        const currentActive = childList.find((s: any) => s.id === savedId) || childList[0];
        setActiveStudent(currentActive);
        // If saved ID no longer exists in the list, update localStorage to the new active student
        if (savedId && !childList.find((s: any) => s.id === savedId)) {
          localStorage.setItem('nemo_active_student_id', currentActive.id);
        }
      } else {
        setActiveStudent(null);
        // Clear stale localStorage so deleted students don't linger
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nemo_active_student_id');
        }
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
      setParent(null);
      setStudents([]);
      setActiveStudent(null);
    }
  }, []);


  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    let didFinish = false;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[Auth] getSession error:', error.message);
        }
        if (currentSession?.user?.id) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id, currentSession.access_token);
        }
        // If no session, user stays null — that's fine
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        didFinish = true;
        setLoading(false);
      }
    };

    initAuth();

    // Safety: if auth takes more than 8s, stop the spinner anyway
    const timeout = setTimeout(() => {
      if (!didFinish) {
        console.warn('[Auth] Init timed out — showing login');
        setLoading(false);
      }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      if (newSession?.user?.id) {
        await fetchProfile(newSession.user.id, newSession.access_token);
      } else {
        setParent(null);
        setStudents([]);
        setActiveStudent(null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription?.unsubscribe?.();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window?.location?.origin ?? ''}/`,
      },
    });
    return { error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window?.location?.origin ?? ''}/` },
    });
  }, []);

  const switchActiveStudent = useCallback((studentId: string) => {
    setStudents(prev => {
      const active = prev.find(s => s.id === studentId);
      if (active) {
        setActiveStudent(active);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nemo_active_student_id', studentId);
        }
      }
      return prev;
    });
  }, []);

  const signOutFn = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // API may fail if key is invalid — that's OK
    }
    // Always clear local state + storage so user isn't trapped
    setUser(null);
    setSession(null);
    setParent(null);
    setStudents([]);
    setActiveStudent(null);
    setStudentMode(false); // clear student mode on logout
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem('nemo_active_student_id');
      localStorage.removeItem('nemo_preferred_model');
    }
  }, [setStudentMode]);

  const changeLanguage = useCallback(async (newLocale: Locale) => {
    setLocale(newLocale);
    
    if (user?.id) {
      const dbLang = newLocale === 'en' ? 'english' : newLocale === 'sv' ? 'swedish' : 'thai';
      
      try {
        if (activeStudent) {
          const { error } = await supabase
            .from('students')
            .update({ language_preference: dbLang })
            .eq('id', activeStudent.id);
          if (!error) {
            setActiveStudent(prev => prev ? { ...prev, language_preference: dbLang } : null);
            setStudents(prev => prev.map(s => s.id === activeStudent.id ? { ...s, language_preference: dbLang } : s));
          }
        }
        
        if (parent) {
          const { error } = await supabase
            .from('parents')
            .update({ language_preference: dbLang })
            .eq('id', parent.id);
          if (!error) {
            setParent(prev => prev ? { ...prev, language_preference: dbLang } : null);
          }
        }
      } catch (err) {
        console.error('Error updating language preference:', err);
      }
    }
  }, [user, activeStudent, parent, setLocale]);

  // Sync DB language preference to client locale on profile load/switch
  useEffect(() => {
    if (activeStudent?.language_preference) {
      const pref = activeStudent.language_preference.toLowerCase();
      const targetLocale = pref === 'english' || pref === 'en' ? 'en' : pref === 'swedish' || pref === 'sv' ? 'sv' : 'th';
      if (locale !== targetLocale) {
        setLocale(targetLocale);
      }
    } else if (parent?.language_preference) {
      const pref = parent.language_preference.toLowerCase();
      const targetLocale = pref === 'english' || pref === 'en' ? 'en' : pref === 'swedish' || pref === 'sv' ? 'sv' : 'th';
      if (locale !== targetLocale) {
        setLocale(targetLocale);
      }
    }
  }, [activeStudent?.id, activeStudent?.language_preference, parent?.id, parent?.language_preference, locale, setLocale]);

  // Sync DB preferred AI model to client localStorage on profile load/switch
  useEffect(() => {
    if (activeStudent?.preferred_ai_model) {
      // Normalize 'sea-lion-8b' to 'sea-lion' to match front-end IDs
      const model = activeStudent.preferred_ai_model === 'sea-lion-8b' ? 'sea-lion' : activeStudent.preferred_ai_model;
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('nemo_preferred_model');
        if (saved !== model) {
          localStorage.setItem('nemo_preferred_model', model);
        }
      }
    }
  }, [activeStudent?.id, activeStudent?.preferred_ai_model]);

  // Profile is complete when parent record exists AND has at least one student,
  // OR the user self-registered as a student (parent record alone is enough if
  // the parent table stores student self-registrations too).
  // We only send them to onboarding if parent is completely missing.
  const profileComplete = !!(parent?.id && students.length > 0);

  return (
    <AuthContext.Provider value={{
      user, session, parent, students, activeStudent, loading, profileComplete,
      isStudentMode, setStudentMode,
      signIn: async (email, password) => {
        setStudentMode(false); // parent is logging in — clear student mode
        return supabase.auth.signInWithPassword({ email, password }).then(({ error }) => ({ error }));
      },
      signUp, signInWithGoogle,
      signOut: signOutFn, refreshProfile, switchActiveStudent, changeLanguage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
