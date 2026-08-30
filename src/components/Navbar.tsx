import React from 'react';
import { BookOpen, ShieldCheck, LogOut, Plus, TrendingUp } from 'lucide-react';
import type { UserProfile, AIPersona } from '../types';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewSession: () => void;
  onOpenSecurity: () => void;
  onOpenTrends?: () => void;
  sessionCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewSession,
  onOpenSecurity,
  onOpenTrends,
  sessionCount
}) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-stone-200/80 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
                {t('appName')}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-semibold bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-md border border-stone-300/60 dark:border-stone-700">
                AI Journal
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-300 hidden md:block">
              {t('appTagline')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Selector */}
          <LanguageSelector compact={true} />

          {/* Theme Selector */}
          <ThemeSelector compact={true} />

          {/* AI Trends Button */}
          {user && onOpenTrends && (
            <button
              id="nav-ai-trends-btn"
              onClick={onOpenTrends}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shadow-2xs transition-colors cursor-pointer"
              title="Analyze longitudinal emotional patterns and growth"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden lg:inline">{t('trends')}</span>
            </button>
          )}

          {/* Security & Threat Model Inspector Trigger */}
          <button
            id="nav-security-badge-btn"
            onClick={onOpenSecurity}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
            title="Inspect OWASP Security Architecture & Firestore Isolation"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xl:inline">{t('securityReport')}</span>
          </button>

          {/* New Session Button */}
          {user && (
            <button
              id="nav-new-reflection-btn"
              onClick={onNewSession}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('newEntry')}</span>
            </button>
          )}

          {/* User Profile & Sign Out */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-stone-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User Avatar'}
                  className="w-8 h-8 rounded-full border border-stone-200 dark:border-stone-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden 2xl:block text-left text-xs leading-tight max-w-[120px] truncate">
                <p className="font-semibold text-stone-800 dark:text-stone-200 truncate">{user.displayName || 'Journaler'}</p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">{user.email || ''}</p>
              </div>
              <button
                id="nav-sign-out-btn"
                onClick={onSignOut}
                className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                title="Sign out of Firebase"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
