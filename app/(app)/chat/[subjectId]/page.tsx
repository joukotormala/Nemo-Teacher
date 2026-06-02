'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { useLanguage } from '@/lib/contexts/language-context';
import { getSubjectBySlug } from '@/lib/subjects';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowLeft, Send, Loader2, Bot, UserCircle, Plus, Cpu,
  MessageSquare, Clock, ChevronRight, History, X,
  Volume2, VolumeX, Mic, MicOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessageContent } from '@/components/chat-message';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

interface SavedConversation {
  id: string;
  title: string;
  message_count: number;
  updated_at: string;
  messages: ChatMessage[];
}

// Module-level constant — created once, never recreated on renders
const ILLUSTRATION_MAP: Record<string, string> = {
  // Biology
  'brain':                '/illustrations/science/biology/brain.png',
  'lungs':                '/illustrations/science/biology/lungs.png',
  'lung':                 '/illustrations/science/biology/lungs.png',
  'circulatory':          '/illustrations/science/biology/circulatory.png',
  'circulatory system':   '/illustrations/science/biology/circulatory.png',
  'circulation':          '/illustrations/science/biology/circulatory.png',
  'heart':                '/illustrations/science/biology/heart.png',
  'stomach':              '/illustrations/science/biology/stomach.png',
  'stomache':             '/illustrations/science/biology/stomach.png',
  'digestive':            '/illustrations/science/biology/stomach.png',
  'digestive system':     '/illustrations/science/biology/stomach.png',
  'kidneys':              '/illustrations/science/biology/kidneys.jpg',
  'kidney':               '/illustrations/science/biology/kidneys.jpg',
  'liver':                '/illustrations/science/biology/liver.jpg',
  'stem':                 '/illustrations/science/biology/stem.jpg',
  'stem cell':            '/illustrations/science/biology/stem.jpg',
  'stem cells':           '/illustrations/science/biology/stem.jpg',
  'urinary':              '/illustrations/science/biology/urinary.jpg',
  'urinary system':       '/illustrations/science/biology/urinary.jpg',
  'bladder':              '/illustrations/science/biology/urinary.jpg',
  'organs':               '/illustrations/science/biology/Organs.jpeg',
  'organ':                '/illustrations/science/biology/Organs.jpeg',
  'human body':           '/illustrations/science/biology/Organs.jpeg',
  'body':                 '/illustrations/science/biology/Organs.jpeg',
  'cells':                '/illustrations/science/biology/cells.jpg',
  'cell':                 '/illustrations/science/biology/cells.jpg',
  // Physics
  'force':                '/illustrations/science/physics/force.jpg',
  'forces':               '/illustrations/science/physics/forces.jpg',
  'friction':             '/illustrations/science/physics/forces.jpg',
  'gravity':              '/illustrations/science/physics/force.jpg',
  'newton':               '/illustrations/science/physics/force.jpg',
  // Space & Earth
  'planet earth':         '/illustrations/generated/planet_earth.jpg',
  'planet':               '/illustrations/generated/planet_earth.jpg',
  'earth':                '/illustrations/generated/planet_earth.jpg',
  'globe':                '/illustrations/generated/planet_earth.jpg',
  'world':                '/illustrations/generated/planet_earth.jpg',
  'mars':                 '/illustrations/science/space_earth/mars.jpg',
  // Math
  'angle':                '/illustrations/math/angle.jpg',
  'angles':               '/illustrations/math/angle.jpg',
  'triangle':             '/illustrations/math/angle.jpg',
  // Lab Technology
  'microscope':           '/illustrations/lab_tech/microscope.jpg',
  'centrifuge':           '/illustrations/lab_tech/centrifuge.jpg',
  'bunsen':               '/illustrations/lab_tech/bunsen.jpg',
  'bunsen burner':        '/illustrations/lab_tech/bunsen.jpg',
  'burner':               '/illustrations/lab_tech/burner.jpg',
  'lab equipment':        '/illustrations/lab_tech/microscope.jpg',
  'laboratory equipment': '/illustrations/lab_tech/microscope.jpg',
  // Generated
  'robot':                '/illustrations/generated/orange_robot.jpg',
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { activeStudent, user } = useAuth();
  const { t, locale } = useLanguage();

  const subjectSlug = (params?.subjectId as string) ?? '';
  const subject = getSubjectBySlug(subjectSlug);
  const SubjectIcon = subject?.icon;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [subjectDbId, setSubjectDbId] = useState<string | null>(null);
  const [greetingLoading, setGreetingLoading] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [modelName, setModelName] = useState('Nemo AI');
  const [activeModel, setActiveModel] = useState('llama-8b');
  const [showHistory, setShowHistory] = useState(false);
  const [pastConversations, setPastConversations] = useState<SavedConversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [wordStudy, setWordStudy] = useState<{
    word: string;
    imageUrl: string;
    definition?: string;
    partOfSpeech?: string;
    phonetic?: string;
    loading: boolean;
    imageLoading?: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const greetingDoneRef = useRef(false);

  // --- Text-to-Speech (TTS) state ---
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // --- Speech-to-Text (STT) state ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Get the speech language code from locale
  const getSpeechLang = useCallback(() => {
    if (locale === 'th') return 'th-TH';
    if (locale === 'sv') return 'sv-SE';
    return 'en-US';
  }, [locale]);

  // --- TTS handler ---
  const handleSpeak = useCallback((text: string, idx: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // If already speaking this message, stop
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const clean = text
      .replace(/```[\s\S]*?```/g, '') // code blocks
      .replace(/`([^`]+)`/g, '$1')     // inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1')    // italic
      .replace(/#+\s/g, '')            // headings
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/[\-\*]\s/g, '')        // list items
      .replace(/\n{2,}/g, '. ')        // double newlines to pause
      .replace(/\n/g, ' ')             // single newlines
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = getSpeechLang();
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a matching voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = utterance.lang.split('-')[0];
    const matchedVoice = voices.find(v => v.lang.startsWith(langPrefix));
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  }, [speakingIdx, getSpeechLang]);

  // Stop TTS when leaving the page
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --- STT handler ---
  const toggleListening = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(locale === 'th'
        ? 'เบราว์เซอร์ไม่รองรับการฟังเสียง — กรุณาใช้ Google Chrome'
        : 'Speech recognition not supported — please use Google Chrome');
      return;
    }

    // Stop if already listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // Step 1: Request microphone permission first (Chrome requires this)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Got permission — stop the stream immediately (SpeechRecognition handles its own audio)
      stream.getTracks().forEach(track => track.stop());
    } catch (permErr: any) {
      console.error('Microphone permission denied:', permErr);
      toast.error(locale === 'th'
        ? '🎤 กรุณาอนุญาตการใช้ไมโครโฟน — คลิกไอคอนกล้องในแถบ URL'
        : '🎤 Please allow microphone access — click the camera icon in the URL bar');
      return;
    }

    // Step 2: Start speech recognition
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getSpeechLang();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        toast.success(locale === 'th' ? '🎤 กำลังฟัง... พูดได้เลย!' : '🎤 Listening... speak now!', { duration: 2000 });
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        recognitionRef.current = null;
        if (event.error === 'not-allowed') {
          toast.error(locale === 'th' ? 'กรุณาอนุญาตการใช้ไมโครโฟน' : 'Please allow microphone access');
        } else if (event.error === 'no-speech') {
          toast.info(locale === 'th' ? 'ไม่ได้ยินเสียง — กรุณาลองพูดอีกครั้ง' : 'No speech detected — please try again');
        } else if (event.error === 'network') {
          toast.error(locale === 'th' ? 'ข้อผิดพลาดเครือข่าย — กรุณาลองอีกครั้ง' : 'Network error — please try again');
        } else if (event.error !== 'aborted') {
          toast.error(`Speech recognition failed (${event.error})`);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      toast.error(locale === 'th'
        ? 'ไม่สามารถเริ่มฟังเสียงได้'
        : 'Could not start speech recognition');
      setIsListening(false);
    }
  }, [isListening, getSpeechLang, locale]);

  const subjectName = locale === 'th' ? (subject?.name_th ?? '') : (subject?.name_en ?? '');
  const studentName = activeStudent?.nickname_thai ?? activeStudent?.nickname_english ?? activeStudent?.name_english ?? activeStudent?.name_thai ?? '';

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  // Fetch subject UUID from DB
  useEffect(() => {
    if (!subjectSlug) return;
    const fetchId = async () => {
      try {
        const { data } = await supabase.from('subjects').select('id').eq('code', subjectSlug).maybeSingle();
        if (data?.id) setSubjectDbId(data.id);
      } catch {}
    };
    fetchId();
  }, [subjectSlug]);

  // Fetch past conversations for this subject
  const fetchPastConversations = useCallback(async () => {
    if (!activeStudent?.id || !subjectDbId) return;
    setHistoryLoading(true);
    try {
      const { data } = await supabase
        .from('conversations')
        .select('id, title, message_count, updated_at, messages')
        .eq('student_id', activeStudent.id)
        .eq('subject_id', subjectDbId)
        .order('updated_at', { ascending: false })
        .limit(20);
      setPastConversations((data as SavedConversation[]) ?? []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [activeStudent?.id, subjectDbId]);

  useEffect(() => {
    fetchPastConversations();
  }, [fetchPastConversations]);

  // Start learning session
  useEffect(() => {
    if (!activeStudent?.id || !subjectDbId) return;
    const startSession = async () => {
      try {
        const { data } = await supabase
          .from('learning_sessions')
          .insert({ student_id: activeStudent.id, subject_id: subjectDbId, started_at: new Date().toISOString() })
          .select('id')
          .single();
        if (data?.id) sessionIdRef.current = data.id;
      } catch {}
    };
    startSession();

    return () => {
      const sid = sessionIdRef.current;
      if (sid) {
        supabase.from('learning_sessions').update({ ended_at: new Date().toISOString() }).eq('id', sid).then(() => {});
      }
    };
  }, [activeStudent?.id, subjectDbId]);

  // Show instant greeting + fetch AI suggestions in background (non-blocking)
  useEffect(() => {
    if (greetingDoneRef.current || !subject || !activeStudent) return;
    greetingDoneRef.current = true;

    const savedModel = (typeof window !== 'undefined' ? localStorage.getItem('nemo_preferred_model') : null) || 'llama-8b';
    setActiveModel(savedModel);

    // Update local model name placeholder instantly
    if (savedModel === 'nvidia') setModelName('Nemotron-3-nano');
    else if (savedModel === 'qwen') setModelName('Qwen-3-Next');
    else if (savedModel === 'cloud') setModelName('Llama-3.3-70B');
    else if (savedModel === 'llama-8b') setModelName('Llama-3.1-8B');
    else if (savedModel === 'gemma-4b') setModelName('Gemma-3-4B');
    else if (savedModel === 'sea-lion') setModelName('Sea-Lion (Local)');
    else if (savedModel === 'nemotron') setModelName('nemotron-mini');

    const quickGreeting = locale === 'th'
      ? `สวัสดีครับ ${studentName}! 😊 ยินดีต้อนรับสู่วิชา${subjectName} พิมพ์คำถามของคุณได้เลยครับ!`
      : locale === 'sv'
      ? `Hej ${studentName}! 😊 Välkommen till ${subjectName}. Skriv din fråga nedan för att komma igång!`
      : `Hi ${studentName}! 😊 Welcome to ${subjectName}. Type your question below to get started!`;
    setMessages([{ role: 'assistant', content: quickGreeting }]);

    if (subject?.suggestions?.length) {
      const predefined = subject.suggestions.map(s => locale === 'th' ? s.label_th : s.label_en);
      setTopicSuggestions(predefined);
    }

    setGreetingLoading(true);
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: [{ role: 'user', content: '__GREETING__' }],
            subject: subjectName,
            locale,
            studentName,
            gradeLevel: activeStudent?.current_grade,
            isGreeting: true,
            model: savedModel,
          }),
        });

        if (!response?.ok) {
          setGreetingLoading(false);
          return;
        }

        const data = await response.json();
        const aiGreeting = data?.greeting ?? '';
        const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];

        if (data?.model) {
          setModelName(data.model);
        }

        if (aiGreeting) {
          setMessages([{ role: 'assistant', content: aiGreeting }]);
        }
        if (suggestions.length > 0) {
          setTopicSuggestions(suggestions);
        }

        // Auto-send preselected topic from the dashboard picker (read from URL)
        const urlTopic = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('topic')
          : null;
        if (urlTopic) {
          const suggestion = subject?.suggestions?.find(
            s => s.label_en === urlTopic || s.label_th === urlTopic
          );
          const prompt = suggestion
            ? (locale === 'th' ? suggestion.prompt_th : suggestion.prompt_en)
            : urlTopic;
          setTopicSuggestions([]);
          setTimeout(() => { sendMessageCore(prompt); }, 300);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Greeting fetch error:', err);
        }
      } finally {
        setGreetingLoading(false);
      }
    })();

    return () => { controller.abort(); };
  }, [subject, activeStudent]);

  // Load a past conversation
  const loadConversation = useCallback((conv: SavedConversation) => {
    const savedMessages = Array.isArray(conv.messages) ? conv.messages : [];
    setMessages(savedMessages);
    setConversationId(conv.id);
    setTopicSuggestions([]);
    setShowHistory(false);
    greetingDoneRef.current = true;
    setTimeout(() => {
      messagesEndRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
    }, 100);
  }, []);

  const sendMessageCore = useCallback(async (trimmed: string) => {
    // Check if user is triggering an illustration command
    const drawRegex = /^\/(draw|image|illustration|rita|bild|วาด|รูป)\s+(.+)$/i;
    if (drawRegex.test(trimmed)) {
      const match = trimmed.match(drawRegex);
      if (match) {
        const rawPrompt = match[2].trim();
        const safeName = rawPrompt.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || `img_${Math.random().toString(36).substring(7)}`;
        const visualPrompt = encodeURIComponent(`A clear, colorful educational illustration of "${rawPrompt}" for kids, 3D claymation style, isolated on a light gray background`);
        const imageUrl = `/api/generate-image?prompt=${visualPrompt}&name=${safeName}`;
        
        const userMsg: ChatMessage = { role: 'user', content: trimmed };
        let introText = `Here is the illustration for "${rawPrompt}":`;
        if (locale === 'th') {
          introText = `นี่คือภาพประกอบสำหรับ "${rawPrompt}":`;
        } else if (locale === 'sv') {
          introText = `Här är illustrationen för "${rawPrompt}":`;
        }
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: `${introText}\n\n![${rawPrompt}](${imageUrl})`
        };
        
        const newMessages = [...(messages ?? []), userMsg, assistantMsg];
        setMessages(newMessages);
        setInput('');
        
        // Save to Supabase DB
        if (activeStudent?.id && subjectDbId) {
          try {
            if (conversationId) {
              await supabase
                .from('conversations')
                .update({ messages: newMessages, message_count: newMessages.length, updated_at: new Date().toISOString() })
                .eq('id', conversationId);
            } else {
              const { data } = await supabase
                .from('conversations')
                .insert({
                  student_id: activeStudent.id,
                  subject_id: subjectDbId,
                  messages: newMessages,
                  message_count: newMessages.length,
                  title: trimmed.substring(0, 100) || 'Chat',
                  ai_model_used: activeModel,
                })
                .select('id')
                .single();
              if (data?.id) setConversationId(data.id);
            }
            fetchPastConversations();
          } catch (err) {
            console.error('Failed to save command conversation:', err);
          }
        }
        return;
      }
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const newMessages = [...(messages ?? []), userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const apiMessages = newMessages
        .filter((m, i) => !(i < 2 && m.role === 'assistant'))
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: apiMessages.length > 0 ? apiMessages : [{ role: 'user', content: trimmed }],
          subject: subjectName,
          locale,
          studentName,
          gradeLevel: activeStudent?.current_grade,
          model: activeModel,
        }),
      });

      if (!response?.ok) {
        const errData = await response?.json?.().catch(() => ({}));
        throw new Error(errData?.error ?? `API error: ${response?.status}`);
      }

      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantReasoning = '';
      let partialRead = '';

      setMessages(prev => [...(prev ?? []), { role: 'assistant', content: '', reasoning: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          partialRead += decoder.decode(value, { stream: true });
          const lines = partialRead.split('\n');
          partialRead = lines?.pop?.() ?? '';
          for (const line of lines) {
            if (line?.startsWith?.('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed?.choices?.[0]?.delta?.content ?? '';
                const reasoningDelta = parsed?.choices?.[0]?.delta?.reasoning_content ?? parsed?.choices?.[0]?.delta?.reasoning ?? '';
                
                if (delta || reasoningDelta) {
                  if (delta) assistantContent += delta;
                  if (reasoningDelta) assistantReasoning += reasoningDelta;
                  
                  const curContent = assistantContent;
                  const curReasoning = assistantReasoning;
                  
                  setMessages(prev => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                      updated[updated.length - 1] = { 
                        role: 'assistant', 
                        content: curContent,
                        reasoning: curReasoning || undefined
                      };
                    }
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }

      // Save conversation to DB
      if (activeStudent?.id && (assistantContent || assistantReasoning) && subjectDbId) {
        try {
          const allMsgs = [
            ...newMessages,
            { role: 'assistant', content: assistantContent, reasoning: assistantReasoning || undefined }
          ];
          if (conversationId) {
            await supabase
              .from('conversations')
              .update({ messages: allMsgs, message_count: allMsgs.length, updated_at: new Date().toISOString() })
              .eq('id', conversationId);
          } else {
            const { data } = await supabase
              .from('conversations')
              .insert({
                student_id: activeStudent.id,
                subject_id: subjectDbId,
                messages: allMsgs,
                message_count: allMsgs.length,
                title: trimmed?.substring?.(0, 100) ?? 'Chat',
                ai_model_used: activeModel,
              })
              .select('id')
              .single();
            if (data?.id) setConversationId(data.id);
          }
          // Refresh history list
          fetchPastConversations();
        } catch (err) {
          console.error('Failed to save conversation:', err);
        }
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Chat error:', error);
        toast.error(error?.message ?? 'Failed to send message');
        setMessages(prev => {
          const updated = [...(prev ?? [])];
          if (updated.length > 0 && updated[updated.length - 1]?.content === '') updated.pop();
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, locale, activeStudent, subjectName, conversationId, subjectDbId, studentName, fetchPastConversations, activeModel]);

  const sendMessage = useCallback(async () => {
    const trimmed = input?.trim?.() ?? '';
    if (!trimmed || isStreaming) return;
    setTopicSuggestions([]);
    await sendMessageCore(trimmed);
  }, [input, isStreaming, sendMessageCore]);

  const handleSuggestionClick = useCallback((topic: string) => {
    if (isStreaming) return;
    setTopicSuggestions([]);

    const suggestion = subject?.suggestions?.find(
      s => s.label_th === topic || s.label_en === topic
    );
    const prompt = suggestion
      ? (locale === 'th' ? suggestion.prompt_th : suggestion.prompt_en)
      : topic;

    sendMessageCore(prompt);
  }, [isStreaming, sendMessageCore, subject, locale]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e?.key === 'Enter' && !e?.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    greetingDoneRef.current = false;
    setMessages([]);
    setConversationId(null);
    setInput('');
    setShowHistory(false);
    const quickGreeting = locale === 'th'
      ? `สวัสดีครับ ${studentName}! 😊 ยินดีต้อนรับสู่วิชา${subjectName} พิมพ์คำถามของคุณได้เลยครับ!`
      : locale === 'sv'
      ? `Hej ${studentName}! 😊 Välkommen till ${subjectName}. Skriv din fråga nedan för att komma igång!`
      : `Hi ${studentName}! 😊 Welcome to ${subjectName}. Type your question below to get started!`;
    setMessages([{ role: 'assistant', content: quickGreeting }]);
    if (subject?.suggestions?.length) {
      const predefined = subject.suggestions.map(s => locale === 'th' ? s.label_th : s.label_en);
      setTopicSuggestions(predefined);
    } else {
      setTopicSuggestions([]);
    }
  };

// Common English stop words, pronouns, helper verbs, and generic words to exclude from image generation
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't", 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', "can't", 'cannot',
  'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't", 'have', "haven't", 'having',
  'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself', 'him', 'himself', 'his', 'how', "how's",
  'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's", 'its', 'itself',
  "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', "shan't", 'she', "she'd", "she'll",
  "she's", 'should', "shouldn't", 'so', 'some', 'such', 'than', 'that', "that's", 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've",
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't", 'we', "we'd", "we'll",
  "we're", "we've", 'were', "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while',
  'who', "who's", 'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd", "you'll",
  "you're", "you've", 'your', 'yours', 'yourself', 'yourselves',
  // Helper verbs / generic common words
  'make', 'makes', 'made', 'making', 'go', 'goes', 'went', 'gone', 'get', 'gets', 'got', 'getting', 'take', 'takes', 'took', 'taken',
  'say', 'says', 'said', 'saying', 'tell', 'tells', 'told', 'telling', 'give', 'gives', 'gave', 'given', 'giving',
  'come', 'comes', 'came', 'coming', 'use', 'uses', 'used', 'using', 'look', 'looks', 'looked', 'looking',
  'find', 'finds', 'found', 'finding', 'think', 'thinks', 'thought', 'thinking', 'know', 'knows', 'knew', 'known',
  'want', 'wants', 'wanted', 'wanting', 'show', 'shows', 'showed', 'shown', 'showing', 'like', 'likes', 'liked',
  'just', 'also', 'even', 'now', 'here', 'there', 'please', 'thanks', 'thank', 'hello', 'hi', 'hey', 'welcome',
  'everything', 'something', 'anything', 'nothing', 'someone', 'anyone', 'everyone', 'words', 'word', 'things', 'thing'
]);

  const handleWordClick = useCallback((word: string) => {
    if (isStreaming) return;
    
    // Clean string but preserve inner spaces for composite words (e.g. bolded compound phrase like "Lab equipment")
    const cleanWord = word.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'']/g, "").replace(/\s+/g, " ").toLowerCase();
    if (!cleanWord) return;

    // Look up in the complete illustration map
    let imageUrl = ILLUSTRATION_MAP[cleanWord] || '';

    if (imageUrl) {
      // Show the modal since an illustration exists
      setWordStudy({
        word: cleanWord,
        imageUrl,
        loading: true,
        imageLoading: true
      });

      // Fetch definition from Free Dictionary API in the background
      fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          const meaning = data[0]?.meanings[0];
          const definition = meaning?.definitions[0]?.definition;
          const partOfSpeech = meaning?.partOfSpeech;
          const phonetic = data[0]?.phonetics?.find((p: any) => p.text)?.text || data[0]?.phonetic;
          
          setWordStudy(prev => {
            if (!prev || prev.word !== cleanWord) return prev;
            return {
              ...prev,
              definition,
              partOfSpeech,
              phonetic,
              loading: false
            };
          });
        })
        .catch(() => {
          setWordStudy(prev => {
            if (!prev || prev.word !== cleanWord) return prev;
            return {
              ...prev,
              loading: false
            };
          });
        });
    } else {
      // No illustration exists - bypass modal and go straight to Nemo explanation
      sendMessageCore(cleanWord);
    }
  }, [isStreaming, sendMessageCore]);

  const handleModelChange = (modelId: string) => {
    setActiveModel(modelId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nemo_preferred_model', modelId);
    }
    // Update local model name instantly
    if (modelId === 'nvidia') setModelName('Nemotron-3-nano');
    else if (modelId === 'qwen') setModelName('Qwen-3-Next');
    else if (modelId === 'cloud') setModelName('Llama-3.3-70B');
    else if (modelId === 'llama-8b') setModelName('Llama-3.1-8B');
    else if (modelId === 'gemma-4b') setModelName('Gemma-3-4B');
    else if (modelId === 'sea-lion') setModelName('Sea-Lion (Local)');
    else if (modelId === 'nemotron') setModelName('nemotron-mini');

    const displayMap: Record<string, string> = {
      'nvidia': 'Nemotron-3-nano',
      'qwen': 'Qwen 3 Next',
      'cloud': 'Llama 3.3',
      'llama-8b': 'Llama 3.1 8B',
      'gemma-4b': 'Gemma 3 4B',
      'sea-lion': 'Sea-Lion',
      'nemotron': 'Nemotron-mini'
    };
    const displayName = displayMap[modelId] || 'Nemo';

    toast.success(
      locale === 'th'
        ? `เปลี่ยนเป็นโมเดล ${displayName} แล้ว`
        : locale === 'sv'
        ? `Ändrade till ${displayName}`
        : `Switched to ${displayName}`
    );
  };

  // Detect quick replies from the last assistant message
  useEffect(() => {
    if (isStreaming || messages.length === 0) {
      setQuickReplies([]);
      return;
    }
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role !== 'assistant' || !lastMsg.content) {
      setQuickReplies([]);
      return;
    }
    const content = lastMsg.content.trim();
    // Check if message ends with a question
    const endsWithQuestion = /\?\s*$/.test(content) || /\?\s*[😊🤔💡✨🎯📝]\s*$/.test(content);
    if (!endsWithQuestion) {
      setQuickReplies([]);
      return;
    }

    // Generate contextual quick replies
    const replies: string[] = [];
    const lower = content.toLowerCase();

    // Yes/No pattern
    if (/ready|พร้อม|ไหม|มั้ย|shall we|want to|do you want|ต้องการ|อยาก|redo|är du klar|vill du/.test(lower)) {
      if (locale === 'th') {
        replies.push('พร้อมเลยครับ! ✅');
        replies.push('ขอคำใบ้หน่อยครับ 💡');
      } else if (locale === 'sv') {
        replies.push('Ja, låt oss köra! ✅');
        replies.push('Ge mig en ledtråd 💡');
      } else {
        replies.push('Yes, let\'s go! ✅');
        replies.push('Give me a hint 💡');
      }
    }
    // Continue/next step pattern
    if (/next|ต่อ|continue|step|ขั้นตอน|ไปต่อ|nästa|fortsätt|steg/.test(lower)) {
      if (locale === 'th') {
        replies.push('ไปต่อเลย! ▶️');
        replies.push('อธิบายเพิ่มหน่อย 🔍');
      } else if (locale === 'sv') {
        replies.push('Fortsätt! ▶️');
        replies.push('Förklara mer 🔍');
      } else {
        replies.push('Continue! ▶️');
        replies.push('Explain more 🔍');
      }
    }
    // Understanding check pattern
    if (/understand|เข้าใจ|clear|ชัด|make sense|รู้เรื่อง|förstår|tydligt|rimligt/.test(lower)) {
      if (locale === 'th') {
        replies.push('เข้าใจแล้วครับ! 👍');
        replies.push('ยังไม่เข้าใจ อธิบายอีกทีได้ไหม 🤔');
      } else if (locale === 'sv') {
        replies.push('Ja, jag förstår! 👍');
        replies.push('Inte än, förklara igen? 🤔');
      } else {
        replies.push('Yes, I understand! 👍');
        replies.push('Not yet, explain again? 🤔');
      }
    }
    // Try it pattern
    if (/try|ลอง|attempt|give it|solve|แก้|คำนวณ|calculate|försök|testa|lösa/.test(lower)) {
      if (locale === 'th') {
        replies.push('ลองทำดูครับ! ✏️');
        replies.push('ช่วยอธิบายก่อนได้ไหม 📖');
      } else if (locale === 'sv') {
        replies.push('Låt mig försöka! ✏️');
        replies.push('Hjälp mig att förstå först 📖');
      } else {
        replies.push('Let me try! ✏️');
        replies.push('Help me understand first 📖');
      }
    }

    // Default if question detected but no specific pattern
    if (replies.length === 0) {
      if (locale === 'th') {
        replies.push('ใช่ครับ ✅');
        replies.push('ไม่แน่ใจ อธิบายเพิ่มหน่อย 🤔');
      } else if (locale === 'sv') {
        replies.push('Ja ✅');
        replies.push('Inte säker, förklara mer 🤔');
      } else {
        replies.push('Yes ✅');
        replies.push('Not sure, explain more 🤔');
      }
    }

    setQuickReplies(replies);
  }, [messages, isStreaming, locale]);

  const handleQuickReply = useCallback((reply: string) => {
    if (isStreaming) return;
    setQuickReplies([]);
    sendMessageCore(reply);
  }, [isStreaming, sendMessageCore]);

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return locale === 'th' ? 'เมื่อสักครู่' : locale === 'sv' ? 'Just nu' : 'Just now';
      if (diffMins < 60) return locale === 'th' ? `${diffMins} นาทีที่แล้ว` : locale === 'sv' ? `${diffMins}m sedan` : `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return locale === 'th' ? `${diffHours} ชม.ที่แล้ว` : locale === 'sv' ? `${diffHours}t sedan` : `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return locale === 'th' ? `${diffDays} วันที่แล้ว` : locale === 'sv' ? `${diffDays}d sedan` : `${diffDays}d ago`;
      return date.toLocaleDateString(locale === 'th' ? 'th-TH' : locale === 'sv' ? 'sv-SE' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (!subject) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Subject not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('chat.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat header */}
      <div className="bg-card border-b border-border/50 px-4 py-3">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${subject?.color ?? '#8B5CF6'}20` }}
            >
              {SubjectIcon ? <SubjectIcon className="w-5 h-5" style={{ color: subject?.color ?? '#8B5CF6' }} /> : null}
            </div>
            <div>
              <h2 className="font-display font-semibold text-sm">{subjectName}</h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none">
                    <Cpu className="w-3 h-3 text-purple-500 animate-pulse" />
                    <span>
                      {t('chat.model')}: <span className="font-semibold underline decoration-dotted">{modelName}</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-card border border-border">
                  <DropdownMenuItem onClick={() => handleModelChange('nvidia')} className="flex flex-col items-start gap-0.5 cursor-pointer hover:bg-muted p-2 rounded-md">
                    <span className="font-medium text-xs sm:text-sm">{t('model.nvidia')}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Nemotron-3-nano (Nvidia)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModelChange('qwen')} className="flex flex-col items-start gap-0.5 cursor-pointer hover:bg-muted p-2 rounded-md">
                    <span className="font-medium text-xs sm:text-sm">{t('model.qwen')}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Qwen-3-Next (Nvidia)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModelChange('cloud')} className="flex flex-col items-start gap-0.5 cursor-pointer hover:bg-muted p-2 rounded-md">
                    <span className="font-medium text-xs sm:text-sm">{t('model.cloud')}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Llama-3.3-70B (Nvidia)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModelChange('llama-8b')} className="flex flex-col items-start gap-0.5 cursor-pointer hover:bg-muted p-2 rounded-md">
                    <span className="font-medium text-xs sm:text-sm">{t('model.llama8b')}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Llama-3.1-8B (Nvidia)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModelChange('gemma-4b')} className="flex flex-col items-start gap-0.5 cursor-pointer hover:bg-muted p-2 rounded-md">
                    <span className="font-medium text-xs sm:text-sm">{t('model.gemma4b')}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Gemma-3-4B (Nvidia)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModelChange('sea-lion')} className="flex flex-col items-start gap-0.5 cursor-pointer hover:bg-muted p-2 rounded-md">
                    <span className="font-medium text-xs sm:text-sm">{t('model.seaLion')}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Sea-Lion MLX / GGUF (LM Studio/Ollama)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleModelChange('nemotron')} className="flex flex-col items-start gap-0.5 cursor-pointer hover:bg-muted p-2 rounded-md">
                    <span className="font-medium text-xs sm:text-sm">{t('model.nemotron')}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">nemotron-mini (Ollama)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* History toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchPastConversations(); }}
              className="relative"
            >
              <History className="w-4 h-4 mr-1" />
              {locale === 'th' ? 'ประวัติ' : 'History'}
              {pastConversations.length > 0 ? (
                <span className="ml-1.5 text-[10px] bg-purple-500 text-white rounded-full px-1.5 py-0.5 font-medium">
                  {pastConversations.length}
                </span>
              ) : null}
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewChat}>
              <Plus className="w-4 h-4 mr-1" /> {t('chat.newChat')}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation History Panel */}
        <AnimatePresence>
          {showHistory ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-r border-border/50 bg-card flex flex-col overflow-hidden flex-shrink-0"
            >
              <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  {locale === 'th' ? 'บทสนทนาที่ผ่านมา' : 'Past Conversations'}
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : pastConversations.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {locale === 'th' ? 'ยังไม่มีบทสนทนา' : 'No conversations yet'}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {locale === 'th' ? 'เริ่มถามคำถามเพื่อสร้างบทสนทนาแรก!' : 'Ask a question to start your first conversation!'}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {pastConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv)}
                        className={`w-full text-left p-3 rounded-xl transition-all hover:bg-muted/80 group ${
                          conversationId === conv.id
                            ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800'
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium line-clamp-2 leading-snug">
                            {conv.title || (locale === 'th' ? 'บทสนทนา' : 'Conversation')}
                          </p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5 group-hover:text-foreground transition-colors" />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {conv.message_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(conv.updated_at)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* New chat button at bottom of panel */}
              <div className="p-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewChat}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {locale === 'th' ? 'บทสนทนาใหม่' : 'New Conversation'}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Messages area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-[900px] mx-auto space-y-4">
              <AnimatePresence>
                {messages?.map?.((msg: ChatMessage, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg?.role === 'assistant' ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden border border-purple-500/20 bg-card">
                        <img src="/nemo_avatar.jpg" alt="Nemo" className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg?.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card text-foreground rounded-bl-md'
                      }`}
                      style={msg?.role === 'assistant' ? { boxShadow: 'var(--shadow-sm)' } : {}}
                    >
                      {msg.role === 'assistant' && msg.reasoning && (
                        <details className="mb-3 text-xs text-muted-foreground bg-muted/40 dark:bg-muted/10 rounded-xl p-3 border border-border/40 select-none">
                          <summary className="cursor-pointer font-medium flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none">
                            <span className="animate-pulse text-purple-500">🧠</span>
                            <span>{locale === 'th' ? 'ขั้นตอนการคิดของ AI...' : 'AI Thinking Process...'}</span>
                          </summary>
                          <div className="mt-2 pl-3 border-l border-purple-500/30 whitespace-pre-wrap font-mono text-[10px] leading-relaxed max-h-40 overflow-y-auto select-text">
                            {msg.reasoning}
                          </div>
                        </details>
                      )}
                      
                      <ChatMessageContent 
                        content={msg?.content ?? ''} 
                        onWordClick={msg?.role === 'assistant' ? handleWordClick : undefined}
                      />
                      {msg?.role === 'assistant' && msg?.content && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSpeak(msg.content, idx); }}
                          className={`mt-2 flex items-center gap-1 text-[11px] font-medium transition-all rounded-full px-2 py-0.5 ${
                            speakingIdx === idx
                              ? 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-950/40'
                              : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/60'
                          }`}
                          title={speakingIdx === idx
                            ? (locale === 'th' ? 'หยุดอ่าน' : 'Stop reading')
                            : (locale === 'th' ? 'อ่านออกเสียง' : 'Read aloud')}
                        >
                          {speakingIdx === idx ? (
                            <><VolumeX className="w-3.5 h-3.5" /> {locale === 'th' ? 'หยุด' : 'Stop'}</>
                          ) : (
                            <><Volume2 className="w-3.5 h-3.5" /> {locale === 'th' ? 'ฟัง' : 'Listen'}</>
                          )}
                        </button>
                      )}
                    </div>
                    {msg?.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                        <UserCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ) : null}
                  </motion.div>
                )) ?? []}
              </AnimatePresence>

              {/* Clickable topic suggestions */}
              {topicSuggestions.length > 0 && !isStreaming ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2 max-w-[75%]">
                    {topicSuggestions.map((topic, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 + idx * 0.08 }}
                        onClick={() => handleSuggestionClick(topic)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium
                          bg-gradient-to-r from-purple-500/10 to-cyan-500/10
                          border border-purple-500/20 hover:border-purple-500/40
                          text-foreground hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-cyan-500/20
                          transition-all duration-200 cursor-pointer hover:shadow-md
                          active:scale-95"
                      >
                        <span className="text-purple-500">✦</span>
                        {topic}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {/* Quick reply buttons */}
              {quickReplies.length > 0 && !isStreaming && topicSuggestions.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="w-8 flex-shrink-0" />
                  <div className="flex flex-wrap gap-2 max-w-[75%]">
                    {quickReplies.map((reply, idx) => (
                      <motion.button
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: idx * 0.1 }}
                        onClick={() => handleQuickReply(reply)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium
                          bg-gradient-to-r from-green-500/10 to-emerald-500/10
                          border border-green-500/25 hover:border-green-500/50
                          text-foreground hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20
                          transition-all duration-200 cursor-pointer hover:shadow-md
                          active:scale-95"
                      >
                        {reply}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {/* Greeting loading indicator */}
              {greetingLoading ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-500/20 bg-card">
                    <img src="/nemo_avatar.jpg" alt="Nemo" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {locale === 'th' ? 'กำลังเตรียมหัวข้อ...' : 'Preparing topics...'}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Streaming indicator */}
              {isStreaming && messages.length > 0 && messages[messages.length - 1]?.content === '' ? (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-purple-500/20 bg-card">
                    <img src="/nemo_avatar.jpg" alt="Nemo" className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-card rounded-2xl rounded-bl-md px-4 py-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('chat.thinking')}
                    </div>
                  </div>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border/50 bg-card px-4 py-3">
            <div className="max-w-[900px] mx-auto flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chat.placeholder')}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[120px]"
                  rows={1}
                  disabled={isStreaming}
                  style={{ height: 'auto', minHeight: '44px' }}
                  onInput={(e: any) => {
                    const target = e?.target;
                    if (target) {
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target?.scrollHeight ?? 44, 120)}px`;
                    }
                  }}
                />
              </div>
              <button
                onClick={toggleListening}
                type="button"
                className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border ${
                  isListening
                    ? 'bg-red-500 text-white border-red-500 animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
                title={isListening
                  ? (locale === 'th' ? 'หยุดฟัง' : 'Stop listening')
                  : (locale === 'th' ? 'พูดคำถาม' : 'Speak your question')}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <Button
                onClick={sendMessage}
                disabled={!(input?.trim?.()) || isStreaming}
                className="h-11 w-11 rounded-xl p-0 flex-shrink-0"
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Word Study Modal */}
        <AnimatePresence>
          {wordStudy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setWordStudy(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-card border border-border/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setWordStudy(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-full transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-4">
                  {/* Word Display */}
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent capitalize">
                      {wordStudy.word}
                    </h3>
                    {wordStudy.phonetic && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {wordStudy.phonetic}
                      </p>
                    )}
                  </div>

                   {/* Illustration Card */}
                  {wordStudy.imageUrl && (
                    <div className="aspect-square w-full rounded-2xl border border-border/50 bg-muted/30 p-2 shadow-inner flex items-center justify-center overflow-hidden relative group">
                      <img
                        src={wordStudy.imageUrl}
                        alt={wordStudy.word}
                        className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                        style={{ display: wordStudy.imageLoading ? 'none' : 'block' }}
                        onLoad={() => setWordStudy(prev => prev ? { ...prev, imageLoading: false } : null)}
                        onError={() => {
                          // In case of error/timeout, retry loading the image after a delay
                          setTimeout(() => {
                            setWordStudy(prev => {
                              if (!prev) return null;
                              const separator = prev.imageUrl.includes('?') ? '&' : '?';
                              const retriedUrl = prev.imageUrl.includes('retry=')
                                ? prev.imageUrl.replace(/retry=\d+/, `retry=${Date.now()}`)
                                : `${prev.imageUrl}${separator}retry=${Date.now()}`;
                              return { ...prev, imageUrl: retriedUrl };
                            });
                          }, 2500);
                        }}
                      />
                      {wordStudy.imageLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 backdrop-blur-sm p-4 text-center space-y-3">
                          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 animate-pulse">
                            {locale === 'th' ? 'เนโมกำลังวาดภาพประกอบ...' : 'Nemo is drawing an illustration...'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Definition Details */}
                  <div className="space-y-2 select-text">
                    {wordStudy.loading ? (
                      <div className="space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-full" />
                        <div className="h-3 bg-muted animate-pulse rounded w-5/6" />
                      </div>
                    ) : wordStudy.definition ? (
                      <div className="text-sm">
                        {wordStudy.partOfSpeech && (
                          <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full mb-1.5">
                            {wordStudy.partOfSpeech}
                          </span>
                        )}
                        <p className="text-muted-foreground leading-relaxed text-xs">
                          {wordStudy.definition}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs italic">
                        {locale === 'th' ? 'ไม่มีคำจำกัดความ (คลิกถามเนโมเพื่อเรียนรู้เพิ่มเติม!)' : 'No definition found (Ask Nemo to learn more!)'}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2.5 pt-2">
                    <Button
                      onClick={() => {
                        if (wordStudy) {
                          sendMessageCore(wordStudy.word);
                          setWordStudy(null);
                        }
                      }}
                      className="flex-1 rounded-full py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold text-xs transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {locale === 'th' ? 'ถามเนโม' : 'Ask Nemo'}
                    </Button>
                    <Button
                      onClick={() => setWordStudy(null)}
                      variant="outline"
                      className="rounded-full py-2 px-5 font-semibold text-xs border-border/80 hover:bg-muted transition-all active:scale-95"
                    >
                      {locale === 'th' ? 'ปิด' : 'Close'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
