export function AboutSection() {
  return (
    <section id="about" className="relative py-12 sm:py-16 md:py-24">
      {/* Global overlay handles background darkening */}

      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Built for Indian Law Firms
          </h2>
          <p className="text-base sm:text-lg text-gray-900 mb-4 sm:mb-6">
            Knowlex is designed to address the unique challenges faced by legal professionals in India.
            From managing high volumes of cases to navigating complex court schedules, we understand
            the demands of your practice.
          </p>
        </div>
      </div>
    </section>
  )
}
