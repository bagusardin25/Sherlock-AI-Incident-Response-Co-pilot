import chalk from "chalk";
export declare const log: {
    section: (name: string, color: typeof chalk.red) => void;
    kv: (key: string, value: string) => void;
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warn: (msg: string) => void;
    diff: (patch: string) => void;
    severity: (level: string) => string;
};
