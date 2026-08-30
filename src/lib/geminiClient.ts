import { getIdToken } from '../firebase';
import type { 
  JournalMessage, 
  SessionInsights, 
  JournalSession, 
  CrossSessionTrendsAnalysis, 
  AIPersona, 
  SupportedLanguage 
} from '../types';

export interface StreamChatOptions {
  userId: string;
  userMessage: string;
  messages: JournalMessage[];
  moodContext?: string;
  persona?: AIPersona;
  language?: SupportedLanguage;
  imageBase64?: string;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export async function streamReflectionPrompt(options: StreamChatOptions): Promise<void> {
  const token = await getIdToken();
  if (!token) {
    options.onError(new Error('You must be signed in to submit reflections'));
    return;
  }

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      signal: options.signal,
      body: JSON.stringify({
        userId: options.userId,
        userMessage: options.userMessage,
        messages: options.messages.map(m => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          timestamp: m.timestamp
        })),
        moodContext: options.moodContext || undefined,
        persona: options.persona || 'empathetic',
        language: options.language || 'en',
        imageBase64: options.imageBase64 || undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported on this browser');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.substring(6);

        if (dataStr === '[DONE]') {
          options.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            options.onError(new Error(parsed.error));
            return;
          }
          if (parsed.chunk) {
            options.onChunk(parsed.chunk);
          }
        } catch {
          // ignore unparseable partial lines
        }
      }
    }

    options.onDone();
  } catch (err: unknown) {
    if (options.signal?.aborted) {
      options.onDone();
      return;
    }
    const error = err as Error;
    console.error('SSE Stream error:', error);
    options.onError(error);
  }
}

export async function sendReflectionPrompt(
  userId: string,
  userMessage: string,
  messages: JournalMessage[],
  moodContext?: string,
  persona?: AIPersona,
  language?: SupportedLanguage,
  imageBase64?: string
): Promise<{ reflection: string; timestamp: number }> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('You must be signed in to submit reflections');
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userId,
      userMessage,
      messages: messages.map(m => ({
        id: m.id,
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp
      })),
      moodContext: moodContext || undefined,
      persona: persona || 'empathetic',
      language: language || 'en',
      imageBase64: imageBase64 || undefined
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    reflection: data.reflection,
    timestamp: data.timestamp || Date.now()
  };
}

export async function generateAutoTagAndTitle(
  userId: string,
  firstMessage: string,
  modelResponse?: string,
  language?: SupportedLanguage
): Promise<{ title: string; moodTags: string[] }> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/auto-tag', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userId,
      firstMessage,
      modelResponse: modelResponse || undefined,
      language: language || 'en'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to auto-tag session');
  }

  const data = await response.json();
  return {
    title: data.title || 'Personal Reflection',
    moodTags: data.moodTags || ['Reflective']
  };
}

export async function generateSessionSummary(
  userId: string,
  title: string,
  messages: JournalMessage[],
  language?: SupportedLanguage
): Promise<SessionInsights> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userId,
      title,
      language: language || 'en',
      messages: messages.map(m => ({
        sender: m.sender,
        content: m.content
      }))
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate session summary');
  }

  const data = await response.json();
  return data.insights;
}

export async function fetchCrossSessionTrends(
  userId: string,
  sessions: JournalSession[],
  language?: SupportedLanguage
): Promise<CrossSessionTrendsAnalysis> {
  const token = await getIdToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/trends', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      userId,
      language: language || 'en',
      sessions: sessions.map(s => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        moodTags: s.moodTags || [],
        summary: s.summary || '',
        lastMessageSnippet: s.lastMessageSnippet || ''
      }))
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate cross-session trends');
  }

  const data = await response.json();
  return data.trends;
}

