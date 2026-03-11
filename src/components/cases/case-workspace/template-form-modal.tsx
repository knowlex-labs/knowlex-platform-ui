import { useState, useEffect, useMemo, useRef } from 'react'
import { Loader2, Sparkles, Check, FileWarning, Lightbulb, FileText, FileClock, Scale, Gavel, ShieldAlert, ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { DraftTemplate, TemplateFormData, CaseDocument, Client } from '@/types'

interface TemplateFormModalProps {
  template: DraftTemplate | null
  isOpen: boolean
  sources: CaseDocument[]
  isGenerating: boolean
  client?: Client | null
  leftPanelOpen?: boolean
  rightPanelOpen?: boolean
  onClose: () => void
  onGenerate: (templateId: string, formData: TemplateFormData, sourceIds: string[]) => Promise<void>
  onTemplateChange?: (template: DraftTemplate) => void
  templates?: DraftTemplate[]
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

export function TemplateFormModal({
  template,
  isOpen,
  sources,
  isGenerating,
  client,
  leftPanelOpen = true,
  rightPanelOpen = true,
  onClose,
  onGenerate,
  onTemplateChange,
  templates,
}: TemplateFormModalProps) {
  const [step, setStep] = useState<'select' | 'form'>('select')
  const [formData, setFormData] = useState<TemplateFormData>({})
  const [localSourceIds, setLocalSourceIds] = useState<Set<string>>(new Set())
  // Track which client-select fields are using the client vs manual entry
  const [useClientFor, setUseClientFor] = useState<Record<string, boolean>>({})
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false)
  const sourceDropdownRef = useRef<HTMLDivElement>(null)

  // Reset step when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select')
    }
  }, [isOpen])

  // Format client data into a single string
  const formatClientDetails = (c: Client): string => {
    const parts = [c.name]
    if (c.address) parts.push(c.address)
    if (c.phone) parts.push(c.phone)
    return parts.join(', ')
  }

  // Initialize form when template changes (default: no sources selected)
  useEffect(() => {
    if (template) {
      const initial: TemplateFormData = {}
      const clientDefaults: Record<string, boolean> = {}
      template.fields.forEach((field) => {
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
  }, [template, client])

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

  const handleTemplateSelect = (t: DraftTemplate) => {
    onTemplateChange?.(t)
  }

  const handleNext = () => {
    if (template) {
      setStep('form')
    }
  }

  const handleBack = () => {
    setStep('select')
  }

  const handleGenerate = async () => {
    if (!template) return
    await onGenerate(template.id, formData, Array.from(localSourceIds))
  }

  const handleClose = () => {
    setStep('select')
    onClose()
  }

  const isValid = useMemo(() => {
    if (!template) return false
    return template.fields
      .filter((f) => f.required && f.type !== 'sources')
      .every((f) => {
        // client-select fields using client are always valid
        if (f.type === 'client-select' && useClientFor[f.id] && client) return true
        const value = formData[f.id]
        return typeof value === 'string' && value.trim().length > 0
      })
  }, [template, formData, useClientFor, client])

  // Center modal on the workspace content area (between side panels)
  const navWidth = 64 // collapsed sidebar w-16
  const leftOffset = leftPanelOpen ? 288 : 0 // w-72
  const rightOffset = rightPanelOpen ? 384 : 0 // w-96
  const centerLeft = `calc(${navWidth + leftOffset}px + (100vw - ${navWidth + leftOffset + rightOffset}px) / 2)`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ left: centerLeft }}
      >
        {step === 'select' ? (
          <>
            {/* Step 1: Template Selection */}
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Select Template</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0 pr-4">
              <p className="text-sm text-ledger-gray-600 dark:text-ledger-gray-400 mb-5">
                Choose a template to start drafting your document
              </p>
              <div className="grid grid-cols-2 gap-3">
                {templates?.map((t) => {
                  const Icon = iconMap[t.icon] || FileText
                  const isSelected = template?.id === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplateSelect(t)}
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
            </ScrollArea>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!template}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Step 2: Form */}
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="h-8 w-8 p-0"
                  disabled={isGenerating}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Create {template?.name}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto pr-4">
              <div className="space-y-5 py-3">
                {template?.fields.map((field) => {
                  if (field.type === 'sources') {
                    return (
                      <div key={field.id} className="space-y-2" ref={sourceDropdownRef}>
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
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 shrink-0 text-ledger-gray-500 transition-transform',
                                  sourceDropdownOpen && 'rotate-180'
                                )}
                              />
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
                                        {localSourceIds.has(source.id) && (
                                          <Check className="h-3 w-3" />
                                        )}
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
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
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
                                placeholder={field.placeholder}
                                className="min-h-[100px] resize-none"
                              />
                            )}
                          </div>
                        ) : (
                          <Textarea
                            id={field.id}
                            value={(formData[field.id] as string) || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="min-h-[100px] resize-none"
                          />
                        )}
                      </div>
                    )
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
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
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Textarea
                          id={field.id}
                          value={(formData[field.id] as string) || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="min-h-[100px] resize-none"
                        />
                      </div>
                    )
                  }

                  return (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
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

            <DialogFooter className="flex-shrink-0 gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleBack} disabled={isGenerating}>
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!isValid || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Draft
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
