import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const body = '9b4a2ce3877e6e39e17dcd79a791ad0f3075008b'
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}