'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { CheckIcon } from '@heroicons/react/24/solid';
import PaymentModal from '@/components/PaymentModal';

export default function VIPPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [plans, setPlans] = useState<Array<{ id: number; name: string; price: number; durationDays: number; dailyDownloads: number; isPopular: boolean; features: string[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const [userVip, setUserVip] = useState<{ isVip: boolean; vipExpireAt?: string | null; vipPlanName?: string | null; vipPlanId?: number | null } | null>(null)

  const handleSubscribe = async (planId: number) => {
    setSelectedPlanId(planId);
    // 打开支付前校验会话
    try {
      const meRes = await fetch('/api/auth/me', { method: 'GET', credentials: 'same-origin' })
      if (!meRes.ok) { toast('请先登录后再支付', 'info'); return }
      const me = await meRes.json().catch(() => null)
      if (!me?.authenticated) { toast('请先登录后再支付', 'info'); return }
    } catch {
      toast('请先登录后再支付', 'info');
      return
    }
    // 若当前用户已是该会员且未过期/永久，则不需要再次开通
    try {
      const now = new Date()
      const selected = plans.find(p => p.id === planId)
      const isSamePlan = userVip?.vipPlanId ? (userVip.vipPlanId === planId) : (userVip?.vipPlanName && selected ? userVip.vipPlanName === selected.name : false)
      const notExpired = userVip?.vipExpireAt ? (new Date(userVip.vipExpireAt) > now) : true
      if (userVip?.isVip && isSamePlan && notExpired) {
        toast('您已是该会员计划（未过期/永久），无需再次开通', 'info')
        return
      }
    } catch {}
    setShowPaymentModal(true);
  };

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/plans');
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          toast(json?.message || '会员计划加载失败', 'error');
        } else {
          setPlans(Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        toast('网络错误，请稍后再试', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, [toast]);

  // 查询用户VIP到期时间（永久显示“永久”）
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('site_user')
      if (!raw) return
      const u = JSON.parse(raw)
      const username = u?.username
      if (!username) return
      fetch('/api/user/me', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username })
      }).then(async (res) => {
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          setUserVip({ isVip: !!json.data?.isVip, vipExpireAt: json.data?.vipExpireAt, vipPlanName: json.data?.vipPlanName, vipPlanId: json.data?.vipPlanId ?? null })
        }
      }).catch(() => {})
    } catch {}
  }, [])

  

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">会员计划</h1>
          <p className="text-muted-foreground mt-3">选择适合你的会员方案，立即享受更多下载权益</p>
          {userVip?.isVip && (
            <div className="mt-4 inline-flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <span className="text-sm font-medium">
                当前状态：{userVip?.vipPlanName || 'VIP会员'}
                {userVip?.vipExpireAt ? `（到期：${new Date(userVip.vipExpireAt).toLocaleDateString()}）` : '（永久）'}
              </span>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="mb-16">
          <div className="flex flex-wrap justify-center gap-8">
            {loading ? (
              <div className="text-center text-muted-foreground col-span-3">加载中…</div>
            ) : plans.length === 0 ? (
              <div className="text-center text-muted-foreground col-span-3">暂无会员计划</div>
            ) : plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative card p-8 transition-all duration-300 hover:shadow-lg ${
                  plan.isPopular ? 'border-purple-500 ring-1 ring-purple-300' : 'border-border'
                } w-full sm:w-[360px] overflow-visible!`}
                style={{ overflow: 'visible' }}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-linear-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm whitespace-nowrap">
                      最受欢迎
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-purple-600">¥{Number(plan.price || 0).toFixed(2)}</span>
                    <span className="text-muted-foreground">/{plan.durationDays === 0 ? '永久' : `${plan.durationDays}天`}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    每日下载: {plan.dailyDownloads}次
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckIcon className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.isPopular
                      ? 'bg-linear-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {userVip?.isVip ? '续费会员' : '立即开通'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ removed for简洁页面 */}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={selectedPlanId ? plans.find(p => p.id === selectedPlanId)?.price || 0 : 0}
        description={`${selectedPlanId ? plans.find(p => p.id === selectedPlanId)?.name : ''}会员开通`}
        orderType="member"
        productId={selectedPlanId ?? 0}
        onPaymentSuccess={(transactionId) => {
          toast(`支付成功！交易ID: ${transactionId}`, 'success');
          // Here you would typically update the user status and redirect
        }}
      />
    </div>
  );
}