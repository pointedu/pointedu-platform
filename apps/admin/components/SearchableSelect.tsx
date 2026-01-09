'use client'

import { useState, useRef, useEffect, useCallback, useTransition } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Option {
  value: string
  label: string
  subLabel?: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = '선택...',
  searchPlaceholder = '검색...',
  required = false,
  disabled = false,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 선택된 옵션
  const selectedOption = options.find((opt) => opt.value === value)

  // 필터링된 옵션
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      opt.label.toLowerCase().includes(term) ||
      opt.subLabel?.toLowerCase().includes(term)
    )
  })

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 열릴 때 검색창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = useCallback((optionValue: string) => {
    startTransition(() => {
      onChange(optionValue)
    })
    setIsOpen(false)
    setSearchTerm('')
  }, [onChange])

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(() => {
      onChange('')
    })
    setSearchTerm('')
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm text-left transition-colors ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : 'bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? (
            <div className="flex flex-col">
              <span>{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-xs text-gray-500">{selectedOption.subLabel}</span>
              )}
            </div>
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <XMarkIcon
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required={required}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                검색 결과가 없습니다
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    option.value === value
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  {option.subLabel && (
                    <div className="text-xs text-gray-500">{option.subLabel}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
