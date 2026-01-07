'use client'

import { useState, useEffect, useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ko } from 'date-fns/locale'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  CalendarIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
  multiple?: boolean
}

interface SortOption {
  key: string
  label: string
  direction: 'asc' | 'desc'
}

interface DateRange {
  start: Date | null
  end: Date | null
}

interface AdvancedSearchFilterProps {
  placeholder?: string
  filters: FilterConfig[]
  sortOptions?: { key: string; label: string }[]
  showDateFilter?: boolean
  onSearch: (query: string) => void
  onFilter: (filters: Record<string, string[]>) => void
  onDateChange?: (range: DateRange) => void
  onSort?: (sort: SortOption | null) => void
}

export default function AdvancedSearchFilter({
  placeholder = '검색...',
  filters,
  sortOptions = [],
  showDateFilter = false,
  onSearch,
  onFilter,
  onDateChange,
  onSort,
}: AdvancedSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const [currentSort, setCurrentSort] = useState<SortOption | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 검색 핸들러
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch(value)
  }

  // 필터 토글 (다중 선택)
  const toggleFilter = (filterKey: string, value: string, multiple: boolean) => {
    setActiveFilters(prev => {
      const current = prev[filterKey] || []
      let updated: string[]

      if (multiple) {
        updated = current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
      } else {
        updated = current.includes(value) ? [] : [value]
      }

      const newFilters = { ...prev, [filterKey]: updated }

      // 빈 배열 제거
      if (updated.length === 0) {
        delete newFilters[filterKey]
      }

      onFilter(newFilters)
      return newFilters
    })
  }

  // 날짜 범위 변경
  const handleDateChange = (type: 'start' | 'end', date: Date | null) => {
    const newRange = { ...dateRange, [type]: date }
    setDateRange(newRange)
    onDateChange?.(newRange)
  }

  // 정렬 변경
  const handleSort = (key: string) => {
    setCurrentSort(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          const newSort = { key, label: sortOptions.find(s => s.key === key)?.label || '', direction: 'desc' as const }
          onSort?.(newSort)
          return newSort
        }
        onSort?.(null)
        return null
      }
      const newSort = { key, label: sortOptions.find(s => s.key === key)?.label || '', direction: 'asc' as const }
      onSort?.(newSort)
      return newSort
    })
  }

  // 모든 필터 초기화
  const clearAllFilters = () => {
    setActiveFilters({})
    setDateRange({ start: null, end: null })
    setCurrentSort(null)
    setSearchQuery('')
    onFilter({})
    onDateChange?.({ start: null, end: null })
    onSort?.(null)
    onSearch('')
  }

  // 활성 필터 개수
  const activeFilterCount = Object.values(activeFilters).flat().length +
    (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0) + (currentSort ? 1 : 0)

  return (
    <div className="space-y-3" ref={dropdownRef}>
      {/* 메인 검색바 */}
      <div className="flex gap-2">
        {/* 검색 입력 */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 필터 토글 버튼 */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-5 w-5" />
          <span className="hidden sm:inline">필터</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center h-5 w-5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 확장된 필터 패널 */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
          <div className="flex flex-wrap gap-3">
            {/* 드롭다운 필터들 */}
            {filters.map((filter) => (
              <div key={filter.key} className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === filter.key ? null : filter.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    activeFilters[filter.key]?.length
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{filter.label}</span>
                  {activeFilters[filter.key]?.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                      {activeFilters[filter.key].length}
                    </span>
                  )}
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {openDropdown === filter.key && (
                  <div className="absolute z-10 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto">
                    {filter.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type={filter.multiple ? 'checkbox' : 'radio'}
                          checked={activeFilters[filter.key]?.includes(option.value) || false}
                          onChange={() => toggleFilter(filter.key, option.value, filter.multiple || false)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 날짜 범위 필터 */}
            {showDateFilter && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <DatePicker
                  selected={dateRange.start}
                  onChange={(date: Date | null) => handleDateChange('start', date)}
                  selectsStart
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  placeholderText="시작일"
                  locale={ko}
                  dateFormat="yyyy.MM.dd"
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  isClearable
                />
                <span className="text-gray-400">~</span>
                <DatePicker
                  selected={dateRange.end}
                  onChange={(date: Date | null) => handleDateChange('end', date)}
                  selectsEnd
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  minDate={dateRange.start || undefined}
                  placeholderText="종료일"
                  locale={ko}
                  dateFormat="yyyy.MM.dd"
                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  isClearable
                />
              </div>
            )}

            {/* 정렬 옵션 */}
            {sortOptions.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleSort(option.key)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      currentSort?.key === option.key
                        ? 'bg-purple-50 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                    {currentSort?.key === option.key && (
                      <span className="ml-1">{currentSort.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 필터 초기화 */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
                필터 초기화
              </button>
            </div>
          )}
        </div>
      )}

      {/* 활성 필터 태그 */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, values]) => {
            const filterConfig = filters.find(f => f.key === key)
            return values.map(value => {
              const option = filterConfig?.options.find(o => o.value === value)
              return (
                <span
                  key={`${key}-${value}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  {filterConfig?.label}: {option?.label || value}
                  <button
                    onClick={() => toggleFilter(key, value, filterConfig?.multiple || false)}
                    className="hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </span>
              )
            })
          })}
          {dateRange.start && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-sm rounded-full">
              시작: {dateRange.start.toLocaleDateString('ko-KR')}
              <button onClick={() => handleDateChange('start', null)} className="hover:text-green-900">
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {dateRange.end && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-sm rounded-full">
              종료: {dateRange.end.toLocaleDateString('ko-KR')}
              <button onClick={() => handleDateChange('end', null)} className="hover:text-green-900">
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {currentSort && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-sm rounded-full">
              정렬: {currentSort.label} {currentSort.direction === 'asc' ? '↑' : '↓'}
              <button onClick={() => { setCurrentSort(null); onSort?.(null) }} className="hover:text-purple-900">
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
