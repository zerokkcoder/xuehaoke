import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

async function ensureTables() {
  const pool = await getPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(128) NOT NULL UNIQUE,
      sort INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(128) NOT NULL,
      sort INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cat (category_id),
      CONSTRAINT fk_cat_categories FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
  return pool
}

export async function GET() {
  const pool = await ensureTables()
  const [rows] = await pool.query<any[]>(`
    SELECT 
      c.id AS category_id, c.name AS category_name, c.sort AS category_sort,
      s.id AS sub_id, s.name AS sub_name, s.sort AS sub_sort
    FROM categories c
    LEFT JOIN subcategories s ON s.category_id = c.id
    ORDER BY c.sort ASC, c.id DESC, s.sort ASC, s.id ASC
  `)

  const map = new Map<number, { id: number; name: string; sort: number; subcategories: { id: number; name: string; sort: number }[] }>()
  for (const r of rows as any[]) {
    const cid = r.category_id
    if (!map.has(cid)) {
      map.set(cid, { id: cid, name: r.category_name, sort: r.category_sort ?? 0, subcategories: [] })
    }
    if (r.sub_id) {
      map.get(cid)!.subcategories.push({ id: r.sub_id, name: r.sub_name, sort: r.sub_sort ?? 0 })
    }
  }
  const data = Array.from(map.values())
  return NextResponse.json({ success: true, data })
}