'use client'

import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface ContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
}

export function Container({
  children,
  className,
  size = 'xl',
  padding = true,
}: ContainerProps) {
  const sizeStyles = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <div
      className={clsx(
        'mx-auto w-full',
        sizeStyles[size],
        padding && 'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumb?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={clsx('mb-6 sm:mb-8', className)}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface CardGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CardGrid({
  children,
  columns = 3,
  gap = 'md',
  className,
}: CardGridProps) {
  const columnStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  const gapStyles = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
  }

  return (
    <div className={clsx('grid', columnStyles[columns], gapStyles[gap], className)}>
      {children}
    </div>
  )
}

interface ResponsiveStackProps {
  children: ReactNode
  direction?: 'row' | 'column'
  breakpoint?: 'sm' | 'md' | 'lg'
  gap?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  className?: string
}

export function ResponsiveStack({
  children,
  direction = 'row',
  breakpoint = 'sm',
  gap = 'md',
  align = 'center',
  justify = 'start',
  className,
}: ResponsiveStackProps) {
  const gapStyles = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  const alignStyles = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  const justifyStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  }

  const directionStyles = {
    sm: direction === 'row' ? 'flex-col sm:flex-row' : 'flex-row sm:flex-col',
    md: direction === 'row' ? 'flex-col md:flex-row' : 'flex-row md:flex-col',
    lg: direction === 'row' ? 'flex-col lg:flex-row' : 'flex-row lg:flex-col',
  }

  return (
    <div
      className={clsx(
        'flex',
        directionStyles[breakpoint],
        gapStyles[gap],
        alignStyles[align],
        justifyStyles[justify],
        className
      )}
    >
      {children}
    </div>
  )
}

interface SectionProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function Section({
  children,
  title,
  description,
  actions,
  className,
}: SectionProps) {
  return (
    <section className={clsx('mb-6 sm:mb-8', className)}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          {title && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {description && (
                <p className="mt-0.5 text-sm text-gray-500">{description}</p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
