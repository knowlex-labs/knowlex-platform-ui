import { useState, useEffect, useMemo, useRef, useCallback, type MouseEvent as ReactMouseEvent } from 'react'
import {
  ArrowLeft, FileText, Sparkles, Paperclip, PanelLeft,
  Search, X, AlertCircle, Loader2,
  FileWarning, FileClock, Scale, Gavel, ShieldAlert,
  ScrollText, ClipboardList, AlignLeft, Landmark, Star, Ban,
  ShieldCheck, RefreshCcw, Hammer, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { trackJob } from '@/lib/drafts/draft-tracker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { draftsApi } from '@knowlex/core/api/drafts-api'
import { caseApi } from '@knowlex/core/api/case-api'
import { formatCaseFolderLabel } from '@knowlex/core/utils'
import { uploadToolboxFile, getDocument } from '@knowlex/core/api/doc-processing-api'
import { subscribeDocumentStatus } from '@knowlex/core/api/document-status-watcher'
import { DocumentEditor } from '@/components/editor'
import { GeneratingState } from '@/components/ui/generating-state'
import { toast } from '@/hooks/use-toast'
import type { DraftTemplate, TemplateFormData } from '@knowlex/core/types'
import { DRAFT_TEMPLATES } from '@knowlex/core/types'
import type { CreateDraftRequest, DocumentType, Language } from '@knowlex/core/api/document-types'
import type { BackendCase } from '@knowlex/core/types/api.types'
import { TEMPLATE_TO_DOC_CONFIG } from '@/components/cases/case-workspace/draft-creation-wizard'
import { useUIState } from '@/contexts/ui-context'
import { RecentDraftsList } from './recent-drafts-list'
import type { RecentDraftsListHandle } from './recent-drafts-list'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileWarning, FileText, FileClock, Scale, Gavel, ShieldAlert,
  ScrollText, ClipboardList, AlignLeft, Landmark, Star, Ban,
  ShieldCheck, RefreshCcw, Hammer, Users,
}

