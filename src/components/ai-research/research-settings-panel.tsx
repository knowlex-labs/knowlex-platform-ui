import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ResearchSettings } from '@/types'

interface ResearchSettingsPanelProps {
  settings: ResearchSettings
  onUpdateSettings: (updates: Partial<ResearchSettings>) => void
}

const CREATIVITY_OPTIONS: Array<{ value: ResearchSettings['creativity']; label: string; description: string }> = [
  { value: 'precise', label: 'Precise', description: 'Factual and focused' },
  { value: 'balanced', label: 'Balanced', description: 'Best for most tasks' },
  { value: 'detailed', label: 'Detailed', description: 'In-depth and thorough' },
]

const MODEL_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
]

export function ResearchSettingsPanel({
  settings,
  onUpdateSettings,
}: ResearchSettingsPanelProps) {
  return (
    <div className="w-72 border-l border-ledger-gray-200 bg-white flex-shrink-0 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-ledger-gray-200">
        <h3 className="text-sm font-medium text-ledger-black">Settings</h3>
      </div>

      <div className="p-4 space-y-5 overflow-y-auto flex-1">
        {/* Creativity */}
        <div>
          <label className="text-xs font-medium text-ledger-gray-600 mb-2 block">
            Creativity
          </label>
          <div className="flex rounded-lg border border-ledger-gray-200 overflow-hidden">
            {CREATIVITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onUpdateSettings({ creativity: option.value })}
                className={cn(
                  'flex-1 py-1.5 px-2 text-xs font-medium transition-colors',
                  settings.creativity === option.value
                    ? 'bg-ledger-black text-white'
                    : 'bg-ledger-gray-50 text-ledger-gray-600 hover:bg-ledger-gray-100'
                )}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-ledger-gray-400 mt-1">
            {CREATIVITY_OPTIONS.find((o) => o.value === settings.creativity)?.description}
          </p>
        </div>

        <Separator />

        {/* Model */}
        <div>
          <label className="text-xs font-medium text-ledger-gray-600 mb-2 block">
            Model
          </label>
          <Select
            value={settings.model}
            onChange={(e) => onUpdateSettings({ model: e.target.value })}
            className="h-8 text-xs"
          >
            {MODEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Separator />

        {/* Knowledge Base toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.knowledgeBaseEnabled}
              onChange={(e) => onUpdateSettings({ knowledgeBaseEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-ledger-gray-300 text-ledger-black focus:ring-ledger-black"
            />
            <div>
              <span className="text-sm font-medium text-ledger-black">Knowledge Base</span>
              <p className="text-[10px] text-ledger-gray-400">
                Search uploaded documents for context
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
