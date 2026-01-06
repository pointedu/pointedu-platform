import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get school and program IDs
  const school = await prisma.school.findFirst()
  const program = await prisma.program.findFirst()

  if (!school || !program) {
    console.log('No school or program found')
    return
  }

  console.log('School:', school.name)
  console.log('Program:', program.name)

  // Create unassigned school request
  const req = await prisma.schoolRequest.create({
    data: {
      requestNumber: 'REQ-2025-TEST-001',
      schoolId: school.id,
      programId: program.id,
      sessions: 2,
      studentCount: 25,
      targetGrade: '중2',
      desiredDate: new Date('2025-03-15'),
      schoolBudget: 200000,
      status: 'APPROVED',
      requirements: '테스트용 수업 - 오전 수업 희망'
    }
  })

  console.log('Created request:', req.requestNumber, req.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
