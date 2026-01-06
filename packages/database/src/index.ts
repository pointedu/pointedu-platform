// Point Education Platform - Database Client
// 포인트교육 플랫폼 데이터베이스 클라이언트

import { PrismaClient } from '@prisma/client'

// PrismaClient Singleton Pattern
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Export all types
export * from '@prisma/client'

// Export helper functions
export { prisma as db }

export default prisma
