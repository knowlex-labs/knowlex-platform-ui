import { Newspaper } from 'lucide-react'
import { DashboardCard } from './dashboard-card'

// Placeholder news data - will be replaced with real API later
const PLACEHOLDER_NEWS = [
  {
    id: '1',
    title: 'Supreme Court updates guidelines on bail applications',
    source: 'Legal News India',
    date: new Date(),
  },
  {
    id: '2',
    title: 'New amendments to the Civil Procedure Code',
    source: 'Bar Council',
    date: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    title: 'Digital Courts initiative expands to more districts',
    source: 'Government Press',
    date: new Date(Date.now() - 172800000),
  },
]

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function LatestNewsWidget() {
  return (
    <DashboardCard title="Legal News" icon={Newspaper}>
      <div className="space-y-3">
        {PLACEHOLDER_NEWS.map((news) => (
          <div key={news.id} className="group cursor-pointer">
            <p className="text-sm font-medium text-kx-primary-900 group-hover:underline line-clamp-2">
              {news.title}
            </p>
            <p className="text-xs text-ledger-gray-500 mt-0.5">
              {news.source} - {formatDate(news.date)}
            </p>
          </div>
        ))}
      </div>
      <p className="text-xs text-ledger-gray-400 mt-4 text-center">
        News feed coming soon
      </p>
    </DashboardCard>
  )
}
