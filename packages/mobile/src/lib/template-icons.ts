import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

/**
 * Mobile-only mapping from the shared `DraftTemplate.id` (defined in
 * `@knowlex/core/types` → `DRAFT_TEMPLATES`) to an Ionicons glyph name.
 * Core stays platform-agnostic; the web variant uses lucide-react icons.
 */
export const TEMPLATE_ICONS: Record<string, IoniconsName> = {
  'notice': 'document-text-outline',
  'patent': 'bulb-outline',
  'application-draft': 'create-outline',
  'interim-application': 'time-outline',
  'affidavit': 'scale-outline',
  'bail-application': 'hammer-outline',
  'criminal-appeal': 'shield-outline',
  'plaint': 'reader-outline',
  'written-statement': 'clipboard-outline',
  'written-arguments': 'chatbubble-ellipses-outline',
  'writ-petition': 'business-outline',
  'slp': 'star-outline',
  'quashing-petition': 'close-circle-outline',
  'anticipatory-bail': 'shield-checkmark-outline',
  'revision-petition': 'refresh-outline',
  'execution-petition': 'construct-outline',
  'consumer-complaint': 'people-outline',
};

/** Fallback glyph for any template id not in the map. */
export const DEFAULT_TEMPLATE_ICON: IoniconsName = 'document-outline';
