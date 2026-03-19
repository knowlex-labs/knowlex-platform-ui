import { useBlogs } from '@/hooks/use-blogs'
import { BlogCard } from '@/components/blog/blog-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function BlogListPage() {
  const { blogs, isLoading, error, pagination, setPage } = useBlogs()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-serif font-bold text-kx-text-primary">Knowlex Blogs</h1>
        <p className="mt-3 text-lg text-kx-text-secondary">
          Insights on legal technology, case management, and more
        </p>
      </div>

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-ledger-200 overflow-hidden">
              <Skeleton className="aspect-[16/9]" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-kx-text-secondary">No blog posts found.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map(blog => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
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
        </>
      )}
    </div>
  )
}
