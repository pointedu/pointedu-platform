import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'azeyo350@gmail.com'
  const password = 'dmstjs0905!!'
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      active: true,
    },
    create: {
      email,
      password: hashedPassword,
      name: '관리자',
      role: 'ADMIN',
      active: true,
    },
  })

  console.log('Admin user created/updated:', user.email, user.role)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
