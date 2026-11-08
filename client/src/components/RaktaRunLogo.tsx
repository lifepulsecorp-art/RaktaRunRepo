import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RaktaRunLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  theme?: 'auto' | 'light';
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 'h-9 w-9', name: 'text-base', tagline: 'text-[0.5rem]', gap: 'gap-2' },
  md: { icon: 'h-12 w-12', name: 'text-xl', tagline: 'text-[0.58rem]', gap: 'gap-2.5' },
  lg: { icon: 'h-16 w-16', name: 'text-2xl', tagline: 'text-[0.68rem]', gap: 'gap-3' },
  xl: { icon: 'h-20 w-20', name: 'text-3xl', tagline: 'text-xs', gap: 'gap-4' },
  hero: { icon: 'h-28 w-28', name: 'text-4xl', tagline: 'text-sm', gap: 'gap-4' },
} as const;

export const RaktaRunLogo: React.FC<RaktaRunLogoProps> = ({
  size = 'md',
  theme = 'auto',
  animate = false,
  className = '',
}) => {
  const { firebaseUser, role } = useAuth();
  const dashboardPath = role === 'admin' ? '/admin' : role === 'hospital' ? '/hospital' : '/donor';
  const destination = firebaseUser && role ? dashboardPath : '/';
  const label = firebaseUser && role ? 'Go to your dashboard' : 'Go to RaktaRun home';
  const dimensions = sizeMap[size];
  const nameColors = theme === 'light'
    ? 'text-rose-700'
    : 'text-rose-700 dark:text-rose-400';
  const runColors = theme === 'light'
    ? 'text-blue-700'
    : 'text-blue-700 dark:text-blue-400';
  const taglineColors = theme === 'light'
    ? 'text-slate-600'
    : 'text-slate-600 dark:text-slate-300';

  return (
    <Link
      to={destination}
      aria-label={label}
      title={label}
      className={`inline-flex min-w-0 shrink-0 items-center ${dimensions.gap} select-none ${className}`}
    >
      <img
        src="/favicon.png"
        alt=""
        aria-hidden="true"
        className={`${dimensions.icon} shrink-0 object-contain ${animate ? 'animate-heart-pulse' : ''}`}
      />
      <span className="min-w-0 leading-none">
        <span className={`flex items-center font-extrabold tracking-tight ${dimensions.name}`}>
          <span className={nameColors}>Rakta</span>
          <span className={runColors}>Run</span>
          <span aria-hidden="true" className="ml-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
        </span>
        <span className={`mt-1 block whitespace-nowrap font-semibold leading-tight ${taglineColors} ${dimensions.tagline}`}>
          Emergency Blood Coordination Network
        </span>
      </span>
    </Link>
  );
};
