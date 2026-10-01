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
  return (
    <img
      src="/logo.png"
      alt={title}
      className={cn('shrink-0 rounded-full object-contain', inverse && 'bg-white', className)}
    />
  );
};
