import { useState, useEffect, useCallback } from 'react'
import { walletApi } from '@knowlex/core/api/subscription-api'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { useAuth } from '@/contexts/auth-context'
import type { WalletBalance, WalletTransaction, PaginatedData } from '@knowlex/core/types'

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isToppingUp, setIsToppingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchBalance = useCallback(async () => {
    try {
      const res = await walletApi.getBalance()
      setBalance(res.data)
    } catch (err) {
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message)
      }
    }
  }, [])

  const fetchTransactions = useCallback(async (pageNum: number) => {
    try {
      const res = await walletApi.getTransactions({ page: pageNum, size: 10 })
      const paginated = res.data as PaginatedData<WalletTransaction>
      setTransactions(paginated.content)
      setTotalTransactions(paginated.totalElements)
      setPage(pageNum)
    } catch {
      // Transactions may not exist yet
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    await Promise.all([fetchBalance(), fetchTransactions(0)])
    setIsLoading(false)
  }, [fetchBalance, fetchTransactions])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const topUp = useCallback(async (amount: number): Promise<boolean> => {
    try {
      setIsToppingUp(true)
      setError(null)

      const res = await walletApi.topUp({ amount })
      const { orderId, razorpayKeyId, amount: orderAmount, currency } = res.data

      return new Promise<boolean>((resolve) => {
        openRazorpayCheckout({
          key: razorpayKeyId,
          amount: orderAmount,
          currency,
          order_id: orderId,
          name: 'Knowlex AI',
          description: 'Wallet Top-Up',
          prefill: {
            name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
            email: user?.email,
          },
          theme: { color: '#4F46E5' },
          handler: async (response) => {
            try {
              await walletApi.verifyTopUp({
                orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              await fetchAll()
              setIsToppingUp(false)
              resolve(true)
            } catch {
              setError('Payment verification failed')
              setIsToppingUp(false)
              resolve(false)
            }
          },
          modal: {
            // UPI QR / async-method payments don't always trigger the SDK
            // handler — the webhook is what actually credits the wallet on
            // the backend. Refresh on dismiss so the user sees the new
            // balance without a manual reload.
            ondismiss: async () => {
              await fetchAll()
              setIsToppingUp(false)
              resolve(false)
            },
          },
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate top-up')
      setIsToppingUp(false)
      return false
    }
  }, [user, fetchAll])

  const goToPage = useCallback((pageNum: number) => {
    fetchTransactions(pageNum)
  }, [fetchTransactions])

  return {
    balance,
    transactions,
    totalTransactions,
    page,
    isLoading,
    isToppingUp,
    error,
    refresh: fetchAll,
    topUp,
    goToPage,
  }
}
