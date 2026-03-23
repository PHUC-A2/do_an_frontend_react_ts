/** Trạng thái xử lý sự cố — khớp backend IssueStatus. */
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/** Một dòng danh sách sự cố thiết bị (API list). */
export interface IDeviceIssue {
    id: number;
    deviceId: number;
    deviceName?: string | null;
    assetId: number;
    assetName?: string | null;
    description: string;
    reportedBy: string;
    status: IssueStatus;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
}

/** Body tạo sự cố — status tùy chọn, mặc định OPEN phía server. */
export interface ICreateDeviceIssueReq {
    deviceId: number;
    assetId: number;
    description: string;
    reportedBy: string;
    status?: IssueStatus;
}

/** Body cập nhật sự cố. */
export interface IUpdateDeviceIssueReq {
    deviceId: number;
    assetId: number;
    description: string;
    reportedBy: string;
    status: IssueStatus;
}
