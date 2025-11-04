'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { resources, categories, getCategoryById, filterResourcesByCategory } from '@/lib/utils';
import ResourceCard from '@/components/ResourceCard';
import { FunnelIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [category, setCategory] = useState<any>(null);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (categoryId) {
      const foundCategory = getCategoryById(categoryId);
      setCategory(foundCategory);
      
      if (foundCategory) {
        const categoryResources = filterResourcesByCategory(resources, categoryId);
        setFilteredResources(categoryResources);
        setTotalPages(Math.ceil(categoryResources.length / itemsPerPage));
      }
      
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    let sortedResources = [...filteredResources];
    
    switch (sortBy) {
      case 'newest':
        sortedResources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        sortedResources.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'rating':
        sortedResources.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        sortedResources.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sortedResources.sort((a, b) => b.price - a.price);
        break;
    }
    
    setFilteredResources(sortedResources);
  }, [sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">分类未找到</h1>
          <Link href="/" className="text-primary hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{category.name}</h1>
              <p className="text-muted-foreground">
                共找到 {filteredResources.length} 个资源
              </p>
            </div>
            
            {category.description && (
              <p className="text-muted-foreground max-w-md">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Subcategories */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">子分类</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/category/${categoryId}`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                全部
              </Link>
              {category.subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/category/${categoryId}/${subcategory.id}`}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  {subcategory.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">最新发布</option>
                <option value="popular">下载最多</option>
                <option value="rating">评分最高</option>
                <option value="price-low">价格从低到高</option>
                <option value="price-high">价格从高到低</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">视图:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Resources Grid/List */}
        {paginatedResources.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-muted-foreground mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">暂无资源</h3>
            <p className="text-muted-foreground">该分类下还没有资源，敬请期待。</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {paginatedResources.map((resource) => (
              viewMode === 'grid' ? (
                <ResourceCard key={resource.id} resource={resource} />
              ) : (
                <div key={resource.id} className="bg-card rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={resource.image}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/resource/${resource.id}`}>
                        <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors truncate">
                          {resource.title}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {resource.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{resource.views} 浏览</span>
                          <span>{resource.downloads} 下载</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {resource.price > 0 ? (
                            <span className="text-lg font-semibold text-primary">¥{resource.price}</span>
                          ) : (
                            <span className="text-sm text-green-600 font-medium">免费</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:bg-secondary'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}