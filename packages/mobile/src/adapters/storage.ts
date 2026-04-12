import * as SecureStore from 'expo-secure-store';
import type { StorageAdapter } from '@knowlex/core/api/ports';

// In-memory cache for synchronous reads.
// Pre-hydrated from SecureStore at boot before initCore() is called.
const cache = new Map<string, string>();

const KNOWN_KEYS = [
  'auth_token',
  'auth_refresh_token',
  'auth_user_id',
  'admin_auth_token',
  'admin_user_id',
];

export async function hydrateStorage(): Promise<void> {
  await Promise.all(
    KNOWN_KEYS.map(async (key) => {
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) {
          cache.set(key, value);
        }
      } catch {
        // SecureStore may fail on first run or if keychain is locked
      }
    })
  );
}

export const mobileStorageAdapter: StorageAdapter = {
  getItem(key) {
    return cache.get(key) ?? null;
  },
  setItem(key, value) {
    cache.set(key, value);
    SecureStore.setItemAsync(key, value).catch(() => {});
  },
  removeItem(key) {
    cache.delete(key);
    SecureStore.deleteItemAsync(key).catch(() => {});
  },
};
