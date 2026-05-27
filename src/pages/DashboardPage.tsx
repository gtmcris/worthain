import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Card, Button } from '../components/UI';
import { Book, GraduationCap, Flame, TrendingUp, ChevronRight, LayoutGrid, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { collection, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

// ── Real-time stats hook ──────────────────────────────────────────────────────
export function useDashboardStats(userId?: string) {
  const [stats, setStats] = useState({
    vocabCount: 0,
    learningCount: 0,
    streak: 0,
    goal: 10,
    dailyCompleted: 0,
  });
  const [correctPercent, setCorrectPercent] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    const vocabQuery = query(
      collection(db, 'vocabularies'),
      where('userId', '==', userId)
    );

    const unsubscribeVocab = onSnapshot(vocabQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      setStats((prev) => ({
        ...prev,
        vocabCount: snapshot.size,
        learningCount: docs.filter(d => d.status === 'learning').length,
      }));
    });

    const userRef = doc(db, 'users', userId);

    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const s = docSnap.data().stats || {};

      setStats((prev) => ({
        ...prev,
        streak: s.streak ?? 0,
        goal: s.dailyWordsGoal ?? 10,
        dailyCompleted: s.dailyWordsCompleted ?? 0,
      }));
    });

    // Fetch correct % from practice_logs (one-time, not real-time)
    const fetchCorrectPercent = async () => {
      try {
        const logQ = query(collection(db, 'practice_logs'), where('userId', '==', userId));
        const logSnap = await getDocs(logQ);
        if (logSnap.size > 0) {
          const correct = logSnap.docs.filter(d => {
            const r = d.data().result;
            return r === 'easy' || r === 'good';
          }).length;
          setCorrectPercent(Math.round((correct / logSnap.size) * 100));
        }
      } catch { /* ignore */ }
    };
    fetchCorrectPercent();

    return () => {
      unsubscribeVocab();
      unsubscribeUser();
    };
  }, [userId]);

  return { ...stats, correctPercent };
}

