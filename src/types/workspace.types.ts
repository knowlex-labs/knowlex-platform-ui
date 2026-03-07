export enum IndexingStatus {
  PENDING = 'INDEXING_PENDING',
  RUNNING = 'INDEXING_RUNNING',
  COMPLETED = 'INDEXING_COMPLETED',
  FAILED = 'INDEXING_FAILED',
  CANCELLED = 'INDEXING_CANCELLED',
}

export enum JobStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  INACTIVE = 'INACTIVE',
}

export type CaseSourceStatus = IndexingStatus | JobStatus

export interface CaseSource {
  id: string
  name: string
  type: 'USER_UPLOADED' | 'DRAFT' | 'JUDGMENT'
  status: CaseSourceStatus
}

export interface ChatResponse {
  content: string
  confidence: number
  sources: ChatSource[]
}

export interface ChatSource {
  fileName: string
  page: number
  textSnippet: string
}

export interface WorkspaceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sourceIds?: string[]
}

export interface LegalTool {
  id: string
  name: string
  description: string
  icon: string
}

export const LEGAL_TOOLS: LegalTool[] = [
  {
    id: 'drafting',
    name: 'Drafting',
    description: 'Create legal documents from templates',
    icon: 'PenLine',
  },
  {
    id: 'generate-report',
    name: 'Generate Report',
    description: 'Generate a legal analysis report',
    icon: 'FileOutput',
  },
  {
    id: 'generate-summary',
    name: 'Generate Summary',
    description: 'Summarize selected documents',
    icon: 'FileText',
  },
  {
    id: 'generate-facts',
    name: 'Generate Case Facts',
    description: 'Extract key facts from documents',
    icon: 'ListChecks',
  },
]

// Draft types for workspace
export interface DraftSection {
  title: string
  content: string
  order: number
}

export interface Draft {
  id: string
  title: string
  content: string
  status: 'pending' | 'completed' | 'failed'
  sections: DraftSection[]
  summary: string
  templateType?: string  // e.g., 'interim-application', 'notice', 'affidavit', etc.
  contentFormat?: 'markdown' | 'html' | 'plain'
  createdAt: Date
  updatedAt: Date
}

// Note types for workspace (Google Keep style)
export interface Note {
  id: string
  title: string
  content: string
  caseId: string
  createdAt: Date
  updatedAt: Date
}

// Case filter types
export interface CaseFilter {
  dateRange: {
    from: Date | null
    to: Date | null
  } | null
  clientId: string | null
  caseType: string | null
  status: string | null
}

export type WorkspaceTab = 'chat' | 'drafts' | 'notes'

// Case summary
export interface CaseSummary {
  id: string
  status: 'pending' | 'completed' | 'failed'
  content: string
  createdAt: Date
  updatedAt: Date
}

// IDE-like tab system for workspace
export interface WorkspaceTabItem {
  id: string
  type: 'chat' | 'draft' | 'summary' | 'source'
  label: string
  draftId?: string
  sourceId?: string
  sourceUrl?: string
  sourceFileType?: string
  isUnsaved?: boolean
}

// Template types for draft generation
export interface TemplateField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'sources' | 'client-select' | 'select'
  required: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}

export interface DraftTemplate {
  id: string
  name: string
  description: string
  icon: string
  fields: TemplateField[]
}

export interface TemplateFormData {
  [fieldId: string]: string | string[]
}

export interface GeneratedDraft {
  id: string
  templateId: string
  title: string
  content: string
  sourceIds: string[]
  caseId: string
  createdAt: Date
  updatedAt: Date
}

// Draft template definitions
export interface DraftChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  streamingPhase?: 'waiting' | 'tools' | 'answering'
  toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: string }>
}

export interface DraftChatSettings {
  tone: 'formal' | 'conversational' | 'neutral'
  style: 'precise' | 'balanced' | 'detailed'
  model: 'openai' | 'gemini'
}

export interface DraftChatSession {
  id: string
  title: string
  createdAt: Date
}

