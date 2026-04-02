import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Judgments } from './judgments'
import { NewsTab } from './news-tab'

type LibraryTab = 'judgments' | 'news'

const TABS: { id: LibraryTab; label: string }[] = [
    { id: 'judgments', label: 'Judgments' },
    { id: 'news', label: 'News' },
]

export function LegalLibrary() {
    const [activeTab, setActiveTab] = useState<LibraryTab>('judgments')

    return (
        <div>
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-2 pt-3 border-b border-ledger-gray-200">
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={cn(
                            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === id
                                ? 'border-kx-primary-600 text-kx-primary-700'
                                : 'border-transparent text-ledger-gray-500 hover:text-kx-primary-600 hover:border-ledger-gray-300'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'judgments' ? <Judgments /> : <NewsTab />}
        </div>
    )
}
