'use client'

import { motion } from 'framer-motion'
import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'

const milestones = [
  { year: '2010', title: '포인트교육 설립', description: '경북 영주에서 진로교육 전문기업으로 시작' },
  { year: '2015', title: '전국 확대', description: '경북 전역으로 교육 서비스 확대' },
  { year: '2018', title: '4차산업 프로그램 도입', description: 'AI, VR, 로봇 등 신기술 교육 시작' },
  { year: '2020', title: '온라인 교육 플랫폼 런칭', description: '비대면 교육 시스템 구축' },
  { year: '2023', title: '누적 5만명 교육', description: '전국 500개 학교와 협력' },
]

const values = [
  {
    icon: AcademicCapIcon,
    title: '교육 철학',
    description: '학생 한 명 한 명의 꿈과 미래를 소중히 여기며, 체험을 통한 진정한 배움을 추구합니다.',
  },
  {
    icon: UserGroupIcon,
    title: '전문성',
    description: '현직 전문가와 경력 교육자들이 함께 만드는 체계적인 교육 프로그램을 제공합니다.',
  },
  {
    icon: TrophyIcon,
    title: '신뢰',
    description: '10년 이상의 교육 경험과 높은 만족도로 학교와 학생들의 신뢰를 받고 있습니다.',
  },
  {
    icon: BuildingOfficeIcon,
    title: '지역 사회',
    description: '지역 학교와의 긴밀한 협력을 통해 교육 격차 해소에 기여하고 있습니다.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-24">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              미래를 여는 교육,<br />
              포인트교육입니다
            </h1>
            <p className="text-xl text-white/80">
              2010년 설립 이래, 학생들의 진로 탐색과 미래 설계를 돕고 있습니다.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-padding">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              핵심 가치
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              포인트교육이 추구하는 가치와 교육 철학입니다.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              연혁
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-8 mb-8 last:mb-0"
              >
                <div className="flex-shrink-0 w-20 text-right">
                  <span className="text-2xl font-bold text-blue-600">{milestone.year}</span>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-blue-200 pl-8 relative">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-600 rounded-full" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{milestone.title}</h3>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
