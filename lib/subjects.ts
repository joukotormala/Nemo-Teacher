import { Calculator, FlaskConical, BookOpen, Languages, BookText, Microscope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SubjectSuggestion {
  label_th: string;
  label_en: string;
  prompt_th: string;
  prompt_en: string;
}

export interface SubjectInfo {
  id: string; // local slug id
  slug: string;
  code: string; // matches DB subjects.code
  name_th: string;
  name_en: string;
  icon: LucideIcon;
  illustrationUrl: string;
  color: string;
  bgColor: string;
  description_th: string;
  description_en: string;
  minGradeIndex: number; // index in GRADE_ORDER
  maxGradeIndex: number;
  dbId?: string; // UUID from database, populated at runtime
  suggestions: SubjectSuggestion[];
}

// Grade ordering for comparison
export const GRADE_ORDER = [
  'kindergarten',
  'primary_1', 'primary_2', 'primary_3', 'primary_4', 'primary_5', 'primary_6',
  'secondary_1', 'secondary_2', 'secondary_3', 'secondary_4', 'secondary_5', 'secondary_6',
  'university_1', 'university_2', 'university_3', 'university_4',
  'graduate',
] as const;

export function getGradeIndex(grade: string): number {
  const idx = GRADE_ORDER.indexOf(grade as any);
  return idx >= 0 ? idx : 0;
}

export const subjects: SubjectInfo[] = [
  {
    id: 'math',
    slug: 'math',
    code: 'math',
    name_th: 'คณิตศาสตร์',
    name_en: 'Mathematics',
    icon: Calculator,
    illustrationUrl: '/illustrations/math_kid.png',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    description_th: 'เรียนรู้ตัวเลข การคำนวณ และการแก้ปัญหา',
    description_en: 'Learn numbers, calculations, and problem solving',
    minGradeIndex: 0,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'เลขคณิต', label_en: 'Arithmetic', prompt_th: 'สอนเรื่องเศษส่วน ทศนิยม และเปอร์เซ็นต์', prompt_en: 'Teach me about fractions, decimals, and percentages' },
      { label_th: 'พีชคณิต', label_en: 'Algebra', prompt_th: 'สอนเรื่องการแก้สมการและการแยกตัวประกอบ', prompt_en: 'Teach me about simplifying expressions, solving equations, and factorising' },
      { label_th: 'เรขาคณิต', label_en: 'Geometry', prompt_th: 'สอนเรื่องมุม สามเหลี่ยม วงกลม พื้นที่ และเส้นรอบรูป', prompt_en: 'Teach me about angles, triangles, circles, area, and perimeter' },
      { label_th: 'กราฟ', label_en: 'Graphs', prompt_th: 'สอนเรื่องการพล็อตจุด อ่านกราฟ และความชัน', prompt_en: 'Teach me about plotting points, reading graphs, and gradients' },
      { label_th: 'ทักษะจำนวน', label_en: 'Number Skills', prompt_th: 'สอนเรื่องจำนวนเฉพาะ ตัวประกอบ ตัวคูณร่วม อัตราส่วน และสัดส่วน', prompt_en: 'Teach me about primes, factors, multiples, ratio, and proportion' },
      { label_th: 'สถิติ', label_en: 'Statistics', prompt_th: 'สอนเรื่องค่าเฉลี่ย มัธยฐาน ฐานนิยม พิสัย และการอ่านข้อมูล', prompt_en: 'Teach me about mean, median, mode, range, and data interpretation' },
      { label_th: 'โจทย์ปัญหา', label_en: 'Word Problems', prompt_th: 'ช่วยฝึกแปลงโจทย์ปัญหาเป็นสมการแล้วแก้ปัญหา', prompt_en: 'Help me practice turning word problems into equations and solving them' },
    ],
  },
  {
    id: 'science',
    slug: 'science',
    code: 'science',
    name_th: 'วิทยาศาสตร์',
    name_en: 'Science',
    icon: FlaskConical,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#06B6D4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    description_th: 'สำรวจโลกแห่งวิทยาศาสตร์และธรรมชาติ',
    description_en: 'Explore the world of science and nature',
    minGradeIndex: 1,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ชีววิทยา', label_en: 'Biology', prompt_th: 'สอนเรื่องเซลล์ อวัยวะ และระบบร่างกายมนุษย์', prompt_en: 'Teach me about cells, organs, and human body systems' },
      { label_th: 'เคมี', label_en: 'Chemistry', prompt_th: 'สอนเรื่องธาตุ สารประกอบ และปฏิกิริยาเคมี', prompt_en: 'Teach me about elements, compounds, and chemical reactions' },
      { label_th: 'ฟิสิกส์', label_en: 'Physics', prompt_th: 'สอนเรื่องแรง การเคลื่อนที่ และพลังงาน', prompt_en: 'Teach me about forces, motion, and energy' },
      { label_th: 'ระบบนิเวศ', label_en: 'Ecosystems', prompt_th: 'สอนเรื่องห่วงโซ่อาหาร ระบบนิเวศ และสิ่งแวดล้อม', prompt_en: 'Teach me about food chains, ecosystems, and the environment' },
      { label_th: 'อวกาศ', label_en: 'Space & Earth', prompt_th: 'สอนเรื่องระบบสุริยะ ดวงดาว และโลกของเรา', prompt_en: 'Teach me about the solar system, stars, and our planet' },
      { label_th: 'การทดลอง', label_en: 'Experiments', prompt_th: 'แนะนำการทดลองวิทยาศาสตร์ง่ายๆ ที่ทำได้ที่บ้าน', prompt_en: 'Suggest simple science experiments I can do at home' },
    ],
  },
  {
    id: 'english',
    slug: 'english',
    code: 'english',
    name_th: 'ภาษาอังกฤษ',
    name_en: 'English',
    icon: Languages,
    illustrationUrl: '/illustrations/english_kid.png',
    color: '#F59E0B',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    description_th: 'ฝึกทักษะภาษาอังกฤษ การพูด อ่าน เขียน',
    description_en: 'Practice English speaking, reading, and writing',
    minGradeIndex: 0,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ไวยากรณ์', label_en: 'Grammar', prompt_th: 'สอนเรื่อง Tenses ภาษาอังกฤษ', prompt_en: 'Teach me about English tenses and when to use each one' },
      { label_th: 'คำศัพท์', label_en: 'Vocabulary', prompt_th: 'ช่วยฝึกคำศัพท์ภาษาอังกฤษใหม่ๆ พร้อมตัวอย่างประโยค', prompt_en: 'Help me learn new vocabulary words with example sentences' },
      { label_th: 'การเขียน', label_en: 'Writing', prompt_th: 'สอนวิธีเขียนเรียงความภาษาอังกฤษ', prompt_en: 'Teach me how to write an essay in English' },
      { label_th: 'การอ่าน', label_en: 'Reading', prompt_th: 'ให้บทอ่านสั้นๆ แล้วถามคำถามเพื่อฝึกความเข้าใจ', prompt_en: 'Give me a short reading passage and ask comprehension questions' },
      { label_th: 'การสนทนา', label_en: 'Conversation', prompt_th: 'ฝึกบทสนทนาภาษาอังกฤษในชีวิตประจำวัน', prompt_en: 'Practice everyday English conversations with me' },
      { label_th: 'การออกเสียง', label_en: 'Pronunciation', prompt_th: 'สอนเรื่องการออกเสียงภาษาอังกฤษที่ยากๆ', prompt_en: 'Help me with tricky English pronunciation and phonics' },
    ],
  },
  {
    id: 'thai',
    slug: 'thai',
    code: 'thai',
    name_th: 'ภาษาไทย',
    name_en: 'Thai Language',
    icon: BookText,
    illustrationUrl: '/illustrations/thai_kid.png',
    color: '#EC4899',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    description_th: 'เรียนรู้ภาษาไทย ไวยากรณ์ และวรรณคดี',
    description_en: 'Learn Thai language, grammar, and literature',
    minGradeIndex: 0,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ไวยากรณ์ไทย', label_en: 'Thai Grammar', prompt_th: 'สอนเรื่องชนิดของคำในภาษาไทย', prompt_en: 'Teach me about parts of speech in Thai language' },
      { label_th: 'วรรณคดี', label_en: 'Literature', prompt_th: 'สอนเรื่องวรรณคดีไทยที่สำคัญ', prompt_en: 'Teach me about important Thai literature' },
      { label_th: 'สำนวนไทย', label_en: 'Thai Idioms', prompt_th: 'สอนสำนวนและสุภาษิตไทยพร้อมความหมาย', prompt_en: 'Teach me Thai idioms and proverbs with their meanings' },
      { label_th: 'การเขียนเรียงความ', label_en: 'Essay Writing', prompt_th: 'สอนวิธีเขียนเรียงความภาษาไทย', prompt_en: 'Teach me how to write an essay in Thai' },
      { label_th: 'คำราชาศัพท์', label_en: 'Royal Thai', prompt_th: 'สอนเรื่องคำราชาศัพท์และการใช้ภาษาสุภาพ', prompt_en: 'Teach me about royal Thai vocabulary and formal language' },
      { label_th: 'ฝึกอ่านออกเสียง', label_en: 'Reading Aloud', prompt_th: 'ให้บทอ่านสั้นๆ แล้วช่วยฝึกอ่านออกเสียง', prompt_en: 'Give me a passage to practice reading aloud in Thai' },
    ],
  },
  {
    id: 'reading',
    slug: 'reading',
    code: 'reading',
    name_th: 'การอ่าน',
    name_en: 'Reading',
    icon: BookOpen,
    illustrationUrl: '/illustrations/reading_kid.png',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    description_th: 'พัฒนาทักษะการอ่านและความเข้าใจ',
    description_en: 'Develop reading skills and comprehension',
    minGradeIndex: 0,
    maxGradeIndex: 12,
    suggestions: [
      { label_th: 'เรื่องสั้น', label_en: 'Short Stories', prompt_th: 'เล่านิทานสั้นแล้วถามคำถามเพื่อฝึกความเข้าใจ', prompt_en: 'Tell me a short story and ask comprehension questions' },
      { label_th: 'ฝึกอ่านจับใจความ', label_en: 'Comprehension', prompt_th: 'ให้บทความสั้นแล้วฝึกจับใจความสำคัญ', prompt_en: 'Give me a passage and help me identify the main ideas' },
      { label_th: 'คำศัพท์จากบทอ่าน', label_en: 'Vocabulary', prompt_th: 'ให้บทอ่านแล้วช่วยอธิบายคำศัพท์ยากๆ', prompt_en: 'Give me a reading with new vocabulary and explain the words' },
      { label_th: 'การสรุปความ', label_en: 'Summarizing', prompt_th: 'สอนวิธีสรุปเนื้อหาจากบทอ่าน', prompt_en: 'Teach me how to summarize what I read' },
      { label_th: 'ฝึกอ่านเร็ว', label_en: 'Speed Reading', prompt_th: 'ให้เทคนิคฝึกอ่านเร็วและจับใจความ', prompt_en: 'Give me tips for reading faster while understanding' },
    ],
  },
  {
    id: 'lab_tech',
    slug: 'lab_tech',
    code: 'lab_tech',
    name_th: 'เทคโนโลยีห้องปฏิบัติการ',
    name_en: 'Lab Technology',
    icon: Microscope,
    illustrationUrl: '/illustrations/lab_tech_kid.png',
    color: '#6366F1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    description_th: 'เรียนรู้เทคโนโลยีและการทดลองในห้องแลป',
    description_en: 'Learn technology and lab experiments',
    minGradeIndex: 7,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'อุปกรณ์แลป', label_en: 'Lab Equipment', prompt_th: 'สอนเรื่องอุปกรณ์ในห้องปฏิบัติการและวิธีใช้', prompt_en: 'Teach me about laboratory equipment and how to use them' },
      { label_th: 'ความปลอดภัยในแลป', label_en: 'Lab Safety', prompt_th: 'สอนกฎความปลอดภัยในห้องปฏิบัติการ', prompt_en: 'Teach me about laboratory safety rules and procedures' },
      { label_th: 'เทคนิคการทดลอง', label_en: 'Lab Techniques', prompt_th: 'สอนเทคนิคการทดลองพื้นฐาน เช่น การวัด การกรอง', prompt_en: 'Teach me basic lab techniques like measuring, filtering, and titration' },
      { label_th: 'การเขียนรายงาน', label_en: 'Lab Reports', prompt_th: 'สอนวิธีเขียนรายงานผลการทดลอง', prompt_en: 'Teach me how to write a proper lab report' },
      { label_th: 'กล้องจุลทรรศน์', label_en: 'Microscopy', prompt_th: 'สอนเรื่องกล้องจุลทรรศน์และการใช้งาน', prompt_en: 'Teach me about microscopes and how to use them' },
    ],
  },
];

export function getSubjectBySlug(slug: string): SubjectInfo | undefined {
  return subjects?.find?.((s: SubjectInfo) => s?.slug === slug);
}

export function getSubjectsForGrade(grade: string): SubjectInfo[] {
  const gradeIdx = getGradeIndex(grade);
  return subjects.filter(s => gradeIdx >= s.minGradeIndex && gradeIdx <= s.maxGradeIndex);
}
