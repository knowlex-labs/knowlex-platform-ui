import { FileText, Scale, Users } from 'lucide-react'
import { FeatureShowcase } from './feature-showcase'
import { DraftPanel } from './mockup-panels/draft-panel'
import { ResearchPanel } from './mockup-panels/research-panel'
import { CaseListPanel } from './mockup-panels/case-list-panel'

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 sm:py-20 md:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12 sm:mb-16 md:mb-24">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-3 sm:mb-4">
            Everything you need to practice law
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary max-w-2xl mx-auto">
            Powerful tools designed specifically for Indian legal professionals.
          </p>
        </div>

        <div className="space-y-24 md:space-y-32">
          <FeatureShowcase
            title="Drafting Assistant"
            description="Generate court-ready legal documents from predefined templates. Citations and provisions auto-sourced — no manual lookup needed."
            bullets={[
              'Choose from predefined legal document templates',
              'Adapts to different court formats automatically',
              'Edit yourself or refine sections with AI assistance',
            ]}
            icon={FileText}
            iconBg="bg-kx-primary-100"
            iconColor="text-kx-primary-600"
            mockup={<DraftPanel />}
          />

          <FeatureShowcase
            title="Legal Research"
            description="Search across your uploaded documents and our curated judgements database in one query. Every answer cited to its source."
            bullets={[
              'Natural language queries across all courts',
              'Every answer cited to the source judgement',
              'Search your own docs and the knowledge base together',
            ]}
            icon={Scale}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
            mockup={<ResearchPanel />}
            reversed
          />

          <FeatureShowcase
            title="Client & Case Management"
            description="Organize clients, cases, and deadlines in one place. Link drafts and research to specific cases so nothing falls through the cracks."
            bullets={[
              'All clients, cases, and deadlines in one dashboard',
              'Drafts and research linked to their case automatically',
              'Never miss a court date or filing deadline',
            ]}
            icon={Users}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            mockup={<CaseListPanel />}
          />
        </div>
      </div>
    </section>
  )
}
