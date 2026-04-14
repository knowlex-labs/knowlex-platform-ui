import { initCore } from '@knowlex/core/api/runtime';
import { hydrateStorage, mobileStorageAdapter } from './storage';
import { mobileEventBusAdapter } from './event-bus';
import { mobileEnvConfig } from './env-config';
import { mobileFileHandlerAdapter } from './file-handler';
import { mobileSseAdapter } from './sse-adapter';

export async function bootstrapCore(): Promise<void> {
  // Must hydrate storage BEFORE initCore so synchronous reads work
  await hydrateStorage();

  initCore({
    storage: mobileStorageAdapter,
    eventBus: mobileEventBusAdapter,
    env: mobileEnvConfig,
    fileHandler: mobileFileHandlerAdapter,
    sse: mobileSseAdapter,
  });
}
