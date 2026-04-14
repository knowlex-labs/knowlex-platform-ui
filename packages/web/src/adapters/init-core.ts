import { initCore } from '@knowlex/core/api/runtime'
import { browserStorageAdapter } from './storage'
import { browserEventBusAdapter } from './event-bus'
import { browserEnvConfig } from './env-config'
import { browserFileHandlerAdapter } from './file-handler'
import { browserSseAdapter } from './sse-adapter'

export function bootstrapCore() {
  initCore({
    storage: browserStorageAdapter,
    eventBus: browserEventBusAdapter,
    env: browserEnvConfig,
    fileHandler: browserFileHandlerAdapter,
    sse: browserSseAdapter,
  })
}