// ── Aurora Background Component ─────────────────────────────────────────────
const AuroraBackground = () => (
  <div className="absolute top-0 left-0 right-0 h-80 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 opacity-40 dark:opacity-60">
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: ['0%', '10%', '0%'], y: ['0%', '5%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[30%] -left-[10%] w-[60%] h-[150%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] opacity-70 bg-emerald-400 dark:bg-emerald-600"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], x: ['0%', '-10%', '0%'], y: ['0%', '-10%', '0%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[10%] left-[20%] w-[50%] h-[120%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] opacity-60 bg-teal-400 dark:bg-teal-600"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: ['0%', '15%', '0%'], y: ['0%', '10%', '0%'] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[30%] left-[50%] w-[60%] h-[150%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] opacity-60 bg-indigo-400 dark:bg-indigo-600"
      />
      <motion.div
        animate={{ scale: [1, 1.4, 1], x: ['0%', '-5%', '0%'], y: ['0%', '15%', '0%'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-[10%] right-[0%] w-[40%] h-[130%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] opacity-50 bg-sky-400 dark:bg-sky-600"
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F8F9FE] dark:to-slate-900" />
  </div>
);

// ── Dashboard Page ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user, profile } = useAuth();
  const { t } = useSettings();
  const realTimeStats = useDashboardStats(profile?.userId);

  const dailyCompleted = realTimeStats.dailyCompleted;
  const dailyLimit = realTimeStats.goal || 10;
  const dailyProgress = dailyLimit > 0 ? Math.min(dailyCompleted / dailyLimit, 1) : 0;

  const confettiFired = useRef(false);

  useEffect(() => {
    if (dailyCompleted >= dailyLimit && dailyLimit > 0 && !confettiFired.current) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
        disableForReducedMotion: true,
      });
      confettiFired.current = true;
    }
    if (dailyCompleted === 0) {
      confettiFired.current = false;
    }
  }, [dailyCompleted, dailyLimit]);

  const stats = [
    { label: t('dash.vocab'), value: realTimeStats.vocabCount, sub: t('dash.saved'), icon: Book, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: t('dash.tolearn'), value: realTimeStats.learningCount, sub: t('profile.words'), icon: GraduationCap, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { label: t('dash.streak'), value: realTimeStats.streak, sub: t('dash.days'), icon: Flame, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    { label: t('dash.correct'), value: realTimeStats.correctPercent !== null ? `${realTimeStats.correctPercent}%` : '—', sub: t('dash.last7'), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  ];

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-900 pb-40 relative overflow-hidden">
      {/* ── Gemini-like entrance overlay ── */}
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Sky blue orb top-right */}
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.6) 0%, transparent 70%)' }}
          initial={{ scale: 1.5, opacity: 1 }}
          animate={{ scale: 0.3, opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Blue orb center */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(37,99,235,0.3) 40%, transparent 70%)' }}
          initial={{ scale: 2, opacity: 1 }}
          animate={{ scale: 0.2, opacity: 0 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        />
        {/* Indigo orb bottom-left */}
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)' }}
          initial={{ scale: 1.8, opacity: 1 }}
          animate={{ scale: 0.3, opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        />
        {/* Full white wash */}
        <motion.div
          className="absolute inset-0 bg-white dark:bg-slate-900"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </motion.div>

      <AuroraBackground />

      <header className="px-8 pt-16 pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2 mb-2"
        >
          <div className="w-1.5 h-6 bg-gradient-to-b from-sky-400 to-blue-600 rounded-full" />
          <p className="text-xs font-black text-slate-300 dark:text-slate-500 uppercase tracking-ultra">{t('dash.welcome')}</p>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.4 }}
          className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none dark:text-white transition-colors"
        >
          {t('dash.hello')}, {profile?.displayName?.split(' ')[0]}!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="text-slate-400 text-sm mt-3 font-medium"
        >
          {t('dash.subtitle')}
        </motion.p>
      </header>

      <main className="px-6 space-y-8 relative z-10">
        {/* Daily Goal Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.5 }}
        >
          <Card className="flex items-center justify-between py-8 px-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-ultra mb-1">{t('dash.today')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{dailyCompleted}</span>
                  <span className="text-xl font-bold text-slate-300 dark:text-slate-600">/ {dailyLimit}</span>
                </div>
              </div>
              <div className="w-40 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${dailyProgress * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full"
                />
              </div>
            </div>
            <div className="w-16 h-16 flex items-center justify-center bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-3xl shadow-xl shadow-blue-100/50 dark:shadow-none border border-blue-50 dark:border-slate-700 relative z-10">
              <GraduationCap size={32} />
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 0.65 + i * 0.08 }}
            >
              <Card className="p-6 space-y-4 border-none shadow-blue-100/20 dark:shadow-none">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner', stat.bg, stat.color)}>
                  <stat.icon size={22} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-ultra">{stat.label}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 1.0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xs font-black text-slate-300 dark:text-slate-500 uppercase tracking-ultra">{t('dash.focus')}</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: t('nav.search'), sub: 'Neue Wörter entdecken', icon: Search, to: '/search', color: 'bg-blue-600' },
              { label: t('nav.practice'), sub: 'Wissen festigen', icon: LayoutGrid, to: '/practice', color: 'bg-slate-800 dark:bg-slate-600' },
              { label: t('nav.stats'), sub: 'Daten analysieren', icon: TrendingUp, to: '/stats', color: 'bg-emerald-500' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: 1.1 + i * 0.1 }}
              >
                <Link to={item.to}>
                  <Card className="flex items-center justify-between py-5 px-6 mb-4 hover:border-blue-100 dark:hover:border-blue-800 group" hoverable>
                    <div className="flex items-center gap-5">
                      <div className={cn('w-12 h-12 text-white flex items-center justify-center rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none', item.color)}>
                        <item.icon size={24} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                        <p className="text-xs text-slate-400 font-medium">{item.sub}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}