function assembleBody(templateId: string, formData: TemplateFormData): string {
  const get = (key: string): string => (formData[key] as string) || ''
  switch (templateId) {
    case 'notice':
      return `Draft a legal notice to ${get('recipient')}. ${get('body')}`.trim()
    case 'application-draft':
      return `Draft an application for applicant ${get('applicant')}. ${get('body')}`.trim()
    case 'interim-application':
      return `Draft an interim application. Plaintiff: ${get('plaintiff')}. Defendant: ${get('defendant')}. Grounds: ${get('grounds')}`.trim()
    case 'affidavit':
      return `Draft an affidavit for deponent ${get('deponent')}. Statements: ${get('statements')}`.trim()
    case 'bail-application':
      return `Draft a bail application. Applicant: ${get('applicant')}. Opposite Party: ${get('opposite_party')}. Court: ${get('court_details')}. FIR Details: ${get('fir_details')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case '2nd-bail-application':
      return `Draft a second / subsequent bail application under Section 483 BNSS. Applicant: ${get('applicant')}. Opposite Party: ${get('opposite_party')}. Court: ${get('court_details')}. FIR Details: ${get('fir_details')}. Facts: ${get('facts')}. Earlier HC Bail: ${get('earlier_hc_bail')}. Lower-Court Rejection: ${get('lower_court_rejection')}. Change in Circumstances / Fresh Grounds: ${get('change_in_circumstances')}. Criminal History: ${get('criminal_history')}. Co-Accused Details: ${get('co_accused_details')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'criminal-appeal':
      return `Draft a criminal appeal. Appellant: ${get('appellant')}. Respondent: ${get('respondent')}. Court: ${get('court_details')}. Impugned Order: ${get('impugned_order')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'plaint':
      return `Draft a civil suit plaint. Plaintiff: ${get('plaintiff')}. Defendant: ${get('defendant')}. Court: ${get('court_details')}. Cause of Action: ${get('cause_of_action')}. Facts: ${get('facts')}. Valuation: ${get('valuation')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'written-statement':
      return `Draft a written statement. Defendant: ${get('defendant')}. Plaintiff: ${get('plaintiff')}. Court: ${get('court_details')}. Preliminary Objections: ${get('preliminary_objections')}. Reply on Facts: ${get('reply_on_facts')}. Additional Pleas: ${get('additional_pleas')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'written-arguments':
      return `Draft written arguments. Party: ${get('party')}. Court: ${get('court_details')}. Case: ${get('case_details')}. Issues: ${get('issues')}. Arguments: ${get('arguments')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'writ-petition':
      return `Draft a writ petition. Nature of Writ: ${get('writ_type')}. Petitioner: ${get('petitioner')}. Respondent: ${get('respondent')}. Court: ${get('court_details')}. Impugned Order/Action: ${get('impugned_order')}. Grounds: ${get('grounds')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'slp':
      return `Draft a Special Leave Petition under Article 136. Petitioner: ${get('petitioner')}. Respondent: ${get('respondent')}. Impugned Judgment: ${get('impugned_judgment')}. Grounds: ${get('grounds')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'quashing-petition':
      return `Draft a petition for quashing of FIR/proceedings. Petitioner: ${get('petitioner')}. Respondent: ${get('respondent')}. Court: ${get('court_details')}. FIR Details: ${get('fir_details')}. Grounds for Quashing: ${get('grounds')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'anticipatory-bail':
      return `Draft an anticipatory bail application. Applicant: ${get('applicant')}. Opposite Party: ${get('opposite_party')}. Court: ${get('court_details')}. FIR/Case Details: ${get('fir_details')}. Grounds: ${get('grounds')}. Facts: ${get('facts')}. Criminal History: ${get('criminal_history')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'revision-petition':
      return `Draft a revision petition. Petitioner: ${get('petitioner')}. Respondent: ${get('respondent')}. Court: ${get('court_details')}. Impugned Order: ${get('impugned_order')}. Grounds for Revision: ${get('grounds')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
    case 'execution-petition':
      return `Draft an execution petition. Decree Holder: ${get('decree_holder')}. Judgment Debtor: ${get('judgment_debtor')}. Court: ${get('court_details')}. Decree Details: ${get('decree_details')}. Amount Due: ${get('amount_due')}. Mode of Execution: ${get('mode_of_execution')}. Property Details: ${get('property_details')}.`.trim()
    case 'consumer-complaint':
      return `Draft a consumer complaint. Complainant: ${get('complainant')}. Opposite Party: ${get('opposite_party')}. Forum: ${get('forum_details')}. Product/Service: ${get('product_service')}. Deficiency/Defect: ${get('deficiency')}. Facts: ${get('facts')}. Loss Suffered: ${get('loss_suffered')}. Relief Sought: ${get('relief_sought')}.`.trim()
    default:
      return 'Generate a legal document based on the provided information.'
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PageMode = 'workspace' | 'details' | 'inline-preview'
const DRAFTING_PANEL_WIDTH_KEY = 'knowlex_drafting_recent_panel_width'
const MIN_PANEL_WIDTH = 260
const MAX_PANEL_WIDTH = 460

interface InlinePreview {
  docId: string
  title: string
  // 'loading' = we're resolving the doc's status.
  // 'pending' = the agent is still generating it.
  status: 'loading' | 'pending' | 'completed' | 'failed'
}

// A4-shaped skeleton shown while we fetch a completed draft's content.
// Distinct from <GeneratingState>, which lies if the draft is already done.
function DraftPreviewSkeleton() {
  return (
    <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800">
      <div
        className="bg-white dark:bg-ledger-gray-900 mx-auto my-4 shadow-sm p-12"
        style={{ width: '794px', minHeight: '1100px' }}
      >
        <div className="space-y-4 animate-pulse">
          <div className="h-7 bg-ledger-gray-200 dark:bg-ledger-gray-700 rounded w-2/3 mx-auto mb-8" />
          <div className="h-4 bg-ledger-gray-200 dark:bg-ledger-gray-700 rounded w-1/2 ml-auto" />
          <div className="h-4 bg-ledger-gray-200 dark:bg-ledger-gray-700 rounded w-1/3 ml-auto mb-8" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2 pt-2">
              <div className="h-3.5 bg-ledger-gray-200 dark:bg-ledger-gray-700 rounded w-full" />
              <div className="h-3.5 bg-ledger-gray-200 dark:bg-ledger-gray-700 rounded w-11/12" />
              <div className="h-3.5 bg-ledger-gray-200 dark:bg-ledger-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

function DraftsPanelReopenButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium text-kx-text-primary hover:bg-ledger-gray-100 dark:hover:bg-ledger-gray-800 transition-colors flex-shrink-0"
      title="Show drafts"
    >
      <PanelLeft className="h-4 w-4 text-ledger-gray-500" />
      <span>Drafts</span>
    </button>
  )
}

export function DraftingPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setSidebarCollapsed } = useUIState()

  const [mode, setMode] = useState<PageMode>('workspace')
  const [panelOpen, setPanelOpen] = useState(true)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const raw = localStorage.getItem(DRAFTING_PANEL_WIDTH_KEY)
    const parsed = raw ? Number(raw) : NaN
    return Number.isFinite(parsed) ? Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, parsed)) : 288
  })
  const pageRootRef = useRef<HTMLDivElement>(null)

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Form
  const [formData, setFormData] = useState<TemplateFormData>({})

  // Standalone: case + files
  const [cases, setCases] = useState<{ id: string; label: string }[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [refFiles, setRefFiles] = useState<File[]>([])
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [customLanguage, setCustomLanguage] = useState<Language | ''>('')
  const [customCaseId, setCustomCaseId] = useState('')
  const [customRefFiles, setCustomRefFiles] = useState<File[]>([])
  const [customUploadedFileIds, setCustomUploadedFileIds] = useState<string[]>([])
  const [isUploadingCustomFiles, setIsUploadingCustomFiles] = useState(false)
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false)

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline preview (when user clicks a recent draft)
  const [inlinePreview, setInlinePreview] = useState<InlinePreview | null>(null)

  // Recent drafts list — exposes refresh() so we can re-fetch after a new
  // submission. Completion toasts are owned by the global <DraftTracker />.
  const recentDraftsRef = useRef<RecentDraftsListHandle>(null)

  useEffect(() => { setSidebarCollapsed(true) }, [setSidebarCollapsed])
  useEffect(() => {
    localStorage.setItem(DRAFTING_PANEL_WIDTH_KEY, String(panelWidth))
  }, [panelWidth])

  const handlePanelResizeStart = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const pageLeft = pageRootRef.current?.getBoundingClientRect().left ?? 0
    const onMouseMove = (moveEvent: MouseEvent) => {
      const next = moveEvent.clientX - pageLeft
      setPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, next)))
    }
    const onMouseUp = () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Fetch cases for custom + template case linking
  useEffect(() => {
    caseApi.getAll({ size: 50 }).then(res => {
      if (res.status === 'success') {
        setCases(res.data.content.map((c: BackendCase) => ({
          id: c.id,
          label: formatCaseFolderLabel(c),
        })))
      }
    }).catch(() => {})
  }, [])

  // Init form when template selected
  useEffect(() => {
    if (!selectedTemplate) return
    const initial: TemplateFormData = {}
    selectedTemplate.fields.forEach(f => {
      if (f.type === 'sources') initial[f.id] = []
      else if (f.type === 'select' && f.options?.length) initial[f.id] = f.options[0].value
      else initial[f.id] = ''
    })
    setFormData(initial)
  }, [selectedTemplate])

  useEffect(() => {
    if (mode === 'workspace') setTimeout(() => searchInputRef.current?.focus(), 50)
  }, [mode])

  // ── Computed ──
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return DRAFT_TEMPLATES
    return DRAFT_TEMPLATES.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  }, [searchQuery])

  const titleValue = (formData['title'] as string) || ''
  const isGenerateEnabled = titleValue.trim().length > 0 && !isSubmitting

  const orderedFields = useMemo(() => {
    if (!selectedTemplate) return []
    const titleField = selectedTemplate.fields.find(f => f.id === 'title')
    const rest = selectedTemplate.fields.filter(f => f.id !== 'title' && f.type !== 'sources')
    return [...(titleField ? [titleField] : []), ...rest]
  }, [selectedTemplate])

  // ── Actions ──
  const resetWizard = useCallback(() => {
    setSelectedTemplate(null)
    setFormData({})
    setSelectedCaseId('')
    setRefFiles([])
    setUploadedFileIds([])
  }, [])

  const handleSelectTemplate = (t: DraftTemplate) => {
    setSelectedTemplate(t)
    setMode('details')
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleFilesSelected = async (files: File[]) => {
    setRefFiles(prev => [...prev, ...files])
    setIsUploadingFiles(true)
    try {
      const ids = await Promise.all(files.map(f => uploadToolboxFile(f)))
      setUploadedFileIds(prev => [...prev, ...ids])
    } catch { /* ignore */ }
    finally { setIsUploadingFiles(false) }
  }

  const handleRemoveFile = (idx: number) => {
    setRefFiles(prev => prev.filter((_, i) => i !== idx))
    setUploadedFileIds(prev => prev.filter((_, i) => i !== idx))
  }

  const handleCustomFilesSelected = async (files: File[]) => {
    setCustomRefFiles(prev => [...prev, ...files])
    setIsUploadingCustomFiles(true)
    try {
      const ids = await Promise.all(files.map(f => uploadToolboxFile(f)))
      setCustomUploadedFileIds(prev => [...prev, ...ids])
    } catch { /* ignore */ }
    finally { setIsUploadingCustomFiles(false) }
  }

  const handleRemoveCustomFile = (idx: number) => {
    setCustomRefFiles(prev => prev.filter((_, i) => i !== idx))
    setCustomUploadedFileIds(prev => prev.filter((_, i) => i !== idx))
  }

  const resetCustomComposer = () => {
    setCustomTitle('')
    setCustomPrompt('')
    setCustomLanguage('')
    setCustomCaseId('')
    setCustomRefFiles([])
    setCustomUploadedFileIds([])
  }

  const customTitleValue = customTitle.trim()
  const customPromptValue = customPrompt.trim()
  const isGenerateCustomEnabled =
    customTitleValue.length > 0 &&
    customPromptValue.length >= 10 &&
    !isSubmittingCustom

  const handleGenerateCustom = async () => {
    if (!isGenerateCustomEnabled) {
      if (!customTitleValue) toast({ title: 'Title is required', variant: 'destructive' })
      else if (customPromptValue.length < 10) toast({ title: 'Prompt must be at least 10 characters', variant: 'destructive' })
      return
    }
    setIsSubmittingCustom(true)
    const hasFiles = customUploadedFileIds.length > 0
    const request: CreateDraftRequest = {
      title: customTitleValue,
      document_type: 'legal_notice',
      input_mode: hasFiles ? 'file' : 'freetext',
      freetext_body: customPromptValue,
      file_ids: hasFiles ? customUploadedFileIds : undefined,
      language: customLanguage || undefined,
    }
    try {
      const res = await draftsApi.createStandalone(request, customCaseId || undefined)
      if (!res.data) throw new Error('No data returned')
      trackJob(res.data.id, customTitleValue)
      resetCustomComposer()
      setTimeout(() => recentDraftsRef.current?.refresh(), 0)
      toast({ title: 'Generating custom draft…', description: "We'll notify you when it's ready." })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start custom draft generation'
      const isLimitError = /limit|upgrade|quota/i.test(message)
      if (isLimitError) setShowUpgradeModal(true)
      else toast({ title: message, variant: 'destructive' })
    } finally {
      setIsSubmittingCustom(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplate || isSubmitting) return
    setIsSubmitting(true)
    const config = TEMPLATE_TO_DOC_CONFIG[selectedTemplate.id] || { documentType: 'legal_notice' as DocumentType }
    const title = titleValue.trim() || selectedTemplate.name
    const body = assembleBody(selectedTemplate.id, formData)
    const allFileIds = [...uploadedFileIds]
    const hasFiles = allFileIds.length > 0
    const language = formData['language'] as Language | undefined
    const isCriminal = [
      'bail-application', 'criminal-appeal', 'anticipatory-bail',
      'quashing-petition', 'revision-petition', 'writ-petition', 'slp',
    ].includes(selectedTemplate.id)
    const criminalConfigKeys = [
      'fir_details', 'criminal_history', 'bail_history', 'co_accused_details',
      'impugned_order', 'impugned_judgment', 'court_details', 'facts', 'relief_sought',
      'applicant', 'opposite_party', 'appellant', 'respondent', 'petitioner', 'grounds', 'writ_type',
    ]
    let draftConfig: Record<string, string> | undefined
    if (isCriminal) {
      const entries = criminalConfigKeys
        .filter(key => typeof formData[key] === 'string' && (formData[key] as string).trim().length > 0)
        .map(key => [key, (formData[key] as string).trim()])
      if (entries.length > 0) draftConfig = Object.fromEntries(entries)
    }
    const request: CreateDraftRequest = {
      title,
      document_type: config.documentType,
      input_mode: hasFiles ? 'file' : 'freetext',
      subtype: config.subtype,
      freetext_body: body.length > 0 ? body : undefined,
      file_ids: hasFiles ? allFileIds : undefined,
      language: language || undefined,
      config: draftConfig,
    }
    try {
      const res = await draftsApi.createStandalone(request, selectedCaseId || undefined)
      if (!res.data) throw new Error('No data returned')
      // Bounce back to the list immediately. The new draft will appear there
      // as a "Generating…" row that polls until completion. The completion
      // toast is fired by the globally-mounted <DraftTracker />.
      const newDocId = res.data.id
      const label = title
      // Track globally so the completion toast fires no matter which page
      // the user navigates to next. The list refreshes once it remounts.
      trackJob(newDocId, label)
      resetWizard()
      setMode('workspace')
      setTimeout(() => recentDraftsRef.current?.refresh(), 0)
      toast({ title: 'Generating draft…', description: "We'll notify you when it's ready." })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start draft generation'
      const isLimitError = /limit|upgrade|quota/i.test(message)
      if (isLimitError) {
        setShowUpgradeModal(true)
      } else {
        toast({ title: message, variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Inline preview (open a completed draft from the list) ──
  const handleOpenDraft = useCallback(async (docId: string) => {
    setMode('inline-preview')
    setInlinePreview({ docId, title: 'Loading…', status: 'loading' })
    try {
      const doc = await getDocument(docId)
      const js = (doc.jobStatus ?? '').toString().toUpperCase()
      const status: InlinePreview['status'] =
        js === 'COMPLETED' ? 'completed' :
        js === 'FAILED' ? 'failed' : 'pending'
      setInlinePreview({
        docId,
        title: doc.originalFilename || doc.name || 'Draft',
        status,
      })
    } catch {
      setInlinePreview({ docId, title: 'Draft', status: 'failed' })
    }
  }, [])

  // ?open=<docId> in the URL means the user clicked the "Open" action on a
  // "Draft ready" toast (fired by the global DraftTracker). Switch straight
  // into inline-preview for that doc, then strip the param so a refresh
  // doesn't re-open it.
  useEffect(() => {
    const openId = searchParams.get('open')
    if (!openId) return
    handleOpenDraft(openId)
    const next = new URLSearchParams(searchParams)
    next.delete('open')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, handleOpenDraft])

  // Stream status while the draft is generating so the editor mounts the
  // moment the agent finishes — no manual refresh needed.
  const pendingDocId =
    inlinePreview?.status === 'pending' ? inlinePreview.docId : null
  useEffect(() => {
    if (!pendingDocId) return
    // Uses the shared subscribeDocumentStatus watcher so this inline-preview
    // poll joins (rather than duplicates) the polls the RecentDraftsList row
    // and the global DraftTracker already have running for the same docId.
    const unsubscribe = subscribeDocumentStatus(pendingDocId, {
      onStatus: (statusDoc) => {
        const s = (statusDoc.jobStatus ?? '').toString().toUpperCase()
        if (s !== 'COMPLETED' && s !== 'FAILED' && s !== 'CANCELLED') return
        setInlinePreview((prev) =>
          prev && prev.docId === pendingDocId
            ? { ...prev, status: s === 'COMPLETED' ? 'completed' : 'failed' }
            : prev
        )
      },
      onError: () => {},
      onEnd: () => {},
    })
    return unsubscribe
  }, [pendingDocId])

  const handleBackToWorkspace = () => {
    setInlinePreview(null)
    setMode('workspace')
  }

  const handleRetryFromFailed = () => {
    setInlinePreview(null)
    setMode('workspace')
  }

  // ── Render ──

  return (
    <div ref={pageRootRef} className="flex h-full bg-kx-surface overflow-hidden">
      {panelOpen && (
        <div style={{ width: panelWidth }} className="flex-shrink-0 overflow-hidden flex flex-col">
          <RecentDraftsList
            ref={recentDraftsRef}
            onOpenDraft={handleOpenDraft}
            onCollapse={() => setPanelOpen(false)}
          />
        </div>
      )}
      {panelOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handlePanelResizeStart}
          className="w-1.5 cursor-col-resize bg-transparent hover:bg-kx-primary-100 dark:hover:bg-kx-primary-900/30 transition-colors flex-shrink-0"
          title="Resize panel"
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {mode === 'inline-preview' && inlinePreview ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-kx-card-border bg-kx-card flex-shrink-0">
              {!panelOpen && <DraftsPanelReopenButton onClick={() => setPanelOpen(true)} />}
              <button
                type="button"
                onClick={handleBackToWorkspace}
                className="flex items-center gap-1.5 text-sm text-ledger-gray-500 hover:text-kx-primary-600 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="h-4 w-px bg-ledger-gray-200 flex-shrink-0" />
              <h1 className="text-base font-semibold text-kx-primary-900 truncate min-w-0">{inlinePreview.title}</h1>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              {inlinePreview.status === 'loading' ? (
                <DraftPreviewSkeleton />
              ) : inlinePreview.status === 'pending' ? (
                <GeneratingState label="Draft" />
              ) : inlinePreview.status === 'failed' ? (
                <div className="flex flex-col flex-1 items-center justify-center gap-4">
                  <AlertCircle className="h-10 w-10 text-red-400" />
                  <p className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-200">Draft generation failed</p>
                  <p className="text-xs text-ledger-gray-400 text-center max-w-xs">Something went wrong with this draft.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleBackToWorkspace}>
                      Back to drafts
                    </Button>
                    <Button size="sm" onClick={handleRetryFromFailed} className="bg-kx-primary-600 hover:bg-kx-primary-700 text-white">
                      Try again
                    </Button>
                  </div>
                </div>
              ) : (
                <DocumentEditor
                  documentId={inlinePreview.docId}
                  documentTitle={inlinePreview.title}
                  className="flex-1 min-h-0"
                />
              )}
            </div>
          </>
        ) : mode === 'details' && selectedTemplate ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-kx-card-border bg-kx-card flex-shrink-0">
              {!panelOpen && <DraftsPanelReopenButton onClick={() => setPanelOpen(true)} />}
              <button
                type="button"
                onClick={() => { resetWizard(); setMode('workspace') }}
                className="flex items-center gap-1.5 text-sm text-ledger-gray-500 hover:text-kx-primary-600 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </button>
              <div className="h-4 w-px bg-ledger-gray-200 flex-shrink-0" />
              <h1 className="text-lg font-serif font-semibold text-kx-primary-900 truncate min-w-0">
                {selectedTemplate.name}
              </h1>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-5">
              <div className="max-w-2xl mx-auto">
                <p className="text-sm text-ledger-gray-500 mb-5">
                  Only the title is required. AI will use your documents to fill in missing details.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                        Link to Case <span className="text-ledger-gray-400 font-normal">(optional)</span>
                      </Label>
                      <Select value={selectedCaseId} onChange={e => setSelectedCaseId(e.target.value)} searchable searchPlaceholder="Search cases...">
                        <option value="">No case — standalone draft</option>
                        {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                        Reference Files <span className="text-ledger-gray-400 font-normal">(optional)</span>
                      </Label>
                      <CompactFileUpload
                        accept=".pdf,.doc,.docx,.txt"
                        selectedFiles={refFiles}
                        onFilesSelected={handleFilesSelected}
                        onRemoveFile={handleRemoveFile}
                        isUploading={isUploadingFiles}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orderedFields.map(field => {
                    const isRequired = field.id === 'title'
                    const colSpan = field.id === 'title' || field.type === 'textarea' || field.type === 'client-select' ? 'md:col-span-2' : ''

                    if (field.type === 'select') {
                      return (
                        <div key={field.id} className={cn('space-y-1.5', colSpan)}>
                          <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                            {field.label}{isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Select
                            value={(formData[field.id] as string) || ''}
                            onChange={e => handleFieldChange(field.id, e.target.value)}
                          >
                            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </Select>
                        </div>
                      )
                    }

                    if (field.type === 'textarea' || field.type === 'client-select') {
                      return (
                        <div key={field.id} className={cn('space-y-1.5', colSpan)}>
                          <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                            {field.label}{isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Textarea
                            value={(formData[field.id] as string) || ''}
                            onChange={e => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder || 'AI will extract from documents if left blank'}
                            className="min-h-[80px] resize-none rounded-lg border-ledger-gray-200 dark:bg-ledger-gray-900 dark:border-ledger-gray-600 dark:text-ledger-gray-100"
                          />
                        </div>
                      )
                    }

                    return (
                      <div key={field.id} className={cn('space-y-1.5', colSpan)}>
                        <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                          {field.label}{isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          value={(formData[field.id] as string) || ''}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="rounded-lg border-ledger-gray-200 dark:bg-ledger-gray-900 dark:border-ledger-gray-600 dark:text-ledger-gray-100"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-4 md:px-6 py-4 border-t border-kx-card-border flex-shrink-0 bg-kx-card">
              <Button
                onClick={handleGenerate}
                disabled={!isGenerateEnabled}
                className="gap-2 rounded-lg px-6 bg-kx-primary-600 hover:bg-kx-primary-700 text-white text-sm"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isSubmitting ? 'Starting…' : 'Generate Draft'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {!panelOpen && (
              <div className="flex items-center px-4 py-2 border-b border-kx-card-border bg-kx-card flex-shrink-0">
                <DraftsPanelReopenButton onClick={() => setPanelOpen(true)} />
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-5">
              <div className="mb-5">
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">Drafts</h2>
                <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400 mt-1">
                  Generate legal documents with AI from predefined templates.
                </p>
              </div>

              <section className="rounded-xl border border-ledger-gray-200 dark:border-ledger-gray-700 bg-kx-card p-4 md:p-5 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-kx-primary-600" />
                  <h3 className="text-base font-semibold text-kx-text-primary">Custom Prompt Draft</h3>
                </div>
                <p className="text-xs text-ledger-gray-500 dark:text-ledger-gray-400 mb-4">
                  Describe what to draft, optionally attach reference files, and generate instantly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                      Draft Title <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g., Reply Notice for XYZ"
                      className="rounded-lg border-ledger-gray-200 dark:bg-ledger-gray-900 dark:border-ledger-gray-600 dark:text-ledger-gray-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                      Link to Case <span className="text-ledger-gray-400 font-normal">(optional)</span>
                    </Label>
                    <Select value={customCaseId} onChange={e => setCustomCaseId(e.target.value)} searchable searchPlaceholder="Search cases...">
                      <option value="">No case — standalone draft</option>
                      {cases.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                      Draft Prompt <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Explain what to draft. Include parties, facts, legal grounds, relief, tone, and format."
                      className="min-h-[120px] resize-y rounded-lg border-ledger-gray-200 dark:bg-ledger-gray-900 dark:border-ledger-gray-600 dark:text-ledger-gray-100"
                    />
                    <p className="text-[11px] text-ledger-gray-500">Minimum 10 characters.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                      Language <span className="text-ledger-gray-400 font-normal">(optional)</span>
                    </Label>
                    <Select value={customLanguage} onChange={e => setCustomLanguage(e.target.value as Language | '')}>
                      <option value="">Default</option>
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="bilingual">Bilingual</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-300">
                      Reference Files <span className="text-ledger-gray-400 font-normal">(optional)</span>
                    </Label>
                    <CompactFileUpload
                      accept=".pdf,.doc,.docx,.txt"
                      selectedFiles={customRefFiles}
                      onFilesSelected={handleCustomFilesSelected}
                      onRemoveFile={handleRemoveCustomFile}
                      isUploading={isUploadingCustomFiles}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handleGenerateCustom}
                    disabled={!isGenerateCustomEnabled}
                    className="gap-2 rounded-lg px-5 bg-kx-primary-600 hover:bg-kx-primary-700 text-white text-sm"
                  >
                    {isSubmittingCustom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isSubmittingCustom ? 'Starting…' : 'Generate Draft'}
                  </Button>
                </div>
              </section>

              <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-base font-semibold text-kx-text-primary">Predefined templates</h3>
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ledger-gray-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search templates..."
                      className={cn(
                        'w-full h-9 pl-9 pr-8 rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-700',
                        'bg-white dark:bg-ledger-gray-800 text-sm text-kx-primary-900 dark:text-ledger-gray-100',
                        'placeholder:text-ledger-gray-400 focus:outline-none focus:border-kx-primary-500',
                      )}
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ledger-gray-400 hover:text-ledger-gray-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-ledger-gray-200 rounded-lg">
                    <Search className="h-8 w-8 text-ledger-gray-300 mb-2" />
                    <p className="text-sm font-medium text-ledger-gray-500">No templates match &ldquo;{searchQuery}&rdquo;</p>
                    <button type="button" onClick={() => setSearchQuery('')} className="mt-2 text-xs text-kx-primary-600 hover:underline">Clear search</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredTemplates.map(t => {
                      const Icon = iconMap[t.icon] || FileText
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTemplate(t)}
                          className={cn(
                            'group flex flex-col gap-3 p-4 rounded-xl border text-left transition-all duration-150 hover:shadow-md hover:-translate-y-[1px]',
                            'border-ledger-gray-200 dark:border-ledger-gray-700 bg-white dark:bg-ledger-gray-800 hover:border-kx-primary-300 dark:hover:border-kx-primary-700',
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-ledger-gray-100 dark:bg-ledger-gray-700 text-ledger-gray-500 group-hover:bg-kx-primary-100 group-hover:text-kx-primary-600 transition-colors">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <p className="font-semibold text-sm leading-snug text-kx-primary-900 dark:text-ledger-gray-100">{t.name}</p>
                            <p className="text-xs text-ledger-gray-500 dark:text-ledger-gray-400 line-clamp-2 leading-relaxed">{t.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} onUpgrade={() => navigate('/settings/billing')} />
    </div>
  )
}

function CompactFileUpload({
  accept,
  selectedFiles,
  onFilesSelected,
  onRemoveFile,
  isUploading,
}: {
  accept: string
  selectedFiles: File[]
  onFilesSelected: (files: File[]) => void
  onRemoveFile: (idx: number) => void
  isUploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const count = selectedFiles.length

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const files = Array.from(e.dataTransfer.files)
          if (files.length) onFilesSelected(files)
        }}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors',
          isDragging
            ? 'border-kx-primary-400 bg-kx-primary-50 dark:bg-kx-primary-950/20'
            : 'border-ledger-gray-200 dark:border-ledger-gray-600 bg-white dark:bg-ledger-gray-900 hover:border-kx-primary-300 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-800/40'
        )}
      >
        {isUploading
          ? <Loader2 className="h-4 w-4 flex-shrink-0 text-kx-primary-500 animate-spin" />
          : <Paperclip className="h-4 w-4 flex-shrink-0 text-ledger-gray-400" />}
        <span className="flex-1 text-left truncate text-ledger-gray-500 dark:text-ledger-gray-400">
          {isUploading
            ? 'Uploading…'
            : count > 0
              ? `${count} file${count > 1 ? 's' : ''} attached — click to add more`
              : 'Drop files or click to browse'}
        </span>
        <span className="hidden sm:inline text-[11px] text-ledger-gray-400 flex-shrink-0">
          PDF, DOC, DOCX, TXT
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFilesSelected(files)
          e.target.value = ''
        }}
      />
      {count > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedFiles.map((f, i) => (
            <span
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1.5 max-w-[220px] rounded-full bg-kx-primary-50 dark:bg-kx-primary-900/40 pl-2.5 pr-1 py-0.5 text-xs text-kx-primary-700 dark:text-kx-primary-200"
            >
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{f.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemoveFile(i) }}
                className="flex-shrink-0 rounded-full p-0.5 hover:bg-kx-primary-100 dark:hover:bg-kx-primary-900 transition-colors"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function UpgradeModal({
  open, onOpenChange, onUpgrade,
}: { open: boolean; onOpenChange: (open: boolean) => void; onUpgrade: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-kx-primary-600" />
            Draft Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've used all your drafts for this month. Upgrade your plan to generate more drafts.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-3">
          <Button
            className="w-full bg-gradient-to-r from-kx-primary-600 to-kx-primary-700 text-white hover:from-kx-primary-700 hover:to-kx-primary-800"
            onClick={() => { onOpenChange(false); onUpgrade() }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
