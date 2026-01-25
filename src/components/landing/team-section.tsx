import { Linkedin } from 'lucide-react'

const team = [
  {
    name: 'Nakul Jain',
    role: 'Co-Founder',
    description: 'Tech & Operations',
    credentials: 'Software Engineer, IITK Alum',
    image: '/team/nakul.jpg',
    linkedin: 'https://www.linkedin.com/in/nakul-jain-453976b1/',
  },
  {
    name: 'Adv. Vaibhavi Jain',
    role: 'Co-Founder',
    description: 'Product & Sales',
    credentials: 'Advocate, PhD Student',
    image: '/team/vaibhavi.jpg',
    linkedin: 'https://www.linkedin.com/in/vaibhavijain/',
  },
]

export function TeamSection() {
  return (
    <section id="team" className="py-16 md:py-24 bg-ledger-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-ledger-black mb-4">
            Team
          </h2>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-12 md:gap-16">
          {team.map((member) => (
            <div
              key={member.name}
              className="text-center"
            >
              <div className="w-48 h-48 md:w-56 md:h-56 bg-ledger-gray-200 rounded-full mx-auto mb-6 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `<span class="flex items-center justify-center w-full h-full text-4xl font-serif font-semibold text-ledger-gray-600">${member.name.split(' ').map(n => n[0]).join('')}</span>`
                  }}
                />
              </div>
              <h3 className="text-xl font-serif font-semibold text-ledger-black mb-1">
                {member.name}
              </h3>
              <p className="text-sm font-medium text-ledger-gray-500 mb-1">
                {member.role} · {member.description}
              </p>
              <p className="text-sm text-ledger-gray-500 mb-3">
                {member.credentials}
              </p>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-ledger-gray-500 hover:text-ledger-black transition-colors"
              >
                <Linkedin size={16} />
                LinkedIn
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
