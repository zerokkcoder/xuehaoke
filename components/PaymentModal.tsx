'use client'

import { useRef, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useToast } from '@/components/Toast'
import Image from 'next/image'
import { motion, AnimatePresence } from "motion/react"
// import { processPayment, generateOrderId, paymentMethods, createPaymentStatus } from '@/lib/payment'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  description: string
  onPaymentSuccess: (transactionId: string) => void
  orderType: 'course' | 'member'
  productId: string | number
}

export default function PaymentModal({ isOpen, onClose, amount, description, onPaymentSuccess, orderType, productId }: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'alipay' | 'wechat'>('alipay')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'qr' | 'success'>('select')
  const [paymentData, setPaymentData] = useState<{ qrCode?: string; paymentUrl?: string; transactionId?: string; outTradeNo?: string }>({})
  const [isPolling, setIsPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { toast } = useToast()
  const pathname = usePathname()


  const handlePayment = async () => {
    setIsProcessing(true)
    setPaymentStep('processing')

    try {
      // 当面付预下单：生成二维码
      // 订单号：根据类型设置不同前缀，使用下划线分隔，确保仅字母/数字/下划线，且全局唯一（含时间戳+随机后缀）
      const prefix = orderType === 'member' ? 'MEM' : 'COUR'
      const uniqueSuffix = Math.random().toString(36).slice(2,6)
      // 订单号不含下划线和 productId，仅字母数字组合，保持唯一
      const outTradeNo = `${prefix}${Date.now()}${uniqueSuffix}`

      const res = await fetch('/api/pay/alipay/precreate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          subject: description,
          orderId: outTradeNo,
          orderType,
          productId,
        })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        toast(json?.message || '支付初始化失败', 'error')
        setPaymentStep('select')
      } else {
        setPaymentData({ qrCode: json.data.qrCode, outTradeNo: json.data.outTradeNo })
        setPaymentStep('qr')
        // 启动状态轮询
        startPolling(json.data.outTradeNo)
      }
    } catch (error) {
      toast('支付处理出错: ' + String(error ?? ''), 'error')
      setPaymentStep('select')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentSuccess = (doneOutTradeNo?: string) => {
    stopPolling()
    // 确保订单号存在（从轮询入参或已保存的状态）
    const ot = doneOutTradeNo || paymentData.outTradeNo || ''
    if (ot) {
      setPaymentData(prev => ({ ...prev, outTradeNo: ot }))
    }
    // 切换到成功状态卡片，短暂停留后自动关闭
    setPaymentStep('success')
    setTimeout(() => {
      toast('支付完成', 'success')
      onPaymentSuccess(ot || '')
      onClose()
      setPaymentStep('select')
      setPaymentData({})
    }, 1500)
  }

  const handleCancel = () => {
    stopPolling()
    if (paymentStep === 'select') {
      onClose()
    } else {
      setPaymentStep('select')
      setPaymentData({})
    }
  }

  const startPolling = (outTradeNo?: string) => {
    if (!outTradeNo || isPolling) return
    setIsPolling(true)
    // 每 4 秒轮询一次
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/pay/alipay/query', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ outTradeNo })
        })
        const json = await res.json().catch(() => null)
        const status = json?.data?.status || json?.status || ''
        if (status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED') {
          handlePaymentSuccess(outTradeNo)
        }
        if (status === 'TRADE_CLOSED') {
          toast('订单已关闭', 'error')
          stopPolling()
          setPaymentStep('select')
        }
      } catch {}
    }, 4000)
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsPolling(false)
  }

  // Stop polling when modal closes or component unmounts
  // Prevent intervals leaking and accumulating over time
  // Also guards against parent forcibly closing the modal mid-poll
  useEffect(() => {
    if (!isOpen) {
      stopPolling()
    }
    return () => {
      stopPolling()
    }
  }, [isOpen])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stopPolling()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    stopPolling()
  }, [pathname])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative bg-card border border-border rounded-lg max-w-md w-full p-6 text-foreground shadow-xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
          >
        {paymentStep === 'select' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 id="payment-modal-title" className="text-xl font-semibold text-foreground">选择支付方式</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="关闭支付弹窗">
                ✕
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="text-sm text-muted-foreground">支付金额</div>
                <div className="text-2xl font-semibold text-foreground">¥{amount.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">{description}</div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedPaymentMethod('alipay')}
                className={`w-full p-4 border border-border rounded-lg flex items-center gap-3 transition-colors ${
                  selectedPaymentMethod === 'alipay' ? 'border-primary bg-secondary' : 'hover:bg-muted'
                }`}
              >
                <div className="text-2xl">💳</div>
                <div className="flex-1 text-left">
                  <div className="font-medium">支付宝</div>
                  <div className="text-sm text-muted-foreground">扫码支付，安全快捷</div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedPaymentMethod === 'alipay' ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  {selectedPaymentMethod === 'alipay' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {isProcessing ? '处理中...' : '确认支付'}
              </button>
            </div>
          </>
        )}

        {paymentStep === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在处理支付...</p>
          </div>
        )}

        {paymentStep === 'qr' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 id="payment-modal-title" className="text-xl font-semibold text-foreground">扫码支付</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground" aria-label="关闭支付弹窗">
                ✕
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="bg-muted p-6 rounded-lg mb-4">
                {paymentData.qrCode ? (
                  <div className="text-center">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(paymentData.qrCode)}`}
                      alt="支付宝扫码二维码"
                      width={192}
                      height={192}
                      className="w-48 h-48 mx-auto mb-4 rounded border border-border bg-white"
                    />
                    <p className="text-sm text-muted-foreground">请使用支付宝扫描二维码完成支付</p>
                  </div>
                ) : (
                  <div className="text-center text-sm text-destructive">二维码生成失败，请重试</div>
                )}
                {paymentData.paymentUrl && (
                  <div className="text-center">
                    <div className="text-lg mb-4">正在跳转到支付宝...</div>
                    <a
                      href={paymentData.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block btn btn-primary px-6 py-3"
                    >
                      打开支付宝
                    </a>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                支付金额: <span className="font-semibold text-foreground">¥{amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 btn btn-secondary"
              >
                取消支付
              </button>
              <button
                onClick={() => handlePaymentSuccess()}
                className="flex-1 btn btn-primary"
              >
                支付完成
              </button>
            </div>
          </>
        )}

        {paymentStep === 'success' && (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-foreground font-medium mb-1">支付完成</p>
                {paymentData.outTradeNo && (
                  <p className="text-sm text-muted-foreground">订单号：{paymentData.outTradeNo}</p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
