import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const instructor = await prisma.instructor.findFirst({
    where: { email: 'garam.kim@pointedu.co.kr' }
  })
  console.log('Instructor ID:', instructor?.id)
  console.log('Request ID: cmk13xmjp0001133bbddeohbg')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
