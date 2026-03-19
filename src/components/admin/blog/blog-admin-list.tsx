import { Link } from 'react-router-dom'
import { useAdminBlogs } from '@/hooks/use-admin-blogs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

export function BlogAdminList() {
  const { blogs, isLoading, error, pagination, setPage, deleteBlog } = useAdminBlogs()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await deleteBlog(id)
    } catch {
      // error is handled by hook
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-kx-text-primary">Blog Posts</h1>
        <Link to="/admin/blog/new">
          <Button className="bg-kx-primary-600 hover:bg-kx-primary-700 text-white">
            <Plus className="h-4 w-4 mr-1" />
            New Post
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 p-3 text-sm text-red-900 dark:text-red-400 mb-4">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-ledger-200 dark:border-ledger-800 bg-white dark:bg-ledger-900 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ledger-200 dark:border-ledger-800 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-kx-text-secondary">Title</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-kx-text-secondary hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-kx-text-secondary hidden md:table-cell">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-kx-text-secondary hidden lg:table-cell">Published</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-kx-text-secondary text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ledger-100 dark:divide-ledger-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-48" /></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                </tr>
              ))
            ) : blogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-kx-text-secondary">
                  No blog posts yet. Create your first post!
                </td>
              </tr>
            ) : (
              blogs.map(blog => (
                <tr key={blog.id} className="hover:bg-ledger-50 dark:hover:bg-ledger-800/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-kx-text-primary truncate max-w-xs">{blog.title}</div>
                    <div className="text-xs text-kx-text-secondary mt-0.5">/{blog.slug}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm text-kx-text-secondary">{blog.category}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                      blog.status === 'published'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                    }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-kx-text-secondary">
                    {blog.publishedAt
                      ? new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/admin/blog/${blog.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(blog.id, blog.title)}
                        disabled={deletingId === blog.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 0}
            onClick={() => setPage(pagination.page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-kx-text-secondary">
            Page {pagination.page + 1} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages - 1}
            onClick={() => setPage(pagination.page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
