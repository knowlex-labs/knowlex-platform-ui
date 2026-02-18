export interface CaseSource {
  id: string
  filename: string
  originalFilename: string
  fileType: 'PDF' | 'DOCX' | 'DOC' | 'JPG' | 'JPEG' | 'PNG'
  fileSize: number
  storageUrl: string
  storageKey: string
  documentSource: 'UPLOAD' | 'GOOGLE_DRIVE'
  description?: string
  caseId: string
  collectionId?: string
  indexingStatus: 'INDEXING_PENDING' | 'INDEXING' | 'INDEXED' | 'INDEXING_FAILED'
  createdAt: string
  updatedAt: string
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

// IDE-like tab system for workspace
export interface WorkspaceTabItem {
  id: string
  type: 'chat' | 'draft'
  label: string
  draftId?: string
  isUnsaved?: boolean
}

// Template types for draft generation
export interface TemplateField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'sources' | 'client-select'
  required: boolean
  placeholder?: string
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
export const DRAFT_TEMPLATES: DraftTemplate[] = [
  {
    id: 'notice',
    name: 'Notice',
    description: 'Draft legal notices, demand letters, and statutory communications',
    icon: 'FileWarning',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter notice title' },
      { id: 'sender', label: 'Sender Details', type: 'client-select', required: true, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'recipient', label: 'Recipient Details', type: 'textarea', required: true, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
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
      { id: 'inventor', label: 'Inventor Name', type: 'text', required: true, placeholder: 'Enter inventor name' },
      { id: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the invention' },
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
      { id: 'applicant', label: 'Applicant Name', type: 'client-select', required: true, placeholder: 'Enter applicant name' },
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
      { id: 'plaintiff', label: 'Plaintiff Details', type: 'client-select', required: true, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'defendant', label: 'Defendant Details', type: 'textarea', required: true, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'grounds', label: 'Grounds', type: 'textarea', required: true, placeholder: 'Enter grounds for application' },
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
      { id: 'deponent', label: 'Deponent Details', type: 'client-select', required: true, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'statements', label: 'Statements', type: 'textarea', required: true, placeholder: 'Enter affidavit statements' },
      { id: 'sources', label: 'Reference Documents', type: 'sources', required: false },
    ],
  },
]
