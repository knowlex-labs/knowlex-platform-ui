import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { Citation, DocumentCitation } from '@/types'
import { FileText } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function CitationExcerptBody({ citation }: { citation: DocumentCitation }) {
  return (
    <div className="space-y-2 border-b border-zinc-600/50 pb-2 last:border-0 last:pb-0">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Source D{citation.id}</span>
      <p className="text-xs text-zinc-100 leading-relaxed whitespace-pre-wrap">{citation.text_preview}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-400">
        {citation.page != null && <span>Page {citation.page}</span>}
        <span>Relevance {(citation.score * 100).toFixed(0)}%</span>
        {citation.file_id ? <span className="font-mono truncate max-w-[200px]" title={citation.file_id}>File {citation.file_id.slice(0, 8)}…</span> : null}
      </div>
      {citation.key_terms && citation.key_terms.length > 0 && (
        <p className="text-[10px] text-zinc-500">Keywords: {citation.key_terms.slice(0, 5).join(', ')}</p>
      )}
    </div>
  )
}

interface DocumentCitationChipProps {
  citations: DocumentCitation[]
  label: React.ReactNode
}

/** Inline chip: hover tooltip (desktop) + click/tap popover (mobile / primary detail). */
const DocumentCitationChip = ({ citations, label }: DocumentCitationChipProps) => {
  if (citations.length === 0) return <>{label}</>
  const preview = citations.map((c) => c.text_preview).join(' ').slice(0, 120)

  return (
    <span className="relative inline align-baseline group/cite">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            title={preview + (preview.length >= 120 ? '…' : '')}
            className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer align-baseline border-0"
          >
            {label}
            <FileText className="w-3 h-3 shrink-0 opacity-80" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="max-w-sm w-[min(100vw-2rem,22rem)] bg-zinc-900 text-zinc-100 border-zinc-700 p-3"
        >
          <p className="text-[10px] font-semibold text-zinc-400 mb-2">
            Indexed document{citations.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-3 max-h-[min(60vh,320px)] overflow-y-auto">
            {citations.map((c) => (
              <CitationExcerptBody key={c.id} citation={c} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {/* Hover tooltip for quick peek (does not block popover) */}
      <span className="hidden sm:block pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[280px] rounded-lg bg-zinc-800 px-2.5 py-1.5 text-[10px] text-zinc-200 shadow-lg opacity-0 group-hover/cite:opacity-100 transition-opacity z-40">
        <span className="line-clamp-4 whitespace-pre-wrap">{citations[0].text_preview}</span>
        {citations.length > 1 && (
          <span className="block mt-1 text-zinc-500">+{citations.length - 1} more — click to expand</span>
        )}
      </span>
    </span>
  )
}

interface MarkdownRendererProps {
  content: string
  className?: string
  citations?: Citation[]
  documentCitations?: DocumentCitation[]
}

/**
 * Auto-close unclosed code fences so streaming content
 * doesn't swallow everything after an opening ```.
 */
function prepareStreamingContent(content: string): string {
  const fences = content.match(/^```/gm)
  if (fences && fences.length % 2 !== 0) {
    return content + '\n```'
  }
  return content
}

function citationIdsExist(documentCitations: DocumentCitation[], ids: number[]): boolean {
  return ids.length > 0 && ids.every((id) => documentCitations.some((c) => c.id === id))
}

/**
 * Turn [D1], [D4], and [D1, D4, D7] into markdown links. Hrefs use chunk ids from the backend
 * (same as [Dn] in the model output), not array indices.
 */
function enrichContentWithCitations(content: string, documentCitations?: DocumentCitation[]): string {
  if (!documentCitations?.length) return content

  let enriched = content

  // [D1, D4, D7] — multiple refs in one bracket (must run before single-[D1] replacement)
  enriched = enriched.replace(/\[(D\d+(?:\s*,\s*D\d+)+)\]/g, (match, inner: string) => {
    const ids = Array.from(inner.matchAll(/D(\d+)/g), (m) => parseInt(m[1], 10))
    if (!citationIdsExist(documentCitations, ids)) return match
    return `[${inner}](document-citation:${ids.join(',')})`
  })

  // [D1]
  enriched = enriched.replace(/\[(D\d+)\]/g, (match, inner: string) => {
    const id = parseInt(inner.replace(/^D/, ''), 10)
    if (Number.isNaN(id) || !citationIdsExist(documentCitations, [id])) return match
    return `[${inner}](document-citation:${id})`
  })

  return enriched
}

function buildComponents(citations?: Citation[], documentCitations?: DocumentCitation[]): Components {
  return {
  h1: ({ children }) => <h1 className="text-lg font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold">{children}</h4>,
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="pl-5 space-y-1 list-disc">{children}</ul>,
  ol: ({ children }) => <ol className="pl-5 space-y-1 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-ledger-gray-300 pl-3 text-ledger-gray-600 italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    if (href?.startsWith('document-citation:') && documentCitations) {
      const ids = href
        .slice('document-citation:'.length)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
      const resolved = ids
        .map((id) => documentCitations.find((c) => c.id === id))
        .filter((c): c is DocumentCitation => c != null)
      if (!resolved.length) return <>{children}</>
      return <DocumentCitationChip citations={resolved} label={children} />
    }
    if (href?.startsWith('citation:') && citations) {
      const indices = href.replace('citation:', '').split(',').map(Number)
      const first = citations[indices[0]]
      if (!first) return <>{children}</>
      let domain = ''
      try { domain = new URL(first.url).hostname.replace(/^www\./, '') } catch { domain = first.source || first.url }
      const extra = indices.length - 1
      const tooltipName = first.case_name && !first.case_name.startsWith('http') ? first.case_name : domain
      const tooltipSource = first.source || domain
      return (
        <span className="relative inline group/cite">
          <a
            href={first.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 mx-0.5 text-[11px] font-medium bg-zinc-700/60 text-zinc-300 hover:bg-zinc-600/80 transition-colors align-baseline cursor-pointer no-underline"
          >
            {domain}{extra > 0 ? ` +${extra}` : ''}
          </a>
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[260px] rounded-lg bg-zinc-800 px-3 py-2 text-[11px] text-zinc-200 shadow-lg opacity-0 group-hover/cite:opacity-100 transition-opacity z-50">
            <span className="block font-semibold leading-tight truncate">{tooltipName}</span>
            <span className="block text-zinc-400 mt-0.5 truncate">{tooltipSource}</span>
          </span>
        </span>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-kx-primary-600 dark:text-kx-primary-400 underline underline-offset-2 hover:text-kx-primary-700 dark:hover:text-kx-primary-300"
      >
        {children}
      </a>
    )
  },
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="border border-ledger-gray-200 bg-ledger-gray-50 px-3 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-ledger-gray-200 px-3 py-1.5">{children}</td>
  ),
  hr: () => <hr className="border-ledger-gray-200" />,
  // Unwrap <pre> so the code component handles both block and inline
  pre: ({ children }) => <>{children}</>,
  code({ className, children }) {
    const language = /language-(\w+)/.exec(className || '')?.[1]
    // Block code: has a language class or content ends with newline (react-markdown convention)
    const isBlock = !!language || String(children).endsWith('\n')

    if (isBlock) {
      return (
        <div className="rounded-lg border border-ledger-gray-200 overflow-hidden">
          {language && (
            <div className="px-3 py-1.5 bg-ledger-gray-100 border-b border-ledger-gray-200 text-xs text-ledger-gray-500 font-mono">
              {language}
            </div>
          )}
          <pre className="p-3 bg-ledger-gray-50 overflow-x-auto">
            <code className="text-xs font-mono">{children}</code>
          </pre>
        </div>
      )
    }

    // Inline code
    return (
      <code className="px-1.5 py-0.5 bg-ledger-gray-100 border border-ledger-gray-200 rounded text-xs font-mono">
        {children}
      </code>
    )
  },
  }
}

export function MarkdownRenderer({ content, className, citations, documentCitations }: MarkdownRendererProps) {
  const components = useMemo(() => buildComponents(citations, documentCitations), [citations, documentCitations])
  const enrichedContent = useMemo(() => enrichContentWithCitations(content, documentCitations), [content, documentCitations])
  
  return (
    <div className={cn('text-sm leading-relaxed space-y-3', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {prepareStreamingContent(enrichedContent)}
      </ReactMarkdown>
    </div>
  )
}
