import React, { useState } from 'react';
import { Sparkles, Check, Copy, Bookmark, X, ArrowRight, HeartHandshake, Lightbulb, Compass, Quote } from 'lucide-react';
import type { SessionInsights } from '../types';

interface SummaryModalProps {
  isOpen: boolean;
  insights: SessionInsights | null;
  isLoading: boolean;
  onClose: () => void;
  onSaveToSession: (summaryText: string) => Promise<void>;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  insights,
  isLoading,
  onClose,
  onSaveToSession
}) => {
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!insights) return;
    const textToCopy = `SESSION SUMMARY & INSIGHTS\n\nSummary:\n${insights.summary}\n\nKey Takeaways:\n${insights.keyTakeaways.map(t => `- ${t}`).join('\n')}\n\nEmotional Arc:\n${insights.emotionalArc}\n\nIntentions & Action Items:\n${insights.actionItems.map(a => `- ${a}`).join('\n')}\n\nQuote:\n"${insights.quoteOfSession}"`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = async () => {
    if (!insights) return;
    setIsSaving(true);
    try {
      await onSaveToSession(insights.summary);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save summary:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div 
        id="session-summary-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 sm:p-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200/60">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-display">Session Summary &amp; Insights</h2>
              <p className="text-xs text-stone-500">Synthesized cognitive patterns and emotional takeaways</p>
            </div>
          </div>
          <button 
            id="close-summary-modal-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-4">
            <div className="inline-flex p-4 bg-stone-50 rounded-full animate-pulse border border-stone-200">
              <Sparkles className="w-8 h-8 text-stone-600 animate-spin" />
            </div>
            <p className="text-sm font-medium text-stone-800 font-display">Synthesizing your thoughts with Gemini AI...</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Analyzing key insights, emotional progression, and actionable takeaways from this session.
            </p>
          </div>
        ) : insights ? (
          <div className="space-y-6 my-6 text-stone-800 text-sm">
            {/* Quote of the session */}
            {insights.quoteOfSession && (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 italic text-stone-700 flex items-start gap-3">
                <Quote className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <p className="font-serif text-base text-stone-800">
                  &ldquo;{insights.quoteOfSession}&rdquo;
                </p>
              </div>
            )}

            {/* Narrative Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 tracking-wide uppercase">
                <Lightbulb className="w-4 h-4 text-amber-700" />
                <span>Executive Summary</span>
              </div>
              <p className="text-stone-700 leading-relaxed bg-amber-50/30 p-4 rounded-xl border border-amber-100">
                {insights.summary}
              </p>
            </div>

            {/* Key Takeaways */}
            {insights.keyTakeaways && insights.keyTakeaways.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 tracking-wide uppercase">
                  <Compass className="w-4 h-4 text-stone-700" />
                  <span>Realized Truths &amp; Takeaways</span>
                </div>
                <ul className="space-y-2">
                  {insights.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-stone-700">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Emotional Arc */}
            {insights.emotionalArc && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 tracking-wide uppercase">
                  <HeartHandshake className="w-4 h-4 text-rose-700" />
                  <span>Emotional Arc</span>
                </div>
                <p className="text-stone-700 p-3 bg-rose-50/40 rounded-xl border border-rose-100 text-xs sm:text-sm">
                  {insights.emotionalArc}
                </p>
              </div>
            )}

            {/* Action Items / Intentions */}
            {insights.actionItems && insights.actionItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 tracking-wide uppercase">
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                  <span>Grounding Intentions &amp; Action Items</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {insights.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-stone-700 text-xs sm:text-sm">
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Modal Actions Footer */}
        <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="copy-summary-btn"
              disabled={isLoading || !insights}
              onClick={handleCopy}
              className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Insights'}</span>
            </button>
            <button
              id="save-summary-to-session-btn"
              disabled={isLoading || !insights || isSaving}
              onClick={handleSave}
              className="px-4 py-2 bg-amber-800 text-white hover:bg-amber-900 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5 text-white" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : savedSuccess ? 'Saved to Session' : 'Save as Session Summary'}</span>
            </button>
          </div>

          <button
            id="close-summary-footer-btn"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-medium rounded-xl hover:bg-stone-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
