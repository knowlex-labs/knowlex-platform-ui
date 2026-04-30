import { ChevronRight } from 'lucide-react'
import { LandingHeader } from './landing-header'
import { LandingFooter } from './landing-footer'
import { goToDashboard } from '@/lib/hosts'

const VALUES = [
  {
    title: 'Lawyers First',
    body: "Every decision starts with the advocate. We build tools that save real time in real courtrooms — not demos that impress in pitch decks. If it doesn't help a lawyer serve their client better, we don't build it.",
  },
  {
    title: 'Ownership over Roles',
    body: "We hire builders, not role boxes. You'll scope the problem, ship the solution, measure impact, and iterate end to end. Titles matter less than accountability and what you actually get done.",
  },
  {
    title: 'Velocity with Craft',
    body: "We move fast in small, reversible steps — shipping weekly and refining daily. Speed isn't sloppy: we pair rapid iteration with clear standards, thoughtful design, and honest code reviews.",
  },
  {
    title: 'Truth & Precision',
    body: "In law, accuracy is non-negotiable. We build systems that cite their sources, admit their limits, and earn trust over time. We prefer data over hype and auditability over shortcuts.",
  },
]

export function CareersPage() {
  const scrollToRoles = () => {
    document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white force-light flex flex-col">
      <LandingHeader onSignIn={() => goToDashboard('/login')} />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 sm:py-28 px-4 text-center bg-[#fdf6ec]">
          <h1 className="text-4xl sm:text-5xl font-serif font-semibold text-gray-900 mb-5 leading-tight max-w-2xl mx-auto">
            Be part of something that matters
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            We're building AI tools for Indian advocates — to help them draft faster, research
            smarter, and serve their clients better. Join a small, focused team that cares about
            access to justice.
          </p>
          <button
            onClick={scrollToRoles}
            className="inline-flex items-center gap-2 bg-kx-primary-600 text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-kx-primary-700 transition-colors"
          >
            View open positions
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>

        {/* Core Values */}
        <section className="py-16 sm:py-20 px-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-serif font-semibold text-gray-900 text-center mb-12">
            Our Core Values
          </h2>
          <div className="space-y-10">
            {VALUES.map((v) => (
              <div key={v.title}>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-500 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Roles */}
        <section id="open-roles" className="py-16 sm:py-20 px-4 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-serif font-semibold text-gray-900 mb-4">Open Roles</h2>
            <p className="text-gray-500 mb-10 leading-relaxed max-w-lg mx-auto">
              We're a small, focused team. When we hire, we look for people who care deeply about
              the legal profession and love building products that make a real difference.
            </p>

            <div className="bg-white border border-gray-200 rounded-2xl px-8 py-12 text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">No open positions right now</p>
              <p className="text-sm text-gray-500">
                We're heads-down building. Check back soon.
              </p>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
