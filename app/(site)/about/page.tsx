import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于我们 - 学好课',
  description: '了解学好课平台，我们致力于提供高质量的学习资料、开发工具和设计素材。',
}

export default function AboutPage() {
  return (
    <div className="relative min-h-screen w-full bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <main className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        {/* Hero Section */}
        <div className="mb-16 flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              成立于 2026
            </div>
            <h1 className="text-6xl font-black tracking-tighter sm:text-8xl md:text-9xl">
              <span className="block text-foreground">构建</span>
              <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">知识体系。</span>
            </h1>
          </div>
          <p className="max-w-md text-lg text-muted-foreground md:text-xl md:leading-relaxed text-right">
            学好课致力于打破信息壁垒，构建一个高效、纯粹的终身学习资源库。
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid gap-6 md:grid-cols-12 md:grid-rows-2">
          {/* Mission Card - Large */}
          <div className="group relative col-span-12 overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/30 p-10 backdrop-blur-xl transition-all duration-500 hover:border-primary/20 md:col-span-8">
            <div className="absolute right-0 top-0 -z-10 h-64 w-64 translate-x-1/3 translate-y-[-1/3] rounded-full bg-primary/10 blur-[80px] transition-all duration-500 group-hover:bg-primary/20" />
            <div className="flex h-full flex-col justify-between gap-12">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">我们的使命</h3>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                  在信息爆炸的时代，
                  <span className="text-primary">做减法</span> 才是核心竞争力。
                </h2>
              </div>
              <p className="max-w-2xl text-lg text-muted-foreground">
                我们的使命是为您精选最有价值的学习资料、开发源码和设计素材。每一次收录都经过人工严格审核，确保您下载的不仅仅是文件，更是成长的阶梯。
              </p>
            </div>
          </div>

          {/* Stat Card 1 */}
          <div className="group relative col-span-6 flex flex-col justify-center overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/30 p-10 backdrop-blur-xl transition-all duration-500 hover:border-primary/20 md:col-span-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">10K+</span>
            <span className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">优质资源</span>
          </div>

          {/* Stat Card 2 */}
          <div className="group relative col-span-6 flex flex-col justify-center overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/30 p-10 backdrop-blur-xl transition-all duration-500 hover:border-primary/20 md:col-span-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <span className="text-5xl font-black tracking-tighter text-foreground md:text-7xl">99%</span>
            <span className="mt-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">用户满意度</span>
          </div>

          {/* Values Card */}
          <div className="group relative col-span-12 overflow-hidden rounded-[2.5rem] border border-border/50 bg-card/30 p-10 backdrop-blur-xl transition-all duration-500 hover:border-primary/20 md:col-span-8">
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { title: '极简体验', desc: '拒绝繁琐流程，直达核心内容' },
                { title: '严选品质', desc: '人工多重审核，确保资源可用' },
                { title: '持续更新', desc: '紧跟技术潮流，保持内容鲜活' },
              ].map((item, i) => (
                <div key={i} className="relative space-y-4">
                  <div className="h-1 w-12 rounded-full bg-primary/50" />
                  <h4 className="text-xl font-bold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
