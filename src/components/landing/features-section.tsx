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
            description="Generate court-ready legal documents in minutes. Our AI understands Indian legal formats and automatically includes relevant provisions and case citations."
            bullets={[
              'AI-powered drafting with relevant legal provisions',
              'Adapts to different court formats automatically',
              'Smart suggestions as you type',
            ]}
            icon={FileText}
            iconBg="bg-kx-primary-100"
            iconColor="text-kx-primary-600"
            mockup={<DraftPanel />}
          />

          <FeatureShowcase
            title="Legal Research"
            description="Find relevant case law and statutes instantly. Search in natural language and get jurisdiction-specific results with cited authorities."
            bullets={[
              'Case law search with cited authorities',
              'Jurisdiction-specific results',
              'Natural language queries',
            ]}
            icon={Scale}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
            mockup={<ResearchPanel />}
            reversed
          />

          <FeatureShowcase
            title="Client Management"
            description="Keep all your clients, cases, and deadlines organized in one place. Never miss a court date or filing deadline again."
            bullets={[
              'All clients and cases in one place',
              'Track case status and timelines',
              'Never miss a court date',
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
