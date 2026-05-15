export interface AgentEvent {
    agent_name: string;
    status: "running" | "completed" | "failed";
    message: string;
    data?: Record<string, any>;
}
export declare function mockInvestigate(incidentId: string): AsyncGenerator<AgentEvent>;
export declare function mockIncidentList(): {
    incident_id: string;
    status: string;
    triage: {
        severity: string;
        service: string;
        error_type: string;
    };
    created_at: string;
}[];
export declare function mockIncidentState(incidentId: string): {
    incident_id: string;
    status: string;
    triage: {
        severity: string;
        service: string;
        error_type: string;
        summary: string;
        confidence: number;
    };
    forensics: {
        recent_commits: {
            hash: string;
            message: string;
            author: string;
        }[];
        suspect_files: string[];
    };
    root_cause: {
        root_cause: string;
        suspect_files: {
            path: string;
            line_number: number;
            reason: string;
            confidence: number;
        }[];
        confidence: number;
    };
    fix: {
        pr_title: string;
        patch_unified_diff: string;
        files_modified: string[];
        test_code: string;
    };
    postmortem: string;
};
export declare function mockPostmortem(incidentId: string): string;
