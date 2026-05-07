import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  ArrowLeft, FileText, Sparkles, Lock,
  Search, X, AlertCircle, Loader2,
  FileWarning, Lightbulb, FileClock, Scale, Gavel, ShieldAlert,
  ScrollText, ClipboardList, AlignLeft, Landmark, Star, Ban,
  ShieldCheck, RefreshCcw, Hammer, Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { FileUploadZone } from '@/components/toolbox/file-upload-zone'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { draftsApi } from '@knowlex/core/api/drafts-api'
import { caseApi } from '@knowlex/core/api/case-api'
import { uploadToolboxFile, getDocument, updateDocumentContent } from '@knowlex/core/api/doc-processing-api'
import { workspaceApi } from '@knowlex/core/api/workspace-api'
import { renderDraftToHtml } from '@/lib/draft-renderer'
import { useEditorFormatting } from '@/hooks/use-editor-formatting'
import { FormattingToolbar } from '@/components/editor'
import { GeneratingState } from '@/components/ui/generating-state'
import { toast } from '@/hooks/use-toast'
import type { DraftTemplate, TemplateFormData } from '@knowlex/core/types'
import { DRAFT_TEMPLATES } from '@knowlex/core/types'
import type { CreateDraftRequest, DocumentType, Language } from '@knowlex/core/api/document-types'
import type { BackendCase } from '@knowlex/core/types/api.types'
import { TEMPLATE_TO_DOC_CONFIG } from '@/components/cases/case-workspace/draft-creation-wizard'
import { RecentDraftsList } from './recent-drafts-list'
import type { RecentDraftsListHandle } from './recent-drafts-list'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileWarning, Lightbulb, FileText, FileClock, Scale, Gavel, ShieldAlert,
  ScrollText, ClipboardList, AlignLeft, Landmark, Star, Ban,
  ShieldCheck, RefreshCcw, Hammer, Users,
}

