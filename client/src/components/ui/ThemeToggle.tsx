import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`liquid-glass relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 text-slate-700 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:text-slate-900 active:scale-95 dark:border-white/10 dark:text-slate-300 dark:hover:text-white ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
    >
      <Sun
        className={`h-4 w-4 transition-transform duration-300 ${
          isDark ? 'rotate-90 scale-0 opacity-0 absolute' : 'rotate-0 scale-100 opacity-100 text-amber-500'
        }`}
      />
      <Moon
        className={`h-4 w-4 transition-transform duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100 text-sky-400' : '-rotate-90 scale-0 opacity-0 absolute'
        }`}
      />
    </button>
  );
};

