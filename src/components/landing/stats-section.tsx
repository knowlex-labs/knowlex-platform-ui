import { Users, FileText, Building2, Search } from 'lucide-react'
import { useCountUp } from '@/hooks/use-count-up'

const stats = [
  { icon: Users, target: 500, suffix: '+', label: 'Lawyers Trust Us' },
  { icon: FileText, target: 10000, suffix: '+', label: 'Documents Drafted' },
  { icon: Building2, target: 50, suffix: '+', label: 'Law Firms' },
  { icon: Search, target: 25000, suffix: '+', label: 'Research Queries' },
]

function StatItem({ icon: Icon, target, suffix, label }: typeof stats[number]) {
  const { ref, display } = useCountUp({ target, suffix })

  return (
    <div ref={ref} className="flex flex-col items-center text-center py-6">
      <Icon className="w-7 h-7 text-indigo-300 mb-3" />
      <span className="text-3xl sm:text-4xl font-serif font-bold text-white mb-1">
        {display}
      </span>
      <span className="text-sm text-indigo-200">{label}</span>
    </div>
  )
}

export function StatsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="bg-[#16103a] rounded-2xl sm:rounded-3xl p-8 sm:p-12">
          <h3 className="text-xl sm:text-2xl font-serif font-semibold text-white mb-8 text-center">
            Trusted by legal professionals across India
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <StatItem key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
