import { ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Space, Spin, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';

import {
    getClientRoomBookingCheckout,
    getClientRoomBookingReturn,
    getPublicAssetDevices,
} from '../../../../../config/Api';
import type { ICheckout } from '../../../../../types/checkout';
import type { IDevice } from '../../../../../types/device';
import type { IDeviceReturn } from '../../../../../types/deviceReturn';
import { DEVICE_CONDITION_META } from '../../../../../utils/constants/deviceReturn.constants';
import { DEVICE_STATUS_META, DEVICE_TYPE_META } from '../../../../../utils/constants/device.constants';

const { Text } = Typography;

interface RoomBookingDevicePanelProps {
    assetId: number;
    roomBookingId?: number;
}

const RoomBookingDevicePanel = ({ assetId, roomBookingId }: RoomBookingDevicePanelProps) => {
    const [loading, setLoading] = useState(false);
    const [devices, setDevices] = useState<IDevice[]>([]);
    const [checkout, setCheckout] = useState<ICheckout | null>(null);
    const [deviceReturn, setDeviceReturn] = useState<IDeviceReturn | null>(null);

    const loadData = useCallback(async () => {
        if (!assetId) return;
        setLoading(true);
        try {
            const [devicesRes] = await Promise.all([getPublicAssetDevices(assetId)]);
            setDevices(devicesRes.data.data ?? []);

            if (roomBookingId) {
                try {
                    const checkoutRes = await getClientRoomBookingCheckout(roomBookingId);
                    setCheckout(checkoutRes.data.data ?? null);
                } catch {
                    setCheckout(null);
                }
                try {
                    const returnRes = await getClientRoomBookingReturn(roomBookingId);
                    setDeviceReturn(returnRes.data.data ?? null);
                } catch {
                    setDeviceReturn(null);
                }
            } else {
                setCheckout(null);
                setDeviceReturn(null);
            }
        } finally {
            setLoading(false);
        }
    }, [assetId, roomBookingId]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    useEffect(() => {
        if (!roomBookingId) return;
        const timer = window.setInterval(() => {
            void loadData();
        }, 15000);
        return () => window.clearInterval(timer);
    }, [roomBookingId, loadData]);

    return (
        <Card
            className="booking-card-glass"
            style={{ marginTop: 12 }}
            title="Thiết bị phòng & trạng thái biên bản nhận/trả phòng"
            extra={<Button icon={<ReloadOutlined />} size="small" onClick={() => void loadData()}>Làm mới</Button>}
        >
            {loading ? (
                <div style={{ textAlign: 'center', padding: 16 }}>
                    <Spin />
                </div>
            ) : (
                <Space orientation="vertical" style={{ width: '100%' }} size={10}>
                    <Space wrap>
                        <Tag color={checkout ? 'processing' : 'default'}>
                            {checkout ? 'Đã nhận phòng' : 'Chưa nhận phòng'}
                        </Tag>
                        <Tag color={deviceReturn ? 'success' : 'default'}>
                            {deviceReturn
                                ? `Đã trả phòng (${DEVICE_CONDITION_META[deviceReturn.deviceStatus]?.label ?? deviceReturn.deviceStatus})`
                                : 'Chưa trả phòng'}
                        </Tag>
                        {!roomBookingId ? <Tag color="warning">Chọn chế độ sửa để theo dõi theo booking cụ thể</Tag> : null}
                    </Space>
                    {devices.length === 0 ? (
                        <Empty description="Phòng chưa có thiết bị" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {devices.map((item) => (
                                <div key={item.id}>
                                    {/* Hiển thị row thiết bị theo layout giống AntD List.Item, nhưng dùng div thuần để tránh warning deprecated */}
                                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                        <Space>
                                            <Text strong>{item.deviceName}</Text>
                                            <Tag>{DEVICE_TYPE_META[item.deviceType]?.label ?? item.deviceType}</Tag>
                                        </Space>
                                        <Space>
                                            <Text type="secondary">SL: {item.quantity}</Text>
                                            <Tag color={DEVICE_STATUS_META[item.status]?.color ?? 'default'}>
                                                {DEVICE_STATUS_META[item.status]?.label ?? item.status}
                                            </Tag>
                                        </Space>
                                    </Space>
                                </div>
                            ))}
                        </div>
                    )}
                </Space>
            )}
        </Card>
    );
};

export default RoomBookingDevicePanel;
