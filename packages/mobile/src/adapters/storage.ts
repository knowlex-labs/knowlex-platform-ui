import * as SecureStore from 'expo-secure-store';
import type { StorageAdapter } from '@knowlex/core/api/ports';
import { mobileEventBusAdapter } from './event-bus';

// In-memory cache backs the synchronous StorageAdapter contract.
// Pre-hydrated from SecureStore at boot before initCore() is called.
const cache = new Map<string, string>();

/** Reserved key holding a JSON-encoded list of every other key ever written. */
const KEY_INDEX = '__kx_storage_keys';

/**
 * Fallback key list used only on first boot (before any write has persisted an
 * index). Keeps pre-existing installs working through the migration.
 */
const LEGACY_FALLBACK_KEYS = [
  'auth_token',
  'auth_refresh_token',
  'auth_user_id',
  'admin_auth_token',
  'admin_user_id',
];

const persistedKeys = new Set<string>();
let indexWriteScheduled = false;

function handleWriteFailure(key: string, err: unknown): void {
  // eslint-disable-next-line no-console
  console.warn('[storage] persist failed', key, err);
  mobileEventBusAdapter.dispatch('storage:write-failed', { key, error: String(err) });
}

function scheduleIndexWrite(): void {
  if (indexWriteScheduled) return;
  indexWriteScheduled = true;
  Promise.resolve().then(() => {
    indexWriteScheduled = false;
    const payload = JSON.stringify([...persistedKeys]);
    SecureStore.setItemAsync(KEY_INDEX, payload).catch((err) =>
      handleWriteFailure(KEY_INDEX, err)
    );
  });
}

export async function hydrateStorage(): Promise<void> {
  let keys: string[] | null = null;
  try {
    const raw = await SecureStore.getItemAsync(KEY_INDEX);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) keys = parsed.filter((k): k is string => typeof k === 'string');
    }
  } catch {
    // Index unreadable — fall through to legacy fallback.
  }

  if (!keys) keys = LEGACY_FALLBACK_KEYS;

  await Promise.all(
    keys.map(async (key) => {
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value !== null) {
          cache.set(key, value);
          persistedKeys.add(key);
        }
      } catch {
        // SecureStore may fail if the keychain is locked; skip this key.
      }
    })
  );

  // Persist the hydrated set so subsequent boots don't rely on the legacy list.
  scheduleIndexWrite();
}

export const mobileStorageAdapter: StorageAdapter = {
  getItem(key) {
    return cache.get(key) ?? null;
  },
  setItem(key, value) {
    cache.set(key, value);
    const isNew = !persistedKeys.has(key);
    persistedKeys.add(key);
    SecureStore.setItemAsync(key, value).catch((err) => handleWriteFailure(key, err));
    if (isNew) scheduleIndexWrite();
  },
  removeItem(key) {
    cache.delete(key);
    const existed = persistedKeys.delete(key);
    SecureStore.deleteItemAsync(key).catch((err) => handleWriteFailure(key, err));
    if (existed) scheduleIndexWrite();
  },
};
