'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

const programs = [
  {
    id: 1,
    title: 'AI & 코딩 교육',
    description: '인공지능의 기초부터 실제 프로젝트까지 체계적으로 배웁니다.',
    image: '/images/program-ai.jpg',
    category: '4차산업',
    duration: '2-4차시',
    tags: ['AI', '코딩', '프로그래밍'],
  },
  {
    id: 2,
    title: 'VR/AR 체험',
    description: '가상현실과 증강현실 기술을 직접 체험하고 콘텐츠를 제작합니다.',
    image: '/images/program-vr.jpg',
    category: '4차산업',
    duration: '2-3차시',
    tags: ['VR', 'AR', '메타버스'],
  },
  {
    id: 3,
    title: '로봇 공학',
    description: '로봇을 직접 조립하고 프로그래밍하여 작동시켜봅니다.',
    image: '/images/program-robot.jpg',
    category: '4차산업',
    duration: '3-4차시',
    tags: ['로봇', '공학', '제작'],
  },
  {
    id: 4,
    title: '드론 교육',
    description: '드론의 원리를 배우고 직접 조종하며 촬영 기술을 익힙니다.',
    image: '/images/program-drone.jpg',
    category: '4차산업',
    duration: '2-3차시',
    tags: ['드론', '항공', '촬영'],
  },
  {
    id: 5,
    title: '의료/바이오',
    description: '의료 분야의 다양한 직업을 체험하고 바이오 기술을 배웁니다.',
    image: '/images/program-medical.jpg',
    category: '메디컬',
    duration: '2-4차시',
    tags: ['의료', '바이오', '과학'],
  },
  {
    id: 6,
    title: '크리에이터 교육',
    description: '영상 제작과 편집 기술을 배워 나만의 콘텐츠를 만듭니다.',
    image: '/images/program-creator.jpg',
    category: '문화예술',
    duration: '2-3차시',
    tags: ['크리에이터', '영상', '편집'],
  },
]

export default function Programs() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
        >
          <div>
            <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Programs</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4">
              인기 프로그램
            </h2>
          </div>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-blue-600 font-medium hover:gap-3 transition-all mt-4 md:mt-0"
          >
            전체 프로그램 보기
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link href={`/programs/${program.id}`} className="block card card-hover">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl opacity-50">🎓</span>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
                      {program.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-500">{program.duration}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {program.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
