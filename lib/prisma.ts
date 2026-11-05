import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Prisma 7 起不再内置查询引擎，连接由驱动适配器提供（MySQL/MariaDB 使用 mariadb 驱动）
const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma