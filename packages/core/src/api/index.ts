// Core initialization & adapters
export { initCore, getAdapters } from './runtime'
export type { CoreAdapters, StorageAdapter, EventBusAdapter, EnvironmentConfig, FileHandlerAdapter } from './ports'
export { getAuthHeaders, getAdminAuthHeaders } from './auth-headers'

// API clients
export { apiClient, adminApiClient, ApiError, SessionExpiredError } from './api-client'
export { authApi } from './auth-api'
export type { RegisterRequest, LoginRequest, AuthResponse, AuthError } from './auth-api'
export { caseApi } from './case-api'
export type { GetCasesParams } from './case-api'
export { clientApi } from './client-api'
export type { GetClientsParams } from './client-api'
export { userApi } from './user-api'
export type { BackendUser } from './user-api'
export { workspaceApi } from './workspace-api'
export { judgmentsApi } from './judgments-api'
export type { JudgmentListParams } from './judgments-api'
export { dashboardApi } from './dashboard-api'
export type {
  DashboardSummary,
  RecentCase,
  RecentClient,
  RecentDocument,
  RecentActivity,
  UpcomingHearing,
} from './dashboard-api'
export { draftChatApi } from './draft-chat-api'
export type { DraftChatSSECallbacks } from './draft-chat-api'
export { researchApi } from './research-api'
export type { SSECallbacks } from './research-api'
export { subscriptionApi, walletApi } from './subscription-api'
export { docProcessingApi, uploadToolboxFile, downloadDocument, fetchDocumentBlob, triggerDirectDownload, exportGeneratedDocument, listAllDocuments, listStandaloneDocuments, linkDocumentToCase, submitTranslation, getDocument, getEditState, updateEditState, translateText } from './doc-processing-api'
export type { ProcessedDocumentInfo, SplitRequest, SplitResponse, MergeRequest, MergeResponse, ConvertTargetFormat, ConvertRequest, ConvertResponse, CompressRequest, CompressResponse, DocumentRecordType, DocumentRecord, ListDocumentsOpts, EditPdfRequest, EditPdfResponse, GeneratedDocExportFormat, EditStateResponse, TranslateTextResponse } from './doc-processing-api'
export { draftsApi } from './drafts-api'
export { summaryApi } from './summary-api'
export { blogApi } from './blog-api'
export { causeListApi } from './cause-list-api'
export { newsApi } from './news-api'
export { inquiriesApi } from './inquiries-api'
export type { InquiryPayload, InquiryRecord } from './inquiries-api'
export { statesApi } from './states-api'
export type { State, Bench } from './states-api'
export { moodboardApi } from './moodboard-api'
