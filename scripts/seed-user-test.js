import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hashed = crypto.scryptSync(password, salt, 64)
  return `${salt.toString('hex')}:${hashed.toString('hex')}`
}

;(async () => {
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.create({
      data: {
        username: 'test',
        email: 'test@example.com',
        passwordHash: hashPassword('test'),
        emailVerified: true,
      },
    })
    console.log('Inserted:', { id: user.id, username: user.username, email: user.email })
  } catch (err) {
    console.error('Error inserting test user:', err?.message || err)
  } finally {
    await prisma.$disconnect()
  }
})()