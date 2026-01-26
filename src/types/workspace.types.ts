export interface CaseSource {
  id: string
  caseId: string
  fileName: string
  fileType: string
  fileSize: number
  s3Url: string
  uploadedAt: Date
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
