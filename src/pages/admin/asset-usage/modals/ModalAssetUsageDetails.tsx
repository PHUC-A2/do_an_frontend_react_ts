import { Collapse, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import type { IAssetUsage } from '../../../../types/assetUsage';
import { formatInstant } from '../../../../utils/format/localdatetime';
import { ASSET_USAGE_STATUS_META, ASSET_USAGE_TYPE_META } from '../../../../utils/constants/assetUsage.constants';

const { Text } = Typography;

interface IProps {
    setOpenModalAssetUsageDetails: (v: boolean) => void;
    openModalAssetUsageDetails: boolean;
    usage: IAssetUsage | null;
    isLoading: boolean;
}

const ModalAssetUsageDetails = (props: IProps) => {
    const { openModalAssetUsageDetails, setOpenModalAssetUsageDetails, usage, isLoading } = props;

    return (
        <Drawer
            title="Chi tiết đăng ký sử dụng tài sản"
            placement="right"
            onClose={() => setOpenModalAssetUsageDetails(false)}
            open={openModalAssetUsageDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={['general', 'meta']}
                    items={[
                        {
                            key: 'general',
                            label: 'Thông tin đăng ký',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID">{usage?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người dùng">
                                        {usage?.userId != null ? (
                                            <Text>
                                                #{usage.userId} — {usage.userName ?? ''}{' '}
                                                {usage.userEmail ? `(${usage.userEmail})` : ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tài sản">
                                        {usage?.assetId != null ? (
                                            <Text>
                                                #{usage.assetId} — {usage.assetName ?? ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại">
                                        {usage?.usageType ? (
                                            <Tag color={ASSET_USAGE_TYPE_META[usage.usageType].color}>
                                                {ASSET_USAGE_TYPE_META[usage.usageType].label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày">{usage?.date ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Khung giờ">
                                        {usage ? `${usage.startTime} → ${usage.endTime}` : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mục đích">{usage?.subject ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        {usage?.status ? (
                                            <Tag color={ASSET_USAGE_STATUS_META[usage.status].color}>
                                                {ASSET_USAGE_STATUS_META[usage.status].label}
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
                                        {usage?.createdBy ? usage.createdBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(usage?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {usage?.updatedBy ? usage.updatedBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(usage?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalAssetUsageDetails;
