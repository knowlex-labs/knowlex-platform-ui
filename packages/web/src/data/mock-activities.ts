// Mock data for activities (demo purposes)

import type { Activity } from '@knowlex/core/types'

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

export function getMockActivities(_clientId: string): Activity[] {
  // In a real implementation, this would be filtered by clientId
  return sampleActivities
}
