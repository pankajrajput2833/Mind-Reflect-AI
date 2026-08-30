import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon, Sparkles, Feather } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import type { AppTheme } from '../types';

interface ThemeOption {
  id: AppTheme;
  nameKey: 'themeZen' | 'themeObsidian' | 'themeLight' | 'themeNeoGlass';
  desc: string;
  icon: React.ElementType;
  colors: {
    bg: string;
    accent: string;
  };
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'zen',
    nameKey: 'themeZen',
    desc: 'Warm cream & terracotta earth tones',
    icon: Feather,
    colors: {
      bg: '#FAF8F5',
      accent: '#C86D51'
    }
  },
  {
    id: 'obsidian',
    nameKey: 'themeObsidian',
    desc: 'Deep midnight charcoal & neon violet glow',
    icon: Moon,
    colors: {
      bg: '#0B0F19',
      accent: '#818CF8'
    }
  },
  {
    id: 'light',
    nameKey: 'themeLight',
    desc: 'Crisp minimalist slate & sky blue',
    icon: Sun,
    colors: {
      bg: '#F8FAFC',
      accent: '#0284C7'
    }
  },
  {
    id: 'neo-glass',
    nameKey: 'themeNeoGlass',
    desc: 'Translucent glass & emerald shimmer',
    icon: Sparkles,
    colors: {
      bg: '#0A0D14',
      accent: '#10B981'
    }
  }
];

export const ThemeSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeThemeObj = THEME_OPTIONS.find((tOpt) => tOpt.id === theme) || THEME_OPTIONS[0];
  const ActiveIcon = activeThemeObj.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="theme-selector-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-stone-100/90 dark:bg-stone-800/90 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer shadow-2xs"
        title="Select App Theme Aesthetic"
      >
        <div 
          className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20 shrink-0" 
          style={{ backgroundColor: activeThemeObj.colors.accent }}
        />
        {!compact && (
          <span className="hidden sm:inline font-medium">
            {t(activeThemeObj.nameKey)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl glass-dropdown z-50 py-1.5 shadow-xl border border-stone-200 dark:border-stone-700 animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
              Visual Aesthetic
            </span>
            <Palette className="w-3 h-3 text-stone-400" />
          </div>
          <div className="py-1">
            {THEME_OPTIONS.map((item) => {
              const isSelected = item.id === theme;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`theme-opt-${item.id}`}
                  onClick={() => {
                    setTheme(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center border border-black/10 dark:border-white/20 shrink-0 shadow-2xs"
                      style={{ backgroundColor: item.colors.bg }}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.colors.accent }}
                      />
                    </div>
                    <div>
                      <div className="font-medium leading-tight flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 opacity-70" />
                        {t(item.nameKey)}
                      </div>
                      <div className="text-[10px] text-stone-600 dark:text-stone-300 leading-tight mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
