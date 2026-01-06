export const dynamic = 'force-dynamic'

import { prisma } from '@pointedu/database'
import ProgramList from './ProgramList'

async function getPrograms() {
  try {
    const programs = await prisma.program.findMany({
      where: { active: true },
      orderBy: [
        { featured: 'desc' },
        { popularity: 'desc' },
      ],
    })
    return programs
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return []
  }
}

export default async function ProgramsPage() {
  const programs = await getPrograms()

  return (
    <div className="pt-24">
      <section className="relative py-24 bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="container-custom">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              교육 프로그램
            </h1>
            <p className="text-xl text-white/80">
              다양한 분야의 진로체험 프로그램을 만나보세요.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <ProgramList initialPrograms={programs as any} />
        </div>
      </section>
    </div>
  )
}
