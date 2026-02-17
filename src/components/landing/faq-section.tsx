import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

const faqs = [
  {
    question: 'What is Knowlex?',
    answer:
      'Knowlex is an AI-powered legal practice management platform built specifically for Indian lawyers. It helps you manage clients, cases, deadlines, and documents — and uses AI to assist with legal research and drafting.',
  },
  {
    question: 'How does AI-assisted drafting work?',
    answer:
      'You select a document template (petition, reply, application, etc.), provide the key facts, and our AI generates a court-ready draft with relevant legal provisions and case citations. You can review, edit, and finalize the document before downloading.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. All data is encrypted in transit and at rest. We follow industry-standard security practices and never share your client data with third parties. Your documents and case information remain private to your account.',
  },
  {
    question: 'Which courts and jurisdictions are supported?',
    answer:
      'Knowlex currently supports drafting and research for the Supreme Court of India, High Courts, and District Courts. We are continuously expanding our coverage to include tribunals and other specialized forums.',
  },
  {
    question: 'Can I try Knowlex for free?',
    answer:
      'Absolutely. Our Basic plan is free and includes core case management features for up to 10 clients. You can upgrade to Pro anytime for unlimited clients, AI-assisted drafting, and priority support.',
  },
  {
    question: 'How do I get support?',
    answer:
      'You can reach us at nakul.jain@getknowlex.com or through the in-app chat. Pro and Enterprise customers receive priority support with faster response times.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, isVisible } = useScrollReveal()

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-kx-text-primary mb-3 sm:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-kx-text-secondary max-w-2xl mx-auto">
            Everything you need to know about Knowlex.
          </p>
        </div>

        <div
          ref={ref}
          className={`divide-y divide-[#16103a]/15 scroll-reveal ${isVisible ? 'is-visible' : ''}`}
        >
          {faqs.map((faq, index) => (
            <div key={index} className="border-[#16103a]/15 first:border-t">
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between py-5 sm:py-6 text-left gap-4"
              >
                <span className="text-sm sm:text-base font-medium text-kx-text-primary">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-[#16103a]/40 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96 pb-5 sm:pb-6' : 'max-h-0'
                }`}
              >
                <p className="text-sm sm:text-base text-kx-text-secondary leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
