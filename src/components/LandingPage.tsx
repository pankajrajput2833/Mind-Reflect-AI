import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Feather, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  Key,
  Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';

interface LandingPageProps {
  onSignIn: () => Promise<void>;
  onGuestSignIn?: () => Promise<void>;
  onOpenSecurity: () => void;
  authLoading: boolean;
  authError: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onGuestSignIn,
  onOpenSecurity,
  authLoading,
  authError
}) => {
  const { t, language } = useLanguage();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGuestSigningIn, setIsGuestSigningIn] = useState(false);

  const handleSignInClick = async () => {
    setIsSigningIn(true);
    try {
      await onSignIn();
    } catch (err) {
      console.error('Sign in failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGuestSignInClick = async () => {
    if (!onGuestSignIn) return;
    setIsGuestSigningIn(true);
    try {
      await onGuestSignIn();
    } catch (err) {
      console.error('Guest sign in failed:', err);
    } finally {
      setIsGuestSigningIn(false);
    }
  };

  const samplePrompts = [
    {
      mood: 'Reflective',
      text: language === 'es'
        ? '¿Cuál es un pensamiento o sentimiento que te ha estado acompañando en silencio durante el día?'
        : 'What is one thought or feeling that has been quietly following you throughout your day?'
    },
    {
      mood: 'Grateful',
      text: language === 'es'
        ? 'Describe un momento en las últimas 24 horas que se haya sentido genuinamente pacífico.'
        : 'Describe a moment in the past 24 hours that felt genuinely peaceful or affirming.'
    },
    {
      mood: 'Growth',
      text: language === 'es'
        ? '¿Qué emoción o decisión difícil estás transitando y qué podría estar intentando enseñarte?'
        : 'What is a challenging emotion or decision you are navigating, and what might it be trying to teach you?'
    }
  ];

  return (
    <div className="min-h-screen text-stone-900 dark:text-stone-100 flex flex-col justify-between transition-colors">
      {/* Top Bar */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif text-2xl font-extrabold tracking-tight bg-gradient-to-r from-stone-900 via-stone-800 to-amber-800 dark:from-stone-100 dark:via-stone-200 dark:to-amber-300 bg-clip-text text-transparent drop-shadow-2xs select-none">
              {t('appTitle')}
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-stone-400 dark:text-stone-500 tracking-wider">
              {t('appTagline')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector />
          <ThemeSelector />
          <button
            id="landing-security-btn"
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white glass-panel transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">{t('security')}</span>
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-stone-700 dark:text-stone-300 mb-8 glass-panel">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Gemini 3.6 Flash &bull; Cloud Firestore Isolation</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-[1.15] mb-6">
          {t('landingHeadline')}
        </h1>

        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed mb-10 font-sans">
          {t('landingSubtitle')}
        </p>

        {/* Error Alert if any */}
        {authError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-800 dark:text-rose-300 text-sm max-w-md mx-auto flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider">Authentication Notice</p>
              <p className="text-xs mt-0.5">{authError}</p>
            </div>
          </div>
        )}

        {/* Primary CTA: Google Sign In & Instant Guest Journaling */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-14">
          <button
            id="google-sign-in-cta-btn"
            disabled={isSigningIn || isGuestSigningIn || authLoading}
            onClick={handleSignInClick}
            className="w-full sm:w-auto px-7 py-3.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            {/* Google Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isSigningIn ? 'Authenticating...' : t('signInWithGoogle')}</span>
          </button>

          {onGuestSignIn && (
            <button
              id="guest-sign-in-cta-btn"
              disabled={isSigningIn || isGuestSigningIn || authLoading}
              onClick={handleGuestSignInClick}
              className="w-full sm:w-auto px-6 py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Feather className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{isGuestSigningIn ? 'Starting...' : 'Instant Guest Reflection'}</span>
            </button>
          )}
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto pt-8 border-t border-stone-200/80 dark:border-stone-800">
          <div className="p-6 glass-panel rounded-3xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {t('dataIsolationTitle')}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('dataIsolationDesc')}
            </p>
          </div>

          <div className="p-6 glass-panel rounded-3xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {t('socraticAiTitle')}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('socraticAiDesc')}
            </p>
          </div>

          <div className="p-6 glass-panel rounded-3xl space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Feather className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              {t('insightsArcTitle')}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              {t('insightsArcDesc')}
            </p>
          </div>
        </div>

        {/* Contemplation Starters Preview */}
        <div className="mt-14 text-left max-w-4xl mx-auto">
          <h4 className="text-xs uppercase font-semibold text-stone-500 dark:text-stone-400 tracking-wider mb-3 flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Sample Reflection Inquiries</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {samplePrompts.map((p, idx) => (
              <div key={idx} className="p-4 glass-panel rounded-2xl text-xs space-y-1.5">
                <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md">
                  {p.mood}
                </span>
                <p className="text-stone-700 dark:text-stone-300 italic pt-1">&ldquo;{p.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-200/80 dark:border-stone-800 py-6 px-4 text-center text-xs text-stone-500 dark:text-stone-400">
        <p>MindReflect &bull; Secure Multi-Lingual AI Journaling &bull; Cloud Firestore &bull; Gemini 3.6 Flash</p>
      </footer>
    </div>
  );
};
