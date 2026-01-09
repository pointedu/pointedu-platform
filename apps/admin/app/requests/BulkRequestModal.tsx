'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, TrashIcon, DocumentDuplicateIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentIcon } from '@heroicons/react/24/outline'
import FormModal from '../../components/FormModal'
import { parseExcelFile, downloadExcelTemplate, requestExcelTemplateConfig } from '../../lib/excel'

interface School {
  id: string
  name: string
  region: string
}

interface Program {
  id: string
  name: string
  category: string
}

interface Instructor {
  id: string
  name: string
  homeBase: string
  subjects: string[]
}

interface BulkRequestItem {
  id: string
  programId: string
  customProgram: string
  instructorId: string
  sessions: number
  studentCount: number
  targetGrade: string
  startTime: string
  endTime: string
  note: string
}

interface BulkRequestModalProps {
  isOpen: boolean
  onClose: () => void
  schools: School[]
  programs: Program[]
  instructors: Instructor[]
}

export default function BulkRequestModal({
  isOpen,
  onClose,
  schools,
  programs,
  instructors,
}: BulkRequestModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [schoolId, setSchoolId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [items, setItems] = useState<BulkRequestItem[]>([
    createNewItem(),
  ])

  // 탭 상태 (manual: 수동 입력, excel: 엑셀 업로드)
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual')

  // 엑셀 업로드 관련 상태
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [excelData, setExcelData] = useState<Record<string, unknown>[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)

  function createNewItem(): BulkRequestItem {
    return {
      id: Math.random().toString(36).substr(2, 9),
      programId: '',
      customProgram: '',
      instructorId: '',
      sessions: 2,
      studentCount: 25,
      targetGrade: '',
      startTime: '09:00',
      endTime: '10:30',
      note: '',
    }
  }

  const addItem = () => {
    setItems([...items, createNewItem()])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const duplicateItem = (item: BulkRequestItem) => {
    const newItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof BulkRequestItem, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId || !scheduledDate || items.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          scheduledDate,
          items: items.map((item) => ({
            programId: item.programId || null,
            customProgram: item.customProgram || null,
            instructorId: item.instructorId || null,
            sessions: item.sessions,
            studentCount: item.studentCount,
            targetGrade: item.targetGrade,
            scheduledTime: item.startTime && item.endTime ? `${item.startTime}~${item.endTime}` : null,
            note: item.note,
          })),
        }),
      })

      if (res.ok) {
        const result = await res.json()
        alert(`${result.count}개의 요청이 등록되었습니다.`)
        onClose()
        resetForm()
        router.refresh()
      } else {
        const error = await res.json()
        alert(error.error || '등록 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Failed to create bulk requests:', error)
      alert('등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSchoolId('')
    setScheduledDate('')
    setItems([createNewItem()])
    setExcelData([])
    setUploadError(null)
    setActiveTab('manual')
  }

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = () => {
    downloadExcelTemplate('수업요청', requestExcelTemplateConfig, '수업요청')
  }

  // 엑셀 파일 업로드 처리
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    try {
      const data = await parseExcelFile(file)
      if (data.length === 0) {
        setUploadError('엑셀 파일에 데이터가 없습니다.')
        return
      }
      setExcelData(data)
    } catch (error) {
      console.error('Excel parse error:', error)
      setUploadError('엑셀 파일을 읽는 중 오류가 발생했습니다.')
    }

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 학교명으로 학교 ID 찾기
  const findSchoolByName = (name: string): School | undefined => {
    const normalized = name.trim()
    return schools.find(
      (s) => s.name === normalized || s.name.includes(normalized) || normalized.includes(s.name)
    )
  }

  // 프로그램명으로 프로그램 ID 찾기
  const findProgramByName = (name: string): Program | undefined => {
    const normalized = name.trim()
    return programs.find(
      (p) => p.name === normalized || p.name.includes(normalized) || normalized.includes(p.name)
    )
  }

  // 엑셀 데이터 제출
  const handleExcelSubmit = async () => {
    if (excelData.length === 0) {
      setUploadError('업로드된 데이터가 없습니다.')
      return
    }

    setLoading(true)
    setUploadError(null)

    try {
      // 학교별로 그룹핑
      const groupedBySchool: Record<string, { school: School; items: BulkRequestItem[] }> = {}

      for (const row of excelData) {
        const schoolName = String(row['학교명'] || row['schoolName'] || '').trim()
        const programName = String(row['프로그램명'] || row['programName'] || '').trim()

        if (!schoolName) continue

        const school = findSchoolByName(schoolName)
        if (!school) {
          setUploadError(`학교를 찾을 수 없습니다: ${schoolName}`)
          setLoading(false)
          return
        }

        const program = programName ? findProgramByName(programName) : undefined

        const item: BulkRequestItem = {
          id: Math.random().toString(36).substr(2, 9),
          programId: program?.id || '',
          customProgram: program ? '' : programName,
          instructorId: '',
          sessions: parseInt(String(row['차시'] || row['sessions'] || '2')) || 2,
          studentCount: parseInt(String(row['학생수'] || row['studentCount'] || '25')) || 25,
          targetGrade: String(row['대상학년'] || row['targetGrade'] || ''),
          startTime: '09:00',
          endTime: '10:30',
          note: String(row['요청사항'] || row['requirements'] || ''),
        }

        if (!groupedBySchool[school.id]) {
          groupedBySchool[school.id] = { school, items: [] }
        }
        groupedBySchool[school.id].items.push(item)
      }

      let totalCreated = 0

      // 학교별로 요청 생성
      for (const [schoolIdKey, group] of Object.entries(groupedBySchool)) {
        // 희망날짜 처리
        const firstRow = excelData.find((r) => {
          const name = String(r['학교명'] || r['schoolName'] || '').trim()
          return findSchoolByName(name)?.id === schoolIdKey
        })

        let dateStr = ''
        if (firstRow) {
          const rawDate = firstRow['희망날짜'] || firstRow['desiredDate']
          if (rawDate) {
            // 엑셀 날짜 형식 처리
            if (typeof rawDate === 'number') {
              // 엑셀 serial date
              const date = new Date((rawDate - 25569) * 86400 * 1000)
              dateStr = date.toISOString().split('T')[0]
            } else {
              dateStr = String(rawDate).split('T')[0]
            }
          }
        }

        if (!dateStr) {
          dateStr = new Date().toISOString().split('T')[0]
        }

        const res = await fetch('/api/requests/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolId: schoolIdKey,
            scheduledDate: dateStr,
            items: group.items.map((item) => ({
              programId: item.programId || null,
              customProgram: item.customProgram || null,
              instructorId: item.instructorId || null,
              sessions: item.sessions,
              studentCount: item.studentCount,
              targetGrade: item.targetGrade,
              scheduledTime: `${item.startTime}~${item.endTime}`,
              note: item.note,
            })),
          }),
        })

        if (res.ok) {
          const result = await res.json()
          totalCreated += result.count
        } else {
          const error = await res.json()
          throw new Error(error.error || '등록 중 오류가 발생했습니다.')
        }
      }

      alert(`${totalCreated}개의 요청이 등록되었습니다.`)
      onClose()
      resetForm()
      router.refresh()
    } catch (error) {
      console.error('Failed to create requests from excel:', error)
      setUploadError(error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 시간 옵션 생성 (08:00 ~ 17:00)
  const timeOptions: string[] = []
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 10) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      timeOptions.push(time)
    }
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        resetForm()
      }}
      title="대량 수업 요청 등록"
      size="xl"
    >
      {/* 탭 선택 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'manual'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            수동 입력
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'excel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            엑셀 업로드
          </button>
        </nav>
      </div>

      {activeTab === 'excel' ? (
        /* 엑셀 업로드 탭 */
        <div className="space-y-6">
          {/* 템플릿 다운로드 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">1. 엑셀 양식 다운로드</h3>
            <p className="text-sm text-blue-700 mb-3">
              아래 버튼을 클릭하여 엑셀 양식을 다운로드한 후, 데이터를 입력하세요.
            </p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              엑셀 양식 다운로드
            </button>
          </div>

          {/* 파일 업로드 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">2. 엑셀 파일 업로드</h3>
            <p className="text-sm text-gray-600 mb-3">
              작성한 엑셀 파일을 업로드하세요. (학교명은 등록된 학교와 일치해야 합니다)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              파일 선택
            </button>
          </div>

          {/* 에러 메시지 */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* 업로드된 데이터 미리보기 */}
          {excelData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DocumentIcon className="h-5 w-5" />
                  업로드된 데이터 ({excelData.length}건)
                </h3>
                <button
                  type="button"
                  onClick={() => setExcelData([])}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
              <div className="max-h-60 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">학교명</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">프로그램</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">차시</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">학생수</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">희망날짜</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {excelData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{String(row['학교명'] || row['schoolName'] || '')}</td>
                        <td className="px-3 py-2">{String(row['프로그램명'] || row['programName'] || '')}</td>
                        <td className="px-3 py-2">{String(row['차시'] || row['sessions'] || '')}</td>
                        <td className="px-3 py-2">{String(row['학생수'] || row['studentCount'] || '')}</td>
                        <td className="px-3 py-2">{String(row['희망날짜'] || row['desiredDate'] || '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                onClose()
                resetForm()
              }}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleExcelSubmit}
              disabled={loading || excelData.length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '등록 중...' : `${excelData.length}개 요청 등록`}
            </button>
          </div>
        </div>
      ) : (
        /* 수동 입력 탭 */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 공통 정보 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">공통 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학교 *
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">학교 선택</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.region})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                수업 날짜 *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 수업 목록 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">
              수업 목록 ({items.length}개)
            </h3>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
              수업 추가
            </button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    수업 #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateItem(item)}
                      className="text-gray-400 hover:text-blue-600"
                      title="복제"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="삭제"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {/* 과목/프로그램 */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      과목/프로그램
                    </label>
                    <select
                      value={item.programId}
                      onChange={(e) => updateItem(item.id, 'programId', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">선택 또는 직접입력</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.id}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                    {!item.programId && (
                      <input
                        type="text"
                        value={item.customProgram}
                        onChange={(e) => updateItem(item.id, 'customProgram', e.target.value)}
                        placeholder="직접 입력 (예: 에코코스메틱)"
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* 강사 */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      강사
                    </label>
                    <select
                      value={item.instructorId}
                      onChange={(e) => updateItem(item.id, 'instructorId', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">강사 선택 (선택사항)</option>
                      {instructors
                        .filter((i) => i.homeBase)
                        .map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name} ({instructor.homeBase})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* 수업 시간 (시작~종료) */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      수업 시간
                    </label>
                    <div className="flex items-center gap-1">
                      <select
                        value={item.startTime}
                        onChange={(e) => updateItem(item.id, 'startTime', e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-500">~</span>
                      <select
                        value={item.endTime}
                        onChange={(e) => updateItem(item.id, 'endTime', e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-500 whitespace-nowrap">({item.sessions}차시)</span>
                    </div>
                  </div>

                  {/* 대상 학년 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      대상 학년
                    </label>
                    <input
                      type="text"
                      value={item.targetGrade}
                      onChange={(e) => updateItem(item.id, 'targetGrade', e.target.value)}
                      placeholder="예: 중2"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* 인원 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      인원
                    </label>
                    <input
                      type="number"
                      value={item.studentCount}
                      onChange={(e) => updateItem(item.id, 'studentCount', parseInt(e.target.value) || 25)}
                      min="1"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* 차시 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      차시
                    </label>
                    <input
                      type="number"
                      value={item.sessions}
                      onChange={(e) => updateItem(item.id, 'sessions', parseInt(e.target.value) || 2)}
                      min="1"
                      className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 메모 */}
                <div className="mt-2">
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                    placeholder="메모 (예: 김진아 친구)"
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 추가 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const newItems = Array(5).fill(null).map(() => createNewItem())
              setItems([...items, ...newItems])
            }}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            +5개 추가
          </button>
          <button
            type="button"
            onClick={() => {
              const newItems = Array(10).fill(null).map(() => createNewItem())
              setItems([...items, ...newItems])
            }}
            className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            +10개 추가
          </button>
        </div>

        {/* 요약 */}
        <div className="bg-gray-100 rounded-lg p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">총 수업 수:</span>
            <span className="font-semibold">{items.length}개</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">강사 배정됨:</span>
            <span className="font-semibold">
              {items.filter((i) => i.instructorId).length}개
            </span>
          </div>
        </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                onClose()
                resetForm()
              }}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !schoolId || !scheduledDate || items.length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {loading ? '등록 중...' : `${items.length}개 요청 등록`}
            </button>
          </div>
        </form>
      )}
    </FormModal>
  )
}
