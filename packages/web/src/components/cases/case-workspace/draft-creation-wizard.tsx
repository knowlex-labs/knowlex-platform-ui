import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Sparkles, Check, FileWarning, Lightbulb, FileText, FileClock,
  Scale, Gavel, ShieldAlert, ChevronDown,
  Search, Landmark, ScrollText, ClipboardList, ShieldCheck, Hammer,
  Users, RefreshCcw, Star, Ban, AlignLeft, X,
  LayoutGrid, PenLine, Eye, Trash2, RotateCw, FolderInput,
  AlertCircle, Bold, Italic, Underline,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { DraftTemplate, TemplateFormData, CaseDocument, Client, Draft } from '@knowlex/core/types'
import { DRAFT_TEMPLATES } from '@knowlex/core/types'
import type { CreateDraftRequest } from '@knowlex/core/api/document-types'
import {
  TEMPLATE_TO_DOC_CONFIG as CORE_TEMPLATE_TO_DOC_CONFIG,
  TEMPLATE_TO_SUB_TYPE as CORE_TEMPLATE_TO_SUB_TYPE,
  buildCreateDraftPayload,
} from '@knowlex/core/api/draft-helpers'
import { clientApi, draftsApi } from '@knowlex/core/api'
import { mapBackendClient } from '@knowlex/core/mappers'
import { renderDraftToHtml } from '@/lib/draft-renderer'

// Re-exported for existing imports in use-drafts.ts / drafting-page.tsx.
// The definitions now live in @knowlex/core/api/draft-helpers.
export const TEMPLATE_TO_DOC_CONFIG = CORE_TEMPLATE_TO_DOC_CONFIG
export const TEMPLATE_TO_SUB_TYPE = CORE_TEMPLATE_TO_SUB_TYPE

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileWarning, Lightbulb, FileText, FileClock, Scale, Gavel, ShieldAlert,
  ScrollText, ClipboardList, AlignLeft, Landmark, Star, Ban,
  ShieldCheck, RefreshCcw, Hammer, Users,
}

type WizardStep = 'templates' | 'details' | 'preview'

export interface DraftCreationWizardProps {
  sources: CaseDocument[]
  judgments?: CaseDocument[]
  client: Client | null
  respondentDetails?: string
  // Optional. When supplied, the wizard pre-fills court_details and
  // case_number form fields from the selected case (Bug 5 — auto-fill).
  // Structural shape so it accepts both BackendCase and Case.
  caseInfo?: {
    caseNumber?: string | null
    courtName?: string | null
    courtLocation?: string | null
  } | null
  onSaveRespondent?: (details: string) => void
  onGenerate: (request: CreateDraftRequest) => void
  onSave: () => void
  onDiscard: (draftId: string) => void
  onCancel: () => void
  previewDraft?: Draft | null
  defaultTemplateId?: string
  initialFormValues?: Record<string, string>
}

function formatClientDetails(c: Client): string {
  const parts = [c.name]
  if (c.address) parts.push(c.address)
  if (c.phone) parts.push(c.phone)
  return parts.join(', ')
}

// ─── A4 skeleton used in preview pending state ────────────────────────────────
function PreviewSkeleton() {
  return (
    <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        <div className="h-14 w-14 rounded-full bg-kx-primary-50 dark:bg-kx-primary-900/30 flex items-center justify-center">
          <FileClock className="h-7 w-7 text-kx-primary-600 dark:text-kx-primary-400 animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold text-ledger-gray-800 dark:text-ledger-gray-100">
            Generating your draft
          </p>
          <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400">
            This usually takes 1–2 minutes. You can navigate away and come back — your draft will be ready when you return.
          </p>
        </div>
      </div>
    </div>
  )
}

// Field ids that represent the opposing party / respondent side
const RESPONDENT_FIELD_IDS = new Set(['respondent', 'opposite_party', 'defendant', 'judgment_debtor'])

