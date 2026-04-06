export enum DocumentType {
  USER_UPLOADED = 'USER_UPLOADED',
  DRAFT        = 'DRAFT',
  SUMMARY      = 'SUMMARY',
  JUDGMENT     = 'JUDGMENT',
  BRIEF        = 'BRIEF',
}

/** Document types whose content is AI-generated (have a jobStatus lifecycle). */
export const GENERATED_DOC_TYPES = new Set<DocumentType>([
  DocumentType.DRAFT,
  DocumentType.SUMMARY,
])

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

export type CaseDocumentStatus = IndexingStatus | JobStatus

export interface CaseDocument {
  id: string
  name: string
  type: DocumentType
  indexingStatus?: IndexingStatus
  jobStatus?: JobStatus
  jobId?: string
  subType?: string
  filePath?: string | null
  storageUrl?: string | null
  signedUrl?: string | null
  downloadUrl?: string | null
  // Additional fields from DocumentResponse
  caseId?: string | null
  caseTitle?: string | null
  originalFilename?: string | null
  fileType?: string | null
  createdAt?: string
  updatedAt?: string
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
  type: 'chat' | 'draft' | 'summary' | 'source' | 'judgment'
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
export interface DocumentCitation {
  id: number           // D1 = 1, D2 = 2
  file_id: string
  page?: number
  score: number
  text_preview: string
  chunk_id?: string
  key_terms?: string[]
}

export interface DraftChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  streamingPhase?: 'waiting' | 'tools' | 'answering'
  toolCalls?: Array<{ name: string; args: Record<string, unknown>; result?: string }>
  documentCitations?: DocumentCitation[]
}

/** UI model option keys; backend maps these to legal-agent model names (flash, pro, openai, openai-pro). */
export type DraftChatModel = 'gemini_flash' | 'gemini_pro' | 'gpt_5_mini' | 'gpt_5'

