import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { FileHandlerAdapter } from '@knowlex/core/api/ports';

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function saveBlobToCache(blob: Blob, fileName: string): Promise<string> {
  const base64 = await blobToBase64(blob);
  const fileUri = FileSystem.cacheDirectory + fileName;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}

export const mobileFileHandlerAdapter: FileHandlerAdapter = {
  async triggerDownload(blob: Blob, fileName: string) {
    try {
      const fileUri = await saveBlobToCache(blob, fileName);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (err) {
      console.warn('Download failed:', err);
    }
  },

  async triggerDirectDownload(url: string, fileName: string) {
    try {
      const fileUri = FileSystem.cacheDirectory + fileName;
      const result = await FileSystem.downloadAsync(url, fileUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (err) {
      console.warn('Direct download failed:', err);
    }
  },

  createObjectUrl(blob: Blob): string {
    // On mobile, we can't create blob URLs synchronously.
    // Callers should use saveBlobToCache() instead.
    // This is a fallback that returns a placeholder — actual file saving
    // happens asynchronously in the viewer flow.
    return 'file://pending';
  },

  revokeObjectUrl(url: string) {
    if (url.startsWith(FileSystem.cacheDirectory ?? '')) {
      FileSystem.deleteAsync(url, { idempotent: true }).catch(() => {});
    }
  },
};

// Export for direct use in viewer flows
export { saveBlobToCache };
