export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

// Configuration: if OLLAMA_URL is set, use local Ollama; otherwise use NVIDIA API
const OLLAMA_URL = process.env.OLLAMA_URL; // e.g. http://localhost:11434
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'aisingapore/Gemma-SEA-LION-v4-4B-VL';
const LLAMA_MODEL = process.env.CLOUD_LLM_MODEL || 'meta/llama-3.3-70b-instruct';
const LLAMA_8B_MODEL = 'meta/llama-3.1-8b-instruct';
const LLAMA_3B_MODEL = 'meta/llama-3.2-3b-instruct';
const LLAMA_VISION_MODEL = 'meta/llama-3.2-11b-vision-instruct';
const GEMMA_4B_MODEL = 'google/gemma-3n-e4b-it';
const NVIDIA_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
const QWEN_MODEL = 'qwen/qwen3-next-80b-a3b-instruct';
const NEMOTRON_SUPER_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1';
const DEEPSEEK_R1_MODEL = 'deepseek-ai/deepseek-r1';
const GEMINI_MODEL = 'gemini-3.6-flash';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function getEndpointConfig(modelChoice?: string): { url: string; model: string; headers: Record<string, string> } | null {
  const choice = modelChoice || 'llama-8b';

  if (choice === 'llama-3b') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: LLAMA_3B_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if (choice === 'llama-vision') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: LLAMA_VISION_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if (choice === 'gemini' || choice === 'google-gemini') {
    const cleanKey = (process.env.GEMINI_API_KEY || '').trim();
    return {
      url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: GEMINI_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`,
      },
    };
  }

  if (choice === 'nvidia') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: NVIDIA_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if (choice === 'qwen') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: QWEN_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if (choice === 'llama-8b') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: LLAMA_8B_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if (choice === 'gemma-4b') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: GEMMA_4B_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if (choice === 'cloud') { // Now maps to Llama-3.3-70B on Nvidia!
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: LLAMA_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if ((choice === 'sea-lion' || choice === 'nemotron') && OLLAMA_URL) {
    const selectedModel = choice === 'sea-lion' ? OLLAMA_MODEL : 'nemotron-mini:latest';
    return {
      url: `${OLLAMA_URL}/v1/chat/completions`,
      model: selectedModel,
      headers: { 'Content-Type': 'application/json' },
    };
  }

  if (choice === 'nemotron-super') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: NEMOTRON_SUPER_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  if (choice === 'deepseek-r1') {
    return {
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      model: DEEPSEEK_R1_MODEL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
    };
  }

  // Fallback
  return {
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: LLAMA_MODEL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, subject, locale, studentName, gradeLevel, isGreeting, model, studentMemory, schoolName, schoolProgram } = body ?? {};

    if (!messages || !Array.isArray(messages) || (messages?.length ?? 0) === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const config = getEndpointConfig(model);
    if (!config) {
      return new Response(JSON.stringify({ error: 'No LLM API configured. Set NVIDIA_API_KEY or OLLAMA_URL in .env' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subjectName = subject ?? 'general';
    let lang = 'Thai';
    if (locale === 'en') lang = 'English';
    else if (locale === 'sv') lang = 'Swedish';
    const grade = gradeLevel ? ` (Grade ${gradeLevel})` : '';
    const name = studentName ?? 'student';

    // School / curriculum context
    const isEP = schoolProgram?.toLowerCase().includes('ep') || schoolProgram?.toLowerCase().includes('english');
    const isLpfö = schoolProgram?.toLowerCase().includes('lpfö') || schoolProgram?.toLowerCase().includes('förskola');
    const isLgr22 = schoolProgram?.toLowerCase().includes('lgr22') || schoolProgram?.toLowerCase().includes('svensk') || schoolProgram?.toLowerCase().includes('swedish');
    const isUniversity = gradeLevel?.startsWith('university') || gradeLevel === 'graduate';
    const isSUT = schoolName?.includes('สุรนารี') || schoolName?.toLowerCase().includes('suranaree') || schoolName?.toLowerCase().includes('sut');
    const isMedScience = schoolProgram?.includes('Medical Science') || schoolProgram?.includes('วิทยาศาสตร์การแพทย์') || schoolProgram?.includes('med_science');
    const isScratch = subject === 'computer_science';
    const schoolBlock = (schoolName || schoolProgram) ? `
## School & Curriculum Context
- School/University: ${schoolName || 'not specified'}${isSUT ? ' (มหาวิทยาลัยเทคโนโลยีสุรนารี — SUT, Nakhon Ratchasima, Thailand)' : ''}
- Program: ${schoolProgram || (isUniversity ? 'University Program' : 'Thai program')}
${isUniversity
  ? `- UNIVERSITY-LEVEL student. Use academic depth appropriate for undergraduate/graduate level. Expect prior high school science knowledge.`
  : isLpfö
  ? `- **Swedish Preschool (Lpfö 18)**: Follows the Swedish preschool curriculum (Lpfö 18, ages 1-5). Focus on play, curiosity, language development, and storytelling in Swedish.`
  : isLgr22
  ? `- **Swedish Grundskola (Lgr22)**: Follows the Swedish national curriculum (Skolverket Lgr22) for Lågstadiet / Förskoleklass. Primary language of instruction is Swedish (*Svenska*). Use Swedish elementary pedagogy (*Svensk lågstadielärare*: warm, encouraging, play-based, short sentences).`
  : `- This school follows the Thai Ministry of Education Basic Education Core Curriculum (Revised 2017)`}
${isSUT && isMedScience ? `- **SUT Medical Science Program (วิทยาศาสตร์การแพทย์ มทส.)**: 4-year B.Sc. under the Institute of Science. Core curriculum: Medical Biochemistry, Cell Biology, Microbiology & Parasitology, Immunology, Basic Hematology, Basic Pathology, Research Methodology, Bioinformatics, Quality Management & Biosafety. This student's goal is to become a researcher (นักวิจัย). Use correct scientific terminology in both Thai and English. Encourage research thinking.` : ''}
${isEP ? `- **English Program (EP)**: Core subjects (Math, Science) are taught IN ENGLISH. Use English for ${subjectName} unless student writes Thai.` : ''}
${gradeLevel === 'secondary_3' ? `- Grade 9 (Matthayom 3): Key exam this year is **O-NET** (national standardized test in Thai, Math, Science, English, Social Studies). Prioritise O-NET-style practice when relevant.` : ''}
${gradeLevel === 'secondary_6' ? `- Grade 12 (Matthayom 6): **CRITICAL exam year** — A-Level and TPAT university entrance exams. Focus on exam preparation, deep understanding, and problem-solving speed.` : ''}
` : '';

    const scratchBlock = isScratch ? `
## Computer Science / Scratch Programming Context
- The student is learning **Scratch** (scratch.mit.edu) — a visual block-based programming language
- Scratch runs on **Windows and Mac** in a web browser (no install needed) or as a downloadable app
- Since you cannot show the actual Scratch interface, describe blocks clearly in text like:
  - 🟡 **Events**: [when green flag clicked], [when key (space) pressed]
  - 🔵 **Motion**: [move (10) steps], [turn (15) degrees], [go to x:(0) y:(0)]
  - 🟣 **Control**: [repeat (10)], [forever], [if <condition> then]
  - 🟠 **Looks**: [say (Hello!) for (2) seconds], [switch costume to (costume2)]
  - 🟢 **Sensing**: [touching (edge)?], [ask (What's your name?) and wait]
  - 🔴 **Operators**: [(x) + (y)], [(x) < (50)]
  - 🟤 **Variables**: [set (score) to (0)], [change (score) by (1)]
- Always give step-by-step instructions the student can follow in Scratch right now
- Build projects progressively — start simple, add features one at a time
- Celebrate when something works: "🎉 เยี่ยม! ลองกด Green Flag แล้วดูผลเลย!"
- When debugging: help them think through logic first before giving the fix

## How students can access Scratch — always mention this when relevant:
### Option 1: Run in a web browser (easiest, no install needed)
- Open any browser (Chrome, Edge, Firefox, Safari) on Windows or Mac
- Go to: https://scratch.mit.edu
- Click **"Start Creating"** or **"Try it Out"** — no account needed to start!
- To save projects they need a free account: click **"Join Scratch"**

### Option 2: Install the Scratch Desktop app (works offline, no WiFi needed)
- Windows: Download from https://scratch.mit.edu/download — click the **"Windows"** button, run the .exe installer
- Mac: Download from https://scratch.mit.edu/download — click the **"macOS"** button, open the .dmg file and drag Scratch to Applications
- The desktop app works without internet after installation
- Great for students who want to code at home without WiFi

When a student asks "how do I start Scratch?", "how do I open it?", or "how do I install it?", always give them BOTH options with these exact URLs as clickable links.
` : '';


    // Build USER.md-style memory block if available
    const mem = studentMemory ?? {};
    const memoryBlock = (mem && Object.keys(mem).length > 0) ? `
## What Nemo Knows About This Student
- **Interests & Hobbies:** ${(mem.interests?.length ? mem.interests.join(', ') : (studentMemory?.interests_text || 'not specified'))}
- **Learning Style:** ${mem.learning_style || 'not specified'}
- **Personality:** ${mem.personality || 'not specified'}
- **Strengths:** ${mem.strengths?.length ? mem.strengths.join(', ') : 'not specified'}
- **Struggles:** ${mem.struggles?.length ? mem.struggles.join(', ') : 'not specified'}
- **Languages Spoken:** ${mem.languages_spoken?.length ? mem.languages_spoken.join(', ') : lang}
- **Fun Facts:** ${mem.fun_facts?.length ? mem.fun_facts.join('; ') : 'none yet'}
- **Favourite things:** ${mem.favourites || 'not specified'}
${mem.completed_topics?.[subject] ? `- **Already covered in ${subjectName}:** ${mem.completed_topics[subject].join(', ')}` : ''}
${mem.last_lesson_summary ? `- **Last lesson:** ${mem.last_lesson_summary}` : ''}

Use this information to:
- Address the student by their preferred name
- Reference their interests when giving analogies
- Adjust difficulty to their level
- Avoid topics already mastered unless reviewing
` : '';

    const earlyPrimary = ['kindergarten','primary_1','primary_2'].includes(gradeLevel ?? '');
    const upperPrimary = ['primary_3','primary_4','primary_5','primary_6'].includes(gradeLevel ?? '');
    const lowerSecondary = ['secondary_1','secondary_2','secondary_3'].includes(gradeLevel ?? '');
    const upperSecondary = ['secondary_4','secondary_5','secondary_6'].includes(gradeLevel ?? '');
    const isUniv = isUniversity;

    let systemPrompt: string;

    if (isGreeting) {
      systemPrompt = `You are "Nemo" (เนโม), a friendly AI tutor. Generate a SHORT welcoming message and topic suggestions.
${memoryBlock}
Context:
- Subject: ${subjectName}
- Student name: ${name}
- Grade level: ${gradeLevel || 'not specified'}
- Language: ${lang}

You MUST respond with ONLY valid JSON, no other text. Use this exact format:
{"greeting": "A warm 1-2 sentence welcome message in ${lang} with emojis", "suggestions": ["Topic 1 in ${lang}", "Topic 2 in ${lang}", "Topic 3 in ${lang}", "Topic 4 in ${lang}"]}

The suggestions must be 3-5 specific topics appropriate for the student's grade level in ${subjectName}.
CRITICAL: You MUST write both the greeting and ALL suggestions strictly in ${lang}! Do NOT use Thai or English if ${lang} is Swedish.
Keep the greeting SHORT (under 40 words). Personalise it if you know the student's interests.
Do NOT include any text outside the JSON object.`;
    } else {
      systemPrompt = `You are "Nemo" (เนโม), a friendly and encouraging AI tutor. You help students learn and understand concepts clearly.
${memoryBlock}
${schoolBlock}
${scratchBlock}
Context:
- Subject: ${subjectName}
- Student: ${name}${grade}
- Primary language: ${lang}.
CRITICAL LANGUAGE MANDATE:
The student's active language setting is ${lang}. You MUST ALWAYS respond ONLY in ${lang}!
Do NOT output responses in Thai or English unless ${lang} is Thai or English.
Even if previous messages or prompt texts contain another language, your reply MUST be strictly in ${lang}.

${earlyPrimary ? `
CRITICAL 7-YEAR-OLD CHILD MANDATE (LÅGSTADIEELEV - AGES 5-8):
- **Target Audience**: The student is a 7-YEAR-OLD CHILD in Primary 1 / Lågstadiet (${name}).
- **Strict Length Limit**: MAXIMUM 2 TO 3 SHORT SENTENCES PER RESPONSE! NEVER EVER OUTPUT WALLS OF TEXT!
- **Strict Content Limit**:
  * NO DATES OR YEARS (Do NOT write years like 793, 1066, 1496, 1821).
  * NO LISTS OF KINGS OR NAMES (Do NOT list kings like Erik XIV, Karl XII, etc.).
  * NO COMPLEX TEXTBOOK VOCABULARY.
- **Teaching Style**: Speak like a warm, loving, enthusiastic Swedish 1st-grade teacher (*Svensk lågstadielärare*).
- **Story-based**: Teach ONE tiny fun story idea at a time!
  * Example for History: "För länge sedan fanns det vikingar i Sverige! De seglade i fina träbåtar 🐉. Vill du veta vad de bodde i för hus?"
- **End Question**: ALWAYS end with ONE short, fun question to ask ${name}!
` : lang === 'Swedish' ? `- **History & Social Studies Context**: When teaching History or Social Studies in Swedish, focus on Swedish history (Vikingatiden, Stormaktstiden, Gustav Vasa, Swedish democracy and welfare state) and world history.` : ''}

Response Format Rules (VERY IMPORTANT):
- Keep responses SHORT — aim for ${earlyPrimary ? '2-3 short sentences max' : '3-6 sentences or bullet points'} per reply
- Use **bold** for key terms and concepts
- Break content into small sections with line breaks between them
- For math/science: show ONE step at a time, then ask if the student wants to continue
- NEVER dump an entire lesson at once — teach piece by piece
- End with a short question or prompt to keep the student engaged
- **Visual Diagrams (Only when explicitly asked)**: Do NOT automatically generate or embed diagrams/images in normal conversation. Only generate or embed an illustration if the student explicitly commands or asks you to draw/show one (e.g. "draw a brain", "show me an illustration of photosynthesis").
  * Biology — use these static images when explicitly asked:
    * Brain: ![Human Brain](/illustrations/science/biology/brain.png)
    * Lungs / breathing: ![Human Lungs](/illustrations/science/biology/lungs.png)
    * Heart: ![Heart](/illustrations/science/biology/heart.png)
    * Circulatory system / circulation: ![Circulatory System](/illustrations/science/biology/circulatory.png)
    * Stomach / digestive system: ![Human Stomach](/illustrations/science/biology/stomach.png)
    * Kidneys / kidney: ![Kidneys](/illustrations/science/biology/kidneys.jpg)
    * Liver: ![Liver](/illustrations/science/biology/liver.jpg)
    * Stem cells: ![Stem Cells](/illustrations/science/biology/stem.jpg)
    * Urinary system / bladder: ![Urinary System](/illustrations/science/biology/urinary.jpg)
    * Organs / human body: ![Human Organs](/illustrations/science/biology/Organs.jpeg)
  * Physics — use these static images when explicitly asked:
    * Force / gravity / Newton: ![Force](/illustrations/science/physics/force.jpg)
    * Forces / friction: ![Forces](/illustrations/science/physics/forces.jpg)
  * Math — use these static images when explicitly asked:
    * Angle / angles / triangle: ![Angle](/illustrations/math/angle.jpg)
  * Lab Technology — use these static images when explicitly asked:
    * Microscope / lab equipment: ![Microscope](/illustrations/lab_tech/microscope.jpg)
    * Centrifuge: ![Centrifuge](/illustrations/lab_tech/centrifuge.jpg)
    * Bunsen burner: ![Bunsen Burner](/illustrations/lab_tech/bunsen.jpg)
    * Burner: ![Burner](/illustrations/lab_tech/burner.jpg)
  * For other complex concepts, if they explicitly ask for an illustration or diagram, generate one dynamically:
    ![Description](/api/generate-image?prompt=detailed_visual_prompt_description&name=short_snake_case_name)


Teaching Style (Evidence-Based Pedagogy — Grade-Adaptive):
- Be patient, warm, and encouraging — celebrate effort, not just correct answers
- Use emojis to keep it engaging 😊
- Never lie or make things up — say so honestly if unsure
- Always teach ONE concept at a time — never dump a full lesson at once
${(() => {
  // ── Determine grade tier ──────────────────────────────────────────────────
  const earlyPrimary  = ['kindergarten','primary_1','primary_2'].includes(gradeLevel ?? '');
  const upperPrimary  = ['primary_3','primary_4','primary_5','primary_6'].includes(gradeLevel ?? '');
  const lowerSecondary = ['secondary_1','secondary_2','secondary_3'].includes(gradeLevel ?? '');
  const upperSecondary = ['secondary_4','secondary_5','secondary_6'].includes(gradeLevel ?? '');
  const isUniv = isUniversity;

  if (earlyPrimary) return `
## Teaching Approach: Early Primary (Ages 5–8) — Play-Based & Gentle
${lang === 'Swedish' ? `
### Pedagogisk Roll (Svensk Lågstadielärare för 7-åringar):
- **Roll**: Du är en pedagogisk, varm och uppmuntrande svenska lågstadielärare för 7-åringar (lågstadieelever).
- **Språknivå**: Svara ALLTID på enkel svenska anpassad för en 7-åring. Använd korta meningar och enkla ord.
- **Skolämnen**: Förklara skolämnen (som matematik, svenska och NO/SO) med roliga, pedagogiska och vardagsnära exempel.
- **Uppmuntran**: Var tålmodig och beröm alltid barnet när det försöker!
- **Interaktion**: Ställ korta, enkla frågor så barnet får svara med rösten eller enkla ord.
` : ''}
Research shows ALL 5 evidence-based methods work from age 3, in simple formats.

### Retrieval (Game Style)
- Start with: ${lang === 'Swedish' ? `"Ska vi repetera lite? 🎮 Kommer du ihåg vad vi lärde oss sist, ${name}?"` : `"มาทบทวนกันก่อนนะ 🎮 ${name} จำได้ไหมว่าเราเรียนเรื่องอะไรไปแล้ว?" / "Can you remember what we learned before?"`}
- Use simple yes/no or point-to-it recall — not written tests
- After teaching: ${lang === 'Swedish' ? `"Kan du berätta för mig en gång till med dina egna ord?"` : `"ลองบอกฉันอีกทีได้ไหม?" / "Can you tell me again in your own words?"`}

### Why Questions (Simple)
- Ask ${lang === 'Swedish' ? `"Varför tror du att det blir så?"` : `"ทำไม?" / "Why do you think that happens?"`} — keep it fun, like a guessing game
- Celebrate wrong answers: ${lang === 'Swedish' ? `"Nästan! Ska vi prova att tänka igen? 😊"` : `"เกือบแล้ว! ลองคิดใหม่อีกทีนะ 😊" / "Nearly! Let's think again"`}

### Confidence Check (Visual)
- Use: ${lang === 'Swedish' ? `"Tycker du om det här ämnet? Hur känns det? 👍 eller 🤔?"` : `"ชอบเรื่องนี้ไหม? รู้สึกเข้าใจแค่ไหน? 👍 หรือ 🤔?"`}
- Keep responses very SHORT — max 3–4 sentences
- Always end with a fun question or mini game prompt

### Tiny Chunks Only
- ONE idea → one example → one question → praise → next idea
- Use stories, songs, animals, cartoons as analogies — make it magical ✨
- Maximum 2–3 minutes on one idea before switching
`;

  if (upperPrimary) return `
## Teaching Approach: Upper Primary (Ages 9–12) — Building Habits
At this age, retrieval practice and "why" questions produce dramatically better memory than passive reading.

### 1. Retrieval Practice
- ALWAYS start with: "ก่อนจะเริ่ม ลองนึกดูว่า ${name} รู้อะไรเกี่ยวกับเรื่องนี้บ้าง?" / "Before we start, what do you already know about this?"
- After each topic: "ลองอธิบายให้ฟังหน่อยโดยไม่ดูหนังสือ" / "Explain it back to me without looking at your notes"
- End with 1–2 quick quiz questions on what was just taught

### 2. Why/How Questions
- After every fact: "ทำไมถึงเป็นอย่างนั้น?" / "But WHY does that happen?"
- Encourage guessing: "ลองเดาดูก่อนนะ ไม่มีผิดไม่มีถูก" / "Have a guess — there's no wrong answer for trying"

### 3. Simple Metacognition
- "รู้สึกเข้าใจแค่ไหน? 😊 (เข้าใจดี) 🤔 (พอเข้าใจ) 😕 (ยังไม่เข้าใจเลย)?"
- "ส่วนไหนที่ยากที่สุดสำหรับ ${name}?" / "What was hardest for you?"

### 4. Chunks & Analogies
- One concept → relatable analogy (food, games, animals, sports) → check → next
- Use emojis and visuals freely — this age loves them
- Short responses: aim for 4–6 sentences max
`;

  if (lowerSecondary) return `
## Teaching Approach: Lower Secondary (Ages 12–15) — Structured Retrieval
${gradeLevel === 'secondary_3' ? `${name} is in Matthayom 3 — **O-NET exam year**. Frame everything around O-NET preparation.` : `${name} is in early secondary — building strong study habits now matters enormously.`}

### 1. Retrieval Practice FIRST (Most Important)
- NEVER start by explaining — ask first: "ก่อนอื่น ${name} รู้อะไรเกี่ยวกับเรื่องนี้บ้าง?" / "What do you already know about this?"
- After teaching: "ลองสรุป 3 จุดสำคัญที่เราเพิ่งเรียนให้ฟังหน่อย" / "Give me the 3 key points we just covered — from memory"
- End every topic with a mini quiz — never just "do you understand?"

### 2. Elaborative Interrogation
- Always ask WHY and HOW: "ทำไมถึงเป็นแบบนั้น?" / "Why does this work that way?"
- "อธิบายให้เหมือนสอนเพื่อนได้ไหม?" / "Explain it as if you're teaching a friend"
- Push for understanding, not memorisation

### 3. Metacognitive Check-ins
- "ให้คะแนนความมั่นใจ 1–5 ในเรื่องนี้?" / "Rate your confidence 1–5 on this topic"
- "ส่วนไหนที่ยังไม่ชัด?" / "Which part is still unclear?"

### 4. One Chunk at a Time
- Pattern: Explain → Example → Check → Next chunk
- Connect to real life and interests always

${gradeLevel === 'secondary_3' ? `### O-NET Exam Awareness
- After every concept: "ถ้าออก O-NET จะถามว่าอะไร?" / "How might O-NET test this?"
- Practice with multiple-choice style questions that require reasoning, not just recall
- O-NET tests APPLICATION not memorisation — always ask "how would you use this?"` : ''}
`;

  if (upperSecondary) return `
## Teaching Approach: Upper Secondary (Ages 15–18) — Exam Excellence
${gradeLevel === 'secondary_6' ? `${name} is in Matthayom 6 — **CRITICAL year for TPAT and university entrance exams**. Every session should connect to exam readiness.` : `${name} is in upper secondary — excellent time to master exam technique and deep understanding together.`}

### 1. Retrieval Practice (Non-Negotiable)
- Start EVERY topic with: "ก่อนเริ่ม ${name} รู้อะไรเกี่ยวกับเรื่องนี้บ้าง?" / "What do you already know about this?"
- After teaching: "ปิดโน้ตแล้วบอกฉันหน่อย — 3 สิ่งสำคัญที่สุดที่เพิ่งเรียน" / "Close your notes — what are the 3 most important things we just covered?"
- Mini quiz after every topic — in the style of real exam questions

### 2. Deep Elaborative Interrogation
- "ทำไมสูตรนี้ถึงใช้ได้? อธิบายหลักการ" / "Why does this formula work? Explain the principle"
- "ถ้าเงื่อนไขเปลี่ยนเป็น X คำตอบจะเปลี่ยนไหม?" / "If condition X changed, how would the answer change?"
- Always push one level deeper than the question asked

### 3. Metacognition & Strategy
- "ให้คะแนนความมั่นใจ 1–5" / "Confidence rating 1–5"
- "วิชาไหนที่รู้สึกอ่อนที่สุด?" / "Which topic feels weakest?"
- Teach exam strategy: time management, identifying question type, eliminating wrong answers

### 4. Exam-Driven Practice
${gradeLevel === 'secondary_6' ? `- TPAT/A-Level focus: use timed practice "ลองทำข้อนี้ภายใน 2 นาที เหมือนสอบจริง" / "2 minutes — go, like the real exam"
- Connect every topic to past TPAT question patterns
- Focus on speed + accuracy equally` : `- Use realistic practice questions after each topic
- Build exam confidence progressively`}

### 5. Spaced Repetition Prompts
- Regularly reference older topics: "เรื่องนี้เชื่อมกับที่เราเรียนเรื่อง X ไป — จำได้ไหม?" / "This connects to X we covered before — can you recall it?"
`;

  if (isUniv) return `
## Teaching Approach: University Researcher (Evidence-Based Socratic Method)
${name} is training to be a **medical science researcher**. Apply ALL 5 evidence-based methods at research depth.

### 1. Retrieval Practice (Works at ALL Levels)
- NEVER start by explaining — ask first: "Before I explain, what do you already know or recall about this mechanism/pathway?"
- After teaching: "Can you summarise the key steps from memory?" / "Explain it back without notes"
- End every topic with a retrieval question — never "do you understand?"

### 2. Elaborative Interrogation — Core of Scientific Thinking
- Always ask WHY and HOW before giving answers
- "What is the molecular mechanism behind this?"
- "What would you hypothesize, and why?"
- "How would you design an experiment to test this?"
- "What are the limitations of this method/study?"
- Push for mechanistic understanding, not surface knowledge

### 3. Metacognitive Self-Assessment
- "Rate your confidence in this topic 1–5"
- "Which part of this pathway is still unclear?"
- "What do you think you need to read more about?"
- A researcher must know the exact boundaries of their own knowledge

### 4. Complexity Step by Step
- Build: Structure → Function → Clinical relevance → Research application
- Even complex pathways (immune cascade, metabolic cycle): one step at a time
- Check understanding at each level before advancing

### 5. Cross-Subject Spaced Repetition
- Connect across subjects: Biochemistry ↔ Microbiology ↔ Immunology ↔ Research Methods
- Reference earlier sessions: "This connects to what we covered about X — can you recall how?"
- Encourage primary sources: PubMed, Google Scholar, SUT library databases
- Challenge assumptions: "Why is this the accepted model? Is there any debate in the literature?"
`;

  // Default fallback (grade not set)
  return `
### General Teaching
- Ask what the student knows before explaining
- Use why/how questions after every key fact
- Teach one concept at a time, check before moving on
- End every topic with a recall question, not "do you understand?"
`;
})()}`;


    }

    const formattedMsgs = isGreeting
      ? [{ role: 'user', content: `Greet me and suggest what we can learn in ${subjectName}` }]
      : (messages ?? []).map((m: any) => ({
          role: m?.role ?? 'user',
          content: m?.content ?? '',
        }));

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...formattedMsgs,
    ];

    // Use longer timeout for local Ollama (local models can be slow)
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify({
        model: config.model,
        messages: apiMessages,
        stream: !isGreeting,
        max_tokens: isGreeting ? 300 : (earlyPrimary ? 220 : 800),
        temperature: isGreeting ? 0.8 : 0.7,
      }),
    };

    // AbortController with generous timeout for reasoning/local LLMs
    const timeoutMs = 300000; // 5 min for all models
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
    fetchOptions.signal = timeoutController.signal;

    let response: Response;
    try {
      response = await fetch(config.url, fetchOptions);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response?.ok) {
      const errText = await response?.text?.() ?? 'Unknown error';
      console.error('LLM API error:', response?.status, errText);

      let customErrMsg = `LLM API error: ${response?.status}`;
      const isGemini = model === 'gemini' || model === 'google-gemini' || config.model === GEMINI_MODEL;

      if (isGemini && (response?.status === 400 || response?.status === 401 || errText.includes('valid API key') || errText.includes('AUTHENTICATED') || errText.includes('UNAUTHENTICATED'))) {
        customErrMsg = 'Google Gemini API Key authentication error. Please go to https://aistudio.google.com/app/apikey, click "+ Create API Key" -> "Create API Key in new project" to get a key starting with AIzaSy...';
      } else if (response?.status === 401) {
        customErrMsg = 'Invalid API key for the selected LLM service.';
      } else {
        try {
          const parsedErr = JSON.parse(errText);
          const msg = parsedErr?.error?.message || parsedErr?.[0]?.error?.message;
          if (msg) customErrMsg = `LLM Error: ${msg}`;
        } catch {
          // Keep default customErrMsg
        }
      }

      return new Response(JSON.stringify({ error: customErrMsg }), {
        status: response?.status ?? 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Non-streaming greeting: parse LLM JSON and return structured response
    if (isGreeting) {
      try {
        const data = await response.json();
        const raw = data?.choices?.[0]?.message?.content ?? '';
        // Try to parse the JSON from LLM response
        let greeting = '';
        let suggestions: string[] = [];
        try {
          // Handle case where LLM wraps JSON in markdown code blocks
          let jsonStr = raw.trim();
          const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          }
          const parsed = JSON.parse(jsonStr);
          greeting = parsed?.greeting ?? raw;
          suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
        } catch {
          // If LLM didn't return valid JSON, use the raw text as greeting
          greeting = raw;
        }
        return Response.json({ greeting, suggestions, model: config.model });
      } catch (err) {
        console.error('Greeting parse error:', err);
        return Response.json({ greeting: '', suggestions: [], model: config.model });
      }
    }

    // Streaming response for regular messages
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response?.body?.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
