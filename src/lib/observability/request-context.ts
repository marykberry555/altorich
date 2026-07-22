import { AsyncLocalStorage } from "node:async_hooks";
import { createRequestId } from "@/lib/observability/request-id";

export type RequestContextStore = {
  requestId: string;
  route?: string;
  userId?: string | null;
  environment?: string;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export { createRequestId };

export function runWithRequestContext<T>(ctx: RequestContextStore, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getRequestContext(): RequestContextStore | undefined {
  return storage.getStore();
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

export function setRequestUserId(userId: string | null | undefined) {
  const store = storage.getStore();
  if (store && userId) store.userId = userId;
}

export function setRequestRoute(route: string | undefined) {
  const store = storage.getStore();
  if (store && route) store.route = route;
}