function assembleBody(templateId: string, formData: TemplateFormData): string {
  const get = (key: string): string => (formData[key] as string) || ''
  switch (templateId) {
    case 'notice':
      return `Draft a legal notice to ${get('recipient')}. ${get('body')}`.trim()
    case 'patent':
      return `Draft a patent application. Applicant: ${get('applicant')}. Inventor: ${get('inventor')}. Description: ${get('description')}`.trim()
    case 'application-draft':
      return `Draft an application for applicant ${get('applicant')}. ${get('body')}`.trim()
    case 'interim-application':
      return `Draft an interim application. Plaintiff: ${get('plaintiff')}. Defendant: ${get('defendant')}. Grounds: ${get('grounds')}`.trim()
    case 'affidavit':
      return `Draft an affidavit for deponent ${get('deponent')}. Statements: ${get('statements')}`.trim()
    case 'bail-application':
      return `Draft a bail application. Applicant: ${get('applicant')}. Opposite Party: ${get('opposite_party')}. Court: ${get('court_details')}. FIR Details: ${get('fir_details')}. Facts: ${get('facts')}. Relief Sought: ${get('relief_sought')}.`.trim()
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

type PageMode = 'home' | 'list' | 'details' | 'inline-preview'

interface InlinePreview {
  docId: string
  title: string
  status: 'pending' | 'completed' | 'failed'
  contentHtml: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DraftingPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<PageMode>('home')

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

  // Upgrade modal
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inline preview (when user clicks a recent draft)
  const [inlinePreview, setInlinePreview] = useState<InlinePreview | null>(null)
  const [isEditingPreview, setIsEditingPreview] = useState(false)
  const [previewDirty, setPreviewDirty] = useState(false)
  const [isSavingPreview, setIsSavingPreview] = useState(false)
  const previewEditorRef = useRef<HTMLDivElement>(null)
  const previewFormatting = useEditorFormatting(previewEditorRef, () => setPreviewDirty(true))

  // Recent drafts list — exposes refresh() and trackJob() so we can mark a
  // freshly-submitted draft and refresh after submission.
  const recentDraftsRef = useRef<RecentDraftsListHandle>(null)

  // Populate editor content after the contentEditable div mounts
  useEffect(() => {
    if (isEditingPreview && previewEditorRef.current && inlinePreview?.contentHtml) {
      previewEditorRef.current.innerHTML = inlinePreview.contentHtml
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingPreview])

  // Fetch cases when entering details step
  useEffect(() => {
    if (mode !== 'details') return
    caseApi.getAll({ size: 50 }).then(res => {
      if (res.status === 'success') {
        setCases(res.data.content.map((c: BackendCase) => ({
          id: c.id,
          label: c.caseTitle || c.caseNumber || c.id,
        })))
      }
    }).catch(() => {})
  }, [mode])

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

  // Auto-focus search on landing
  useEffect(() => {
    if (mode === 'list') setTimeout(() => searchInputRef.current?.focus(), 50)
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
      // as a "Generating…" row that polls until completion. A toast fires when
      // the row's status flips (handled by RecentDraftsList via trackJob).
      const newDocId = res.data.id
      const label = title
      // Bounce back to the home page where the recent drafts list lives.
      // The list will receive the new doc id and toast when it completes.
      resetWizard()
      setMode('home')
      // Defer trackJob/refresh until the list mounts on the next paint.
      setTimeout(() => {
        recentDraftsRef.current?.trackJob(newDocId, label)
        recentDraftsRef.current?.refresh()
      }, 0)
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
    setIsEditingPreview(false)
    setPreviewDirty(false)
    setInlinePreview({ docId, title: 'Loading…', status: 'pending', contentHtml: '' })
    try {
      const doc = await getDocument(docId)
      const js = (doc.jobStatus ?? '').toString().toUpperCase()
      const status: InlinePreview['status'] =
        js === 'COMPLETED' ? 'completed' :
        js === 'FAILED' ? 'failed' : 'pending'
      let contentHtml = ''
      if (status === 'completed') {
        try {
          const content = await workspaceApi.fetchDocumentContent({
            id: doc.id,
            signedUrl: doc.signedUrl,
            downloadUrl: doc.downloadUrl,
          })
          contentHtml = renderDraftToHtml(content)
        } catch { /* content unavailable */ }
      }
      setInlinePreview({
        docId,
        title: doc.originalFilename || doc.name || 'Draft',
        status,
        contentHtml,
      })
    } catch {
      setInlinePreview({ docId, title: 'Draft', status: 'failed', contentHtml: '' })
    }
  }, [])

  const handleSavePreview = async () => {
    if (!inlinePreview || !previewEditorRef.current || isSavingPreview) return
    const html = previewEditorRef.current.innerHTML
    setIsSavingPreview(true)
    try {
      await updateDocumentContent(inlinePreview.docId, html)
      setInlinePreview({ ...inlinePreview, contentHtml: html })
      setIsEditingPreview(false)
      setPreviewDirty(false)
      toast({ title: 'Draft saved' })
    } catch {
      toast({ title: "Couldn't save draft", description: 'Please try again.', variant: 'destructive' })
    } finally {
      setIsSavingPreview(false)
    }
  }

  const handleBackToList = () => {
    setInlinePreview(null)
    setIsEditingPreview(false)
    setPreviewDirty(false)
    setMode('home')
  }

  const handleRetryFromFailed = () => {
    setInlinePreview(null)
    setIsEditingPreview(false)
    setPreviewDirty(false)
    setMode('list')
  }

  // ── Render ──

  // ═══ Inline preview ═══
  if (mode === 'inline-preview' && inlinePreview) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleBackToList}
            className="flex items-center gap-1.5 text-sm text-ledger-gray-500 hover:text-kx-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to drafts
          </button>
          <div className="h-4 w-px bg-ledger-gray-200" />
          <h1 className="text-base font-semibold text-kx-primary-900 truncate">{inlinePreview.title}</h1>
        </div>

        {inlinePreview.status === 'completed' && (
          <FormattingToolbar
            isEditing={isEditingPreview}
            onEdit={() => setIsEditingPreview(true)}
            onSave={handleSavePreview}
            onCancel={() => { setIsEditingPreview(false); setPreviewDirty(false) }}
            onBold={previewFormatting.handleBold}
            onItalic={previewFormatting.handleItalic}
            onUnderline={previewFormatting.handleUnderline}
            onAlignLeft={previewFormatting.handleAlignLeft}
            onAlignCenter={previewFormatting.handleAlignCenter}
            onAlignRight={previewFormatting.handleAlignRight}
            onBulletList={previewFormatting.handleBulletList}
            onNumberedList={previewFormatting.handleNumberedList}
            onFontSize={previewFormatting.handleFontSize}
            isSaving={isSavingPreview}
            hasChanges={previewDirty}
          />
        )}

        {inlinePreview.status === 'pending' ? (
          <GeneratingState label="Draft" />
        ) : inlinePreview.status === 'failed' ? (
          <div className="flex flex-col flex-1 items-center justify-center gap-4">
            <AlertCircle className="h-10 w-10 text-red-400" />
            <p className="text-sm font-medium text-ledger-gray-700 dark:text-ledger-gray-200">Draft generation failed</p>
            <p className="text-xs text-ledger-gray-400 text-center max-w-xs">Something went wrong with this draft.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBackToList}>
                Back to drafts
              </Button>
              <Button size="sm" onClick={handleRetryFromFailed} className="bg-kx-primary-600 hover:bg-kx-primary-700 text-white">
                Try again
              </Button>
            </div>
          </div>
        ) : isEditingPreview ? (
          <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800">
            <div
              ref={previewEditorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => setPreviewDirty(true)}
              className="legal-document bg-white mx-auto my-4 shadow-sm focus:outline-none ring-2 ring-kx-primary-300"
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
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-ledger-gray-100 dark:bg-ledger-gray-800">
            <div
              className="legal-document bg-white mx-auto my-4 shadow-sm cursor-default"
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
              dangerouslySetInnerHTML={{ __html: inlinePreview.contentHtml }}
            />
          </div>
        )}
      </div>
    )
  }

  // ═══ Details (form) ═══
  if (mode === 'details' && selectedTemplate) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex items-center gap-3 mb-5 flex-shrink-0">
          <button
            type="button"
            onClick={() => { resetWizard(); setMode('list') }}
            className="flex items-center gap-1.5 text-sm text-ledger-gray-500 hover:text-kx-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>
          <div className="h-4 w-px bg-ledger-gray-200" />
          <h1 className="text-lg font-serif font-semibold text-kx-primary-900 dark:text-kx-primary-100">
            {selectedTemplate.name}
          </h1>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-6">
          <div className="max-w-2xl">
            <p className="text-sm text-ledger-gray-500 mb-5">
              Only the title is required. AI will use your documents to fill in missing details.
            </p>

            {/* Case selector + file upload */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
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
                  <FileUploadZone
                    accept=".pdf,.doc,.docx,.txt"
                    multiple
                    onFilesSelected={handleFilesSelected}
                    label="Drop files or click to browse"
                    selectedFiles={refFiles}
                    onRemoveFile={handleRemoveFile}
                  />
                  {isUploadingFiles && (
                    <p className="text-xs text-kx-primary-600 flex items-center gap-1.5">
                      <span className="h-3 w-3 border-2 border-kx-primary-600 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Template fields */}
            <div className="grid grid-cols-2 gap-4">
              {orderedFields.map(field => {
                const isRequired = field.id === 'title'
                const colSpan = field.id === 'title' || field.type === 'textarea' || field.type === 'client-select' ? 'col-span-2' : 'col-span-1'

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

        {/* Footer */}
        <div className="flex items-center justify-end py-4 border-t border-kx-card-border flex-shrink-0">
          <Button
            onClick={handleGenerate}
            disabled={!isGenerateEnabled}
            className="gap-2 rounded-lg px-6 bg-kx-primary-600 hover:bg-kx-primary-700 text-white text-sm"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isSubmitting ? 'Starting…' : 'Generate Draft'}
          </Button>
        </div>

        {/* Upgrade modal */}
        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} onUpgrade={() => navigate('/settings/billing')} />
      </div>
    )
  }

  // ═══ Home splash: choose between predefined / custom + recent drafts ═══
  if (mode === 'home') {
    return (
      <div className="pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900 dark:text-kx-primary-100">Drafts</h2>
            <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400 mt-1">
              Generate legal documents with AI. Start from a built-in template or your own.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mb-10">
          <button
            type="button"
            onClick={() => setMode('list')}
            className="group text-left rounded-xl border border-ledger-gray-200 dark:border-ledger-gray-700 bg-kx-card p-6 shadow-sm hover:shadow-md hover:border-kx-primary-300 dark:hover:border-kx-primary-700 transition-all"
          >
            <div className="h-12 w-12 rounded-lg bg-kx-primary-100 dark:bg-kx-primary-900/40 flex items-center justify-center mb-4 group-hover:bg-kx-primary-200 dark:group-hover:bg-kx-primary-900/60 transition-colors">
              <Sparkles className="h-6 w-6 text-kx-primary-600 dark:text-kx-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-kx-text-primary mb-1">Predefined Templates</h2>
            <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400 mb-4">
              Legal document templates — notices, affidavits, petitions, bail applications, and more.
            </p>
            <span className="text-sm font-medium text-kx-primary-600 dark:text-kx-primary-400 group-hover:underline">
              Get Started &rarr;
            </span>
          </button>
          <div className="relative rounded-xl border border-ledger-gray-200 dark:border-ledger-gray-700 bg-kx-card p-6 shadow-sm opacity-60 cursor-not-allowed">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-ledger-gray-100 dark:bg-ledger-gray-800 px-2.5 py-0.5 text-xs font-medium text-ledger-gray-500 dark:text-ledger-gray-400">
                <Lock className="h-3 w-3" />
                Coming Soon
              </span>
            </div>
            <div className="h-12 w-12 rounded-lg bg-ledger-gray-100 dark:bg-ledger-gray-800 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-ledger-gray-400 dark:text-ledger-gray-500" />
            </div>
            <h2 className="text-lg font-semibold text-kx-text-primary mb-1">Custom Templates</h2>
            <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400">
              Create and save your own templates. Define fields, structure, and reuse across cases.
            </p>
          </div>
        </div>

        {/* Recent drafts */}
        <RecentDraftsList
          ref={recentDraftsRef}
          onOpenDraft={handleOpenDraft}
        />

        <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} onUpgrade={() => navigate('/settings/billing')} />
      </div>
    )
  }

  // ═══ Predefined templates landing: templates grid + recent drafts list ═══
  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <button
            type="button"
            onClick={() => setMode('home')}
            className="flex items-center gap-1.5 text-sm text-ledger-gray-500 hover:text-kx-primary-600 transition-colors mb-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900 dark:text-kx-primary-100">Predefined Templates</h2>
          <p className="text-sm text-ledger-gray-500 dark:text-ledger-gray-400 mt-1">
            Pick a template to generate a new draft.
          </p>
        </div>
      </div>

      {/* Templates */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-kx-text-primary">Templates</h2>
          <div className="relative w-full max-w-xs">
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

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} onUpgrade={() => navigate('/settings/billing')} />
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
