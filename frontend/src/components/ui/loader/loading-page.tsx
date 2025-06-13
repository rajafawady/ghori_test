"use client";

import { LoadingSpinner } from './loading-spinner';
import { LoadingDots } from './loading-dots';
import { cn } from '@/lib/utils';

interface LoadingPageProps {
  message?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export function LoadingPage({ 
  message = 'Loading...', 
  variant = 'spinner',
  size = 'lg',
  fullScreen = false,
  className 
}: LoadingPageProps) {
  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50' 
    : 'w-full h-64';

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots size={size} />;
      case 'pulse':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-blue-600 rounded-full animate-pulse',
                  size === 'sm' ? 'w-2 h-8' : size === 'md' ? 'w-3 h-12' : 'w-4 h-16'
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      default:
        return <LoadingSpinner size={size} />;
    }
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      containerClasses,
      className
    )}>
      <div className="text-center">
        {renderLoadingIndicator()}
        {message && (
          <p className="mt-4 text-gray-600 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}