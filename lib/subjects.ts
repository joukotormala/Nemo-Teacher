import { Calculator, FlaskConical, BookOpen, Languages, BookText, Microscope, Atom, Dna, Globe, Clock, Zap, Brain, Bug, Shield, Activity } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SubjectSuggestion {
  label_th: string;
  label_en: string;
  prompt_th: string;
  prompt_en: string;
}

export interface SubjectInfo {
  id: string;
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
  minGradeIndex: number;
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
      { label_th: 'แคลคูลัส', label_en: 'Calculus', prompt_th: 'สอนเรื่องลิมิต อนุพันธ์ และอินทิกรัลเบื้องต้น', prompt_en: 'Teach me about limits, derivatives, and basic integration' },
      { label_th: 'สถิติและความน่าจะเป็น', label_en: 'Statistics & Probability', prompt_th: 'สอนเรื่องสถิติ ความน่าจะเป็น และการกระจายของข้อมูล', prompt_en: 'Teach me about statistics, probability, and data distributions' },
      { label_th: 'กราฟและฟังก์ชัน', label_en: 'Graphs & Functions', prompt_th: 'สอนเรื่องฟังก์ชัน กราฟ และการแปลงกราฟ', prompt_en: 'Teach me about functions, graphs, and transformations' },
      { label_th: 'โจทย์ปัญหา', label_en: 'Word Problems', prompt_th: 'ช่วยฝึกแปลงโจทย์ปัญหาเป็นสมการแล้วแก้ปัญหา', prompt_en: 'Help me practice turning word problems into equations and solving them' },
      { label_th: 'เตรียม O-NET / A-Level', label_en: 'Exam Practice', prompt_th: 'ช่วยฝึกโจทย์คณิตศาสตร์สำหรับสอบ O-NET หรือ A-Level', prompt_en: 'Practice math problems for O-NET or A-Level exams' },
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
      { label_th: 'อวกาศและโลก', label_en: 'Space & Earth', prompt_th: 'สอนเรื่องระบบสุริยะ ดวงดาว และโลกของเรา', prompt_en: 'Teach me about the solar system, stars, and our planet' },
      { label_th: 'การทดลอง', label_en: 'Experiments', prompt_th: 'แนะนำการทดลองวิทยาศาสตร์ง่ายๆ ที่ทำได้ที่บ้าน', prompt_en: 'Suggest simple science experiments I can do at home' },
    ],
  },
  {
    id: 'physics',
    slug: 'physics',
    code: 'physics',
    name_th: 'ฟิสิกส์',
    name_en: 'Physics',
    icon: Zap,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#F97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    description_th: 'เรียนรู้แรง การเคลื่อนที่ พลังงาน คลื่น และไฟฟ้า',
    description_en: 'Forces, motion, energy, waves, and electricity',
    minGradeIndex: 10, // secondary_4 (M4)
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'การเคลื่อนที่', label_en: 'Kinematics', prompt_th: 'สอนเรื่องการเคลื่อนที่ ความเร็ว ความเร่ง และสมการการเคลื่อนที่', prompt_en: 'Teach me about kinematics: velocity, acceleration, and equations of motion' },
      { label_th: 'แรงและกฎของนิวตัน', label_en: 'Forces & Newton\'s Laws', prompt_th: 'สอนกฎของนิวตันทั้ง 3 ข้อ พร้อมตัวอย่าง', prompt_en: 'Teach me Newton\'s 3 laws of motion with examples' },
      { label_th: 'พลังงานและงาน', label_en: 'Energy & Work', prompt_th: 'สอนเรื่องงาน พลังงาน และการอนุรักษ์พลังงาน', prompt_en: 'Teach me about work, energy, and conservation of energy' },
      { label_th: 'คลื่นและเสียง', label_en: 'Waves & Sound', prompt_th: 'สอนเรื่องคลื่น เสียง และการสะท้อน', prompt_en: 'Teach me about waves, sound, and reflection' },
      { label_th: 'แสงและทัศนศาสตร์', label_en: 'Light & Optics', prompt_th: 'สอนเรื่องแสง การหักเห กระจก และเลนส์', prompt_en: 'Teach me about light, refraction, mirrors, and lenses' },
      { label_th: 'ไฟฟ้าและสนามแม่เหล็ก', label_en: 'Electricity & Magnetism', prompt_th: 'สอนเรื่องกระแสไฟฟ้า วงจร และสนามแม่เหล็ก', prompt_en: 'Teach me about electric current, circuits, and magnetic fields' },
      { label_th: 'เตรียม A-Level ฟิสิกส์', label_en: 'A-Level Physics Practice', prompt_th: 'ช่วยฝึกโจทย์ฟิสิกส์ระดับ A-Level / PAT', prompt_en: 'Practice A-Level or PAT Physics problems' },
    ],
  },
  {
    id: 'chemistry',
    slug: 'chemistry',
    code: 'chemistry',
    name_th: 'เคมี',
    name_en: 'Chemistry',
    icon: Atom,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    description_th: 'สารและโครงสร้าง ปฏิกิริยาเคมี อินทรีย์เคมี',
    description_en: 'Matter, reactions, organic and inorganic chemistry',
    minGradeIndex: 10, // M4
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'โครงสร้างอะตอม', label_en: 'Atomic Structure', prompt_th: 'สอนเรื่องโครงสร้างอะตอม ตารางธาตุ และพันธะเคมี', prompt_en: 'Teach me about atomic structure, the periodic table, and chemical bonding' },
      { label_th: 'ปริมาณสัมพันธ์', label_en: 'Stoichiometry', prompt_th: 'สอนเรื่องสมการเคมี โมล และปริมาณสัมพันธ์', prompt_en: 'Teach me about balancing equations, moles, and stoichiometry' },
      { label_th: 'ปฏิกิริยาเคมี', label_en: 'Chemical Reactions', prompt_th: 'สอนเรื่องประเภทปฏิกิริยาเคมี อัตราการเกิดปฏิกิริยา', prompt_en: 'Teach me types of chemical reactions and reaction rates' },
      { label_th: 'กรด-เบส', label_en: 'Acids & Bases', prompt_th: 'สอนเรื่องกรด เบส pH และปฏิกิริยาสะเทิน', prompt_en: 'Teach me about acids, bases, pH, and neutralization' },
      { label_th: 'เคมีอินทรีย์', label_en: 'Organic Chemistry', prompt_th: 'สอนเรื่องสารประกอบอินทรีย์ ไฮโดรคาร์บอน และหมู่ฟังก์ชัน', prompt_en: 'Teach me about organic compounds, hydrocarbons, and functional groups' },
      { label_th: 'เตรียม A-Level เคมี', label_en: 'A-Level Chemistry Practice', prompt_th: 'ช่วยฝึกโจทย์เคมีสำหรับสอบ A-Level', prompt_en: 'Practice A-Level or PAT Chemistry problems' },
    ],
  },
  {
    id: 'biology',
    slug: 'biology',
    code: 'biology',
    name_th: 'ชีววิทยา',
    name_en: 'Biology',
    icon: Dna,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#84CC16',
    bgColor: 'bg-lime-50 dark:bg-lime-950/30',
    description_th: 'เซลล์ ร่างกาย พันธุกรรม วิวัฒนาการ และระบบนิเวศ',
    description_en: 'Cells, body systems, genetics, evolution, and ecology',
    minGradeIndex: 10, // M4
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'เซลล์และชีววิทยาของเซลล์', label_en: 'Cell Biology', prompt_th: 'สอนเรื่องโครงสร้างเซลล์ การแบ่งเซลล์ และการลำเลียงสาร', prompt_en: 'Teach me about cell structure, cell division, and transport across membranes' },
      { label_th: 'ร่างกายมนุษย์', label_en: 'Human Body Systems', prompt_th: 'สอนเรื่องระบบย่อยอาหาร ระบบหายใจ ระบบหมุนเวียนเลือด', prompt_en: 'Teach me about digestive, respiratory, and circulatory systems' },
      { label_th: 'พันธุศาสตร์', label_en: 'Genetics', prompt_th: 'สอนเรื่อง DNA ยีน การถ่ายทอดทางพันธุกรรม และกฎของเมนเดล', prompt_en: 'Teach me about DNA, genes, heredity, and Mendel\'s laws' },
      { label_th: 'วิวัฒนาการ', label_en: 'Evolution', prompt_th: 'สอนเรื่องทฤษฎีวิวัฒนาการ การคัดเลือกโดยธรรมชาติ', prompt_en: 'Teach me about evolution theory and natural selection' },
      { label_th: 'ระบบนิเวศ', label_en: 'Ecology', prompt_th: 'สอนเรื่องระบบนิเวศ ห่วงโซ่อาหาร และสมดุลธรรมชาติ', prompt_en: 'Teach me about ecosystems, food webs, and environmental balance' },
      { label_th: 'เตรียม A-Level ชีววิทยา', label_en: 'A-Level Biology Practice', prompt_th: 'ช่วยฝึกโจทย์ชีววิทยาสำหรับสอบ A-Level', prompt_en: 'Practice A-Level or PAT Biology problems' },
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
      { label_th: 'เตรียม O-NET ภาษาอังกฤษ', label_en: 'O-NET English Prep', prompt_th: 'ช่วยฝึกโจทย์ภาษาอังกฤษสำหรับสอบ O-NET ม.3', prompt_en: 'Practice English for the Grade 9 O-NET exam' },
    ],
  },
  {
    id: 'social',
    slug: 'social',
    code: 'social',
    name_th: 'สังคมศึกษา',
    name_en: 'Social Studies',
    icon: Globe,
    illustrationUrl: '/illustrations/reading_kid.png',
    color: '#3B82F6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    description_th: 'ประวัติศาสตร์ ภูมิศาสตร์ เศรษฐศาสตร์ และพลเมือง',
    description_en: 'History, geography, economics, and civics',
    minGradeIndex: 1,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ประวัติศาสตร์ไทย', label_en: 'Thai History', prompt_th: 'สอนเรื่องประวัติศาสตร์ไทย ตั้งแต่อาณาจักรโบราณจนถึงปัจจุบัน', prompt_en: 'Teach me Thai history from ancient kingdoms to modern times' },
      { label_th: 'ประวัติศาสตร์โลก', label_en: 'World History', prompt_th: 'สอนเรื่องประวัติศาสตร์โลกที่สำคัญ เช่น สงครามโลก การปฏิวัติ', prompt_en: 'Teach me key events in world history: wars, revolutions, empires' },
      { label_th: 'ภูมิศาสตร์', label_en: 'Geography', prompt_th: 'สอนเรื่องภูมิศาสตร์ไทยและโลก ภูมิประเทศ ภูมิอากาศ', prompt_en: 'Teach me geography: landforms, climate, and countries of the world' },
      { label_th: 'เศรษฐศาสตร์', label_en: 'Economics', prompt_th: 'สอนเรื่องเศรษฐศาสตร์เบื้องต้น อุปสงค์ อุปทาน และระบบเศรษฐกิจ', prompt_en: 'Teach me basic economics: supply, demand, and economic systems' },
      { label_th: 'ศาสนาและวัฒนธรรม', label_en: 'Religion & Culture', prompt_th: 'สอนเรื่องพุทธศาสนาและวัฒนธรรมไทย', prompt_en: 'Teach me about Buddhism and Thai culture' },
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
      { label_th: 'วรรณคดี', label_en: 'Literature', prompt_th: 'สอนเรื่องวรรณคดีไทยที่สำคัญ เช่น รามเกียรติ์ อิเหนา', prompt_en: 'Teach me about important Thai literature: Ramakien, I-nao' },
      { label_th: 'สำนวนและสุภาษิต', label_en: 'Thai Idioms', prompt_th: 'สอนสำนวนและสุภาษิตไทยพร้อมความหมาย', prompt_en: 'Teach me Thai idioms and proverbs with their meanings' },
      { label_th: 'การเขียนเรียงความ', label_en: 'Essay Writing', prompt_th: 'สอนวิธีเขียนเรียงความภาษาไทยให้ถูกต้อง', prompt_en: 'Teach me how to write an essay in Thai correctly' },
      { label_th: 'คำราชาศัพท์', label_en: 'Royal Thai', prompt_th: 'สอนเรื่องคำราชาศัพท์และการใช้ภาษาสุภาพ', prompt_en: 'Teach me about royal Thai vocabulary and formal language' },
      { label_th: 'เตรียม O-NET / A-Level ภาษาไทย', label_en: 'Thai Exam Prep', prompt_th: 'ช่วยฝึกโจทย์ภาษาไทยสำหรับสอบ O-NET หรือ A-Level', prompt_en: 'Practice Thai language for O-NET or A-Level exams' },
    ],
  },
  {
    id: 'history',
    slug: 'history',
    code: 'history',
    name_th: 'ประวัติศาสตร์',
    name_en: 'History',
    icon: Clock,
    illustrationUrl: '/illustrations/reading_kid.png',
    color: '#D97706',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    description_th: 'ประวัติศาสตร์ไทยและโลก เหตุการณ์สำคัญในอดีต',
    description_en: 'Thai and world history, key events and civilizations',
    minGradeIndex: 1,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'อาณาจักรไทยโบราณ', label_en: 'Ancient Thai Kingdoms', prompt_th: 'สอนเรื่องสุโขทัย อยุธยา ธนบุรี และรัตนโกสินทร์', prompt_en: 'Teach me about Sukhothai, Ayutthaya, Thonburi, and Rattanakosin kingdoms' },
      { label_th: 'ประวัติศาสตร์โลกยุคใหม่', label_en: 'Modern World History', prompt_th: 'สอนเรื่องสงครามโลก การปฏิวัติอุตสาหกรรม และสงครามเย็น', prompt_en: 'Teach me about World Wars, Industrial Revolution, and Cold War' },
      { label_th: 'อารยธรรมโลก', label_en: 'World Civilizations', prompt_th: 'สอนเรื่องอารยธรรมกรีก โรมัน อียิปต์ และจีน', prompt_en: 'Teach me about Greek, Roman, Egyptian, and Chinese civilizations' },
      { label_th: 'ประวัติศาสตร์ไทยยุคใหม่', label_en: 'Modern Thai History', prompt_th: 'สอนเรื่องไทยในยุคปัจจุบัน การเปลี่ยนแปลงทางการเมืองและสังคม', prompt_en: 'Teach me about modern Thailand: political and social changes' },
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

  // ── UNIVERSITY MEDICAL SCIENCE (SUT) ──────────────────────────────────────
  {
    id: 'med_biochem',
    slug: 'med_biochem',
    code: 'med_biochem',
    name_th: 'ชีวเคมีทางการแพทย์',
    name_en: 'Medical Biochemistry',
    icon: FlaskConical,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#0EA5E9',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    description_th: 'ชีวโมเลกุล เมแทบอลิซึม และชีววิทยาโมเลกุล',
    description_en: 'Biomolecules, metabolism, and molecular biology',
    minGradeIndex: 14, // university_1
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'โปรตีนและเอนไซม์', label_en: 'Proteins & Enzymes', prompt_th: 'สอนเรื่องโครงสร้างโปรตีน กรดอะมิโน และการทำงานของเอนไซม์', prompt_en: 'Teach me about protein structure, amino acids, and enzyme kinetics' },
      { label_th: 'กรดนิวคลิอิกและ DNA', label_en: 'Nucleic Acids & DNA', prompt_th: 'สอนเรื่อง DNA RNA การจำลองดีเอ็นเอ และการแสดงออกของยีน', prompt_en: 'Teach me about DNA, RNA, replication, and gene expression' },
      { label_th: 'เมแทบอลิซึมของคาร์โบไฮเดรต', label_en: 'Carbohydrate Metabolism', prompt_th: 'สอนเรื่องไกลโคไลซิส วัฏจักรเครบส์ และการผลิต ATP', prompt_en: 'Teach me about glycolysis, Krebs cycle, and ATP production' },
      { label_th: 'เมแทบอลิซึมของไขมัน', label_en: 'Lipid Metabolism', prompt_th: 'สอนเรื่องไขมัน กรดไขมัน และเมแทบอลิซึมของลิพิด', prompt_en: 'Teach me about lipids, fatty acids, and lipid metabolism' },
      { label_th: 'เทคนิคชีวโมเลกุล', label_en: 'Molecular Techniques', prompt_th: 'สอนเทคนิค PCR, gel electrophoresis, Western blot และ ELISA', prompt_en: 'Teach me PCR, gel electrophoresis, Western blot, and ELISA techniques' },
      { label_th: 'ชีวเคมีคลินิก', label_en: 'Clinical Biochemistry', prompt_th: 'สอนเรื่องการตรวจทางชีวเคมีคลินิก ค่าปกติ และการแปลผล', prompt_en: 'Teach me clinical biochemistry tests, normal values, and interpretation' },
    ],
  },
  {
    id: 'microbiology',
    slug: 'microbiology',
    code: 'microbiology',
    name_th: 'จุลชีววิทยาและปรสิตวิทยา',
    name_en: 'Microbiology & Parasitology',
    icon: Bug,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#16A34A',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    description_th: 'แบคทีเรีย ไวรัส เชื้อรา และปรสิตทางการแพทย์',
    description_en: 'Bacteria, viruses, fungi, and medical parasites',
    minGradeIndex: 14,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'แบคทีเรียวิทยา', label_en: 'Bacteriology', prompt_th: 'สอนเรื่องโครงสร้างแบคทีเรีย การย้อมสี Gram และชนิดสำคัญทางคลินิก', prompt_en: 'Teach me bacterial structure, Gram staining, and clinically important species' },
      { label_th: 'ไวรัสวิทยา', label_en: 'Virology', prompt_th: 'สอนเรื่องโครงสร้างไวรัส วงจรการจำลอง และไวรัสสำคัญทางการแพทย์', prompt_en: 'Teach me virus structure, replication cycle, and medically important viruses' },
      { label_th: 'เชื้อราวิทยา', label_en: 'Mycology', prompt_th: 'สอนเรื่องเชื้อราทางการแพทย์ การวินิจฉัย และการรักษา', prompt_en: 'Teach me about medical fungi, diagnosis, and treatment' },
      { label_th: 'ปรสิตวิทยา', label_en: 'Parasitology', prompt_th: 'สอนเรื่องโปรโตซัว หนอนพยาธิ และแมลงทางการแพทย์', prompt_en: 'Teach me about protozoa, helminths, and medical arthropods' },
      { label_th: 'เทคนิคจุลชีววิทยา', label_en: 'Microbiology Techniques', prompt_th: 'สอนเทคนิคการเพาะเชื้อ การทดสอบความไวยา และการจำแนกเชื้อ', prompt_en: 'Teach me culture techniques, antibiotic sensitivity testing, and identification methods' },
      { label_th: 'จุลชีววิทยาคลินิก', label_en: 'Clinical Microbiology', prompt_th: 'สอนเรื่องการตรวจทางจุลชีววิทยาในโรงพยาบาล วัสดุส่งตรวจ และการแปลผล', prompt_en: 'Teach me clinical microbiology testing, specimen collection, and result interpretation' },
    ],
  },
  {
    id: 'immunology',
    slug: 'immunology',
    code: 'immunology',
    name_th: 'ภูมิคุ้มกันวิทยาและโลหิตวิทยา',
    name_en: 'Immunology & Hematology',
    icon: Shield,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#7C3AED',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    description_th: 'ระบบภูมิคุ้มกันและวิทยาการเลือด',
    description_en: 'Immune system and blood science',
    minGradeIndex: 14,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ภูมิคุ้มกันโดยกำเนิด', label_en: 'Innate Immunity', prompt_th: 'สอนเรื่องระบบภูมิคุ้มกันโดยกำเนิด เซลล์ป้องกัน และการอักเสบ', prompt_en: 'Teach me about innate immunity, defense cells, and inflammation' },
      { label_th: 'ภูมิคุ้มกันแบบปรับตัว', label_en: 'Adaptive Immunity', prompt_th: 'สอนเรื่องลิมโฟไซต์ T-cell B-cell และการสร้างแอนติบอดี', prompt_en: 'Teach me about lymphocytes, T-cells, B-cells, and antibody production' },
      { label_th: 'เซรุ่มวิทยา', label_en: 'Serology', prompt_th: 'สอนเทคนิคการตรวจเซรุ่มวิทยา เช่น ELISA, Western blot และ agglutination', prompt_en: 'Teach me serological techniques: ELISA, Western blot, and agglutination tests' },
      { label_th: 'โลหิตวิทยาพื้นฐาน', label_en: 'Basic Hematology', prompt_th: 'สอนเรื่องเซลล์เม็ดเลือด การนับเซลล์ (CBC) และการตรวจเลือดปกติ', prompt_en: 'Teach me blood cells, complete blood count (CBC), and normal blood values' },
      { label_th: 'โรคเลือด', label_en: 'Blood Disorders', prompt_th: 'สอนเรื่องโรคโลหิตจาง ธาลัสซีเมีย และโรคเม็ดเลือดขาวผิดปกติ', prompt_en: 'Teach me about anemia, thalassemia, and leukemia' },
      { label_th: 'วัคซีนและภูมิคุ้มกันบำบัด', label_en: 'Vaccines & Immunotherapy', prompt_th: 'สอนเรื่องหลักการวัคซีน ภูมิคุ้มกันบำบัดมะเร็ง และโรคภูมิแพ้', prompt_en: 'Teach me vaccine principles, cancer immunotherapy, and allergic diseases' },
    ],
  },
  {
    id: 'research_methods',
    slug: 'research_methods',
    code: 'research_methods',
    name_th: 'ระเบียบวิธีวิจัยและชีวสารสนเทศ',
    name_en: 'Research Methods & Bioinformatics',
    icon: Brain,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#DB2777',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    description_th: 'การวิจัยทางวิทยาศาสตร์ สถิติ และชีวสารสนเทศ',
    description_en: 'Scientific research, statistics, and bioinformatics',
    minGradeIndex: 14,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ระเบียบวิธีวิจัย', label_en: 'Research Methodology', prompt_th: 'สอนเรื่องการออกแบบการวิจัย สมมติฐาน และตัวแปร', prompt_en: 'Teach me about research design, hypotheses, and variables' },
      { label_th: 'สถิติสำหรับการวิจัย', label_en: 'Research Statistics', prompt_th: 'สอนเรื่องสถิติพื้นฐาน t-test, ANOVA และ chi-square สำหรับงานวิจัย', prompt_en: 'Teach me basic statistics: t-test, ANOVA, and chi-square for research' },
      { label_th: 'การเขียนบทความวิชาการ', label_en: 'Scientific Writing', prompt_th: 'สอนวิธีเขียนบทความวิชาการ รายงานวิจัย และการอ้างอิง', prompt_en: 'Teach me how to write scientific papers, research reports, and citations' },
      { label_th: 'ชีวสารสนเทศเบื้องต้น', label_en: 'Basic Bioinformatics', prompt_th: 'สอนเรื่องฐานข้อมูลชีววิทยา (NCBI, BLAST) และการวิเคราะห์ลำดับ DNA', prompt_en: 'Teach me bioinformatics databases (NCBI, BLAST) and DNA sequence analysis' },
      { label_th: 'จริยธรรมการวิจัย', label_en: 'Research Ethics', prompt_th: 'สอนเรื่องจริยธรรมในการวิจัย ความปลอดภัยทางชีวภาพ และ IRB', prompt_en: 'Teach me research ethics, biosafety regulations, and IRB requirements' },
      { label_th: 'การทบทวนวรรณกรรม', label_en: 'Literature Review', prompt_th: 'สอนวิธีค้นหาบทความวิชาการ ทบทวนวรรณกรรม และวิเคราะห์งานวิจัย', prompt_en: 'Teach me how to search scientific literature, write literature reviews, and critically analyze research' },
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
