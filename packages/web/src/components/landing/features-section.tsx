import { FileText, Scale, Users, Languages } from 'lucide-react'
import { FeatureShowcase } from './feature-showcase'
import { DraftPanel } from './mockup-panels/draft-panel'
import { ResearchPanel } from './mockup-panels/research-panel'
import { CaseListPanel } from './mockup-panels/case-list-panel'
import { TranslationPanel } from './mockup-panels/translation-panel'

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
            iconBg="bg-red-100"
            iconColor="text-red-800"
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
            iconBg="bg-orange-100"
            iconColor="text-orange-700"
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

          <FeatureShowcase
            title="Document Translation"
            description="Translate legal documents between English and major Indian languages instantly. Hindi, Tamil, Telugu, Kannada, and more — with AI precision."
            bullets={[
              'Supports PDF, DOCX, and TXT files',
              'Translates to and from 10 Indian languages',
              'Preserves legal terminology and formatting',
            ]}
            icon={Languages}
            iconBg="bg-teal-100"
            iconColor="text-teal-600"
            mockup={<TranslationPanel />}
            reversed
          />
        </div>
      </div>
    </section>
  )
}
