import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminShell from '@/app/admin/_components/AdminShell'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) redirect('/admin/login')
  return <AdminShell>{children}</AdminShell>
}
