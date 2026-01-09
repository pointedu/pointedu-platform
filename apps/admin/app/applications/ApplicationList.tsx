'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Application {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  message: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  instructor: {
    id: string
    name: string
    email: string | null
    phoneNumber: string
    subjects: string[]
    homeBase: string
  }
  request: {
    id: string
    requestNumber: string
    desiredDate: string
    sessions: number
    studentCount: number
    school: { name: string; address: string }
    program: { name: string } | null
  }
}

interface Props {
  initialApplications: Application[]
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
}

const statusLabels = {
  PENDING: '대기중',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
}

export default function ApplicationList({ initialApplications }: Props) {
  const router = useRouter()
  const [applications, setApplications] = useState(initialApplications)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<{ type: 'approve' | 'reject'; id: string } | null>(null)
  const [note, setNote] = useState('')

  // useTransition for non-blocking UI updates
  const [isPending, startTransition] = useTransition()

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  const handleAction = useCallback(async (id: string, action: 'approve' | 'reject') => {
    setLoading(id)
    try {
      const res = await fetch(`/api/applications/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      })

      if (res.ok) {
        await res.json()
        // Optimistic UI update with startTransition
        startTransition(() => {
          setApplications(apps =>
            apps.map(app =>
              app.id === id
                ? { ...app, status: action === 'approve' ? 'APPROVED' : 'REJECTED', reviewedAt: new Date().toISOString(), reviewNote: note }
                : app
            )
          )
        })
        setShowModal(null)
        setNote('')
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || '처리 중 오류가 발생했습니다.')
      }
    } catch (_error) {
      alert('처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(null)
    }
  }, [note, router])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex gap-2">
        {[
          { key: 'all', label: '전체' },
          { key: 'PENDING', label: '대기중' },
          { key: 'APPROVED', label: '승인됨' },
          { key: 'REJECTED', label: '거절됨' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`overflow-hidden rounded-lg bg-white shadow ${isPending ? 'opacity-70' : ''}`}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                강사
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                학교 / 프로그램
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                수업일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                지원일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                상태
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  지원 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{app.instructor.name}</div>
                    <div className="text-sm text-gray-500">{app.instructor.phoneNumber}</div>
                    <div className="text-xs text-gray-400">{app.instructor.homeBase}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{app.request.school.name}</div>
                    <div className="text-sm text-gray-500">{app.request.program?.name || '-'}</div>
                    <div className="text-xs text-gray-400">
                      {app.request.sessions}회 / {app.request.studentCount}명
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {formatDate(app.request.desiredDate)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(app.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[app.status]}`}>
                      {statusLabels[app.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {app.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setShowModal({ type: 'approve', id: app.id })}
                          disabled={loading === app.id}
                          className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => setShowModal({ type: 'reject', id: app.id })}
                          disabled={loading === app.id}
                          className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          거절
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        {app.reviewedAt && formatDate(app.reviewedAt)}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {showModal.type === 'approve' ? '지원 승인' : '지원 거절'}
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="메모 (선택사항)"
              className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(null)
                  setNote('')
                }}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={() => handleAction(showModal.id, showModal.type)}
                disabled={loading === showModal.id}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  showModal.type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loading === showModal.id ? '처리 중...' : showModal.type === 'approve' ? '승인' : '거절'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
