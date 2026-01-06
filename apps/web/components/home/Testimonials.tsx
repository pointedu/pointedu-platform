'use client'

import { motion } from 'framer-motion'
import { StarIcon } from '@heroicons/react/24/solid'

const testimonials = [
  {
    id: 1,
    content: '학생들이 AI와 로봇 수업에 정말 흥미를 가지고 참여했습니다. 강사님도 친절하시고 수업 준비도 철저하셨어요.',
    author: '김OO 선생님',
    role: '영주중학교',
    rating: 5,
  },
  {
    id: 2,
    content: 'VR 체험을 통해 학생들이 새로운 기술에 대한 관심을 갖게 되었습니다. 진로 탐색에 큰 도움이 되었어요.',
    author: '이OO 선생님',
    role: '안동초등학교',
    rating: 5,
  },
  {
    id: 3,
    content: '드론 교육 프로그램이 정말 좋았습니다. 학생들이 직접 조종해보면서 많은 것을 배웠습니다.',
    author: '박OO 선생님',
    role: '예천고등학교',
    rating: 5,
  },
  {
    id: 4,
    content: '매년 진로체험 행사를 포인트교육과 함께하고 있습니다. 프로그램 구성이 체계적이고 학생들 만족도가 높아요.',
    author: '최OO 교감선생님',
    role: '봉화중학교',
    rating: 5,
  },
]

export default function Testimonials() {
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
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-6">
            교육 현장의 목소리
          </h2>
          <p className="text-gray-600 text-lg">
            포인트교육과 함께한 학교와 선생님들의 생생한 후기입니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                "{testimonial.content}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
