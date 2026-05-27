import React, { ComponentPropsWithoutRef, PropsWithChildren } from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children,
  ...props 
}: PropsWithChildren<ButtonProps>) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-none',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none hover:bg-slate-200 dark:hover:bg-slate-700',
    outline: 'bg-transparent text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-rose-500 text-white hover:bg-rose-600',
    success: 'bg-emerald-500 text-white hover:bg-emerald-600',
  };

  const sizes = {
    sm: 'px-6 py-2.5 text-xs font-bold',
    md: 'px-8 py-3.5 text-sm font-bold',
    lg: 'px-10 py-4.5 text-base font-black uppercase tracking-widest',
    icon: 'p-3',
  };

  return (
    <button
      className={cn(
        'rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 whitespace-nowrap',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface CardProps extends ComponentPropsWithoutRef<'div'> {
  hoverable?: boolean;
}

export function Card({ className, hoverable, children, ...props }: PropsWithChildren<CardProps>) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-4xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300',
        hoverable && 'hover:shadow-xl hover:shadow-indigo-50/50 dark:hover:shadow-none hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }: ComponentPropsWithoutRef<'input'>) {
  return (
    <input
      className={cn(
        'w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full px-8 py-4 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-medium',
        className
      )}
      {...props}
    />
  );
}
