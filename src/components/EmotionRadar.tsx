import React from 'react';
import { Smile, Sparkles, Heart, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface EmotionOption {
  labelKey: 'moodReflective' | 'moodGrateful' | 'moodCurious' | 'moodOverwhelmed' | 'moodFocused' | 'moodVulnerable' | 'moodJoyful' | 'moodAnxious';
  emoji: string;
  color: string;
  defaultLabel: string;
}

export const EMOTIONS: EmotionOption[] = [
  { labelKey: 'moodReflective', emoji: '🌿', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/60', defaultLabel: 'Reflective' },
  { labelKey: 'moodGrateful', emoji: '✨', color: 'from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-700/60', defaultLabel: 'Grateful' },
  { labelKey: 'moodCurious', emoji: '💡', color: 'from-sky-500/20 to-cyan-500/20 text-sky-700 dark:text-sky-300 border-sky-300/60 dark:border-sky-700/60', defaultLabel: 'Curious' },
  { labelKey: 'moodJoyful', emoji: '☀️', color: 'from-orange-500/20 to-amber-500/20 text-orange-700 dark:text-orange-300 border-orange-300/60 dark:border-orange-700/60', defaultLabel: 'Joyful' },
  { labelKey: 'moodOverwhelmed', emoji: '🌊', color: 'from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300 border-blue-300/60 dark:border-blue-700/60', defaultLabel: 'Overwhelmed' },
  { labelKey: 'moodAnxious', emoji: '⚡', color: 'from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-purple-300 border-purple-300/60 dark:border-purple-700/60', defaultLabel: 'Anxious' },
  { labelKey: 'moodVulnerable', emoji: '🌧️', color: 'from-slate-500/20 to-stone-500/20 text-slate-700 dark:text-slate-300 border-slate-300/60 dark:border-slate-700/60', defaultLabel: 'Vulnerable' },
  { labelKey: 'moodFocused', emoji: '🎯', color: 'from-rose-500/20 to-pink-500/20 text-rose-700 dark:text-rose-300 border-rose-300/60 dark:border-rose-700/60', defaultLabel: 'Focused' },
];

interface EmotionRadarProps {
  selectedMood: string;
  onSelectMood: (mood: string) => void;
}

export const EmotionRadar: React.FC<EmotionRadarProps> = ({
  selectedMood,
  onSelectMood
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-stone-400" />
          {t('currentMood')}
        </span>
        <span className="text-[10px] text-stone-400 italic">
          Helps AI attune to your emotional state
        </span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {EMOTIONS.map((item) => {
          const localizedName = t(item.labelKey) || item.defaultLabel;
          const isSelected = selectedMood === item.defaultLabel || selectedMood === localizedName;

          return (
            <button
              key={item.labelKey}
              id={`emotion-chip-${item.labelKey}`}
              type="button"
              onClick={() => onSelectMood(item.defaultLabel)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? `bg-gradient-to-r ${item.color} font-semibold shadow-xs scale-105 ring-1 ring-current`
                  : 'bg-white/70 dark:bg-stone-800/70 border-stone-200/80 dark:border-stone-700/80 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              <span className="text-sm leading-none">{item.emoji}</span>
              <span>{localizedName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
