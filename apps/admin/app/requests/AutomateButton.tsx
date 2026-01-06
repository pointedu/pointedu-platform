'use client'

import { useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { automateRequest } from './actions'

export default function AutomateButton({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleClick = async () => {
    setLoading(true)
    setMessage('')

    try {
      const result = await automateRequest(requestId)
      setMessage(result.message)

      if (result.success) {
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      setMessage('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
      >
        <SparklesIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
        {loading ? '처리중...' : '자동 처리'}
      </button>
      {message && (
        <div className={`mt-2 text-xs ${message.includes('성공') || message.includes('생성') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
