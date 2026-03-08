import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Sparkles, Check, FileWarning, Lightbulb, FileText, FileClock,
  Scale, Gavel, ShieldAlert, ArrowLeft, ArrowRight, ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { DraftTemplate, TemplateFormData, CaseDocument, Client } from '@/types'
import { DRAFT_TEMPLATES } from '@/types'
import type { CreateDraftRequest, DocumentType, Language } from '@/services/api/drafts-api'

// Maps each template to its API document_type and optional subtype
export const TEMPLATE_TO_DOC_CONFIG: Record<string, { documentType: DocumentType; subtype?: string }> = {
  'notice': { documentType: 'legal_notice', subtype: 'demand' },
  'patent': { documentType: 'application' },
  'application-draft': { documentType: 'application', subtype: 'vakalatnama' },
  'interim-application': { documentType: 'affidavit', subtype: 'interim_application' },
  'affidavit': { documentType: 'affidavit', subtype: 'plaint' },
  'bail-application': { documentType: 'bail_application' },
  'criminal-appeal': { documentType: 'criminal_appeal' },
}

// Maps each template to its sub_type for the unified document API
export const TEMPLATE_TO_SUB_TYPE: Record<string, string> = {
  'notice': 'Notice',
  'patent': 'Patent',
  'application-draft': 'Application',
  'interim-application': 'Interim',
  'affidavit': 'Affidavit',
  'bail-application': 'Bail',
  'criminal-appeal': 'CriminalAppeal',
}

// Assembles template form fields into plain-language instructions for the AI
function assembleBody(templateId: string, formData: TemplateFormData): string {
  const get = (key: string): string => (formData[key] as string) || ''
  switch (templateId) {
    case 'notice':
      return `Draft a legal notice to ${get('recipient')}. ${get('body')}`.trim()
    case 'patent':
      return `Draft a patent application for inventor ${get('inventor')}. Description: ${get('description')}`.trim()
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
    default:
      return 'Generate a legal document based on the provided information.'
  }
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileWarning,
  Lightbulb,
  FileText,
  FileClock,
  Scale,
  Gavel,
  ShieldAlert,
}

export interface DraftCreationWizardProps {
  sources: CaseDocument[]
  client: Client | null
  onGenerate: (request: CreateDraftRequest) => void
  onCancel: () => void
}

function formatClientDetails(c: Client): string {
  const parts = [c.name]
  if (c.address) parts.push(c.address)
  if (c.phone) parts.push(c.phone)
  return parts.join(', ')
}

