import type { CaseSource } from '@/types'

// Mock storage for demo purposes - in production this would use real S3 and backend APIs
const mockSources = new Map<string, CaseSource[]>()

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface PresignedUrlResponse {
  uploadUrl: string
  s3Key: string
}

export interface CreateSourceRequest {
  fileName: string
  fileType: string
  fileSize: number
  s3Url: string
}

export interface ChatQueryRequest {
  query: string
  sourceIds: string[]
}

export interface ChatQueryResponse {
  message: string
}

export interface ToolExecutionRequest {
  sourceIds: string[]
}

export interface ToolExecutionResponse {
  result: string
}

export const workspaceApi = {
  /**
   * Get a pre-signed URL for uploading a file to S3
   * Mock implementation - returns a fake URL
   */
  async getPresignedUploadUrl(
    caseId: string,
    fileName: string,
    _fileType: string
  ): Promise<PresignedUrlResponse> {
    await delay(300)
    const s3Key = `cases/${caseId}/sources/${generateId()}-${fileName}`
    return {
      uploadUrl: `https://mock-s3-bucket.s3.amazonaws.com/${s3Key}?X-Amz-Signature=mock`,
      s3Key,
    }
  },

  /**
   * Upload file to S3 using pre-signed URL
   * Mock implementation - stores file data in memory
   */
  async uploadFileToS3(_presignedUrl: string, _file: File): Promise<void> {
    await delay(500)
    // In production, this would be a fetch PUT request to S3
    // For demo, we just simulate the upload
  },

  /**
   * Create a case source record in the backend
   */
  async createCaseSource(
    caseId: string,
    request: CreateSourceRequest
  ): Promise<CaseSource> {
    await delay(300)

    const source: CaseSource = {
      id: generateId(),
      caseId,
      fileName: request.fileName,
      fileType: request.fileType,
      fileSize: request.fileSize,
      s3Url: request.s3Url,
      uploadedAt: new Date(),
    }

    const existingSources = mockSources.get(caseId) ?? []
    mockSources.set(caseId, [...existingSources, source])

    return source
  },

  /**
   * Get all sources for a case
   */
  async getCaseSources(caseId: string): Promise<CaseSource[]> {
    await delay(200)
    return mockSources.get(caseId) ?? []
  },

  /**
   * Delete a case source
   */
  async deleteCaseSource(caseId: string, sourceId: string): Promise<boolean> {
    await delay(300)
    const sources = mockSources.get(caseId) ?? []
    const filtered = sources.filter((s) => s.id !== sourceId)
    mockSources.set(caseId, filtered)
    return true
  },

  /**
   * Send a chat query about the case documents
   * Mock implementation - returns a simulated response
   */
  async sendChatQuery(
    _caseId: string,
    request: ChatQueryRequest
  ): Promise<ChatQueryResponse> {
    await delay(1000)

    const sourceCount = request.sourceIds.length
    const responses = [
      `Based on my analysis of the ${sourceCount} selected document(s), I found the following relevant information:\n\n${request.query}\n\nThe documents indicate several key points that relate to your query. Would you like me to elaborate on any specific aspect?`,
      `After reviewing the ${sourceCount} source(s) you selected, here's what I found regarding "${request.query}":\n\n1. The documents contain relevant case law references\n2. There are several precedents that may apply\n3. The timeline of events is clearly documented\n\nShall I provide more detail on any of these points?`,
      `I've analyzed the selected documents in relation to your question about "${request.query}".\n\nKey findings:\n- The evidence supports the main argument\n- Several witnesses corroborate the timeline\n- The legal framework is well-established\n\nWould you like me to draft a summary of these findings?`,
    ]

    return {
      message: responses[Math.floor(Math.random() * responses.length)],
    }
  },

  /**
   * Execute a legal tool on selected sources
   * Mock implementation - returns simulated tool output
   */
  async executeLegalTool(
    _caseId: string,
    toolId: string,
    request: ToolExecutionRequest
  ): Promise<ToolExecutionResponse> {
    await delay(1500)

    const sourceCount = request.sourceIds.length

    const toolResponses: Record<string, string> = {
      'summarize': `**Document Summary**\n\nI've analyzed ${sourceCount} document(s) and created the following summary:\n\n**Overview:**\nThe documents present a comprehensive view of the case, including witness statements, evidence reports, and legal briefs.\n\n**Key Points:**\n- The primary issue centers around contractual obligations\n- Multiple parties are involved with varying degrees of liability\n- The timeline spans approximately 18 months\n\n**Conclusion:**\nThe evidence strongly supports the plaintiff's position on the main claims.`,

      'create-report': `**Legal Analysis Report**\n\nGenerated from ${sourceCount} source document(s)\n\n**I. Executive Summary**\nThis report analyzes the key legal issues and provides recommendations based on the submitted documentation.\n\n**II. Facts of the Case**\nThe documentation establishes a clear sequence of events beginning with the initial contract signing.\n\n**III. Legal Analysis**\nBased on applicable precedents and statutory law, the case presents strong grounds for the following claims...\n\n**IV. Recommendations**\n1. Proceed with the primary cause of action\n2. Consider settlement negotiations\n3. Prepare for discovery phase`,

      'extract-facts': `**Key Facts Extracted**\n\nFrom ${sourceCount} document(s):\n\n**Timeline:**\n- January 15: Initial agreement signed\n- March 3: First breach alleged\n- April 22: Formal notice sent\n- June 1: Negotiations failed\n- August 15: Litigation commenced\n\n**Key Parties:**\n- Plaintiff: ABC Corporation\n- Defendant: XYZ Industries\n- Third Party: Insurance Provider\n\n**Monetary Values:**\n- Contract value: $2.5M\n- Damages claimed: $500K\n- Insurance coverage: $1M`,

      'find-precedents': `**Relevant Precedents**\n\nBased on ${sourceCount} document(s), the following case law may apply:\n\n**1. Smith v. Jones (2019)**\nEstablished the standard for breach of fiduciary duty in similar circumstances.\n\n**2. ABC Corp v. DEF Inc (2021)**\nProvides guidance on damages calculation methodology.\n\n**3. State v. Williams (2020)**\nRelevant for procedural considerations.\n\n**Applicability Notes:**\nThese precedents support the arguments presented in the primary filing.`,

      'draft-response': `**Draft Legal Response**\n\nBased on analysis of ${sourceCount} document(s):\n\n---\n\n**IN THE MATTER OF [Case Title]**\n\n**RESPONSE TO [Motion/Complaint]**\n\nComes now the [Plaintiff/Defendant] and respectfully submits this response:\n\n**I. Introduction**\n[Draft introduction based on case facts...]\n\n**II. Statement of Facts**\n[Facts derived from submitted documents...]\n\n**III. Argument**\n[Legal arguments supported by evidence...]\n\n**IV. Conclusion**\n[Requested relief...]\n\n---\n\n*This is a draft and should be reviewed by counsel before filing.*`,
    }

    return {
      result: toolResponses[toolId] ?? 'Tool execution completed.',
    }
  },
}
