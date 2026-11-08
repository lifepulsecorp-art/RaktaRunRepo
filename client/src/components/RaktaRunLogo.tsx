import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RaktaRunLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  className?: string;
}

export const RaktaRunLogo: React.FC<RaktaRunLogoProps> = ({
  size = 'md',
  animate = false,
  className = '',
}) => {
  const { firebaseUser, role } = useAuth();
  const dashboardPath = role === 'admin' ? '/admin' : role === 'hospital' ? '/hospital' : '/donor';
  const destination = firebaseUser && role ? dashboardPath : '/';
  const label = firebaseUser && role ? 'Go to your dashboard' : 'Go to RaktaRun home';

  const sizeMap = {
    sm: 'h-14 w-24',
    md: 'h-20 w-32',
    lg: 'h-28 w-44',
    xl: 'h-36 w-56',
  };

  return (
    <Link
      to={destination}
      aria-label={label}
      title={label}
      className={`inline-flex max-w-full select-none ${className}`}
    >
      <img
        src="/raktarun-logo.png"
        alt=""
        aria-hidden="true"
        className={`${sizeMap[size]} max-w-full shrink-0 object-contain dark:hidden ${animate ? 'animate-heart-pulse' : ''}`}
      />
      <img
        src="/raktarun-logo-dark.png"
        alt=""
        aria-hidden="true"
        className={`${sizeMap[size]} hidden max-w-full shrink-0 object-contain dark:block ${animate ? 'animate-heart-pulse' : ''}`}
      />
    </Link>
  );
};
