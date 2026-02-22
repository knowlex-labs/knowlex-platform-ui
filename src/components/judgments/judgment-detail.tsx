import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Calendar, Users, Building2, Gavel, FileText, FolderPlus, Check, Loader2 } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useJudgmentDetail } from '@/hooks/use-judgment-detail'
import { caseApi } from '@/services/api/case-api'
import { cn } from '@/lib/utils'
import type { BackendCase } from '@/types'
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

    const goBack = () => navigate('/judgments')

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

                    <AddToWorkspace judgmentId={judgmentId!} />
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
