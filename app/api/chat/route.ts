export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

// Configuration: if OLLAMA_URL is set, use local Ollama; otherwise use NVIDIA API
const OLLAMA_URL = process.env.OLLAMA_URL; // e.g. http://localhost:11434
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'aisingapore/Gemma-SEA-LION-v4-4B-VL';
const LLAMA_MODEL = process.env.CLOUD_LLM_MODEL || 'meta/llama-3.3-70b-instruct';
const LLAMA_8B_MODEL = 'meta/llama-3.1-8b-instruct';
const GEMMA_4B_MODEL = 'google/gemma-3n-e4b-it';
const NVIDIA_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning';
const QWEN_MODEL = 'qwen/qwen3-next-80b-a3b-instruct';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';

function getEndpointConfig(modelChoice?: string): { url: string; model: string; headers: Record<string, string> } | null {
  const choice = modelChoice || 'llama-8b'; // Llama 3.1 8B is now default!

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
    const isUniversity = gradeLevel?.startsWith('university') || gradeLevel === 'graduate';
    const isSUT = schoolName?.includes('สุรนารี') || schoolName?.toLowerCase().includes('suranaree') || schoolName?.toLowerCase().includes('sut');
    const isMedScience = schoolProgram?.includes('Medical') || schoolProgram?.includes('วิทยาศาสตร์การแพทย์') || schoolProgram?.includes('med_science');
    const schoolBlock = (schoolName || schoolProgram) ? `
## School & Curriculum Context
- School/University: ${schoolName || 'not specified'}${isSUT ? ' (มหาวิทยาลัยเทคโนโลยีสุรนารี — SUT, Nakhon Ratchasima, Thailand)' : ''}
- Program: ${schoolProgram || (isUniversity ? 'University Program' : 'Thai program')}
${isUniversity
  ? `- UNIVERSITY-LEVEL student. Use academic depth appropriate for undergraduate/graduate level. Expect prior high school science knowledge.`
  : `- This school follows the Thai Ministry of Education Basic Education Core Curriculum (Revised 2017)`}
${isSUT && isMedScience ? `- **SUT Medical Science Program (วิทยาศาสตร์การแพทย์ มทส.)**: 4-year B.Sc. under the Institute of Science. Core curriculum: Medical Biochemistry, Cell Biology, Microbiology & Parasitology, Immunology, Basic Hematology, Basic Pathology, Research Methodology, Bioinformatics, Quality Management & Biosafety. This student's goal is to become a researcher (นักวิจัย). Use correct scientific terminology in both Thai and English. Encourage research thinking.` : ''}
${isEP ? `- **English Program (EP)**: Core subjects (Math, Science) are taught IN ENGLISH. Use English for ${subjectName} unless student writes Thai.` : ''}
${gradeLevel === 'secondary_3' ? `- Grade 9 (Matthayom 3): Key exam this year is **O-NET** (national standardized test in Thai, Math, Science, English, Social Studies). Prioritise O-NET-style practice when relevant.` : ''}
${gradeLevel === 'secondary_6' ? `- Grade 12 (Matthayom 6): **CRITICAL exam year** — A-Level and TPAT university entrance exams. Focus on exam preparation, deep understanding, and problem-solving speed.` : ''}
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
- Reference their interests when giving analogies (e.g. use football/game examples for a student who loves football)
- Adjust difficulty to their level
- Avoid topics already mastered unless reviewing
` : '';

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
{"greeting": "A warm 1-2 sentence welcome message in ${lang} with emojis", "suggestions": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]}

The suggestions must be 3-5 specific topics appropriate for the student's grade level in ${subjectName}.
Write suggestions in ${lang}.
Keep the greeting SHORT (under 40 words). Personalise it if you know the student's interests.
Do NOT include any text outside the JSON object.`;
    } else {
      systemPrompt = `You are "Nemo" (เนโม), a friendly and encouraging AI tutor. You help students learn and understand concepts clearly.
${memoryBlock}
${schoolBlock}
Context:
- Subject: ${subjectName}
- Student: ${name}${grade}
- Primary language: ${lang} (respond in ${lang} unless the student writes in another language)

Response Format Rules (VERY IMPORTANT):
- Keep responses SHORT — aim for 3-6 sentences or bullet points per reply
- Use **bold** for key terms and concepts
- Use numbered lists (1. 2. 3.) for step-by-step explanations
- Use bullet points (- or •) for listing items
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


Teaching Style:
- Be patient, friendly, and encouraging
- Use simple explanations appropriate for the student's level
- Use emojis occasionally to keep it fun 😊
- If you don't know something, say so honestly
- Encourage the student to think and try before giving full answers`;
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
        max_tokens: isGreeting ? 300 : 800,
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
      console.error('LLM API error:', errText);
      return new Response(JSON.stringify({ error: `LLM API error: ${response?.status}` }), {
        status: 502,
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
