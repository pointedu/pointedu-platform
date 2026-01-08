'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface GradeRule {
  name: string
  minClasses: number
  minRating: number
  feeMultiplier: number
  priority: number
  benefits: string[]
}

interface GradeRules {
  [key: string]: GradeRule
}

interface FeeRules {
  baseSessionFee: {
    elementary: number
    middle: number
    high: number
  }
  sessionFees: {
    [key: string]: number
  }
  transportFees: {
    [key: string]: number
  }
  specialAllowances: {
    weekend: number
    holiday: number
    emergency: number
    multipleClasses: number
  }
  taxWithholdingRate: number
  minSessionFee: number
  maxSessionFee: number
}

const GRADE_ICONS: { [key: string]: string } = {
  LEVEL1: '🥉',
  LEVEL2: '🥈',
  LEVEL3: '🥇',
  LEVEL4: '💎',
  EXTERNAL_BASIC: '🌐',
  EXTERNAL_PREMIUM: '⭐',
  EXTERNAL_VIP: '👑',
}

export default function InstructorRulesSettings() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'grade' | 'fee'>('grade')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gradeRules, setGradeRules] = useState<GradeRules | null>(null)
  const [feeRules, setFeeRules] = useState<FeeRules | null>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const [gradeRes, feeRes] = await Promise.all([
        fetch('/api/settings/grade-rules'),
        fetch('/api/settings/fee-rules'),
      ])

      if (gradeRes.ok) {
        const gradeData = await gradeRes.json()
        setGradeRules(gradeData)
      }

      if (feeRes.ok) {
        const feeData = await feeRes.json()
        setFeeRules(feeData)
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveGradeRules = async () => {
    if (!gradeRules) return

    setSaving(true)
    try {
      const res = await fetch('/api/settings/grade-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradeRules }),
      })

      if (res.ok) {
        alert('등급 규정이 저장되었습니다.')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const saveFeeRules = async () => {
    if (!feeRules) return

    setSaving(true)
    try {
      const res = await fetch('/api/settings/fee-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeRules }),
      })

      if (res.ok) {
        alert('강사비 규정이 저장되었습니다.')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '저장에 실패했습니다.')
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const updateGradeRule = (grade: string, field: string, value: number | string | string[]) => {
    if (!gradeRules) return
    setGradeRules({
      ...gradeRules,
      [grade]: {
        ...gradeRules[grade],
        [field]: value,
      },
    })
  }

  const updateFeeRule = (path: string, value: number) => {
    if (!feeRules) return

    const keys = path.split('.')
    const newRules = JSON.parse(JSON.stringify(feeRules))

    let obj = newRules
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]]
    }
    obj[keys[keys.length - 1]] = value

    setFeeRules(newRules)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('grade')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'grade'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            강사 등급 규정
          </button>
          <button
            onClick={() => setActiveTab('fee')}
            className={`px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'fee'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            강사비 규정
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'grade' && gradeRules && (
          <div className="space-y-6">
            {/* 내부 강사 등급 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">내부 강사 등급</h3>
              <div className="grid gap-4">
                {['LEVEL1', 'LEVEL2', 'LEVEL3', 'LEVEL4'].map((grade) => (
                  <div
                    key={grade}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{GRADE_ICONS[grade]}</span>
                      <input
                        type="text"
                        value={gradeRules[grade]?.name || ''}
                        onChange={(e) => updateGradeRule(grade, 'name', e.target.value)}
                        className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                      />
                      <span className="text-sm text-gray-500">({grade})</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">최소 수업 수</label>
                        <input
                          type="number"
                          value={gradeRules[grade]?.minClasses || 0}
                          onChange={(e) => updateGradeRule(grade, 'minClasses', parseInt(e.target.value) || 0)}
                          min="0"
                          className="w-full rounded border-gray-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">최소 평점</label>
                        <input
                          type="number"
                          value={gradeRules[grade]?.minRating || 0}
                          onChange={(e) => updateGradeRule(grade, 'minRating', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="5"
                          step="0.1"
                          className="w-full rounded border-gray-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">강사비 배수</label>
                        <input
                          type="number"
                          value={gradeRules[grade]?.feeMultiplier || 1}
                          onChange={(e) => updateGradeRule(grade, 'feeMultiplier', parseFloat(e.target.value) || 1)}
                          min="0.5"
                          max="3"
                          step="0.05"
                          className="w-full rounded border-gray-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">배수 적용</label>
                        <div className="text-sm font-medium text-blue-600 pt-2">
                          ×{gradeRules[grade]?.feeMultiplier?.toFixed(2)} ({((gradeRules[grade]?.feeMultiplier - 1) * 100).toFixed(0)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 외부 강사 등급 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">외부 강사 등급</h3>
              <div className="grid gap-4">
                {['EXTERNAL_BASIC', 'EXTERNAL_PREMIUM', 'EXTERNAL_VIP'].map((grade) => (
                  <div
                    key={grade}
                    className="border rounded-lg p-4 bg-teal-50"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{GRADE_ICONS[grade]}</span>
                      <input
                        type="text"
                        value={gradeRules[grade]?.name || ''}
                        onChange={(e) => updateGradeRule(grade, 'name', e.target.value)}
                        className="text-lg font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">강사비 배수</label>
                        <input
                          type="number"
                          value={gradeRules[grade]?.feeMultiplier || 1}
                          onChange={(e) => updateGradeRule(grade, 'feeMultiplier', parseFloat(e.target.value) || 1)}
                          min="0.5"
                          max="3"
                          step="0.05"
                          className="w-full rounded border-gray-300 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">배수 적용</label>
                        <div className="text-sm font-medium text-teal-600 pt-2">
                          ×{gradeRules[grade]?.feeMultiplier?.toFixed(2)} ({((gradeRules[grade]?.feeMultiplier - 1) * 100).toFixed(0)}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={saveGradeRules}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '등급 규정 저장'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'fee' && feeRules && (
          <div className="space-y-6">
            {/* 차시별 강사비 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">차시별 강사비</h3>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(feeRules.sessionFees).map(([sessions, fee]) => (
                  <div key={sessions} className="border rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600 mb-1">{sessions}차시</div>
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => updateFeeRule(`sessionFees.${sessions}`, parseInt(e.target.value) || 0)}
                      className="w-full text-center rounded border-gray-300 text-sm font-medium"
                      step="5000"
                    />
                    <div className="text-xs text-gray-500 mt-1">원</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 교통비 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">거리별 교통비</h3>
              <div className="grid grid-cols-6 gap-3">
                {Object.entries(feeRules.transportFees).map(([range, fee]) => (
                  <div key={range} className="border rounded-lg p-3 text-center bg-gray-50">
                    <div className="text-xs text-gray-600 mb-1">{range}km</div>
                    <input
                      type="number"
                      value={fee}
                      onChange={(e) => updateFeeRule(`transportFees.${range}`, parseInt(e.target.value) || 0)}
                      className="w-full text-center rounded border-gray-300 text-sm font-medium"
                      step="5000"
                    />
                    <div className="text-xs text-gray-500 mt-1">원</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 특수 수당 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">특수 수당</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">주말 수업</div>
                  <input
                    type="number"
                    value={feeRules.specialAllowances.weekend}
                    onChange={(e) => updateFeeRule('specialAllowances.weekend', parseInt(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    step="5000"
                  />
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">공휴일 수업</div>
                  <input
                    type="number"
                    value={feeRules.specialAllowances.holiday}
                    onChange={(e) => updateFeeRule('specialAllowances.holiday', parseInt(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    step="5000"
                  />
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">긴급 배정 (3일 이내)</div>
                  <input
                    type="number"
                    value={feeRules.specialAllowances.emergency}
                    onChange={(e) => updateFeeRule('specialAllowances.emergency', parseInt(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    step="5000"
                  />
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">하루 3개 이상 수업</div>
                  <input
                    type="number"
                    value={feeRules.specialAllowances.multipleClasses}
                    onChange={(e) => updateFeeRule('specialAllowances.multipleClasses', parseInt(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    step="5000"
                  />
                </div>
              </div>
            </div>

            {/* 기타 설정 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">기타 설정</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">원천징수율 (%)</div>
                  <input
                    type="number"
                    value={(feeRules.taxWithholdingRate * 100).toFixed(1)}
                    onChange={(e) => updateFeeRule('taxWithholdingRate', (parseFloat(e.target.value) || 0) / 100)}
                    className="w-full rounded border-gray-300 text-sm"
                    step="0.1"
                    min="0"
                    max="50"
                  />
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">최소 강사비</div>
                  <input
                    type="number"
                    value={feeRules.minSessionFee}
                    onChange={(e) => updateFeeRule('minSessionFee', parseInt(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    step="5000"
                  />
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">최대 강사비</div>
                  <input
                    type="number"
                    value={feeRules.maxSessionFee}
                    onChange={(e) => updateFeeRule('maxSessionFee', parseInt(e.target.value) || 0)}
                    className="w-full rounded border-gray-300 text-sm"
                    step="10000"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={saveFeeRules}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '강사비 규정 저장'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
