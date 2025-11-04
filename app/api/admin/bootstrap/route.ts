import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const pool = await getPool()
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'admin',
        status VARCHAR(16) NOT NULL DEFAULT 'active',
        last_login_at TIMESTAMP NULL,
        failed_attempts INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    const [rows] = await pool.query<any[]>(`SELECT id FROM admin_users WHERE username = ?`, ['admin'])
    if (rows.length === 0) {
      const hash = await bcrypt.hash('123456', 10)
      await pool.query(`INSERT INTO admin_users (username, password_hash, role, status) VALUES (?, ?, 'superadmin', 'active')`, ['admin', hash])
    }
    return NextResponse.json({ success: true, message: 'Bootstrap completed' })
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || 'Bootstrap failed' }, { status: 500 })
  }
}