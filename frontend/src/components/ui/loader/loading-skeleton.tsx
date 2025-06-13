"use client";

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'button';
  lines?: number;
}

export function LoadingSkeleton({ 
  className, 
  variant = 'text',
  lines = 1 
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';

  const variantClasses = {
    text: 'h-4',
    card: 'h-32',
    avatar: 'w-10 h-10 rounded-full',
    button: 'h-10 w-24'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses[variant],
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
}