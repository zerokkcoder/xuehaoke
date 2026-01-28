import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隐私政策 - 学好课',
  description: '学好课平台隐私保护政策说明。',
}

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen w-full bg-background font-sans">
      {/* Texture Background */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      
      {/* Gradient Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 md:py-32">
        {/* Header */}
        <div className="mb-20 border-b border-border/40 pb-12">
          <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="h-px w-8 bg-primary"></span>
            法律声明
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground sm:text-7xl md:text-8xl">
            隐私 <br className="hidden md:block" />
            <span className="text-muted-foreground/30">政策.</span>
          </h1>
          <p className="mt-8 max-w-xl text-xl font-light leading-relaxed text-muted-foreground">
            您的信任是我们服务的基石。本隐私政策旨在透明地说明我们如何处理您的数据，保障您的数字权利。
          </p>
        </div>

        {/* Content */}
        <div className="grid gap-12">
          <div className="prose prose-lg prose-gray dark:prose-invert max-w-none">
            <div className="space-y-16">
              <section className="relative pl-8">
                <div className="absolute left-0 top-2 h-full w-px bg-border/50">
                  <div className="absolute top-0 h-12 w-full bg-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">1. 信息收集</h2>
                <p className="text-muted-foreground">
                  我们坚持“最小化收集”原则。当您访问或使用我们的服务时，仅收集提供服务所必需的基础信息：
                </p>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    <span><strong className="text-foreground">账户信息：</strong> 仅限用户名、电子邮箱（用于找回密码）。</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    <span><strong className="text-foreground">交易数据：</strong> 仅记录订单状态，不保存任何信用卡或银行卡敏感信息。</span>
                  </li>
                </ul>
              </section>

              <section className="relative pl-8">
                <div className="absolute left-0 top-2 h-full w-px bg-border/50">
                  <div className="absolute top-0 h-12 w-full bg-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">2. 数据使用与保护</h2>
                <p className="text-muted-foreground">
                  我们承诺不会将您的个人信息出售给任何第三方。收集的数据仅用于：
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
                    <h3 className="font-bold text-foreground">服务交付</h3>
                    <p className="mt-1 text-sm text-muted-foreground">确保您可以正常下载资源和访问会员内容。</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
                    <h3 className="font-bold text-foreground">安全防护</h3>
                    <p className="mt-1 text-sm text-muted-foreground">监测异常登录，防止恶意攻击和欺诈行为。</p>
                  </div>
                </div>
              </section>

              <section className="relative pl-8">
                <div className="absolute left-0 top-2 h-full w-px bg-border/50">
                  <div className="absolute top-0 h-12 w-full bg-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">3. Cookie 与追踪</h2>
                <p className="text-muted-foreground">
                  我们仅使用必要的 Cookie 以维持您的登录状态。您可以随时通过浏览器设置清除 Cookie，但这可能会导致您需要重新登录。
                </p>
              </section>

              <section className="relative pl-8">
                <div className="absolute left-0 top-2 h-full w-px bg-border/50">
                  <div className="absolute top-0 h-12 w-full bg-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">4. 变更通知</h2>
                <p className="text-muted-foreground">
                  随着法律法规和业务的发展，本政策可能会更新。重大变更我们将通过站内信或邮件通知您。
                </p>
              </section>
            </div>
          </div>
        </div>
        {/* Mobile Footer Info */}
        <div className="mt-16 border-t border-border/50 pt-8 lg:hidden">
          <p className="text-sm font-medium text-muted-foreground">最后更新：2026年1月28日</p>
        </div>
      </div>
    </div>
  )
}
