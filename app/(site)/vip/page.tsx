'use client';

import { useState } from 'react';
import { vipPlans, currentUser } from '@/lib/utils';
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid';
import PaymentModal from '@/components/PaymentModal';

export default function VIPPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const benefits = [
    '无限下载VIP专享资源',
    '每日免费下载次数增加',
    '专属客服支持',
    '优先获取最新资源',
    '无广告浏览体验',
    '专属VIP标识',
    '会员专属折扣',
    '提前访问新功能'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-2xl text-white">👑</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              开通VIP会员
            </h1>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              解锁无限下载权限，享受专属资源，获得更好的学习体验
            </p>
            
            {currentUser?.isVip && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
                <p className="text-lg font-semibold">您已经是VIP会员</p>
                <p className="text-purple-100">到期时间: 2024-12-31</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            VIP会员特权
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-card rounded-lg p-6 text-center border hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <StarIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            选择您的会员计划
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {vipPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-card rounded-lg border-2 p-8 transition-all duration-300 hover:shadow-xl ${
                  plan.isPopular
                    ? 'border-purple-500 shadow-lg scale-105'
                    : 'border-border hover:border-purple-300'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      最受欢迎
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-purple-600">¥{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.duration}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    每日下载: {plan.dailyDownloads}次
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.isPopular
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {currentUser?.isVip ? '续费会员' : '立即开通'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            常见问题
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="border-b border-border pb-4">
              <h3 className="font-semibold text-foreground mb-2">VIP会员有什么特权？</h3>
              <p className="text-muted-foreground">
                VIP会员可以享受无限下载VIP专享资源、每日免费下载次数增加、专属客服支持、
                优先获取最新资源、无广告浏览体验等多项特权。
              </p>
            </div>
            <div className="border-b border-border pb-4">
              <h3 className="font-semibold text-foreground mb-2">如何支付会员费用？</h3>
              <p className="text-muted-foreground">
                我们支持支付宝和微信支付，支付过程安全便捷。选择您喜欢的会员计划，
                点击立即开通即可完成支付。
              </p>
            </div>
            <div className="border-b border-border pb-4">
              <h3 className="font-semibold text-foreground mb-2">会员可以退款吗？</h3>
              <p className="text-muted-foreground">
                会员服务一经开通，不支持退款。请在开通前仔细选择适合自己的会员计划。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">会员到期后会怎样？</h3>
              <p className="text-muted-foreground">
                会员到期后，您将无法继续享受VIP特权。如需继续使用，请及时续费。
                我们会提前通知您会员即将到期。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={selectedPlan ? vipPlans.find(p => p.id === selectedPlan)?.price || 0 : 0}
        description={`${selectedPlan ? vipPlans.find(p => p.id === selectedPlan)?.name : ''}会员开通`}
        onPaymentSuccess={(transactionId) => {
          alert(`支付成功！交易ID: ${transactionId}`);
          // Here you would typically update the user status and redirect
        }}
      />
    </div>
  );
}