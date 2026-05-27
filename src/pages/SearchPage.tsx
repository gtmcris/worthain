import React, { useState, useEffect, useMemo } from 'react';
import { Card, Input, Button } from '../components/UI';
import { Search as SearchIcon, Star, ChevronRight, Loader2, Plus, X, BookOpen, Trash2, Check, Languages, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImportModal } from '../components/ImportModal';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Link, useLocation } from 'react-router-dom';
import { incrementDailyGoal } from '../lib/dailyGoal';
import { cn } from '../lib/utils';
import { syncTotalWords } from '../lib/stats';
import { recordStreakActivity } from '../lib/streak';
import { determineCEFRLevel } from '../services/cefrService';
import { translateWord, TranslateResult } from '../services/translateService';

// ─── Smart search scoring ────────────────────────────────────────────────────
// Returns a relevance score. Higher = more relevant. 0 = no match.
function scoreWord(word: any, q: string): number {
  const norm = (s?: string) => (s || '').toLowerCase().trim();
  const lq = q.toLowerCase().trim();
  if (!lq) return 1; // empty query → show everything

  const term = norm(word.term);
  const translation = norm(word.translation);
  const meaning = norm(word.meaning);

  // Exact match
  if (term === lq) return 100;
  if (translation === lq) return 90;

  // Starts with
  if (term.startsWith(lq)) return 80;
  if (translation.startsWith(lq)) return 70;

  // Contains – term / translation / meaning
  if (term.includes(lq)) return 60;
  if (translation.includes(lq)) return 50;
  if (meaning.includes(lq)) return 30;

  // Word-boundary match in meaning / translation (any token starts with query)
  const tokens = (s: string) => s.split(/\s+/);
  if (tokens(translation).some(t => t.startsWith(lq))) return 45;
  if (tokens(meaning).some(t => t.startsWith(lq))) return 25;

  return 0;
}

// Highlight matching substring inside a string
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lq = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(lq);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-indigo-100 text-indigo-700 rounded px-0.5 not-italic font-bold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────
const TAB_KEYS = ['all', 'learning', 'mastered', 'favorites'] as const;
type TabKey = typeof TAB_KEYS[number];

