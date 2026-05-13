import type { AssessOutput } from "@/lib/types";

const TTL_MS = 90 * 24 * 60 * 60 * 1000;

type Entry = {
  payload: AssessOutput;
  expiresAt: number;
};

declare global {
  var __neetTransientOutputs: Map<string, Entry> | undefined;
}

function getStore() {
  if (!globalThis.__neetTransientOutputs) {
    globalThis.__neetTransientOutputs = new Map<string, Entry>();
  }
  return globalThis.__neetTransientOutputs;
}

export function setTransientOutput(uuid: string, payload: AssessOutput) {
  getStore().set(uuid, {
    payload,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getTransientOutput(uuid: string): AssessOutput | null {
  const entry = getStore().get(uuid);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    getStore().delete(uuid);
    return null;
  }
  return entry.payload;
}
