'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, BookOpen, Star, Heart, Languages, Gamepad2,
  Loader2, ChevronRight, Check, Sparkles, Edit3, Plus, X,
  Trophy, Target, Lightbulb, Music, Palette, Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ──────────────────────────────────────────────────────────────────
interface NemoMemory {
  interests: string[];
  learning_style: string;
  personality: string;
  strengths: string[];
  struggles: string[];
  languages_spoken: string[];
  fun_facts: string[];
  favourites: string;
  completed_topics: Record<string, string[]>;
  last_lesson_summary: string;
}

const INTEREST_OPTIONS = [
  { label: 'Football ⚽', value: 'football', icon: '⚽' },
  { label: 'Gaming 🎮', value: 'gaming', icon: '🎮' },
  { label: 'Music 🎵', value: 'music', icon: '🎵' },
  { label: 'Art 🎨', value: 'art', icon: '🎨' },
  { label: 'Reading 📚', value: 'reading', icon: '📚' },
  { label: 'Science 🔬', value: 'science', icon: '🔬' },
  { label: 'Cooking 🍳', value: 'cooking', icon: '🍳' },
  { label: 'Swimming 🏊', value: 'swimming', icon: '🏊' },
  { label: 'Dance 💃', value: 'dance', icon: '💃' },
  { label: 'Animals 🐾', value: 'animals', icon: '🐾' },
  { label: 'Fishing 🎣', value: 'fishing', icon: '🎣' },
  { label: 'Drawing ✏️', value: 'drawing', icon: '✏️' },
  { label: 'Minecraft ⛏️', value: 'Minecraft', icon: '⛏️' },
  { label: 'YouTube 📺', value: 'youtube', icon: '📺' },
  { label: 'Cooking 👨‍🍳', value: 'cooking2', icon: '👨‍🍳' },
  { label: 'Cars 🚗', value: 'cars', icon: '🚗' },
];

const LEARNING_STYLES = [
  { value: 'visual', label: 'Pictures & videos 🖼️', desc: 'I learn best by seeing things' },
  { value: 'reading', label: 'Reading & writing 📖', desc: 'I like reading explanations' },
  { value: 'hands-on', label: 'Doing it myself 🔧', desc: 'I learn by trying things out' },
  { value: 'listening', label: 'Listening 🎧', desc: 'I prefer hearing explanations' },
];

const SUBJECT_OPTIONS = [
  'Math', 'Science', 'English', 'Thai', 'History', 'Geography',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art', 'Music',
];

