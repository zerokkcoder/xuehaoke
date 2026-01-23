import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCachedPlans } from '@/lib/cache'

export async function GET() {
  const rows = await getCachedPlans()
  // Normalize features to array of strings
  const data = rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price || 0),
    durationDays: p.durationDays,
    dailyDownloads: p.dailyDownloads,
    isPopular: p.isPopular,
    features: Array.isArray(p.features as any) ? (p.features as any).map((s: any) => String(s)) : [],
  }))
  return NextResponse.json({ success: true, data })
}
