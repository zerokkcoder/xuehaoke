import "../globals.css";
import AdminShell from "./_components/AdminShell";

export const dynamic = 'force-dynamic'
export const revalidate = 0
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminShell>{children}</AdminShell>
}