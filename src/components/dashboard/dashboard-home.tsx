import { useState, useRef, useEffect } from 'react'
import { CalendarDays, Bell, PenLine, FolderOpen, Scale, Sparkles, FileText, File, Search } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useNavigate } from 'react-router-dom'
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics'
import { StatsOverview } from './stats-overview'
import { UpcomingHearingsWidget } from './upcoming-hearings-widget'
import type { RecentDocument } from '@/services/api/dashboard-api'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function DocTypeBadge({ doc }: { doc: RecentDocument }) {
  const isGenerated = doc.type !== 'USER_UPLOADED'
  const fileType = doc.fileType?.toUpperCase()
  if (isGenerated) {
    return (
      <div className="flex-shrink-0 h-7 w-7 rounded-md bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center">
        <Sparkles className="h-3.5 w-3.5 text-kx-primary-600" />
      </div>
    )
  }
  const isPdf = fileType === 'PDF'
  const isDoc = fileType === 'DOCX' || fileType === 'DOC'
  return (
    <div className={`flex-shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-[9px] font-bold text-white ${isPdf ? 'bg-red-500' : isDoc ? 'bg-blue-500' : 'bg-ledger-gray-400'}`}>
      {isPdf ? 'PDF' : isDoc ? 'DOC' : <File className="h-3.5 w-3.5" />}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  ON_HOLD: 'bg-orange-100 text-orange-700',
  CLOSED: 'bg-ledger-gray-100 text-ledger-gray-500',
  APPEALED: 'bg-blue-100 text-blue-700',
  BLOCKED: 'bg-red-100 text-red-600',
}

export function DashboardHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    totalCases,
    activeCases,
    totalClients,
    recentCases,
    recentClients,
    recentDocuments,
    isLoading,
  } = useDashboardAnalytics()

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const displayName = user?.firstName || user?.username || 'there'
  const greeting = getGreeting()

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    if (notifOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [notifOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/cases?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-serif font-semibold text-kx-primary-900">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-ledger-gray-500 mt-1">Here's an overview of your practice</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ledger-gray-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search cases..."
              className="w-44 h-9 pl-8 pr-3 text-xs rounded-lg border border-kx-card-border bg-kx-card text-kx-primary-900 placeholder:text-ledger-gray-400 focus:outline-none focus:border-kx-primary-400 focus:w-56 transition-all"
            />
          </form>
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg border border-kx-card-border bg-kx-card shadow-sm hover:bg-ledger-gray-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-kx-primary-700" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-11 w-72 bg-kx-card border border-kx-card-border rounded-xl shadow-lg p-4 z-50">
                <p className="text-sm font-semibold text-kx-primary-900 mb-3">Notifications</p>
                <div className="text-center py-6">
                  <Bell className="h-8 w-8 text-ledger-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-ledger-gray-500">No new reminders</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats: 3 cards */}
      <section>
        <StatsOverview
          totalCases={totalCases}
          activeCases={activeCases}
          totalClients={totalClients}
          isLoading={isLoading}
        />
      </section>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 lg:gap-6 min-w-0">

        {/* LEFT column */}
        <div className="space-y-5 min-w-0">

          {/* Upcoming Hearings */}
          <section className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              <h2 className="text-base font-semibold text-kx-primary-900">Upcoming Hearings</h2>
            </div>
            <UpcomingHearingsWidget />
          </section>

          {/* Quick links */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/drafting')}
              className="flex-1 flex items-center gap-4 p-5 rounded-xl border border-kx-card-border bg-kx-card hover:border-kx-primary-300 hover:bg-kx-primary-50/40 dark:hover:bg-kx-primary-950/20 cursor-pointer transition-all shadow-sm text-left"
            >
              <div className="h-11 w-11 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                <PenLine className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-kx-primary-900">Create a Draft</p>
                <p className="text-xs text-ledger-gray-500 mt-0.5">Generate legal documents with AI</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/documents')}
              className="flex-1 flex items-center gap-4 p-5 rounded-xl border border-kx-card-border bg-kx-card hover:border-kx-primary-300 hover:bg-kx-primary-50/40 dark:hover:bg-kx-primary-950/20 cursor-pointer transition-all shadow-sm text-left"
            >
              <div className="h-11 w-11 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-kx-primary-900">All Documents</p>
                <p className="text-xs text-ledger-gray-500 mt-0.5">Browse your uploaded files</p>
              </div>
            </button>
          </div>

          {/* Recent Documents */}
          <section className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-kx-primary-600" />
                <h2 className="text-base font-semibold text-kx-primary-900">Recent Documents</h2>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="h-7 w-7 rounded-md bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-48 rounded bg-ledger-gray-200 dark:bg-ledger-gray-700 animate-pulse" />
                      <div className="h-2.5 w-24 rounded bg-ledger-gray-100 dark:bg-ledger-gray-800 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentDocuments.length === 0 ? (
              <p className="text-xs text-ledger-gray-400 italic py-2">No documents yet. Create a draft or upload a file.</p>
            ) : (
              <div className="space-y-0.5">
                {recentDocuments.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents?open=${doc.id}`)}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-nb-sidebar-hover cursor-pointer transition-colors"
                  >
                    <DocTypeBadge doc={doc} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-kx-text-primary truncate leading-snug">
                        {doc.originalFilename || doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate max-w-[140px] ${doc.caseTitle ? 'bg-kx-primary-50 dark:bg-kx-primary-950/30 text-kx-primary-600' : 'bg-ledger-gray-100 dark:bg-ledger-gray-700 text-ledger-gray-400'}`}>
                          {doc.caseTitle || 'Standalone'}
                        </span>
                        <span className="text-[10px] text-ledger-gray-400 flex-shrink-0">
                          {formatRelativeTime(doc.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT sidebar */}
        <aside className="space-y-5 self-start lg:sticky lg:top-6">

          {/* Recent Cases */}
          <div className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-kx-primary-600" />
                <h2 className="text-sm font-semibold text-kx-primary-900">Recent Cases</h2>
              </div>
              <button type="button" onClick={() => navigate('/cases')} className="text-xs text-kx-primary-600 hover:text-kx-primary-700 font-medium transition-colors">
                View all →
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-lg bg-ledger-gray-100 dark:bg-ledger-gray-700 animate-pulse" />
                ))}
              </div>
            ) : recentCases.length === 0 ? (
              <p className="text-xs text-ledger-gray-400 italic py-1">No cases yet.</p>
            ) : (
              <div className="space-y-1">
                {recentCases.map(c => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="flex items-start gap-2.5 px-2 py-2.5 rounded-lg hover:bg-nb-sidebar-hover cursor-pointer transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-md bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Scale className="h-3.5 w-3.5 text-kx-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-kx-text-primary truncate leading-snug">
                        {c.caseTitle || 'Untitled Case'}
                      </p>
                      {c.caseNumber && (
                        <p className="text-[10px] text-ledger-gray-400 truncate mt-0.5">{c.caseNumber}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {c.caseStatus && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${STATUS_COLORS[c.caseStatus] ?? 'bg-ledger-gray-100 text-ledger-gray-500'}`}>
                            {c.caseStatus.replace('_', ' ')}
                          </span>
                        )}
                        <span className="text-[10px] text-ledger-gray-400">{formatDate(c.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Clients */}
          <div className="bg-kx-card border border-kx-card-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-kx-primary-900">Recent Clients</h2>
              <button type="button" onClick={() => navigate('/clients')} className="text-xs text-kx-primary-600 hover:text-kx-primary-700 font-medium transition-colors">
                View all →
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-lg bg-ledger-gray-100 dark:bg-ledger-gray-700 animate-pulse" />
                ))}
              </div>
            ) : recentClients.length === 0 ? (
              <p className="text-xs text-ledger-gray-400 italic py-1">No clients yet.</p>
            ) : (
              <div className="space-y-1">
                {recentClients.map(cl => (
                  <div
                    key={cl.id}
                    onClick={() => navigate(`/clients/${cl.id}`)}
                    className="flex items-center gap-2.5 px-2 py-2.5 rounded-lg hover:bg-nb-sidebar-hover cursor-pointer transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-kx-primary-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                      {cl.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-kx-text-primary truncate">{cl.name}</p>
                      <p className="text-[10px] text-ledger-gray-400 truncate capitalize">{cl.clientType?.toLowerCase()}</p>
                      {cl.email && (
                        <p className="text-[10px] text-ledger-gray-400 truncate">{cl.email}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-ledger-gray-400 flex-shrink-0">{formatDate(cl.updatedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </aside>
      </div>
    </div>
  )
}
