import { Command } from "commander";
export declare function shortPath(p: string): string;
export declare function maskKey(key: string): string;
export declare function compactHeader(title: string): void;
export declare function describeConnection(apiUrl: string): string;
export declare const CONFIG_FILE_PATH: string;
export declare function writeConfig(data: Record<string, string>): void;
export declare function clearConfig(): void;
export declare function readConfig(): {
    apiKey?: string;
    apiUrl?: string;
};
export declare const authCommand: Command;
