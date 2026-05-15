import { AxiosInstance } from "axios";
export declare const api: AxiosInstance;
export declare function healthCheck(): Promise<boolean>;
export interface SubmitIncidentPayload {
    raw_input: string;
    repo_url: string;
    incident_id?: string;
}
export declare function submitIncident(payload: SubmitIncidentPayload): Promise<{
    incident_id: string;
    stream_url: string;
}>;
export declare function getIncidentState(incidentId: string): Promise<any>;
export declare function listIncidents(): Promise<any[]>;
export declare function getPostmortem(incidentId: string): Promise<any>;
