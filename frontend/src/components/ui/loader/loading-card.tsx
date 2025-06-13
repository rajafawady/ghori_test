"use client";

import { LoadingSkeleton } from './loading-skeleton';
import { cn } from '@/lib/utils';

interface LoadingCardProps {
  variant?: 'job' | 'candidate' | 'company' | 'user';
  count?: number;
  className?: string;
}

export function LoadingCard({ 
  variant = 'job', 
  count = 1,
  className 
}: LoadingCardProps) {
  const renderJobCard = () => (
    <div className="bg-white rounded-lg shadow border p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="h-6 w-3/4" />
          <LoadingSkeleton className="h-4 w-1/2" />
        </div>
        <LoadingSkeleton variant="button" />
      </div>
      <LoadingSkeleton variant="text" lines={3} />
      <div className="flex items-center space-x-4">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-4 w-16" />
      </div>
    </div>
  );

  const renderCandidateCard = () => (
    <div className="bg-white rounded-lg shadow border p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <LoadingSkeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="h-5 w-32" />
          <LoadingSkeleton className="h-3 w-48" />
          <LoadingSkeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );

  const renderCompanyCard = () => (
    <div className="bg-white rounded-lg shadow border p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <LoadingSkeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton className="h-5 w-40" />
          <LoadingSkeleton className="h-3 w-24" />
        </div>
        <LoadingSkeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <LoadingSkeleton className="h-4 w-20" />
          <LoadingSkeleton className="h-4 w-12" />
        </div>
        <div className="flex justify-between">
          <LoadingSkeleton className="h-4 w-24" />
          <LoadingSkeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );

  const renderUserCard = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <LoadingSkeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton className="h-4 w-32" />
            <LoadingSkeleton className="h-3 w-48" />
          </div>
          <LoadingSkeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );

  const renderCard = () => {
    switch (variant) {
      case 'candidate':
        return renderCandidateCard();
      case 'company':
        return renderCompanyCard();
      case 'user':
        return renderUserCard();
      default:
        return renderJobCard();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {renderCard()}
        </div>
      ))}
    </div>
  );
}