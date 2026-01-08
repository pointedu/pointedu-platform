'use client'

import { useState } from 'react'
import { BellAlertIcon, PaperAirplaneIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function NotificationTest() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [testType, setTestType] = useState<'test' | 'assignment'>('test')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: Record<string, unknown>
  } | null>(null)

  const handleTest = async () => {
    if (!phoneNumber) {
      setResult({ success: false, message: '전화번호를 입력해주세요.' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/-/g, ''),
          type: testType,
        }),
      })

      const data = await res.json()
      setResult({
        success: data.success,
        message: data.message || (data.success ? '알림 발송 성공!' : '알림 발송 실패'),
        details: data.details,
      })
    } catch (error) {
      setResult({
        success: false,
        message: '알림 테스트 중 오류가 발생했습니다.',
        details: { error: String(error) },
      })
    } finally {
      setLoading(false)
    }
  }

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  return (
    <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-x-3">
          <BellAlertIcon className="h-6 w-6 text-gray-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">알림 테스트</h2>
            <p className="text-sm text-gray-500">
              카카오 알림톡/브랜드 메시지 발송을 테스트합니다.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 테스트 유형 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            테스트 유형
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="testType"
                value="test"
                checked={testType === 'test'}
                onChange={() => setTestType('test')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">SMS 테스트</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="testType"
                value="assignment"
                checked={testType === 'assignment'}
                onChange={() => setTestType('assignment')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">배정 알림 테스트 (카카오톡)</span>
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {testType === 'test'
              ? 'SMS 테스트 메시지를 발송합니다.'
              : '카카오톡 배정 알림 템플릿을 테스트합니다. (카카오 채널 친구 추가 필요)'}
          </p>
        </div>

        {/* 전화번호 입력 */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            수신 전화번호
          </label>
          <div className="flex gap-3">
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              placeholder="010-1234-5678"
              className="flex-1 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              maxLength={13}
            />
            <button
              type="button"
              onClick={handleTest}
              disabled={loading || !phoneNumber}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {loading ? '발송 중...' : '테스트 발송'}
            </button>
          </div>
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
          <h3 className="text-sm font-medium text-gray-900 mb-2">알림 설정 정보</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <strong>SMS 테스트</strong>: 일반 문자 메시지로 발송됩니다.</li>
            <li>• <strong>배정 알림 테스트</strong>: 카카오톡 브랜드 메시지/알림톡으로 발송됩니다.</li>
            <li>• 카카오톡 알림을 받으려면 <strong>포인트교육 카카오채널</strong>을 친구 추가해야 합니다.</li>
            <li>• 브랜드 메시지는 채널 친구에게만 발송되며, SMS 대체 발송이 불가합니다.</li>
            <li>• 환경변수에 SOLAPI_API_KEY, SOLAPI_PF_ID 등이 설정되어 있어야 합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
