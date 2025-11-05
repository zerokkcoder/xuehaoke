import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // 预置管理员账号（admin / 123456）
  const existing = await prisma.adminUser.findUnique({ where: { username: 'admin' }, select: { id: true } })
  if (!existing) {
    const hash = await bcrypt.hash('123456', 10)
    await prisma.adminUser.create({
      data: {
        username: 'admin',
        passwordHash: hash,
        role: 'superadmin',
        status: 'active',
      },
    })
    console.log('Seed: 默认管理员 admin 已创建（密码：123456）')
  } else {
    console.log('Seed: 默认管理员已存在，跳过创建')
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })