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
            title="Chi tiết biên bản trả phòng"
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
                            label: 'Biên bản nhận & lịch đặt phòng',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID biên bản nhận">{deviceReturn?.checkoutId ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="ID lịch đặt phòng">{deviceReturn?.assetUsageId ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Người dùng">
                                        {deviceReturn?.userId != null ? (
                                            <Text>
                                                #{deviceReturn.userId} — {deviceReturn.userEmail ?? deviceReturn.userName ?? ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Phòng">
                                        {deviceReturn?.assetId != null ? (
                                            <Text>
                                                #{deviceReturn.assetId} — {deviceReturn.assetName ?? ''}
                                            </Text>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại sử dụng">
                                        {deviceReturn?.usageType ? (
                                            <Tag color={ASSET_USAGE_TYPE_META[deviceReturn.usageType]?.color}>
                                                {ASSET_USAGE_TYPE_META[deviceReturn.usageType]?.label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Khung giờ đặt phòng">
                                        {deviceReturn?.usageDate
                                            ? `${formatLocalDate(deviceReturn.usageDate)} ${deviceReturn.startTime ?? ''} → ${deviceReturn.endTime ?? ''}`
                                            : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái lịch đặt phòng">
                                        {deviceReturn?.assetUsageStatus ? (
                                            <Tag color={ASSET_USAGE_STATUS_META[deviceReturn.assetUsageStatus]?.color}>
                                                {ASSET_USAGE_STATUS_META[deviceReturn.assetUsageStatus]?.label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Nhận phòng lúc">{formatInstant(deviceReturn?.receiveTime)}</Descriptions.Item>
                                    <Descriptions.Item label="Ghi chú lúc nhận phòng">
                                        {deviceReturn?.checkoutConditionNote ?? 'N/A'}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'return',
                            label: 'Biên bản trả phòng',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID biên bản trả">{deviceReturn?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Trả phòng lúc">{formatInstant(deviceReturn?.returnTime)}</Descriptions.Item>
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
