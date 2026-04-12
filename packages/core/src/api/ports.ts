/** Key-value storage abstraction (replaces localStorage) */
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Application event bus (replaces window.dispatchEvent) */
export interface EventBusAdapter {
  dispatch(event: string, detail?: unknown): void
}

/** Environment configuration (replaces import.meta.env) */
export interface EnvironmentConfig {
  apiBaseUrl: string
  googleClientId: string
  enablePayment: boolean
}

/** File/blob handling for downloads (replaces document.createElement etc.) */
export interface FileHandlerAdapter {
  triggerDownload(blob: Blob, fileName: string): void
  triggerDirectDownload(url: string, fileName: string): void
  createObjectUrl(blob: Blob): string
  revokeObjectUrl(url: string): void
}

/** Combined runtime dependencies — passed to initCore() */
export interface CoreAdapters {
  storage: StorageAdapter
  eventBus: EventBusAdapter
  env: EnvironmentConfig
  fileHandler: FileHandlerAdapter
}
