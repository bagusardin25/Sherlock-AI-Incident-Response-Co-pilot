import { isMockMode } from "../config.js";
import { healthCheck } from "./api.js";

/** Cache TTL in milliseconds (30 seconds). */
const CACHE_TTL_MS = 30_000;

let _backendAvailable: boolean | null = null;
let _cachedAt = 0;

export async function isBackendAvailable(): Promise<boolean> {
  if (isMockMode()) return false;

  // Return cached value if still fresh
  if (_backendAvailable !== null && Date.now() - _cachedAt < CACHE_TTL_MS) {
    return _backendAvailable;
  }

  _backendAvailable = await healthCheck();
  _cachedAt = Date.now();
  return _backendAvailable;
}

/** Force the next call to re-probe the backend (e.g. after auth change). */
export function invalidateBackendCache(): void {
  _backendAvailable = null;
  _cachedAt = 0;
}

export async function useMock(): Promise<boolean> {
  return !(await isBackendAvailable());
}

