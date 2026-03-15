import { useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { Citation } from '@/types'

interface MarkdownRendererProps {
  content: string
  className?: string
  citations?: Citation[]
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

function buildComponents(citations?: Citation[]): Components {
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

export function MarkdownRenderer({ content, className, citations }: MarkdownRendererProps) {
  const components = useMemo(() => buildComponents(citations), [citations])
  return (
    <div className={cn('text-sm leading-relaxed space-y-3', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {prepareStreamingContent(content)}
      </ReactMarkdown>
    </div>
  )
}
