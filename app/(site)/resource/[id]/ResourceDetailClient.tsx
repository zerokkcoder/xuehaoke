'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import ResourceCard from '@/components/ResourceCard';
import { resources, currentUser } from '@/lib/utils';
import { StarIcon, EyeIcon, ArrowDownTrayIcon, ClockIcon, UserIcon, TagIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import PaymentModal from '@/components/PaymentModal'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { checkDownloadRestrictions, processDownload, DownloadResult, getUserDownloadQuota } from '@/lib/download';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

export default function ResourceDetailClient({ 
  resource: initialResource, 
  prevNext: initialPrevNext, 
  hotTags: initialHotTags, 
  latestArticles: initialLatestArticles, 
  guessList: initialGuessList 
}: {
  resource: any
  prevNext: { prev: { id: number; title: string } | null; next: { id: number; title: string } | null }
  hotTags: { id: number; name: string; slug?: string | null }[]
  latestArticles: { id: number; title: string }[]
  guessList: { id: number; title: string; coverImage: string; category: string }[]
}) {
  const { toast } = useToast();
  // Use initial data from props, can be updated via client-side logic if needed
  const [resource, setResource] = useState<any>(initialResource);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [prevNext, setPrevNext] = useState(initialPrevNext)
  const [hotTags, setHotTags] = useState(initialHotTags)
  const [latestArticles, setLatestArticles] = useState(initialLatestArticles)
  const [guessList, setGuessList] = useState(initialGuessList)
  const [hasAccess, setHasAccess] = useState(false)
  const [accessChecked, setAccessChecked] = useState(false)
  const [serverAuthorized, setServerAuthorized] = useState(false)

  // On mount, perform access checks that require client context (localStorage, cookies)
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!resource) return
        // If we already have download info from SSR (e.g. public resource or implicit logic), use it
        // Note: For sensitive access (purchased/VIP), usually we need client-side auth token or cookie check
        // If server rendered limited info, we try to fetch full access info if logged in
        const raw = window.localStorage.getItem('site_user')
        if (!raw) { setAccessChecked(true); return }
        const u = JSON.parse(raw)
        const username = u?.username
        if (!username) { setAccessChecked(true); return }
        const res = await fetch('/api/resources/access', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId: Number(resource.id), username })
        })
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          setHasAccess(!!json.data?.hasAccess)
        }
      } catch {}
      finally { setAccessChecked(true) }
    }
    checkAccess()
    
    // View count increment
    ;(async () => {
      try { if (resource?.id) await fetch(`/api/resources/${resource.id}/view`, { method: 'POST' }) } catch {}
    })()
  }, [resource?.id])

  const restrictions = checkDownloadRestrictions(resource, currentUser);
  const extractionCode = resource.downloadCode || '';
  const tagColors = ['#1f2937','#374151','#4b5563','#2563eb','#7c3aed','#0f766e','#b91c1c','#6b21a8','#1d4ed8','#15803d'];
  
  const copyExtractionCode = () => {
    navigator.clipboard?.writeText(extractionCode).then(() => {
      toast('提取码已复制', 'success');
    }).catch(() => {
      toast('复制失败，请手动选择提取码复制', 'error');
    });
  };

  const refreshResource = async () => {
    try {
      const res = await fetch(`/api/resources/${resource.id}`)
      if (!res.ok) return
      const json = await res.json().catch(() => null)
      const r = json?.data
      if (!r) return
      // Map new data if needed, similar to server mapping but client side
      // For simplicity, we just update critical fields
      setResource((prev: any) => ({
        ...prev,
        ...r, // careful with mapping differences
        price: Number(r.price || 0),
        // If needed, re-map complex fields
      }))
      setHasAccess(true) // Assume success means access granted
    } catch {}
  }

  const handleDownload = async () => {
    const restrictions = checkDownloadRestrictions(resource, currentUser);

    if (!restrictions.canDownload && !hasAccess) {
      if (!currentUser) {
        window.location.href = '/login';
        return;
      }

      if (restrictions.requiresVip) {
        setShowDownloadModal(true);
        return;
      }

      if (restrictions.requiresPayment) {
        try {
          const meRes = await fetch('/api/auth/me', { method: 'GET', credentials: 'same-origin' })
          if (!meRes.ok) { toast('请先登录后再支付', 'info'); return }
          const me = await meRes.json().catch(() => null)
          if (!me?.authenticated) { toast('请先登录后再支付', 'info'); return }
        } catch {
          toast('请先登录后再支付', 'info');
          return
        }
        setShowPaymentModal(true);
        return;
      }

      toast(restrictions.reason || '无法下载', 'error');
      return;
    }

    const result: DownloadResult = await processDownload(resource, currentUser);
    
    if (result.success) {
      toast(`${result.message} (交易ID: ${result.transactionId})`, 'success');
      try { await fetch(`/api/resources/${resource.id}/download`, { method: 'POST' }) } catch {}
      if (resource.downloadUrl) {
        window.location.href = resource.downloadUrl;
      }
    } else {
      toast(result.message || '下载失败', 'error');
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">首页</Link>
          <span>/</span>
          {resource.categorySlug ? (
            <Link href={`/category/${resource.categorySlug}`} className="hover:text-primary">{resource.category || '未分类'}</Link>
          ) : (
            <span className="text-muted-foreground">{resource.category || '未分类'}</span>
          )}
          {resource.subcategorySlug ? (
            <>
              <span>/</span>
              <Link href={`/category/${resource.categorySlug}/${resource.subcategorySlug}`} className="hover:text-primary">{resource.subcategory}</Link>
            </>
          ) : null}
          <span>/</span>
          <span className="text-foreground">{resource.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Resource Header */}
            <div className="card p-6 mb-6">
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

              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <span className="inline-block w-3 h-3 rounded-full border border-gray-400 mr-2"></span>
                <span>{resource.subcategory || resource.category || '未分类'}</span>
              </div>

              {/* Markdown Content */}
              <div className="prose prose-sm max-w-none text-foreground leading-relaxed mb-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-2xl md:text-3xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl md:text-2xl font-semibold mt-4 mb-2 text-foreground">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg md:text-xl font-semibold mt-3 mb-2 text-foreground">{children}</h3>
                    ),
                    code: ({ inline, className, children, ...props }: any) => {
                      const langClass = className || ''
                      if (inline) {
                        return <code className={`hljs ${langClass}`} {...props}>{children}</code>
                      }
                      return (
                        <pre className="hljs">
                          <code className={`hljs ${langClass}`} {...props}>{children}</code>
                        </pre>
                      )
                    },
                  }}
                >
                  {resource.description || ''}
                </ReactMarkdown>
              </div>

              {/* Download section */}
              <div className="space-y-4">
                {(serverAuthorized || hasAccess) ? (
                <div className="border-2 border-violet-300 border-dashed rounded-md p-4">
                  <div className="flex items-center flex-wrap gap-2 text-sm md:text-base text-foreground">
                    <span>链接</span>
                    <a
                      href={resource.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-violet-500 text-white px-3 py-1 text-xs md:text-sm hover:opacity-90"
                    >
                      点击下载
                    </a>
                    {extractionCode && (
                      <>
                        <span className="text-sm text-muted-foreground">（提取码: {extractionCode}）</span>
                        <button
                          onClick={copyExtractionCode}
                          className="text-violet-500 hover:underline text-xs md:text-sm"
                        >
                          复制
                        </button>
                      </>
                    )}
                    {(serverAuthorized || hasAccess) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">已购买，可直接下载</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    支付后点击下载按钮即可查看网盘链接，如果链接失效，可联系本站客服。
                  </p>
                </div>
                ) : (
                <div className="border-2 border-violet-300 border-dashed rounded-md p-4">
                  <div className="flex items-center flex-wrap gap-2 text-sm md:text-base text-foreground">
                    <span>资源下载价格</span>
                    <span className="font-semibold text-violet-500">{resource.price} 元</span>
                    <button
                      onClick={handleDownload}
                      className="rounded-full bg-violet-500 text-white px-3 py-1 text-xs md:text-sm hover:opacity-90"
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
                )}
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {resource.tags.map((tag: { id: number; name: string; slug?: string | null }, index: number) => (
                  tag.slug && !/^\d+$/.test(tag.slug) ? (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="px-3 py-1 text-xs md:text-sm rounded-none text-white hover:opacity-90 cursor-pointer transition-colors"
                      style={{ backgroundColor: tagColors[index % tagColors.length] }}
                    >
                      {tag.name}
                    </Link>
                  ) : (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-xs md:text-sm rounded-none text-white opacity-80"
                      style={{ backgroundColor: tagColors[index % tagColors.length] }}
                    >
                      {tag.name}
                    </span>
                  )
                ))}
              </div>
            </div>

            {/* Prev/Next */}
            <div className="py-4 px-2 md:px-4 card">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {prevNext.prev && (
                    <>
                      <div className="text-xs text-muted-foreground mb-1">上一篇</div>
                      <Link href={`/resource/${prevNext.prev.id}`} className="block text-black font-semibold hover:underline truncate">
                        {prevNext.prev.title}
                      </Link>
                    </>
                  )}
                </div>
                <div className="h-6 mx-4 border-l border-dashed border-border" />
                <div className="text-right flex-1 min-w-0">
                  {prevNext.next && (
                    <>
                      <div className="text-xs text-muted-foreground mb-1">下一篇</div>
                      <Link href={`/resource/${prevNext.next.id}`} className="block text-black font-semibold hover:underline truncate">
                        {prevNext.next.title}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Guess you like */}
            <div className="py-4 px-2 md:px-4 card mt-4">
              <div className="text-sm text-foreground font-bold mb-2">猜你喜欢</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {guessList.map((res, idx) => (
                  <ResourceCard key={res.id} resource={res} index={idx} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {(serverAuthorized || hasAccess) ? (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">资源下载</h2>
              <div className="text-sm text-muted-foreground mb-2">链接:</div>
              <a
                href={resource.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-violet-500 text-white text-center py-3 hover:opacity-90"
              >
                点击下载
              </a>
              <p className="text-xs text-muted-foreground mt-3">
                支付后点击下载按钮即可查看网盘链接，如果链接失效，可联系本站客服。
              </p>
            </div>
            ) : (
            <div className="card p-6">
              <div className="text-center mb-2">
                <span className="text-4xl font-bold text-violet-500">{resource.price}</span>
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
                className="w-full rounded-lg bg-violet-500 text-white py-3 hover:opacity-90"
              >
                立即交易
              </button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                支付后点击下载按钮即可查看网盘链接，如果链接失效，可联系本站客服。
              </p>
            </div>
            )}

            {/* Latest Articles */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">最新文章</h3>
              <div className="space-y-2">
                {latestArticles.map((r) => (
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
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">热门标签</h2>
              <div className="flex flex-wrap gap-2">
                {hotTags.map((tag, idx) => (
                  tag.slug && !/^\d+$/.test(tag.slug) ? (
                    <Link
                      key={tag.id}
                      href={`/tag/${tag.slug}`}
                      className="px-3 py-1 text-xs md:text-sm rounded-none text-white hover:opacity-90"
                      style={{ backgroundColor: tagColors[idx % tagColors.length] }}
                    >
                      {tag.name}
                    </Link>
                  ) : (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-xs md:text-sm rounded-none text-white opacity-80"
                      style={{ backgroundColor: tagColors[idx % tagColors.length] }}
                    >
                      {tag.name}
                    </span>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4">
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

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={Number(resource.price || 0)}
        description={`${resource.title} 资源购买`}
        orderType="course"
        productId={resource.id}
        onPaymentSuccess={(outTradeNo) => {
          toast(`支付成功！订单号: ${outTradeNo}`, 'success')
          setShowPaymentModal(false)
          refreshResource()
        }}
      />
    </div>
  );
}
