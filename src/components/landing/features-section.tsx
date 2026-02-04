import { FileText, Scale, Users } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Drafting Assistant',
    description: 'Generate court-ready legal documents powered by AI.',
    bullets: [
      'Auto-cites relevant IPC sections, BNS provisions, and case laws',
      'Supports formats for District Courts, High Courts, and Supreme Court',
      'Draft petitions, applications, replies, and legal notices',
    ],
  },
  {
    icon: Scale,
    title: 'Legal Research',
    description: 'Find case laws and statutes across Indian jurisdictions in seconds.',
    bullets: [
      'Search by citation, topic, or legal question',
      'Get relevant judgments with cited authorities and headnotes',
      'Filter by court, year, bench strength, and jurisdiction',
    ],
  },
  {
    icon: Users,
    title: 'Client & Case Management',
    description: 'Organize your entire practice — clients, cases, deadlines — in one place.',
    bullets: [
      'Track case status, next hearing dates, and court details',
      'Maintain client records with linked cases and documents',
      'Never miss a deadline with timeline tracking',
    ],
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-12 sm:py-16 md:py-24">
      {/* Overlay handled globally by LandingPage */}

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 drop-shadow-md">
            Features
          </h2>
          <p className="text-base sm:text-lg text-gray-900 max-w-2xl mx-auto">
            Everything you need to run your legal practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-5 sm:p-6 md:p-8 rounded-2xl border border-gray-900/20 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="w-12 h-12 bg-gray-900/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gray-900/20 transition-colors">
                <feature.icon className="w-6 h-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-base text-gray-900 mb-5 leading-relaxed">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm text-gray-900/90 group-hover:text-gray-900 transition-colors">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-900" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