export const DRAFT_TEMPLATES: DraftTemplate[] = [
  {
    id: 'notice',
    name: 'Notice',
    description: 'Draft legal notices, demand letters, and statutory communications',
    icon: 'FileWarning',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter notice title' },
      { id: 'sender', label: 'Sender Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'recipient', label: 'Recipient Details', type: 'textarea', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'body', label: 'Notice Content', type: 'textarea', required: false, placeholder: 'Enter initial content (optional)' },
      { id: 'sources', label: 'Reference Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'patent',
    name: 'Patent',
    description: 'Prepare patent applications with claims and technical descriptions',
    icon: 'Lightbulb',
    fields: [
      { id: 'title', label: 'Patent Title', type: 'text', required: true, placeholder: 'Enter patent title' },
      { id: 'inventor', label: 'Inventor Name', type: 'text', required: false, placeholder: 'Enter inventor name' },
      { id: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Describe the invention' },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'application-draft',
    name: 'Application Draft',
    description: 'Create formal applications and submissions',
    icon: 'FileText',
    fields: [
      { id: 'title', label: 'Application Title', type: 'text', required: true, placeholder: 'Enter application title' },
      { id: 'applicant', label: 'Applicant Name', type: 'client-select', required: false, placeholder: 'Enter applicant name' },
      { id: 'body', label: 'Application Body', type: 'textarea', required: false, placeholder: 'Enter initial content (optional)' },
      { id: 'sources', label: 'Reference Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'interim-application',
    name: 'Interim Application',
    description: 'File interim or urgent court applications',
    icon: 'FileClock',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter application title' },
      { id: 'plaintiff', label: 'Plaintiff Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'defendant', label: 'Defendant Details', type: 'textarea', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'grounds', label: 'Grounds', type: 'textarea', required: false, placeholder: 'Enter grounds for application' },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'affidavit',
    name: 'Affidavit',
    description: 'Prepare sworn statements and affidavits',
    icon: 'Scale',
    fields: [
      { id: 'title', label: 'Affidavit Title', type: 'text', required: true, placeholder: 'Enter affidavit title' },
      { id: 'deponent', label: 'Deponent Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'statements', label: 'Statements', type: 'textarea', required: false, placeholder: 'Enter affidavit statements' },
      { id: 'sources', label: 'Reference Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'bail-application',
    name: 'Bail Application',
    description: 'Draft bail applications with FIR details and criminal history',
    icon: 'Gavel',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter application title' },
      { id: 'applicant', label: 'Applicant Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile' },
      { id: 'opposite_party', label: 'Opposite Party / State', type: 'textarea', required: false, placeholder: 'Enter opposite party details (e.g., State of Karnataka through PSI, XYZ Police Station)' },
      { id: 'court_details', label: 'Court Details', type: 'text', required: false, placeholder: 'e.g., Sessions Court, Bangalore Urban District' },
      { id: 'fir_details', label: 'FIR Details', type: 'textarea', required: false, placeholder: 'FIR number, police station, date, sections invoked (e.g., FIR No. 123/2025, XYZ PS, u/s 302, 34 IPC)' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Briefly describe the facts of the case' },
      { id: 'criminal_history', label: 'Criminal History', type: 'textarea', required: false, placeholder: 'Details of any prior criminal cases (leave blank if none)' },
      { id: 'bail_history', label: 'Bail History', type: 'textarea', required: false, placeholder: 'Details of any prior bail applications and their outcome' },
      { id: 'co_accused_details', label: 'Co-Accused Details', type: 'textarea', required: false, placeholder: 'Details of co-accused persons, if any' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Describe the relief being sought (e.g., regular bail, anticipatory bail)' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'criminal-appeal',
    name: 'Criminal Appeal',
    description: 'Draft criminal appeals against conviction or sentence',
    icon: 'ShieldAlert',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter appeal title' },
      { id: 'appellant', label: 'Appellant Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile' },
      { id: 'respondent', label: 'Respondent Details', type: 'textarea', required: false, placeholder: 'Enter respondent details (e.g., State of Maharashtra through PP, High Court)' },
      { id: 'court_details', label: 'Court Details', type: 'text', required: false, placeholder: 'e.g., High Court of Bombay, Appellate Side' },
      { id: 'impugned_order', label: 'Impugned Order Details', type: 'textarea', required: false, placeholder: 'Details of the order/judgment being challenged — court, date, case number, conviction details' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Briefly describe the facts of the case' },
      { id: 'criminal_history', label: 'Criminal History', type: 'textarea', required: false, placeholder: 'Details of any prior criminal cases (leave blank if none)' },
      { id: 'co_accused_details', label: 'Co-Accused Details', type: 'textarea', required: false, placeholder: 'Details of co-accused persons, if any' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Describe the relief being sought (e.g., acquittal, reduction of sentence, suspension of sentence)' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
]
