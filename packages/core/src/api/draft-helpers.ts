import type { TemplateFormData } from '../types/workspace.types'
import type { CreateDraftRequest, DocumentType, Language } from './document-types'

/**
 * Shared draft-creation logic used by both web and mobile.
 *
 * Single source of truth for:
 *   - TEMPLATE_TO_DOC_CONFIG   — template id → API document_type / subtype
 *   - TEMPLATE_TO_SUB_TYPE     — template id → human-readable sub_type (used by the POST envelope)
 *   - CRIMINAL_TEMPLATE_IDS    — the set of templates that get a structured `config` dict
 *   - CRIMINAL_CONFIG_KEYS     — the form-field ids lifted into the `config` dict
 *   - assembleBody()           — collapses a form into the `freetext_body` prompt string
 *   - buildCreateDraftPayload()— full CreateDraftRequest, ready to POST
 */

/** Each template maps to an API document_type and (optionally) a subtype. */
export const TEMPLATE_TO_DOC_CONFIG: Record<string, { documentType: DocumentType; subtype?: string }> = {
  'notice': { documentType: 'legal_notice' },
  'demand-notice': { documentType: 'demand_notice' },
  'cheque-bounce-notice': { documentType: 'cheque_bounce_notice' },
  'eviction-notice': { documentType: 'eviction_notice' },
  'patent': { documentType: 'patent' },
  'application-draft': { documentType: 'application_draft' },
  'interim-application': { documentType: 'affidavit', subtype: 'interim_application' },
  'affidavit': { documentType: 'affidavit', subtype: 'plaint' },
  'bail-application': { documentType: 'bail_application' },
  '2nd-bail-application': { documentType: 'second_bail_application' },
  'criminal-appeal': { documentType: 'criminal_appeal' },
  'plaint': { documentType: 'application', subtype: 'plaint' },
  'written-statement': { documentType: 'written_statement' },
  'written-arguments': { documentType: 'written_arguments' },
  'writ-petition': { documentType: 'petition', subtype: 'writ_petition' },
  'slp': { documentType: 'slp' },
  'quashing-petition': { documentType: 'quashing_petition' },
  'anticipatory-bail': { documentType: 'anticipatory_bail' },
  'revision-petition': { documentType: 'revision_petition' },
  'execution-petition': { documentType: 'execution_petition' },
  'consumer-complaint': { documentType: 'consumer_complaint' },
}

/** Human-readable sub_type used in the POST envelope (outer `sub_type` field). */
export const TEMPLATE_TO_SUB_TYPE: Record<string, string> = {
  'notice': 'Legal Notice',
  'demand-notice': 'Demand Notice',
  'cheque-bounce-notice': 'Cheque Bounce Notice (Sec 138 NI Act)',
  'eviction-notice': 'Eviction Notice (Sec 106 TP Act)',
  'patent': 'Patent',
  'application-draft': 'Application',
  'interim-application': 'Interim',
  'affidavit': 'Affidavit',
  'bail-application': '1st Bail Application',
  '2nd-bail-application': '2nd Bail Application',
  'criminal-appeal': 'CriminalAppeal',
  'plaint': 'Plaint',
  'written-statement': 'WrittenStatement',
  'written-arguments': 'WrittenArguments',
  'writ-petition': 'WritPetition',
  'slp': 'SLP',
  'quashing-petition': 'QuashingPetition',
  'anticipatory-bail': 'AnticipatoryBail',
  'revision-petition': 'RevisionPetition',
  'execution-petition': 'ExecutionPetition',
  'consumer-complaint': 'ConsumerComplaint',
}

/** Templates whose form values are lifted into a structured `config` dict. */
export const CRIMINAL_TEMPLATE_IDS: readonly string[] = [
  'bail-application', '2nd-bail-application', 'criminal-appeal', 'anticipatory-bail',
  'quashing-petition', 'revision-petition', 'writ-petition', 'slp',
]

/** Form-field ids extracted into `config` for criminal templates. */
export const CRIMINAL_CONFIG_KEYS: readonly string[] = [
  'fir_details', 'criminal_history', 'bail_history', 'co_accused_details',
  'impugned_order', 'impugned_judgment', 'court_details', 'facts', 'relief_sought',
  'applicant', 'opposite_party', 'appellant', 'respondent', 'petitioner', 'grounds', 'writ_type',
  'earlier_hc_bail', 'lower_court_rejection', 'change_in_circumstances',
]

const get = (fd: TemplateFormData, key: string): string =>
  typeof fd[key] === 'string' ? (fd[key] as string) : ''

/**
 * Build the `freetext_body` prompt string the AI consumes as initial context.
 * Kept identical to the web wizard's previous behaviour.
 */
