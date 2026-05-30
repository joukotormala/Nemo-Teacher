'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

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
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  parent: ParentProfile | null;
  students: StudentProfile[];
  activeStudent: StudentProfile | null;
  loading: boolean;
  profileComplete: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  switchActiveStudent: (studentId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  parent: null,
  students: [],
  activeStudent: null,
  loading: true,
  profileComplete: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  switchActiveStudent: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [parent, setParent] = useState<ParentProfile | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [activeStudent, setActiveStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Step 1: Find parent record by auth_user_id
      const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('id, name_thai, name_english, phone, email, language_preference')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (parentError) {
        console.warn('Parent fetch error:', parentError.message);
        setParent(null);
        setStudents([]);
        setActiveStudent(null);
        return;
      }

      if (!parentData) {
        // No parent record yet — new user needs onboarding
        setParent(null);
        setStudents([]);
        setActiveStudent(null);
        return;
      }

      setParent(parentData);

      // Step 2: Find student record by parent_id
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, parent_id, name_thai, name_english, nickname_thai, nickname_english, birth_date, current_grade, school_name, language_preference, preferred_ai_model, avatar_url')
        .eq('parent_id', parentData.id);

      if (studentError) {
        console.warn('Student fetch error:', studentError.message);
        setStudents([]);
        setActiveStudent(null);
        return;
      }

      const childList = studentData ?? [];
      setStudents(childList);

      if (childList.length > 0) {
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('nemo_active_student_id') : null;
        const currentActive = childList.find(s => s.id === savedId) || childList[0];
        setActiveStudent(currentActive);
      } else {
        setActiveStudent(null);
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
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession ?? null);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user?.id) {
          await fetchProfile(currentSession.user.id);
        }
      } catch {
        // Auth not available
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);
      if (newSession?.user?.id) {
        await fetchProfile(newSession.user.id);
      } else {
        setParent(null);
        setStudents([]);
        setActiveStudent(null);
      }
    });

    return () => {
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setParent(null);
    setStudents([]);
    setActiveStudent(null);
  }, []);

  // Profile is complete when both parent AND at least one student record exist
  const profileComplete = !!(parent?.id && students.length > 0);

  return (
    <AuthContext.Provider value={{
      user, session, parent, students, activeStudent, loading, profileComplete,
      signIn, signUp, signInWithGoogle,
      signOut: signOutFn, refreshProfile, switchActiveStudent,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
