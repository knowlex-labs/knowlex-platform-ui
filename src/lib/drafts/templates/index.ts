/**
 * Draft Template Renderers
 * 
 * Each legal draft type has its own specific formatting requirements.
 * This module exports template-specific renderers that transform raw
 * content into properly formatted HTML for legal documents.
 */

export { renderInterimApplication } from './interim-application'
export { renderNotice } from './notice'
export { renderAffidavit } from './affidavit'
export { renderPatent } from './patent'
export { renderApplicationDraft } from './application-draft'

// Common utilities shared across templates
export { escapeHtml, renderInline } from './common'

// Template type to renderer mapping
import { renderInterimApplication } from './interim-application'
import { renderNotice } from './notice'
import { renderAffidavit } from './affidavit'
import { renderPatent } from './patent'
import { renderApplicationDraft } from './application-draft'
import { renderGenericDraft } from './common'

export type DraftTemplateType =
    | 'interim-application'
    | 'notice'
    | 'affidavit'
    | 'patent'
    | 'application-draft'
    | 'legal_notice'
    | 'application'
    | 'bail_application'
    | 'bail-application'
    | 'criminal_appeal'
    | 'criminal-appeal'
    | 'slp'
    | 'quashing_petition'
    | 'quashing-petition'
    | 'anticipatory_bail'
    | 'anticipatory-bail'
    | 'revision_petition'
    | 'revision-petition'
    | 'execution_petition'
    | 'execution-petition'
    | 'consumer_complaint'
    | 'consumer-complaint'
    | 'written_statement'
    | 'written-statement'
    | 'written_arguments'
    | 'written-arguments'
    | 'application_draft'

export const templateRenderers: Record<string, (content: string) => string> = {
    // Interim Application variations
    'interim-application': renderInterimApplication,
    'interim_application': renderInterimApplication,
    'affidavit_interim': renderInterimApplication,
    'affidavit-interim': renderInterimApplication,
    'interim': renderInterimApplication,

    // Notice variations
    'notice': renderNotice,
    'legal_notice': renderNotice,
    'legal-notice': renderNotice,
    'demand_notice': renderNotice,
    'demand-notice': renderNotice,

    // Affidavit variations  
    'affidavit': renderAffidavit,

    // Patent variations
    'patent': renderPatent,
    'patent_application': renderPatent,
    'patent-application': renderPatent,

    // Application variations
    'application-draft': renderApplicationDraft,
    'application': renderApplicationDraft,
    'petition': renderApplicationDraft,
    'contract': renderApplicationDraft,
    'agreement': renderApplicationDraft,

    // Criminal - Bail Application
    'bail_application': renderApplicationDraft,
    'bail-application': renderApplicationDraft,

    // Criminal - Criminal Appeal
    'criminal_appeal': renderApplicationDraft,
    'criminal-appeal': renderApplicationDraft,

    // New specific document types
    'slp': renderApplicationDraft,
    'quashing_petition': renderApplicationDraft,
    'quashing-petition': renderApplicationDraft,
    'anticipatory_bail': renderApplicationDraft,
    'anticipatory-bail': renderApplicationDraft,
    'revision_petition': renderApplicationDraft,
    'revision-petition': renderApplicationDraft,
    'execution_petition': renderApplicationDraft,
    'execution-petition': renderApplicationDraft,
    'consumer_complaint': renderApplicationDraft,
    'consumer-complaint': renderApplicationDraft,
    'written_statement': renderApplicationDraft,
    'written-statement': renderApplicationDraft,
    'written_arguments': renderApplicationDraft,
    'written-arguments': renderApplicationDraft,
    'application_draft': renderApplicationDraft,
}

/**
 * Get the appropriate renderer for a given template/document type.
 * Falls back to generic renderer if no specific template is found.
 */
export function getTemplateRenderer(templateType: string): (content: string) => string {
    const renderer = templateRenderers[templateType.toLowerCase()]
    return renderer || renderGenericDraft
}
