// Mock data for activities and AI research
// These will show with a "Demo Data" badge in the UI until real APIs are available

import type { Activity, AIResearchItem } from '@knowlex/core/types'

// Sample activities that can be used for any client (demo purposes)
const sampleActivities: Activity[] = [
  {
    id: 'demo-act-1',
    type: 'hearing',
    title: 'Preliminary Hearing Scheduled',
    description: 'Preliminary hearing set for case proceedings.',
    date: new Date('2026-01-20'),
    metadata: { note: 'Demo data' },
  },
  {
    id: 'demo-act-2',
    type: 'document',
    title: 'Case Documents Filed',
    description: 'Required documentation submitted to the court.',
    date: new Date('2026-01-15'),
  },
  {
    id: 'demo-act-3',
    type: 'research',
    title: 'Legal Research Completed',
    description: 'AI-powered research on relevant case precedents.',
    date: new Date('2026-01-10'),
  },
  {
    id: 'demo-act-4',
    type: 'communication',
    title: 'Client Meeting Notes',
    description: 'Discussion of case strategy and next steps.',
    date: new Date('2026-01-05'),
  },
]

const sampleAIResearch: AIResearchItem[] = [
  {
    id: 'demo-res-1',
    title: 'Relevant Case Precedents',
    summary:
      'Analysis of similar cases with favorable outcomes. Key arguments and legal principles identified.',
    relevance: 'high',
    source: 'Legal Research AI',
    createdAt: new Date('2026-01-10'),
    tags: ['Precedents', 'Case Law'],
  },
  {
    id: 'demo-res-2',
    title: 'Regulatory Framework Analysis',
    summary:
      'Overview of applicable laws and regulations relevant to this case type.',
    relevance: 'medium',
    source: 'Knowlex Database',
    createdAt: new Date('2026-01-08'),
    tags: ['Regulations', 'Compliance'],
  },
]

export function getMockActivities(_clientId: string): Activity[] {
  // In a real implementation, this would be filtered by clientId
  // For now, return the same sample data for all clients
  return sampleActivities
}

export function getMockAIResearch(_clientId: string): AIResearchItem[] {
  // In a real implementation, this would be filtered by clientId
  // For now, return the same sample data for all clients
  return sampleAIResearch
}
