import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscriptionPreferences } from '@/contexts/subscription-preferences-context'
import type { FeatureName } from '@knowlex/core/types'

interface FeatureGateProps {
  name: FeatureName
  children: React.ReactNode
  fallback?: React.ReactNode
}

const FEATURE_LABELS: Partial<Record<FeatureName, string>> = {
  MOODBOARD: 'Tasks',
}

export function FeatureGate({ name, children, fallback }: FeatureGateProps) {
  const { isLocked, isLoading } = useSubscriptionPreferences()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kx-primary-600" />
      </div>
    )
  }

  if (!isLocked(name)) {
    return <>{children}</>
  }

  if (fallback) return <>{fallback}</>

  return <DefaultUpsellScreen featureName={name} />
}

function DefaultUpsellScreen({ featureName }: { featureName: FeatureName }) {
  const navigate = useNavigate()
  const featureLabel =
    FEATURE_LABELS[featureName] ??
    featureName
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center bg-kx-card border border-kx-primary-100/60 rounded-2xl px-8 py-10 shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-kx-primary-50 flex items-center justify-center">
          <Lock className="h-5 w-5 text-kx-primary-700" />
        </div>
        <h2 className="text-xl font-serif font-semibold text-kx-text-primary mb-2">Upgrade your plan</h2>
        <p className="text-sm text-kx-text-secondary mb-6 leading-relaxed">
          Please upgrade your plan to access <span className="font-medium text-kx-text-primary">{featureLabel}</span>.
          Start a free trial or choose a plan that includes this feature.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => navigate('/settings/billing')}
            className="w-full bg-kx-primary-700 text-white hover:bg-kx-primary-800"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            View plans & free trial
          </Button>
          <Button variant="ghost" onClick={() => navigate('/home')} className="w-full">
            Back to home
          </Button>
        </div>
      </div>
    </div>
  )
}
