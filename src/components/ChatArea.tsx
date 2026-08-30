import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { 
  Send, 
  Sparkles, 
  Menu, 
  Edit2, 
  Check, 
  X, 
  Bookmark, 
  Compass, 
  Heart, 
  Smile, 
  AlertTriangle, 
  RefreshCw,
  User,
  Bot,
  Flame,
  ArrowUp,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Brain,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import type { JournalSession, JournalMessage, AIPersona } from '../types';
import { PersonaSelector } from './PersonaSelector';
import { EmotionRadar } from './EmotionRadar';
import { MultimodalAttachment } from './MultimodalAttachment';
import { useLanguage } from '../context/LanguageContext';

interface ChatAreaProps {
  session: JournalSession | null;
  messages: JournalMessage[];
  isLoadingAi: boolean;
  streamingAiText?: string;
  onSendMessage: (text: string, moodContext?: string, imageBase64?: string | null) => Promise<void>;
  onGenerateSummary: () => void;
  onRenameTitle: (newTitle: string) => Promise<void>;
  onChangePersona?: (persona: AIPersona) => Promise<void>;
  onOpenMobileMenu: () => void;
  errorMessage: string | null;
  onRetryLastAction?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  session,
  messages,
  isLoadingAi,
  streamingAiText = '',
  onSendMessage,
  onGenerateSummary,
  onRenameTitle,
  onChangePersona,
  onOpenMobileMenu,
  errorMessage,
  onRetryLastAction
}) => {
  const { t, language } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('Reflective');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Current active persona for this session
  const [activePersona, setActivePersona] = useState<AIPersona>(session?.persona || 'empathetic');

  useEffect(() => {
    if (session?.persona) {
      setActivePersona(session.persona);
    }
  }, [session?.persona]);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Voice speech dictation state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Text-to-Speech audio reading state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAi, streamingAiText]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handlePersonaChange = async (newPersona: AIPersona) => {
    setActivePersona(newPersona);
    if (onChangePersona) {
      await onChangePersona(newPersona);
    }
  };

  // Toggle Voice Dictation (Speech-to-Text)
  const toggleVoiceRecording = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ar' ? 'ar-SA' : language === 'pt' ? 'pt-BR' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setInputText((prev) => (prev ? `${prev.trim()} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  // Toggle Audio Read-Aloud (Text-to-Speech)
  const handleToggleSpeak = (msgId: string, text: string) => {
    if (!window.speechSynthesis) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`~[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : language === 'de' ? 'de-DE' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ar' ? 'ar-SA' : language === 'pt' ? 'pt-BR' : 'en-US';

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };
    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !attachedImage) || isLoadingAi) return;
    const textToSend = inputText.trim();
    const imgToSend = attachedImage;
    
    setInputText('');
    setAttachedImage(null);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage(textToSend || (imgToSend ? 'Attached a photo reflection for exploration.' : ''), selectedMood, imgToSend);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto-expand textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleSaveTitle = async () => {
    if (titleDraft.trim().length > 0) {
      await onRenameTitle(titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  // Dynamic starter prompts
  const starterPrompts = [
    {
      title: '🧠 Mental Bandwidth',
      text: language === 'es' 
        ? "¿Qué está ocupando la mayor parte de mi atención hoy y qué hay debajo?" 
        : language === 'fr' 
        ? "Qu'est-ce qui occupe le plus mon esprit aujourd'hui ?"
        : "What is occupying the most mental bandwidth for me today, and what's beneath that surface?"
    },
    {
      title: '🌿 Mindful Pause',
      text: language === 'es'
        ? "¿Cómo se sienten mi cuerpo y mi mente en este momento de quietud?"
        : language === 'fr'
        ? "Comment mon corps et mon esprit se sentent-ils dans ce moment de calme ?"
        : "How does my body and mind feel right in this quiet moment? What tension can I soften?"
    },
    {
      title: '✨ Small Joys',
      text: language === 'es'
        ? "¿Cuál es un pequeño momento de calidez, gratitud o alegría que noté hoy?"
        : language === 'fr'
        ? "Quel est un moment subtil de chaleur ou de gratitude remarqué aujourd'hui ?"
        : "What is a subtle moment of warmth, gratitude, or micro-joy I noticed today?"
    },
    {
      title: '🧭 Decision Untangling',
      text: language === 'es'
        ? "Tengo una duda o decisión que tomar. Ayúdame a explorar mis valores subyacentes."
        : language === 'fr'
        ? "Je fais face à un choix. Aide-moi à explorer mes valeurs profondes."
        : "I am facing a choice or uncertainty. Help me explore my underlying values and fears around it."
    }
  ];

  if (!session) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center glass-panel">
        <div className="p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs max-w-sm space-y-3 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md">
          <Compass className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-serif text-base font-bold text-stone-900 dark:text-stone-100">
            {t('noSessionTitle')}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
            {t('noSessionDesc')}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full relative overflow-hidden transition-colors">
      {/* Session Top Bar */}
      <div className="glass-panel border-b border-stone-200/80 dark:border-stone-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            id="mobile-sidebar-toggle-btn"
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            title="Open Reflections Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                autoFocus
                className="px-2 py-1 text-sm font-semibold text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50 dark:bg-stone-800 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <button 
                onClick={handleSaveTitle}
                className="p-1 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 rounded-md cursor-pointer"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsEditingTitle(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 truncate">
              <h1 className="font-serif text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                {session.title || 'Untitled Reflection'}
              </h1>
              <button
                id="edit-session-title-btn"
                onClick={() => {
                  setTitleDraft(session.title || '');
                  setIsEditingTitle(true);
                }}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors shrink-0 cursor-pointer"
                title="Edit title"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mood Tag Badges */}
          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
            {session.moodTags && session.moodTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Top Controls: Persona and Generate Summary */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Persona Switcher */}
          <div className="hidden lg:block">
            <PersonaSelector
              currentPersona={activePersona}
              onSelectPersona={handlePersonaChange}
              compact={true}
            />
          </div>

          {/* Generate Summary & Insights CTA */}
          <button
            id="generate-summary-top-btn"
            disabled={messages.length === 0}
            onClick={onGenerateSummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60 transition-all shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Synthesize session into takeaways, emotional trajectory, and quotes"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">{t('sessionInsights')}</span>
            <span className="sm:hidden">Insights</span>
          </button>
        </div>
      </div>

      {/* Error / Feedback Banner */}
      {errorMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {onRetryLastAction && (
            <button
              onClick={onRetryLastAction}
              className="flex items-center gap-1 font-semibold text-rose-900 dark:text-rose-200 hover:underline ml-3 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Conversation / Reflection Feed */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto py-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs border border-amber-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
                {t('beginReflection')}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed font-sans">
                {t('beginReflectionDesc')}
              </p>
            </div>

            {/* Persona Quick Picker for Blank Session */}
            <div className="max-w-md mx-auto pt-2">
              <PersonaSelector
                currentPersona={activePersona}
                onSelectPersona={handlePersonaChange}
              />
            </div>

            {/* Prompt Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(prompt.text);
                    textareaRef.current?.focus();
                  }}
                  className="p-3.5 glass-panel hover:border-amber-500/50 rounded-2xl text-left transition-all hover:shadow-xs group cursor-pointer"
                >
                  <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 mb-1 flex items-center justify-between">
                    <span>{prompt.title}</span>
                    <ArrowUp className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 -rotate-45 transition-opacity" />
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {prompt.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingMessageId === msg.id;
            const isCopied = copiedMessageId === msg.id;

            return (
              <div
                key={msg.id}
                id={`message-bubble-${msg.id}`}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`
                    p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed group relative
                    ${isUser 
                      ? 'bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-br-xs max-w-[88%] sm:max-w-xl shadow-xs' 
                      : 'glass-panel text-stone-800 dark:text-stone-200 rounded-bl-xs max-w-[92%] sm:max-w-2xl shadow-xs font-sans'}
                  `}
                >
                  {/* Multimodal image attached */}
                  {msg.imageBase64 && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 max-w-xs shadow-xs">
                      <img
                        src={msg.imageBase64}
                        alt="Journal photo attachment"
                        className="w-full h-auto object-cover max-h-56"
                      />
                    </div>
                  )}

                  {isUser ? (
                    <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                  ) : (
                    <div className="prose prose-stone dark:prose-invert prose-xs sm:prose-sm max-w-none space-y-2 leading-relaxed">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}

                  <div className={`mt-2.5 pt-1 border-t flex items-center justify-between text-[10px] ${
                    isUser 
                      ? 'text-stone-400 dark:text-stone-600 border-stone-800 dark:border-stone-300' 
                      : 'text-stone-400 border-stone-200/60 dark:border-stone-800'
                  }`}>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {!isUser && (
                      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          id={`listen-msg-${msg.id}`}
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          className={`p-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                            isSpeaking 
                              ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 font-semibold' 
                              : 'hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-500'
                          }`}
                          title={isSpeaking ? t('stopSpeaking') : t('listen')}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              <span className="text-[10px]">{t('stopSpeaking')}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">{t('listen')}</span>
                            </>
                          )}
                        </button>

                        <button
                          id={`copy-msg-${msg.id}`}
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="p-1 rounded-md hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                          title={t('copy')}
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Live Streaming Token Preview / Typing */}
        {isLoadingAi && (
          <div className="flex gap-3 max-w-2xl mr-auto justify-start items-start animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 glass-panel rounded-2xl rounded-bl-xs shadow-xs text-xs text-stone-700 dark:text-stone-300 max-w-2xl">
              {streamingAiText ? (
                <div className="prose prose-stone dark:prose-invert prose-xs leading-relaxed">
                  <Markdown>{streamingAiText}</Markdown>
                  <span className="inline-block w-1.5 h-3.5 bg-amber-500 ml-1 animate-pulse" />
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
                  <span className="font-serif italic text-stone-600 dark:text-stone-400">
                    {t('reflecting')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Workspace & Mood Toolbar */}
      <div className="glass-panel border-t border-stone-200/90 dark:border-stone-800 p-3 sm:p-4 shrink-0 space-y-2.5">
        {/* Mood & Persona Controls */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          <EmotionRadar
            selectedMood={selectedMood}
            onSelectMood={setSelectedMood}
          />

          {/* Dictation status pill */}
          {isListening && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[10px] font-semibold animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>{t('listening')}</span>
            </div>
          )}
        </div>

        {/* Textarea, Multimodal and Action buttons */}
        <div className="flex flex-col bg-stone-100/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-amber-500/50 focus-within:bg-white dark:focus-within:bg-stone-900 transition-all">
          <textarea
            id="journal-input-textarea"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={t('writeReflection')}
            className="w-full max-h-44 p-2 bg-transparent text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 resize-none focus:outline-hidden font-sans"
          />

          {/* Attachment Preview */}
          {attachedImage && (
            <div className="px-2 pb-1">
              <MultimodalAttachment
                imagePreview={attachedImage}
                onImageSelected={setAttachedImage}
              />
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 dark:border-stone-800/50 mt-1">
            <div className="flex items-center gap-1">
              <MultimodalAttachment
                imagePreview={attachedImage}
                onImageSelected={setAttachedImage}
                disabled={isLoadingAi}
              />

              {/* Voice talks dictation button */}
              <button
                id="voice-dictation-btn"
                type="button"
                onClick={toggleVoiceRecording}
                className={`p-2 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse ring-2 ring-rose-300'
                    : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                }`}
                title={isListening ? t('stopSpeaking') : t('voiceDictation')}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] text-stone-400">
                Shift + Enter for new line
              </span>

              <button
                id="send-reflection-btn"
                disabled={(!inputText.trim() && !attachedImage) || isLoadingAi}
                onClick={handleSend}
                className="p-2.5 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs shrink-0 cursor-pointer"
                title={t('send')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
          <span>{t('securityBadge')}</span>
          <span className="hidden sm:inline">Streaming with Gemini 3.6 Flash</span>
        </div>
      </div>
    </main>
  );
};
