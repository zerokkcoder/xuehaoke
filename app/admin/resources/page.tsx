'use client'

import Link from 'next/link'
import { resources } from '@/lib/utils'

export default function AdminResourcesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">资源管理</h2>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">标题</th>
                <th className="py-2 pr-4">分类</th>
                <th className="py-2 pr-4">子分类</th>
                <th className="py-2 pr-4">价格</th>
                <th className="py-2 pr-4">下载</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 pr-4">
                    <Link href={`/resource/${r.id}`} className="text-foreground hover:text-primary truncate inline-block max-w-[280px]">
                      {r.title}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{r.category}</td>
                  <td className="py-2 pr-4">{r.subcategory}</td>
                  <td className="py-2 pr-4">¥{r.price}</td>
                  <td className="py-2 pr-4">{r.downloadCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}