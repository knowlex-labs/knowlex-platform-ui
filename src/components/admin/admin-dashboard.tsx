import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-serif font-bold text-kx-text-primary mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/admin/blog"
          className="group rounded-xl border border-ledger-200 bg-white p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-kx-primary-100">
              <FileText className="h-5 w-5 text-kx-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-kx-text-primary group-hover:text-kx-primary-600 transition-colors">
              Manage Blog
            </h2>
          </div>
          <p className="text-sm text-kx-text-secondary">
            Create, edit, and manage blog posts
          </p>
        </Link>
      </div>
    </div>
  )
}
