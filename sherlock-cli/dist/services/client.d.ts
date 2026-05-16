export declare function isBackendAvailable(): Promise<boolean>;
/** Force the next call to re-probe the backend (e.g. after auth change). */
export declare function invalidateBackendCache(): void;
export declare function useMock(): Promise<boolean>;
