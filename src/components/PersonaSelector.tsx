import React from 'react';
import { Heart, Brain, Compass, Sparkles } from 'lucide-react';
import type { AIPersona } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PersonaSelectorProps {
  currentPersona: AIPersona;
  onSelectPersona: (persona: AIPersona) => void;
  compact?: boolean;
}

export const PERSONA_CONFIG: Record<
  AIPersona,
  {
    id: AIPersona;
    nameKey: 'personaEmpathetic' | 'personaSocratic' | 'personaMentor';
    descKey: 'personaEmpatheticDesc' | 'personaSocraticDesc' | 'personaMentorDesc';
    icon: React.ElementType;
    colorClasses: {
      bg: string;
      text: string;
      border: string;
      activeBg: string;
      glow: string;
    };
  }
> = {
  empathetic: {
    id: 'empathetic',
    nameKey: 'personaEmpathetic',
    descKey: 'personaEmpatheticDesc',
    icon: Heart,
    colorClasses: {
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800/60',
      activeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 text-rose-900 dark:text-rose-100',
      glow: 'shadow-rose-500/20'
    }
  },
  socratic: {
    id: 'socratic',
    nameKey: 'personaSocratic',
    descKey: 'personaSocraticDesc',
    icon: Brain,
    colorClasses: {
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800/60',
      activeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 text-indigo-900 dark:text-indigo-100',
      glow: 'shadow-indigo-500/20'
    }
  },
  mentor: {
    id: 'mentor',
    nameKey: 'personaMentor',
    descKey: 'personaMentorDesc',
    icon: Compass,
    colorClasses: {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800/60',
      activeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-100',
      glow: 'shadow-amber-500/20'
    }
  }
};

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  currentPersona,
  onSelectPersona,
  compact = false
}) => {
  const { t } = useLanguage();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 p-1 rounded-xl glass-panel">
        {(Object.keys(PERSONA_CONFIG) as AIPersona[]).map((key) => {
          const cfg = PERSONA_CONFIG[key];
          const Icon = cfg.icon;
          const isActive = currentPersona === key;

          return (
            <button
              key={key}
              id={`persona-btn-${key}`}
              onClick={() => onSelectPersona(key)}
              title={`${t(cfg.nameKey)}: ${t(cfg.descKey)}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? `${cfg.colorClasses.activeBg} font-semibold shadow-xs`
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? cfg.colorClasses.text : ''}`} />
              <span>{t(cfg.nameKey)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {(Object.keys(PERSONA_CONFIG) as AIPersona[]).map((key) => {
        const cfg = PERSONA_CONFIG[key];
        const Icon = cfg.icon;
        const isActive = currentPersona === key;

        return (
          <button
            key={key}
            id={`persona-card-${key}`}
            onClick={() => onSelectPersona(key)}
            className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
              isActive
                ? `${cfg.colorClasses.activeBg} ring-2 ring-offset-1 ring-current shadow-md`
                : 'bg-white/60 dark:bg-stone-900/60 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 hover:bg-white dark:hover:bg-stone-800/80'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.colorClasses.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold font-serif tracking-tight">
                  {t(cfg.nameKey)}
                </span>
              </div>
              {isActive && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-current/10">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-400 line-clamp-2">
              {t(cfg.descKey)}
            </p>
          </button>
        );
      })}
    </div>
  );
};
