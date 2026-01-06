import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find the pending application
  const application = await prisma.classApplication.findFirst({
    where: { status: 'PENDING' },
    include: {
      instructor: true,
      request: {
        include: { school: true, program: true }
      }
    }
  })

  if (!application) {
    console.log('No pending applications found')
    return
  }

  console.log('Found pending application:')
  console.log('  ID:', application.id)
  console.log('  Instructor:', application.instructor.name)
  console.log('  Request:', application.request.requestNumber)
  console.log('  School:', application.request.school.name)
  console.log('  Program:', application.request.program?.name || 'N/A')
  console.log('')

  // Approve the application
  const approved = await prisma.classApplication.update({
    where: { id: application.id },
    data: {
      status: 'APPROVED',
      reviewedBy: 'admin@pointedu.co.kr',
      reviewedAt: new Date(),
      reviewNote: 'API 테스트 승인'
    }
  })

  console.log('Application approved!')
  console.log('  Status:', approved.status)
  console.log('  Reviewed by:', approved.reviewedBy)
  console.log('  Reviewed at:', approved.reviewedAt)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
