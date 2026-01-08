'use client'

import { Component, ReactNode } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          className="min-h-[200px] flex items-center justify-center p-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
              </div>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              문제가 발생했습니다
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              페이지를 불러오는 중 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  오류 상세 정보 보기
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 함수형 에러 표시 컴포넌트
interface ErrorDisplayProps {
  error: Error | string
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({
  error,
  title = '오류가 발생했습니다',
  onRetry,
  className,
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div
      className={`rounded-lg bg-red-50 border border-red-200 p-4 ${className || ''}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline"
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// API 에러 표시 컴포넌트
interface ApiErrorProps {
  status?: number
  message?: string
  onRetry?: () => void
}

export function ApiError({ status, message, onRetry }: ApiErrorProps) {
  const getErrorInfo = () => {
    switch (status) {
      case 400:
        return { title: '잘못된 요청', description: message || '요청 형식이 올바르지 않습니다.' }
      case 401:
        return { title: '인증 필요', description: '로그인이 필요합니다.' }
      case 403:
        return { title: '접근 권한 없음', description: '이 작업을 수행할 권한이 없습니다.' }
      case 404:
        return { title: '찾을 수 없음', description: message || '요청한 리소스를 찾을 수 없습니다.' }
      case 500:
        return { title: '서버 오류', description: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
      default:
        return { title: '오류 발생', description: message || '알 수 없는 오류가 발생했습니다.' }
    }
  }

  const { title, description } = getErrorInfo()

  return (
    <ErrorDisplay
      error={description}
      title={title}
      onRetry={onRetry}
    />
  )
}
