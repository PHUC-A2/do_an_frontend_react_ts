import { Avatar, Descriptions, Drawer, Spin, Tag } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import type { IEquipment } from '../../../../types/equipment';
import { EQUIPMENT_STATUS_META } from '../../../../utils/constants/equipment.constants';
import { formatInstant } from '../../../../utils/format/localdatetime';

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    equipment: IEquipment | null;
    isLoading: boolean;
}

const ModalEquipmentDetails = ({ open, setOpen, equipment, isLoading }: IProps) => {
    return (
        <Drawer
            title="Chi tiết thiết bị"
            placement="right"
            onClose={() => setOpen(false)}
            open={open}
        >
            <Spin spinning={isLoading}>
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Ảnh">
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Avatar
                                size={80}
                                src={equipment?.imageUrl ? `/storage/equipment/${equipment.imageUrl}` : undefined}
                                icon={!equipment?.imageUrl && <AppstoreOutlined />}
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
                        {equipment?.price.toLocaleString('vi-VN')} đ
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {equipment?.status ? (
                            <Tag color={EQUIPMENT_STATUS_META[equipment.status].color}>
                                {EQUIPMENT_STATUS_META[equipment.status].label}
                            </Tag>
                        ) : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">{equipment?.createdBy ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{formatInstant(equipment?.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">{equipment?.updatedBy || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày cập nhật">{formatInstant(equipment?.updatedAt)}</Descriptions.Item>
                </Descriptions>
            </Spin>
        </Drawer>
    );
};

export default ModalEquipmentDetails;
