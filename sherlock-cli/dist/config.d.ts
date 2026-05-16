import "dotenv/config";
export declare const config: {
    apiUrl: string;
    apiKey: string;
    webLoginUrl: string;
    dashboardUrl: string;
    mockMode: boolean;
    urls: {
        local: string;
        production: string;
    };
};
export declare function reloadConfig(): {
    apiUrl: string;
    apiKey: string;
    webLoginUrl: string;
    dashboardUrl: string;
    mockMode: boolean;
    urls: {
        local: string;
        production: string;
    };
};
export declare function isMockMode(): boolean;
