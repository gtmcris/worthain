import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vocabulary, CEFRLevel } from '../types';
import { Card, Button, Input } from '../components/UI';
import { ChevronLeft, Star, Edit2, PlayCircle, Save, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const GRAMMAR_TYPES = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'article', 'interjection', ''];
const GENUS_OPTIONS = ['maskulin', 'feminin', 'neutrum', ''];

export function WordDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [word, setWord] = useState<Vocabulary | null>(null);
  const [activeTab, setActiveTab] = useState('übersicht');
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    translation: '',
    meaning: '',
    level: 'A1' as CEFRLevel,
    grammarType: '',
    genus: '',
    plural: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (id) fetchWord();
  }, [id]);

  const fetchWord = async () => {
    const docRef = doc(db, 'vocabularies', id!);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() } as Vocabulary;
      setWord(data);
      setEditData({
        translation: data.translation || '',
        meaning: data.meaning || '',
        level: data.level || 'A1',
        grammarType: data.grammar?.type || '',
        genus: data.grammar?.genus || '',
        plural: data.grammar?.plural || '',
        notes: data.notes || '',
      });
    }
    setLoading(false);
  };

  const toggleFavorite = async () => {
    if (!word || !id) return;
    const newStatus = word.status === 'favorite' ? 'learning' : 'favorite';
    await updateDoc(doc(db, 'vocabularies', id), { status: newStatus });
    setWord({ ...word, status: newStatus });
  };

  const startEditing = () => {
    if (!word) return;
    setEditData({
      translation: word.translation || '',
      meaning: word.meaning || '',
      level: word.level || 'A1',
      grammarType: word.grammar?.type || '',
      genus: word.grammar?.genus || '',
      plural: word.grammar?.plural || '',
      notes: word.notes || '',
    });
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveSuccess(false);
  };

  const saveEdits = async () => {
    if (!id || !word) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'vocabularies', id), {
        translation: editData.translation.trim(),
        meaning: editData.meaning.trim(),
        level: editData.level,
        grammar: {
          type: editData.grammarType,
          genus: editData.genus,
          plural: editData.plural,
        },
        notes: editData.notes.trim(),
        updatedAt: serverTimestamp(),
      });
      // Update local state
      setWord({
        ...word,
        translation: editData.translation.trim(),
        meaning: editData.meaning.trim(),
        level: editData.level,
        grammar: {
          type: editData.grammarType,
          genus: editData.genus as any,
          plural: editData.plural,
        },
        notes: editData.notes.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
      }, 1200);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;
  if (!word) return <div>Word not found</div>;

  const tabs = [
    { id: 'übersicht', label: 'Overview' },
    { id: 'details', label: 'Analysis' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-900 pb-40">
      <header className="px-6 pt-16">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={isEditing ? cancelEditing : startEditing}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                isEditing
                  ? "bg-slate-100 dark:bg-slate-700 text-slate-500"
                  : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500"
              )}
            >
              {isEditing ? <X size={22} /> : <Edit2 size={20} />}
            </button>
            <button onClick={toggleFavorite} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", word.status === 'favorite' ? "bg-amber-50 dark:bg-amber-900/30 text-amber-500" : "bg-white dark:bg-slate-800 text-slate-300 border border-slate-100 dark:border-slate-700")}>
              <Star size={24} fill={word.status === 'favorite' ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{word.term}</h1>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-ultra">
              {word.grammar?.type || 'Wort'}{word.grammar?.genus ? `, ${word.grammar.genus}` : ''}
            </div>
          </div>

          <div className="h-[1px] w-full bg-slate-100/50 dark:bg-slate-800 my-8" />

          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200/50 dark:shadow-none">
              <span className="font-black text-lg">EN</span>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{word.translation}</p>
              {word.meaning && (
                <p className="text-slate-400 text-xs font-medium mt-1">{word.meaning}</p>
              )}
            </div>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-black">{word.level}</span>
          </div>
        </div>

        <div className="flex gap-8 mt-12 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-4 text-[10px] font-black uppercase tracking-ultra whitespace-nowrap transition-all relative",
                activeTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 mt-10">
        <AnimatePresence mode="wait">
          {/* ── Edit Mode ── */}
          {isEditing && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-ultra px-2">Edit Word Details</h3>

              <Card className="p-5 space-y-4 border-none dark:bg-slate-800">
                {/* Translation */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-ultra block mb-1.5">Translation</label>
                  <Input
                    value={editData.translation}
                    onChange={(e) => setEditData({ ...editData, translation: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700"
                    placeholder="English translation"
                  />
                </div>

                {/* Meaning */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-ultra block mb-1.5">Meaning / Definition</label>
                  <textarea
                    value={editData.meaning}
                    onChange={(e) => setEditData({ ...editData, meaning: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-sm font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 resize-none"
                    rows={3}
                    placeholder="Detailed meaning or definition"
                  />
                </div>

                {/* CEFR Level Dropdown */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-ultra block mb-1.5">Niveau (CEFR Level)</label>
                  <div className="grid grid-cols-6 gap-2">
                    {CEFR_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setEditData({ ...editData, level: lvl })}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-black transition-all",
                          editData.level === lvl
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-none"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700"
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grammar Type */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-ultra block mb-1.5">Grammar Type</label>
                  <select
                    value={editData.grammarType}
                    onChange={(e) => setEditData({ ...editData, grammarType: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                  >
                    {GRAMMAR_TYPES.map((type) => (
                      <option key={type} value={type}>{type || '(none)'}</option>
                    ))}
                  </select>
                </div>

                {/* Genus (for nouns) */}
                {editData.grammarType === 'noun' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-ultra block mb-1.5">Genus</label>
                    <div className="grid grid-cols-3 gap-2">
                      {GENUS_OPTIONS.filter(g => g).map((g) => (
                        <button
                          key={g}
                          onClick={() => setEditData({ ...editData, genus: g })}
                          className={cn(
                            "py-2.5 rounded-xl text-xs font-bold transition-all capitalize",
                            editData.genus === g
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-700"
                          )}
                        >
                          {g === 'maskulin' ? 'der' : g === 'feminin' ? 'die' : 'das'} ({g})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plural */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-ultra block mb-1.5">Plural Form</label>
                  <Input
                    value={editData.plural}
                    onChange={(e) => setEditData({ ...editData, plural: e.target.value })}
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700"
                    placeholder="e.g. Hunde"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-ultra block mb-1.5">Personal Notes</label>
                  <textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white text-sm font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 resize-none"
                    rows={3}
                    placeholder="Memory hooks, context notes..."
                  />
                </div>
              </Card>

              <Button
                onClick={saveEdits}
                disabled={saving || saveSuccess}
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  saveSuccess && "bg-emerald-500 hover:bg-emerald-500"
                )}
              >
                {saving ? (
                  'Saving...'
                ) : saveSuccess ? (
                  <>
                    <Check size={18} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* ── Overview Tab ── */}
          {!isEditing && activeTab === 'übersicht' && (
            <motion.div
              key="übersicht"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-ultra px-2">Example Use Cases</h3>
                <div className="space-y-4">
                  {(word.exampleSentences || []).slice(0, 2).map((ex, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-[2.5rem] shadow-sm relative group">
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200 leading-relaxed italic">
                        "{ex.de}"
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-3">{ex.en}</p>
                    </div>
                  ))}
                  {!(word.exampleSentences && word.exampleSentences.length > 0) && (
                    <p className="text-sm text-slate-400 italic px-2">Keine Beispielsätze verfügbar.</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-ultra">Learning Notes</h3>
                  <button onClick={startEditing} className="text-indigo-600 dark:text-indigo-400"><Edit2 size={18} /></button>
                </div>
                <Card className="rounded-[2.5rem] bg-indigo-600 text-white border-none p-8 shadow-xl shadow-indigo-200 dark:shadow-none">
                  <p className="text-sm font-medium italic leading-relaxed opacity-90">
                    {word.notes || "Tap the edit button to add personal memory hooks and notes."}
                  </p>
                </Card>
              </div>
            </motion.div>
          )}

          {/* ── Details Tab ── */}
          {!isEditing && activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-ultra px-2">Linguistic Data</h3>
                <Card className="p-2 space-y-0 shadow-sm border-slate-100 dark:border-slate-700">
                  {[
                    { l: 'Plural', v: word.grammar?.plural || '—' },
                    { l: 'Level', v: word.level },
                    { l: 'Mastery', v: `${word.mastery || 0}%` },
                    { l: 'Status', v: word.status },
                  ].map((row, i) => (
                    <div key={row.l} className={cn("flex justify-between items-center p-6", i < 3 && "border-b border-slate-50 dark:border-slate-800")}>
                      <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-ultra">{row.l}</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white capitalize">{row.v}</span>
                    </div>
                  ))}
                </Card>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-ultra px-2">Level Distribution</h3>
                <div className="h-48 bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-end justify-between gap-4">
                  {CEFR_LEVELS.map(level => (
                    <div key={level} className="flex-1 flex flex-col items-center gap-3">
                      <div
                        className={cn("w-full rounded-full transition-all duration-1000", level === word.level ? "bg-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-none" : "bg-slate-50 dark:bg-slate-700")}
                        style={{ height: level === word.level ? '80%' : '20%' }}
                      />
                      <span className={cn("text-[9px] font-black tracking-ultra", level === word.level ? "text-indigo-600 dark:text-indigo-400" : "text-slate-300 dark:text-slate-600")}>{level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-24 left-0 right-0 px-8 z-40">
        <div className="max-w-md mx-auto">
          <Button
            className="w-full shadow-2xl py-5"
            onClick={() => navigate('/practice')}
          >
            <PlayCircle size={22} className="mr-3" />
            Practice Word
          </Button>
        </div>
      </footer>
    </div>
  );
}
