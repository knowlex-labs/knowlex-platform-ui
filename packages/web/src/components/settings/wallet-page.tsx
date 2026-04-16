import { useState } from 'react'
import { Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useWallet } from '@/hooks/use-wallet'
import { cn } from '@/lib/utils'
import type { WalletTransactionType } from '@knowlex/core/types'

const PRESET_AMOUNTS = [100, 500, 1000]
const MIN_AMOUNT = 100

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const TYPE_BADGE: Record<WalletTransactionType, string> = {
  CREDIT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  DEBIT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function WalletPage() {
  const {
    balance,
    transactions,
    totalTransactions,
    page,
    isLoading,
    isToppingUp,
    error,
    topUp,
    goToPage,
  } = useWallet()

  const [customAmount, setCustomAmount] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  const effectiveAmount = selectedPreset ?? (customAmount ? Number(customAmount) : 0)

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount)
    setCustomAmount('')
  }

  const handleCustomChange = (value: string) => {
    setCustomAmount(value)
    setSelectedPreset(null)
  }

  const handleTopUp = async () => {
    if (effectiveAmount < MIN_AMOUNT) return
    const success = await topUp(effectiveAmount)
    if (success) {
      setCustomAmount('')
      setSelectedPreset(null)
    }
  }

  const totalPages = Math.ceil(totalTransactions / 10)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">Wallet</h2>
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Bento row: Balance + Top-up side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Balance card */}
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-5 w-5 text-kx-primary-600" />
            <span className="text-sm text-ledger-gray-500">Wallet Balance</span>
          </div>
          <p className="text-3xl font-bold text-kx-primary-900">
            {balance ? formatCurrency(balance.balance) : formatCurrency(0)}
          </p>
        </div>

        {/* Top-up section */}
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
          <h3 className="text-base font-semibold text-kx-primary-900 mb-4">Add Funds</h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
                  selectedPreset === amount
                    ? 'border-kx-primary-600 bg-kx-primary-50 text-kx-primary-700 dark:bg-kx-primary-900/20'
                    : 'border-kx-card-border text-ledger-gray-600 hover:border-kx-primary-400 hover:text-kx-primary-600'
                )}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Input
              type="number"
              min={MIN_AMOUNT}
              placeholder={`Custom amount (min ${formatCurrency(MIN_AMOUNT)})`}
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleTopUp}
              disabled={isToppingUp || effectiveAmount < MIN_AMOUNT}
            >
              {isToppingUp ? 'Processing...' : 'Add Funds'}
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction history — full width */}
      <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
        <h3 className="text-base font-semibold text-kx-primary-900 mb-4">Transaction History</h3>

        {transactions.length === 0 ? (
          <p className="text-sm text-ledger-gray-500 text-center py-6">No transactions yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-kx-card-border">
                    <th className="text-left py-2 font-medium text-ledger-gray-500">Date</th>
                    <th className="text-left py-2 font-medium text-ledger-gray-500">Type</th>
                    <th className="text-right py-2 font-medium text-ledger-gray-500">Amount</th>
                    <th className="text-left py-2 font-medium text-ledger-gray-500 hidden sm:table-cell">Description</th>
                    <th className="text-right py-2 font-medium text-ledger-gray-500 hidden sm:table-cell">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-kx-card-border last:border-0">
                      <td className="py-3 text-ledger-gray-600">{formatDate(tx.createdAt)}</td>
                      <td className="py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TYPE_BADGE[tx.type])}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={cn(
                        'py-3 text-right font-medium',
                        tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 text-ledger-gray-600 hidden sm:table-cell">{tx.description}</td>
                      <td className="py-3 text-right text-kx-primary-900 hidden sm:table-cell">{formatCurrency(tx.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-kx-card-border">
                <span className="text-xs text-ledger-gray-500">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0}
                    className="p-1.5 rounded-md hover:bg-ledger-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 rounded-md hover:bg-ledger-gray-100 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
