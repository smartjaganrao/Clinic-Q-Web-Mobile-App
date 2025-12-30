import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = true
}) => {
  const baseClasses = 'bg-slate-200';
  const animationClasses = animation ? 'animate-pulse' : '';

  let variantClasses = '';
  switch (variant) {
    case 'text':
      variantClasses = 'h-4 rounded';
      break;
    case 'circular':
      variantClasses = 'rounded-full';
      break;
    case 'rectangular':
    default:
      variantClasses = 'rounded-lg';
      break;
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${animationClasses} ${className}`}
      style={style}
    />
  );
};

interface DoctorCardSkeletonProps {
  className?: string;
}

export const DoctorCardSkeleton: React.FC<DoctorCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header Section */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Skeleton variant="circular" width={56} height={64} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <Skeleton variant="text" height={16} className="mb-1 w-3/4" />
              <Skeleton variant="text" height={10} className="mb-2 w-1/2" />
              <div className="flex flex-wrap items-center gap-1">
                <Skeleton variant="rectangular" width={60} height={16} />
                <Skeleton variant="rectangular" width={50} height={16} />
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <Skeleton variant="rectangular" width={40} height={16} />
            <Skeleton variant="text" height={10} width={30} />
          </div>
        </div>

        {/* Clinic Locations */}
        <div className="mb-2">
          <Skeleton variant="text" height={12} className="mb-1.5 w-1/2" />
          <div className="space-y-0.5">
            <Skeleton variant="rectangular" height={20} className="w-full" />
            <Skeleton variant="rectangular" height={20} className="w-full" />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Skeleton variant="rectangular" width={50} height={20} />
            <Skeleton variant="rectangular" width={60} height={16} />
          </div>
          <Skeleton variant="rectangular" width={80} height={20} />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="bg-slate-50 p-2 border-t border-slate-100 flex gap-2">
        <Skeleton variant="rectangular" height={32} className="flex-1" />
        <Skeleton variant="rectangular" height={32} className="flex-1" />
      </div>
    </div>
  );
};