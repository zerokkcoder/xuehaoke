import { clsx, type ClassValue } from 'clsx'
import { motivationalQuotes, categories, resources } from './mock-data'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

export function getCategoryById(categoryId: string) {
  return categories.find(cat => cat.id === categoryId)
}

export function getSubcategoryById(subcategoryId: string) {
  for (const category of categories) {
    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId)
    if (subcategory) return subcategory
  }
  return null
}

export function getResourcesByCategory(categoryName: string) {
  return resources.filter(resource => resource.category === categoryName)
}

// Compatibility helper: filter by category id against provided resources list
// Used by category page: filterResourcesByCategory(resources, categoryId)
import type { Resource } from './mock-data'
export function filterResourcesByCategory(resourceList: Resource[], categoryId: string) {
  const category = getCategoryById(categoryId)
  if (!category) return []
  return resourceList.filter((resource) => resource.category === category.name)
}

export function getResourcesBySubcategory(subcategoryName: string) {
  return resources.filter(resource => resource.subcategory === subcategoryName)
}

export function searchResources(query: string) {
  const lowercaseQuery = query.toLowerCase()
  return resources.filter(resource => 
    resource.title.toLowerCase().includes(lowercaseQuery) ||
    resource.description.toLowerCase().includes(lowercaseQuery) ||
    resource.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}

export function getRandomMotivationalQuote(): string {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
}

// Re-export mock data
export * from './mock-data'