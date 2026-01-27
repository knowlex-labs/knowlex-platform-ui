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
    id: 'summarize',
    name: 'Summarize',
    description: 'Create a summary of selected sources',
    icon: 'FileText',
  },
  {
    id: 'create-report',
    name: 'Create Report',
    description: 'Generate a legal analysis report',
    icon: 'FileOutput',
  },
  {
    id: 'extract-facts',
    name: 'Extract Key Facts',
    description: 'List key facts from documents',
    icon: 'ListChecks',
  },
  {
    id: 'find-precedents',
    name: 'Find Precedents',
    description: 'Search for relevant case precedents',
    icon: 'Scale',
  },
  {
    id: 'draft-response',
    name: 'Draft Response',
    description: 'Draft a legal response or brief',
    icon: 'PenLine',
  },
]

// Draft types for workspace
export interface Draft {
  id: string
  title: string
  content: string
  caseId: string
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
