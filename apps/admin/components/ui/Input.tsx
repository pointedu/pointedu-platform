'use client'

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined

    return (
      <div className={clsx(fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-400 h-5 w-5">{leftIcon}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={clsx(errorId, helperId) || undefined}
            className={clsx(
              'block w-full rounded-lg border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm transition-colors',
              leftIcon ? 'pl-10' : 'pl-3',
              rightIcon || error ? 'pr-10' : 'pr-3',
              error
                ? 'ring-red-300 focus:ring-red-500 text-red-900'
                : 'ring-gray-300 focus:ring-blue-600',
              disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
              className
            )}
            {...props}
          />
          {(rightIcon || error) && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {error ? (
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
              ) : (
                <span className="text-gray-400 h-5 w-5">{rightIcon}</span>
              )}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
