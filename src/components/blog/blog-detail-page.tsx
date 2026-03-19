import { useParams, Link } from 'react-router-dom'
import { useBlogDetail } from '@/hooks/use-blog-detail'
import { MarkdownRenderer } from '@/components/ai-research/markdown-renderer'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { blog, isLoading, error } = useBlogDetail(slug)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-5 w-1/3 mb-8" />
        <Skeleton className="aspect-[16/9] rounded-xl mb-8" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-red-600 dark:text-red-400">{error || 'Blog post not found.'}</p>
        <Link to="/blogs" className="mt-4 inline-block text-kx-primary-600 hover:underline">
          Back to Blogs
        </Link>
      </div>
    )
  }

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/blogs"
        className="inline-flex items-center text-sm text-kx-text-secondary hover:text-kx-primary-600 transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Blogs
      </Link>

      <h1 className="text-3xl sm:text-4xl font-serif font-bold text-kx-text-primary leading-tight">
        {blog.title}
      </h1>

      <div className="flex items-center gap-4 mt-4 text-sm text-kx-text-secondary">
        {formattedDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
        )}
        {blog.readTimeMinutes > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {blog.readTimeMinutes} min read
          </span>
        )}
      </div>

      {/* Cover image */}
      {blog.coverImageUrl ? (
        <div className="mt-8 rounded-xl overflow-hidden">
          <img
            src={blog.coverImageUrl}
            alt={blog.title}
            className="w-full object-cover"
          />
        </div>
      ) : (
        <div className="mt-8 rounded-xl overflow-hidden aspect-[16/9] bg-gradient-to-br from-kx-primary-100 to-kx-primary-200 dark:from-kx-primary-900 dark:to-kx-primary-800" />
      )}

      <div className="mt-8 prose prose-lg dark:prose-invert max-w-none">
        <MarkdownRenderer content={blog.content} />
      </div>

      {blog.tags.length > 0 && (
        <div className="mt-10 pt-6 border-t border-ledger-200 dark:border-ledger-800">
          <div className="flex flex-wrap gap-2">
            {blog.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium rounded-full bg-ledger-100 dark:bg-ledger-800 text-kx-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
