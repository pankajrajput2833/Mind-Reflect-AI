import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  logOut, 
  type User 
} from './firebase';
import {
  subscribeToUserSessions,
  subscribeToSessionMessages,
  createJournalSession,
  updateSessionMetadata,
  deleteJournalSession,
  addJournalMessage
} from './lib/journalService';
import {
  streamReflectionPrompt,
  sendReflectionPrompt,
  generateAutoTagAndTitle,
  generateSessionSummary,
  fetchCrossSessionTrends
} from './lib/geminiClient';
import type { 
  JournalSession, 
  JournalMessage, 
  SessionInsights, 
  UserProfile,
  CrossSessionTrendsAnalysis,
  AIPersona
} from './types';

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SummaryModal } from './components/SummaryModal';
import { SecurityModal } from './components/SecurityModal';
import { TrendsAnalyticsModal } from './components/TrendsAnalyticsModal';
import { InsightsDrawer } from './components/InsightsDrawer';

function JournalApp() {
  const { language, t } = useLanguage();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sessions & Messages State
  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  
  // Modals & Drawers UI State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isInsightsDrawerOpen, setIsInsightsDrawerOpen] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
  
  // AI Generation States
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [streamingAiText, setStreamingAiText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [sessionInsights, setSessionInsights] = useState<SessionInsights | null>(null);
  const [crossSessionTrends, setCrossSessionTrends] = useState<CrossSessionTrendsAnalysis | null>(null);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<{ text: string; mood?: string; img?: string | null } | null>(null);

  // 1. Listen for Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        });
        setAuthError(null);
      } else {
        setCurrentUser(null);
        setSessions([]);
        setActiveSessionId(null);
        setMessages([]);
        setCrossSessionTrends(null);
        setSessionInsights(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to user's sessions in Firestore
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserSessions(
      currentUser.uid,
      (fetchedSessions) => {
        setSessions(fetchedSessions);
        // If no active session or active session deleted, select the latest one
        setActiveSessionId((prevId) => {
          if (prevId && fetchedSessions.some((s) => s.id === prevId)) {
            return prevId;
          }
          return fetchedSessions.length > 0 ? fetchedSessions[0].id : null;
        });
      },
      (err) => {
        console.error('Failed to subscribe to sessions:', err);
        setActionError('Failed to sync journal sessions from Firestore');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // 3. Subscribe to active session's messages
  useEffect(() => {
    if (!currentUser?.uid || !activeSessionId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToSessionMessages(
      currentUser.uid,
      activeSessionId,
      (fetchedMessages) => {
        setMessages(fetchedMessages);
      },
      (err) => {
        console.error('Failed to subscribe to messages:', err);
        setActionError('Failed to load messages for this session');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, activeSessionId]);

  // Active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Actions
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Google Sign In Error:', error);
      setAuthError(error.message || 'Failed to sign in with Google');
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleNewSession = async (persona?: AIPersona) => {
    if (!currentUser?.uid) return;
    try {
      setActionError(null);
      const newId = await createJournalSession(
        currentUser.uid, 
        language === 'es' ? 'Nueva Reflexión' : 'New Reflection', 
        ['Reflective'], 
        language,
        persona || 'empathetic'
      );
      setActiveSessionId(newId);
    } catch (err) {
      console.error('Create session error:', err);
      setActionError('Could not start a new reflection session');
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    if (!currentUser?.uid) return;
    try {
      await updateSessionMetadata(currentUser.uid, sessionId, { title: newTitle });
    } catch (err) {
      console.error('Rename session error:', err);
      setActionError('Failed to update reflection title');
    }
  };

  const handleChangePersona = async (newPersona: AIPersona) => {
    if (!currentUser?.uid || !activeSessionId) return;
    try {
      await updateSessionMetadata(currentUser.uid, activeSessionId, { persona: newPersona });
    } catch (err) {
      console.error('Change persona error:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!currentUser?.uid) return;
    try {
      await deleteJournalSession(currentUser.uid, sessionId);
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Delete session error:', err);
      setActionError('Failed to delete reflection session');
    }
  };

  // Cross-Session Longitudinal AI Trends Analysis
  const handleOpenTrends = async () => {
    if (!currentUser?.uid) return;
    setIsTrendsModalOpen(true);

    if (!crossSessionTrends && sessions.length > 0) {
      handleFetchTrends();
    }
  };

  const handleFetchTrends = async () => {
    if (!currentUser?.uid || sessions.length === 0) return;
    setIsLoadingTrends(true);
    try {
      const trends = await fetchCrossSessionTrends(currentUser.uid, sessions, language);
      setCrossSessionTrends(trends);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Fetch trends error:', error);
      setActionError(error.message || 'Failed to analyze reflection trends');
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const handleSelectPromptForNewSession = async (prompt: string, category: string) => {
    if (!currentUser?.uid) return;
    try {
      const newId = await createJournalSession(currentUser.uid, `${category} Inquiry`, [category]);
      setActiveSessionId(newId);
      await handleSendMessage(prompt, category);
    } catch (err) {
      console.error('Prompt selection error:', err);
    }
  };

  // Send Message flow with token streaming fallback
  const handleSendMessage = async (text: string, moodContext?: string, imageBase64?: string | null) => {
    if (!currentUser?.uid) return;

    let targetSessionId = activeSessionId;

    // If no active session, create one first
    if (!targetSessionId) {
      try {
        targetSessionId = await createJournalSession(
          currentUser.uid, 
          language === 'es' ? 'Nueva Reflexión' : 'New Reflection', 
          [moodContext || 'Reflective'],
          language,
          'empathetic'
        );
        setActiveSessionId(targetSessionId);
      } catch (err) {
        console.error('Failed to create initial session:', err);
        setActionError('Failed to initialize session');
        return;
      }
    }

    const isFirstUserMessage = messages.length === 0;
    setActionError(null);
    setLastFailedMessage({ text, mood: moodContext, img: imageBase64 });

    try {
      // 1. Save user message to Firestore
      await addJournalMessage(
        currentUser.uid, 
        targetSessionId, 
        'user', 
        text, 
        {
          imageUrl: imageBase64 || undefined,
          moodContext: moodContext || undefined,
          persona: activeSession?.persona || 'empathetic'
        }
      );

      // 2. Stream reflection from backend
      setIsLoadingAi(true);
      setStreamingAiText('');

      let accumulatedReflection = '';

      await new Promise<void>((resolve, reject) => {
        streamReflectionPrompt({
          userId: currentUser.uid,
          userMessage: text,
          messages,
          moodContext: moodContext || undefined,
          persona: activeSession?.persona || 'empathetic',
          language,
          imageBase64: imageBase64 || undefined,
          onChunk: (chunk) => {
            accumulatedReflection += chunk;
            setStreamingAiText(accumulatedReflection);
          },
          onDone: async () => {
            try {
              if (accumulatedReflection.trim()) {
                await addJournalMessage(currentUser.uid, targetSessionId!, 'model', accumulatedReflection);
                setLastFailedMessage(null);

                // 4. Auto-tag & title on first turn
                if (isFirstUserMessage) {
                  try {
                    const { title, moodTags } = await generateAutoTagAndTitle(
                      currentUser.uid,
                      text,
                      accumulatedReflection,
                      language
                    );
                    await updateSessionMetadata(currentUser.uid, targetSessionId!, {
                      title,
                      moodTags
                    });
                  } catch (tagErr) {
                    console.warn('Non-blocking auto-tag warning:', tagErr);
                  }
                }
              }
              resolve();
            } catch (saveErr) {
              reject(saveErr);
            }
          },
          onError: async (streamErr) => {
            console.warn('Stream failed, trying standard endpoint fallback:', streamErr);
            try {
              // Fallback to non-streaming endpoint
              const { reflection } = await sendReflectionPrompt(
                currentUser.uid,
                text,
                messages,
                moodContext,
                activeSession?.persona || 'empathetic',
                language,
                imageBase64 || undefined
              );
              await addJournalMessage(currentUser.uid, targetSessionId!, 'model', reflection);
              setLastFailedMessage(null);

              if (isFirstUserMessage) {
                try {
                  const { title, moodTags } = await generateAutoTagAndTitle(
                    currentUser.uid,
                    text,
                    reflection,
                    language
                  );
                  await updateSessionMetadata(currentUser.uid, targetSessionId!, {
                    title,
                    moodTags
                  });
                } catch (tagErr) {
                  console.warn('Non-blocking auto-tag warning:', tagErr);
                }
              }
              resolve();
            } catch (fallbackErr: any) {
              reject(fallbackErr);
            }
          }
        });
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Error in reflection cycle:', error);
      setActionError(error.message || 'Failed to generate reflection response');
    } finally {
      setIsLoadingAi(false);
      setStreamingAiText('');
    }
  };

  const handleRetryLastAction = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage.text, lastFailedMessage.mood, lastFailedMessage.img);
    }
  };

  // Generate Summary & Insights
  const handleOpenSummary = async () => {
    if (!currentUser?.uid || !activeSession || messages.length === 0) return;

    setIsInsightsDrawerOpen(true);
    setIsGeneratingSummary(true);
    try {
      const insights = await generateSessionSummary(
        currentUser.uid,
        activeSession.title,
        messages,
        language
      );
      setSessionInsights(insights);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Summary generation error:', error);
      setActionError('Could not generate insights summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveSummaryToSession = async (summaryText: string) => {
    if (!currentUser?.uid || !activeSessionId) return;
    await updateSessionMetadata(currentUser.uid, activeSessionId, {
      summary: summaryText
    });
  };

  // If initial auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-stone-300 dark:border-stone-700 border-t-stone-800 dark:border-t-stone-200 rounded-full animate-spin" />
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400 font-serif tracking-wider">
          Initializing Private Sanctuary...
        </p>
      </div>
    );
  }

  // Page 1: Unauthenticated Landing & Google Sign-In
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onSignIn={handleSignIn}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          authLoading={authLoading}
          authError={authError}
        />
        <SecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
        />
      </>
    );
  }

  // Page 2: Authenticated Workspace & Reflection Dashboard
  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans text-stone-900 dark:text-stone-100 transition-colors">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onSignOut={handleSignOut}
        onNewSession={handleNewSession}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onOpenTrends={handleOpenTrends}
        sessionCount={sessions.length}
      />

      {/* Main Workspace: Sidebar + Chat Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewSession={handleNewSession}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onOpenTrends={handleOpenTrends}
          isOpenMobile={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        <ChatArea
          session={activeSession}
          messages={messages}
          isLoadingAi={isLoadingAi}
          streamingAiText={streamingAiText}
          onSendMessage={handleSendMessage}
          onGenerateSummary={handleOpenSummary}
          onRenameTitle={(newTitle) => {
            if (activeSessionId) return handleRenameSession(activeSessionId, newTitle);
            return Promise.resolve();
          }}
          onChangePersona={handleChangePersona}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          errorMessage={actionError}
          onRetryLastAction={lastFailedMessage ? handleRetryLastAction : undefined}
        />
      </div>

      {/* Modals & Insights Drawer */}
      <InsightsDrawer
        isOpen={isInsightsDrawerOpen}
        onClose={() => setIsInsightsDrawerOpen(false)}
        session={activeSession}
        messages={messages}
        insights={sessionInsights}
        isLoading={isGeneratingSummary}
        onGenerateSummary={handleOpenSummary}
      />

      <TrendsAnalyticsModal
        isOpen={isTrendsModalOpen}
        onClose={() => setIsTrendsModalOpen(false)}
        trends={crossSessionTrends}
        isLoading={isLoadingTrends}
        onRefresh={handleFetchTrends}
        onSelectPromptForNewSession={handleSelectPromptForNewSession}
        sessionCount={sessions.length}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        insights={sessionInsights}
        isLoading={isGeneratingSummary}
        onClose={() => setIsSummaryModalOpen(false)}
        onSaveToSession={handleSaveSummaryToSession}
      />

      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <JournalApp />
      </LanguageProvider>
    </ThemeProvider>
  );
}

