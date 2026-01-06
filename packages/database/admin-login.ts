import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@pointedu.co.kr' }
  })

  if (admin) {
    console.log('Admin found:', admin.email)
    console.log('Admin ID:', admin.id)
    console.log('Admin role:', admin.role)
    console.log('Admin password hash:', admin.password?.substring(0, 20) + '...')

    // Try to verify password
    const isValid = await bcrypt.compare('admin123!', admin.password)
    console.log('Password admin123! valid:', isValid)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
