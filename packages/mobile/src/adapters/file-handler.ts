import type { FileHandlerAdapter } from '@knowlex/core/api/ports';

// Minimal file handler — viewing uses HTTP URLs directly in WebView/Image.
// Download/share is handled per-screen, not through this adapter.

export const mobileFileHandlerAdapter: FileHandlerAdapter = {
  triggerDownload(_blob, _fileName) {
    // On mobile, downloads are handled by the viewer screen via expo-sharing
  },
  triggerDirectDownload(_url, _fileName) {
    // On mobile, downloads are handled by the viewer screen via expo-sharing
  },
  createObjectUrl(_blob) {
    return 'about:blank';
  },
  revokeObjectUrl(_url) {
    // no-op
  },
};
