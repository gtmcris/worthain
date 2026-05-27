import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { collection, query, where, getDocs, doc, updateDoc, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vocabulary } from '../types';
import { Button, Card } from '../components/UI';
import { X, Check, RotateCcw, ChevronLeft, Brain, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate, Link } from 'react-router-dom';
import { incrementDailyGoal } from '../lib/dailyGoal';
import { recordStreakActivity } from '../lib/streak';

export function FlashcardsPage() {
  const { user } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Session stats
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  useEffect(() => {
    if (user) fetchCards();
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;
    const q = query(
      collection(db, 'vocabularies'),
      where('userId', '==', user.uid),
      where('status', 'in', ['learning', 'favorite'])
    );
    const querySnapshot = await getDocs(q);
    const words = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vocabulary));
    setCards(words.sort(() => Math.random() - 0.5).slice(0, 20));
    setLoading(false);
  };

  const handleResult = async (result: 'easy' | 'good' | 'hard' | 'again') => {
    if (!user || !cards[currentIndex]) return;

    const vocabId = cards[currentIndex].id!;
    const masteryDelta = result === 'easy' ? 10 : result === 'good' ? 5 : result === 'hard' ? -2 : -5;

    await updateDoc(doc(db, 'vocabularies', vocabId), {
      mastery: increment(masteryDelta),
      updatedAt: serverTimestamp()
    });

    await addDoc(collection(db, 'practice_logs'), {
      userId: user.uid,
      vocabId,
      result,
      timestamp: serverTimestamp()
    });

    await incrementDailyGoal(user.uid);
    await recordStreakActivity(user.uid);

    setSessionTotal(prev => prev + 1);
    if (result === 'easy' || result === 'good') {
      setSessionCorrect(prev => prev + 1);
    }

    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/stats');
    }
  };

  if (loading) return null;

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (cards.length === 0) return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-900 flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-indigo-300 dark:text-indigo-500 mb-6 rotate-12">
        <Brain size={40} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('cards.empty')}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-[260px]">{t('cards.empty_sub')}</p>

      <div className="space-y-3 w-full max-w-[280px]">
        <Link to="/search">
          <Button className="w-full justify-center">
            <Search size={18} />
            {t('cards.find')}
          </Button>
        </Link>
      </div>
    </div>
  );

  const currentWord = cards[currentIndex];

  // ── Main Flashcard View ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-900 pb-40">
      <header className="px-6 pt-16 pb-8 sticky top-0 bg-[#F1F3F6]/80 dark:bg-slate-900/80 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <p className="text-xs font-black text-blue-600 uppercase tracking-ultra mb-0.5">{t('cards.session')}</p>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{currentIndex + 1} / {cards.length}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sessionTotal > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black tracking-ultra">
                {sessionCorrect}/{sessionTotal} ✓
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="px-8 mt-8 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* ── Flip Card ── */}
          <div className="w-full max-w-sm perspective-1000 aspect-[4/5] relative">
            <motion.div
              key={currentIndex}
              initial={{ x: 300, opacity: 0, rotate: 10 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              exit={{ x: -300, opacity: 0, rotate: -10 }}
              className="w-full h-full relative cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div
                className="w-full h-full relative preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="absolute inset-0 backface-hidden p-8 flex flex-col justify-center items-center text-center">
                  <span className="bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest absolute top-8">
                    {t('cards.german')}
                  </span>
                  <h2 className={cn(
                    "font-bold text-slate-900 dark:text-white break-words w-full px-4",
                    currentWord.term.length > 25 ? 'text-2xl' : currentWord.term.length > 15 ? 'text-3xl' : 'text-4xl'
                  )}>
                    {currentWord.term}
                  </h2>
                  <p className="text-sm font-bold text-slate-400 mt-2">{currentWord.level} • {currentWord.grammar?.type}</p>

                  <div className="absolute bottom-8 flex flex-col items-center gap-2">
                    <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <RotateCcw size={20} className="text-slate-300" />
                    </motion.div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('cards.tap')}</p>
                  </div>
                </Card>

                <Card
                  className="absolute inset-0 backface-hidden p-8 flex flex-col justify-center items-center text-center"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <span className="bg-emerald-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest absolute top-8">
                    {t('cards.translation')}
                  </span>
                  <h2 className={cn(
                    "font-bold text-blue-600 dark:text-blue-400 break-words w-full px-4",
                    currentWord.translation.length > 25 ? 'text-xl' : currentWord.translation.length > 15 ? 'text-2xl' : 'text-3xl'
                  )}>
                    {currentWord.translation}
                  </h2>
                  {currentWord.meaning && (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4 leading-relaxed max-w-[280px]">
                      {currentWord.meaning}
                    </p>
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </AnimatePresence>

        {/* Rating Buttons */}
        <div className="mt-16 w-full max-w-sm flex gap-4">
          <Button
            variant="outline"
            className="flex-1 bg-white dark:bg-slate-800 border-none shadow-lg shadow-rose-100/30 dark:shadow-none text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            onClick={() => handleResult('again')}
          >
            <RotateCcw size={20} />
            {t('cards.again')}
          </Button>
          <Button
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200/50 dark:shadow-none border-none text-white"
            onClick={() => handleResult('easy')}
          >
            <Check size={20} />
            {t('cards.mastered')}
          </Button>
        </div>
      </main>
    </div>
  );
}
