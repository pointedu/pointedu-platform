'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    position: '',
    phone: '',
    email: '',
    studentCount: '',
    preferredDate: '',
    programInterest: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('상담 신청이 완료되었습니다. 빠른 시일 내에 연락드리겠습니다.')
        setFormData({
          name: '',
          school: '',
          position: '',
          phone: '',
          email: '',
          studentCount: '',
          preferredDate: '',
          programInterest: '',
          message: '',
        })
      } else {
        toast.error('신청에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pt-24">
      <section className="relative py-24 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">문의하기</h1>
            <p className="text-xl text-white/80">
              진로체험 프로그램에 대해 궁금하신 점이 있으시면 문의해 주세요.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">연락처 정보</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <PhoneIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">전화</h3>
                    <p className="text-gray-600">054-123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <EnvelopeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">이메일</h3>
                    <p className="text-gray-600">info@pointedu.co.kr</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">주소</h3>
                    <p className="text-gray-600">경북 영주시 영주로 123</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">운영 시간</h3>
                    <p className="text-gray-600">평일 09:00 - 18:00</p>
                    <p className="text-sm text-gray-500">토/일/공휴일 휴무</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="bg-gray-50 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-8">상담 신청</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="label-text">담당자명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">학교/기관명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="label-text">직책</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="input-field"
                      placeholder="예: 진로담당교사"
                    />
                  </div>
                  <div>
                    <label className="label-text">연락처 *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="label-text">이메일</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label-text">예상 학생수</label>
                    <input
                      type="text"
                      value={formData.studentCount}
                      onChange={(e) => setFormData({ ...formData, studentCount: e.target.value })}
                      className="input-field"
                      placeholder="예: 30명"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="label-text">희망 일정</label>
                    <input
                      type="text"
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="input-field"
                      placeholder="예: 2025년 3월 중"
                    />
                  </div>
                  <div>
                    <label className="label-text">관심 프로그램</label>
                    <select
                      value={formData.programInterest}
                      onChange={(e) => setFormData({ ...formData, programInterest: e.target.value })}
                      className="input-field"
                    >
                      <option value="">선택해주세요</option>
                      <option value="ai">AI/코딩 교육</option>
                      <option value="vr">VR/AR 체험</option>
                      <option value="robot">로봇 공학</option>
                      <option value="drone">드론 교육</option>
                      <option value="medical">의료/바이오</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="label-text">문의 내용 *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-field resize-none"
                    placeholder="문의하실 내용을 자세히 작성해 주세요."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? '전송 중...' : '상담 신청하기'}
                </button>
              </motion.form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
