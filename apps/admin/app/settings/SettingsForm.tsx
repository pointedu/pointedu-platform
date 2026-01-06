'use client'

import { useState, useEffect } from 'react'
import {
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

interface Setting {
  key: string
  label: string
  value: string
  type: string
}

interface SettingsCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  settings: Setting[]
}

const defaultSettings: SettingsCategory[] = [
  {
    id: 'company',
    name: '회사 정보',
    description: '회사 기본 정보 및 연락처 설정',
    icon: BuildingOffice2Icon,
    settings: [
      { key: 'company_name', label: '회사명', value: '(주)포인트교육', type: 'text' },
      { key: 'company_address', label: '주소', value: '경북 영주시 풍기읍', type: 'text' },
      { key: 'company_phone', label: '대표 전화', value: '054-123-4567', type: 'text' },
      { key: 'company_email', label: '대표 이메일', value: 'admin@pointedu.co.kr', type: 'email' },
      { key: 'company_ceo', label: '대표자', value: '홍길동', type: 'text' },
      { key: 'business_number', label: '사업자등록번호', value: '123-45-67890', type: 'text' },
    ],
  },
  {
    id: 'payment',
    name: '정산 설정',
    description: '강사 급여 및 정산 관련 설정',
    icon: CurrencyDollarIcon,
    settings: [
      { key: 'tax_rate', label: '원천징수율 (%)', value: '3.3', type: 'number' },
      { key: 'margin_rate', label: '기본 마진율 (%)', value: '15', type: 'number' },
      { key: 'vat_rate', label: '부가세율 (%)', value: '10', type: 'number' },
      { key: 'payment_day', label: '정산일', value: '25', type: 'number' },
      { key: 'min_session_fee', label: '최소 강사비 (원)', value: '70000', type: 'number' },
      { key: 'max_session_fee', label: '최대 강사비 (원)', value: '150000', type: 'number' },
    ],
  },
  {
    id: 'transport',
    name: '교통비 설정',
    description: '거리별 교통비 기준 설정',
    icon: DocumentTextIcon,
    settings: [
      { key: 'transport_0_20', label: '0~20km 교통비', value: '0', type: 'number' },
      { key: 'transport_20_40', label: '20~40km 교통비', value: '15000', type: 'number' },
      { key: 'transport_40_60', label: '40~60km 교통비', value: '25000', type: 'number' },
      { key: 'transport_60_80', label: '60~80km 교통비', value: '35000', type: 'number' },
      { key: 'transport_80_plus', label: '80km 이상 교통비', value: '45000', type: 'number' },
    ],
  },
  {
    id: 'notification',
    name: '알림 설정',
    description: '이메일 및 SMS 알림 설정',
    icon: BellIcon,
    settings: [
      { key: 'email_enabled', label: '이메일 알림 활성화', value: 'true', type: 'toggle' },
      { key: 'sms_enabled', label: 'SMS 알림 활성화', value: 'false', type: 'toggle' },
      { key: 'notify_new_request', label: '새 요청 알림', value: 'true', type: 'toggle' },
      { key: 'notify_assignment', label: '배정 알림', value: 'true', type: 'toggle' },
      { key: 'notify_payment', label: '정산 알림', value: 'true', type: 'toggle' },
    ],
  },
  {
    id: 'security',
    name: '보안 설정',
    description: '로그인 및 보안 관련 설정',
    icon: ShieldCheckIcon,
    settings: [
      { key: 'session_timeout', label: '세션 만료 시간 (분)', value: '60', type: 'number' },
      { key: 'max_login_attempts', label: '최대 로그인 시도', value: '5', type: 'number' },
      { key: 'password_min_length', label: '비밀번호 최소 길이', value: '8', type: 'number' },
      { key: 'require_2fa', label: '2단계 인증 필수', value: 'false', type: 'toggle' },
    ],
  },
]

interface SettingsFormProps {
  initialSettings: { key: string; value: string }[]
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Merge initial settings with defaults
    const merged: Record<string, string> = {}

    // Set defaults first
    defaultSettings.forEach(category => {
      category.settings.forEach(setting => {
        merged[setting.key] = setting.value
      })
    })

    // Override with saved settings
    initialSettings.forEach(s => {
      merged[s.key] = s.value
    })

    setSettings(merged)
  }, [initialSettings])

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleToggle = (key: string) => {
    const currentValue = settings[key] === 'true'
    handleChange(key, String(!currentValue))
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    const merged: Record<string, string> = {}
    defaultSettings.forEach(category => {
      category.settings.forEach(setting => {
        merged[setting.key] = setting.value
      })
    })
    setSettings(merged)
    setSaved(false)
  }

  return (
    <>
      <div className="space-y-8">
        {defaultSettings.map((category) => (
          <div
            key={category.id}
            className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl"
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-x-3">
                <category.icon className="h-6 w-6 text-gray-400" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.settings.map((setting) => (
                  <div key={setting.key} className="space-y-1">
                    <label
                      htmlFor={setting.key}
                      className="block text-sm font-medium text-gray-700"
                    >
                      {setting.label}
                    </label>
                    {setting.type === 'toggle' ? (
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(setting.key)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                            settings[setting.key] === 'true'
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}
                          role="switch"
                          aria-checked={settings[setting.key] === 'true'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              settings[setting.key] === 'true'
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="ml-3 text-sm text-gray-500">
                          {settings[setting.key] === 'true' ? '활성화' : '비활성화'}
                        </span>
                      </div>
                    ) : (
                      <input
                        type={setting.type}
                        id={setting.key}
                        name={setting.key}
                        value={settings[setting.key] || ''}
                        onChange={(e) => handleChange(setting.key, e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex items-center justify-end gap-x-4">
        {saved && (
          <span className="text-sm text-green-600">설정이 저장되었습니다.</span>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          기본값으로 초기화
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </>
  )
}
