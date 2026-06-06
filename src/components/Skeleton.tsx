import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-skeleton-base animate-soft-pulse rounded-xl",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-text-primary/5 to-transparent skew-x-[-20deg]" />
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="bg-card-bg rounded-[2rem] overflow-hidden border border-text-primary/5 p-4 space-y-4">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2 p-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2 opacity-50" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function AdminCardSkeleton() {
  return (
    <div className="bg-card-bg p-8 rounded-[2rem] border border-text-primary/5 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4 opacity-50" />
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-card-bg p-8 rounded-[2rem] border border-text-primary/5 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16 opacity-50" />
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="flex gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="w-10 h-10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
