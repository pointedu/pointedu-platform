import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    select: { id: true, email: true, name: true, role: true }
  })
  console.log('Admin users:', JSON.stringify(admins, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
