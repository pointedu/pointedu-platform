'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

const galleries = [
  { id: 1, title: 'AI 교육 현장', category: '4차산업', date: '2024-12', description: 'AI 프로그래밍 수업 현장' },
  { id: 2, title: 'VR 체험 교육', category: '4차산업', date: '2024-11', description: 'VR 콘텐츠 체험 수업' },
  { id: 3, title: '로봇 조립 수업', category: '4차산업', date: '2024-11', description: '로봇 조립 및 프로그래밍' },
  { id: 4, title: '드론 비행 체험', category: '4차산업', date: '2024-10', description: '드론 조종 실습' },
  { id: 5, title: '진로 박람회', category: '진로', date: '2024-10', description: '진로 탐색 박람회' },
  { id: 6, title: '메디컬 체험', category: '메디컬', date: '2024-09', description: '의료 분야 직업 체험' },
  { id: 7, title: '3D 프린팅', category: '4차산업', date: '2024-09', description: '3D 프린터 실습' },
  { id: 8, title: '코딩 교육', category: '4차산업', date: '2024-08', description: '프로그래밍 기초 수업' },
]

const categories = ['전체', '4차산업', '진로', '메디컬', '문화예술']

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)

  const filteredGalleries = galleries.filter(
    (item) => selectedCategory === '전체' || item.category === selectedCategory
  )

  return (
    <div className="pt-24">
      <section className="relative py-24 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">갤러리</h1>
            <p className="text-xl text-white/80">
              포인트교육의 다양한 교육 현장을 사진으로 만나보세요.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGalleries.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer"
                onClick={() => setSelectedImage(item.id)}
              >
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-medium">상세보기</span>
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={() => setSelectedImage(null)}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          <div className="max-w-4xl w-full">
            <div className="aspect-video bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl flex items-center justify-center">
              <span className="text-8xl">📸</span>
            </div>
            <div className="text-center mt-4">
              <h3 className="text-xl font-bold text-white">
                {galleries.find((g) => g.id === selectedImage)?.title}
              </h3>
              <p className="text-white/70 mt-2">
                {galleries.find((g) => g.id === selectedImage)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
