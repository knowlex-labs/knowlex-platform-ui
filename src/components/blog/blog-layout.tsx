import { Link, Outlet } from 'react-router-dom'

export function BlogLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-ledger-950">
      <header className="border-b border-ledger-200 dark:border-ledger-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo/knowlex_logo.png" alt="Knowlex" className="h-8 w-auto dark:invert" />
              <span className="text-xl font-serif font-bold text-kx-text-primary tracking-tight">Knowlex</span>
            </Link>
            <span className="text-ledger-400 dark:text-ledger-600">|</span>
            <Link to="/blogs" className="text-lg font-medium text-kx-text-secondary hover:text-kx-text-primary transition-colors">
              Blogs
            </Link>
          </div>
          <div />
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-ledger-200 dark:border-ledger-800 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-kx-text-secondary">
          &copy; {new Date().getFullYear()} Knowlex. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
