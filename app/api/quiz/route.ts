export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? '';

interface QuizQuestion {
  question: string;
  options: string[];      // exactly 4 options
  correctIndex: number;   // 0-3
  explanation: string;    // short explanation of the answer
}

// POST /api/quiz — generate MCQ questions from a chat session
export async function POST(req: NextRequest) {
  try {
    const { messages, subject, studentName, locale, numQuestions = 3 } = await req.json();

    if (!messages?.length) {
      return Response.json({ error: 'messages required' }, { status: 400 });
    }

    // Build a compact summary of the conversation (last 20 messages max)
    const convo = (messages as { role: string; content: string }[])
      .filter(m => m.role !== 'system')
      .slice(-20)
      .map(m => `${m.role === 'user' ? studentName || 'Student' : 'Nemo'}: ${m.content}`)
      .join('\n');

    const lang = locale === 'th' ? 'Thai' : locale === 'sv' ? 'Swedish' : 'English';

    const systemPrompt = `You are an educational assessment assistant. Generate exactly ${numQuestions} multiple-choice quiz questions based on the lesson conversation.

Rules:
- Questions must test understanding of what was ACTUALLY discussed in the conversation
- Each question must have exactly 4 options (A, B, C, D)
- Only one option is correct
- Questions should be clear and age-appropriate
- Write questions in ${lang}
- Return ONLY valid JSON, no markdown, no explanation outside the JSON

Return this exact JSON structure:
{
  "questions": [
    {
      "question": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation why this is correct"
    }
  ]
}`;

    const userPrompt = `Here is the lesson conversation for subject "${subject}":\n\n${convo}\n\nGenerate ${numQuestions} quiz questions based on what was discussed.`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct', // Fast model for quiz generation
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 1200,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Quiz generation failed:', err);
      return Response.json({ error: 'AI unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    // Extract JSON from the response (handle cases where model adds text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in quiz response:', raw);
      return Response.json({ error: 'Could not parse quiz' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const questions: QuizQuestion[] = parsed.questions ?? [];

    // Validate structure
    const valid = questions.every(q =>
      q.question && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correctIndex === 'number' && q.explanation
    );

    if (!valid || questions.length === 0) {
      return Response.json({ error: 'Invalid quiz structure' }, { status: 500 });
    }

    return Response.json({ questions: questions.slice(0, numQuestions) });
  } catch (err: any) {
    console.error('Quiz route error:', err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
}
