"use client";

import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  blur?: boolean;
  className?: string;
}

export function LoadingOverlay({ 
  show, 
  message,
  blur = true,
  className 
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center',
        blur ? 'bg-white bg-opacity-80 backdrop-blur-sm' : 'bg-white bg-opacity-90',
        className
      )}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="mt-4 text-gray-600 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}