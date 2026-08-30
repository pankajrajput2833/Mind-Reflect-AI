import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Compass, 
  Heart, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  RefreshCw, 
  Calendar, 
  BookOpen, 
  Flame,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import type { CrossSessionTrendsAnalysis, SuggestedReflection } from '../types';

interface TrendsAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trends: CrossSessionTrendsAnalysis | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSelectPromptForNewSession: (prompt: string, category: string) => void;
  sessionCount: number;
}

type TabType = 'overview' | 'themes' | 'growth' | 'prompts' | 'goals';

export const TrendsAnalyticsModal: React.FC<TrendsAnalyticsModalProps> = ({
  isOpen,
  onClose,
  trends,
  isLoading,
  onRefresh,
  onSelectPromptForNewSession,
  sessionCount
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div 
        id="ai-trends-analytics-modal"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif text-stone-900">
                  Longitudinal AI Trends &amp; Growth
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200/60">
                  Advanced AI
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Synthesizing patterns, emotional shifts, and growth trajectories across {sessionCount} {sessionCount === 1 ? 'reflection' : 'reflections'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="refresh-trends-btn"
              disabled={isLoading || sessionCount === 0}
              onClick={onRefresh}
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
              title="Re-analyze latest journal sessions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-700' : ''}`} />
            </button>
            <button
              id="close-trends-modal-btn"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-stone-200/70 bg-white overflow-x-auto no-scrollbar shrink-0 text-xs">
          {[
            { id: 'overview', label: 'Overview & Arc', icon: Sparkles },
            { id: 'themes', label: 'Recurring Themes', icon: Layers },
            { id: 'growth', label: 'Growth Milestones', icon: Award },
            { id: 'prompts', label: 'Suggested Reflections', icon: Compass },
            { id: 'goals', label: 'Intentions & Goals', icon: Target },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3.5 py-2 font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-800' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-800">
          {isLoading ? (
            <div className="py-20 text-center space-y-4">
              <div className="inline-flex p-4 bg-amber-50 rounded-2xl border border-amber-200 animate-pulse">
                <Sparkles className="w-8 h-8 text-amber-800 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  Analyzing Your Reflection Patterns...
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Gemini AI is examining recurring emotional frequencies, mindset shifts, and milestones across your journal archive.
                </p>
              </div>
            </div>
          ) : sessionCount === 0 ? (
            <div className="py-16 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-semibold text-stone-800 font-serif">No journal entries yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Begin writing a few reflections to unlock longitudinal emotional insights and trend modeling.
              </p>
            </div>
          ) : trends ? (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Synthesis Card */}
                  <div className="p-5 bg-linear-to-br from-amber-50/60 to-stone-50 border border-amber-200/80 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>Longitudinal Synthesis</span>
                    </div>
                    <p className="text-sm sm:text-base font-serif italic text-stone-900 leading-relaxed">
                      &ldquo;{trends.longTermSynthesis}&rdquo;
                    </p>
                  </div>

                  {/* Emotional Trajectory */}
                  <div className="p-5 bg-white border border-stone-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-700" />
                        <span>Emotional State &amp; Evolution</span>
                      </h4>
                      <span className="text-[11px] text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-md font-medium">
                        {trends.timeframeDescription}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-sans">
                      {trends.overallEmotionalTrajectory}
                    </p>
                  </div>

                  {/* Mood Distribution */}
                  {trends.moodDistribution && trends.moodDistribution.length > 0 && (
                    <div className="p-5 bg-white border border-stone-200 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-600" />
                        <span>Observed Mood &amp; Energy Distribution</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        {trends.moodDistribution.map((item, idx) => (
                          <div key={idx} className="p-3 bg-stone-50 border border-stone-200/60 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-stone-800">{item.mood}</span>
                              <span className="text-xs font-bold text-stone-900">{item.percentage}%</span>
                            </div>
                            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-stone-800 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${item.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RECURRING THEMES */}
              {activeTab === 'themes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 font-serif">Patterns &amp; Recurring Themes</h3>
                      <p className="text-xs text-stone-500">Core preoccupations detected across your journal history</p>
                    </div>
                    <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                      {trends.recurringThemes.length} Identified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {trends.recurringThemes.map((theme, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-white border border-stone-200/90 rounded-2xl space-y-2 hover:border-amber-300/80 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm text-stone-900 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{theme.theme}</span>
                          </h4>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                            theme.frequency === 'Core'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}>
                            {theme.frequency}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed font-sans pl-7">
                          {theme.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: GROWTH MILESTONES */}
              {activeTab === 'growth' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 font-serif">Personal Growth &amp; Breakthroughs</h3>
                      <p className="text-xs text-stone-500">Evidence of emotional resilience, adaptability, and mindset evolution</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {trends.growthMilestones.map((item, idx) => (
                      <div key={idx} className="p-4.5 bg-emerald-50/40 border border-emerald-200/70 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                            <Award className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="font-semibold text-xs sm:text-sm text-emerald-950">
                            {item.area}
                          </h4>
                        </div>

                        <div className="space-y-1.5 pl-8 text-xs">
                          <div>
                            <span className="font-semibold text-stone-700">Observed Progress: </span>
                            <span className="text-stone-600">{item.progressNote}</span>
                          </div>
                          <div className="p-2.5 bg-white/90 rounded-xl border border-emerald-200/60 text-emerald-900">
                            <span className="font-semibold">Breakthrough Realization: </span>
                            <span>{item.breakthrough}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SUGGESTED REFLECTIONS */}
              {activeTab === 'prompts' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-serif">Suggested Inquiries for Next Reflections</h3>
                    <p className="text-xs text-stone-500">Tailored prompts crafted from your longitudinal journey</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {trends.suggestedReflections.map((ref, idx) => (
                      <div 
                        key={idx}
                        className="p-4 bg-white border border-stone-200 rounded-2xl space-y-2.5 hover:border-amber-300 transition-all shadow-2xs flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                              {ref.category}
                            </span>
                          </div>
                          <p className="font-serif text-sm font-semibold text-stone-900 leading-snug">
                            &ldquo;{ref.prompt}&rdquo;
                          </p>
                          <p className="text-xs text-stone-500 leading-relaxed font-sans">
                            {ref.whyHelpful}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex justify-end">
                          <button
                            id={`reflect-prompt-btn-${idx}`}
                            onClick={() => {
                              onSelectPromptForNewSession(ref.prompt, ref.category);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            <span>Reflect on this now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: GOALS & INTENTIONS */}
              {activeTab === 'goals' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-serif">Grounded Goals &amp; Next Intentions</h3>
                    <p className="text-xs text-stone-500">Actionable life habits and focus areas suggested by your reflections</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {trends.goalsAndIntentions.map((goal, idx) => (
                      <div key={idx} className="p-4 bg-stone-50 border border-stone-200/90 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-xs sm:text-sm text-stone-900 flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-700" />
                            <span>{goal.goal}</span>
                          </h4>
                          <span className="text-[10px] font-medium text-stone-600 bg-white border border-stone-200 px-2 py-0.5 rounded-md shrink-0">
                            {goal.timeHorizon}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-stone-200/70 text-xs text-stone-700 flex items-start gap-2">
                          <span className="text-emerald-700 font-bold">Suggested First Step:</span>
                          <span>{goal.suggestedFirstStep}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Generated securely via Gemini 3.6 Flash</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
