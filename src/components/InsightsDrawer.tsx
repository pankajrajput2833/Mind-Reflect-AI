import React from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  Compass, 
  Quote, 
  Copy, 
  Check, 
  Share2, 
  Download,
  Bookmark,
  Calendar
} from 'lucide-react';
import type { SessionInsights, JournalSession, JournalMessage } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface InsightsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: JournalSession | null;
  messages: JournalMessage[];
  insights: SessionInsights | null;
  isLoading: boolean;
  onGenerateSummary: () => void;
}

export const InsightsDrawer: React.FC<InsightsDrawerProps> = ({
  isOpen,
  onClose,
  session,
  messages,
  insights,
  isLoading,
  onGenerateSummary
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyTranscript = () => {
    const text = messages
      .map((m) => `[${m.sender === 'user' ? 'You' : 'Companion'}]\n${m.content}\n`)
      .join('\n');
    
    let fullDoc = `MindReflect Journal: ${session?.title || 'Session'}\n`;
    if (session?.createdAt) {
      fullDoc += `Date: ${new Date(session.createdAt).toLocaleDateString()}\n\n`;
    }
    if (insights?.summary) {
      fullDoc += `SUMMARY:\n${insights.summary}\n\n`;
    }
    fullDoc += `TRANSCRIPT:\n${text}`;

    navigator.clipboard.writeText(fullDoc);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = messages
      .map((m) => `### ${m.sender === 'user' ? '🌿 You' : '✨ Reflection Companion'}\n\n${m.content}\n`)
      .join('\n');

    let md = `# ${session?.title || 'Reflection Session'}\n\n`;
    md += `*Created on ${new Date(session?.createdAt || Date.now()).toLocaleString()}*\n\n`;
    
    if (session?.moodTags && session.moodTags.length > 0) {
      md += `**Mood Tags:** ${session.moodTags.join(', ')}\n\n`;
    }

    if (insights) {
      md += `## 🧠 Session Synthesis\n\n${insights.summary}\n\n`;
      if (insights.quoteOfSession) {
        md += `> "${insights.quoteOfSession}"\n\n`;
      }
      if (insights.keyTakeaways && insights.keyTakeaways.length > 0) {
        md += `### Key Realizations & Truths\n`;
        insights.keyTakeaways.forEach((k) => (md += `- ${k}\n`));
        md += '\n';
      }
      if (insights.actionItems && insights.actionItems.length > 0) {
        md += `### Actionable Micro-Habits & Intentions\n`;
        insights.actionItems.forEach((a) => (md += `- [ ] ${a}\n`));
        md += '\n';
      }
    }

    md += `## Full Conversation\n\n${text}`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(session?.title || 'journal-entry').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 glass-panel border-l border-stone-200/80 dark:border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-serif leading-tight">
              {t('sessionInsights')}
            </h3>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              AI Synthesis &amp; Takeaways
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
            <p className="text-xs text-stone-500 font-medium">
              Synthesizing emotional arc &amp; takeaways...
            </p>
          </div>
        ) : !insights ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-xs mx-auto">
              Generate an intelligent synthesis of your reflection to uncover recurring themes and action steps.
            </p>
            <button
              onClick={onGenerateSummary}
              disabled={messages.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {t('generateSummary')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quote of session */}
            {insights.quoteOfSession && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 relative">
                <Quote className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1 opacity-70" />
                <p className="text-xs font-serif italic text-amber-950 dark:text-amber-100 leading-relaxed">
                  "{insights.quoteOfSession}"
                </p>
              </div>
            )}

            {/* Narrative Summary */}
            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-stone-800 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                {t('summary')}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {insights.summary}
              </p>
            </div>

            {/* Key Takeaways */}
            {insights.keyTakeaways && insights.keyTakeaways.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-stone-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t('keyTakeaways')}
                </h4>
                <ul className="space-y-2">
                  {insights.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {insights.actionItems && insights.actionItems.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200/80 dark:border-stone-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t('actionItems')}
                </h4>
                <ul className="space-y-2">
                  {insights.actionItems.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                      <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-2">
        <button
          onClick={handleCopyTranscript}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : t('copy')}</span>
        </button>

        <button
          onClick={handleDownloadMarkdown}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('exportMarkdown')}</span>
        </button>
      </div>
    </div>
  );
};
