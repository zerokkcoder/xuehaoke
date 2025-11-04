'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ResourceCard from '@/components/ResourceCard';
import { resources, currentUser, categories } from '@/lib/utils';
import { StarIcon, EyeIcon, ArrowDownTrayIcon, ClockIcon, UserIcon, TagIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { checkDownloadRestrictions, processDownload, DownloadResult, getUserDownloadQuota } from '@/lib/download';

export default function ResourceDetailPage() {
  const params = useParams();
  const resourceId = params.id as string;
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (resourceId) {
      const foundResource = resources.find(r => r.id === resourceId);
      setResource(foundResource);
      setLoading(false);
    }
  }, [resourceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">资源未找到</h1>
          <Link href="/" className="text-primary hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const categoryObj = categories.find(c => c.name === resource.category);
  const subcategoryObj = categoryObj?.subcategories.find(s => s.name === resource.subcategory);
  const restrictions = checkDownloadRestrictions(resource, currentUser);
  const extractionCode = 'SiYh';
  const tagColors = ['#1f2937','#374151','#4b5563','#2563eb','#7c3aed','#0f766e','#b91c1c','#6b21a8','#1d4ed8','#15803d'];
  const currentIndex = resources.findIndex(r => r.id === resourceId);
  const prevResource = currentIndex > 0 ? resources[currentIndex - 1] : null;
  const nextResource = currentIndex >= 0 && currentIndex < resources.length - 1 ? resources[currentIndex + 1] : null;
  const likedResources = resources.filter(r => r.id !== resourceId).slice(0, 6);

  const copyExtractionCode = () => {
    navigator.clipboard?.writeText(extractionCode).then(() => {
      alert('提取码已复制');
    }).catch(() => {
      alert('复制失败，请手动选择提取码复制');
    });
  };

  const handleDownload = async () => {
    const restrictions = checkDownloadRestrictions(resource, currentUser);

    if (!restrictions.canDownload) {
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }

      if (restrictions.requiresVip) {
        setShowDownloadModal(true);
        return;
      }

      if (restrictions.requiresPayment) {
        setShowPaymentModal(true);
        return;
      }

      // Show restriction message
      alert(restrictions.reason);
      return;
    }

    // Process the download
    const result: DownloadResult = await processDownload(resource, currentUser);
    
    if (result.success) {
      alert(`${result.message} (交易ID: ${result.transactionId})`);
      // In a real app, you would start the actual download here
      // window.location.href = resource.downloadUrl;
    } else {
      alert(result.message);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>
        {i < Math.floor(rating) ? (
          <StarSolidIcon className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon className="h-4 w-4 text-gray-300" />
        )}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span>/</span>
          {categoryObj ? (
            <Link href={`/category/${categoryObj.id}`} className="hover:text-primary">
              {categoryObj.name}
            </Link>
          ) : (
            <span className="text-muted-foreground">{resource.category}</span>
          )}
          <span>/</span>
          {subcategoryObj ? (
            <>
              <Link href={`/category/${categoryObj?.id}/${subcategoryObj.id}`} className="hover:text-primary">
                {subcategoryObj.name}
              </Link>
              <span>/</span>
            </>
          ) : null}
          <span className="text-foreground">{resource.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Resource Header */}
            <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {resource.isNew && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    最新
                  </span>
                )}
                {resource.isPopular && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                    热门
                  </span>
                )}
                {resource.isVipOnly && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <ShieldCheckIcon className="h-3 w-3" />
                    VIP专享
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-4">{resource.title}</h1>

              {/* Category info: show last level only with gray dot */}
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <span className="inline-block w-3 h-3 rounded-full border border-gray-400 mr-2"></span>
                <span>
                  {subcategoryObj ? subcategoryObj.name : (categoryObj ? categoryObj.name : resource.subcategory || resource.category)}
                </span>
              </div>

              {/* Meta info removed per request */}

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed mb-6">{resource.description}</p>

              {/* Download section: always show both styles */}
              <div className="space-y-4">
                {/* 有下载权限时的展示 */}
                <div className="border-2 border-pink-300 border-dashed rounded-md p-4">
                  <div className="flex items-center flex-wrap gap-2 text-sm md:text-base text-foreground">
                    <span>链接</span>
                    <a
                      href={resource.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-pink-500 text-white px-3 py-1 text-xs md:text-sm hover:opacity-90"
                    >
                      点击下载
                    </a>
                    <span className="text-sm text-muted-foreground">（提取码: {extractionCode}）</span>
                    <button
                      onClick={copyExtractionCode}
                      className="text-pink-500 hover:underline text-xs md:text-sm"
                    >
                      复制
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    支付后点击下载按钮即可查看网盘链接，如果链接失效，可联系本站客服。
                  </p>
                </div>

                {/* 无下载权限时的展示 */}
                <div className="border-2 border-pink-300 border-dashed rounded-md p-4">
                  <div className="flex items-center flex-wrap gap-2 text-sm md:text-base text-foreground">
                    <span>资源下载价格</span>
                    <span className="font-semibold text-pink-500">{resource.price} 元</span>
                    <button
                      onClick={handleDownload}
                      className="rounded-full bg-pink-500 text-white px-3 py-1 text-xs md:text-sm hover:opacity-90"
                    >
                      立即交易
                    </button>
                    <span className="mx-1 text-muted-foreground">或</span>
                    <span>升级VIP后免费</span>
                    <Link href="/vip" className="rounded-full bg-yellow-400 text-black px-3 py-1 text-xs md:text-sm hover:opacity-90">
                      立即升级
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    支付后点击下载按钮即可查看网盘链接，如果链接失效，可联系本站客服。
                  </p>
                </div>
              </div>
              {/* Tags inside card bottom */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {resource.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs md:text-sm rounded-none text-white hover:opacity-90 cursor-pointer transition-colors"
                    style={{ backgroundColor: tagColors[index % tagColors.length] }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Prev/Next navigation */}
              <div className="py-4 px-2 md:px-4 bg-card rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="max-w-[45%]">
                    <div className="text-xs text-muted-foreground mb-1">上一篇</div>
                    {prevResource ? (
                      <Link href={`/resource/${prevResource.id}`} className="block text-primary hover:underline truncate">
                        {prevResource.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">已是第一篇</span>
                    )}
                  </div>
                  <div className="h-6 mx-4 border-l border-dashed border-border" />
                  <div className="text-right max-w-[45%]">
                    <div className="text-xs text-muted-foreground mb-1">下一篇</div>
                    {nextResource ? (
                      <Link href={`/resource/${nextResource.id}`} className="block text-primary hover:underline truncate">
                        {nextResource.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">已是最后一篇</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Guess you like (separate block) */}
              <div className="py-4 px-2 md:px-4 bg-card rounded-lg shadow-sm mt-4">
                <div className="text-sm text-foreground font-bold mb-2">猜你喜欢</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {likedResources.map((res, idx) => (
                    <ResourceCard key={res.id} resource={res} index={idx} />
                  ))}
                </div>
              </div>
          </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resource Download (always visible) */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">资源下载</h3>
                <div className="text-sm text-muted-foreground mb-2">链接:</div>
                <a
                  href={resource.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg bg-pink-500 text-white text-center py-3 hover:opacity-90"
                >
                  点击下载
                </a>
                <p className="text-xs text-muted-foreground mt-3">
                  支付后点击下载按钮即可查看网盘链接，如果链接失效，可联系本站客服。
                </p>
              </div>

              {/* No-permission purchase/VIP hint (always visible as requested) */}
              <div className="bg-card rounded-lg shadow-sm p-6">
                <div className="text-center mb-2">
                  <span className="text-4xl font-bold text-pink-500">{resource.price}</span>
                  <span className="ml-1 text-base text-foreground">元</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                  <span>VIP免费查看/下载</span>
                  <Link href="/vip" className="rounded-full bg-yellow-400 text-black px-3 py-1 text-xs hover:opacity-90">
                    升级VIP
                  </Link>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full rounded-lg bg-pink-500 text-white py-3 hover:opacity-90"
                >
                  立即交易
                </button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  支付后点击下载按钮即可查看网盘链接，如果链接失效，可联系本站客服。
                </p>
              </div>

            {/* Hot Articles */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">热门文章</h3>
              <div className="space-y-2">
                {resources
                  .slice()
                  .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
                  .slice(0, 6)
                  .map((r) => (
                    <Link
                      key={r.id}
                      href={`/resource/${r.id}`}
                      className="block text-foreground hover:underline truncate font-medium"
                    >
                      {r.title}
                    </Link>
                  ))}
              </div>
            </div>

            {/* Hot Tags */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">热门标签</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(resources.flatMap(r => r.tags))).map((tag, idx) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs md:text-sm rounded-none text-white hover:opacity-90"
                    style={{ backgroundColor: tagColors[idx % tagColors.length] }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">VIP专享资源</h3>
            <p className="text-muted-foreground mb-6">
              此资源为VIP专享，需要开通VIP会员才能下载。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 btn btn-secondary"
              >
                取消
              </button>
              <Link href="/vip" className="flex-1 btn btn-accent">
                开通VIP
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">付费下载</h3>
            <p className="text-muted-foreground mb-4">
              此资源需要支付 ¥{resource.price} 后才能下载。
            </p>
            <div className="bg-secondary rounded-lg p-4 mb-6">
              <p className="text-sm text-secondary-foreground mb-2">选择支付方式:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment" defaultChecked className="text-primary" />
                  <span className="text-foreground">支付宝</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="payment" className="text-primary" />
                  <span className="text-foreground">微信支付</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => {
                  alert('跳转到支付页面...');
                  setShowPaymentModal(false);
                }}
                className="flex-1 btn btn-primary"
              >
                立即支付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}