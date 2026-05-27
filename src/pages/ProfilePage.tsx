import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Card, Button } from '../components/UI';
import { ChevronRight, HelpCircle, LogOut, Book, GraduationCap, Star, FileText, Moon, Globe, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

function useProfileCounts(userId?: string) {
  const [counts, setCounts] = useState({
    total: 0,
    learning: 0,
    favorites: 0,
    mastered: 0,
  });

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      try {
        const q = query(collection(db, 'vocabularies'), where('userId', '==', userId));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data());

        setCounts({
          total: docs.length,
          learning: docs.filter(d => d.status === 'learning').length,
          favorites: docs.filter(d => d.status === 'favorite').length,
          mastered: docs.filter(d => d.status === 'mastered').length,
        });
      } catch { /* ignore */ }
    };
    fetch();
  }, [userId]);

  return counts;
}

const toggleVariants = {
  on: { x: 24, width: [16, 26, 16] },
  off: { x: 0, width: [16, 26, 16] }
};

function LiquidToggle({ isOn, color }: { isOn: boolean, color: string }) {
  return (
    <div className={cn("w-12 h-6 rounded-full transition-colors flex items-center px-1 shadow-inner", isOn ? color : "bg-slate-200 dark:bg-slate-700")}>
      <motion.div
        variants={toggleVariants}
        initial={false}
        animate={isOn ? "on" : "off"}
        transition={{
          x: { type: "spring", stiffness: 500, damping: 15, mass: 1 },
          width: { duration: 0.3, ease: "easeInOut" }
        }}
        className="h-4 bg-white rounded-full shadow-md"
      />
    </div>
  );
}

export function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const { isDarkMode, setIsDarkMode, language, setLanguage, t } = useSettings();
  const counts = useProfileCounts(user?.uid);

  const menuItems = [
    { label: t('profile.vocab'), sub: `${counts.total} ${t('profile.words')}`, icon: Book, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { label: t('profile.learning'), sub: `${counts.learning} ${t('profile.words')}`, icon: GraduationCap, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { label: t('profile.favorites'), sub: `${counts.favorites} ${t('profile.words')}`, icon: Star, color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Mastered', sub: `${counts.mastered} ${t('profile.words')}`, icon: FileText, color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-slate-900 pb-32">
      <header className="px-6 pt-16 pb-8 bg-indigo-600/5 dark:bg-indigo-900/10 rounded-b-[3rem]">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-800">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white text-3xl font-black">
                  {(profile?.displayName || profile?.email || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{profile?.displayName}</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm">{profile?.email}</p>
        </div>
      </header>

      <main className="px-6 mt-8 space-y-6">
        <Card className="p-2 space-y-1">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl",
                i < menuItems.length - 1 && "border-b border-slate-50 dark:border-slate-800"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                  <item.icon size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium tracking-tight">{item.sub}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-200 dark:text-slate-700" />
            </button>
          ))}
        </Card>

        <Card className="p-2 space-y-1">
          <div className="p-2 px-4 mb-2">
            <h3 className="text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-ultra">{t('profile.settings')}</h3>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl border-b border-slate-50 dark:border-slate-800"
          >
            <div className="flex items-center gap-4">
              {isDarkMode ? <Moon size={20} className="text-indigo-500" /> : <Sun size={20} className="text-amber-500" />}
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('profile.darkmode')}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{isDarkMode ? t('profile.active') : t('profile.inactive')}</p>
              </div>
            </div>
            <LiquidToggle isOn={isDarkMode} color="bg-indigo-500" />
          </button>

          <button
            onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl border-b border-slate-50 dark:border-slate-800"
          >
            <div className="flex items-center gap-4">
              <Globe size={20} className="text-emerald-500" />
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('profile.language')}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{language === 'de' ? 'Deutsch (DE)' : 'English (EN)'}</p>
              </div>
            </div>
            <LiquidToggle isOn={language === 'en'} color="bg-emerald-500" />
          </button>

          {[
            { label: t('profile.support'), icon: HelpCircle, color: 'text-slate-400 dark:text-slate-500' },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <item.icon size={20} className={item.color} />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.label}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-200 dark:text-slate-700" />
            </button>
          ))}
        </Card>

        <Button variant="outline" className="w-full text-rose-500 border-rose-100 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-none justify-start px-8" onClick={logout}>
          <LogOut size={20} />
          {t('profile.logout')}
        </Button>
      </main>
    </div>
  );
}
