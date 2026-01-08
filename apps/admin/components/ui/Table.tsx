'use client'

import { ReactNode, useState } from 'react'
import { clsx } from 'clsx'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline'
import { LoadingTable } from './Loading'
import EmptyState from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: unknown, row: T, index: number) => ReactNode
  hideOnMobile?: boolean
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField?: string
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: 'inbox' | 'document' | 'users' | 'calendar' | 'search'
  onRowClick?: (row: T) => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  selectedRows?: string[]
  onSelectRow?: (id: string) => void
  onSelectAll?: (ids: string[]) => void
  className?: string
  stickyHeader?: boolean
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id',
  loading = false,
  emptyMessage = '데이터가 없습니다',
  emptyIcon = 'inbox',
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  className,
  stickyHeader = false,
}: TableProps<T>) {
  const [internalSort, setInternalSort] = useState<{
    column: string
    direction: 'asc' | 'desc'
  } | null>(null)

  const handleSort = (columnKey: string) => {
    const column = columns.find((c) => c.key === columnKey)
    if (!column?.sortable) return

    let newDirection: 'asc' | 'desc' = 'asc'
    const currentColumn = sortColumn || internalSort?.column
    const currentDirection = sortDirection || internalSort?.direction

    if (currentColumn === columnKey) {
      newDirection = currentDirection === 'asc' ? 'desc' : 'asc'
    }

    if (onSort) {
      onSort(columnKey, newDirection)
    } else {
      setInternalSort({ column: columnKey, direction: newDirection })
    }
  }

  const getSortIcon = (columnKey: string) => {
    const column = columns.find((c) => c.key === columnKey)
    if (!column?.sortable) return null

    const currentColumn = sortColumn || internalSort?.column
    const currentDirection = sortDirection || internalSort?.direction

    if (currentColumn !== columnKey) {
      return <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
    }

    return currentDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-blue-600" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-blue-600" />
    )
  }

  const allSelected =
    data.length > 0 &&
    data.every((row) => selectedRows.includes(String(row[keyField])))

  const handleSelectAll = () => {
    if (onSelectAll) {
      if (allSelected) {
        onSelectAll([])
      } else {
        onSelectAll(data.map((row) => String(row[keyField])))
      }
    }
  }

  if (loading) {
    return <LoadingTable rows={5} columns={columns.length} />
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <EmptyState icon={emptyIcon} title={emptyMessage} size="md" />
      </div>
    )
  }

  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  return (
    <div className={clsx('bg-white rounded-lg shadow overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={clsx('bg-gray-50', stickyHeader && 'sticky top-0 z-10')}>
            <tr>
              {onSelectRow && (
                <th scope="col" className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="모두 선택"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  className={clsx(
                    'px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider',
                    alignStyles[column.align || 'left'],
                    column.sortable && 'cursor-pointer hover:bg-gray-100 select-none',
                    column.hideOnMobile && 'hidden md:table-cell'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                  onKeyDown={(e) => {
                    if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      handleSort(column.key)
                    }
                  }}
                  tabIndex={column.sortable ? 0 : undefined}
                  role={column.sortable ? 'button' : undefined}
                  aria-sort={
                    (sortColumn || internalSort?.column) === column.key
                      ? (sortDirection || internalSort?.direction) === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    <span>{column.header}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => {
              const rowId = String(row[keyField])
              const isSelected = selectedRows.includes(rowId)

              return (
                <tr
                  key={rowId}
                  className={clsx(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50',
                    isSelected && 'bg-blue-50'
                  )}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onRowClick(row)
                    }
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? 'button' : undefined}
                >
                  {onSelectRow && (
                    <td className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          onSelectRow(rowId)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`행 ${rowIndex + 1} 선택`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        'px-4 py-3 text-sm text-gray-900',
                        alignStyles[column.align || 'left'],
                        column.hideOnMobile && 'hidden md:table-cell'
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : (row[column.key] as ReactNode) ?? '-'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 상태 뱃지 컴포넌트
interface StatusBadgeProps {
  status: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, variant = 'default', size = 'sm' }: StatusBadgeProps) {
  const variantStyles = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      {status}
    </span>
  )
}
