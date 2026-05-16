import "dotenv/config";
export declare const config: {
    apiUrl: string;
    apiKey: string;
    mockMode: boolean;
    urls: {
        local: string;
        production: string;
    };
};
export declare function isMockMode(): boolean;
