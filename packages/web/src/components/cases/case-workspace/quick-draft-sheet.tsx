import { useState, useMemo } from 'react'
import {
  ArrowLeft, Sparkles, ChevronRight, X,
  FileWarning, Lightbulb, FileText, FileClock,
  Scale, Gavel, ShieldAlert,
  Landmark, ScrollText, ClipboardList, ShieldCheck, Hammer,
  Users, RefreshCcw, Star, Ban, AlignLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CaseDocument, BackendCase, User } from '@knowlex/core/types'
import { DRAFT_TEMPLATES } from '@knowlex/core/types'
import type { CreateDraftRequest } from '@knowlex/core/api/document-types'
import { buildCreateDraftPayload } from '@knowlex/core/api/draft-helpers'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileWarning, Lightbulb, FileText, FileClock, Scale, Gavel, ShieldAlert,
  ScrollText, ClipboardList, AlignLeft, Landmark, Star, Ban,
  ShieldCheck, RefreshCcw, Hammer, Users,
}

const CATEGORY_COLORS: Record<string, { iconBg: string; iconColor: string }> = {
  General: { iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
  Civil:   { iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-600' },
  Criminal: { iconBg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-600' },
  Writ:    { iconBg: 'bg-violet-50 dark:bg-violet-950/40', iconColor: 'text-violet-600' },
  Consumer: { iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-600' },
}

const CLIENT_FIELD_IDS = new Set([
  'sender', 'applicant', 'plaintiff', 'appellant', 'petitioner',
  'party', 'deponent', 'complainant', 'decree_holder',
])
const RESPONDENT_FIELD_IDS = new Set([
  'respondent', 'opposite_party', 'defendant', 'recipient', 'judgment_debtor',
])

const TEMPLATE_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'General', ids: ['notice', 'affidavit', 'application-draft', 'patent', 'written-arguments'] },
  { label: 'Civil', ids: ['plaint', 'written-statement', 'interim-application', 'execution-petition'] },
  { label: 'Criminal', ids: ['bail-application', 'criminal-appeal', 'anticipatory-bail', 'quashing-petition', 'revision-petition'] },
  { label: 'Writ', ids: ['writ-petition', 'slp'] },
  { label: 'Consumer', ids: ['consumer-complaint'] },
]

function buildUserText(user: User | null): string {
  if (!user) return ''
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return [name, user.bench, user.phone].filter(Boolean).join(', ')
}

function buildRespondentText(caseData: BackendCase | null): string {
  if (!caseData?.respondentName) return ''
  const d = caseData.respondentDetails as Record<string, string> | null
  if (!d) return caseData.respondentName
  const parts = [d.addressLine1, d.addressLine2, d.city, d.state, d.pincode, d.phone].filter(Boolean)
  return parts.length > 0 ? `${caseData.respondentName}, ${parts.join(', ')}` : caseData.respondentName
}

function buildCourtText(caseData: BackendCase | null): string {
  if (!caseData) return ''
  return [caseData.courtName, caseData.courtLocation].filter(Boolean).join(', ')
}

interface QuickDraftSheetProps {
  caseData: BackendCase | null
  user: User | null
  sources: CaseDocument[]
  onGenerate: (req: CreateDraftRequest) => void
  onOpenAdvanced: (templateId: string, initialValues: Record<string, string>) => void
  onClose: () => void
}

export function QuickDraftSheet({ caseData, user, sources, onGenerate, onOpenAdvanced, onClose }: QuickDraftSheetProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  const selectedTemplate = useMemo(
    () => DRAFT_TEMPLATES.find(t => t.id === selectedTemplateId) ?? null,
    [selectedTemplateId]
  )

  const handleSelectTemplate = (templateId: string) => {
    const t = DRAFT_TEMPLATES.find(t => t.id === templateId)
    if (!t) return

    const userText = buildUserText(user)
    const respondentText = buildRespondentText(caseData)
    const courtText = buildCourtText(caseData)
    const caseTitle = caseData?.caseTitle ?? caseData?.title ?? ''
    const caseNumber = caseData?.caseNumber ?? ''

    const initial: Record<string, string> = {}
    for (const field of t.fields) {
      if (field.id === 'title') {
        initial.title = caseTitle ? `${t.name} — ${caseTitle}` : t.name
      } else if (field.id === 'language') {
        initial.language = 'english'
      } else if (CLIENT_FIELD_IDS.has(field.id)) {
        initial[field.id] = userText
      } else if (RESPONDENT_FIELD_IDS.has(field.id)) {
        initial[field.id] = respondentText
      } else if (field.id === 'court_details' || field.id === 'forum_details') {
        initial[field.id] = courtText
      } else if (field.id === 'case_details') {
        initial[field.id] = [caseNumber, caseTitle].filter(Boolean).join(' — ')
      }
    }

    setFormValues(initial)
    setSelectedTemplateId(templateId)
  }

  const handleGenerate = () => {
    if (!selectedTemplate) return
    const payload = buildCreateDraftPayload(
      selectedTemplate.id,
      formValues,
      sources.map(s => s.id),
      selectedTemplate.name,
    )
    onGenerate(payload)
  }

  const handleAdvanced = () => {
    if (!selectedTemplate) return
    onOpenAdvanced(selectedTemplate.id, formValues)
  }

  const simplifiedFields = useMemo(() => {
    if (!selectedTemplate) return []
    const fields = []
    const titleField = selectedTemplate.fields.find(f => f.id === 'title')
    if (titleField) fields.push(titleField)
    const clientField = selectedTemplate.fields.find(f => CLIENT_FIELD_IDS.has(f.id))
    if (clientField) fields.push(clientField)
    const respondentField = selectedTemplate.fields.find(f => RESPONDENT_FIELD_IDS.has(f.id))
    if (respondentField) fields.push(respondentField)
    const courtField = selectedTemplate.fields.find(f => f.id === 'court_details' || f.id === 'forum_details')
    if (courtField) fields.push(courtField)
    const langField = selectedTemplate.fields.find(f => f.id === 'language')
    if (langField) fields.push(langField)
    return fields
  }, [selectedTemplate])

  const isGenerateEnabled = (formValues.title ?? '').trim().length > 0

  // ── Step 2: Simplified form ──────────────────────────────────────────────────
  if (selectedTemplate) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-ledger-gray-900">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ledger-gray-100 dark:border-ledger-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedTemplateId(null)}
              className="h-7 w-7 flex items-center justify-center rounded-md text-ledger-gray-400 hover:text-ledger-gray-600 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-kx-primary-900 dark:text-kx-primary-100">
              {selectedTemplate.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md text-ledger-gray-400 hover:text-ledger-gray-600 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <p className="text-xs text-ledger-gray-400 mb-5">
            Fields are pre-filled from case details. Edit if needed, then hit Generate.
            {sources.length > 0 && (
              <span className="ml-1 text-kx-primary-500">{sources.length} case file{sources.length !== 1 ? 's' : ''} will be included.</span>
            )}
          </p>

          <div className="space-y-4 max-w-lg">
            {simplifiedFields.map(field => {
              const value = formValues[field.id] ?? ''

              if (field.type === 'select' && field.options) {
                return (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-xs font-medium text-ledger-gray-600 dark:text-ledger-gray-400">
                      {field.label}
                    </label>
                    <select
                      value={value}
                      onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      className="flex h-9 w-full rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 px-3 text-sm text-kx-primary-900 dark:text-ledger-gray-200 focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
                    >
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )
              }

              if (field.type === 'client-select') {
                return (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-xs font-medium text-ledger-gray-600 dark:text-ledger-gray-400">
                      {field.label}
                    </label>
                    <textarea
                      value={value}
                      onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={2}
                      className="w-full rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 px-3 py-2 text-sm text-kx-primary-900 dark:text-ledger-gray-100 placeholder:text-ledger-gray-400 focus:outline-none focus:ring-2 focus:ring-kx-primary-500 resize-none"
                    />
                  </div>
                )
              }

              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-xs font-medium text-ledger-gray-600 dark:text-ledger-gray-400">
                    {field.label}
                    {field.id === 'title' && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    value={value}
                    onChange={e => setFormValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex h-9 w-full rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 px-3 text-sm text-kx-primary-900 dark:text-ledger-gray-100 placeholder:text-ledger-gray-400 focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-ledger-gray-100 dark:border-ledger-gray-700 bg-white dark:bg-ledger-gray-900">
          <button
            type="button"
            onClick={handleAdvanced}
            className="flex items-center gap-1 text-sm text-kx-primary-600 hover:text-kx-primary-700 hover:underline"
          >
            Advanced options
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <Button
            onClick={handleGenerate}
            disabled={!isGenerateEnabled}
            className="gap-2 bg-kx-primary-600 hover:bg-kx-primary-700 text-white"
          >
            <Sparkles className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 1: Template picker ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white dark:bg-ledger-gray-900">
      <div className="flex items-center justify-between px-5 py-3 border-b border-ledger-gray-100 dark:border-ledger-gray-800 flex-shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-kx-primary-900 dark:text-kx-primary-100">Quick Draft</h2>
          <p className="text-xs text-ledger-gray-400">Case details will be pre-filled automatically</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-ledger-gray-400 hover:text-ledger-gray-600 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
        {TEMPLATE_GROUPS.map(group => {
          const groupTemplates = DRAFT_TEMPLATES.filter(t => group.ids.includes(t.id))
          if (groupTemplates.length === 0) return null
          const colors = CATEGORY_COLORS[group.label] ?? CATEGORY_COLORS['General']
          return (
            <div key={group.label} className="mb-4">
              <h3 className="text-[10px] font-bold tracking-wider text-ledger-gray-400 dark:text-ledger-gray-500 uppercase mb-2">
                {group.label}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {groupTemplates.map(t => {
                  const Icon = iconMap[t.icon] || FileText
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t.id)}
                      className={cn(
                        'flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all duration-150 group',
                        'border-ledger-gray-200 dark:border-ledger-gray-700 bg-white dark:bg-ledger-gray-800',
                        'hover:border-kx-primary-300 dark:hover:border-kx-primary-600 hover:bg-nb-sidebar hover:shadow-sm',
                      )}
                    >
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', colors.iconBg)}>
                        <Icon className={cn('h-4 w-4', colors.iconColor)} />
                      </div>
                      <p className="text-xs font-semibold text-kx-primary-900 dark:text-ledger-gray-100 leading-snug">
                        {t.name}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
