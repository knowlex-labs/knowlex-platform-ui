export function AboutSection() {
  return (
    <section id="about" className="py-12 sm:py-16 md:py-24 bg-ledger-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-semibold text-ledger-black mb-4 sm:mb-6">
            Built for Indian Law Firms
          </h2>
          <p className="text-base sm:text-lg text-ledger-gray-600 mb-4 sm:mb-6">
            Knowlex is designed to address the unique challenges faced by legal professionals in India.
            From managing high volumes of cases to navigating complex court schedules, we understand
            the demands of your practice.
          </p>
          <p className="text-base sm:text-lg text-ledger-gray-600">
            Our platform combines modern technology with deep understanding of Indian legal workflows,
            helping you focus on what matters most — serving your clients and growing your practice.
          </p>
        </div>
      </div>
    </section>
  )
}
