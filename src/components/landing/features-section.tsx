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
    <section id="features" className="py-12 sm:py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-3 sm:mb-4">
            Features
          </h2>
          <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto">
            Everything you need to run your legal practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-5 sm:p-6 md:p-8 rounded-xl border border-gray-200 hover:border-gray-300 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-700 mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-500/60" />
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
