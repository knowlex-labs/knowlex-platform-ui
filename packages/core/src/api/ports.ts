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

/** Server-Sent-Events transport.
 *  Web uses fetch + ReadableStream; React Native must use XHR because RN fetch
 *  does not implement response.body.getReader(). */
export interface SseAdapter {
  stream(
    url: string,
    init: { method: 'POST'; headers: Record<string, string>; body: string },
    handlers: {
      onEvent: (event: string, data: string) => void
      onError: (msg: string) => void
      onEnd: () => void
      onUnauthorized?: () => void
    }
  ): AbortController
}

/** Combined runtime dependencies — passed to initCore() */
export interface CoreAdapters {
  storage: StorageAdapter
  eventBus: EventBusAdapter
  env: EnvironmentConfig
  fileHandler: FileHandlerAdapter
  sse: SseAdapter
}
