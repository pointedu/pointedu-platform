'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface ExportButtonProps {
  onClick: () => void
  loading?: boolean
  label?: string
}

export default function ExportButton({
  onClick,
  loading = false,
  label = '엑셀 다운로드'
}: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      {loading ? '다운로드 중...' : label}
    </button>
  )
}
