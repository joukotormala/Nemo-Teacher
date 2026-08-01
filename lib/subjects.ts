import { Calculator, FlaskConical, BookOpen, Languages, BookText, Microscope, Atom, Dna, Globe, Clock, Zap, Brain, Bug, Shield, Activity, Monitor } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SubjectSuggestion {
  label_th: string;
  label_en: string;
  label_sv?: string;
  prompt_th: string;
  prompt_en: string;
  prompt_sv?: string;
}

export interface SubjectInfo {
  id: string;
  slug: string;
  code: string; // matches DB subjects.code
  name_th: string;
  name_en: string;
  name_sv?: string;
  icon: LucideIcon;
  illustrationUrl: string;
  color: string;
  bgColor: string;
  description_th: string;
  description_en: string;
  description_sv?: string;
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
    name_sv: 'Matematik',
    icon: Calculator,
    illustrationUrl: '/illustrations/math_kid.png',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    description_th: 'เรียนรู้ตัวเลข การคำนวณ และการแก้ปัญหา',
    description_en: 'Learn numbers, calculations, and problem solving',
    description_sv: 'Lär dig siffror, beräkningar och problemlösning',
    minGradeIndex: 0,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'เลขคณิต', label_en: 'Arithmetic', label_sv: 'Aritmetik', prompt_th: 'สอนเรื่องเศษส่วน ทศนิยม และเปอร์เซ็นต์', prompt_en: 'Teach me about fractions, decimals, and percentages', prompt_sv: 'Lär mig om bråk, decimaltal och procent' },
      { label_th: 'พีชคณิต', label_en: 'Algebra', label_sv: 'Algebra', prompt_th: 'สอนเรื่องการแก้สมการและการแยกตัวประกอบ', prompt_en: 'Teach me about simplifying expressions, solving equations, and factorising', prompt_sv: 'Lär mig om att förenkla uttryck och lösa ekvationer' },
      { label_th: 'เรขาคณิต', label_en: 'Geometry', label_sv: 'Geometri', prompt_th: 'สอนเรื่องมุม สามเหลี่ยม วงกลม พื้นที่ และเส้นรอบรูป', prompt_en: 'Teach me about angles, triangles, circles, area, and perimeter', prompt_sv: 'Lär mig om vinklar, trianglar, cirklar, area och omkrets' },
      { label_th: 'แคลคูลัส', label_en: 'Calculus', label_sv: 'Analys & Kalkyl', prompt_th: 'สอนเรื่องลิมิต อนุพันธ์ และอินทิกรัลเบื้องต้น', prompt_en: 'Teach me about limits, derivatives, and basic integration', prompt_sv: 'Lär mig om gränsvärden, derivator och grundläggande integration' },
      { label_th: 'สถิติและความน่าจะเป็น', label_en: 'Statistics & Probability', label_sv: 'Statistik & Sannolikhet', prompt_th: 'สอนเรื่องสถิติ ความน่าจะเป็น และการกระจายของข้อมูล', prompt_en: 'Teach me about statistics, probability, and data distributions', prompt_sv: 'Lär mig om statistik och sannolikhet' },
      { label_th: 'กราฟและฟังก์ชัน', label_en: 'Graphs & Functions', label_sv: 'Grafer & Funktioner', prompt_th: 'สอนเรื่องฟังก์ชัน กราฟ และการแปลงกราฟ', prompt_en: 'Teach me about functions, graphs, and transformations', prompt_sv: 'Lär mig om funktioner och grafer' },
      { label_th: 'โจทย์ปัญหา', label_en: 'Word Problems', label_sv: 'Textproblem', prompt_th: 'ช่วยฝึกแปลงโจทย์ปัญหาเป็นสมการแล้วแก้ปัญหา', prompt_en: 'Help me practice turning word problems into equations and solving them', prompt_sv: 'Hjälp mig öva på att omvandla textproblem till ekvationer och lösa dem' },
      { label_th: 'เตรียม O-NET / A-Level', label_en: 'Exam Practice', label_sv: 'Provträning', prompt_th: 'ช่วยฝึกโจทย์คณิตศาสตร์สำหรับสอบ O-NET หรือ A-Level', prompt_en: 'Practice math problems for O-NET or A-Level exams', prompt_sv: 'Öva på matematikproblem inför prov' },
    ],
  },
  {
    id: 'science',
    slug: 'science',
    code: 'science',
    name_th: 'วิทยาศาสตร์',
    name_en: 'Science',
    name_sv: 'Naturvetenskap',
    icon: FlaskConical,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#06B6D4',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    description_th: 'สำรวจโลกแห่งวิทยาศาสตร์และธรรมชาติ',
    description_en: 'Explore the world of science and nature',
    description_sv: 'Utforska vetenskapens och naturens värld',
    minGradeIndex: 1,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ชีววิทยา', label_en: 'Biology', label_sv: 'Biologi', prompt_th: 'สอนเรื่องเซลล์ อวัยวะ และระบบร่างกายมนุษย์', prompt_en: 'Teach me about cells, organs, and human body systems', prompt_sv: 'Lär mig om celler, organ och människo kROppens system' },
      { label_th: 'เคมี', label_en: 'Chemistry', label_sv: 'Kemi', prompt_th: 'สอนเรื่องธาตุ สารประกอบ และปฏิกิริยาเคมี', prompt_en: 'Teach me about elements, compounds, and chemical reactions', prompt_sv: 'Lär mig om grundämnen, föreningar och kemiska reaktioner' },
      { label_th: 'ฟิสิกส์', label_en: 'Physics', label_sv: 'Fysik', prompt_th: 'สอนเรื่องแรง การเคลื่อนที่ และพลังงาน', prompt_en: 'Teach me about forces, motion, and energy', prompt_sv: 'Lär mig om krafter, rörelse och energi' },
      { label_th: 'ระบบนิเวศ', label_en: 'Ecosystems', label_sv: 'Ekosystem', prompt_th: 'สอนเรื่องห่วงโซ่อาหาร ระบบนิเวศ และสิ่งแวดล้อม', prompt_en: 'Teach me about food chains, ecosystems, and the environment', prompt_sv: 'Lär mig om näringskedjor, ekosystem och miljön' },
      { label_th: 'อวกาศและโลก', label_en: 'Space & Earth', label_sv: 'Rymden & Jorden', prompt_th: 'สอนเรื่องระบบสุริยะ ดวงดาว และโลกของเรา', prompt_en: 'Teach me about the solar system, stars, and our planet', prompt_sv: 'Lär mig om solsystemet, stjärnor och vår planet' },
      { label_th: 'การทดลอง', label_en: 'Experiments', label_sv: 'Experiment', prompt_th: 'แนะนำการทดลองวิทยาศาสตร์ง่ายๆ ที่ทำได้ที่บ้าน', prompt_en: 'Suggest simple science experiments I can do at home', prompt_sv: 'Föreslå enkla vetenskapliga experiment jag kan göra hemma' },
    ],
  },
  {
    id: 'physics',
    slug: 'physics',
    code: 'physics',
    name_th: 'ฟิสิกส์',
    name_en: 'Physics',
    name_sv: 'Fysik',
    icon: Zap,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#F97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    description_th: 'เรียนรู้แรง การเคลื่อนที่ พลังงาน คลื่น และไฟฟ้า',
    description_en: 'Forces, motion, energy, waves, and electricity',
    description_sv: 'Krafter, rörelse, energi, vågor och elektricitet',
    minGradeIndex: 10, // secondary_4 (M4)
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'การเคลื่อนที่', label_en: 'Kinematics', label_sv: 'Kinematik', prompt_th: 'สอนเรื่องการเคลื่อนที่ ความเร็ว ความเร่ง และสมการการเคลื่อนที่', prompt_en: 'Teach me about kinematics: velocity, acceleration, and equations of motion', prompt_sv: 'Lär mig om kinematik: hastighet, acceleration och rörelseekvationer' },
      { label_th: 'แรงและกฎของนิวตัน', label_en: 'Forces & Newton\'s Laws', label_sv: 'Krafter & Newtons lagar', prompt_th: 'สอนกฎของนิวตันทั้ง 3 ข้อ พร้อมตัวอย่าง', prompt_en: 'Teach me Newton\'s 3 laws of motion with examples', prompt_sv: 'Lär mig Newtons 3 rörelselagar med exempel' },
      { label_th: 'พลังงานและงาน', label_en: 'Energy & Work', label_sv: 'Energi & Arbete', prompt_th: 'สอนเรื่องงาน พลังงาน และการอนุรักษ์พลังงาน', prompt_en: 'Teach me about work, energy, and conservation of energy', prompt_sv: 'Lär mig om arbete, energi och energiprincipen' },
      { label_th: 'คลื่นและเสียง', label_en: 'Waves & Sound', label_sv: 'Vågor & Ljud', prompt_th: 'สอนเรื่องคลื่น เสียง และการสะท้อน', prompt_en: 'Teach me about waves, sound, and reflection', prompt_sv: 'Lär mig om vågor, ljud och reflektion' },
      { label_th: 'แสงและทัศนศาสตร์', label_en: 'Light & Optics', label_sv: 'Ljus & Optik', prompt_th: 'สอนเรื่องแสง การหักเห กระจก และเลนส์', prompt_en: 'Teach me about light, refraction, mirrors, and lenses', prompt_sv: 'Lär mig om ljus, brytning, speglar och linser' },
      { label_th: 'ไฟฟ้าและสนามแม่เหล็ก', label_en: 'Electricity & Magnetism', label_sv: 'Elektricitet & Magnetism', prompt_th: 'สอนเรื่องกระแสไฟฟ้า วงจร และสนามแม่เหล็ก', prompt_en: 'Teach me about electric current, circuits, and magnetic fields', prompt_sv: 'Lär mig om elektrisk ström, kretsar och magnetfält' },
      { label_th: 'เตรียม A-Level ฟิสิกส์', label_en: 'A-Level Physics Practice', label_sv: 'Fysik Provträning', prompt_th: 'ช่วยฝึกโจทย์ฟิสิกส์ระดับ A-Level / PAT', prompt_en: 'Practice A-Level or PAT Physics problems', prompt_sv: 'Öva på fysikproblem inför prov' },
    ],
  },
  {
    id: 'chemistry',
    slug: 'chemistry',
    code: 'chemistry',
    name_th: 'เคมี',
    name_en: 'Chemistry',
    name_sv: 'Kemi',
    icon: Atom,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    description_th: 'สารและโครงสร้าง ปฏิกิริยาเคมี อินทรีย์เคมี',
    description_en: 'Matter, reactions, organic and inorganic chemistry',
    description_sv: 'Materia, reaktioner, organisk och oorganisk kemi',
    minGradeIndex: 10, // M4
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'โครงสร้างอะตอม', label_en: 'Atomic Structure', label_sv: 'Atomstruktur', prompt_th: 'สอนเรื่องโครงสร้างอะตอม ตารางธาตุ และพันธะเคมี', prompt_en: 'Teach me about atomic structure, the periodic table, and chemical bonding', prompt_sv: 'Lär mig om atomstruktur, periodiska systemet och kemisk bindning' },
      { label_th: 'ปริมาณสัมพันธ์', label_en: 'Stoichiometry', label_sv: 'Stökiometri', prompt_th: 'สอนเรื่องสมการเคมี โมล และปริมาณสัมพันธ์', prompt_en: 'Teach me about balancing equations, moles, and stoichiometry', prompt_sv: 'Lär mig om balansering av ekvationer, mol och stökiometri' },
      { label_th: 'ปฏิกิริยาเคมี', label_en: 'Chemical Reactions', label_sv: 'Kemiska reaktioner', prompt_th: 'สอนเรื่องประเภทปฏิกิริยาเคมี อัตราการเกิดปฏิกิริยา', prompt_en: 'Teach me types of chemical reactions and reaction rates', prompt_sv: 'Lär mig typer av kemiska reaktioner och reaktionshastighet' },
      { label_th: 'กรด-เบส', label_en: 'Acids & Bases', label_sv: 'Syror & Baser', prompt_th: 'สอนเรื่องกรด เบส pH และปฏิกิริยาสะเทิน', prompt_en: 'Teach me about acids, bases, pH, and neutralization', prompt_sv: 'Lär mig om syror, baser, pH och neutralisation' },
      { label_th: 'เคมีอินทรีย์', label_en: 'Organic Chemistry', label_sv: 'Organisk kemi', prompt_th: 'สอนเรื่องสารประกอบอินทรีย์ ไฮโดรคาร์บอน และหมู่ฟังก์ชัน', prompt_en: 'Teach me about organic compounds, hydrocarbons, and functional groups', prompt_sv: 'Lär mig om organiska föreningar, kolväten och funktionella grupper' },
      { label_th: 'เตรียม A-Level เคมี', label_en: 'A-Level Chemistry Practice', label_sv: 'Kemi Provträning', prompt_th: 'ช่วยฝึกโจทย์เคมีสำหรับสอบ A-Level', prompt_en: 'Practice A-Level or PAT Chemistry problems', prompt_sv: 'Öva på kemiproblem inför prov' },
    ],
  },
  {
    id: 'biology',
    slug: 'biology',
    code: 'biology',
    name_th: 'ชีววิทยา',
    name_en: 'Biology',
    name_sv: 'Biologi',
    icon: Dna,
    illustrationUrl: '/illustrations/science_kid.png',
    color: '#84CC16',
    bgColor: 'bg-lime-50 dark:bg-lime-950/30',
    description_th: 'เซลล์ ร่างกาย พันธุกรรม วิวัฒนาการ และระบบนิเวศ',
    description_en: 'Cells, body systems, genetics, evolution, and ecology',
    description_sv: 'Celler, kroppssystem, genetik, evolution och ekologi',
    minGradeIndex: 10, // M4
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'เซลล์และชีววิทยาของเซลล์', label_en: 'Cell Biology', label_sv: 'Cellbiologi', prompt_th: 'สอนเรื่องโครงสร้างเซลล์ การแบ่งเซลล์ และการลำเลียงสาร', prompt_en: 'Teach me about cell structure, cell division, and transport across membranes', prompt_sv: 'Lär mig om cellstruktur, celldelning och transport över membran' },
      { label_th: 'ร่างกายมนุษย์', label_en: 'Human Body Systems', label_sv: 'Människokroppens system', prompt_th: 'สอนเรื่องระบบย่อยอาหาร ระบบหายใจ ระบบหมุนเวียนเลือด', prompt_en: 'Teach me about digestive, respiratory, and circulatory systems', prompt_sv: 'Lär mig om matsmältnings-, andnings- och cirkulationssystemen' },
      { label_th: 'พันธุศาสตร์', label_en: 'Genetics', label_sv: 'Genetik', prompt_th: 'สอนเรื่อง DNA ยีน การถ่ายทอดทางพันธุกรรม และกฎของเมนเดล', prompt_en: 'Teach me about DNA, genes, heredity, and Mendel\'s laws', prompt_sv: 'Lär mig om DNA, gener, ärftlighet och Mendels lagar' },
      { label_th: 'วิวัฒนาการ', label_en: 'Evolution', label_sv: 'Evolution', prompt_th: 'สอนเรื่องทฤษฎีวิวัฒนาการ การคัดเลือกโดยธรรมชาติ', prompt_en: 'Teach me about evolution theory and natural selection', prompt_sv: 'Lär mig om evolutionsteorin och naturligt urval' },
      { label_th: 'ระบบนิเวศ', label_en: 'Ecology', label_sv: 'Ekologi', prompt_th: 'สอนเรื่องระบบนิเวศ ห่วงโซ่อาหาร และสมดุลธรรมชาติ', prompt_en: 'Teach me about ecosystems, food webs, and environmental balance', prompt_sv: 'Lär mig om ekosystem, näringsvävar och miljöbalans' },
      { label_th: 'เตรียม A-Level ชีววิทยา', label_en: 'A-Level Biology Practice', label_sv: 'Biologi Provträning', prompt_th: 'ช่วยฝึกโจทย์ชีววิทยาสำหรับสอบ A-Level', prompt_en: 'Practice A-Level or PAT Biology problems', prompt_sv: 'Öva på biologiproblem inför prov' },
    ],
  },
  {
    id: 'english',
    slug: 'english',
    code: 'english',
    name_th: 'ภาษาอังกฤษ',
    name_en: 'English',
    name_sv: 'Engelska',
    icon: Languages,
    illustrationUrl: '/illustrations/english_kid.png',
    color: '#F59E0B',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    description_th: 'ฝึกทักษะภาษาอังกฤษ การพูด อ่าน เขียน',
    description_en: 'Practice English speaking, reading, and writing',
    description_sv: 'Öva på att tala, läsa och skriva engelska',
    minGradeIndex: 0,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ไวยากรณ์', label_en: 'Grammar', label_sv: 'Grammatik', prompt_th: 'สอนเรื่อง Tenses ภาษาอังกฤษ', prompt_en: 'Teach me about English tenses and when to use each one', prompt_sv: 'Lär mig om engelska tempus och när man använder dem' },
      { label_th: 'คำศัพท์', label_en: 'Vocabulary', label_sv: 'Ordförråd', prompt_th: 'ช่วยฝึกคำศัพท์ภาษาอังกฤษใหม่ๆ พร้อมตัวอย่างประโยค', prompt_en: 'Help me learn new vocabulary words with example sentences', prompt_sv: 'Hjälp mig lära mig nya engelska ord med exempelmeningar' },
      { label_th: 'การเขียน', label_en: 'Writing', label_sv: 'Skriva', prompt_th: 'สอนวิธีเขียนเรียงความภาษาอังกฤษ', prompt_en: 'Teach me how to write an essay in English', prompt_sv: 'Lär mig hur man skriver en uppsats på engelska' },
      { label_th: 'การอ่าน', label_en: 'Reading', label_sv: 'Läsa', prompt_th: 'ให้บทอ่านสั้นๆ แล้วถามคำถามเพื่อฝึกความเข้าใจ', prompt_en: 'Give me a short reading passage and ask comprehension questions', prompt_sv: 'Ge mig en kort lästext och ställ frågor om innehållet' },
      { label_th: 'การสนทนา', label_en: 'Conversation', label_sv: 'Konversation', prompt_th: 'ฝึกบทสนทนาภาษาอังกฤษในชีวิตประจำวัน', prompt_en: 'Practice everyday English conversations with me', prompt_sv: 'Öva på vardagliga engelska samtal med mig' },
      { label_th: 'เตรียม O-NET ภาษาอังกฤษ', label_en: 'O-NET English Prep', label_sv: 'Engelska Provträning', prompt_th: 'ช่วยฝึกโจทย์ภาษาอังกฤษสำหรับสอบ O-NET ม.3', prompt_en: 'Practice English for the Grade 9 O-NET exam', prompt_sv: 'Öva på engelska inför prov' },
    ],
  },
  {
    id: 'social',
    slug: 'social',
    code: 'social',
    name_th: 'สังคมศึกษา',
    name_en: 'Social Studies',
    name_sv: 'Samhällskunskap',
    icon: Globe,
    illustrationUrl: '/illustrations/reading_kid.png',
    color: '#3B82F6',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    description_th: 'ประวัติศาสตร์ ภูมิศาสตร์ เศรษฐศาสตร์ และพลเมือง',
    description_en: 'History, geography, economics, and civics',
    description_sv: 'Historia, geografi, ekonomi och samhällsfrågor',
    minGradeIndex: 1,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ประวัติศาสตร์ไทย', label_en: 'Thai History', label_sv: 'Svensk historia', prompt_th: 'สอนเรื่องประวัติศาสตร์ไทย ตั้งแต่อาณาจักรโบราณจนถึงปัจจุบัน', prompt_en: 'Teach me Thai history from ancient kingdoms to modern times', prompt_sv: 'Lär mig om Sveriges historia från vikingatiden till modern tid' },
      { label_th: 'ประวัติศาสตร์โลก', label_en: 'World History', label_sv: 'Världshistoria', prompt_th: 'สอนเรื่องประวัติศาสตร์โลกที่สำคัญ เช่น สงครามโลก การปฏิวัติ', prompt_en: 'Teach me key events in world history: wars, revolutions, empires', prompt_sv: 'Lär mig viktiga händelser i världshistorien: krig, revolutioner och riken' },
      { label_th: 'ภูมิศาสตร์', label_en: 'Geography', label_sv: 'Geografi', prompt_th: 'สอนเรื่องภูมิศาสตร์ไทยและโลก ภูมิประเทศ ภูมิอากาศ', prompt_en: 'Teach me geography: landforms, climate, and countries of the world', prompt_sv: 'Lär mig geografi: landformer, klimat och världens länder' },
      { label_th: 'เศรษฐศาสตร์', label_en: 'Economics', label_sv: 'Ekonomi', prompt_th: 'สอนเรื่องเศรษฐศาสตร์เบื้องต้น อุปสงค์ อุปทาน และระบบเศรษฐกิจ', prompt_en: 'Teach me basic economics: supply, demand, and economic systems', prompt_sv: 'Lär mig grundläggande ekonomi: utbud, efterfrågan och ekonomiska system' },
      { label_th: 'ศาสนาและวัฒนธรรม', label_en: 'Religion & Culture', label_sv: 'Religion & Kultur', prompt_th: 'สอนเรื่องพุทธศาสนาและวัฒนธรรมไทย', prompt_en: 'Teach me about Buddhism and Thai culture', prompt_sv: 'Lär mig om buddhism och thailändsk kultur' },
    ],
  },
  {
    id: 'thai',
    slug: 'thai',
    code: 'thai',
    name_th: 'ภาษาไทย',
    name_en: 'Thai Language',
    name_sv: 'Thailändska',
    icon: BookText,
    illustrationUrl: '/illustrations/thai_kid.png',
    color: '#EC4899',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    description_th: 'เรียนรู้ภาษาไทย ไวยากรณ์ และวรรณคดี',
    description_en: 'Learn Thai language, grammar, and literature',
    description_sv: 'Lär dig det thailändska språket, grammatik och litteratur',
    minGradeIndex: 0,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ไวยากรณ์ไทย', label_en: 'Thai Grammar', label_sv: 'Thailändsk grammatik', prompt_th: 'สอนเรื่องชนิดของคำในภาษาไทย', prompt_en: 'Teach me about parts of speech in Thai language', prompt_sv: 'Lär mig om ordklasser i det thailändska språket' },
      { label_th: 'วรรณคดี', label_en: 'Literature', label_sv: 'Litteratur', prompt_th: 'สอนเรื่องวรรณคดีไทยที่สำคัญ เช่น รามเกียรติ์ อิเหนา', prompt_en: 'Teach me about important Thai literature: Ramakien, I-nao', prompt_sv: 'Lär mig om viktig thailändsk litteratur: Ramakien, I-nao' },
      { label_th: 'สำนวนและสุภาษิต', label_en: 'Thai Idioms', label_sv: 'Thailändska uttryck', prompt_th: 'สอนสำนวนและสุภาษิตไทยพร้อมความหมาย', prompt_en: 'Teach me Thai idioms and proverbs with their meanings', prompt_sv: 'Lär mig thailändska idiomer och ordspråk med deras betydelse' },
      { label_th: 'การเขียนเรียงความ', label_en: 'Essay Writing', label_sv: 'Uppsatsskrivande', prompt_th: 'สอนวิธีเขียนเรียงความภาษาไทยให้ถูกต้อง', prompt_en: 'Teach me how to write an essay in Thai correctly', prompt_sv: 'Lär mig hur man skriver en uppsats på thailändska' },
      { label_th: 'คำราชาศัพท์', label_en: 'Royal Thai', label_sv: 'Formell thailändska', prompt_th: 'สอนเรื่องคำราชาศัพท์และการใช้ภาษาสุภาพ', prompt_en: 'Teach me about royal Thai vocabulary and formal language', prompt_sv: 'Lär mig om formellt thailändskt ordförråd' },
      { label_th: 'เตรียม O-NET / A-Level ภาษาไทย', label_en: 'Thai Exam Prep', label_sv: 'Thailändska Provträning', prompt_th: 'ช่วยฝึกโจทย์ภาษาไทยสำหรับสอบ O-NET หรือ A-Level', prompt_en: 'Practice Thai language for O-NET or A-Level exams', prompt_sv: 'Öva på thailändska språkproblem inför prov' },
    ],
  },
  {
    id: 'swedish',
    slug: 'swedish',
    code: 'swedish',
    name_th: 'ภาษาสวีเดน',
    name_en: 'Swedish Language',
    name_sv: 'Svenska',
    icon: BookText,
    illustrationUrl: '/illustrations/reading_kid.png',
    color: '#0284C7',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    description_th: 'เรียนรู้ภาษาสวีเดน ไวยากรณ์ การอ่าน และการเขียน',
    description_en: 'Learn Swedish language, grammar, reading and writing',
    description_sv: 'Lär dig svenska språket, grammatik, läsa och skriva',
    minGradeIndex: 0,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'การอ่าน (Läsning)', label_en: 'Reading (Läsning)', label_sv: 'Läsning', prompt_th: 'ฝึกการอ่านภาษาสวีเดน', prompt_en: 'Practice Swedish reading', prompt_sv: 'Öva på att läsa svenska ord och meningar' },
      { label_th: 'การเขียน (Skrivning)', label_en: 'Writing (Skrivning)', label_sv: 'Skrivning', prompt_th: 'ฝึกการเขียนภาษาสวีเดน', prompt_en: 'Practice Swedish writing', prompt_sv: 'Öva på att skriva bokstäver och ord på svenska' },
      { label_th: 'ไวยากรณ์ (Grammatik)', label_en: 'Grammar (Grammatik)', label_sv: 'Grammatik', prompt_th: 'สอนไวยากรณ์สวีเดน', prompt_en: 'Teach me Swedish grammar', prompt_sv: 'Lär mig grundläggande svensk grammatik och meningsbyggnad' },
      { label_th: 'คำศัพท์ (Ordförråd)', label_en: 'Vocabulary (Ordförråd)', label_sv: 'Ordförråd', prompt_th: 'สอนคำศัพท์สวีเดนใหม่ๆ', prompt_en: 'Teach me new Swedish vocabulary', prompt_sv: 'Lär mig nya svenska ord och begrepp' },
    ],
  },
  {
    id: 'history',
    slug: 'history',
    code: 'history',
    name_th: 'ประวัติศาสตร์',
    name_en: 'History',
    name_sv: 'Historia',
    icon: Clock,
    illustrationUrl: '/illustrations/reading_kid.png',
    color: '#D97706',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    description_th: 'ประวัติศาสตร์ไทยและโลก เหตุการณ์สำคัญในอดีต',
    description_en: 'Thai and world history, key events and civilizations',
    description_sv: 'Svensk och världshistoria, viktiga händelser i det förflutna',
    minGradeIndex: 1,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'อาณาจักรไทยโบราณ', label_en: 'Ancient Thai Kingdoms', label_sv: 'Sveriges äldre historia', prompt_th: 'สอนเรื่องสุโขทัย อยุธยา ธนบุรี และรัตนโกสินทร์', prompt_en: 'Teach me about Sukhothai, Ayutthaya, Thonburi, and Rattanakosin kingdoms', prompt_sv: 'Lär mig om Sveriges historia: Vikingatiden, medeltiden och Gustav Vasa' },
      { label_th: 'ประวัติศาสตร์โลกยุคใหม่', label_en: 'Modern World History', label_sv: 'Världshistoria i modern tid', prompt_th: 'สอนเรื่องสงครามโลก การปฏิวัติอุตสาหกรรม และสงครามเย็น', prompt_en: 'Teach me about World Wars, Industrial Revolution, and Cold War', prompt_sv: 'Lär mig om världskrigen, industriella revolutionen och kalla kriget' },
      { label_th: 'อารยธรรมโลก', label_en: 'World Civilizations', label_sv: 'Världens civilisationer', prompt_th: 'สอนเรื่องอารยธรรมกรีก โรมัน อียิปต์ และจีน', prompt_en: 'Teach me about Greek, Roman, Egyptian, and Chinese civilizations', prompt_sv: 'Lär mig om grekiska, romerska, egyptiska och kinesiska civilisationer' },
      { label_th: 'ประวัติศาสตร์ไทยยุคใหม่', label_en: 'Modern Thai History', label_sv: 'Sveriges moderna historia', prompt_th: 'สอนเรื่องไทยในยุคปัจจุบัน การเปลี่ยนแปลงทางการเมืองและสังคม', prompt_en: 'Teach me about modern Thailand: political and social changes', prompt_sv: 'Lär mig om Sveriges moderna historia, demokrati och välfärdsstaten' },
    ],
  },
  {
    id: 'reading',
    slug: 'reading',
    code: 'reading',
    name_th: 'การอ่าน',
    name_en: 'Reading',
    name_sv: 'Läsning',
    icon: BookOpen,
    illustrationUrl: '/illustrations/reading_kid.png',
    color: '#10B981',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    description_th: 'พัฒนาทักษะการอ่านและความเข้าใจ',
    description_en: 'Develop reading skills and comprehension',
    description_sv: 'Utveckla läsförmåga och läsförståelse',
    minGradeIndex: 0,
    maxGradeIndex: 12,
    suggestions: [
      { label_th: 'เรื่องสั้น', label_en: 'Short Stories', label_sv: 'Noveller', prompt_th: 'เล่านิทานสั้นแล้วถามคำถามเพื่อฝึกความเข้าใจ', prompt_en: 'Tell me a short story and ask comprehension questions', prompt_sv: 'Berätta en kort historia och ställ förståelsefrågor' },
      { label_th: 'ฝึกอ่านจับใจความ', label_en: 'Comprehension', label_sv: 'Läsförståelse-träning', prompt_th: 'ให้บทความสั้นแล้วฝึกจับใจความสำคัญ', prompt_en: 'Give me a passage and help me identify the main ideas', prompt_sv: 'Ge mig en text och hjälp mig hitta huvudidéerna' },
      { label_th: 'คำศัพท์จากบทอ่าน', label_en: 'Vocabulary', label_sv: 'Ordförråd', prompt_th: 'ให้บทอ่านแล้วช่วยอธิบายคำศัพท์ยากๆ', prompt_en: 'Give me a reading with new vocabulary and explain the words', prompt_sv: 'Hjälp mig lära mig nya engelska ord med exempelmeningar' },
      { label_th: 'การสรุปความ', label_en: 'Summarizing', label_sv: 'Sammanfattning', prompt_th: 'สอนวิธีสรุปเนื้อหาจากบทอ่าน', prompt_en: 'Teach me how to summarize what I read', prompt_sv: 'Lär mig hur man sammanfattar det jag läser' },
    ],
  },
  {
    id: 'lab_tech',
    slug: 'lab_tech',
    code: 'lab_tech',
    name_th: 'เทคโนโลยีห้องปฏิบัติการ',
    name_en: 'Lab Technology',
    name_sv: 'Laboratorieteknik',
    icon: Microscope,
    illustrationUrl: '/illustrations/lab_tech_kid.png',
    color: '#6366F1',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    description_th: 'เรียนรู้เทคโนโลยีและการทดลองในห้องแลป',
    description_en: 'Learn technology and lab experiments',
    description_sv: 'Lär dig labbutrustning, säkerhet och experiment',
    minGradeIndex: 7,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'อุปกรณ์แลป', label_en: 'Lab Equipment', label_sv: 'Laboratorieutrustning', prompt_th: 'สอนเรื่องอุปกรณ์ในห้องปฏิบัติการและวิธีใช้', prompt_en: 'Teach me about laboratory equipment and how to use them', prompt_sv: 'Lär mig om laboratorieutrustning och hur den används' },
      { label_th: 'ความปลอดภัยในแลป', label_en: 'Lab Safety', label_sv: 'Labsäkerhet', prompt_th: 'สอนกฎความปลอดภัยในห้องปฏิบัติการ', prompt_en: 'Teach me about laboratory safety rules and procedures', prompt_sv: 'Lär mig säkerhetsregler och rutiner i laboratoriet' },
      { label_th: 'เทคนิคการทดลอง', label_en: 'Lab Techniques', label_sv: 'Laboratorietekniker', prompt_th: 'สอนเทคนิคการทดลองพื้นฐาน เช่น การวัด การกรอง', prompt_en: 'Teach me basic lab techniques like measuring, filtering, and titration', prompt_sv: 'Lär mig grundläggande labtekniker som mätning, filtrering och titrering' },
      { label_th: 'การเขียนรายงาน', label_en: 'Lab Reports', label_sv: 'Rapportsvar', prompt_th: 'สอนวิธีเขียนรายงานผลการทดลอง', prompt_en: 'Teach me how to write a proper lab report', prompt_sv: 'Lär mig hur man skriver en korrekt laborationsrapport' },
      { label_th: 'กล้องจุลทรรศน์', label_en: 'Microscopy', label_sv: 'Mikroskopi', prompt_th: 'สอนเรื่องกล้องจุลทรรศน์และการใช้งาน', prompt_en: 'Teach me about microscopes and how to use them', prompt_sv: 'Lär mig om mikroskop och hur man använder dem' },
    ],
  },

  // ── UNIVERSITY MEDICAL SCIENCE (SUT) ──────────────────────────────────────
  {
    id: 'med_biochem',
    slug: 'med_biochem',
    code: 'med_biochem',
    name_th: 'ชีวเคมีทางการแพทย์',
    name_en: 'Medical Biochemistry',
    name_sv: 'Medicinsk biokemi',
    icon: FlaskConical,
    illustrationUrl: '/illustrations/university/med_biochem.png',
    color: '#0EA5E9',
    bgColor: 'bg-sky-50 dark:bg-sky-950/30',
    description_th: 'ชีวโมเลกุล เมแทบอลิซึม และชีววิทยาโมเลกุล',
    description_en: 'Biomolecules, metabolism, and molecular biology',
    description_sv: 'Biomolekyler, metabolism och molekylärbiologi',
    minGradeIndex: 13, // university_1
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'โปรตีนและเอนไซม์', label_en: 'Proteins & Enzymes', label_sv: 'Proteiner & Enzymer', prompt_th: 'สอนเรื่องโครงสร้างโปรตีน กรดอะมิโน และการทำงานของเอนไซม์', prompt_en: 'Teach me about protein structure, amino acids, and enzyme kinetics', prompt_sv: 'Lär mig om proteinstruktur, aminosyror och enzymkinetik' },
      { label_th: 'กรดนิวคลิอิกและ DNA', label_en: 'Nucleic Acids & DNA', label_sv: 'Nukleinsyror & DNA', prompt_th: 'สอนเรื่อง DNA RNA การจำลองดีเอ็นเอ และการแสดงออกของยีน', prompt_en: 'Teach me about DNA, RNA, replication, and gene expression', prompt_sv: 'Lär mig om DNA, RNA, replikation och genuttryck' },
      { label_th: 'เมแทบอลิซึมของคาร์โบไฮเดรต', label_en: 'Carbohydrate Metabolism', label_sv: 'Kolhydratomsättning', prompt_th: 'สอนเรื่องไกลโคไลซิส วัฏจักรเครบส์ และการผลิต ATP', prompt_en: 'Teach me about glycolysis, Krebs cycle, and ATP production', prompt_sv: 'Lär mig om glykolys, Citronsyracykeln och ATP-produktion' },
      { label_th: 'เมแทบอลิซึมของไขมัน', label_en: 'Lipid Metabolism', label_sv: 'Fettomsättning', prompt_th: 'สอนเรื่องไขมัน กรดไขมัน และเมแทบอลิซึมของลิพิด', prompt_en: 'Teach me about lipids, fatty acids, and lipid metabolism', prompt_sv: 'Lär mig om lipider, fettsyror och lipidmetabolism' },
      { label_th: 'เทคนิคชีวโมเลกุล', label_en: 'Molecular Techniques', label_sv: 'Molekylära tekniker', prompt_th: 'สอนเทคนิค PCR, gel electrophoresis, Western blot และ ELISA', prompt_en: 'Teach me PCR, gel electrophoresis, Western blot, and ELISA techniques', prompt_sv: 'Lär mig PCR, gelelektrofores, Western blot och ELISA' },
      { label_th: 'ชีวเคมีคลินิก', label_en: 'Clinical Biochemistry', label_sv: 'Klinisk biokemi', prompt_th: 'สอนเรื่องการตรวจทางชีวเคมีคลินิก ค่าปกติ และการแปลผล', prompt_en: 'Teach me clinical biochemistry tests, normal values, and interpretation', prompt_sv: 'Lär mig kliniska biokemitester, normalvärden och tolkning' },
    ],
  },
  {
    id: 'microbiology',
    slug: 'microbiology',
    code: 'microbiology',
    name_th: 'จุลชีววิทยาและปรสิตวิทยา',
    name_en: 'Microbiology & Parasitology',
    name_sv: 'Mikrobiologi & Parasitologi',
    icon: Bug,
    illustrationUrl: '/illustrations/university/microbiology.png',
    color: '#16A34A',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    description_th: 'แบคทีเรีย ไวรัส เชื้อรา และปรสิตทางการแพทย์',
    description_en: 'Bacteria, viruses, fungi, and medical parasites',
    description_sv: 'Bakterier, virus, svampar och medicinska parasiter',
    minGradeIndex: 13,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'แบคทีเรียวิทยา', label_en: 'Bacteriology', label_sv: 'Bakteriologi', prompt_th: 'สอนเรื่องโครงสร้างแบคทีเรีย การย้อมสี Gram และชนิดสำคัญทางคลินิก', prompt_en: 'Teach me bacterial structure, Gram staining, and clinically important species', prompt_sv: 'Lär mig bakteriestruktur, Gramfärgning och kliniskt viktiga arter' },
      { label_th: 'ไวรัสวิทยา', label_en: 'Virology', label_sv: 'Virologi', prompt_th: 'สอนเรื่องโครงสร้างไวรัส วงจรการจำลอง และไวรัสสำคัญทางการแพทย์', prompt_en: 'Teach me virus structure, replication cycle, and medically important viruses', prompt_sv: 'Lär mig virusstruktur, replikationscykel och medicinskt viktiga virus' },
      { label_th: 'เชื้อราวิทยา', label_en: 'Mycology', label_sv: 'Mykologi', prompt_th: 'สอนเรื่องเชื้อราทางการแพทย์ การวินิจฉัย และการรักษา', prompt_en: 'Teach me about medical fungi, diagnosis, and treatment', prompt_sv: 'Lär mig om medicinskt viktiga svampar, diagnos och behandling' },
      { label_th: 'ปรสิตวิทยา', label_en: 'Parasitology', label_sv: 'Parasitologi', prompt_th: 'สอนเรื่องโปรโตซัว หนอนพยาธิ และแมลงทางการแพทย์', prompt_en: 'Teach me about protozoa, helminths, and medical arthropods', prompt_sv: 'Lär mig om urdjur, inälvsmaskar och medicinska leddjur' },
      { label_th: 'เทคนิคจุลชีววิทยา', label_en: 'Microbiology Techniques', label_sv: 'Mikrobiologiska tekniker', prompt_th: 'สอนเทคนิคการเพาะเชื้อ การทดสอบความไวยา และการจำแนกเชื้อ', prompt_en: 'Teach me culture techniques, antibiotic sensitivity testing, and identification methods', prompt_sv: 'Lär mig odlingstekniker, resistensbestämning och artbestämning' },
      { label_th: 'จุลชีววิทยาคลินิก', label_en: 'Clinical Microbiology', label_sv: 'Klinisk mikrobiologi', prompt_th: 'สอนเรื่องการตรวจทางจุลชีววิทยาในโรงพยาบาล วัสดุส่งตรวจ และการแปลผล', prompt_en: 'Teach me clinical microbiology testing, specimen collection, and result interpretation', prompt_sv: 'Lär mig om klinisk mikrobiologisk provtagning och tolkning' },
    ],
  },
  {
    id: 'immunology',
    slug: 'immunology',
    code: 'immunology',
    name_th: 'ภูมิคุ้มกันวิทยาและโลหิตวิทยา',
    name_en: 'Immunology & Hematology',
    name_sv: 'Immunologi & Hematologi',
    icon: Shield,
    illustrationUrl: '/illustrations/university/immunology.png',
    color: '#7C3AED',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    description_th: 'ระบบภูมิคุ้มกันและวิทยาการเลือด',
    description_en: 'Immune system and blood science',
    description_sv: 'Immunsystemet och blodvetenskap',
    minGradeIndex: 13,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ภูมิคุ้มกันโดยกำเนิด', label_en: 'Innate Immunity', label_sv: 'Medfött immunförsvar', prompt_th: 'สอนเรื่องระบบภูมิคุ้มกันโดยกำเนิด เซลล์ป้องกัน และการอักเสบ', prompt_en: 'Teach me about innate immunity, defense cells, and inflammation', prompt_sv: 'Lär mig om det medfödda immunförsvaret, försvarsceller och inflammation' },
      { label_th: 'ภูมิคุ้มกันแบบปรับตัว', label_en: 'Adaptive Immunity', label_sv: 'Adaptivt immunförsvar', prompt_th: 'สอนเรื่องลิมโฟไซต์ T-cell B-cell และการสร้างแอนติบอดี', prompt_en: 'Teach me about lymphocytes, T-cells, B-cells, and antibody production', prompt_sv: 'Lär mig om lymfocyter, T-celler, B-celler och antikroppar' },
      { label_th: 'เซรุ่มวิทยา', label_en: 'Serology', label_sv: 'Serologi', prompt_th: 'สอนเทคนิคการตรวจเซรุ่มวิทยา เช่น ELISA, Western blot และ agglutination', prompt_en: 'Teach me serological techniques: ELISA, Western blot, and agglutination tests', prompt_sv: 'Lär mig serologiska tekniker: ELISA, Western blot och agglutination' },
      { label_th: 'โลหิตวิทยาพื้นฐาน', label_en: 'Basic Hematology', label_sv: 'Grundläggande hematologi', prompt_th: 'สอนเรื่องเซลล์เม็ดเลือด การนับเซลล์ (CBC) และการตรวจเลือดปกติ', prompt_en: 'Teach me blood cells, complete blood count (CBC), and normal blood values', prompt_sv: 'Lär mig om blodceller, blodstatus (CBC) och normalvärden' },
      { label_th: 'โรคเลือด', label_en: 'Blood Disorders', label_sv: 'Blodsjukdomar', prompt_th: 'สอนเรื่องโรคโลหิตจาง ธาลัสซีเมีย และโรคเม็ดเลือดขาวผิดปกติ', prompt_en: 'Teach me about anemia, thalassemia, and leukemia', prompt_sv: 'Lär mig om anemi, talassemi och leukemi' },
      { label_th: 'วัคซีนและภูมิคุ้มกันบำบัด', label_en: 'Vaccines & Immunotherapy', label_sv: 'Vacciner & Immunoterapi', prompt_th: 'สอนเรื่องหลักการวัคซีน ภูมิคุ้มกันบำบัดมะเร็ง และโรคภูมิแพ้', prompt_en: 'Teach me vaccine principles, cancer immunotherapy, and allergic diseases', prompt_sv: 'Lär mig om vaccinprinciper, immunterapi vid cancer och allergier' },
    ],
  },
  {
    id: 'research_methods',
    slug: 'research_methods',
    code: 'research_methods',
    name_th: 'ระเบียบวิธีวิจัยและชีวสารสนเทศ',
    name_en: 'Research Methods & Bioinformatics',
    name_sv: 'Forskningsmetodik & Bioinformatik',
    icon: Brain,
    illustrationUrl: '/illustrations/university/research_methods.png',
    color: '#DB2777',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    description_th: 'การวิจัยทางวิทยาศาสตร์ สถิติ และชีวสารสนเทศ',
    description_en: 'Scientific research, statistics, and bioinformatics',
    description_sv: 'Vetenskaplig forskning, statistik och bioinformatik',
    minGradeIndex: 13,
    maxGradeIndex: 17,
    suggestions: [
      { label_th: 'ระเบียบวิธีวิจัย', label_en: 'Research Methodology', label_sv: 'Forskningsmetodik', prompt_th: 'สอนเรื่องการออกแบบการวิจัย สมมติฐาน และตัวแปร', prompt_en: 'Teach me about research design, hypotheses, and variables', prompt_sv: 'Lär mig om forskningsdesign, hypoteser och variabler' },
      { label_th: 'สถิติสำหรับการวิจัย', label_en: 'Research Statistics', label_sv: 'Forskningsstatistik', prompt_th: 'สอนเรื่องสถิติพื้นฐาน t-test, ANOVA และ chi-square สำหรับงานวิจัย', prompt_en: 'Teach me basic statistics: t-test, ANOVA, and chi-square for research', prompt_sv: 'Lär mig grundläggande statistik: t-test, ANOVA och chi-två-test' },
      { label_th: 'การเขียนบทความวิชาการ', label_en: 'Scientific Writing', label_sv: 'Vetenskapligt skrivande', prompt_th: 'สอนวิธีเขียนบทความวิชาการ รายงานวิจัย และการอ้างอิง', prompt_en: 'Teach me how to write scientific papers, research reports, and citations', prompt_sv: 'Lär mig hur man skriver vetenskapliga artiklar och referenser' },
      { label_th: 'ชีวสารสนเทศเบื้องต้น', label_en: 'Basic Bioinformatics', label_sv: 'Grundläggande bioinformatik', prompt_th: 'สอนเรื่องฐานข้อมูลชีววิทยา (NCBI, BLAST) และการวิเคราะห์ลำดับ DNA', prompt_en: 'Teach me bioinformatics databases (NCBI, BLAST) and DNA sequence analysis', prompt_sv: 'Lär mig om bioinformatikdatabaser (NCBI, BLAST) och DNA-analys' },
      { label_th: 'จริยธรรมการวิจัย', label_en: 'Research Ethics', label_sv: 'Forskningsetik', prompt_th: 'สอนเรื่องจริยธรรมในการวิจัย ความปลอดภัยทางชีวภาพ และ IRB', prompt_en: 'Teach me research ethics, biosafety regulations, and IRB requirements', prompt_sv: 'Lär mig om forskningsetik, biosäkerhet och etiska tillstånd' },
      { label_th: 'การทบทวนวรรณกรรม', label_en: 'Literature Review', label_sv: 'Litteraturöversikt', prompt_th: 'สอนวิธีค้นหาบทความวิชาการ ทบทวนวรรณกรรม และวิเคราะห์งานวิจัย', prompt_en: 'Teach me how to search scientific literature, write literature reviews, and critically analyze research', prompt_sv: 'Lär mig söka vetenskaplig litteratur och skriva litteraturöversikter' },
    ],
  },
  {
    id: 'computer_science',
    slug: 'computer_science',
    code: 'computer_science',
    name_th: 'วิทยาการคอมพิวเตอร์ (Scratch)',
    name_en: 'Computer Science (Scratch)',
    name_sv: 'Datalogi (Scratch)',
    icon: Monitor,
    illustrationUrl: '/illustrations/cs_scratch.png',
    color: '#F97316',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    description_th: 'เรียนเขียนโปรแกรมด้วย Scratch — สร้างเกม แอนิเมชัน และโปรเจกต์สนุกๆ บน Windows และ Mac',
    description_en: 'Learn programming with Scratch — build games, animations, and fun projects on Windows and Mac',
    description_sv: 'Lär dig programmera med Scratch — skapa spel, animationer och roliga projekt på Windows och Mac',
    minGradeIndex: 0,   // open to all students
    maxGradeIndex: 99,
    suggestions: [
      { label_th: 'เริ่มต้นกับ Scratch', label_en: 'Getting Started with Scratch', label_sv: 'Kom igång med Scratch', prompt_th: 'สอนฉันเรื่องพื้นฐาน Scratch — Stage, Sprite, และบล็อกคำสั่งคืออะไร?', prompt_en: 'Teach me the basics of Scratch — what are Stage, Sprites, and code blocks?', prompt_sv: 'Lär mig grunderna i Scratch — vad är scen, sprajtar och kodblock?' },
      { label_th: 'Loops และ Events', label_en: 'Loops & Events', label_sv: 'Loopar & Händelser', prompt_th: 'สอนเรื่อง when green flag clicked, loops (repeat/forever) และการใช้ events ใน Scratch', prompt_en: 'Teach me about when green flag clicked, loops (repeat/forever), and events in Scratch', prompt_sv: 'Lär mig om när grön flagga klickas på, loopar (repetera/för alltid) och händelser' },
      { label_th: 'ตัวแปรและเงื่อนไข', label_en: 'Variables & Conditions', label_sv: 'Variabler & Villkor', prompt_th: 'สอนเรื่องการสร้างตัวแปร (variables) และการใช้ if/else ใน Scratch', prompt_en: 'Teach me how to create variables and use if/else conditions in Scratch', prompt_sv: 'Lär mig hur man skapar variabler och använder om/annars-villkor i Scratch' },
      { label_th: 'สร้างเกมใน Scratch', label_en: 'Build a Game in Scratch', label_sv: 'Bygg ett spel i Scratch', prompt_th: 'ช่วยฉันสร้างเกมง่ายๆ ใน Scratch ทีละขั้นตอน', prompt_en: 'Help me build a simple game in Scratch step by step', prompt_sv: 'Hjälp mig bygga ett enkelt spel i Scratch steg för steg' },
      { label_th: 'แอนิเมชันและเสียง', label_en: 'Animation & Sound', label_sv: 'Animation & Ljud', prompt_th: 'สอนวิธีทำ Sprite ให้เคลื่อนไหว เปลี่ยน costume และเพิ่มเสียงใน Scratch', prompt_en: 'Teach me how to animate sprites, switch costumes, and add sounds in Scratch', prompt_sv: 'Lär mig hur man animerar sprajtar, byter klädsel och lägger till ljud i Scratch' },
      { label_th: 'Debug โปรแกรม', label_en: 'Debugging Programs', label_sv: 'Felsök koden', prompt_th: 'สอนวิธีหาข้อผิดพลาด (bug) และแก้ไขโค้ดใน Scratch', prompt_en: 'Teach me how to find bugs and fix code problems in Scratch', prompt_sv: 'Lär mig hur man hittar och åtgärdar fel i Scratch' },
    ],
  },
];

export function isFlorence(
  student?: string | { name_english?: string | null; nickname_english?: string | null; name_thai?: string | null; nickname_thai?: string | null } | null
): boolean {
  if (!student) return false;
  if (typeof student === 'string') {
    return student.toLowerCase().includes('florence');
  }
  const names = [student.name_english, student.nickname_english, student.name_thai, student.nickname_thai];
  return names.some(n => n && n.toLowerCase().includes('florence'));
}

export function getSubjectBySlug(slug: string): SubjectInfo | undefined {
  return subjects?.find?.((s: SubjectInfo) => s?.slug === slug);
}

export function getSubjectsForGrade(
  grade: string,
  student?: string | { name_english?: string | null; nickname_english?: string | null; name_thai?: string | null; nickname_thai?: string | null } | null
): SubjectInfo[] {
  const gradeIdx = getGradeIndex(grade);
  let filtered = subjects.filter(s => gradeIdx >= s.minGradeIndex && gradeIdx <= s.maxGradeIndex);

  if (isFlorence(student)) {
    const swedishKlass1Subjects = ['swedish', 'math', 'science', 'social', 'english', 'reading', 'history'];
    filtered = filtered.filter(s => swedishKlass1Subjects.includes(s.id));
  }

  return filtered;
}
