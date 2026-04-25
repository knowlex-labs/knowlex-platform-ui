import type { SseAdapter } from '@knowlex/core/api/ports'

/**
 * Browser SSE adapter — uses fetch + ReadableStream (Web Streams API).
 * Parses the `event:` / `data:` / blank-line SSE wire format and dispatches
 * each complete event to the handler.
 */
export const browserSseAdapter: SseAdapter = {
  stream(url, init, handlers) {
    const controller = new AbortController()

    fetch(url, {
      method: init.method,
      headers: init.headers,
      body: init.body,
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 401) handlers.onUnauthorized?.()
          const errorData: { message?: string } | null = await response.json().catch(() => null)
          handlers.onError(errorData?.message || `HTTP error ${response.status}`)
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          handlers.onError('No response body')
          return
        }

        const decoder = new TextDecoder()
        let currentEvent: string | null = null
        let currentData: string | null = null
        let buffer = ''

        const dispatchEvent = () => {
          if (currentEvent && currentData !== null) {
            handlers.onEvent(currentEvent, currentData)
          }
          currentEvent = null
          currentData = null
        }

        while (true) {
          const { done, value } = await reader.read()
          if (value) {
            buffer += decoder.decode(value, { stream: !done })
          } else if (done) {
            // Flush the UTF-8 decoder (important for multi-byte characters at chunk boundaries)
            buffer += decoder.decode()
          }
          const allLines = buffer.split('\n')
          if (!done) {
            buffer = allLines.pop() ?? ''
          } else {
            buffer = ''
          }
          for (const rawLine of allLines) {
            const line = rawLine.replace(/\r$/, '')
            if (line === '') {
              dispatchEvent()
              continue
            }
            if (line.startsWith('event:')) {
              currentEvent = line.substring(6).trim()
            } else if (line.startsWith('data:')) {
              const dataValue = line.substring(5)
              currentData = currentData === null ? dataValue : currentData + '\n' + dataValue
            }
          }
          if (done) break
        }
        // If the server closed without a final blank line, still emit the last event+data block
        dispatchEvent()
        handlers.onEnd()
      })
      .catch((err: { name?: string; message?: string }) => {
        if (err?.name === 'AbortError') return
        handlers.onError(err?.message || 'Network error')
      })

    return controller
  },
}
