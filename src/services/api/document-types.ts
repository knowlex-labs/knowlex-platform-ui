// Document types - shared types for document/draft creation
// API functions moved to workspace-api.ts

/** Agent-level document sub-types sent to the legal-agent-service. */
export type DocumentType =
  | 'contract'
  | 'agreement'
  | 'legal_notice'
  | 'demand_notice'
  | 'petition'
  | 'affidavit'
  | 'application'
  | 'bail_application'
  | 'criminal_appeal'
  | 'consumer_complaint'
  | 'slp'
  | 'quashing_petition'
  | 'anticipatory_bail'
  | 'revision_petition'
  | 'execution_petition'
  | 'patent'
  | 'written_statement'
  | 'written_arguments'
  | 'application_draft'
  | 'DRAFT'
  | 'SUMMARY'
  | 'SOURCE_DOC'

export type InputMode = 'structured' | 'freetext' | 'file'

export type Language = 'english' | 'hindi' | 'bilingual'

export interface CreateDraftRequest {
  title: string
  document_type: DocumentType
  input_mode: InputMode
  subtype?: string
  freetext_body?: string
  file_ids?: string[]
  language?: Language
  config?: Record<string, string>
}

// Item format returned by the list endpoint (flat structure)
export interface DraftListItem {
  id: string
  job_id: string
  title: string
  document_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  draft_body: string
  file_path?: string
  sections: Array<{ title: string; content: string; order: number }>
  metadata: {
    document_type: string
    title: string
    summary: string
    subtype?: string
    input_mode?: string
    case_id?: string
  }
  content_format?: string
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type CreateDraftResponse = DraftListItem
export type DraftJobResponse = DraftListItem
export type ListDraftsResponse = DraftListItem[]

export interface UpdateDraftRequest {
  title?: string
  draft_body?: string
  storage_key?: string
}
