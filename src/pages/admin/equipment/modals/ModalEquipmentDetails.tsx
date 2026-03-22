import { Avatar, Collapse, Descriptions, Divider, Drawer, List, Space, Spin, Tag, Typography } from 'antd';
import { AppstoreOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { useEffect, useState } from 'react';

import { adminGetEquipmentPitchAssignments } from '../../../../config/Api';
import type { IEquipment } from '../../../../types/equipment';
import type { IEquipmentPitchAssignment } from '../../../../types/pitchEquipment';
import { EQUIPMENT_STATUS_META } from '../../../../utils/constants/equipment.constants';
import { formatInstant } from '../../../../utils/format/localdatetime';

const { Text } = Typography;

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    equipment: IEquipment | null;
    isLoading: boolean;
}

const ModalEquipmentDetails = ({ open, setOpen, equipment, isLoading }: IProps) => {
    const [assignments, setAssignments] = useState<IEquipmentPitchAssignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    useEffect(() => {
        if (!open || !equipment?.id) {
            setAssignments([]);
            return;
        }
        setLoadingAssignments(true);
        adminGetEquipmentPitchAssignments(equipment.id)
            .then(res => {
                if (Number(res.data.statusCode) === 200) setAssignments(res.data.data ?? []);
                else setAssignments([]);
            })
            .catch(() => setAssignments([]))
            .finally(() => setLoadingAssignments(false));
    }, [open, equipment?.id]);

    const imgSrc = equipment?.imageUrl
        ? /^https?:\/\//i.test(equipment.imageUrl) || equipment.imageUrl.startsWith('/')
            ? equipment.imageUrl
            : `/storage/equipment/${equipment.imageUrl}`
        : undefined;

    return (
        <Drawer title="Chi tiết thiết bị" placement="right" width={420} onClose={() => setOpen(false)} open={open}>
            <Spin spinning={isLoading || loadingAssignments}>
                <Collapse
                    defaultActiveKey={['general', 'pitches', 'meta']}
                    items={[
                        {
                            key: 'general',
                            label: (
                                <Space>
                                    <InfoCircleOutlined />
                                    <span>Thông tin thiết bị</span>
                                </Space>
                            ),
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Ảnh">
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <Avatar
                                                size={80}
                                                src={imgSrc}
                                                icon={!imgSrc && <AppstoreOutlined />}
                                                shape="square"
                                                style={{ backgroundColor: '#2C3E50' }}
                                            />
                                        </div>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="ID">{equipment?.id}</Descriptions.Item>
                                    <Descriptions.Item label="Tên thiết bị">{equipment?.name ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Mô tả">{equipment?.description || '-'}</Descriptions.Item>
                                    <Descriptions.Item label="Tổng số lượng">{equipment?.totalQuantity}</Descriptions.Item>
                                    <Descriptions.Item label="Số lượng khả dụng">{equipment?.availableQuantity}</Descriptions.Item>
                                    <Descriptions.Item label="Giá trị">
                                        {equipment?.price != null ? equipment.price.toLocaleString('vi-VN') + ' đ' : 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Trạng thái">
                                        {equipment?.status ? (
                                            <Tag color={EQUIPMENT_STATUS_META[equipment.status].color}>
                                                {EQUIPMENT_STATUS_META[equipment.status].label}
                                            </Tag>
                                        ) : (
                                            'N/A'
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ghi chú tình trạng (kho)">
                                        {equipment?.conditionNote || '—'}
                                    </Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                        {
                            key: 'pitches',
                            label: 'Tài sản (sân) đang gắn thiết bị',
                            children: (
                                <>
                                    <Divider style={{ margin: '0 0 10px' }} />
                                    <List
                                        bordered
                                        dataSource={assignments}
                                        locale={{
                                            emptyText: 'Thiết bị chưa được gắn vào sân nào (pitch_equipments).',
                                        }}
                                        renderItem={item => (
                                            <List.Item>
                                                <List.Item.Meta
                                                    title={
                                                        <Space size={8} wrap>
                                                            <Link to={`/admin/pitch?openPitchId=${item.pitchId}`}>
                                                                {item.pitchName}
                                                            </Link>
                                                            <Tag color="processing">SL trên sân: {item.quantity}</Tag>
                                                            <Tag>
                                                                {item.equipmentMobility === 'MOVABLE'
                                                                    ? 'Lưu động (cho mượn)'
                                                                    : 'Cố định trên sân'}
                                                            </Tag>
                                                        </Space>
                                                    }
                                                    description={
                                                        <>
                                                            <Text type="secondary">pitch_equipment ID: {item.pitchEquipmentId}</Text>
                                                            <br />
                                                            <Text>
                                                                {item.specification
                                                                    ? `Thông số: ${item.specification}`
                                                                    : 'Thông số: chưa cập nhật'}
                                                            </Text>
                                                            <br />
                                                            <Text>
                                                                {item.note ? `Ghi chú: ${item.note}` : 'Ghi chú: chưa cập nhật'}
                                                            </Text>
                                                        </>
                                                    }
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </>
                            ),
                        },
                        {
                            key: 'meta',
                            label: 'Lịch sử cập nhật',
                            children: (
                                <Descriptions bordered column={1} size="small">
                                    <Descriptions.Item label="Người tạo">{equipment?.createdBy ?? 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo">{formatInstant(equipment?.createdAt)}</Descriptions.Item>
                                    <Descriptions.Item label="Người cập nhật">{equipment?.updatedBy || 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(equipment?.updatedAt)}</Descriptions.Item>
                                </Descriptions>
                            ),
                        },
                    ]}
                />
            </Spin>
        </Drawer>
    );
};

export default ModalEquipmentDetails;
