"use client";

import { Button } from '../button';
import { LoadingSpinner } from './loading-spinner';
import { cn } from '@/lib/utils';

type ButtonComponentProps = React.ComponentProps<typeof Button>;

interface LoadingButtonProps extends ButtonComponentProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({ 
  loading = false,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      className={cn(
        'relative',
        loading && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" variant="white" />
          {loadingText && (
            <span className="ml-2 text-sm">
              {loadingText}
            </span>
          )}
        </div>
      )}
      <span className={cn(loading && 'opacity-0')}>
        {children}
      </span>
    </Button>
  );
}