import { Link } from 'react-router-dom'
import type { BlogListItem } from '@/types'
import { Calendar, Clock } from 'lucide-react'

interface BlogCardProps {
  blog: BlogListItem
}

export function BlogCard({ blog }: BlogCardProps) {
  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <Link
      to={`/blogs/${blog.slug}`}
      className="group block rounded-xl border border-ledger-200 dark:border-ledger-800 bg-white dark:bg-ledger-900 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {blog.coverImageUrl ? (
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={blog.coverImageUrl}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-kx-primary-100 to-kx-primary-200 dark:from-kx-primary-900 dark:to-kx-primary-800" />
      )}
      <div className="p-5">
        <h3 className="text-lg font-serif font-semibold text-kx-text-primary group-hover:text-kx-primary-600 transition-colors line-clamp-2">
          {blog.title}
        </h3>
        <p className="mt-2 text-sm text-kx-text-secondary line-clamp-2">
          {blog.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-kx-text-secondary">
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
          )}
          {blog.readTimeMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {blog.readTimeMinutes} min read
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
