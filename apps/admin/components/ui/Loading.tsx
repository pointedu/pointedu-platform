'use client'

import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'white' | 'gray'
  className?: string
}

export function LoadingSpinner({ size = 'md', color = 'primary', className }: LoadingSpinnerProps) {
  const sizeStyles = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  const colorStyles = {
    primary: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-400',
  }

  return (
    <svg
      className={clsx('animate-spin', sizeStyles[size], colorStyles[color], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingOverlay({ message = '로딩 중...', fullScreen = false }: LoadingOverlayProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm',
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 rounded-lg'
      )}
    >
      <LoadingSpinner size="lg" />
      <p className="mt-3 text-sm text-gray-600 font-medium">{message}</p>
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function LoadingSkeleton({
  className,
  variant = 'text',
  width,
  height,
}: LoadingSkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200'

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={clsx(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  )
}

interface LoadingCardProps {
  rows?: number
  showAvatar?: boolean
}

export function LoadingCard({ rows = 3, showAvatar = false }: LoadingCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
      <div className="flex items-start gap-4">
        {showAvatar && (
          <LoadingSkeleton variant="circular" width={48} height={48} />
        )}
        <div className="flex-1 space-y-3">
          <LoadingSkeleton width="60%" height={20} />
          {Array.from({ length: rows }).map((_, i) => (
            <LoadingSkeleton key={i} width={`${100 - i * 15}%`} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface LoadingTableProps {
  rows?: number
  columns?: number
}

export function LoadingTable({ rows = 5, columns = 4 }: LoadingTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <LoadingSkeleton key={i} className="flex-1" height={16} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <LoadingSkeleton
                key={colIndex}
                className="flex-1"
                height={14}
                width={colIndex === 0 ? '80%' : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

interface PageLoadingProps {
  title?: string
}

export function PageLoading({ title }: PageLoadingProps) {
  return (
    <div className="p-6 space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <LoadingSkeleton width={200} height={28} />
          <LoadingSkeleton width={120} height={36} variant="rectangular" />
        </div>
      )}
      <LoadingTable rows={8} columns={5} />
    </div>
  )
}
