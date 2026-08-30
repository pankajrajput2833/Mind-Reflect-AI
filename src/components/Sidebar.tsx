import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  MessageSquare, 
  Calendar, 
  Sparkles,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  RotateCcw,
  Heart,
  Brain,
  Compass
} from 'lucide-react';
import type { JournalSession, DateFilterPreset, AIPersona } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  sessions: JournalSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onOpenTrends: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onOpenTrends,
  isOpenMobile,
  onCloseMobile
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('All');
  const [dateFilterPreset, setDateFilterPreset] = useState<DateFilterPreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);
  
  // Renaming state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Deleting confirmation state
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Extract unique mood tags across all sessions
  const allMoodTags = useMemo(() => {
    return Array.from(
      new Set(sessions.flatMap(s => s.moodTags || []))
    ).filter(Boolean);
  }, [sessions]);

  // Filtered list by keyword search, date range, and mood tags
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return sessions.filter(session => {
      // 1. Keyword search (title, snippet, summary, mood tags)
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        session.title.toLowerCase().includes(term) ||
        (session.lastMessageSnippet && session.lastMessageSnippet.toLowerCase().includes(term)) ||
        (session.summary && session.summary.toLowerCase().includes(term)) ||
        (session.moodTags && session.moodTags.some(tag => tag.toLowerCase().includes(term)));
      
      // 2. Mood filter
      const matchesMood = selectedMoodFilter === 'All' || 
        (session.moodTags && session.moodTags.includes(selectedMoodFilter));

      // 3. Date range filter
      let matchesDate = true;
      const sessionDate = session.createdAt || session.updatedAt || now;

      if (dateFilterPreset === '7days') {
        matchesDate = (now - sessionDate) <= 7 * oneDay;
      } else if (dateFilterPreset === '30days') {
        matchesDate = (now - sessionDate) <= 30 * oneDay;
      } else if (dateFilterPreset === '90days') {
        matchesDate = (now - sessionDate) <= 90 * oneDay;
      } else if (dateFilterPreset === 'custom') {
        if (customStartDate) {
          const startMs = new Date(customStartDate).setHours(0, 0, 0, 0);
          if (sessionDate < startMs) matchesDate = false;
        }
        if (customEndDate) {
          const endMs = new Date(customEndDate).setHours(23, 59, 59, 999);
          if (sessionDate > endMs) matchesDate = false;
        }
      }

      return matchesSearch && matchesMood && matchesDate;
    });
  }, [sessions, searchTerm, selectedMoodFilter, dateFilterPreset, customStartDate, customEndDate]);

  const hasActiveFilters = searchTerm !== '' || selectedMoodFilter !== 'All' || dateFilterPreset !== 'all' || customStartDate !== '' || customEndDate !== '';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMoodFilter('All');
    setDateFilterPreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleStartRename = (e: React.MouseEvent, session: JournalSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (editingTitle.trim().length > 0) {
      await onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeletingSessionId(sessionId);
  };

  const handleConfirmDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await onDeleteSession(sessionId);
    setDeletingSessionId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSessionId(null);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getPersonaIcon = (persona?: AIPersona) => {
    switch (persona) {
      case 'socratic':
        return <Brain className="w-3 h-3 text-indigo-500" />;
      case 'mentor':
        return <Compass className="w-3 h-3 text-amber-500" />;
      case 'empathetic':
      default:
        return <Heart className="w-3 h-3 text-rose-500" />;
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col glass-panel border-r border-stone-200/80 dark:border-stone-800 transition-colors">
      {/* Search Header */}
      <div className="p-3 border-b border-stone-200/80 dark:border-stone-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold font-serif tracking-tight text-stone-800 dark:text-stone-200">
            <MessageSquare className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
            <span>{t('history')}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-sans">
              {sessions.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="sidebar-toggle-filters-btn"
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                hasActiveFilters || showFiltersPanel
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title="Toggle date range and mood filters"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>

            <button
              id="sidebar-new-session-btn"
              onClick={() => onNewSession()}
              className="p-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 transition-colors cursor-pointer shadow-xs"
              title={t('newEntry')}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 dark:text-stone-300 pointer-events-none" />
          <input
            id="sidebar-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/80 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50 text-stone-900 dark:text-stone-100 transition-all placeholder:text-stone-600 dark:placeholder:text-stone-300"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFiltersPanel && (
          <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 space-y-2 animate-in fade-in duration-150">
            {/* Date Preset Filter */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                {t('dateRange')}
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'all', label: t('allTime') },
                  { id: '7days', label: t('last7Days') },
                  { id: '30days', label: t('last30Days') },
                  { id: 'custom', label: t('customRange') }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setDateFilterPreset(preset.id as DateFilterPreset)}
                    className={`py-1 px-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer truncate ${
                      dateFilterPreset === preset.id
                        ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300/60 dark:border-amber-700/60'
                        : 'bg-stone-100 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 hover:bg-stone-200/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs */}
            {dateFilterPreset === 'custom' && (
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div>
                  <label className="text-[9px] text-stone-400 block">{t('startDate')}</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full text-[10px] p-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-stone-400 block">{t('endDate')}</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full text-[10px] p-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200"
                  />
                </div>
              </div>
            )}

            {/* Mood Tags Filter */}
            {allMoodTags.length > 0 && (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">
                  {t('moodFilter')}
                </label>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                  <button
                    onClick={() => setSelectedMoodFilter('All')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                      selectedMoodFilter === 'All'
                        ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    All
                  </button>
                  {allMoodTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedMoodFilter(tag)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
                        selectedMoodFilter === tag
                          ? 'bg-amber-600 text-white font-semibold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('resetFilters')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredSessions.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
              <Search className="w-4 h-4" />
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
              {searchTerm || hasActiveFilters ? t('noMatches') : t('noSessions')}
            </p>
            {(searchTerm || hasActiveFilters) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                {t('resetFilters')}
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingSessionId;
            const isDeleting = session.id === deletingSessionId;

            return (
              <div
                key={session.id}
                id={`session-item-${session.id}`}
                onClick={() => {
                  if (!isEditing && !isDeleting) {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }
                }}
                className={`group relative p-2.5 rounded-xl transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-300/80 dark:border-amber-700/80 shadow-2xs'
                    : 'bg-white/40 dark:bg-stone-900/40 border-transparent hover:bg-white/80 dark:hover:bg-stone-800/80 hover:border-stone-200 dark:hover:border-stone-700'
                }`}
              >
                {/* Deleting Confirmation Banner */}
                {isDeleting ? (
                  <div className="p-1 space-y-1.5 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 leading-tight">
                      Delete this reflection?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleConfirmDelete(e, session.id)}
                        className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={handleCancelDelete}
                        className="px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 rounded-lg text-[10px] font-medium hover:bg-stone-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : isEditing ? (
                  /* Editing Mode */
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(e as any, session.id);
                        if (e.key === 'Escape') handleCancelRename(e as any);
                      }}
                      className="w-full text-xs font-serif font-bold p-1 bg-white dark:bg-stone-800 border border-amber-500 rounded-lg focus:outline-hidden text-stone-900 dark:text-stone-100"
                      autoFocus
                    />
                    <button
                      onClick={(e) => handleSaveRename(e, session.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCancelRename}
                      className="p-1 text-stone-400 hover:bg-stone-100 rounded cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  /* Standard Session Item */
                  <div>
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getPersonaIcon(session.persona)}
                        <h4 className="text-xs font-serif font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {session.title || 'Untitled Reflection'}
                        </h4>
                      </div>
                      <span className="text-[10px] text-stone-600 dark:text-stone-300 shrink-0 font-sans">
                        {formatDate(session.updatedAt || session.createdAt)}
                      </span>
                    </div>

                    {session.lastMessageSnippet && (
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-1 mt-0.5">
                        {session.lastMessageSnippet}
                      </p>
                    )}

                    {/* Mood Tags */}
                    {session.moodTags && session.moodTags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {session.moodTags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute right-2 bottom-2 hidden group-hover:flex items-center gap-1 bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs p-0.5 rounded-lg border border-stone-200/80 dark:border-stone-700/80 shadow-2xs">
                      <button
                        onClick={(e) => handleStartRename(e, session)}
                        className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded cursor-pointer"
                        title={t('rename')}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, session.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Growth / AI Trends Trigger */}
      <div className="p-3 border-t border-stone-200/80 dark:border-stone-800">
        <button
          onClick={onOpenTrends}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60 transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold leading-tight">{t('trends')}</div>
              <div className="text-[10px] text-amber-900/80 dark:text-amber-300/80 leading-tight">
                {t('trendsTagline')}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-80 h-full shrink-0 z-10">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-stone-950 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