export interface DraftChatSettings {
  tone: 'formal' | 'conversational' | 'neutral'
  style: 'precise' | 'balanced' | 'detailed'
  model: DraftChatModel
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
      { id: 'recipient', label: 'Recipient Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'body', label: 'Notice Content', type: 'textarea', required: false, placeholder: 'Enter initial content (optional)' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
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
      { id: 'applicant', label: 'Applicant Details', type: 'client-select', required: false, placeholder: 'Enter applicant full details — name, address, nationality' },
      { id: 'inventor', label: 'Inventor Name', type: 'text', required: false, placeholder: 'Enter inventor name (if different from applicant)' },
      { id: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Describe the invention' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
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
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
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
      { id: 'defendant', label: 'Defendant Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile (e.g., Mr. Rajesh Kumar, 45, Business Owner, 123 MG Road, Koramangala, Bangalore, Karnataka 560034, +91-9876543210)' },
      { id: 'grounds', label: 'Grounds', type: 'textarea', required: false, placeholder: 'Enter grounds for application' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
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
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
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
      { id: 'opposite_party', label: 'Opposite Party / State', type: 'client-select', required: false, placeholder: 'Enter opposite party details (e.g., State of Karnataka through PSI, XYZ Police Station)' },
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
      { id: 'respondent', label: 'Respondent Details', type: 'client-select', required: false, placeholder: 'Enter respondent details (e.g., State of Maharashtra through PP, High Court)' },
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
  {
    id: 'plaint',
    name: 'Plaint',
    description: 'Draft a civil suit plaint for filing before a civil court',
    icon: 'ScrollText',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Plaint in Civil Suit No. — of 2025' },
      { id: 'plaintiff', label: 'Plaintiff Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile' },
      { id: 'defendant', label: 'Defendant Details', type: 'client-select', required: false, placeholder: 'Enter defendant details — name, age, occupation, address' },
      { id: 'court_details', label: 'Court Details', type: 'text', required: false, placeholder: 'e.g., Civil Judge (Senior Division), Pune' },
      { id: 'cause_of_action', label: 'Cause of Action', type: 'textarea', required: false, placeholder: 'Describe the cause of action — when it arose, where, and what happened' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Set out the facts of the case chronologically' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'List all reliefs — declaration, injunction, damages, costs etc.' },
      { id: 'valuation', label: 'Valuation of Suit', type: 'text', required: false, placeholder: 'e.g., Rs. 5,00,000 (for court fee purposes)' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'written-statement',
    name: 'Written Statement',
    description: "Draft defendant's written statement in response to a civil plaint",
    icon: 'ClipboardList',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Written Statement on behalf of Defendant No. 1' },
      { id: 'defendant', label: 'Defendant Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address' },
      { id: 'plaintiff', label: 'Plaintiff Details', type: 'client-select', required: false, placeholder: 'Enter plaintiff details' },
      { id: 'court_details', label: 'Court Details', type: 'text', required: false, placeholder: 'e.g., Civil Judge (Senior Division), Pune' },
      { id: 'preliminary_objections', label: 'Preliminary Objections', type: 'textarea', required: false, placeholder: 'List any preliminary objections (maintainability, jurisdiction, limitation, etc.)' },
      { id: 'reply_on_facts', label: 'Reply on Facts', type: 'textarea', required: false, placeholder: 'Paragraph-wise reply to the plaint allegations' },
      { id: 'additional_pleas', label: 'Additional Pleas', type: 'textarea', required: false, placeholder: 'Any additional facts/pleas in defence' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Prayer — dismissal of suit with costs etc.' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Reference Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'written-arguments',
    name: 'Written Arguments',
    description: 'Draft written arguments / synopsis for submission before any court or tribunal',
    icon: 'AlignLeft',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Written Arguments on behalf of Appellant' },
      { id: 'party', label: 'Party Details', type: 'client-select', required: false, placeholder: 'Enter party name and designation (Appellant/Respondent/Petitioner etc.)' },
      { id: 'court_details', label: 'Court / Tribunal', type: 'text', required: false, placeholder: 'e.g., High Court of Delhi, Division Bench' },
      { id: 'case_details', label: 'Case Number & Title', type: 'text', required: false, placeholder: 'e.g., W.P.(C) 1234/2024 — ABC vs. Union of India' },
      { id: 'issues', label: 'Issues for Determination', type: 'textarea', required: false, placeholder: 'List the legal issues to be argued' },
      { id: 'arguments', label: 'Arguments', type: 'textarea', required: false, placeholder: 'Set out arguments issue-wise with case law references if any' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Final prayer and relief' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Reference Documents / Judgments', type: 'sources', required: false },
    ],
  },
  {
    id: 'writ-petition',
    name: 'Writ Petition',
    description: 'Draft writ petitions under Article 226/32 before High Court or Supreme Court',
    icon: 'Landmark',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Writ Petition (Civil) under Article 226' },
      { id: 'petitioner', label: 'Petitioner Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address' },
      { id: 'respondent', label: 'Respondent Details', type: 'client-select', required: false, placeholder: 'Enter respondent details — govt. authority, ministry, etc.' },
      { id: 'court_details', label: 'Court', type: 'text', required: false, placeholder: 'e.g., High Court of Karnataka at Bengaluru' },
      { id: 'writ_type', label: 'Nature of Writ', type: 'select', required: false, options: [
        { label: 'Mandamus', value: 'mandamus' },
        { label: 'Certiorari', value: 'certiorari' },
        { label: 'Prohibition', value: 'prohibition' },
        { label: 'Habeas Corpus', value: 'habeas_corpus' },
        { label: 'Quo Warranto', value: 'quo_warranto' },
      ] },
      { id: 'impugned_order', label: 'Impugned Order / Action', type: 'textarea', required: false, placeholder: 'Describe the order/action/inaction being challenged' },
      { id: 'grounds', label: 'Grounds', type: 'textarea', required: false, placeholder: 'Constitutional and legal grounds for challenge' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Factual background leading to this petition' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Specific reliefs including interim and final relief' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'slp',
    name: 'Special Leave Petition',
    description: 'Draft SLP under Article 136 of the Constitution before the Supreme Court',
    icon: 'Star',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Special Leave Petition (Civil) No. — of 2025' },
      { id: 'petitioner', label: 'Petitioner Details', type: 'client-select', required: false, placeholder: 'Enter petitioner details — name, age, occupation, address' },
      { id: 'respondent', label: 'Respondent Details', type: 'client-select', required: false, placeholder: 'Enter respondent details' },
      { id: 'impugned_judgment', label: 'Impugned Judgment Details', type: 'textarea', required: false, placeholder: 'Court, date, case number, and nature of the impugned order/judgment' },
      { id: 'grounds', label: 'Grounds for SLP', type: 'textarea', required: false, placeholder: 'Substantial questions of law, error apparent on face of record, etc.' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Factual background of the case' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Grant of special leave, stay of impugned judgment, etc.' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'quashing-petition',
    name: 'Quashing Petition',
    description: 'Draft petition to quash FIR or proceedings under Section 528 BNSS / 482 CrPC',
    icon: 'Ban',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Petition u/s 528 BNSS for Quashing of FIR' },
      { id: 'petitioner', label: 'Petitioner Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile' },
      { id: 'respondent', label: 'Respondent (State)', type: 'client-select', required: false, placeholder: 'e.g., State of Karnataka through the Public Prosecutor' },
      { id: 'court_details', label: 'Court', type: 'text', required: false, placeholder: 'e.g., High Court of Karnataka at Bengaluru' },
      { id: 'fir_details', label: 'FIR Details', type: 'textarea', required: false, placeholder: 'FIR No., Police Station, date, offences alleged (sections invoked)' },
      { id: 'grounds', label: 'Grounds for Quashing', type: 'textarea', required: false, placeholder: 'No prima facie case, abuse of process, malicious prosecution, settlement, etc.' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Background facts leading to the FIR/proceedings' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Quashing of FIR/chargesheet, stay of proceedings, etc.' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'anticipatory-bail',
    name: 'Anticipatory Bail',
    description: 'Draft anticipatory bail application under Section 482 BNSS / 438 CrPC',
    icon: 'ShieldCheck',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Anticipatory Bail Application u/s 482 BNSS' },
      { id: 'applicant', label: 'Applicant Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile' },
      { id: 'opposite_party', label: 'Opposite Party / State', type: 'client-select', required: false, placeholder: 'e.g., State of Karnataka through PSI, XYZ Police Station' },
      { id: 'court_details', label: 'Court Details', type: 'text', required: false, placeholder: 'e.g., Sessions Court, Bangalore Urban District' },
      { id: 'fir_details', label: 'FIR / Case Details', type: 'textarea', required: false, placeholder: 'FIR No. (if registered), police station, sections — or description of anticipated arrest' },
      { id: 'grounds', label: 'Grounds for Anticipatory Bail', type: 'textarea', required: false, placeholder: 'Why arrest is apprehended, no flight risk, cooperation with investigation, etc.' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Background facts of the case' },
      { id: 'criminal_history', label: 'Criminal History', type: 'textarea', required: false, placeholder: 'Prior cases if any (leave blank if none)' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Direction to release on bail in the event of arrest' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'revision-petition',
    name: 'Revision Petition',
    description: 'Draft criminal or civil revision petition before Sessions Court or High Court',
    icon: 'RefreshCcw',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Criminal Revision Petition No. — of 2025' },
      { id: 'petitioner', label: 'Petitioner Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address' },
      { id: 'respondent', label: 'Respondent Details', type: 'client-select', required: false, placeholder: 'Enter respondent details' },
      { id: 'court_details', label: 'Court', type: 'text', required: false, placeholder: 'e.g., Sessions Court, Pune / High Court of Bombay' },
      { id: 'impugned_order', label: 'Impugned Order Details', type: 'textarea', required: false, placeholder: 'Court, date, case number and nature of order under revision' },
      { id: 'grounds', label: 'Grounds for Revision', type: 'textarea', required: false, placeholder: 'Error of law, error of jurisdiction, improper exercise of discretion, etc.' },
      { id: 'facts', label: 'Brief Facts', type: 'textarea', required: false, placeholder: 'Factual background' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Setting aside / modification of impugned order' },
      { id: 'language', label: 'Language', type: 'select', required: false, options: [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Bilingual', value: 'bilingual' },
      ] },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'execution-petition',
    name: 'Execution Petition',
    description: 'Draft application for execution of a decree or order',
    icon: 'Hammer',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Execution Petition in E.P. No. — of 2025' },
      { id: 'decree_holder', label: 'Decree Holder Details', type: 'client-select', required: false, placeholder: 'Enter decree holder full details' },
      { id: 'judgment_debtor', label: 'Judgment Debtor Details', type: 'client-select', required: false, placeholder: 'Enter judgment debtor full details' },
      { id: 'court_details', label: 'Court', type: 'text', required: false, placeholder: 'e.g., Civil Judge (Senior Division), Delhi' },
      { id: 'decree_details', label: 'Decree Details', type: 'textarea', required: false, placeholder: 'Case number, date of decree, nature of decree, amount if any' },
      { id: 'amount_due', label: 'Amount Due', type: 'text', required: false, placeholder: 'Principal + interest + costs (e.g., Rs. 5,00,000 + 12% p.a.)' },
      { id: 'mode_of_execution', label: 'Mode of Execution', type: 'textarea', required: false, placeholder: 'Attachment of property, arrest of judgment debtor, garnishee, etc.' },
      { id: 'property_details', label: 'Property / Asset Details', type: 'textarea', required: false, placeholder: 'Description of property to be attached, if applicable' },
      { id: 'sources', label: 'Reference Documents', type: 'sources', required: false },
    ],
  },
  {
    id: 'consumer-complaint',
    name: 'Consumer Complaint',
    description: 'Draft consumer complaint before District, State or National Consumer Commission',
    icon: 'Users',
    fields: [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g., Consumer Complaint before District Consumer Commission' },
      { id: 'complainant', label: 'Complainant Details', type: 'client-select', required: false, placeholder: 'Enter full details — name, age, occupation, address, mobile' },
      { id: 'opposite_party', label: 'Opposite Party Details', type: 'client-select', required: false, placeholder: 'Company / service provider details — name, registered address' },
      { id: 'forum_details', label: 'Forum / Commission', type: 'text', required: false, placeholder: 'e.g., District Consumer Disputes Redressal Commission, Pune' },
      { id: 'product_service', label: 'Product / Service', type: 'text', required: false, placeholder: 'Brief description of product/service purchased' },
      { id: 'deficiency', label: 'Deficiency in Service / Defect in Goods', type: 'textarea', required: false, placeholder: 'Describe the deficiency, defect, unfair trade practice, or restrictive trade practice' },
      { id: 'facts', label: 'Facts of the Complaint', type: 'textarea', required: false, placeholder: 'Chronological facts including purchase, payment, defect noticed, complaint made, response received' },
      { id: 'loss_suffered', label: 'Loss / Damage Suffered', type: 'textarea', required: false, placeholder: 'Financial loss, mental agony, harassment — with amounts' },
      { id: 'relief_sought', label: 'Relief Sought', type: 'textarea', required: false, placeholder: 'Replacement, refund, compensation, costs, punitive damages, etc.' },
      { id: 'sources', label: 'Supporting Documents', type: 'sources', required: false },
    ],
  },
]
