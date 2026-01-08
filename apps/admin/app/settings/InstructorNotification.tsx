'use client'

import { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface Instructor {
  id: string
  name: string
  phoneNumber: string
  status: string
  subjects: string[]
}

// 카카오톡 알림톡 템플릿 정보
const KAKAO_TEMPLATES = [
  {
    type: 'INSTRUCTOR_REGISTERED',
    name: '강사등록완료',
    description: '강사 가입 승인 시 발송',
    variables: ['이름'],
  },
  {
    type: 'CLASS_ASSIGNED',
    name: '수업배정안내',
    description: '수업 배정 시 발송',
    variables: ['이름', '학교명', '프로그램', '수업일', '수업시간'],
  },
  {
    type: 'CLASS_REMINDER_5DAYS',
    name: '배정된 수업 5일 전',
    description: '수업 5일 전 리마인더',
    variables: ['이름', '학교명', '프로그램', '수업일', '수업시간'],
  },
]

export default function InstructorNotification() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [notificationType, setNotificationType] = useState<'sms' | 'kakao'>('sms')
  const [templateType, setTemplateType] = useState('INSTRUCTOR_REGISTERED')
  const [templateData, setTemplateData] = useState({
    schoolName: '',
    programName: '',
    classDate: '',
    classTime: '',
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: Record<string, unknown>
  } | null>(null)

  // 강사 목록 가져오기
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const res = await fetch('/api/instructors')
        const data = await res.json()

        // API가 배열을 직접 반환하거나 { data: [...] } 형식일 수 있음
        const instructorList = Array.isArray(data) ? data : (data.data || [])

        // 활성 상태이고 전화번호가 있는 강사만 필터링
        const activeInstructors = instructorList.filter(
          (i: Instructor) => i.status === 'ACTIVE' && i.phoneNumber
        )
        setInstructors(activeInstructors)
      } catch (error) {
        console.error('Failed to fetch instructors:', error)
      } finally {
        setFetchLoading(false)
      }
    }

    fetchInstructors()
  }, [])

  // 선택된 템플릿 정보
  const selectedTemplate = KAKAO_TEMPLATES.find(t => t.type === templateType)

  // 검색 필터링
  const filteredInstructors = instructors.filter(instructor => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return true

    const nameMatch = instructor.name?.toLowerCase().includes(term) || false
    const phoneMatch = instructor.phoneNumber?.includes(searchTerm) || false
    const subjectMatch = Array.isArray(instructor.subjects) &&
      instructor.subjects.some(s => s?.toLowerCase().includes(term))

    return nameMatch || phoneMatch || subjectMatch
  })

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedIds.length === filteredInstructors.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredInstructors.map(i => i.id))
    }
  }

  // 개별 선택
  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  // 알림 발송
  const handleSend = async () => {
    if (selectedIds.length === 0) {
      setResult({ success: false, message: '강사를 선택해주세요.' })
      return
    }

    // SMS일 경우에만 메시지 필수
    if (notificationType === 'sms' && !message.trim()) {
      setResult({ success: false, message: '메시지를 입력해주세요.' })
      return
    }

    // 카카오톡 템플릿에 필요한 변수 확인
    if (notificationType === 'kakao' && selectedTemplate) {
      const requiredVars = selectedTemplate.variables.filter(v => v !== '이름')
      if (requiredVars.length > 0) {
        if (requiredVars.includes('학교명') && !templateData.schoolName) {
          setResult({ success: false, message: '학교명을 입력해주세요.' })
          return
        }
        if (requiredVars.includes('프로그램') && !templateData.programName) {
          setResult({ success: false, message: '프로그램을 입력해주세요.' })
          return
        }
        if (requiredVars.includes('수업일') && !templateData.classDate) {
          setResult({ success: false, message: '수업일을 입력해주세요.' })
          return
        }
        if (requiredVars.includes('수업시간') && !templateData.classTime) {
          setResult({ success: false, message: '수업시간을 입력해주세요.' })
          return
        }
      }
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorIds: selectedIds,
          message: message.trim(),
          notificationType,
          templateType: notificationType === 'kakao' ? templateType : undefined,
          templateData: notificationType === 'kakao' ? templateData : undefined,
        }),
      })

      const data = await res.json()
      setResult({
        success: data.success,
        message: data.message || (data.success ? '알림 발송 성공!' : '알림 발송 실패'),
        details: data.details,
      })

      if (data.success) {
        setMessage('')
        setSelectedIds([])
        setTemplateData({
          schoolName: '',
          programName: '',
          classDate: '',
          classTime: '',
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: '알림 발송 중 오류가 발생했습니다.',
        details: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  // 카카오톡 발송 버튼 비활성화 조건
  const isKakaoDisabled = () => {
    if (selectedIds.length === 0) return true
    if (!selectedTemplate) return true

    const requiredVars = selectedTemplate.variables.filter(v => v !== '이름')
    if (requiredVars.includes('학교명') && !templateData.schoolName) return true
    if (requiredVars.includes('프로그램') && !templateData.programName) return true
    if (requiredVars.includes('수업일') && !templateData.classDate) return true
    if (requiredVars.includes('수업시간') && !templateData.classTime) return true

    return false
  }

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-x-3">
          <UserGroupIcon className="h-6 w-6 text-gray-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">강사 알림 발송</h2>
            <p className="text-sm text-gray-500">
              선택한 강사에게 SMS 또는 카카오톡 알림을 발송합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 발송 방식 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            발송 방식
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="notificationType"
                value="sms"
                checked={notificationType === 'sms'}
                onChange={() => setNotificationType('sms')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">SMS 문자</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="notificationType"
                value="kakao"
                checked={notificationType === 'kakao'}
                onChange={() => setNotificationType('kakao')}
                className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">카카오톡 알림톡</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {notificationType === 'sms'
              ? 'SMS는 모든 강사에게 발송됩니다.'
              : '카카오톡은 포인트교육 채널을 친구 추가한 강사에게만 발송됩니다.'}
          </p>
        </div>

        {/* 카카오톡 템플릿 선택 */}
        {notificationType === 'kakao' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              알림톡 템플릿 선택
            </label>
            <div className="space-y-2">
              {KAKAO_TEMPLATES.map((template) => (
                <label
                  key={template.type}
                  className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                    templateType === template.type
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="templateType"
                    value={template.type}
                    checked={templateType === template.type}
                    onChange={(e) => setTemplateType(e.target.value)}
                    className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 mt-0.5"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{template.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      변수: {template.variables.map(v => `#{${v}}`).join(', ')}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 카카오톡 템플릿 변수 입력 */}
        {notificationType === 'kakao' && selectedTemplate && selectedTemplate.variables.length > 1 && (
          <div className="bg-yellow-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-medium text-yellow-800">템플릿 변수 입력</h4>
            <div className="grid grid-cols-2 gap-4">
              {selectedTemplate.variables.includes('학교명') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    학교명 *
                  </label>
                  <input
                    type="text"
                    value={templateData.schoolName}
                    onChange={(e) => setTemplateData({ ...templateData, schoolName: e.target.value })}
                    placeholder="예: OO중학교"
                    className="w-full rounded-md border-0 py-2 px-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-500"
                  />
                </div>
              )}
              {selectedTemplate.variables.includes('프로그램') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    프로그램 *
                  </label>
                  <input
                    type="text"
                    value={templateData.programName}
                    onChange={(e) => setTemplateData({ ...templateData, programName: e.target.value })}
                    placeholder="예: AI 진로체험"
                    className="w-full rounded-md border-0 py-2 px-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-500"
                  />
                </div>
              )}
              {selectedTemplate.variables.includes('수업일') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    수업일 *
                  </label>
                  <input
                    type="text"
                    value={templateData.classDate}
                    onChange={(e) => setTemplateData({ ...templateData, classDate: e.target.value })}
                    placeholder="예: 2024년 1월 15일(월)"
                    className="w-full rounded-md border-0 py-2 px-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-500"
                  />
                </div>
              )}
              {selectedTemplate.variables.includes('수업시간') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    수업시간 *
                  </label>
                  <input
                    type="text"
                    value={templateData.classTime}
                    onChange={(e) => setTemplateData({ ...templateData, classTime: e.target.value })}
                    placeholder="예: 오전 10:00 ~ 12:00"
                    className="w-full rounded-md border-0 py-2 px-3 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 검색 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            강사 검색
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 전화번호, 과목으로 검색..."
              className="w-full rounded-md border-0 py-2 pl-9 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            />
          </div>
        </div>

        {/* 강사 목록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              강사 선택 ({selectedIds.length}명 선택됨)
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {selectedIds.length === filteredInstructors.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          {fetchLoading ? (
            <div className="text-center py-8 text-gray-500">강사 목록 로딩 중...</div>
          ) : filteredInstructors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '활성 강사가 없습니다.'}
            </div>
          ) : (
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredInstructors.map((instructor) => (
                <label
                  key={instructor.id}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(instructor.id)}
                    onChange={() => handleSelect(instructor.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{instructor.name}</span>
                      <span className="text-sm text-gray-500">{instructor.phoneNumber}</span>
                    </div>
                    {instructor.subjects && instructor.subjects.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {instructor.subjects.slice(0, 3).join(', ')}
                        {instructor.subjects.length > 3 && ` 외 ${instructor.subjects.length - 3}개`}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* SMS 메시지 입력 */}
        {notificationType === 'sms' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              알림 메시지
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="강사에게 보낼 메시지를 입력하세요..."
              rows={3}
              maxLength={80}
              className="w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              메시지 앞에 &quot;[포인트교육] 강사명님,&quot; 이 자동으로 추가됩니다. ({message.length}/80자)
            </p>
          </div>
        )}

        {/* 발송 버튼 */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || (notificationType === 'sms' ? (selectedIds.length === 0 || !message.trim()) : isKakaoDisabled())}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              notificationType === 'kakao'
                ? 'bg-yellow-500 hover:bg-yellow-400'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            {loading ? '발송 중...' : `${selectedIds.length}명에게 ${notificationType === 'kakao' ? '카카오톡' : 'SMS'} 발송`}
          </button>
        </div>

        {/* 결과 표시 */}
        {result && (
          <div
            className={`rounded-lg p-4 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {result.message}
                </p>
                {result.details && (
                  <pre className="mt-2 text-xs text-gray-600 bg-white/50 rounded p-2 overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 도움말 */}
        <div className="rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">사용 안내</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 활성 상태이고 전화번호가 등록된 강사만 목록에 표시됩니다.</li>
            <li>• <strong>SMS</strong>: 모든 강사에게 발송 가능, 80자 이내</li>
            <li>• <strong>카카오톡 알림톡</strong>: 승인된 템플릿을 통해 발송 (포인트교육 채널 친구에게만)</li>
            <li>• 전체 선택 버튼을 사용하여 모든 강사를 한번에 선택할 수 있습니다.</li>
            <li>• 발송 후 결과를 확인하여 정상 발송 여부를 확인해주세요.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
