import { lazy, ComponentType, LazyExoticComponent } from "react";

const RETRY_COUNT = 3;
const RETRY_DELAY_MS = 1000;

/**
 * 동적 import 실패 시 재시도하는 lazy 래퍼.
 * "Failed to fetch dynamically imported module" 오류(네트워크 불안정, 배포 후 캐시 등) 완화용.
 */
function retryImport<T extends { default: ComponentType<unknown> }>(
  importFn: () => Promise<T>,
  retries = RETRY_COUNT
): () => Promise<T> {
  return () =>
    importFn().catch((err) => {
      if (retries <= 0) throw err;
      return new Promise<T>((resolve, reject) => {
        setTimeout(() => {
          retryImport(importFn, retries - 1)()
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY_MS);
      });
    });
}

export function lazyWithRetry<P = object>(
  importFn: () => Promise<{ default: ComponentType<P> }>
): LazyExoticComponent<ComponentType<P>> {
  return lazy(retryImport(importFn)) as LazyExoticComponent<ComponentType<P>>;
}
