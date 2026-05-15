import { isMockMode } from "../config.js";
import { healthCheck } from "./api.js";

let _backendAvailable: boolean | null = null;

export async function isBackendAvailable(): Promise<boolean> {
  if (isMockMode()) return false;
  if (_backendAvailable !== null) return _backendAvailable;
  _backendAvailable = await healthCheck();
  return _backendAvailable;
}

export async function useMock(): Promise<boolean> {
  return !(await isBackendAvailable());
}
