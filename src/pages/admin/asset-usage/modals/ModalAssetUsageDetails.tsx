import { Descriptions, Drawer, Spin, Tag } from 'antd';
import type { IAssetUsage } from '../../../../types/assetUsage';
import { formatInstant } from '../../../../utils/format/localdatetime';
import { ASSET_ROOM_FEE_MODE_OPTIONS } from '../../../../utils/constants/asset.constants';
import { ASSET_USAGE_STATUS_META, ASSET_USAGE_TYPE_META } from '../../../../utils/constants/assetUsage.constants';

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
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="ID đăng ký">{usage?.id ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="ID người đặt">{usage?.userId ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Tên người đặt">
                        {usage?.userName || usage?.userEmail || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="ID phòng">{usage?.assetId ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Tên phòng">{usage?.assetName ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Loại đăng ký">
                        {usage?.usageType ? (
                            <Tag color={ASSET_USAGE_TYPE_META[usage.usageType].color}>
                                {ASSET_USAGE_TYPE_META[usage.usageType].label}
                            </Tag>
                        ) : (
                            <Tag>N/A</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phí đăng ký (thuê/mượn)">
                        {ASSET_ROOM_FEE_MODE_OPTIONS.find((o) => o.value === (usage?.usageFeeMode === 'PAID' ? 'PAID' : 'FREE'))
                            ?.label ?? 'Miễn phí'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày sử dụng">{usage?.date ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Khung giờ">
                        {usage ? `${usage.startTime} - ${usage.endTime}` : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mục đích">{usage?.subject ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {usage?.status ? (
                            <Tag color={ASSET_USAGE_STATUS_META[usage.status].color}>
                                {ASSET_USAGE_STATUS_META[usage.status].label}
                            </Tag>
                        ) : (
                            <Tag>N/A</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">{usage?.createdBy || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{formatInstant(usage?.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">{usage?.updatedBy || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(usage?.updatedAt)}</Descriptions.Item>
                </Descriptions>
            </Spin>
        </Drawer>
    );
};

export default ModalAssetUsageDetails;