export default function MemoryPage() {
  const { activeStudent, refreshProfile } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();

  const [memory, setMemory] = useState<NemoMemory>({
    interests: [],
    learning_style: '',
    personality: '',
    strengths: [],
    struggles: [],
    languages_spoken: [],
    fun_facts: [],
    favourites: '',
    completed_topics: {},
    last_lesson_summary: '',
  });

  const [saving, setSaving] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [newFact, setNewFact] = useState('');
  const [newLang, setNewLang] = useState('');

  useEffect(() => {
    if (activeStudent?.nemo_memory) {
      setMemory({ ...memory, ...activeStudent.nemo_memory });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStudent]);

  const toggleInterest = (val: string) => {
    setMemory(m => ({
      ...m,
      interests: m.interests.includes(val)
        ? m.interests.filter(i => i !== val)
        : [...m.interests, val],
    }));
  };

  const toggleSubject = (subject: string, field: 'strengths' | 'struggles') => {
    setMemory(m => ({
      ...m,
      [field]: (m[field] as string[]).includes(subject)
        ? (m[field] as string[]).filter(s => s !== subject)
        : [...(m[field] as string[]), subject],
    }));
  };

  const addTag = (field: 'fun_facts' | 'languages_spoken', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    setMemory(m => ({ ...m, [field]: [...(m[field] as string[]), value.trim()] }));
    setter('');
  };

  const removeTag = (field: 'fun_facts' | 'languages_spoken' | 'interests', value: string) => {
    setMemory(m => ({ ...m, [field]: (m[field] as string[]).filter(v => v !== value) }));
  };

  const handleSave = async () => {
    if (!activeStudent?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({ nemo_memory: memory })
        .eq('id', activeStudent.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(locale === 'th' ? '🧠 เนโมจำข้อมูลแล้ว!' : '🧠 Nemo updated memory!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!activeStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const nickname = activeStudent.nickname_english || activeStudent.nickname_thai || activeStudent.name_english || activeStudent.name_thai;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground transition-colors">
              ←
            </button>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              <h1 className="font-display font-bold text-base">
                {locale === 'th' ? `เนโมรู้จัก ${nickname}` : `Nemo Knows ${nickname}`}
              </h1>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-xs px-4"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
            {locale === 'th' ? 'บันทึก' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Nemo summary card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 to-cyan-600 rounded-2xl p-5 text-white shadow-xl shadow-purple-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <img src="/nemo_avatar.jpg" alt="Nemo" className="w-12 h-12 rounded-full border-2 border-white/30 object-cover" />
            <div>
              <p className="font-display font-bold text-lg">Nemo's Memory</p>
              <p className="text-white/70 text-sm">
                {locale === 'th'
                  ? `สิ่งที่เนโมรู้เกี่ยวกับ ${nickname}`
                  : `Everything Nemo knows about ${nickname}`}
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-sm space-y-1 text-white/90">
            {memory.interests.length > 0 && <p>⭐ Loves: {memory.interests.slice(0, 4).join(', ')}</p>}
            {memory.learning_style && <p>🧠 Learns best by: {memory.learning_style}</p>}
            {memory.strengths.length > 0 && <p>💪 Strong in: {memory.strengths.slice(0, 3).join(', ')}</p>}
            {memory.struggles.length > 0 && <p>📈 Working on: {memory.struggles.slice(0, 3).join(', ')}</p>}
            {memory.languages_spoken.length > 0 && <p>🌍 Languages: {memory.languages_spoken.join(', ')}</p>}
            {(!memory.interests.length && !memory.learning_style) && (
              <p className="text-white/60 italic">No memory yet — fill in the sections below!</p>
            )}
          </div>
        </motion.div>

        {/* Interests */}
        <Section icon={<Star className="w-4 h-4 text-yellow-500" />} title={locale === 'th' ? 'ความสนใจและงานอดิเรก' : 'Interests & Hobbies'}>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleInterest(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  memory.interests.includes(opt.value)
                    ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Custom interests */}
          {memory.interests.filter(i => !INTEREST_OPTIONS.find(o => o.value === i)).map(i => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
              {i}
              <button onClick={() => removeTag('interests', i)}><X className="w-3 h-3" /></button>
            </span>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              value={newInterest}
              onChange={e => setNewInterest(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { toggleInterest(newInterest); setNewInterest(''); } }}
              placeholder={locale === 'th' ? 'เพิ่มความสนใจอื่น...' : 'Add another interest...'}
              className="flex-1 text-sm px-3 py-1.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => { if (newInterest.trim()) { toggleInterest(newInterest.trim()); setNewInterest(''); } }}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Section>

        {/* Learning Style */}
        <Section icon={<Brain className="w-4 h-4 text-purple-500" />} title={locale === 'th' ? 'สไตล์การเรียน' : 'Learning Style'}>
          <div className="grid grid-cols-2 gap-2">
            {LEARNING_STYLES.map(style => (
              <button
                key={style.value}
                onClick={() => setMemory(m => ({ ...m, learning_style: style.value }))}
                className={`p-3 rounded-xl text-left transition-all border ${
                  memory.learning_style === style.value
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-md'
                    : 'bg-muted/50 border-border hover:bg-muted'
                }`}
              >
                <p className="font-semibold text-sm">{style.label}</p>
                <p className={`text-xs mt-0.5 ${memory.learning_style === style.value ? 'text-white/80' : 'text-muted-foreground'}`}>{style.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Strengths */}
        <Section icon={<Trophy className="w-4 h-4 text-green-500" />} title={locale === 'th' ? 'วิชาที่เก่ง' : 'Strong Subjects'}>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => toggleSubject(s, 'strengths')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  memory.strengths.includes(s)
                    ? 'bg-green-500 text-white border-green-500 shadow-md'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>

        {/* Struggles */}
        <Section icon={<Target className="w-4 h-4 text-orange-500" />} title={locale === 'th' ? 'วิชาที่ต้องพัฒนา' : 'Needs Improvement'}>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => toggleSubject(s, 'struggles')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  memory.struggles.includes(s)
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Section>

        {/* Languages */}
        <Section icon={<Languages className="w-4 h-4 text-blue-500" />} title={locale === 'th' ? 'ภาษาที่พูดได้' : 'Languages Spoken'}>
          <div className="flex flex-wrap gap-2 mb-2">
            {(['Thai', 'English', 'Swedish', 'Chinese', 'Japanese', 'French', 'German'] as string[]).map(lang => (
              <button
                key={lang}
                onClick={() => {
                  if (memory.languages_spoken.includes(lang)) {
                    removeTag('languages_spoken', lang);
                  } else {
                    setMemory(m => ({ ...m, languages_spoken: [...m.languages_spoken, lang] }));
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  memory.languages_spoken.includes(lang)
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                    : 'bg-muted/50 text-foreground border-border hover:bg-muted'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTag('languages_spoken', newLang, setNewLang); }}
              placeholder={locale === 'th' ? 'เพิ่มภาษาอื่น...' : 'Add another language...'}
              className="flex-1 text-sm px-3 py-1.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => addTag('languages_spoken', newLang, setNewLang)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Section>

        {/* Favourites / personality */}
        <Section icon={<Heart className="w-4 h-4 text-pink-500" />} title={locale === 'th' ? 'สิ่งที่ชอบ / บุคลิกภาพ' : 'Favourites & Personality'}>
          <textarea
            value={memory.favourites}
            onChange={e => setMemory(m => ({ ...m, favourites: e.target.value }))}
            placeholder={locale === 'th'
              ? 'เช่น ชอบเกม Minecraft, แมวชื่อ Mochi, อยากเป็นวิศวกร...'
              : 'e.g. Loves Minecraft, has a cat named Mochi, wants to be an engineer...'}
            rows={3}
            className="w-full text-sm px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </Section>

        {/* Fun facts */}
        <Section icon={<Sparkles className="w-4 h-4 text-yellow-400" />} title={locale === 'th' ? 'เรื่องสนุก / ความทรงจำ' : 'Fun Facts & Notes'}>
          <div className="flex flex-wrap gap-2 mb-2">
            {memory.fun_facts.map(fact => (
              <span key={fact} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                ✨ {fact}
                <button onClick={() => removeTag('fun_facts', fact)}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newFact}
              onChange={e => setNewFact(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTag('fun_facts', newFact, setNewFact); }}
              placeholder={locale === 'th' ? 'เช่น ชนะแข่งวาดรูป, มีน้องชาย...' : 'e.g. won an art contest, has a little brother...'}
              className="flex-1 text-sm px-3 py-1.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => addTag('fun_facts', newFact, setNewFact)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Section>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl py-6 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-base shadow-xl shadow-purple-500/20 hover:from-purple-700 hover:to-cyan-700"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Brain className="w-5 h-5 mr-2" />}
          {locale === 'th' ? '🧠 บันทึกความทรงจำของเนโม' : '🧠 Save Nemo\'s Memory'}
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-8">
          {locale === 'th'
            ? 'เนโมจะใช้ข้อมูลนี้เพื่อสอนคุณได้ดีขึ้น 🎓'
            : 'Nemo uses this to personalise every lesson for you 🎓'}
        </p>
      </div>
    </div>
  );
}

// ─── Reusable Section Card ────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm space-y-3"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-display font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}
