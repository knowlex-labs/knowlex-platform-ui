import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DocumentCitation } from '@/types'

interface MarkdownRendererProps {
  content: string
  documentCitations?: DocumentCitation[]
}

function stripReferences(text: string): string {
  const idx = text.search(/\nReferences\s*\n/)
  return idx !== -1 ? text.slice(0, idx).trimEnd() : text
}

function processTextWithCitations(text: string, citations?: DocumentCitation[]): React.ReactNode[] {
  if (!citations?.length) return [text]

  const parts = text.split(/(\[D\d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[D(\d+)\]$/)
    if (match) {
      const citationId = parseInt(match[1], 10)
      const citation = citations.find(c => c.id === citationId)
      return (
        <span
          key={i}
          title={citation?.text_preview}
          className="text-[10px] text-kx-primary-600 font-semibold align-super cursor-default"
        >
          [{citationId}]
        </span>
      )
    }
    return part
  })
}

function processChildren(children: React.ReactNode, citations?: DocumentCitation[]): React.ReactNode {
  return React.Children.map(children, child => {
    if (typeof child === 'string') return processTextWithCitations(child, citations)
    return child
  })
}

export function MarkdownRenderer({ content, documentCitations }: MarkdownRendererProps) {
  const cleaned = documentCitations?.length ? stripReferences(content) : content

  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mt-5 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1.5">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed">{processChildren(children, documentCitations)}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{processChildren(children, documentCitations)}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-kx-primary-300 pl-3 my-3 text-ledger-gray-600 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-')
            if (isBlock) {
              return (
                <pre className="bg-ledger-gray-100 dark:bg-ledger-gray-800 rounded-lg p-3 my-3 overflow-x-auto">
                  <code className="text-xs">{children}</code>
                </pre>
              )
            }
            return (
              <code className="bg-ledger-gray-100 dark:bg-ledger-gray-800 text-kx-primary-700 rounded px-1 py-0.5 text-xs">
                {children}
              </code>
            )
          },
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-kx-primary-600 underline hover:text-kx-primary-700">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-xs border border-ledger-gray-200">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-ledger-gray-200 px-2 py-1.5 bg-ledger-gray-50 font-semibold text-left">{children}</th>,
          td: ({ children }) => <td className="border border-ledger-gray-200 px-2 py-1.5">{children}</td>,
          hr: () => <hr className="my-4 border-ledger-gray-200" />,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  )
}