export function DraftCreationWizard({ sources, client, onGenerate, onCancel }: DraftCreationWizardProps) {
  const [step, setStep] = useState<'select' | 'form'>('select')
  const [selectedTemplate, setSelectedTemplate] = useState<DraftTemplate | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [localSourceIds, setLocalSourceIds] = useState<Set<string>>(new Set())
  const [useClientFor, setUseClientFor] = useState<Record<string, boolean>>({})
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)

  // Initialize form when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const initial: TemplateFormData = {}
      const clientDefaults: Record<string, boolean> = {}
      selectedTemplate.fields.forEach((field) => {
        if (field.type === 'sources') {
          initial[field.id] = []
        } else if (field.type === 'client-select' && client) {
          initial[field.id] = formatClientDetails(client)
          clientDefaults[field.id] = true
        } else if (field.type === 'select' && field.options?.length) {
          initial[field.id] = field.options[0].value
        } else {
          initial[field.id] = ''
        }
      })
      setFormData(initial)
      setUseClientFor(clientDefaults)
      setLocalSourceIds(new Set())
    }
  }, [selectedTemplate, client])

  // Close source dropdown when clicking outside
  useEffect(() => {
    if (!sourceDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sourceDropdownOpen])

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSourceToggle = (sourceId: string) => {
    setLocalSourceIds((prev) => {
      const next = new Set(prev)
      if (next.has(sourceId)) {
        next.delete(sourceId)
      } else {
        next.add(sourceId)
      }
      return next
    })
  }

  const titleValue = (formData['title'] as string) || ''
  const isGenerateEnabled = titleValue.trim().length > 0

  const handleGenerate = () => {
    if (!selectedTemplate) return
    const config = TEMPLATE_TO_DOC_CONFIG[selectedTemplate.id] || { documentType: 'legal_notice' as DocumentType }
    const title = titleValue.trim() || selectedTemplate.name
    const body = assembleBody(selectedTemplate.id, formData)
    const hasText = body.length > 0
    const hasFiles = localSourceIds.size > 0
    const language = formData['language'] as Language | undefined
    const isCriminal = selectedTemplate.id === 'bail-application' || selectedTemplate.id === 'criminal-appeal'
    const criminalConfigKeys = [
      'fir_details', 'criminal_history', 'bail_history', 'co_accused_details',
      'impugned_order', 'court_details', 'facts', 'relief_sought',
      'applicant', 'opposite_party', 'appellant', 'respondent',
    ]
    let draftConfig: Record<string, string> | undefined
    if (isCriminal) {
      const entries = criminalConfigKeys
        .filter((key) => {
          const val = formData[key]
          return typeof val === 'string' && val.trim().length > 0
        })
        .map((key) => [key, (formData[key] as string).trim()])
      if (entries.length > 0) {
        draftConfig = Object.fromEntries(entries)
      }
    }
    const request: CreateDraftRequest = {
      title,
      document_type: config.documentType,
      input_mode: hasFiles && !hasText ? 'file' : 'freetext',
      subtype: config.subtype,
      freetext_body: hasText ? body : undefined,
      file_ids: hasFiles ? Array.from(localSourceIds) : undefined,
      language: isCriminal ? language : undefined,
      config: draftConfig,
    }
    onGenerate(request)
  }

  // Reorder fields: title first, then sources, then the rest in original order
  const orderedFields = useMemo(() => {
    if (!selectedTemplate) return []
    const titleField = selectedTemplate.fields.find((f) => f.id === 'title')
    const sourcesField = selectedTemplate.fields.find((f) => f.type === 'sources')
    const otherFields = selectedTemplate.fields.filter((f) => f.id !== 'title' && f.type !== 'sources')
    return [
      ...(titleField ? [titleField] : []),
      ...(sourcesField ? [sourcesField] : []),
      ...otherFields,
    ]
  }, [selectedTemplate])

  // Determine col-span for 2-column grid
  const getColSpan = (field: (typeof orderedFields)[number]): string => {
    if (field.id === 'title') return 'col-span-2'
    if (field.type === 'textarea') return 'col-span-2'
    if (field.type === 'client-select') return 'col-span-2'
    if (field.type === 'sources') return 'col-span-2'
    return 'col-span-1'
  }

  return (
    <div className="flex items-center justify-center h-full bg-ledger-gray-50 dark:bg-ledger-gray-900 p-6">
      <div className="bg-white dark:bg-ledger-gray-800 rounded-2xl shadow-lg border border-ledger-gray-200 dark:border-ledger-gray-700 w-full max-w-3xl max-h-[85vh] flex flex-col">

        {/* Card header — step indicator */}
        <div className="flex-shrink-0 px-8 py-4 border-b border-ledger-gray-200 dark:border-ledger-gray-700">
          <div className="flex items-center gap-3 justify-center">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                step === 'select'
                  ? 'bg-kx-primary-600 text-white'
                  : 'bg-kx-primary-100 text-kx-primary-600'
              )}>
                {step === 'select' ? '1' : <Check className="h-3.5 w-3.5" />}
              </div>
              <span className={cn(
                'text-sm font-medium',
                step === 'select' ? 'text-kx-primary-700' : 'text-ledger-gray-500'
              )}>
                Select Template
              </span>
            </div>
            <div className="h-px w-12 bg-ledger-gray-300" />
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold',
                step === 'form'
                  ? 'bg-kx-primary-600 text-white'
                  : 'bg-ledger-gray-200 text-ledger-gray-500'
              )}>
                2
              </div>
              <span className={cn(
                'text-sm font-medium',
                step === 'form' ? 'text-kx-primary-700' : 'text-ledger-gray-400'
              )}>
                Fill Details
              </span>
            </div>
          </div>
        </div>

        {step === 'select' ? (
          <>
            {/* Card body — template grid */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-8 py-6">
                <p className="text-sm text-ledger-gray-600 dark:text-ledger-gray-400 mb-6">
                  Choose a template to start drafting your document
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {DRAFT_TEMPLATES.map((t) => {
                    const Icon = iconMap[t.icon] || FileText
                    const isSelected = selectedTemplate?.id === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t)}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-xl border text-left transition-all duration-200',
                          'shadow-sm hover:shadow-md hover:scale-[1.02]',
                          isSelected
                            ? 'border-kx-primary-600 bg-kx-primary-50 dark:bg-kx-primary-900 ring-2 ring-kx-primary-500'
                            : 'border-ledger-gray-200 dark:border-ledger-gray-700 bg-ledger-white dark:bg-ledger-gray-800 hover:border-ledger-gray-300 dark:hover:border-ledger-gray-600 hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-700'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          isSelected
                            ? 'bg-kx-primary-600 text-white'
                            : 'bg-ledger-gray-100 dark:bg-ledger-gray-700 text-ledger-gray-600 dark:text-ledger-gray-300'
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="font-medium text-sm text-kx-primary-900 dark:text-kx-primary-100">{t.name}</p>
                          <p className="text-xs text-ledger-gray-500 dark:text-ledger-gray-400 line-clamp-2">{t.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Card footer — step 1 actions */}
            <div className="flex-shrink-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-ledger-gray-200 dark:border-ledger-gray-700">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('form')}
                disabled={!selectedTemplate}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Card body — form fields */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="px-8 py-6">
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-kx-primary-900 dark:text-kx-primary-100">
                    Create {selectedTemplate?.name}
                  </h3>
                  <p className="text-sm text-ledger-gray-500 mt-1">
                    Only the title is required. AI will use your uploaded documents to fill in any missing details.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {orderedFields.map((field) => {
                    const isRequired = field.id === 'title'
                    const colSpan = getColSpan(field)

                    if (field.type === 'sources') {
                      return (
                        <div key={field.id} className={cn('space-y-2', colSpan)} ref={sourceDropdownRef}>
                          <Label>{field.label}</Label>
                          {sources.length === 0 ? (
                            <p className="text-sm text-ledger-gray-500 py-2">
                              No sources available. Add documents to the sources panel.
                            </p>
                          ) : (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setSourceDropdownOpen((open) => !open)}
                                className={cn(
                                  'flex h-10 w-full items-center justify-between rounded border border-ledger-gray-300 dark:border-ledger-gray-600 bg-ledger-white dark:bg-ledger-gray-800 px-3 py-2',
                                  'text-sm font-sans text-kx-primary-900 dark:text-ledger-gray-200',
                                  'focus:outline-none focus:ring-2 focus:ring-kx-primary-500 focus:ring-offset-1',
                                  'hover:border-ledger-gray-400 transition-colors'
                                )}
                              >
                                <span className="truncate">
                                  {localSourceIds.size === 0
                                    ? 'Select documents...'
                                    : `${localSourceIds.size} document${localSourceIds.size !== 1 ? 's' : ''} selected`}
                                </span>
                                <ChevronDown className={cn(
                                  'h-4 w-4 shrink-0 text-ledger-gray-500 transition-transform',
                                  sourceDropdownOpen && 'rotate-180'
                                )} />
                              </button>
                              {sourceDropdownOpen && (
                                <div className="absolute z-10 mt-1 w-full rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-ledger-white dark:bg-ledger-gray-800 shadow-lg max-h-48 overflow-y-auto">
                                  <div className="divide-y divide-ledger-gray-100 dark:divide-ledger-gray-700 py-1">
                                    {sources.map((source) => (
                                      <label
                                        key={source.id}
                                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-ledger-gray-50 dark:hover:bg-ledger-gray-700"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => handleSourceToggle(source.id)}
                                          className={cn(
                                            'h-4 w-4 shrink-0 rounded border flex items-center justify-center',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kx-primary-500 focus-visible:ring-offset-2',
                                            localSourceIds.has(source.id)
                                              ? 'bg-kx-primary-600 border-kx-primary-600 text-ledger-white'
                                              : 'border-ledger-gray-300 dark:border-ledger-gray-500 bg-ledger-white dark:bg-ledger-gray-700'
                                          )}
                                        >
                                          {localSourceIds.has(source.id) && <Check className="h-3 w-3" />}
                                        </button>
                                        <span className="text-sm text-kx-primary-900 dark:text-ledger-gray-200 truncate">
                                          {source.name}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    }

                    if (field.type === 'client-select') {
                      const isUsingClient = useClientFor[field.id] ?? false
                      return (
                        <div key={field.id} className={cn('space-y-2', colSpan)}>
                          <Label htmlFor={field.id}>
                            {field.label}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {client ? (
                            <div className="space-y-2">
                              <div className="flex flex-col gap-1.5">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`client-select-${field.id}`}
                                    checked={isUsingClient}
                                    onChange={() => {
                                      setUseClientFor((prev) => ({ ...prev, [field.id]: true }))
                                      handleFieldChange(field.id, formatClientDetails(client))
                                    }}
                                    className="h-3.5 w-3.5 text-kx-primary-600 focus:ring-kx-primary-500"
                                  />
                                  <span className="text-sm text-kx-primary-900 dark:text-ledger-gray-200">
                                    Use client: <span className="font-medium">{client.name}</span>
                                  </span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`client-select-${field.id}`}
                                    checked={!isUsingClient}
                                    onChange={() => {
                                      setUseClientFor((prev) => ({ ...prev, [field.id]: false }))
                                      handleFieldChange(field.id, '')
                                    }}
                                    className="h-3.5 w-3.5 text-kx-primary-600 focus:ring-kx-primary-500"
                                  />
                                  <span className="text-sm text-kx-primary-900 dark:text-ledger-gray-200">Enter manually</span>
                                </label>
                              </div>
                              {isUsingClient ? (
                                <div className="rounded-lg border border-ledger-gray-200 dark:border-ledger-gray-600 bg-ledger-gray-50 dark:bg-ledger-gray-800 px-3 py-2 text-sm text-kx-primary-800 dark:text-ledger-gray-200">
                                  {formatClientDetails(client)}
                                </div>
                              ) : (
                                <Textarea
                                  id={field.id}
                                  value={(formData[field.id] as string) || ''}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  placeholder="AI will extract from documents if left blank"
                                  className="min-h-[100px] resize-none"
                                />
                              )}
                            </div>
                          ) : (
                            <Textarea
                              id={field.id}
                              value={(formData[field.id] as string) || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder="AI will extract from documents if left blank"
                              className="min-h-[100px] resize-none"
                            />
                          )}
                        </div>
                      )
                    }

                    if (field.type === 'select') {
                      return (
                        <div key={field.id} className={cn('space-y-2', colSpan)}>
                          <Label htmlFor={field.id}>
                            {field.label}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <select
                            id={field.id}
                            value={(formData[field.id] as string) || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className={cn(
                              'flex h-10 w-full rounded border border-ledger-gray-300 dark:border-ledger-gray-600 bg-ledger-white dark:bg-ledger-gray-800 px-3 py-2',
                              'text-sm font-sans text-kx-primary-900 dark:text-ledger-gray-200',
                              'focus:outline-none focus:ring-2 focus:ring-kx-primary-500 focus:ring-offset-1',
                            )}
                          >
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )
                    }

                    if (field.type === 'textarea') {
                      return (
                        <div key={field.id} className={cn('space-y-2', colSpan)}>
                          <Label htmlFor={field.id}>
                            {field.label}
                            {isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <Textarea
                            id={field.id}
                            value={(formData[field.id] as string) || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder="AI will extract from documents if left blank"
                            className="min-h-[100px] resize-none"
                          />
                        </div>
                      )
                    }

                    // Default: text input
                    return (
                      <div key={field.id} className={cn('space-y-2', colSpan)}>
                        <Label htmlFor={field.id}>
                          {field.label}
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                          id={field.id}
                          value={(formData[field.id] as string) || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Card footer — step 2 actions */}
            <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-ledger-gray-200 dark:border-ledger-gray-700">
              <Button variant="outline" onClick={() => setStep('select')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!isGenerateEnabled}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Draft
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
