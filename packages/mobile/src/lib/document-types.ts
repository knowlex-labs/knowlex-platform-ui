import type { Ionicons } from '@expo/vector-icons';

export type DocTypeColorKey =
  | 'uploaded' | 'draft' | 'summary' | 'judgment' | 'synopsis' | 'translation' | 'other';

export function getTypeColorKey(type: string): DocTypeColorKey {
  switch (type) {
    case 'USER_UPLOADED': return 'uploaded';
    case 'DRAFT': return 'draft';
    case 'SUMMARY': return 'summary';
    case 'JUDGMENT': return 'judgment';
    case 'SYNOPSIS': return 'synopsis';
    case 'TRANSLATION': return 'translation';
    default: return 'other';
  }
}

export function getTypeLabel(type: string): string {
  switch (type) {
    case 'USER_UPLOADED': return 'Uploaded';
    case 'DRAFT': return 'Draft';
    case 'SUMMARY': return 'Summary';
    case 'JUDGMENT': return 'Judgment';
    case 'SYNOPSIS': return 'Synopsis';
    case 'TRANSLATION': return 'Translation';
    default: return type;
  }
}

export function getTypeIcon(type: string): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'DRAFT': return 'document-text-outline';
    case 'SUMMARY': return 'reader-outline';
    case 'SYNOPSIS': return 'book-outline';
    case 'TRANSLATION': return 'globe-outline';
    case 'JUDGMENT': return 'hammer-outline';
    case 'USER_UPLOADED': return 'cloud-upload-outline';
    default: return 'document-outline';
  }
}
