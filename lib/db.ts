import mysql from 'mysql2/promise'

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'kukude',
}

let pool: mysql.Pool | null = null

async function ensureDatabase() {
  // Try create database if not exists using a connection without db selected
  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  })
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4`)
  await conn.end()
}

export async function getPool() {
  if (!pool) {
    await ensureDatabase()
    pool = mysql.createPool({
      ...config,
      connectionLimit: 5,
    })
  }
  return pool
}