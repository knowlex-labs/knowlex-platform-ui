import * as React from 'react'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('')

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-kx-primary-100 dark:bg-kx-primary-900 text-kx-primary-700 dark:text-kx-primary-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="hover:text-kx-primary-900 dark:hover:text-kx-primary-100"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a tag and press Enter"
      />
    </div>
  )
}
