import * as React from 'react'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

interface MarkdownNode {
  type: 'text' | 'heading' | 'code-block' | 'blockquote' | 'list' | 'paragraph'
  content: string
  level?: number
  language?: string
  ordered?: boolean
  items?: string[]
}

function parseBlocks(text: string): MarkdownNode[] {
  const lines = text.split('\n')
  const blocks: MarkdownNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const language = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code-block', content: codeLines.join('\n'), language })
      i++ // skip closing ```
      continue
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      blocks.push({ type: 'heading', content: headingMatch[2], level: headingMatch[1].length })
      i++
      continue
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') })
      continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s/, ''))
        i++
      }
      blocks.push({ type: 'list', content: '', items, ordered: false })
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push({ type: 'list', content: '', items, ordered: true })
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph - collect consecutive non-empty lines
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('```') && !lines[i].startsWith('#') && !lines[i].startsWith('>') && !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paraLines.join('\n') })
    }
  }

  return blocks
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Match bold, italic, inline code, and bold-italic
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // Bold italic ***text***
      parts.push(<strong key={match.index}><em>{match[2]}</em></strong>)
    } else if (match[3]) {
      // Bold **text**
      parts.push(<strong key={match.index}>{match[3]}</strong>)
    } else if (match[4]) {
      // Italic *text*
      parts.push(<em key={match.index}>{match[4]}</em>)
    } else if (match[5]) {
      // Inline code `text`
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 bg-ledger-gray-100 border border-ledger-gray-200 rounded text-xs font-mono"
        >
          {match[5]}
        </code>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const blocks = parseBlocks(content)

  return (
    <div className={cn('space-y-3 text-sm leading-relaxed', className)}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}` as keyof JSX.IntrinsicElements
            const sizeClass = block.level === 1 ? 'text-lg font-bold' :
                              block.level === 2 ? 'text-base font-bold' :
                              'text-sm font-semibold'
            return <Tag key={i} className={sizeClass}>{renderInline(block.content)}</Tag>
          }

          case 'code-block':
            return (
              <div key={i} className="rounded-lg border border-ledger-gray-200 overflow-hidden">
                {block.language && (
                  <div className="px-3 py-1.5 bg-ledger-gray-100 border-b border-ledger-gray-200 text-xs text-ledger-gray-500 font-mono">
                    {block.language}
                  </div>
                )}
                <pre className="p-3 bg-ledger-gray-50 overflow-x-auto">
                  <code className="text-xs font-mono">{block.content}</code>
                </pre>
              </div>
            )

          case 'blockquote':
            return (
              <blockquote key={i} className="border-l-2 border-ledger-gray-300 pl-3 text-ledger-gray-600 italic">
                {renderInline(block.content)}
              </blockquote>
            )

          case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul'
            return (
              <ListTag key={i} className={cn('pl-5 space-y-1', block.ordered ? 'list-decimal' : 'list-disc')}>
                {block.items?.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </ListTag>
            )
          }

          case 'paragraph':
          default:
            return <p key={i}>{renderInline(block.content)}</p>
        }
      })}
    </div>
  )
}
