'use client'

import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface SearchFilterProps {
  placeholder?: string
  filters?: {
    key: string
    label: string
    options: FilterOption[]
  }[]
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, string>) => void
}

export default function SearchFilter({
  placeholder = '검색...',
  filters = [],
  onSearch,
  onFilter,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value }
    if (!value) delete newFilters[key]
    setActiveFilters(newFilters)
    onFilter?.(newFilters)
  }

  const clearFilters = () => {
    setActiveFilters({})
    onFilter?.({})
  }

  const activeFilterCount = Object.keys(activeFilters).length

  return (
    <div className="mb-6 space-y-4">
      <div className="flex gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder={placeholder}
          />
        </div>

        {/* Filter Button */}
        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-x-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ${
              activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700 ring-blue-200'
                : 'bg-white text-gray-900 ring-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            필터
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && filters.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">필터 옵션</h4>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                필터 초기화
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm"
                >
                  <option value="">전체</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find((f) => f.key === key)
            const option = filter?.options.find((o) => o.value === value)
            return (
              <span
                key={key}
                className="inline-flex items-center gap-x-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
              >
                {filter?.label}: {option?.label || value}
                <button
                  type="button"
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 hover:text-blue-900"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
