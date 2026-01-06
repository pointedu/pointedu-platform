'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Program {
  id: string
  code: string
  name: string
  category: string
  description: string
  targetGrades: string[]
  sessionCount: number
  sessionMinutes: number
  tags: string[]
  featured: boolean
}

const categories = [
  { id: 'all', name: '전체' },
  { id: 'FOURTHIND', name: '4차 산업' },
  { id: 'CULTURE', name: '문화예술' },
  { id: 'MEDICAL', name: '메디컬' },
  { id: 'PROFESSIONAL', name: '전문직' },
  { id: 'STEAM', name: 'STEAM' },
  { id: 'EXPERIENCE', name: '체험형' },
  { id: 'CAREER', name: '진로탐색' },
]

const categoryEmojis: Record<string, string> = {
  FOURTHIND: '🤖',
  CULTURE: '🎨',
  MEDICAL: '🏥',
  PROFESSIONAL: '💼',
  STEAM: '🔬',
  EXPERIENCE: '🎯',
  CAREER: '🧭',
  OTHER: '📚',
}

export default function ProgramList({ initialPrograms }: { initialPrograms: Program[] }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPrograms = initialPrograms.filter((program) => {
    const matchesCategory = selectedCategory === 'all' || program.category === selectedCategory
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div>
      {/* Filters */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="프로그램 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-xs"
          />
        </div>
      </div>

      {/* Program Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">등록된 프로그램이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/programs/${program.id}`} className="block card card-hover h-full">
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-100 to-purple-100 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">{categoryEmojis[program.category] || '📚'}</span>
                  </div>
                  {program.featured && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                        인기
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-medium">
                      {categories.find(c => c.id === program.category)?.name || program.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {program.sessionCount}차시 · {program.sessionMinutes}분
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{program.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{program.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {program.targetGrades.slice(0, 3).map((grade) => (
                      <span key={grade} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                        {grade}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
