import type { IssueStatus } from '../../types/deviceIssue';

/** Nhãn + màu Tag theo trạng thái sự cố (tiếng Việt). */
export const ISSUE_STATUS_META: Record<
    IssueStatus,
    { label: string; color: string }
> = {
    OPEN: { label: 'Mở', color: 'red' },
    IN_PROGRESS: { label: 'Đang xử lý', color: 'processing' },
    RESOLVED: { label: 'Đã xử lý', color: 'success' },
    CLOSED: { label: 'Đóng', color: 'default' },
};

/** Options Select filter / form. */
export const ISSUE_STATUS_OPTIONS: { value: IssueStatus; label: string }[] = (
    Object.keys(ISSUE_STATUS_META) as IssueStatus[]
).map((value) => ({
    value,
    label: ISSUE_STATUS_META[value].label,
}));
