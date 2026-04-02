export type SupportIssueSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ISupportContact {
    id: number;
    name: string;
    role: string;
    phone: string | null;
    email: string | null;
    note: string | null;
    sortOrder: number;
}

export interface ISupportIssueGuide {
    id: number;
    title: string;
    severity: SupportIssueSeverity;
    steps: string[];
    sortOrder: number;
}

export interface ISupportResourceLink {
    id: number;
    label: string;
    url: string;
    color: string | null;
    sortOrder: number;
}

export interface ISupportMaintenanceItem {
    id: number;
    label: string;
    frequencyText: string;
    color: string | null;
    sortOrder: number;
}

export type IReqSupportContact = {
    name: string;
    role: string;
    phone?: string;
    email?: string;
    note?: string;
    sortOrder?: number;
};

export type IReqSupportIssueGuide = {
    title: string;
    severity: SupportIssueSeverity;
    steps: string[];
    sortOrder?: number;
};

export type IReqSupportResourceLink = {
    label: string;
    url: string;
    color?: string;
    sortOrder?: number;
};

export type IReqSupportMaintenanceItem = {
    label: string;
    frequencyText: string;
    color?: string;
    sortOrder?: number;
};
