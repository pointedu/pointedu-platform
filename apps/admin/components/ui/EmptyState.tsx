'use client'

import { ReactNode } from 'react'
import { clsx } from 'clsx'
import {
  InboxIcon,
  DocumentIcon,
  UserGroupIcon,
  CalendarIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

type IconType =
  | 'inbox'
  | 'document'
  | 'users'
  | 'calendar'
  | 'school'
  | 'building'
  | 'money'
  | 'search'
  | 'warning'
  | 'folder'

interface EmptyStateProps {
  icon?: IconType | ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const iconMap = {
  inbox: InboxIcon,
  document: DocumentIcon,
  users: UserGroupIcon,
  calendar: CalendarIcon,
  school: AcademicCapIcon,
  building: BuildingOfficeIcon,
  money: CurrencyDollarIcon,
  search: MagnifyingGlassIcon,
  warning: ExclamationTriangleIcon,
  folder: FolderIcon,
}

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizeStyles = {
    sm: {
      container: 'py-6',
      icon: 'h-10 w-10',
      title: 'text-sm',
      description: 'text-xs',
    },
    md: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-base',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'h-16 w-16',
      title: 'text-lg',
      description: 'text-base',
    },
  }

  const IconComponent = typeof icon === 'string' && icon in iconMap ? iconMap[icon as IconType] : null

  return (
    <div
      className={clsx(
        'text-center',
        sizeStyles[size].container,
        className
      )}
      role="status"
      aria-label={title}
    >
      <div className="flex justify-center">
        {IconComponent ? (
          <IconComponent
            className={clsx('text-gray-400', sizeStyles[size].icon)}
            aria-hidden="true"
          />
        ) : (
          <span className={clsx('text-gray-400', sizeStyles[size].icon)}>
            {icon}
          </span>
        )}
      </div>
      <h3
        className={clsx(
          'mt-4 font-semibold text-gray-900',
          sizeStyles[size].title
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={clsx(
            'mt-2 text-gray-500',
            sizeStyles[size].description
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// 특정 상황별 프리셋 컴포넌트
export function NoDataState({
  title = '데이터가 없습니다',
  description,
  action,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon="inbox"
      title={title}
      description={description}
      action={action}
    />
  )
}

export function NoSearchResultState({
  searchTerm,
  action,
}: {
  searchTerm?: string
  action?: ReactNode
}) {
  return (
    <EmptyState
      icon="search"
      title="검색 결과가 없습니다"
      description={
        searchTerm
          ? `"${searchTerm}"에 대한 검색 결과를 찾을 수 없습니다.`
          : '검색 조건에 맞는 결과가 없습니다.'
      }
      action={action}
    />
  )
}

export function NoScheduleState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon="calendar"
      title="예정된 일정이 없습니다"
      description="새로운 수업을 배정하거나 일정을 추가해주세요."
      action={action}
    />
  )
}

export function NoInstructorState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon="users"
      title="등록된 강사가 없습니다"
      description="새로운 강사를 등록해주세요."
      action={action}
    />
  )
}

export function NoSchoolState({ action }: { action?: ReactNode }) {
  return (
    <EmptyState
      icon="building"
      title="등록된 학교가 없습니다"
      description="새로운 학교를 등록해주세요."
      action={action}
    />
  )
}

export function ErrorState({
  title = '오류가 발생했습니다',
  description = '잠시 후 다시 시도해주세요.',
  action,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      icon="warning"
      title={title}
      description={description}
      action={action}
    />
  )
}
