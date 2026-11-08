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
    sm: 'h-12 w-20',
    md: 'h-16 w-24',
    lg: 'h-24 w-36',
    xl: 'h-32 w-48',
  };

  return (
    <Link
      to={destination}
      aria-label={label}
      title={label}
      className={`inline-flex max-w-full select-none ${className}`}
    >
      <img
        src="/raktarun-logo.jpeg"
        alt=""
        aria-hidden="true"
        className={`${sizeMap[size]} max-w-full shrink-0 rounded-lg bg-white object-contain ${animate ? 'animate-heart-pulse' : ''}`}
      />
    </Link>
  );
};
