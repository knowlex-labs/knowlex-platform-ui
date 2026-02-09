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
}

/**
 * Get the appropriate renderer for a given template/document type.
 * Falls back to generic renderer if no specific template is found.
 */
export function getTemplateRenderer(templateType: string): (content: string) => string {
    const renderer = templateRenderers[templateType.toLowerCase()]
    return renderer || renderGenericDraft
}
