import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Read Firebase config
let firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 'flowing-gasket-v6d0h';
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.projectId) {
      firebaseProjectId = parsed.projectId;
    }
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json on server:', e);
}

// Initialize Firebase Admin lazily / defensively
let adminInitialized = false;
try {
  if (!getAdminApps().length) {
    initAdminApp({
      projectId: firebaseProjectId
    });
    adminInitialized = true;
    console.log(`Firebase Admin initialized with projectId: ${firebaseProjectId}`);
  }
} catch (e) {
  console.warn('Firebase Admin initialization warning:', e);
}

// Security Middleware: Verify Firebase ID Token
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

async function verifyFirebaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized: Missing or invalid Authorization header with Bearer token' 
    });
  }

  const idToken = authHeader.split('Bearer ')[1]?.trim();
  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: Empty token provided' });
  }

  try {
    if (adminInitialized) {
      const decodedToken = await getAdminAuth().verifyIdToken(idToken);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email
      };
      
      // Access Control: If userId provided in body, verify it matches token UID
      const body = (req.body && typeof req.body === 'object') ? req.body : {};
      if (body.userId && body.userId !== decodedToken.uid) {
        return res.status(403).json({ error: 'Forbidden: UID mismatch on request payload' });
      }
      return next();
    } else {
      // Fallback for development without full admin credentials: Parse unverified JWT payload safely
      const payloadBase64 = idToken.split('.')[1];
      if (payloadBase64) {
        const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
        const payload = JSON.parse(payloadStr);
        if (payload && payload.user_id) {
          req.user = { uid: payload.user_id, email: payload.email };
          const body = (req.body && typeof req.body === 'object') ? req.body : {};
          if (body.userId && body.userId !== payload.user_id) {
            return res.status(403).json({ error: 'Forbidden: UID mismatch' });
          }
          return next();
        }
      }
      return res.status(401).json({ error: 'Unable to verify token' });
    }
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired Firebase ID token', details: error.message });
  }
}

// Lazy Gemini AI Client initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

