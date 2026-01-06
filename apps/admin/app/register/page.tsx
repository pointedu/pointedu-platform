'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const availableSubjects = [
  'AI/코딩',
  '드론',
  '3D프린팅',
  '메이커',
  '진로체험',
  '과학실험',
  '로봇',
  '앱개발',
  '미디어',
  '영상편집',
]

const availableDays = ['월', '화', '수', '목', '금', '토']

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneNumber: '',
    homeBase: '',
    subjects: [] as string[],
    availableDays: [] as string[],
    rangeKm: '40-60',
    experience: '',
    certifications: '',
    bankAccount: '',
    residentNumber: '',
    emergencyContact: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (formData.subjects.length === 0) {
      setError('최소 1개 이상의 전문 과목을 선택해주세요.')
      return
    }

    if (formData.availableDays.length === 0) {
      setError('최소 1개 이상의 가능 요일을 선택해주세요.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          certifications: formData.certifications
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean),
          experience: formData.experience ? parseInt(formData.experience) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '회원가입에 실패했습니다.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }))
  }

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">가입 신청 완료</h2>
              <p className="mt-2 text-sm text-gray-600">
                강사 가입 신청이 완료되었습니다.
                <br />
                관리자 승인 후 로그인이 가능합니다.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  로그인 페이지로 이동
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Point Education</h1>
          <h2 className="mt-2 text-xl text-gray-600">강사 회원가입</h2>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 기본 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    거주지 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 영주시, 안동시"
                    value={formData.homeBase}
                    onChange={(e) => setFormData({ ...formData, homeBase: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">계정 정보</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 전문 분야 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">전문 분야</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전문 과목 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.subjects.includes(subject)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">경력 (년)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">자격증</label>
                  <input
                    type="text"
                    placeholder="쉼표로 구분하여 입력"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 활동 가능 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">활동 가능 정보</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가능 요일 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.availableDays.includes(day)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  활동 가능 범위 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.rangeKm}
                  onChange={(e) => setFormData({ ...formData, rangeKm: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="40-60">40-60km (근거리)</option>
                  <option value="70-90">70-90km (중거리)</option>
                  <option value="100-120">100-120km (장거리)</option>
                  <option value="120+">120km 이상</option>
                </select>
              </div>
            </div>

            {/* 정산 정보 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">정산 정보</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    주민등록번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000000-0000000"
                    value={formData.residentNumber}
                    onChange={(e) => setFormData({ ...formData, residentNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">원천징수 신고에 필요합니다</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">계좌번호</label>
                  <input
                    type="text"
                    placeholder="예: 신한 110-123-456789"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 비상연락처 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">추가 정보</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">비상연락처</label>
                <input
                  type="tel"
                  placeholder="긴급 시 연락 가능한 번호"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 추가 메시지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                관리자에게 전할 말 (선택)
              </label>
              <textarea
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="자기소개, 경력 사항 등을 자유롭게 작성해주세요."
              />
            </div>

            {/* 제출 버튼 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                이미 계정이 있으신가요? 로그인
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? '처리중...' : '가입 신청'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
