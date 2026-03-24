import { Collapse, Descriptions, Drawer, Spin, Tag, Typography } from 'antd';
import { Link } from 'react-router';
import type { IDevice } from '../../../../types/device';
import { formatInstant } from '../../../../utils/format/localdatetime';
import { DEVICE_STATUS_META, DEVICE_TYPE_META } from '../../../../utils/constants/device.constants';

const { Text } = Typography;

interface IProps {
    setOpenModalDeviceDetails: (v: boolean) => void;
    openModalDeviceDetails: boolean;
    device: IDevice | null;
    isLoading: boolean;
}

/** Drawer chi tiết thiết bị theo tài sản — cùng pattern ModalAssetDetails. */
const ModalDeviceDetails = (props: IProps) => {
    const { openModalDeviceDetails, setOpenModalDeviceDetails, device, isLoading } = props;

    return (
        <Drawer
            title="Chi tiết thiết bị theo tài sản"
            placement="right"
            onClose={() => setOpenModalDeviceDetails(false)}
            open={openModalDeviceDetails}
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={['general', 'meta']}
                    items={[
                        {
                            key: 'general',
                            label: 'Thông tin thiết bị',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="ID">{device?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="ID tài sản">
                                        {device?.assetId != null ? (
                                            <Link to={`/admin/asset?openAssetId=${device.assetId}`}>{device.assetId}</Link>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên tài sản">
                                        {device?.assetId != null ? (
                                            <Link to={`/admin/asset?openAssetId=${device.assetId}`}>
                                                {device.assetName?.trim()
                                                    ? device.assetName
                                                    : `Tài sản #${device.assetId}`}
                                            </Link>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tên thiết bị">
                                        {device?.deviceName ?? 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Số lượng">
                                        {device?.quantity != null ? <Text>{device.quantity}</Text> : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        {device?.status ? (
                                            <Tag color={DEVICE_STATUS_META[device.status].color}>
                                                {DEVICE_STATUS_META[device.status].label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại">
                                        {device?.deviceType ? (
                                            <Tag color={DEVICE_TYPE_META[device.deviceType].color}>
                                                {DEVICE_TYPE_META[device.deviceType].label}
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
                                        {device?.createdBy ? device.createdBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(device?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">
                                        {device?.updatedBy ? device.updatedBy : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(device?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalDeviceDetails;
