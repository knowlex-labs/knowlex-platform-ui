import { FileText, Scale, Users } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Drafting Assistant',
    description: 'AI-powered drafting with relevant legal provisions and case laws. Adapts to different court formats.',
  },
  {
    icon: Scale,
    title: 'Legal Research',
    description: 'Case law search with cited authorities. Jurisdiction-specific results you can trust.',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Manage all your clients and cases in one place. Simple and organized.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-12 sm:py-16 md:py-24 bg-ledger-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-ledger-black mb-3 sm:mb-4">
            Features
          </h2>
          <p className="text-base sm:text-lg text-ledger-gray-600 max-w-2xl mx-auto">
            Everything you need to run your legal practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-ledger-white p-5 sm:p-6 md:p-8 rounded-lg border border-ledger-gray-200"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-ledger-gray-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-ledger-black" />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-ledger-black mb-2 sm:mb-3">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-ledger-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
