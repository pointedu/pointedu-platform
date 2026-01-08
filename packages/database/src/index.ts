// Point Education Platform - Database Client
// 포인트교육 플랫폼 데이터베이스 클라이언트

import { PrismaClient } from '@prisma/client'

// PrismaClient Singleton Pattern for serverless environment
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Build database URL with connection pool parameters for Supabase
const getDatabaseUrl = () => {
  const baseUrl = process.env.DATABASE_URL || ''
  // Add connection pool parameters for serverless environment
  if (baseUrl && !baseUrl.includes('connection_limit')) {
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}connection_limit=10&pool_timeout=30&connect_timeout=30`
  }
  return baseUrl
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool optimization for serverless
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

// In production, we want to reuse the global prisma instance
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Prevent multiple instances in production
if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = prisma

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
