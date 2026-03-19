import * as React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBlogForm } from '@/hooks/use-blog-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TagInput } from '@/components/admin/blog/tag-input'
import { CoverImageUpload } from '@/components/admin/blog/cover-image-upload'
import { MarkdownRenderer } from '@/components/ai-research/markdown-renderer'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Save } from 'lucide-react'

export function BlogFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    formData,
    updateField,
    setSlugManually,
    uploadCoverImage,
    removeCoverImage,
    coverPreviewUrl,
    save,
    isLoading,
    isSaving,
    error,
    isEdit,
  } = useBlogForm(id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await save()
    if (result) {
      navigate('/admin/blog')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/blog')}
        className="inline-flex items-center text-sm text-kx-text-secondary hover:text-kx-primary-600 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Posts
      </button>

      <h1 className="text-2xl font-serif font-bold text-kx-text-primary mb-6">
        {isEdit ? 'Edit Post' : 'New Post'}
      </h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - left column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => updateField('title', e.target.value)}
                placeholder="Blog post title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={e => setSlugManually(e.target.value)}
                placeholder="blog-post-slug"
                required
              />
              <p className="text-xs text-kx-text-secondary">Auto-generated from title. Edit to override.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={e => updateField('excerpt', e.target.value)}
                placeholder="A brief summary of the post"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Content (Markdown)</Label>
              <Tabs defaultValue="write">
                <TabsList>
                  <TabsTrigger value="write">Write</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write">
                  <Textarea
                    value={formData.content}
                    onChange={e => updateField('content', e.target.value)}
                    placeholder="Write your blog post in markdown..."
                    rows={20}
                    className="font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="rounded-lg border border-ledger-200 p-6 min-h-[300px] prose max-w-none">
                    {formData.content ? (
                      <MarkdownRenderer content={formData.content} />
                    ) : (
                      <p className="text-kx-text-secondary italic">Nothing to preview yet.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar - right column */}
          <div className="space-y-6">
            <div className="rounded-xl border border-ledger-200 bg-white p-4 space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateField('status', 'DRAFT')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      formData.status === 'DRAFT'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-ledger-100 text-kx-text-secondary hover:bg-ledger-200'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('status', 'PUBLISHED')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      formData.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-ledger-100 text-kx-text-secondary hover:bg-ledger-200'
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={e => updateField('category', e.target.value)}
                  placeholder="e.g. Legal Tech"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <TagInput
                  tags={formData.tags}
                  onChange={tags => updateField('tags', tags)}
                />
              </div>
            </div>

            <div className="rounded-xl border border-ledger-200 bg-white p-4 space-y-2">
              <Label>Cover Image</Label>
              <CoverImageUpload
                previewUrl={coverPreviewUrl}
                onUpload={uploadCoverImage}
                onRemove={removeCoverImage}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-kx-primary-600 hover:bg-kx-primary-700 text-white"
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Saving...' : isEdit ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
