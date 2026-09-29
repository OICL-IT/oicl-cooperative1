import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  inverse?: boolean;
  title?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className,
  inverse = false,
  title = 'OICL Cooperative Society',
}) => {
  const background = inverse ? '#ffffff' : '#0f172a';
  const foreground = inverse ? '#0f172a' : '#ffffff';

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn('shrink-0', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect width="64" height="64" rx="16" fill={background} />
      <path
        d="M32 11C20.4 11 11 20.4 11 32s9.4 21 21 21c7.1 0 13.4-3.5 17.2-8.9l-8.1-5.2A11.4 11.4 0 1 1 43.4 28H53C51.1 18.3 42.4 11 32 11Z"
        fill="#10b981"
      />
      <path
        d="M27 25.5h10v20H27zM22 31h5v14.5h-5zM37 31h5v14.5h-5z"
        fill={foreground}
      />
      <path d="M20 45.5h24" stroke={foreground} strokeWidth="3" strokeLinecap="round" />
      <circle cx="48.5" cy="21.5" r="4.5" fill="#fbbf24" />
    </svg>
  );
};
