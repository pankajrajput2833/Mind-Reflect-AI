export type SenderRole = 'user' | 'model';

export type AppTheme = 'zen' | 'dark' | 'light' | 'neo-glass' | 'obsidian';

export type AIPersona = 'empathetic' | 'socratic' | 'mentor';

export type SupportedLanguage = 
  | 'en' 
  | 'es' 
  | 'hi' 
  | 'fr' 
  | 'ja' 
  | 'de' 
  | 'zh' 
  | 'ar' 
  | 'pt';

export type TranslationDictionary = Record<string, string>;

export interface UserPreferences {
  theme: AppTheme;
  preferredLanguage: SupportedLanguage;
  defaultPersona: AIPersona;
  updatedAt?: number;
}

export interface JournalMessage {
  id: string;
  sender: SenderRole;
  content: string;
  timestamp: number; // Unix timestamp in ms
  imageUrl?: string; // Multimodal attachment (base64 or URL)
  imageBase64?: string; // Multimodal image data
  persona?: AIPersona;
  moodContext?: string;
  isStreaming?: boolean;
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  language?: SupportedLanguage;
  persona?: AIPersona;
  createdAt: number;
  updatedAt: number;
  summary?: string;
  moodTags: string[];
  messageCount?: number;
  lastMessageSnippet?: string;
}

export interface ActionItemCheck {
  id: string;
  text: string;
  completed: boolean;
}

export interface SessionInsights {
  summary: string;
  keyTakeaways: string[];
  emotionalArc: string;
  actionItems: string[];
  quoteOfSession?: string;
  generatedAt: number;
}

export interface CrossSessionTheme {
  theme: string;
  frequency: string;
  description: string;
  sentiment: 'positive' | 'growth' | 'challenging' | 'neutral';
}

export interface GrowthMilestone {
  area: string;
  progressNote: string;
  breakthrough: string;
}

export interface SuggestedReflection {
  prompt: string;
  whyHelpful: string;
  category: string;
}

export interface PersonalGoalSuggestion {
  goal: string;
  timeHorizon: string;
  suggestedFirstStep: string;
}

export interface MoodDistributionItem {
  mood: string;
  percentage: number;
  count: number;
}

export interface CrossSessionTrendsAnalysis {
  analyzedSessionCount: number;
  timeframeDescription: string;
  overallEmotionalTrajectory: string;
  longTermSynthesis: string;
  recurringThemes: CrossSessionTheme[];
  growthMilestones: GrowthMilestone[];
  suggestedReflections: SuggestedReflection[];
  goalsAndIntentions: PersonalGoalSuggestion[];
  moodDistribution: MoodDistributionItem[];
  generatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ThreatCountermeasure {
  threatZone: string;
  threatDescription: string;
  countermeasure: string;
  owaspMapping: string;
}

export type DateFilterPreset = 'all' | '7days' | '30days' | '90days' | 'custom';

