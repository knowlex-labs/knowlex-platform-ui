import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'

const faqs = [
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
      'Knowlex currently supports drafting and research for the Supreme Court of India and the Madhya Pradesh High Court. We are continuously expanding our coverage to include more High Courts, District Courts, and specialized tribunals.',
  },
  {
    question: 'What happens if I exceed my monthly draft limit?',
    answer:
      'Additional drafts beyond your plan quota are charged at ₹10 per draft. If you regularly exceed your limit, upgrading to a higher plan is more cost-effective. Enterprise customers can negotiate volume draft bundles and custom per-draft pricing.',
  },
  {
    question: 'How do I get support?',
    answer:
      'You can reach us at nakul.jain@getknowlex.com. Pro customers receive email support and Premium customers receive priority support with faster response times. Enterprise customers get dedicated support as part of their contract.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const { ref, isVisible } = useScrollReveal()

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-12 sm:py-16 md:py-24 bg-ledger-gray-50">
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
          className={`divide-y divide-kx-primary-950/15 scroll-reveal ${isVisible ? 'is-visible' : ''}`}
        >
          {faqs.map((faq, index) => (
            <div key={index} className="border-kx-primary-950/15 first:border-t">
              <button
                onClick={() => toggle(index)}
                className="w-full flex items-center justify-between py-5 sm:py-6 text-left gap-4"
              >
                <span className="text-sm sm:text-base font-medium text-kx-text-primary">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-kx-primary-950/40 flex-shrink-0 transition-transform duration-200 ${
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
