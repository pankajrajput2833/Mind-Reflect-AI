import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from '../firebase';
import type { 
  JournalSession, 
  JournalMessage, 
  UserPreferences, 
  SupportedLanguage, 
  AIPersona 
} from '../types';

// Helper to strictly strip undefined properties before passing to Firestore SDK
function sanitizeFirestorePayload<T extends Record<string, unknown>>(data: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

// 0. User Preferences Management (/users/{userId}/preferences/settings)
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!userId) return null;
  try {
    const prefDocRef = doc(db, 'users', userId, 'preferences', 'settings');
    const snap = await getDoc(prefDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        theme: data.theme || 'zen',
        preferredLanguage: data.preferredLanguage || 'en',
        defaultPersona: data.defaultPersona || 'empathetic',
        updatedAt: data.updatedAt || Date.now()
      };
    }
  } catch (err) {
    console.warn('Could not fetch user preferences from Firestore:', err);
  }
  return null;
}

export async function saveUserPreferences(
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<void> {
  if (!userId) return;
  try {
    const prefDocRef = doc(db, 'users', userId, 'preferences', 'settings');
    const payload = sanitizeFirestorePayload({
      ...preferences,
      updatedAt: Date.now()
    });
    await setDoc(prefDocRef, payload, { merge: true });
  } catch (err) {
    console.error('Error saving user preferences:', err);
  }
}

// 1. Subscribe to all sessions for a user
export function subscribeToUserSessions(
  userId: string,
  callback: (sessions: JournalSession[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) return () => {};

  const sessionsRef = collection(db, 'users', userId, 'sessions');
  const q = query(sessionsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions: JournalSession[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId,
          title: data.title || 'Untitled Reflection',
          language: data.language || 'en',
          persona: data.persona || 'empathetic',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
          summary: data.summary || '',
          moodTags: Array.isArray(data.moodTags) ? data.moodTags : [],
          messageCount: data.messageCount || 0,
          lastMessageSnippet: data.lastMessageSnippet || ''
        };
      });
      callback(sessions);
    },
    (err) => {
      console.error('Error fetching sessions:', err);
      if (onError) onError(err);
    }
  );
}

// 2. Create a new journal session
export async function createJournalSession(
  userId: string,
  customTitle?: string,
  initialMoodTags?: string[],
  language?: SupportedLanguage,
  persona?: AIPersona
): Promise<string> {
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();

  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  const payload = sanitizeFirestorePayload({
    title: customTitle || 'New Reflection',
    language: language || 'en',
    persona: persona || 'empathetic',
    createdAt: now,
    updatedAt: now,
    summary: '',
    moodTags: initialMoodTags && initialMoodTags.length > 0 ? initialMoodTags : ['Reflective'],
    messageCount: 0,
    lastMessageSnippet: ''
  });

  await setDoc(sessionDocRef, payload);
  return sessionId;
}

// 3. Update session metadata (title, mood tags, summary, persona, language)
export async function updateSessionMetadata(
  userId: string,
  sessionId: string,
  updates: Partial<Pick<JournalSession, 'title' | 'summary' | 'moodTags' | 'lastMessageSnippet' | 'messageCount' | 'persona' | 'language'>>
): Promise<void> {
  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  const payload = sanitizeFirestorePayload({
    ...updates,
    updatedAt: Date.now()
  });

  await updateDoc(sessionDocRef, payload);
}

// 4. Delete a session
export async function deleteJournalSession(userId: string, sessionId: string): Promise<void> {
  const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
  await deleteDoc(sessionDocRef);
}

// 5. Subscribe to messages within a session
export function subscribeToSessionMessages(
  userId: string,
  sessionId: string,
  callback: (messages: JournalMessage[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId || !sessionId) return () => {};

  const messagesRef = collection(db, 'users', userId, 'sessions', sessionId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: JournalMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          sender: (data.sender as 'user' | 'model') || 'user',
          content: data.content || '',
          timestamp: data.timestamp || Date.now(),
          imageUrl: data.imageUrl || undefined,
          persona: data.persona || undefined,
          moodContext: data.moodContext || undefined
        };
      });
      callback(messages);
    },
    (err) => {
      console.error('Error fetching messages:', err);
      if (onError) onError(err);
    }
  );
}

// 6. Add a message to a session and update session's updatedAt and last snippet
export async function addJournalMessage(
  userId: string,
  sessionId: string,
  sender: 'user' | 'model',
  content: string,
  options?: {
    imageUrl?: string;
    persona?: AIPersona;
    moodContext?: string;
  }
): Promise<string> {
  const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = Date.now();

  const messageDocRef = doc(db, 'users', userId, 'sessions', sessionId, 'messages', messageId);
  const messagePayload = sanitizeFirestorePayload({
    sender,
    content: content.trim(),
    timestamp: now,
    imageUrl: options?.imageUrl || undefined,
    persona: options?.persona || undefined,
    moodContext: options?.moodContext || undefined
  });

  await setDoc(messageDocRef, messagePayload);

  // Update parent session snippet and updatedAt
  try {
    const sessionDocRef = doc(db, 'users', userId, 'sessions', sessionId);
    await updateDoc(sessionDocRef, {
      updatedAt: now,
      lastMessageSnippet: content.slice(0, 100)
    });
  } catch (err) {
    console.warn('Could not update parent session snippet:', err);
  }

  return messageId;
}
