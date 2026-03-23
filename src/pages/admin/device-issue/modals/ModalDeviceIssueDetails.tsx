import { Collapse, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import type { IDeviceIssue } from '../../../../types/deviceIssue';
import { formatInstant } from '../../../../utils/format/localdatetime';
import { ISSUE_STATUS_META } from '../../../../utils/constants/deviceIssue.constants';

const { Text } = Typography;

interface IProps {
    setOpenDrawerDeviceIssueDetails: (v: boolean) => void;
    openDrawerDeviceIssueDetails: boolean;
    issue: IDeviceIssue | null;
    isLoading: boolean;
}

/** Drawer chi tiết sự cố — cùng pattern Drawer thiết bị / tài sản. */
const ModalDeviceIssueDetails = (props: IProps) => {
    const { openDrawerDeviceIssueDetails, setOpenDrawerDeviceIssueDetails, issue, isLoading } = props;

    return (
        <Drawer
            title="Chi tiết sự cố thiết bị"
            placement="right"
            onClose={() => setOpenDrawerDeviceIssueDetails(false)}
            open={openDrawerDeviceIssueDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={['general', 'meta']}
                    items={[
                        {
                            key: 'general',
                            label: 'Thông tin sự cố',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID">{issue?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="ID thiết bị">{issue?.deviceId ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Tên thiết bị">
                                        {issue?.deviceName ?? 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="ID tài sản">{issue?.assetId ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Tên tài sản">
                                        {issue?.assetName ?? 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mô tả">
                                        {issue?.description ? <Text>{issue.description}</Text> : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Người báo">
                                        {issue?.reportedBy ?? 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        {issue?.status ? (
                                            <Tag color={ISSUE_STATUS_META[issue.status].color}>
                                                {ISSUE_STATUS_META[issue.status].label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'meta',
                            label: 'Lịch sử cập nhật',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Người tạo">
                                        {issue?.createdBy ? issue.createdBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(issue?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {issue?.updatedBy ? issue.updatedBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(issue?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalDeviceIssueDetails;