// Field ids that represent the client / sender side (first party)
const CLIENT_FIELD_IDS = new Set([
  'sender', 'applicant', 'plaintiff', 'appellant', 'petitioner',
  'party', 'deponent', 'complainant', 'decree_holder',
])

export function DraftCreationWizard({
  sources, judgments = [], client, respondentDetails, caseInfo, onSaveRespondent,
  onGenerate, onSave, onDiscard, onCancel, previewDraft = null,
  defaultTemplateId, initialFormValues,
}: DraftCreationWizardProps) {
  const [step, setStep] = useState<WizardStep>(defaultTemplateId ? 'details' : 'templates')
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(
    defaultTemplateId ? (DRAFT_TEMPLATES.find(t => t.id === defaultTemplateId) ?? null) : null
  )
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [localSourceIds, setLocalSourceIds] = useState<Set<string>>(new Set())
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)
  const [allClients, setAllClients] = useState<{ id: string; name: string; details: string }[]>([])
  const [selectedClientIdFor, setSelectedClientIdFor] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isEditingPreview, setIsEditingPreview] = useState(false)
  const previewEditorRef = useRef<HTMLDivElement>(null)

  // Pre-fill form when template changes: client → first-party field, respondent → opposing-party field,
  // and selected-case metadata → court_details / case_number where applicable (Bug 5).
  useEffect(() => {
    if (!selectedTemplate) return
    const clientText = client
      ? [client.name, client.address, client.phone].filter(Boolean).join(', ')
      : ''
    const courtDetailsFromCase = caseInfo
      ? [caseInfo.courtName, caseInfo.courtLocation].filter(Boolean).join(', ')
      : ''
    const initial: TemplateFormData = {}
    selectedTemplate.fields.forEach((field) => {
      if (field.type === 'sources') {
        initial[field.id] = []
      } else if (field.type === 'select' && field.options?.length) {
        initial[field.id] = field.options[0].value
      } else if (field.type === 'client-select') {
        if (CLIENT_FIELD_IDS.has(field.id) && clientText) {
          initial[field.id] = clientText
        } else if (RESPONDENT_FIELD_IDS.has(field.id) && respondentDetails) {
          initial[field.id] = respondentDetails
        } else {
          initial[field.id] = ''
        }
      } else if (field.id === 'court_details' && courtDetailsFromCase) {
        initial[field.id] = courtDetailsFromCase
      } else if (field.id === 'case_number' && caseInfo?.caseNumber) {
        initial[field.id] = caseInfo.caseNumber
      } else {
        initial[field.id] = ''
      }
    })
    if (initialFormValues) {
      Object.entries(initialFormValues).forEach(([k, v]) => { if (v) initial[k] = v })
    }
    setFormData(initial)
    setLocalSourceIds(new Set())
    setSelectedClientIdFor({})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate])

  // Close source dropdown on outside click
  useEffect(() => {
    if (!sourceDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sourceDropdownOpen])

  // Fetch clients when details step opens
  useEffect(() => {
    if (step !== 'details') return
    clientApi.getAll({ page: 0, size: 100 }).then((res) => {
      if (res.status === 'success') {
        setAllClients(res.data.content.map((c) => {
          const mapped = mapBackendClient(c)
          return { id: mapped.id, name: mapped.name, details: formatClientDetails(mapped) }
        }))
      }
    }).catch(() => {})
  }, [step])

  // Auto-advance to preview when parent provides a draft
  useEffect(() => {
    if (previewDraft && step === 'details') {
      setStep('preview')
      setIsEditingPreview(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDraft?.id])

  // ESC handling
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (step === 'details') setStep('templates')
      else if (step === 'templates') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [step, onCancel])

  // Auto-focus search on templates step
  useEffect(() => {
    if (step === 'templates') setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [step])

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return DRAFT_TEMPLATES
    return DRAFT_TEMPLATES.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  }, [searchQuery])

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSourceToggle = (sourceId: string) => {
    let isAdding = false
    setLocalSourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(sourceId)) {
        next.delete(sourceId)
      } else {
        next.add(sourceId)
        isAdding = true
      }
      return next
    })
    // On add, ask the backend to extract suggested form values from the
    // source PDF and merge them into formData — only filling fields the
    // user hasn't already typed into. Best-effort; failures are silent.
    if (isAdding) {
      draftsApi
        .extractFields(sourceId)
        .then((suggested) => {
          if (!suggested || Object.keys(suggested).length === 0) return
          setFormData((prev) => {
            const next = { ...prev }
            for (const [k, v] of Object.entries(suggested)) {
              const existing = typeof next[k] === 'string' ? (next[k] as string).trim() : ''
              if (!existing && v && v.trim()) {
                next[k] = v
              }
            }
            return next
          })
        })
        .catch((err) => {
          // Auto-fill is best-effort; an extraction failure shouldn't
          // disrupt the form.
          console.warn('[draft] extractFields failed', err)
        })
    }
  }

  const titleValue = (formData['title'] as string) || ''
  const isGenerateEnabled = titleValue.trim().length > 0

  const handleGenerate = () => {
    if (!selectedTemplate) return
    const payload = buildCreateDraftPayload(
      selectedTemplate.id,
      formData,
      Array.from(localSourceIds),
      selectedTemplate.name
    )
    onGenerate(payload)
  }

  const orderedFields = useMemo(() => {
    if (!selectedTemplate) return []
    const titleField = selectedTemplate.fields.find((f) => f.id === 'title')
    const sourcesField = selectedTemplate.fields.find((f) => f.type === 'sources')
    const otherFields = selectedTemplate.fields.filter((f) => f.id !== 'title' && f.type !== 'sources')
    return [...(titleField ? [titleField] : []), ...(sourcesField ? [sourcesField] : []), ...otherFields]
  }, [selectedTemplate])

  const getColSpan = (field: (typeof orderedFields)[number]): string => {
    if (field.id === 'title') return 'col-span-2'
    if (field.type === 'textarea') return 'col-span-2'
    if (field.type === 'client-select') return 'col-span-2'
    if (field.type === 'sources') return 'col-span-2'
    return 'col-span-1'
  }

  const previewHtml = useMemo(() => {
    if (!previewDraft || previewDraft.status !== 'completed') return ''
    const hasSections = previewDraft.sections && previewDraft.sections.length > 0
    return renderDraftToHtml(
      previewDraft.content,
      hasSections ? previewDraft.sections : undefined,
      previewDraft.templateType,
      previewDraft.contentFormat,
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDraft?.id, previewDraft?.status, previewDraft?.content])

  const handleBold = useCallback(() => document.execCommand('bold', false), [])
  const handleItalic = useCallback(() => document.execCommand('italic', false), [])
  const handleUnderline = useCallback(() => document.execCommand('underline', false), [])

  // Step nav config
  const STEPS: { id: WizardStep; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'templates', label: 'Template', Icon: LayoutGrid },
    { id: 'details', label: 'Details', Icon: PenLine },
    { id: 'preview', label: 'Preview', Icon: Eye },
  ]
  const stepAvailable = (s: WizardStep) => {
    if (s === 'templates') return true
    if (s === 'details') return !!selectedTemplate
    return !!previewDraft
  }
  const stepDone = (s: WizardStep) => {
    if (s === 'templates') return !!selectedTemplate && step !== 'templates'
    if (s === 'details') return step === 'preview'
    return false
  }

  return (
    <div className="flex w-full h-full bg-white dark:bg-ledger-gray-900">

      {/* ── Left step navigator ── */}
      <div className="w-52 flex-shrink-0 flex flex-col border-r border-ledger-gray-100 dark:border-ledger-gray-800 bg-ledger-gray-50/70 dark:bg-ledger-gray-950">
        <div className="flex items-center justify-between px-5 py-5 border-b border-ledger-gray-100 dark:border-ledger-gray-800">
          <span className="text-sm font-bold text-kx-primary-900 dark:text-kx-primary-100 tracking-tight">New Draft</span>
          <button
            type="button"
            onClick={onCancel}
            className="h-7 w-7 rounded-md flex items-center justify-center text-ledger-gray-400 hover:text-ledger-gray-600 hover:bg-ledger-gray-200 dark:hover:bg-ledger-gray-700 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 p-3 pt-5">
          {STEPS.map(({ id, label, Icon }, idx) => {
            const available = stepAvailable(id)
            const done = stepDone(id)
            const active = step === id
            return (
              <button
                key={id}
                type="button"
                disabled={!available}
                onClick={() => available && setStep(id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                  active
                    ? 'bg-kx-primary-600 text-white shadow-sm'
                    : available
                      ? 'text-ledger-gray-600 dark:text-ledger-gray-300 hover:bg-white dark:hover:bg-ledger-gray-800 hover:shadow-sm'
                      : 'text-ledger-gray-300 dark:text-ledger-gray-600 cursor-not-allowed',
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors',
                  active ? 'bg-white/20 text-white'
                    : done ? 'bg-kx-primary-100 dark:bg-kx-primary-900 text-kx-primary-600 dark:text-kx-primary-400'
                      : 'bg-ledger-gray-200 dark:bg-ledger-gray-700 text-ledger-gray-500 dark:text-ledger-gray-400',
                )}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <span>{idx + 1}</span>}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Selected template chip */}
        {selectedTemplate && step !== 'templates' && (
          <div className="mt-auto px-4 pb-5 pt-3 border-t border-ledger-gray-100 dark:border-ledger-gray-800">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white dark:bg-ledger-gray-800 border border-ledger-gray-200 dark:border-ledger-gray-700">
              <div className="w-8 h-8 rounded-lg bg-kx-primary-600 flex items-center justify-center flex-shrink-0">
                {(() => { const Icon = iconMap[selectedTemplate.icon] || FileText; return <Icon className="h-4 w-4 text-white" /> })()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-kx-primary-800 dark:text-kx-primary-200 truncate">{selectedTemplate.name}</p>
                <button
                  type="button"
                  onClick={() => setStep('templates')}
                  className="text-xs text-kx-primary-500 hover:text-kx-primary-700 hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* ════════════════ STEP 1: Templates ════════════════ */}
        {step === 'templates' && (
          <>
            <div className="flex-shrink-0 px-8 pt-8 pb-4">
              <h1 className="text-2xl font-semibold text-kx-primary-900 dark:text-kx-primary-100 mb-1">Choose a template</h1>
              <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400 mb-5">Select the type of legal document you want to draft</p>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-gray-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className={cn(
                    'w-full h-10 pl-9 pr-4 rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-700',
                    'bg-white dark:bg-ledger-gray-800 text-sm text-kx-primary-900 dark:text-ledger-gray-100',
                    'placeholder:text-ledger-gray-400 focus:outline-none focus:ring-2 focus:ring-kx-primary-500 focus:border-transparent transition-all',
                  )}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ledger-gray-400 hover:text-ledger-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-8 pt-2 pb-8">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-10 w-10 text-ledger-gray-300 mb-3" />
                  <p className="text-sm font-medium text-ledger-gray-500">No templates match "{searchQuery}"</p>
                  <button type="button" onClick={() => setSearchQuery('')} className="mt-2 text-xs text-kx-primary-600 hover:underline">Clear search</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredTemplates.map((t) => {
                    const Icon = iconMap[t.icon] || FileText
                    const isSelected = selectedTemplate?.id === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setSelectedTemplate(t); setStep('details') }}
                        className={cn(
                          'group flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-150 hover:shadow-md hover:-translate-y-[1px]',
                          isSelected
                            ? 'border-kx-primary-500 bg-kx-primary-50 dark:bg-kx-primary-950 shadow-sm ring-1 ring-kx-primary-500'
                            : 'border-ledger-gray-200 dark:border-ledger-gray-700 bg-white dark:bg-ledger-gray-800 hover:border-kx-primary-300 dark:hover:border-kx-primary-700',
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                          isSelected
                            ? 'bg-kx-primary-600 text-white'
                            : 'bg-ledger-gray-100 dark:bg-ledger-gray-700 text-ledger-gray-500 group-hover:bg-kx-primary-100 group-hover:text-kx-primary-600',
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className={cn('font-semibold text-sm leading-snug', isSelected ? 'text-kx-primary-800 dark:text-kx-primary-200' : 'text-kx-primary-900 dark:text-ledger-gray-100')}>
                            {t.name}
                          </p>
                          <p className="text-xs text-ledger-gray-500 dark:text-ledger-gray-400 line-clamp-2 leading-relaxed">{t.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════════ STEP 2: Details ════════════════ */}
        {step === 'details' && selectedTemplate && (
          <>
            <div className="flex-shrink-0 px-8 pt-8 pb-2">
              <h1 className="text-xl font-semibold text-kx-primary-900 dark:text-kx-primary-100 mb-1">{selectedTemplate.name}</h1>
              <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400">
                Only the title is required. AI will use your uploaded documents to fill in any missing details.
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
              <div className="max-w-2xl mx-auto grid grid-cols-2 gap-5">
                {orderedFields.map((field) => {
                  const isRequired = field.id === 'title'
                  const colSpan = getColSpan(field)

                  if (field.type === 'sources') {
                    const allItems = [
                      ...sources.map((s) => ({ ...s, _section: 'Documents' as const })),
                      ...judgments.map((j) => ({ ...j, _section: 'Judgments' as const })),
                    ]
                    return (
                      <div key={field.id} className={cn('space-y-2', colSpan)} ref={sourceDropdownRef}>
                        <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">{field.label}</Label>
                        {allItems.length === 0 ? (
                          <p className="text-sm text-ledger-gray-400 italic py-2">No documents or judgments in this case yet.</p>
                        ) : (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setSourceDropdownOpen((o) => !o)}
                              className={cn(
                                'flex h-10 w-full items-center justify-between rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 px-3',
                                'text-sm text-kx-primary-900 dark:text-ledger-gray-200 focus:outline-none focus:ring-2 focus:ring-kx-primary-500 hover:border-ledger-gray-300 transition-colors',
                              )}
                            >
                              <span className="truncate">
                                {localSourceIds.size === 0
                                  ? <span className="text-ledger-gray-400">Select documents or judgments...</span>
                                  : <span>{localSourceIds.size} selected</span>}
                              </span>
                              <ChevronDown className={cn('h-4 w-4 shrink-0 text-ledger-gray-400 transition-transform', sourceDropdownOpen && 'rotate-180')} />
                            </button>
                            {sourceDropdownOpen && (
                              <div className="absolute z-20 mt-1 w-full rounded-xl border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 shadow-xl max-h-64 overflow-y-auto">
                                {(['Documents', 'Judgments'] as const).map((section) => {
                                  const items = allItems.filter((i) => i._section === section)
                                  if (items.length === 0) return null
                                  return (
                                    <div key={section}>
                                      <div className="sticky top-0 px-3 py-1.5 bg-ledger-gray-50 dark:bg-ledger-gray-900 border-b border-ledger-gray-100 dark:border-ledger-gray-700">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-ledger-gray-400 dark:text-ledger-gray-500">{section}</span>
                                      </div>
                                      <div className="py-1">
                                        {items.map((item) => (
                                          <label key={item.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-700">
                                            <button
                                              type="button"
                                              onClick={() => handleSourceToggle(item.id)}
                                              className={cn(
                                                'h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors',
                                                localSourceIds.has(item.id)
                                                  ? 'bg-kx-primary-600 border-kx-primary-600 text-white'
                                                  : 'border-ledger-gray-300 dark:border-ledger-gray-500 bg-white dark:bg-ledger-gray-700',
                                              )}
                                            >
                                              {localSourceIds.has(item.id) && <Check className="h-3 w-3" />}
                                            </button>
                                            <span className="text-sm text-kx-primary-900 dark:text-ledger-gray-200 truncate">{item.name}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (field.type === 'client-select') {
                    const selectedId = selectedClientIdFor[field.id] ?? ''
                    const isRespondentField = RESPONDENT_FIELD_IDS.has(field.id)
                    const currentVal = (formData[field.id] as string) || ''
                    const canSaveRespondent = isRespondentField && currentVal.trim().length > 0 && onSaveRespondent
                    const isAlreadySaved = isRespondentField && currentVal.trim() === respondentDetails?.trim()
                    return (
                      <div key={field.id} className={cn('space-y-2', colSpan)}>
                        <div className="flex items-center justify-between">
                          <Label htmlFor={field.id} className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                            {field.label}{isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {canSaveRespondent && !isAlreadySaved && (
                            <button
                              type="button"
                              onClick={() => onSaveRespondent(currentVal.trim())}
                              className="text-xs text-kx-primary-600 hover:text-kx-primary-700 hover:underline flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Save for this case
                            </button>
                          )}
                          {isAlreadySaved && (
                            <span className="text-xs text-ledger-gray-400 flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" />
                              Saved for this case
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <select
                            value={selectedId}
                            onChange={(e) => {
                              const id = e.target.value
                              setSelectedClientIdFor((prev) => ({ ...prev, [field.id]: id }))
                              if (!id) { handleFieldChange(field.id, '') }
                              else { const found = allClients.find((c) => c.id === id); if (found) handleFieldChange(field.id, found.details) }
                            }}
                            className="flex h-10 w-full rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-900 px-3 text-sm text-kx-primary-900 dark:text-ledger-gray-100 focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
                          >
                            <option value="">{isRespondentField ? 'Select from clients or type below...' : 'Select a client...'}</option>
                            {allClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <Textarea
                            id={field.id}
                            value={currentVal}
                            onChange={(e) => { setSelectedClientIdFor((prev) => ({ ...prev, [field.id]: '' })); handleFieldChange(field.id, e.target.value) }}
                            placeholder={field.placeholder || 'AI will extract from documents if left blank'}
                            className="min-h-[80px] resize-none rounded-lg border-ledger-gray-200 dark:bg-ledger-gray-900 dark:border-ledger-gray-600 dark:text-ledger-gray-100 dark:placeholder:text-ledger-gray-500"
                          />
                        </div>
                      </div>
                    )
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.id} className={cn('space-y-2', colSpan)}>
                        <Label htmlFor={field.id} className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                          {field.label}{isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <select
                          id={field.id}
                          value={(formData[field.id] as string) || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-800 px-3 text-sm text-kx-primary-900 dark:text-ledger-gray-200 focus:outline-none focus:ring-2 focus:ring-kx-primary-500"
                        >
                          {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    )
                  }

                  if (field.type === 'textarea') {
                    return (
                      <div key={field.id} className={cn('space-y-2', colSpan)}>
                        <Label htmlFor={field.id} className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                          {field.label}{isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                          id={field.id}
                          value={(formData[field.id] as string) || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder || 'AI will extract from documents if left blank'}
                          className="min-h-[100px] resize-none rounded-lg border-ledger-gray-200 dark:bg-ledger-gray-900 dark:border-ledger-gray-600 dark:text-ledger-gray-100 dark:placeholder:text-ledger-gray-500"
                        />
                      </div>
                    )
                  }

                  return (
                    <div key={field.id} className={cn('space-y-2', colSpan)}>
                      <Label htmlFor={field.id} className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                        {field.label}{isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id={field.id}
                        value={(formData[field.id] as string) || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="rounded-lg border-ledger-gray-200 dark:bg-ledger-gray-900 dark:border-ledger-gray-600 dark:text-ledger-gray-100 dark:placeholder:text-ledger-gray-500"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-ledger-gray-100 dark:border-ledger-gray-700 bg-white dark:bg-ledger-gray-900">
              <Button variant="outline" onClick={() => setStep('templates')} className="gap-2 rounded-lg text-sm">
                ← Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!isGenerateEnabled}
                className="gap-2 rounded-lg px-6 bg-kx-primary-600 hover:bg-kx-primary-700 text-white text-sm"
              >
                <Sparkles className="h-4 w-4" />
                Generate Draft
              </Button>
            </div>
          </>
        )}

        {/* ════════════════ STEP 3: Preview ════════════════ */}
        {step === 'preview' && (
          <>
            {/* Preview toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-ledger-gray-100 dark:border-ledger-gray-800 bg-white dark:bg-ledger-gray-900">
              <div className="flex items-center gap-2">
                {previewDraft?.status === 'completed' && (
                  <>
                    {isEditingPreview ? (
                      <>
                        <button onClick={handleBold} className="h-7 w-7 rounded flex items-center justify-center text-ledger-gray-500 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
                        <button onClick={handleItalic} className="h-7 w-7 rounded flex items-center justify-center text-ledger-gray-500 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
                        <button onClick={handleUnderline} className="h-7 w-7 rounded flex items-center justify-center text-ledger-gray-500 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700" title="Underline"><Underline className="h-3.5 w-3.5" /></button>
                        <div className="w-px h-4 bg-ledger-gray-200 dark:bg-ledger-gray-700 mx-1" />
                        <button
                          onClick={() => setIsEditingPreview(false)}
                          className="px-3 h-7 rounded text-xs font-medium bg-kx-primary-50 text-kx-primary-700 hover:bg-kx-primary-100 transition-colors"
                        >
                          Done editing
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingPreview(true)}
                        className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium text-ledger-gray-600 hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-700 transition-colors"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('details')}
                  className="gap-1.5 text-xs rounded-lg h-8"
                >
                  ← Edit Details
                </Button>
                {previewDraft && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { onDiscard(previewDraft.id); setStep('details') }}
                    className="gap-1.5 text-xs rounded-lg h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
                {previewDraft?.status === 'completed' && (
                  <Button
                    size="sm"
                    onClick={onSave}
                    className="gap-1.5 text-xs rounded-lg h-8 bg-kx-primary-600 hover:bg-kx-primary-700 text-white"
                  >
                    <FolderInput className="h-3.5 w-3.5" />
                    Save Draft
                  </Button>
                )}
              </div>
            </div>

            {/* Preview content */}
            {!previewDraft || previewDraft.status === 'pending' ? (
              <PreviewSkeleton />
            ) : previewDraft.status === 'failed' ? (
              <div className="flex flex-col flex-1 items-center justify-center gap-4">
                <AlertCircle className="h-10 w-10 text-red-400" />
                <p className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-200">Draft generation failed</p>
                <p className="text-xs text-ledger-gray-400 text-center max-w-xs">Something went wrong. You can delete this and try again.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { onDiscard(previewDraft.id); setStep('details') }} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />Delete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { onDiscard(previewDraft.id); setStep('details'); setTimeout(handleGenerate, 100) }} className="gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" />Retry
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800">
                <div
                  ref={previewEditorRef}
                  contentEditable={isEditingPreview}
                  suppressContentEditableWarning
                  className={cn(
                    'legal-document bg-white mx-auto my-4 shadow-sm focus:outline-none',
                    !isEditingPreview && 'cursor-default',
                    isEditingPreview && 'ring-2 ring-kx-primary-300',
                  )}
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12pt',
                    lineHeight: '1.6',
                    color: '#000',
                    width: '794px',
                    maxWidth: 'calc(100% - 48px)',
                    minHeight: '900px',
                    padding: '72px 96px',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
