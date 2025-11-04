'use client'

import { categories } from '@/lib/utils'

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">分类管理</h2>

      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">名称</th>
                <th className="py-2 pr-4">子分类数</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">{c.subcategories.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}