'use client'

import { useState, useEffect } from 'react'
import {
  CloudArrowUpIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

interface Backup {
  name: string
  size: number
  sizeFormatted: string
  createdAt: string
}

interface BackupStats {
  backups: Backup[]
  totalSize: number
  totalSizeFormatted: string
  totalCount: number
  maxBackups: number
}

export default function BackupManager() {
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    try {
      const res = await fetch('/api/backup')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load backups:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setCreating(true)
    setMessage(null)

    try {
      const res = await fetch('/api/backup', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        loadBackups()
      } else {
        setMessage({ type: 'error', text: data.error || '백업 생성 실패' })
      }
    } catch (_error) {
      setMessage({ type: 'error', text: '백업 생성 중 오류가 발생했습니다.' })
    } finally {
      setCreating(false)
    }
  }

  const deleteBackup = async (filename: string) => {
    if (!confirm(`${filename} 백업을 삭제하시겠습니까?`)) return

    try {
      const res = await fetch(`/api/backup?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setMessage({ type: 'success', text: '백업이 삭제되었습니다.' })
        loadBackups()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || '삭제 실패' })
      }
    } catch (_error) {
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다.' })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-x-3">
            <CloudArrowUpIcon className="h-6 w-6 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">데이터 백업</h2>
              <p className="text-sm text-gray-500">
                데이터를 안전하게 백업하고 관리합니다. (최대 {stats?.maxBackups || 30}개 보관)
              </p>
            </div>
          </div>
          <button
            onClick={createBackup}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
          >
            {creating ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                백업 중...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                지금 백업
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* 상태 메시지 */}
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg p-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        {/* 통계 */}
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.totalCount || 0}</p>
            <p className="text-sm text-gray-500">총 백업 수</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.totalSizeFormatted || '0 Bytes'}</p>
            <p className="text-sm text-gray-500">총 용량</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {stats?.backups[0] ? formatDate(stats.backups[0].createdAt).split(' ')[0] : '-'}
            </p>
            <p className="text-sm text-gray-500">마지막 백업</p>
          </div>
        </div>

        {/* 백업 목록 */}
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  파일명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  크기
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  생성일
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {stats?.backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    백업이 없습니다. 위의 "지금 백업" 버튼을 클릭하여 첫 백업을 생성하세요.
                  </td>
                </tr>
              ) : (
                stats?.backups.map((backup, index) => (
                  <tr key={backup.name} className={index === 0 ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {backup.name}
                      {index === 0 && (
                        <span className="ml-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          최신
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{backup.sizeFormatted}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(backup.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteBackup(backup.name)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 안내 문구 */}
        <div className="mt-4 rounded-lg bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>자동 백업 안내:</strong> 데이터 변경 시 자동으로 백업이 생성됩니다.
            최대 {stats?.maxBackups || 30}개의 백업이 보관되며, 오래된 백업은 자동으로 삭제됩니다.
            중요한 데이터는 별도로 외부 저장소에 보관하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}
