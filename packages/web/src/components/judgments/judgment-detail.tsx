import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Calendar, Users, Building2, Gavel, FileText, FolderPlus, Check, Loader2, BookOpen, FileDown } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useJudgmentDetail } from '@/hooks/use-judgment-detail'
import { caseApi } from '@knowlex/core/api/case-api'
import { judgmentsApi } from '@knowlex/core/api/judgments-api'
import { cn } from '@/lib/utils'
import type { BackendCase } from '@knowlex/core/types'
import { formatJudgmentDate, getDisposalColor } from './judgment-utils'

// --- AddToWorkspace ---

function AddToWorkspace({ judgmentId }: { judgmentId: string }) {
    const [open, setOpen] = useState(false)
    const [cases, setCases] = useState<BackendCase[]>([])
    const [isLoadingCases, setIsLoadingCases] = useState(false)
    const [selectedCase, setSelectedCase] = useState<BackendCase | null>(null)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const fetchCases = useCallback(async () => {
        setIsLoadingCases(true)
        try {
            const response = await caseApi.getAll({ size: 100 })
            setCases(response.data.content)
        } catch {
            setCases([])
        } finally {
            setIsLoadingCases(false)
        }
    }, [])

    // Reset state and fetch cases when dropdown opens
    useEffect(() => {
        if (open) {
            setSelectedCase(null)
            setConfirmOpen(false)
            setResult(null)
            fetchCases()
        }
    }, [open, fetchCases])

    // Close on outside click
    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
                setSelectedCase(null)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    // Close on Escape
    useEffect(() => {
        if (!open) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (confirmOpen) {
                    setConfirmOpen(false)
                } else {
                    setOpen(false)
                    setSelectedCase(null)
                }
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, confirmOpen])

    const handleSelectCase = (c: BackendCase) => {
        setSelectedCase(c)
        setConfirmOpen(true)
    }

    const handleConfirm = async () => {
        if (!selectedCase) return
        setIsAdding(true)
        try {
            await caseApi.addJudgment(selectedCase.id, judgmentId)
            setResult({ success: true, message: `Added to "${selectedCase.caseTitle || selectedCase.caseNumber}"` })
            setConfirmOpen(false)
            setSelectedCase(null)
            // Auto-close after success
            setTimeout(() => setOpen(false), 1500)
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add judgment'
            setResult({ success: false, message })
            setConfirmOpen(false)
        } finally {
            setIsAdding(false)
        }
    }

    const handleCancel = () => {
        setConfirmOpen(false)
        setSelectedCase(null)
    }

    const caseLabel = (c: BackendCase) =>
        c.caseTitle || c.caseNumber || c.id.slice(0, 8)

    return (
        <div ref={containerRef} className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(!open)}
                className="gap-2"
            >
                <FolderPlus className="h-3.5 w-3.5" />
                Add to Workspace
            </Button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-lg border border-ledger-gray-200 bg-ledger-white shadow-lg animate-in fade-in-0 zoom-in-95 duration-100">
                    {/* Result message */}
                    {result && (
                        <div className={cn(
                            'px-4 py-3 text-sm flex items-center gap-2',
                            result.success
                                ? 'bg-green-50 text-green-700 border-b border-green-100'
                                : 'bg-red-50 text-red-700 border-b border-red-100'
                        )}>
                            {result.success && <Check className="h-4 w-4" />}
                            {result.message}
                        </div>
                    )}

                    {/* Confirmation dialog */}
                    {confirmOpen && selectedCase ? (
                        <div className="p-4 space-y-3">
                            <p className="text-sm text-kx-text-primary">
                                Add this judgment to <span className="font-semibold">{caseLabel(selectedCase)}</span>?
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleConfirm}
                                    disabled={isAdding}
                                    className="flex-1 gap-1.5"
                                >
                                    {isAdding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                    Confirm
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancel}
                                    disabled={isAdding}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-ledger-gray-100">
                                <p className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wide">Select a workspace</p>
                            </div>

                            {/* Case list */}
                            <div className="max-h-60 overflow-y-auto py-1">
                                {isLoadingCases ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin text-ledger-gray-400" />
                                    </div>
                                ) : cases.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-ledger-gray-400">
                                        No workspaces found
                                    </div>
                                ) : (
                                    cases.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => handleSelectCase(c)}
                                            className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ledger-gray-50"
                                        >
                                            <FolderPlus className="h-4 w-4 text-ledger-gray-400 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-kx-text-primary truncate">
                                                    {caseLabel(c)}
                                                </p>
                                                {c.courtName && (
                                                    <p className="text-xs text-ledger-gray-500 truncate">{c.courtName}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

// --- JudgmentDetail ---

export function JudgmentDetail() {
    const { judgmentId } = useParams<{ judgmentId: string }>()
    const navigate = useNavigate()
    const { judgment, pdfUrl, isLoading, isPdfLoading, error, refresh } = useJudgmentDetail(judgmentId ?? null)

    const [summaryText, setSummaryText] = useState<string | null>(null)
    const [isSummaryLoading, setIsSummaryLoading] = useState(false)
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
    const [summaryError, setSummaryError] = useState<string | null>(null)
    const summaryContentRef = useRef<HTMLDivElement>(null)

    // Pre-load summary text from DB without auto-opening the dialog
    useEffect(() => {
        if (judgment?.summary) {
            setSummaryText(judgment.summary)
        }
    }, [judgment?.summary])

    const handleGetSummary = async () => {
        if (summaryText) {
            setSummaryDialogOpen(true)
            return
        }
        setIsSummaryLoading(true)
        setSummaryError(null)
        try {
            const text = await judgmentsApi.generateSummary(judgmentId!)
            setSummaryText(text)
            setSummaryDialogOpen(true)
        } catch {
            setSummaryError('Failed to generate summary. Please try again.')
            setSummaryDialogOpen(true)
        } finally {
            setIsSummaryLoading(false)
        }
    }

    const handleDownloadPdf = async () => {
        const { default: jsPDF } = await import('jspdf')
        const caseName = judgment ? `${judgment.petitioner} v. ${judgment.respondent}` : 'Judgment Summary'
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pageW = doc.internal.pageSize.getWidth()
        const margin = 18
        const maxW = pageW - margin * 2
        let y = margin

        const addPage = () => { doc.addPage(); y = margin }
        const checkPage = (needed: number) => { if (y + needed > 278) addPage() }

        // Case title header
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        const titleLines = doc.splitTextToSize(caseName, maxW)
        checkPage(titleLines.length * 6 + 6)
        doc.text(titleLines, margin, y)
        y += titleLines.length * 6 + 2
        doc.setDrawColor(180, 180, 180)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageW - margin, y)
        y += 6

        // Parse markdown lines
        const lines = (summaryText || '').split('\n')
        for (const rawLine of lines) {
            const line = rawLine.trimEnd()

            if (line === '---') {
                checkPage(6)
                doc.setDrawColor(200, 200, 200)
                doc.setLineWidth(0.2)
                doc.line(margin, y, pageW - margin, y)
                y += 5
                continue
            }

            // Strip inline bold markers for display
            const stripped = line.replace(/\*\*/g, '').trim()
            if (!stripped) { y += 3; continue }

            // Full-line bold heading (e.g. **1. PARTIES**)
            const isFullBold = /^\*\*[^*]+\*\*$/.test(line.trim()) || /^\d+\.\s/.test(line.trim())
            const isBullet = /^[-•]\s/.test(stripped) || /^\s{2,}[-•]\s/.test(line)
            const isSubBullet = /^\s{4,}[-•]\s/.test(line)

            if (isFullBold && !isBullet) {
                doc.setFont('helvetica', 'bold')
                doc.setFontSize(10.5)
                const wrapped = doc.splitTextToSize(stripped, maxW)
                checkPage(wrapped.length * 5.5 + 4)
                y += 2
                doc.text(wrapped, margin, y)
                y += wrapped.length * 5.5 + 2
            } else if (isSubBullet) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(9.5)
                const text = stripped.replace(/^[-•]\s/, '')
                const wrapped = doc.splitTextToSize(`◦ ${text}`, maxW - 12)
                checkPage(wrapped.length * 4.8 + 1)
                doc.text(wrapped, margin + 10, y)
                y += wrapped.length * 4.8 + 1
            } else if (isBullet) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(9.5)
                const text = stripped.replace(/^[-•]\s/, '')
                const wrapped = doc.splitTextToSize(`• ${text}`, maxW - 6)
                checkPage(wrapped.length * 4.8 + 1)
                doc.text(wrapped, margin + 4, y)
                y += wrapped.length * 4.8 + 1
            } else {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(9.5)
                const wrapped = doc.splitTextToSize(stripped, maxW)
                checkPage(wrapped.length * 4.8 + 1)
                doc.text(wrapped, margin, y)
                y += wrapped.length * 4.8 + 1
            }
        }

        doc.save(`${caseName.replace(/[^\w\s]/g, '').trim().slice(0, 60)}-summary.pdf`)
    }

    const handleDownloadWord = () => {
        const inner = summaryContentRef.current?.innerHTML || ''
        const caseName = judgment ? `${judgment.petitioner} v. ${judgment.respondent}` : 'Judgment Summary'
        const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${caseName}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
<style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;color:#1a1a2e}
h1{font-size:16pt;border-bottom:1px solid #ccc;padding-bottom:6pt}
h2{font-size:13pt;margin-top:18pt}h3{font-size:11pt}
strong{font-weight:bold}hr{border-top:1px solid #ddd}
ul,ol{margin-left:20pt}li{margin:3pt 0}p{margin:6pt 0}</style>
</head><body><h1>${caseName}</h1>${inner}</body></html>`
        const blob = new Blob(['﻿', html], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${caseName.replace(/[^\w\s]/g, '').trim().slice(0, 60)}-summary.doc`
        a.click()
        URL.revokeObjectURL(url)
    }

    const goBack = () => navigate(-1)

    if (isLoading) {
        return (
            <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-16px)]">
                <div className="px-6 py-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        className="gap-2 text-ledger-gray-600 hover:text-kx-primary-700 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Judgments
                    </Button>
                </div>
                <div className="flex-1 px-6 py-4">
                    <JudgmentDetailSkeleton />
                </div>
            </div>
        )
    }

    if (error || !judgment) {
        return (
            <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-16px)]">
                <div className="px-6 py-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        className="gap-2 text-ledger-gray-600 hover:text-kx-primary-700 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Judgments
                    </Button>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-3">
                        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto">
                            <Gavel className="h-7 w-7 text-red-400" />
                        </div>
                        <h3 className="text-lg font-serif font-semibold text-kx-text-primary">
                            {error || 'Judgment not found'}
                        </h3>
                        <Button variant="outline" size="sm" onClick={refresh}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const decisionDate = formatJudgmentDate(judgment.decisionDate)

    return (
        <>
        <div className="flex flex-col h-[calc(100vh-56px)] md:h-[calc(100vh-16px)] overflow-y-auto">
            {/* Top bar */}
            <div className="px-6 py-4 border-b border-kx-card-border bg-kx-card sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goBack}
                        className="gap-2 text-ledger-gray-600 hover:text-kx-primary-700 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Judgments
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGetSummary}
                            disabled={isSummaryLoading}
                            className="gap-2"
                        >
                            {isSummaryLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <BookOpen className="h-3.5 w-3.5" />
                            )}
                            {isSummaryLoading ? 'Generating...' : summaryText ? 'View Summary' : 'Get Summary'}
                        </Button>
                        <AddToWorkspace judgmentId={judgmentId!} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6 space-y-6 max-w-5xl">
                {/* Header */}
                <div className="space-y-3">
                    <h1 className="text-2xl font-serif font-semibold text-kx-text-primary leading-snug">
                        {judgment.petitioner}
                        <span className="text-ledger-gray-400 font-normal mx-2">v.</span>
                        {judgment.respondent}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-kx-primary-600 bg-kx-primary-50 dark:bg-kx-primary-100 px-3 py-1.5 rounded-md">
                            <FileText className="h-3.5 w-3.5" />
                            {judgment.citation}
                        </span>
                        {judgment.disposalNature && (
                            <span className={cn(
                                'inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full',
                                getDisposalColor(judgment.disposalNature)
                            )}>
                                {judgment.disposalNature}
                            </span>
                        )}
                    </div>
                </div>

                <Separator />

                {/* Metadata grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetadataCard
                        icon={<Building2 className="h-4 w-4" />}
                        label="Court"
                        value={judgment.court}
                    />
                    <MetadataCard
                        icon={<Calendar className="h-4 w-4" />}
                        label="Decision Date"
                        value={decisionDate}
                    />
                    <MetadataCard
                        icon={<Users className="h-4 w-4" />}
                        label="Judge(s)"
                        value={judgment.judges?.join(', ') || '—'}
                    />
                    <MetadataCard
                        icon={<Gavel className="h-4 w-4" />}
                        label="Verdict"
                        value={judgment.disposalNature || '—'}
                    />
                </div>

                <Separator />

                {/* Parties */}
                <div className="space-y-3">
                    <h4 className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wider">Parties</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-ledger-gray-50 dark:bg-ledger-gray-100 rounded-lg border border-kx-card-border">
                            <p className="text-[10px] font-medium text-ledger-gray-500 uppercase tracking-wider mb-1">Petitioner</p>
                            <p className="text-sm font-medium text-kx-text-primary">{judgment.petitioner}</p>
                        </div>
                        <div className="p-4 bg-ledger-gray-50 dark:bg-ledger-gray-100 rounded-lg border border-kx-card-border">
                            <p className="text-[10px] font-medium text-ledger-gray-500 uppercase tracking-wider mb-1">Respondent</p>
                            <p className="text-sm font-medium text-kx-text-primary">{judgment.respondent}</p>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {judgment.description && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wider">Description</h4>
                            <p className="text-sm text-kx-text-primary leading-relaxed">
                                {judgment.description}
                            </p>
                        </div>
                    </>
                )}

                {/* PDF Viewer */}
                {judgment.s3PdfKey && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <h4 className="text-xs font-medium text-ledger-gray-500 uppercase tracking-wider">Document</h4>
                            {isPdfLoading ? (
                                <div className="w-full h-[60vh] bg-ledger-gray-50 dark:bg-ledger-gray-100 rounded-lg border border-kx-card-border animate-pulse flex items-center justify-center">
                                    <p className="text-sm text-ledger-gray-400">Loading PDF...</p>
                                </div>
                            ) : pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-[60vh] rounded-lg border border-kx-card-border"
                                    title="Judgment PDF"
                                />
                            ) : (
                                <div className="w-full py-12 bg-ledger-gray-50 dark:bg-ledger-gray-100 rounded-lg border border-kx-card-border flex flex-col items-center justify-center gap-2">
                                    <FileText className="h-8 w-8 text-ledger-gray-300" />
                                    <p className="text-sm text-ledger-gray-400">PDF could not be loaded</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* Summary Dialog */}
        <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
            <DialogContent className="max-w-4xl w-[92vw] h-[88vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Dialog header */}
                <div className="flex items-start justify-between pl-6 pr-14 py-4 border-b border-kx-card-border flex-shrink-0">
                    <div className="min-w-0 pr-4">
                        <DialogTitle className="text-base">AI Legal Summary</DialogTitle>
                        <p className="text-sm text-ledger-gray-500 mt-0.5 truncate">
                            {judgment.petitioner} v. {judgment.respondent}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {summaryText && (
                            <>
                                <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-1.5 h-8 px-3 text-xs">
                                    <FileDown className="h-3 w-3" />
                                    PDF
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDownloadWord} className="gap-1.5 h-8 px-3 text-xs">
                                    <FileDown className="h-3 w-3" />
                                    Word
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    {summaryError ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <p className="text-sm text-red-500">{summaryError}</p>
                            <Button variant="outline" size="sm" onClick={() => {
                                setSummaryDialogOpen(false)
                                setSummaryError(null)
                            }}>
                                Close
                            </Button>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-8 py-8">
                            <div ref={summaryContentRef} className="text-sm text-kx-primary-900 leading-relaxed font-sans">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 font-serif text-kx-primary-900">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-base font-semibold mt-6 mb-2 font-serif text-kx-primary-900">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-1 text-kx-primary-900">{children}</h3>,
                                        p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
                                        ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-0.5">{children}</ul>,
                                        ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
                                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                        hr: () => <hr className="my-4 border-ledger-gray-200" />,
                                    }}
                                >
                                    {summaryText!}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}

function MetadataCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 p-3 bg-kx-card border border-kx-card-border rounded-lg">
            <div className="h-8 w-8 rounded-md bg-ledger-gray-100 dark:bg-ledger-gray-200 flex items-center justify-center flex-shrink-0 text-ledger-gray-500">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-medium text-ledger-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-medium text-kx-text-primary truncate">{value}</p>
            </div>
        </div>
    )
}

function JudgmentDetailSkeleton() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div className="space-y-3">
                <div className="h-8 w-96 bg-ledger-gray-100 rounded animate-pulse" />
                <div className="flex gap-3">
                    <div className="h-8 w-40 bg-ledger-gray-100 rounded animate-pulse" />
                    <div className="h-8 w-24 bg-ledger-gray-100 rounded-full animate-pulse" />
                </div>
            </div>
            <div className="h-px bg-kx-card-border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-ledger-gray-100 rounded-lg animate-pulse" />
                ))}
            </div>
            <div className="h-px bg-kx-card-border" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-20 bg-ledger-gray-100 rounded-lg animate-pulse" />
                <div className="h-20 bg-ledger-gray-100 rounded-lg animate-pulse" />
            </div>
        </div>
    )
}
