import { Linkedin } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

const team = [
  {
    name: 'Nakul Jain',
    role: 'Co-Founder',
    focus: 'Tech & Operations',
    bio: 'Software Engineer at Raga AI. Computer Science graduate from IIT Kanpur. Has built products across AI, gaming, and multiple startups. Wants to use technology to solve problems that matter.',
    image: '/team/nakul.jpg',
    linkedin: 'https://www.linkedin.com/in/nakul-jain-453976b1/',
  },
  {
    name: 'Adv. Vaibhavi Jain',
    role: 'Co-Founder',
    focus: 'Product & Sales',
    bio: 'Practicing Advocate with a Masters in Law. Has seen the challenges lawyers face every day and is building tools that actually help them and the people they serve.',
    image: '/team/vaibhavi.jpg',
    linkedin: 'https://www.linkedin.com/in/vaibhavijain/',
  },
]

export function TeamSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="team" className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-[#fdf6ec] via-[#fefaf3] to-[#fdf6ec] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-10 sm:mb-14"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-kx-primary-600 mb-3">
            Team
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary leading-tight">
            The people behind Knowlex
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 max-w-4xl mx-auto">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-ledger-gray-200 text-center"
            >
              <div className="w-32 h-32 sm:w-36 sm:h-36 bg-ledger-gray-200 rounded-full mx-auto mb-5 overflow-hidden ring-4 ring-amber-100">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `<span class="flex items-center justify-center w-full h-full text-3xl font-serif font-semibold text-ledger-gray-500">${member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}</span>`
                  }}
                />
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-kx-text-primary mb-1">
                {member.name}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-kx-primary-600 mb-4">
                {member.role} · {member.focus}
              </p>
              <p className="text-sm sm:text-base text-kx-text-secondary mb-4 max-w-sm mx-auto leading-relaxed">
                {member.bio}
              </p>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-kx-text-secondary hover:text-kx-primary-600 transition-colors"
              >
                <Linkedin size={16} />
                LinkedIn
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
