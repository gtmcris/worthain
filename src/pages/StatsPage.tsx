import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Card } from '../components/UI';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BookOpen, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';

interface LevelData {
  label: string;
  count: number;
}

interface ProgressData {
  date: string;
  words: number;
}

function useRealStats(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [levelData, setLevelData] = useState<LevelData[]>([]);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [masteredCount, setMasteredCount] = useState(0);
  const [learningCount, setLearningCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [correctPercent, setCorrectPercent] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        // ── Vocabularies ───────────────────────────────────────────────
        const vocabQ = query(
          collection(db, 'vocabularies'),
          where('userId', '==', userId)
        );
        const vocabSnap = await getDocs(vocabQ);
        const vocabs = vocabSnap.docs.map(d => ({ ...d.data() }));

        setTotalWords(vocabs.length);
        setMasteredCount(vocabs.filter(v => v.status === 'mastered').length);
        setLearningCount(vocabs.filter(v => v.status === 'learning').length);

        // Level distribution
        const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        const levelCounts = levels.map(l => ({
          label: l,
          count: vocabs.filter(v => v.level === l).length,
        }));
        setLevelData(levelCounts);

        // Progress over time (group by createdAt date)
        const dateEntries: { date: Date; label: string }[] = [];
        vocabs.forEach(v => {
          if (!v.createdAt) return;
          const d = typeof v.createdAt.toDate === 'function'
            ? v.createdAt.toDate()
            : new Date(v.createdAt);
          dateEntries.push({ date: d, label: d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) });
        });

        // Sort by actual date
        dateEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

        // Group by label and build cumulative
        const dateMap = new Map<string, number>();
        dateEntries.forEach(({ label }) => {
          dateMap.set(label, (dateMap.get(label) || 0) + 1);
        });

        let cumulative = 0;
        const progress: ProgressData[] = [];
        for (const [date, count] of dateMap.entries()) {
          cumulative += count;
          progress.push({ date, words: cumulative });
        }
        setProgressData(progress);

        // ── Practice Logs ──────────────────────────────────────────────
        const logQ = query(
          collection(db, 'practice_logs'),
          where('userId', '==', userId)
        );
        const logSnap = await getDocs(logQ);
        const logs = logSnap.docs.map(d => d.data());

        setPracticeCount(logs.length);

        const correctLogs = logs.filter(
          l => l.result === 'easy' || l.result === 'good'
        );
        setCorrectPercent(
          logs.length > 0
            ? Math.round((correctLogs.length / logs.length) * 100)
            : 0
        );
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [userId]);

  return {
    loading,
    levelData,
    progressData,
    masteredCount,
    learningCount,
    totalWords,
    practiceCount,
    correctPercent,
  };
}

export function StatsPage() {
  const { user } = useAuth();
  const { t } = useSettings();
  const stats = useRealStats(user?.uid);

  const summaryCards = [
    {
      label: t('stats.learned'),
      value: stats.masteredCount,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: t('stats.practiced'),
      value: stats.practiceCount,
      icon: Target,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      label: t('stats.correct'),
      value: stats.practiceCount > 0 ? `${stats.correctPercent}%` : '—',
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  if (stats.loading) {
    return (
      <div className="min-h-screen bg-brand-bg dark:bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg dark:bg-slate-900 pb-40">
      <header className="px-8 pt-16 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
          <p className="text-xs font-black text-slate-300 dark:text-slate-500 uppercase tracking-ultra">
            {t('stats.title')}
          </p>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('stats.title')}
        </h1>
      </header>

      <main className="px-6 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {summaryCards.map(card => (
            <Card
              key={card.label}
              className="p-4 border-none flex flex-col items-center justify-center space-y-2"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg, card.color)}>
                <card.icon size={20} />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {card.value}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-ultra">
                {card.label}
              </span>
            </Card>
          ))}
        </div>

        {/* Level Distribution */}
        <div className="space-y-3">
          <div className="px-2">
            <h3 className="text-xs font-black text-slate-300 dark:text-slate-500 uppercase tracking-ultra">
              {t('stats.by_level')}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
              {t('stats.by_level_sub')}
            </p>
          </div>
          <Card className="p-6 border-none">
            {stats.totalWords > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.levelData}>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      contentStyle={{
                        borderRadius: '1rem',
                        border: 'none',
                        boxShadow: '0 4px 20px rgb(0 0 0 / 0.08)',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[8, 8, 0, 0]}
                      barSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center">
                <BookOpen size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">{t('stats.no_data')}</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">{t('stats.no_data_sub')}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Progress Over Time */}
        <div className="space-y-3">
          <div className="px-2">
            <h3 className="text-xs font-black text-slate-300 dark:text-slate-500 uppercase tracking-ultra">
              {t('stats.progress')}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
              {t('stats.progress_sub')}
            </p>
          </div>
          <Card className="p-6 border-none overflow-hidden">
            {stats.progressData.length > 0 ? (
              <>
                <div className="h-48 w-full -ml-2">
                  <ResponsiveContainer width="105%" height="100%">
                    <AreaChart data={stats.progressData}>
                      <defs>
                        <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '1rem',
                          border: 'none',
                          boxShadow: '0 4px 20px rgb(0 0 0 / 0.08)',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="words"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="url(#colorWords)"
                        dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between mt-4 px-2">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-ultra">
                      {t('stats.total')}
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {stats.totalWords}
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-ultra">
                      {t('stats.learned')}
                    </p>
                    <p className="text-lg font-black text-emerald-500">
                      {stats.masteredCount}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <TrendingUp size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">{t('stats.no_data')}</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
