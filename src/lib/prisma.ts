import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'], // 只記錄錯誤，不顯示查詢日誌
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

