export function getDisposalColor(nature: string): string {
    const n = nature.toLowerCase()
    if (n.includes('allowed')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (n.includes('dismissed')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    if (n.includes('disposed')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    return 'bg-ledger-gray-100 text-ledger-gray-600 dark:bg-ledger-gray-200 dark:text-ledger-gray-500'
}

export function formatJudgmentDate(dateStr: string): string {
    if (!dateStr) return '—'
    const date = new Date(dateStr + 'T00:00:00')
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}
