import * as React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { CauseListItem } from '@/types'

interface CauseListTableProps {
  items: CauseListItem[]
  isLoading: boolean
}

interface JudgeGroup {
  judgeName: string
  benchType: string | null
  courtHallNo: string | null
  date: string
  subGroups: SubGroup[]
}

interface SubGroup {
  hearingType: string
  hearingCategory: string
  items: CauseListItem[]
}

function parseJudgeName(raw: string): { judgeName: string; benchType: string | null } {
  const parts = raw.split('\t')
  return {
    judgeName: parts[0]?.trim() || raw,
    benchType: parts[1]?.trim() || null,
  }
}

function groupByJudge(items: CauseListItem[]): JudgeGroup[] {
  const map = new Map<string, CauseListItem[]>()

  for (const item of items) {
    const key = item.judgeName
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }

  const groups: JudgeGroup[] = []

  for (const [rawJudge, groupItems] of map) {
    const { judgeName, benchType } = parseJudgeName(rawJudge)

    // Sub-group by hearingType + hearing_category
    const subMap = new Map<string, CauseListItem[]>()
    for (const item of groupItems) {
      const subKey = `${item.hearingType}|||${item.metadata.hearing_category}`
      if (!subMap.has(subKey)) subMap.set(subKey, [])
      subMap.get(subKey)!.push(item)
    }

    const subGroups: SubGroup[] = []
    for (const [subKey, subItems] of subMap) {
      const [hearingType, hearingCategory] = subKey.split('|||')
      subItems.sort((a, b) => a.serialNumber - b.serialNumber)
      subGroups.push({ hearingType, hearingCategory, items: subItems })
    }

    groups.push({
      judgeName,
      benchType,
      courtHallNo: groupItems[0]?.courtHallNo ?? groupItems[0]?.metadata.court_hall_no ?? null,
      date: groupItems[0]?.causeListDate ?? '',
      subGroups,
    })
  }

  return groups
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function ExpandableRow({ item }: { item: CauseListItem }) {
  const [expanded, setExpanded] = React.useState(false)

  const petAdvocates = item.metadata.advocates_petitioner
    ? item.metadata.advocates_petitioner.split('\n').filter(Boolean)
    : []
  const resAdvocates = item.metadata.advocates_respondent
    ? item.metadata.advocates_respondent.split('\n').filter(Boolean)
    : []

  return (
    <>
      <tr
        className="hover:bg-kx-primary-50/50 dark:hover:bg-kx-primary-950/20 cursor-pointer transition-colors border-b border-ledger-gray-100 dark:border-ledger-gray-200"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-2.5 text-sm text-kx-text-primary text-center w-[60px]">
          {item.serialNumber}
        </td>
        <td className="px-3 py-2.5 text-sm text-kx-text-secondary text-center w-[80px]">
          {item.metadata.cl_number}
        </td>
        <td className="px-3 py-2.5 text-sm font-medium text-kx-text-primary w-[180px]">
          {item.caseNumber}
        </td>
        <td className="px-3 py-2.5 text-sm text-kx-text-primary w-[250px]">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{item.metadata.petitioner}</span>
            <span className="text-xs text-ledger-gray-400 font-medium">Vs.</span>
            <span>{item.metadata.respondent}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-sm text-kx-text-secondary">
          <div className="flex flex-col gap-0.5">
            {petAdvocates.slice(0, 2).map((adv, i) => (
              <span key={i} className="text-xs">{adv}</span>
            ))}
            {petAdvocates.length > 2 && (
              <span className="text-xs text-ledger-gray-400">+{petAdvocates.length - 2} more</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-sm font-bold text-kx-text-primary text-center w-[80px]">
          {item.courtHallNo ?? item.metadata.court_hall_no ?? '—'}
        </td>
        <td className="px-3 py-2.5 w-[30px]">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-ledger-gray-400" />
            : <ChevronRight className="h-4 w-4 text-ledger-gray-400" />
          }
        </td>
      </tr>

      {expanded && (
        <tr className="bg-ledger-gray-50 dark:bg-ledger-gray-100/50">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Petitioner Advocates */}
              <div>
                <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1.5">
                  Advocates (Petitioner)
                </p>
                <div className="flex flex-col gap-0.5">
                  {petAdvocates.length > 0
                    ? petAdvocates.map((adv, i) => (
                        <span key={i} className="text-kx-text-secondary">{adv}</span>
                      ))
                    : <span className="text-ledger-gray-400">None listed</span>
                  }
                </div>
              </div>

              {/* Respondent Advocates */}
              <div>
                <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1.5">
                  Advocates (Respondent)
                </p>
                <div className="flex flex-col gap-0.5">
                  {resAdvocates.length > 0
                    ? resAdvocates.map((adv, i) => (
                        <span key={i} className="text-kx-text-secondary">{adv}</span>
                      ))
                    : <span className="text-ledger-gray-400">None listed</span>
                  }
                </div>
              </div>

              {/* Remarks */}
              {item.metadata.remarks && (
                <div className="md:col-span-2">
                  <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1.5">
                    Remarks
                  </p>
                  <p className="text-kx-text-secondary">{item.metadata.remarks}</p>
                </div>
              )}

              {/* Lawyer Name */}
              <div>
                <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1.5">
                  Lawyer
                </p>
                <p className="text-kx-text-secondary">{item.lawyerName}</p>
              </div>

              {/* Bench */}
              <div>
                <p className="text-xs font-semibold text-ledger-gray-500 uppercase tracking-wide mb-1.5">
                  Bench
                </p>
                <p className="text-kx-text-secondary">{item.bench}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-kx-card-border p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2 mt-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CauseListTable({ items, isLoading }: CauseListTableProps) {
  if (isLoading) return <TableSkeleton />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-200 flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-ledger-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-serif font-semibold text-kx-text-primary mb-1">No cause lists found</h3>
        <p className="text-sm text-ledger-gray-500 max-w-sm">
          Try changing the date or court filter to find cause list entries.
        </p>
      </div>
    )
  }

  const groups = groupByJudge(items)

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={gi} className="rounded-lg border border-kx-card-border overflow-hidden">
          {/* Judge header */}
          <div className="bg-kx-primary-50 dark:bg-kx-primary-950/30 px-4 py-3 border-b border-kx-card-border">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-serif font-semibold text-kx-primary-800 dark:text-kx-primary-200">
                  Before Hon'ble {group.judgeName}
                </h3>
                {group.benchType && (
                  <span className="text-sm font-medium text-kx-primary-600 dark:text-kx-primary-400">
                    {group.benchType}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-ledger-gray-500">
                {group.date && (
                  <span>Date: <span className="font-medium text-kx-text-primary">{formatDate(group.date)}</span></span>
                )}
              </div>
            </div>
          </div>

          {/* Sub-groups by hearing type + category */}
          {group.subGroups.map((sub, si) => (
            <div key={si}>
              {/* Hearing type divider */}
              <div className="bg-ledger-gray-50 dark:bg-ledger-gray-100/30 px-4 py-2 border-b border-ledger-gray-100 dark:border-ledger-gray-200">
                <p className="text-xs font-bold text-center text-kx-text-secondary uppercase tracking-wider">
                  &mdash; {sub.hearingType} &mdash;
                </p>
                {sub.hearingCategory && (
                  <p className="text-xs text-center text-ledger-gray-500 mt-0.5">
                    {sub.hearingCategory}
                  </p>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-ledger-gray-200">
                      <th className={cn(thClass, 'w-[60px] text-center')}>S.No</th>
                      <th className={cn(thClass, 'w-[80px] text-center')}>C.L.No</th>
                      <th className={cn(thClass, 'w-[180px]')}>Case No.</th>
                      <th className={cn(thClass, 'w-[250px]')}>Pet. vs Res.</th>
                      <th className={cn(thClass)}>Advocates</th>
                      <th className={cn(thClass, 'w-[80px] text-center')}>Court No.</th>
                      <th className={cn(thClass, 'w-[30px]')} />
                    </tr>
                  </thead>
                  <tbody>
                    {sub.items.map((item) => (
                      <ExpandableRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const thClass = 'px-3 py-2 text-xs font-bold text-ledger-gray-500 uppercase tracking-wide text-left'
