import { Collapse, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import type { IDeviceReturn } from '../../../../types/deviceReturn';
import { formatInstant, formatLocalDate } from '../../../../utils/format/localdatetime';
import { ASSET_USAGE_STATUS_META, ASSET_USAGE_TYPE_META } from '../../../../utils/constants/assetUsage.constants';
import { DEVICE_CONDITION_META } from '../../../../utils/constants/deviceReturn.constants';

const { Text } = Typography;

interface IProps {
    setOpenModalDeviceReturnDetails: (v: boolean) => void;
    openModalDeviceReturnDetails: boolean;
    deviceReturn: IDeviceReturn | null;
    isLoading: boolean;
}

const ModalDeviceReturnDetails = (props: IProps) => {
    const { openModalDeviceReturnDetails, setOpenModalDeviceReturnDetails, deviceReturn, isLoading } = props;

    return (
        <Drawer
            title="Chi tiết phiếu trả tài sản"
            placement="right"
            onClose={() => setOpenModalDeviceReturnDetails(false)}
            open={openModalDeviceReturnDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={['usage', 'return', 'meta']}
                    items={[
                        {
                            key: 'usage',
                            label: 'Checkout & đăng ký',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID checkout">{deviceReturn?.checkoutId ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="ID đăng ký">{deviceReturn?.assetUsageId ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người dùng">
                                        {deviceReturn?.userId != null ? (
                                            <Text>
                                                #{deviceReturn.userId} — {deviceReturn.userEmail ?? deviceReturn.userName ?? ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tài sản">
                                        {deviceReturn?.assetId != null ? (
                                            <Text>
                                                #{deviceReturn.assetId} — {deviceReturn.assetName ?? ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại usage">
                                        {deviceReturn?.usageType ? (
                                            <Tag color={ASSET_USAGE_TYPE_META[deviceReturn.usageType]?.color}>
                                                {ASSET_USAGE_TYPE_META[deviceReturn.usageType]?.label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Khung giờ đăng ký">
                                        {deviceReturn?.usageDate
                                            ? `${formatLocalDate(deviceReturn.usageDate)} ${deviceReturn.startTime ?? ''} → ${deviceReturn.endTime ?? ''}`
                                            : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái đăng ký">
                                        {deviceReturn?.assetUsageStatus ? (
                                            <Tag color={ASSET_USAGE_STATUS_META[deviceReturn.assetUsageStatus]?.color}>
                                                {ASSET_USAGE_STATUS_META[deviceReturn.assetUsageStatus]?.label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Nhận lúc">{formatInstant(deviceReturn?.receiveTime)}</Descriptions.Item>
                                    <Descriptions.Item label="Ghi chú lúc nhận">
                                        {deviceReturn?.checkoutConditionNote ?? 'N/A'}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'return',
                            label: 'Phiếu trả',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID phiếu trả">{deviceReturn?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Trả lúc">{formatInstant(deviceReturn?.returnTime)}</Descriptions.Item>
                                    <Descriptions.Item label="Tình trạng sau dùng">
                                        {deviceReturn?.deviceStatus ? (
                                            <Tag color={DEVICE_CONDITION_META[deviceReturn.deviceStatus]?.color}>
                                                {DEVICE_CONDITION_META[deviceReturn.deviceStatus]?.label}
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
                            label: 'Lịch sử',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Người tạo">
                                        {deviceReturn?.createdBy ? deviceReturn.createdBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(deviceReturn?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {deviceReturn?.updatedBy ? deviceReturn.updatedBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(deviceReturn?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalDeviceReturnDetails;
