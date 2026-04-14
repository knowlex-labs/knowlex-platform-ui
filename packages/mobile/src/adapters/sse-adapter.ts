import type { SseAdapter } from '@knowlex/core/api/ports';

/**
 * React Native SSE adapter.
 *
 * React Native's fetch does not expose `response.body` as a ReadableStream, so
 * the web adapter's `getReader()` path cannot work. We use XMLHttpRequest
 * instead: readyState 3 (LOADING) fires repeatedly as bytes arrive, and
 * `responseText` contains everything received so far. We diff against the
 * last-seen length to extract new bytes, buffer partial lines, and dispatch
 * complete SSE events.
 */
export const mobileSseAdapter: SseAdapter = {
  stream(url, init, handlers) {
    const controller = new AbortController();

    const xhr = new XMLHttpRequest();
    let seenLen = 0;
    let buffer = '';
    let currentEvent: string | null = null;
    let currentData: string | null = null;
    let finished = false;

    const dispatchEvent = () => {
      if (currentEvent && currentData !== null) {
        handlers.onEvent(currentEvent, currentData);
      }
      currentEvent = null;
      currentData = null;
    };

    const consume = (chunk: string) => {
      buffer += chunk;
      const allLines = buffer.split('\n');
      buffer = allLines.pop() ?? '';
      for (const rawLine of allLines) {
        const line = rawLine.replace(/\r$/, '');
        if (line === '') {
          dispatchEvent();
          continue;
        }
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          const dataValue = line.substring(5);
          currentData = currentData === null ? dataValue : currentData + '\n' + dataValue;
        }
      }
    };

    controller.signal.addEventListener('abort', () => {
      if (finished) return;
      finished = true;
      try { xhr.abort(); } catch { /* noop */ }
    });

    xhr.open(init.method, url, true);
    for (const [k, v] of Object.entries(init.headers)) {
      try { xhr.setRequestHeader(k, v); } catch { /* some headers are forbidden; skip */ }
    }

    xhr.onreadystatechange = () => {
      if (finished) return;

      // LOADING — incremental data arriving.
      if (xhr.readyState === 3) {
        const text = xhr.responseText ?? '';
        if (text.length > seenLen) {
          const chunk = text.substring(seenLen);
          seenLen = text.length;
          consume(chunk);
        }
      }

      // DONE
      if (xhr.readyState === 4) {
        // Flush any final partial bytes we didn't catch during LOADING.
        const text = xhr.responseText ?? '';
        if (text.length > seenLen) {
          consume(text.substring(seenLen));
          seenLen = text.length;
        }

        const status = xhr.status;

        // xhr.status is 0 on abort or network failure.
        if (status === 0) {
          if (!controller.signal.aborted) {
            finished = true;
            handlers.onError('Network error');
          }
          return;
        }

        if (status < 200 || status >= 300) {
          if (status === 401) handlers.onUnauthorized?.();
          let msg = `HTTP error ${status}`;
          try {
            const parsed = JSON.parse(text) as { message?: string };
            if (parsed?.message) msg = parsed.message;
          } catch { /* not JSON */ }
          finished = true;
          handlers.onError(msg);
          return;
        }

        // Flush any buffered event left without a trailing blank line.
        dispatchEvent();
        finished = true;
        handlers.onEnd();
      }
    };

    xhr.onerror = () => {
      if (finished) return;
      finished = true;
      handlers.onError('Network error');
    };

    try {
      xhr.send(init.body);
    } catch (err) {
      finished = true;
      handlers.onError((err as Error)?.message || 'Failed to send request');
    }

    return controller;
  },
};
