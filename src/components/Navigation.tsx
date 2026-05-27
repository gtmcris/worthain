import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Search, Book, BarChart3, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

export function Navigation() {
  const location = useLocation();
  const { t } = useSettings();

  const navItems = [
    { path: '/', icon: LayoutGrid, label: t('nav.dashboard') },
    { path: '/search', icon: Search, label: t('nav.search') },
    { path: '/practice', icon: Book, label: t('nav.practice') },
    { path: '/stats', icon: BarChart3, label: t('nav.stats') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 px-6 py-4 pb-10 z-50 transition-colors shadow-[0_-8px_30px_rgba(20,184,166,0.15)] dark:shadow-[0_-8px_30px_rgba(20,184,166,0.05)]">
      <div className="max-w-md mx-auto flex justify-between items-center relative">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                "relative flex flex-col items-center space-y-1.5 px-3 py-2 rounded-2xl transition-colors duration-300 min-w-[64px] z-10",
                isActive 
                  ? "text-teal-700 dark:text-teal-300" 
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-500/20 to-indigo-500/20 border border-teal-200/50 dark:border-teal-700/50 shadow-sm shadow-teal-500/20 rounded-2xl -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ 
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -2 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon size={20} className="transition-colors duration-300" />
              </motion.div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-ultra transition-all duration-300",
                isActive ? "opacity-100" : "opacity-80"
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
