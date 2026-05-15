import { isMockMode } from "../config.js";
import { healthCheck } from "./api.js";
let _backendAvailable = null;
export async function isBackendAvailable() {
    if (isMockMode())
        return false;
    if (_backendAvailable !== null)
        return _backendAvailable;
    _backendAvailable = await healthCheck();
    return _backendAvailable;
}
export async function useMock() {
    return !(await isBackendAvailable());
}
