import type { DocumentCitation } from '@knowlex/core/types'

const MAX_EXCERPT = 16_000

/**
 * Parse legal-agent RAG tool output (`query_case_documents`) into structured citations.
 * Matches backend `_parse_rag_citations` / `LocalRAGClient._format_chunks` format so we can
 * attach excerpts after history load and as soon as the tool returns (not only via SSE).
 */
export function parseDocumentCitationsFromRagOutput(ragOutput: string): DocumentCitation[] {
  if (!ragOutput?.trim()) return []
  if (ragOutput.includes('No relevant content found')) return []

  const chunks = ragOutput.split('\n\n---\n\n')
  const out: DocumentCitation[] = []

  for (const raw of chunks) {
    const chunk = raw.trim()
    if (!chunk) continue

    const lines = chunk.split('\n')
    if (!lines.length) continue

    const headerLine = lines[0]
    const chunkMatch = headerLine.match(/\[Indexed chunk (\d+)\]/)
    if (!chunkMatch) continue

    const id = parseInt(chunkMatch[1], 10)
    const rel = headerLine.match(/\[Relevance: ([\d.]+)\]/)
    const score = rel ? parseFloat(rel[1]) : 0
    const fileMatch = headerLine.match(/\[File id: ([^\]]+)\]/)
    const file_id = fileMatch ? fileMatch[1].trim() : ''
    const pageMatch = headerLine.match(/\[Page: (\d+)\]/)
    const page = pageMatch ? parseInt(pageMatch[1], 10) : undefined
    const conceptsMatch = headerLine.match(/\[Concepts: ([^\]]+)\]/)
    const key_terms = conceptsMatch
      ? conceptsMatch[1].split(',').map((t) => t.trim()).filter(Boolean)
      : undefined

    const textContent = lines.slice(1).join('\n').trim()
    const text_preview =
      textContent.length > MAX_EXCERPT ? `${textContent.slice(0, MAX_EXCERPT)}…` : textContent

    const row: DocumentCitation = {
      id,
      file_id,
      score,
      text_preview,
    }
    if (page !== undefined) row.page = page
    if (key_terms?.length) row.key_terms = key_terms
    out.push(row)
  }

  return out
}

/** Merge citation lists by id; keep longer text_preview per id. */
export function mergeDocumentCitations(
  a: DocumentCitation[] | undefined,
  b: DocumentCitation[] | undefined
): DocumentCitation[] | undefined {
  if (!a?.length && !b?.length) return undefined
  const map = new Map<number, DocumentCitation>()
  const add = (list: DocumentCitation[] | undefined) => {
    if (!list) return
    for (const c of list) {
      const ex = map.get(c.id)
      if (!ex) map.set(c.id, { ...c })
      else
        map.set(c.id, {
          ...ex,
          ...c,
          text_preview: longer(ex.text_preview, c.text_preview),
        })
    }
  }
  add(a)
  add(b)
  const merged = [...map.values()].sort((x, y) => x.id - y.id)
  return merged.length ? merged : undefined
}

function longer(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? ''
  if (!b) return a
  return b.length > a.length ? b : a
}