const TAB_STATUS: Record<TabKey, string | null> = {
  all: null,
  learning: 'learning',
  mastered: 'mastered',
  favorites: 'favorite',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function SearchPage() {
  const { user } = useAuth();
  const { t } = useSettings();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [allWords, setAllWords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);

  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Translate lookup state
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateResult, setTranslateResult] = useState<TranslateResult | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [savingTranslate, setSavingTranslate] = useState(false);

  // Manual add state
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newWord, setNewWord] = useState({
    term: '', translation: '', meaning: '',
    level: 'A1', grammarType: 'noun', genus: '',
  });

  const [showImportModal, setShowImportModal] = useState(false);

  const handleBulkImport = async (words: { term: string; translation: string; meaning: string }[]) => {
    if (!user) return;
    try {
      // Loop over words and save
      for (const w of words) {
        const cefrResult = determineCEFRLevel(w.term);
        await addDoc(collection(db, 'vocabularies'), {
          term: w.term,
          translation: w.translation,
          meaning: w.meaning || '',
          level: cefrResult.level,
          cefrConfidence: cefrResult.confidence,
          grammar: { type: '' }, // generic fallback
          exampleSentences: [],
          userId: user.uid,
          status: 'learning',
          mastery: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          source: 'import',
        });
      }
      
      // Update stats once
      await syncTotalWords(user.uid);
      await recordStreakActivity(user.uid);
      fetchSavedWords();
    } catch (err) {
      console.error('Failed to bulk import:', err);
      throw err; // throw so modal shows error
    }
  };

  // ── Fetch all saved words & re-fetch when returning from detail page ────
  const fetchSavedWords = async () => {
    if (!user) return;
    const q = query(collection(db, 'vocabularies'), where('userId', '==', user.uid));
    const snap = await getDocs(q);
    setAllWords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    if (user) fetchSavedWords();
  }, [user, location.pathname]);

  // Re-fetch when tab/page becomes visible again (e.g. returning from WordDetailPage)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchSavedWords();
      }
    };
    const handleFocus = () => {
      if (user) fetchSavedWords();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const handleDelete = async (wordId: string) => {
    try {
      await deleteDoc(doc(db, 'vocabularies', wordId));
      setAllWords(prev => prev.filter(w => w.id !== wordId));
      await syncTotalWords(user!.uid);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setPendingDelete(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!user || allWords.length === 0) return;
    setIsDeletingAll(true);
    try {
      const batch = writeBatch(db);
      allWords.forEach(word => {
        batch.delete(doc(db, 'vocabularies', word.id));
      });
      await batch.commit();
      
      setAllWords([]);
      setShowDeleteAllConfirm(false);
      await syncTotalWords(user.uid);
    } catch (err) {
      console.error('Delete all failed:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  // ── Smart filtered + sorted list ─────────────────────────────────────────
  const TAB_LABELS: Record<TabKey, string> = {
    all: t('search.tab_all'),
    learning: t('search.tab_learning'),
    mastered: t('search.tab_mastered'),
    favorites: t('search.tab_favorites'),
  };

  const filteredWords = useMemo(() => {
    const statusFilter = TAB_STATUS[activeTab];

    return allWords
      .filter(w => !statusFilter || w.status === statusFilter)
      .map(w => ({ word: w, score: scoreWord(w, searchTerm) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ word }) => word);
  }, [allWords, searchTerm, activeTab]);

  const hasQuery = searchTerm.trim().length > 0;
  const noLocalResults = hasQuery && filteredWords.length === 0;

  // ── Google Translate Lookup ──────────────────────────────────────────────
  const handleTranslateLookup = async () => {
    if (!searchTerm.trim()) return;
    setTranslateLoading(true);
    setTranslateResult(null);
    setTranslateError(null);
    try {
      const result = await translateWord(searchTerm.trim());
      setTranslateResult(result);
    } catch (err: any) {
      console.error('Translation error:', err);
      if (err?.message?.includes('No translation found')) {
        setTranslateError(
          `${t('search.no_translation_detail').replace('.', '')} — „${searchTerm.trim()}"` 
        );
      } else {
        setTranslateError(t('search.network_error'));
      }
    } finally {
      setTranslateLoading(false);
    }
  };

  const saveTranslatedWord = async () => {
    if (!user || !translateResult) return;
    setSavingTranslate(true);
    try {
      // Always save: term = German word, translation = English word
      const germanWord = translateResult.direction === 'en-de' ? translateResult.translation : translateResult.term;
      const englishWord = translateResult.direction === 'en-de' ? translateResult.term : translateResult.translation;
      
      const cefrResult = determineCEFRLevel(germanWord);

      await addDoc(collection(db, 'vocabularies'), {
        term: germanWord,
        translation: englishWord,
        meaning: '',
        level: cefrResult.level,
        cefrConfidence: cefrResult.confidence,
        grammar: { type: '' },
        exampleSentences: [],
        userId: user.uid,
        status: 'learning',
        mastery: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: 'translate',
      });
      await incrementDailyGoal(user.uid);
      await syncTotalWords(user.uid);
      await recordStreakActivity(user.uid);
      setTranslateResult(null);
      setSearchTerm('');
      fetchSavedWords();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTranslate(false);
    }
  };

  // ── Manual Add ───────────────────────────────────────────────────────────
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWord.term.trim()) return;
    try {
      await addDoc(collection(db, 'vocabularies'), {
        term: newWord.term.trim(),
        translation: newWord.translation.trim(),
        meaning: newWord.meaning.trim(),
        level: newWord.level,
        grammar: { type: newWord.grammarType, genus: newWord.genus.trim() },
        userId: user.uid,
        status: 'learning',
        mastery: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: 'manual',
      });
      await incrementDailyGoal(user.uid);
      await syncTotalWords(user.uid);
      await recordStreakActivity(user.uid);
      setNewWord({ term: '', translation: '', meaning: '', level: 'A1', grammarType: 'noun', genus: '' });
      setShowManualAdd(false);
      fetchSavedWords();
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-900 pb-40">
      {/* ── Header ── */}
      <header className="px-8 pt-16 pb-6 sticky top-0 bg-[#F1F3F6]/80 dark:bg-slate-900/80 backdrop-blur-xl z-20 transition-colors">
        <div className="flex items-center gap-2 pl-2 mb-6">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
          <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-ultra">Wort Finder</p>
        </div>

        {/* Search bar */}
        <div className="relative z-10">
          <SearchIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full h-14 pl-14 pr-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg shadow-indigo-100/20 dark:shadow-none border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white font-medium placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setTranslateResult(null); setTranslateError(null); }}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setTranslateResult(null); setTranslateError(null); }}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 hover:text-slate-500 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar py-4">
          {TAB_KEYS.map(key => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'whitespace-nowrap px-5 py-2 text-[10px] font-black uppercase tracking-ultra rounded-full transition-all',
                activeTab === key
                  ? 'text-indigo-600 bg-white dark:bg-slate-800 shadow-sm border border-indigo-50 dark:border-slate-700'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 mt-4 space-y-6">
        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider whitespace-nowrap flex-shrink-0">
            {hasQuery ? t('search.results') : t('search.all_vocab')}
            <span className="text-slate-300 dark:text-slate-600 font-normal ml-1">({filteredWords.length})</span>
          </h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            {allWords.length > 0 && (
              <button 
                onClick={() => setShowDeleteAllConfirm(true)}
                title="Delete all words"
                className="w-10 h-10 flex-shrink-0 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 flex items-center justify-center transition-colors mr-1"
              >
                <Trash2 size={18} />
              </button>
            )}
            <Button variant="secondary" onClick={() => setShowImportModal(true)} className="h-10 px-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 flex-shrink-0 whitespace-nowrap">
              <Upload size={16} className="mr-2" />
              Import
            </Button>
            <Button variant="secondary" onClick={() => setShowManualAdd(v => !v)} className="h-10 px-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 flex-shrink-0 whitespace-nowrap">
              <Plus size={16} className="mr-2" />
              {t('search.add_word')}
            </Button>
          </div>
        </div>

        {/* ── Manual Add Form ── */}
        <AnimatePresence>
          {showManualAdd && (
            <motion.div key="manual" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Card className="border-none shadow-xl shadow-indigo-100/30 p-5 space-y-4 dark:bg-slate-800">
                <form onSubmit={handleManualAdd} className="space-y-4">
                  <Input placeholder="Wort" value={newWord.term} onChange={e => setNewWord(p => ({ ...p, term: e.target.value }))} className="dark:bg-slate-900" />
                  <Input placeholder="Übersetzung" value={newWord.translation} onChange={e => setNewWord(p => ({ ...p, translation: e.target.value }))} className="dark:bg-slate-900" />
                  <Input placeholder="Bedeutung" value={newWord.meaning} onChange={e => setNewWord(p => ({ ...p, meaning: e.target.value }))} className="dark:bg-slate-900" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Niveau (A1, A2…)" value={newWord.level} onChange={e => setNewWord(p => ({ ...p, level: e.target.value }))} className="dark:bg-slate-900" />
                    <Input placeholder="Wortart" value={newWord.grammarType} onChange={e => setNewWord(p => ({ ...p, grammarType: e.target.value }))} className="dark:bg-slate-900" />
                  </div>
                  <Input placeholder="Genus (optional)" value={newWord.genus} onChange={e => setNewWord(p => ({ ...p, genus: e.target.value }))} className="dark:bg-slate-900" />
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1">Hinzufügen</Button>
                    <Button type="button" variant="secondary" onClick={() => setShowManualAdd(false)} className="flex-1 dark:bg-slate-900">Abbrechen</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── No local results → Translate prompt ── */}
        <AnimatePresence>
          {noLocalResults && !translateLoading && !translateResult && (
            <motion.div key="noresults" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Card className="border-none shadow-lg shadow-indigo-100/20 p-6 flex flex-col items-center text-center space-y-4 dark:bg-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-400">
                  <Languages size={28} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">„{searchTerm}" {t('search.not_in_vault')}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{t('search.translate_prompt')}</p>
                </div>
                <Button onClick={handleTranslateLookup} className="w-full flex items-center justify-center gap-2">
                  <Languages size={16} />
                  {t('search.translate_btn')}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Translate Loading ── */}
        <AnimatePresence>
          {translateLoading && (
            <motion.div key="transloading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-indigo-600 space-y-5">
              <div className="relative w-14 h-14">
                <Loader2 className="animate-spin absolute inset-0" size={56} strokeWidth={1.5} />
                <Languages className="absolute inset-0 m-auto text-indigo-300 animate-pulse" size={22} />
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-ultra mt-1">{t('search.translating')} „{searchTerm}"…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Translate Error ── */}
        <AnimatePresence>
          {translateError && (
            <motion.div key="transerr" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/50 p-5 space-y-2">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">⚠️ {t('search.no_translation')}</p>
                <p className="text-sm text-amber-600/80 dark:text-amber-400/70 leading-relaxed">{translateError}</p>
                <p className="text-xs text-amber-500/60 dark:text-amber-500/50 font-medium">{t('search.add_tip')}</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Translate Result ── */}
        <AnimatePresence>
          {translateResult && !translateLoading && (
            <motion.div key="transresult" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="border-none shadow-xl shadow-indigo-100/30 overflow-hidden dark:bg-slate-800">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{translateResult.term}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-1">
                      <Languages size={12} /> {translateResult.direction === 'en-de' ? t('search.direction_en_de') : t('search.direction_de_en')}
                    </p>
                  </div>
                  <button onClick={() => setTranslateResult(null)} className="text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="h-px w-full bg-slate-50 dark:bg-slate-700 mb-5" />

                <div className="space-y-2 mb-6">
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{translateResult.translation}</p>
                </div>

                <Button onClick={saveTranslatedWord} disabled={savingTranslate} className="w-full flex items-center justify-center gap-2">
                  {savingTranslate ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {t('search.save_vault')}
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Word List ── */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredWords.map(word => {
              const isArmed = pendingDelete === word.id;
              return (
                <motion.div
                  key={word.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <Card
                    className={cn(
                      'py-4 px-6 flex items-center justify-between group mb-0 transition-colors duration-200 dark:bg-slate-800 dark:border-none',
                      isArmed ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : ''
                    )}
                  >
                    {/* Word info — tappable to open modal */}
                    <div
                      className="space-y-0.5 min-w-0 flex-1 mr-3 cursor-pointer"
                      onClick={e => {
                        if (isArmed) {
                          e.preventDefault();
                        } else {
                          setSelectedWord(word);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 max-w-full">
                        <h4 className={cn(
                          'font-bold truncate', 
                          word.term.length > 25 ? 'text-xs' : word.term.length > 15 ? 'text-sm' : 'text-base',
                          isArmed ? 'text-red-700' : 'text-slate-800 dark:text-slate-200'
                        )}>
                          <Highlight text={word.term} query={searchTerm} />
                        </h4>
                        {word.status === 'favorite' && <Star size={13} className="fill-amber-400 text-amber-400 flex-shrink-0" />}
                        {word.status === 'mastered' && (
                          <span className="text-[9px] font-black uppercase tracking-ultra bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">{t('search.mastered')}</span>
                        )}
                      </div>
                      <p className={cn('text-sm truncate', isArmed ? 'text-red-400' : 'text-slate-500 dark:text-slate-400')}>
                        {isArmed ? t('search.delete_word') : <Highlight text={word.translation} query={searchTerm} />}
                      </p>
                      {!isArmed && word.meaning && searchTerm && word.meaning.toLowerCase().includes(searchTerm.toLowerCase()) && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          <Highlight text={word.meaning} query={searchTerm} />
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isArmed ? (
                        <>
                          {/* Cancel */}
                          <button
                            onClick={() => setPendingDelete(null)}
                            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                          >
                            <X size={16} />
                          </button>
                          {/* Confirm delete */}
                          <button
                            onClick={() => handleDelete(word.id)}
                            className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-md shadow-red-100"
                          >
                            <Check size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] uppercase font-bold text-slate-300 dark:text-slate-600">{t('search.level')} {word.level}</span>
                          {/* Arm delete */}
                          <button
                            onClick={e => { e.preventDefault(); setPendingDelete(word.id); }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={15} />
                          </button>
                          <ChevronRight size={16} className="text-slate-200 dark:text-slate-600 group-hover:text-indigo-600 transition-colors" />
                        </>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty state (no words in vault at all) */}
          {!hasQuery && allWords.length === 0 && (
            <Card className="flex flex-col items-center justify-center py-20 bg-transparent border-dashed border-2 border-slate-200 dark:border-slate-700 shadow-none">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-300 dark:text-slate-500">
                <SearchIcon size={32} />
              </div>
              <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-1">{t('search.empty')}</h3>
              <p className="text-slate-400 text-sm text-center px-8">{t('search.empty_sub')}</p>
            </Card>
          )}
        </div>
      </main>

      {/* ── Word Details Modal ── */}
      <AnimatePresence>
        {selectedWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setSelectedWord(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="min-w-0 pr-4">
                    <h3 className={cn(
                      "font-black text-slate-900 tracking-tight leading-none mb-2 break-words",
                      selectedWord.term.length > 25 ? 'text-xl' : selectedWord.term.length > 15 ? 'text-2xl' : 'text-4xl'
                    )}>
                      {selectedWord.term}
                    </h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                      {selectedWord.grammar?.type}{selectedWord.grammar?.genus ? `, ${selectedWord.grammar.genus}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="h-px w-full bg-slate-100" />

                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-black text-indigo-600 mb-1">{selectedWord.translation}</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{selectedWord.meaning}</p>
                  </div>

                  <div className="flex gap-3">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-xs font-black tracking-ultra">
                      {t('search.level')} {selectedWord.level}
                    </span>
                    {selectedWord.status === 'favorite' && (
                      <span className="bg-amber-50 text-amber-500 px-3 py-1 rounded-xl text-xs font-black tracking-ultra flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> {t('search.favorite')}
                      </span>
                    )}
                  </div>

                  {selectedWord.exampleSentences && selectedWord.exampleSentences.length > 0 && (
                    <div className="mt-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-sm font-bold text-slate-700 italic">
                        „{selectedWord.exampleSentences[0].de}"
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        {selectedWord.exampleSentences[0].en}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link to={`/word/${selectedWord.id}`}>
                    <Button className="w-full">
                      {t('search.full_details')}
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
      />

      {/* ── Delete All Confirmation Modal ── */}
      <AnimatePresence>
        {showDeleteAllConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setShowDeleteAllConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-2">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Everything?</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to delete <strong>all {allWords.length} words</strong> in your vault? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-4">
                <Button 
                  onClick={() => setShowDeleteAllConfirm(false)}
                  disabled={isDeletingAll}
                  className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 border-none"
                >
                  {isDeletingAll ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Delete All"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
