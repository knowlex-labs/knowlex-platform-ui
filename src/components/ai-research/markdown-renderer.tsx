import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
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

const components: Components = {
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
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
    >
      {children}
    </a>
  ),
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

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
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
