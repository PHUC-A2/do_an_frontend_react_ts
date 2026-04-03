import { Descriptions, Drawer, Spin, Tag, Image, Divider, List, Typography, Collapse, Space } from 'antd';
import { useEffect, useState } from 'react';

import { adminGetPitchEquipments } from '../../../../config/Api';
import type { IPitch } from '../../../../types/pitch';
import type { IPitchEquipment } from '../../../../types/pitchEquipment';
import { PITCH_STATUS_META, getPitchTypeLabel } from '../../../../utils/constants/pitch.constants';
import { formatInstant } from '../../../../utils/format/localdatetime';
import { Button } from 'react-bootstrap';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { formatVND } from '../../../../utils/format/price';
import { getPitchPricingDisplayLines } from '../../../../utils/pitch/pitchPricing';

const { Text } = Typography;

interface IProps {
    openModalPitchDetails: boolean;
    setOpenModalPitchDetails: (v: boolean) => void;
    pitch: IPitch | null;
    isLoading: boolean;
}

const ModalPitchDetails = (props: IProps) => {
    const {
        openModalPitchDetails,
        setOpenModalPitchDetails,
        pitch,
        isLoading,
    } = props;
    const [pitchEquipments, setPitchEquipments] = useState<IPitchEquipment[]>([]);
    const [loadingPitchEquipments, setLoadingPitchEquipments] = useState(false);

    const pitchArea =
        pitch?.length != null && pitch?.width != null
            ? Number((pitch.length * pitch.width).toFixed(2))
            : null;

    useEffect(() => {
        if (!openModalPitchDetails || !pitch?.id) {
            setPitchEquipments([]);
            return;
        }

        setLoadingPitchEquipments(true);
        adminGetPitchEquipments(pitch.id)
            .then((res) => setPitchEquipments(res.data.data ?? []))
            .catch(() => setPitchEquipments([]))
            .finally(() => setLoadingPitchEquipments(false));
    }, [openModalPitchDetails, pitch?.id]);

    const getEquipmentImageSrc = (fileName?: string | null) => {
        if (!fileName) return undefined;
        if (/^https?:\/\//i.test(fileName) || fileName.startsWith('/')) return fileName;
        return `/storage/equipment/${fileName}`;
    };

    return (
        <Drawer
            title="Chi tiết sân"
            placement="right"
            // closable={false}
            onClose={() => setOpenModalPitchDetails(false)}
            open={openModalPitchDetails}
        // size=
        >
            <Spin spinning={isLoading}>
                <Collapse
                    defaultActiveKey={['general', 'meta', 'equipment']}
                    items={[
                        {
                            key: 'general',
                            label: 'Thông tin sân',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Ảnh sân">
                                        {pitch?.pitchUrl ? (
                                            <Image
                                                src={pitch.pitchUrl}
                                                width="100%"
                                                style={{ borderRadius: 6 }}
                                            />
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="ID">{pitch?.id ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Tên sân">{pitch?.name ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Loại sân">
                                        {pitch?.pitchType ? getPitchTypeLabel(pitch.pitchType) : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Giá / giờ">
                                        {(() => {
                                            if (!pitch) return 'N/A';
                                            const lines = getPitchPricingDisplayLines(pitch);
                                            if (lines.length > 0) {
                                                return lines.join(' | ');
                                            }
                                            return pitch.pricePerHour ? `${formatVND(pitch.pricePerHour)} / giờ` : 'N/A';
                                        })()}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        {pitch?.status ? (
                                            <Tag color={PITCH_STATUS_META[pitch.status].color}>
                                                {PITCH_STATUS_META[pitch.status].label}
                                            </Tag>
                                        ) : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Giờ hoạt động">
                                        {pitch?.open24h
                                            ? 'Mở cửa 24h'
                                            : `${pitch?.openTime ?? '--'} - ${pitch?.closeTime ?? '--'}`}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Địa chỉ">{pitch?.address ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Kích thước sân (D x R x C)">
                                        {pitch?.length != null || pitch?.width != null || pitch?.height != null
                                            ? `${pitch?.length ?? '--'}m x ${pitch?.width ?? '--'}m x ${pitch?.height ?? '--'}m`
                                            : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Diện tích sân">
                                        {pitchArea != null ? `${pitchArea.toLocaleString('vi-VN')} m2` : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Mở map chỉ đường">
                                        <Button
                                            variant="outline-info"
                                            onClick={() => {
                                                if (pitch?.latitude == null || pitch?.longitude == null) return;
                                                const url = `https://www.google.com/maps/dir/?api=1&destination=${pitch.latitude},${pitch.longitude}`;
                                                window.open(url, '_blank');
                                            }}
                                            disabled={pitch?.latitude == null || pitch?.longitude == null}
                                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <FaMapMarkerAlt />
                                            <span>Chỉ đường</span>
                                        </Button>
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'meta',
                            label: 'Lịch sử cập nhật',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Người tạo">{pitch?.createdBy ? pitch.createdBy : 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(pitch?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">{pitch?.updatedBy ? pitch.updatedBy : 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(pitch?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'equipment',
                            label: 'Thiết bị gắn theo sân',
                            children: (
                                <>
                                    <Divider style={{ margin: '0 0 10px' }} />
                                    <List
                                        bordered
                                        loading={loadingPitchEquipments}
                                        dataSource={pitchEquipments}
                                        locale={{ emptyText: 'Sân chưa có thiết bị được gắn' }}
                                        renderItem={(item) => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    avatar={
                                                        <Image
                                                            width={52}
                                                            height={52}
                                                            style={{ borderRadius: 8, objectFit: 'cover' }}
                                                            src={getEquipmentImageSrc(item.equipmentImageUrl)}
                                                            fallback="/placeholder-pitch.jpg"
                                                            preview={{ mask: 'Xem' }}
                                                        />
                                                    }
                                                    title={
                                                        <Space size={8}>
                                                            <span>{item.equipmentName}</span>
                                                            <Tag color="processing">SL: {item.quantity}</Tag>
                                                        </Space>
                                                    }
                                                    description={
                                                        <>
                                                            <Text type="secondary">Equipment ID: {item.equipmentId}</Text>
                                                            <br />
                                                            <Text>
                                                                Loại:{' '}
                                                                {item.equipmentMobility === 'MOVABLE' ? 'Lưu động' : 'Cố định trên sân'}
                                                            </Text>
                                                            <br />
                                                            <Text>{item.specification ? `Thông số: ${item.specification}` : 'Thông số: chưa cập nhật'}</Text>
                                                            <br />
                                                            <Text>{item.note ? `Ghi chú: ${item.note}` : 'Ghi chú: chưa cập nhật'}</Text>
                                                        </>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalPitchDetails;
