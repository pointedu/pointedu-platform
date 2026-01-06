'use client'

import { motion } from 'framer-motion'
import {
  AcademicCapIcon,
  CpuChipIcon,
  UserGroupIcon,
  SparklesIcon,
  TrophyIcon,
  HeartIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: CpuChipIcon,
    title: '최신 기술 교육',
    description: 'AI, VR/AR, 로봇, 드론 등 4차 산업혁명 핵심 기술을 직접 체험하고 배웁니다.',
  },
  {
    icon: AcademicCapIcon,
    title: '맞춤형 커리큘럼',
    description: '학교와 학생의 수준에 맞춘 맞춤형 교육 프로그램을 제공합니다.',
  },
  {
    icon: UserGroupIcon,
    title: '전문 강사진',
    description: '현직 전문가와 교육 경력이 풍부한 강사진이 수업을 진행합니다.',
  },
  {
    icon: SparklesIcon,
    title: '체험형 학습',
    description: '이론 수업과 함께 실습을 통해 직접 경험하며 배우는 교육을 지향합니다.',
  },
  {
    icon: TrophyIcon,
    title: '진로 탐색',
    description: '다양한 직업 체험을 통해 학생들의 진로 탐색을 지원합니다.',
  },
  {
    icon: HeartIcon,
    title: '안전한 교육 환경',
    description: '철저한 안전 관리와 함께 즐겁고 안전한 교육 환경을 제공합니다.',
  },
]

export default function Features() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Why Choose Us</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-6">
            포인트교육이 특별한 이유
          </h2>
          <p className="text-gray-600 text-lg">
            10년 이상의 교육 경험과 전문성을 바탕으로 학생들에게 최고의 진로체험 교육을 제공합니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card p-8 card-hover"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
