import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(req: Request) {
  try {
    const { username, password, remember } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '缺少用户名或密码' }, { status: 400 })
    }

    const pool = await getPool()

    // Ensure table exists
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

    // Ensure default admin exists
    const [rows] = await pool.query<any[]>(`SELECT id FROM admin_users WHERE username = ?`, ['admin'])
    if (rows.length === 0) {
      const hash = await bcrypt.hash('123456', 10)
      await pool.query(`INSERT INTO admin_users (username, password_hash, role, status) VALUES (?, ?, 'superadmin', 'active')`, ['admin', hash])
    }

    // Verify provided credentials
    const [userRows] = await pool.query<any[]>(`SELECT * FROM admin_users WHERE username = ? LIMIT 1`, [username])
    if (userRows.length === 0) {
      return NextResponse.json({ success: false, message: '账号不存在' }, { status: 401 })
    }
    const user = userRows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      await pool.query(`UPDATE admin_users SET failed_attempts = failed_attempts + 1 WHERE id = ?`, [user.id])
      return NextResponse.json({ success: false, message: '密码错误' }, { status: 401 })
    }

    await pool.query(`UPDATE admin_users SET last_login_at = NOW(), failed_attempts = 0 WHERE id = ?`, [user.id])

    // Issue JWT and set HttpOnly cookie
    const secret = process.env.ADMIN_JWT_SECRET || 'dev_secret_change_me'
    const token = jwt.sign({ uid: user.id, username: user.username, role: user.role }, secret, { expiresIn: remember ? '30d' : '2h' })
    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: remember ? 30 * 24 * 60 * 60 : 2 * 60 * 60,
    })
    return res
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || '服务器错误' }, { status: 500 })
  }
}