export function assembleBody(templateId: string, formData: TemplateFormData): string {
  const g = (k: string) => get(formData, k)
  switch (templateId) {
    case 'notice':
      return `Draft a Legal Notice (general / fallback). Sender (client): ${g('sender')}. Recipient: ${g('recipient')}. Subject: ${g('subject')}. Facts and demand: ${g('body')}.`.trim()
    case 'demand-notice':
      return `Draft a Demand Notice for recovery of money. Sender (client): ${g('sender')}. Recipient (debtor): ${g('recipient')}. Underlying instrument: ${g('instrument')}. Principal amount: ${g('principal_amount')}. Interest rate: ${g('interest_rate')}% p.a.. Date of default / due date: ${g('due_date')}. Prior demands: ${g('prior_demands')}. Facts of the transaction: ${g('body')}.`.trim()
    case 'cheque-bounce-notice':
      return `Draft a Section 138 NI Act statutory notice. Payee (client): ${g('sender')}. Drawer: ${g('recipient')}. Cheque: No. ${g('cheque_number')}, dated ${g('cheque_date')}, amount ${g('cheque_amount')}, drawn on ${g('drawee_bank')}, account ${g('account_number')}. Presentation date: ${g('presentation_date')}. Cheque Return Memo dated: ${g('dishonour_date')}. Reason for dishonour: ${g('dishonour_reason')}. Date client received memo: ${g('memo_received_date')}. Underlying legally enforceable debt: ${g('underlying_debt')}.`.trim()
    case 'eviction-notice':
      return `Draft an Eviction Notice under Section 106 TP Act 1882${g('state_rent_act') ? ` read with ${g('state_rent_act')}` : ''}. Landlord (client): ${g('sender')}. Tenant: ${g('recipient')}. Suit premises: ${g('premises')}. Title document: ${g('title_document')}. Tenancy commencement: ${g('tenancy_start_date')}. Mode of tenancy: ${g('tenancy_mode')}. Monthly rent: ${g('monthly_rent')}. Security deposit: ${g('security_deposit')}. Period of arrears: ${g('arrears_period')}. Total arrears: ${g('arrears_amount')}. Grounds for eviction: ${g('grounds')}. Estimated market rent (mesne profits): ${g('market_rent')}.`.trim()
    case 'patent':
      return `Draft a patent application. Applicant: ${g('applicant')}. Inventor: ${g('inventor')}. Description: ${g('description')}`.trim()
    case 'application-draft':
      return `Draft an application for applicant ${g('applicant')}. ${g('body')}`.trim()
    case 'interim-application':
      return `Draft an interim application. Plaintiff: ${g('plaintiff')}. Defendant: ${g('defendant')}. Grounds: ${g('grounds')}`.trim()
    case 'affidavit':
      return `Draft an affidavit for deponent ${g('deponent')}. Statements: ${g('statements')}`.trim()
    case 'bail-application':
      return `Draft a bail application. Applicant: ${g('applicant')}. Opposite Party: ${g('opposite_party')}. Court: ${g('court_details')}. FIR Details: ${g('fir_details')}. Facts: ${g('facts')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case '2nd-bail-application':
      return `Draft a second / subsequent bail application under Section 483 BNSS. Applicant: ${g('applicant')}. Opposite Party: ${g('opposite_party')}. Court: ${g('court_details')}. FIR Details: ${g('fir_details')}. Facts: ${g('facts')}. Earlier HC Bail (Case No., dates, outcome, Hon'ble Justice): ${g('earlier_hc_bail')}. Lower-Court Rejection (Date + Annexure No.): ${g('lower_court_rejection')}. Change in Circumstances / Fresh Grounds since earlier rejection: ${g('change_in_circumstances')}. Criminal History: ${g('criminal_history')}. Co-Accused Details: ${g('co_accused_details')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'criminal-appeal':
      return `Draft a criminal appeal. Appellant: ${g('appellant')}. Respondent: ${g('respondent')}. Court: ${g('court_details')}. Impugned Order: ${g('impugned_order')}. Facts: ${g('facts')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'plaint':
      return `Draft a civil suit plaint. Plaintiff: ${g('plaintiff')}. Defendant: ${g('defendant')}. Court: ${g('court_details')}. Cause of Action: ${g('cause_of_action')}. Facts: ${g('facts')}. Valuation: ${g('valuation')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'written-statement':
      return `Draft a written statement. Defendant: ${g('defendant')}. Plaintiff: ${g('plaintiff')}. Court: ${g('court_details')}. Preliminary Objections: ${g('preliminary_objections')}. Reply on Facts: ${g('reply_on_facts')}. Additional Pleas: ${g('additional_pleas')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'written-arguments':
      return `Draft written arguments. Party: ${g('party')}. Court: ${g('court_details')}. Case: ${g('case_details')}. Issues: ${g('issues')}. Arguments: ${g('arguments')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'writ-petition':
      return `Draft a writ petition. Nature of Writ: ${g('writ_type')}. Petitioner: ${g('petitioner')}. Respondent: ${g('respondent')}. Court: ${g('court_details')}. Impugned Order/Action: ${g('impugned_order')}. Grounds: ${g('grounds')}. Facts: ${g('facts')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'slp':
      return `Draft a Special Leave Petition under Article 136. Petitioner: ${g('petitioner')}. Respondent: ${g('respondent')}. Impugned Judgment: ${g('impugned_judgment')}. Grounds: ${g('grounds')}. Facts: ${g('facts')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'quashing-petition':
      return `Draft a petition for quashing of FIR/proceedings. Petitioner: ${g('petitioner')}. Respondent: ${g('respondent')}. Court: ${g('court_details')}. FIR Details: ${g('fir_details')}. Grounds for Quashing: ${g('grounds')}. Facts: ${g('facts')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'anticipatory-bail':
      return `Draft an anticipatory bail application. Applicant: ${g('applicant')}. Opposite Party: ${g('opposite_party')}. Court: ${g('court_details')}. FIR/Case Details: ${g('fir_details')}. Grounds: ${g('grounds')}. Facts: ${g('facts')}. Criminal History: ${g('criminal_history')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'revision-petition':
      return `Draft a revision petition. Petitioner: ${g('petitioner')}. Respondent: ${g('respondent')}. Court: ${g('court_details')}. Impugned Order: ${g('impugned_order')}. Grounds for Revision: ${g('grounds')}. Facts: ${g('facts')}. Relief Sought: ${g('relief_sought')}.`.trim()
    case 'execution-petition':
      return `Draft an execution petition. Decree Holder: ${g('decree_holder')}. Judgment Debtor: ${g('judgment_debtor')}. Court: ${g('court_details')}. Decree Details: ${g('decree_details')}. Amount Due: ${g('amount_due')}. Mode of Execution: ${g('mode_of_execution')}. Property Details: ${g('property_details')}.`.trim()
    case 'consumer-complaint':
      return `Draft a consumer complaint. Complainant: ${g('complainant')}. Opposite Party: ${g('opposite_party')}. Forum: ${g('forum_details')}. Product/Service: ${g('product_service')}. Deficiency/Defect: ${g('deficiency')}. Facts: ${g('facts')}. Loss Suffered: ${g('loss_suffered')}. Relief Sought: ${g('relief_sought')}.`.trim()
    default:
      return 'Generate a legal document based on the provided information.'
  }
}

/**
 * Convert a CreateDraftRequest into the envelope the backend /api/v1/documents expects:
 *   { document_type: "DRAFT", sub_type, case_id?, data: { ... } }
 *
 * - sub_type = request.document_type (e.g. "bail_application")
 * - If request.config has keys → input_mode "structured", spread config fields into data
 * - If file_ids present → input_mode "file"
 * - Otherwise → input_mode "freetext", include freetext_body
 */
export function buildDocumentPayload(request: CreateDraftRequest): {
  document_type: string
  sub_type: string
  data: Record<string, unknown>
} {
  const hasFiles = (request.file_ids?.length ?? 0) > 0
  const hasConfig = !!request.config && Object.keys(request.config).length > 0
  const inputMode = hasFiles ? 'file' : hasConfig ? 'structured' : 'freetext'

  return {
    document_type: 'DRAFT',
    sub_type: request.document_type,
    data: {
      title: request.title,
      document_type: request.document_type,
      input_mode: inputMode,
      ...(inputMode === 'freetext' && request.freetext_body && { freetext_body: request.freetext_body }),
      ...(inputMode === 'file' && request.file_ids?.length && { file_ids: request.file_ids }),
      ...(request.language && { language: request.language }),
      ...(hasConfig && request.config),
    },
  }
}

/** Build the full CreateDraftRequest used by workspaceApi.createDocument. */
export function buildCreateDraftPayload(
  templateId: string,
  formData: TemplateFormData,
  fileIds: string[],
  fallbackTitle?: string
): CreateDraftRequest {
  const config = TEMPLATE_TO_DOC_CONFIG[templateId] || { documentType: 'legal_notice' as DocumentType }
  const titleRaw = (typeof formData['title'] === 'string' ? (formData['title'] as string) : '').trim()
  const title = titleRaw || fallbackTitle || 'Untitled Draft'
  const body = assembleBody(templateId, formData)
  const hasFiles = fileIds.length > 0
  const language = (formData['language'] as Language | undefined) || undefined

  let draftConfig: Record<string, string> | undefined
  if (CRIMINAL_TEMPLATE_IDS.includes(templateId)) {
    const entries = CRIMINAL_CONFIG_KEYS
      .filter((key) => typeof formData[key] === 'string' && (formData[key] as string).trim().length > 0)
      .map((key) => [key, (formData[key] as string).trim()] as const)
    if (entries.length > 0) draftConfig = Object.fromEntries(entries)
  }

  return {
    title,
    document_type: config.documentType,
    input_mode: hasFiles ? 'file' : 'freetext',
    subtype: config.subtype,
    freetext_body: body.length > 0 ? body : undefined,
    file_ids: hasFiles ? fileIds : undefined,
    language,
    config: draftConfig,
  }
}
