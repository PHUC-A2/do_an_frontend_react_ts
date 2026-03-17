import { Modal, Table, InputNumber, Button, Tag, Space, Empty, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { getPublicEquipments, clientBorrowEquipment } from '../../../../config/Api';
import type { IEquipment } from '../../../../types/equipment';
import type { IBookingEquipment } from '../../../../types/bookingEquipment';

interface IProps {
    open: boolean;
    onClose: () => void;
    bookingId: number | null;
}

const ModalBorrowEquipment = ({ open, onClose, bookingId }: IProps) => {
    const [equipments, setEquipments] = useState<IEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [borrowing, setBorrowing] = useState<Record<number, boolean>>({});
    const [borrowed, setBorrowed] = useState<IBookingEquipment[]>([]);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        getPublicEquipments()
            .then(res => {
                if (res.data.statusCode === 200) {
                    setEquipments(res.data.data ?? []);
                }
            })
            .catch(() => toast.error('Không tải được danh sách thiết bị'))
            .finally(() => setLoading(false));
    }, [open]);

    const handleBorrow = async (equipment: IEquipment) => {
        if (!bookingId) return;
        const qty = quantities[equipment.id] ?? 1;

        setBorrowing(prev => ({ ...prev, [equipment.id]: true }));
        try {
            const res = await clientBorrowEquipment({
                bookingId,
                equipmentId: equipment.id,
                quantity: qty,
            });
            if (res.data.statusCode === 201 && res.data.data) {
                toast.success(`Đã mượn ${qty} ${equipment.name}`);
                setBorrowed(prev => [...prev, res.data.data!]);
                // Giảm availableQuantity hiển thị
                setEquipments(prev =>
                    prev.map(e =>
                        e.id === equipment.id
                            ? { ...e, availableQuantity: e.availableQuantity - qty }
                            : e
                    ).filter(e => e.availableQuantity > 0)
                );
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(m);
        } finally {
            setBorrowing(prev => ({ ...prev, [equipment.id]: false }));
        }
    };

    const handleClose = () => {
        setBorrowed([]);
        setQuantities({});
        setEquipments([]);
        onClose();
    };

    const columns: ColumnsType<IEquipment> = [
        {
            title: 'Thiết bị',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: IEquipment) => (
                <Space>
                    {record.imageUrl && (
                        <img
                            src={`/storage/equipment/${record.imageUrl}`}
                            alt={name}
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                        />
                    )}
                    <span>{name}</span>
                </Space>
            ),
        },
        {
            title: 'Còn lại',
            dataIndex: 'availableQuantity',
            key: 'availableQuantity',
            render: (qty: number) => <Tag color={qty > 0 ? 'green' : 'red'}>{qty}</Tag>,
        },
        {
            title: 'Giá trị',
            dataIndex: 'price',
            key: 'price',
            render: (price: number) => price.toLocaleString('vi-VN') + ' đ',
        },
        {
            title: 'Số lượng mượn',
            key: 'qty',
            render: (_: any, record: IEquipment) => (
                <InputNumber
                    min={1}
                    max={record.availableQuantity}
                    value={quantities[record.id] ?? 1}
                    onChange={val => setQuantities(prev => ({ ...prev, [record.id]: val ?? 1 }))}
                    style={{ width: 70 }}
                />
            ),
        },
        {
            title: '',
            key: 'action',
            render: (_: any, record: IEquipment) => (
                <Button
                    type="primary"
                    size="small"
                    loading={borrowing[record.id]}
                    onClick={() => handleBorrow(record)}
                >
                    Mượn
                </Button>
            ),
        },
    ];

    return (
        <Modal
            title="Mượn thiết bị (tuỳ chọn)"
            open={open}
            onCancel={handleClose}
            footer={
                <Button type="primary" onClick={handleClose}>
                    Hoàn tất
                </Button>
            }
            width={680}
        >
            {borrowed.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                    <strong>Đã mượn:</strong>{' '}
                    {borrowed.map(b => (
                        <Tag key={b.id} color="blue">{b.equipmentName} x{b.quantity}</Tag>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
            ) : equipments.length === 0 ? (
                <Empty description="Hiện không có thiết bị nào để mượn" />
            ) : (
                <Table<IEquipment>
                    columns={columns}
                    dataSource={equipments}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    bordered
                />
            )}
        </Modal>
    );
};

export default ModalBorrowEquipment;