async function generateWithFallback(
  contents: string | Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction?: string,
  responseSchema?: unknown
): Promise<string> {
  const client = getGeminiClient();
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      console.log(`Attempting generation with model: ${model}`);
      const config: Record<string, unknown> = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (responseSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = responseSchema;
      }

      const response = await client.models.generateContent({
        model,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: unknown) {
      const error = err as { status?: number; code?: string; message?: string };
      console.warn(`Model ${model} failed with error:`, error.message || error);
      lastError = error;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All models in fallback ladder failed. Last error: ${(lastError as Error)?.message || 'Unknown'}`);
}

// System prompts for Personas and Languages
function getPersonaSystemPrompt(persona: string = 'empathetic', language: string = 'en'): string {
  let personaInstruction = '';
  switch (persona) {
    case 'socratic':
      personaInstruction = `
You are the Socratic Thinker AI Journaling Companion.
Your style is analytical, intellectually curious, and thought-provoking.
Focus on:
1. Gently probing underlying assumptions, cognitive biases, and unexamined beliefs.
2. Asking 1-2 incisive, clarifying questions that encourage the journaler to question default interpretations.
3. Helping them dissect the difference between facts and emotional narratives.
4. Maintaining intellectual humility and psychological safety.
`;
      break;
    case 'mentor':
      personaInstruction = `
You are the Action-Oriented Mentor AI Journaling Companion.
Your style is constructive, empowering, pragmatic, and forward-looking.
Focus on:
1. Acknowledging reality and current feelings swiftly, then bridging toward proactive agency.
2. Translating emotional and cognitive realizations into tangible, bite-sized micro-habits or daily intentions.
3. Offering 1-2 structured recommendations or structured reflections on how to execute next steps.
4. Encouraging accountability with compassion and clarity.
`;
      break;
    case 'empathetic':
    default:
      personaInstruction = `
You are the Empathetic Companion AI Journaling Companion.
Your style is warm, profoundly compassionate, validating, and gentle.
Focus on:
1. Deep emotional attunement: Sincerely validating what the user is experiencing without rushing to "fix" it.
2. Creating an unconditionally safe, judgment-free haven for vulnerability.
3. Asking 1-2 open-ended, reflective questions that encourage them to soften into their feelings.
4. Using calming, reassuring, and grounded phrasing.
`;
      break;
  }

  const languageInstruction = `
IMPORTANT LANGUAGE DIRECTIVE:
You must respond strictly in the language code "${language}" (or the exact language in which the user is writing if differing from default). Maintain native fluency, natural emotional nuance, and culturally respectful expression.
`;

  return `${personaInstruction}\n\n${languageInstruction}\n\nGeneral Guidelines:\n- Keep responses concise (2-3 digestible paragraphs) so the user maintains mental space to reflect.\n- Use elegant, clean Markdown with subtle emphasis when helpful.`;
}

// API Routes

// 1. Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    geminiKeyPresent: !!process.env.GEMINI_API_KEY,
    firebaseProjectId
  });
});

// 2. Real-Time Token-by-Token Streaming Chat Reflection Endpoint (SSE)
app.post('/api/chat/stream', verifyFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { messages, userMessage, moodContext, persona = 'empathetic', language = 'en', imageBase64 } = body;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Missing or empty userMessage' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }

    const systemInstruction = getPersonaSystemPrompt(persona, language);

    // Prepare contents array for multi-turn conversational context
    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg && typeof msg.content === 'string' && msg.sender) {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content.trim() }]
          });
        }
      }
    }

    // Add current user thought with mood and multimodal attachments if present
    let promptWithContext = userMessage.trim();
    if (moodContext && typeof moodContext === 'string') {
      promptWithContext = `[User Current Mood/Energy: ${moodContext}]\n\n${promptWithContext}`;
    }

    const currentParts: Array<Record<string, unknown>> = [{ text: promptWithContext }];

    if (imageBase64 && typeof imageBase64 === 'string') {
      // Extract mime type and clean base64 data
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const client = getGeminiClient();
    let streamSuccess = false;
    let lastError: unknown = null;

    for (const model of MODEL_FALLBACK_LADDER) {
      try {
        console.log(`Starting SSE stream with model: ${model}`);
        const responseStream = await client.models.generateContentStream({
          model,
          contents: contents as unknown as string,
          config: {
            systemInstruction
          }
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
          }
        }

        streamSuccess = true;
        break;
      } catch (err: unknown) {
        console.warn(`Streaming with model ${model} failed:`, (err as Error).message);
        lastError = err;
      }
    }

    if (!streamSuccess) {
      const errMsg = (lastError as Error)?.message || 'Failed to stream response from AI model';
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    return res.end();
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in /api/chat/stream:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Stream processing error' })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    return res.end();
  }
});

// 3. Fallback Non-Streaming Chat Reflection Endpoint
app.post('/api/chat', verifyFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { messages, userMessage, moodContext, persona = 'empathetic', language = 'en', imageBase64 } = body;

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or empty userMessage' });
    }

    const systemInstruction = getPersonaSystemPrompt(persona, language);

    // Prepare contents array for multi-turn conversational context
    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [];

    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg && typeof msg.content === 'string' && msg.sender) {
          contents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content.trim() }]
          });
        }
      }
    }

    let promptWithContext = userMessage.trim();
    if (moodContext && typeof moodContext === 'string') {
      promptWithContext = `[User Current Mood/Energy: ${moodContext}]\n\n${promptWithContext}`;
    }

    const currentParts: Array<Record<string, unknown>> = [{ text: promptWithContext }];

    if (imageBase64 && typeof imageBase64 === 'string') {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const aiResponseText = await generateWithFallback(contents as unknown as string, systemInstruction);

    return res.json({
      success: true,
      reflection: aiResponseText,
      timestamp: Date.now()
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Internal server error processing reflection' });
  }
});

// 4. Auto-Tagging & Session Title Generator
app.post('/api/auto-tag', verifyFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { firstMessage, modelResponse, language = 'en' } = body;

    if (!firstMessage || typeof firstMessage !== 'string') {
      return res.status(400).json({ error: 'Missing firstMessage for auto-tagging' });
    }

    const prompt = `
Analyze this opening journal reflection entry:
User thought: "${firstMessage.slice(0, 500)}"
${modelResponse ? `Companion reflection: "${modelResponse.slice(0, 300)}"` : ''}

Language Requirement: Output all fields strictly in language "${language}" (or the language of the user thought).

Generate a concise, expressive title (3 to 5 words, title case in the target language) and 1 to 3 mood tags (e.g. Reflective, Grateful, Anxious, Determined, Hopeful, Overwhelmed, Curious, Peaceful translated accurately).

Respond in valid JSON matching this exact structure:
{
  "title": "3 to 5 Word Descriptive Title in Target Language",
  "moodTags": ["Tag1", "Tag2"]
}
`;

    const rawJson = await generateWithFallback(prompt);
    
    // Parse JSON cleanly, stripping potential markdown blocks
    let cleanJson = rawJson.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    return res.json({
      success: true,
      title: typeof parsed.title === 'string' ? parsed.title : 'Personal Reflection',
      moodTags: Array.isArray(parsed.moodTags) ? parsed.moodTags.slice(0, 3) : ['Reflective']
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.warn('Auto-tagging fallback due to parse error:', error.message);
    return res.json({
      success: true,
      title: 'Mindful Journal Entry',
      moodTags: ['Reflective', 'Mindful']
    });
  }
});

// 5. Session Summary & Insights Generator
app.post('/api/summary', verifyFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { messages, title, language = 'en' } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'At least one message is required to generate a session summary' });
    }

    const transcript = messages
      .map((m: { sender: string; content: string }) => `${m.sender === 'user' ? 'Journaler' : 'Companion'}: ${m.content}`)
      .join('\n\n');

    const prompt = `
You are synthesizing a meaningful journaling session titled "${title || 'Reflection'}".
Language Requirement: Output all summary values, takeaways, and action items strictly in language "${language}".

Transcript:
${transcript.slice(0, 8000)}

Please analyze the session and extract deep, empowering personal insights.
Output a JSON object formatted strictly as:
{
  "summary": "A 2-3 sentence overarching narrative summary of what the user processed and explored.",
  "keyTakeaways": [
    "Key takeaway or realized truth 1",
    "Key takeaway or cognitive shift 2",
    "Key takeaway 3"
  ],
  "emotionalArc": "A brief sentence describing the emotional shift.",
  "actionItems": [
    "A gentle, practical intention or grounding micro-habit 1",
    "A gentle intention 2"
  ],
  "quoteOfSession": "An inspiring, memorable one-sentence reflection synthesized from the session."
}
`;

    const rawJson = await generateWithFallback(prompt);
    let cleanJson = rawJson.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const insights = JSON.parse(cleanJson);
    return res.json({
      success: true,
      insights: {
        summary: insights.summary || 'A thoughtful session of inner exploration.',
        keyTakeaways: Array.isArray(insights.keyTakeaways) ? insights.keyTakeaways : [],
        emotionalArc: insights.emotionalArc || 'Explored thoughts with deepening clarity.',
        actionItems: Array.isArray(insights.actionItems) ? insights.actionItems : [],
        quoteOfSession: insights.quoteOfSession || 'Every moment of reflection is a step toward clarity.',
        generatedAt: Date.now()
      }
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error generating summary:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to generate session summary',
      insights: {
        summary: 'Your session explored key personal themes and reflections.',
        keyTakeaways: ['Engaged in conscious self-reflection', 'Acknowledged current emotional landscape'],
        emotionalArc: 'Gained perspective through thoughtful dialogue.',
        actionItems: ['Take a mindful pause today', 'Celebrate honoring your inner thoughts'],
        quoteOfSession: 'Clarity arrives when we give ourselves the space to listen.',
        generatedAt: Date.now()
      }
    });
  }
});

// 5. Cross-Session Advanced AI Trends & Pattern Analyzer
app.post('/api/trends', verifyFirebaseAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { sessions } = body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ error: 'At least one session is required to perform longitudinal trend analysis.' });
    }

    // Format sanitized session digests
    const sessionDigests = sessions.map((s: { 
      id?: string; 
      title?: string; 
      createdAt?: number; 
      moodTags?: string[]; 
      summary?: string; 
      lastMessageSnippet?: string 
    }, idx: number) => {
      const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : `Entry ${idx + 1}`;
      const moods = Array.isArray(s.moodTags) && s.moodTags.length > 0 ? s.moodTags.join(', ') : 'Reflective';
      const content = s.summary || s.lastMessageSnippet || 'Reflected on personal thoughts and life events.';
      return `[Entry #${idx + 1} | Date: ${dateStr} | Title: "${s.title || 'Untitled'}" | Moods: ${moods}]\nSummary/Snippet: ${content.slice(0, 500)}`;
    }).join('\n\n');

    const prompt = `
You are an advanced reflective psychologist and longitudinal AI insights engine.
You are analyzing a journaler's multi-session history (${sessions.length} entries).

Here is the archive of session entries:
${sessionDigests.slice(0, 12000)}

Perform a deep pattern, emotional arc, and personal growth analysis across these entries.
Identify:
1. Overall Emotional Trajectory & Evolution across sessions.
2. 3 to 4 Recurring Themes & Mindset Patterns (with frequency label like "Frequent", "Emerging", "Core", and sentiment category).
3. 2 to 3 Growth Milestones & Breakthroughs (areas where the user showed insight, resilience, or progress).
4. 3 Specific Areas / Prompts for Further Reflection tailored to their ongoing journey.
5. 2 to 3 Practical Goals / Intentions with concrete suggested first steps.
6. Mood distribution breakdown (approximate percentages summing to 100%).
7. A 2-sentence empowering Long-term Synthesis.

Output strictly valid JSON with this exact schema:
{
  "analyzedSessionCount": ${sessions.length},
  "timeframeDescription": "e.g. Recent reflections spanning multiple themes",
  "overallEmotionalTrajectory": "Narrative paragraph analyzing the emotional evolution and shifts over time.",
  "longTermSynthesis": "A 2-sentence empowering synthesis of the user's authentic personal growth.",
  "recurringThemes": [
    {
      "theme": "Theme title (e.g. Work-Life Boundary Calibration)",
      "frequency": "Core / Frequent / Emerging",
      "description": "How this theme manifests across entries.",
      "sentiment": "positive"
    }
  ],
  "growthMilestones": [
    {
      "area": "Domain of growth (e.g. Emotional Regulation / Acceptance)",
      "progressNote": "What progress the user has demonstrated.",
      "breakthrough": "Key realization or perspective shift achieved."
    }
  ],
  "suggestedReflections": [
    {
      "prompt": "Thought-provoking reflection prompt for their next journal entry",
      "whyHelpful": "Why this prompt builds on their current momentum",
      "category": "Emotional Deepening / Values Alignment / Boundary Setting"
    }
  ],
  "goalsAndIntentions": [
    {
      "goal": "Target intention or aspirational habit",
      "timeHorizon": "Next 7 Days / Ongoing Practice",
      "suggestedFirstStep": "Small micro-action to begin immediately"
    }
  ],
  "moodDistribution": [
    { "mood": "Reflective", "percentage": 40, "count": 2 },
    { "mood": "Grateful", "percentage": 30, "count": 1 },
    { "mood": "Growth", "percentage": 30, "count": 1 }
  ]
}
`;

    const rawJson = await generateWithFallback(prompt);
    let cleanJson = rawJson.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);

    return res.json({
      success: true,
      trends: {
        analyzedSessionCount: sessions.length,
        timeframeDescription: parsed.timeframeDescription || 'Recent journal entries',
        overallEmotionalTrajectory: parsed.overallEmotionalTrajectory || 'Your journal entries demonstrate consistent introspection and emotional honesty.',
        longTermSynthesis: parsed.longTermSynthesis || 'You are cultivating self-awareness and discovering grounded clarity through regular mindful pauses.',
        recurringThemes: Array.isArray(parsed.recurringThemes) ? parsed.recurringThemes : [],
        growthMilestones: Array.isArray(parsed.growthMilestones) ? parsed.growthMilestones : [],
        suggestedReflections: Array.isArray(parsed.suggestedReflections) ? parsed.suggestedReflections : [],
        goalsAndIntentions: Array.isArray(parsed.goalsAndIntentions) ? parsed.goalsAndIntentions : [],
        moodDistribution: Array.isArray(parsed.moodDistribution) ? parsed.moodDistribution : [],
        generatedAt: Date.now()
      }
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error generating trends:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate cross-session trends analysis',
      trends: {
        analyzedSessionCount: 1,
        timeframeDescription: 'Recent reflections',
        overallEmotionalTrajectory: 'You show steady emotional awareness and mindful self-discovery throughout your journaling practice.',
        longTermSynthesis: 'Your willingness to explore thoughts openly is your greatest catalyst for personal growth.',
        recurringThemes: [
          {
            theme: 'Mindful Self-Inquiry',
            frequency: 'Core',
            description: 'Consistently seeking deeper perspective and meaning behind daily experiences.',
            sentiment: 'growth'
          }
        ],
        growthMilestones: [
          {
            area: 'Perspective Taking',
            progressNote: 'Shifting from reactive thought patterns to proactive compassionate curiosity.',
            breakthrough: 'Recognizing thoughts as transient events rather than absolute definitions.'
          }
        ],
        suggestedReflections: [
          {
            prompt: 'Where in my life am I feeling the most alignment between my core values and my daily energy?',
            whyHelpful: 'Builds upon your growing self-awareness and helps prioritize your time.',
            category: 'Values Alignment'
          }
        ],
        goalsAndIntentions: [
          {
            goal: 'Daily 5-minute evening reflection pause',
            timeHorizon: 'Next 7 Days',
            suggestedFirstStep: 'Set a gentle reminder 30 minutes before bed.'
          }
        ],
        moodDistribution: [
          { mood: 'Reflective', percentage: 60, count: 1 },
          { mood: 'Grateful', percentage: 40, count: 1 }
        ],
        generatedAt: Date.now()
      }
    });
  }
});


// Vite Middleware for SPA and Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Journal & Reflection Server running on port ${PORT}`);
  });
}

startServer();
