// Check and create admin user
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for admin users...')

  // Check existing admin users
  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'SUPER_ADMIN']
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })

  if (admins.length > 0) {
    console.log('\n=== Existing Admin Users ===')
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.name}) - Role: ${admin.role}`)
    })
  } else {
    console.log('No admin users found. Creating one...')

    const hashedPassword = await bcrypt.hash('PointEdu2025!', 10)

    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@pointedu.co.kr',
        password: hashedPassword,
        name: '관리자',
        role: 'ADMIN'
      }
    })

    console.log('\n=== New Admin Created ===')
    console.log(`Email: admin@pointedu.co.kr`)
    console.log(`Password: PointEdu2025!`)
    console.log(`Name: 관리자`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
