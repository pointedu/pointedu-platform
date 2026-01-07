// Point Education Platform - Database Client
// 포인트교육 플랫폼 데이터베이스 클라이언트

import { PrismaClient } from '@prisma/client'

// PrismaClient Singleton Pattern for serverless environment
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool optimization for serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// In production, we want to reuse the global prisma instance
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown handler for serverless
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

// Export all types
export * from '@prisma/client'

// Export helper functions
export { prisma as db }

export default prisma
