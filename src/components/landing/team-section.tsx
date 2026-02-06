import { Linkedin } from 'lucide-react'

const team = [
  {
    name: 'Nakul Jain',
    role: 'Co-Founder',
    focus: 'Tech & Operations',
    bio: 'Nakul is a Software Engineer at Raga AI and a Computer Science graduate from IIT Kanpur. He has built products across AI, gaming, and multiple startups. He wants to use technology to solve problems that matter.',
    image: '/team/nakul.jpg',
    linkedin: 'https://www.linkedin.com/in/nakul-jain-453976b1/',
  },
  {
    name: 'Adv. Vaibhavi Jain',
    role: 'Co-Founder',
    focus: 'Product & Sales',
    bio: 'Vaibhavi is a practicing Advocate with a Masters in Law. She has seen the challenges lawyers face every day and wants to build tools that actually help them and the people they serve.',
    image: '/team/vaibhavi.jpg',
    linkedin: 'https://www.linkedin.com/in/vaibhavijain/',
  },
]

export function TeamSection() {
  return (
    <section id="team" className="py-12 sm:py-16 md:py-24 bg-ledger-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-ledger-black mb-3 sm:mb-4">
            Team
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 max-w-4xl mx-auto">
          {team.map((member) => (
            <div
              key={member.name}
              className="text-center"
            >
              <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 bg-ledger-gray-200 rounded-full mx-auto mb-4 sm:mb-6 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `<span class="flex items-center justify-center w-full h-full text-3xl sm:text-4xl font-serif font-semibold text-ledger-gray-600">${member.name.split(' ').map(n => n[0]).join('')}</span>`
                  }}
                />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-ledger-black mb-1">
                {member.name}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-ledger-gray-500 mb-3 sm:mb-4">
                {member.role} · {member.focus}
              </p>
              <p className="text-sm sm:text-base text-ledger-gray-600 mb-4 max-w-sm mx-auto leading-relaxed">
                {member.bio}
              </p>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-ledger-gray-500 hover:text-ledger-black transition-colors"
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
