import { Modal, Table, InputNumber, Button, Tag, Space, Empty, Spin, Input, Typography, Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { clientGetPitchEquipmentsBorrowable, clientBorrowEquipment } from '../../../../config/Api';
import type { IPitchEquipment } from '../../../../types/pitchEquipment';
import type { IBookingEquipment } from '../../../../types/bookingEquipment';

const { Text } = Typography;

interface IProps {
    open: boolean;
    onClose: () => void;
    bookingId: number | null;
    /** Thiết bị chỉ mượn theo cấu hình của sân (booking). */
    pitchId: number | null;
}

const ModalBorrowEquipment = ({ open, onClose, bookingId, pitchId }: IProps) => {
    const [rows, setRows] = useState<IPitchEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [borrowing, setBorrowing] = useState<Record<number, boolean>>({});
    const [borrowed, setBorrowed] = useState<IBookingEquipment[]>([]);
    const [borrowNote, setBorrowNote] = useState('');
    const [borrowAck, setBorrowAck] = useState(false);
    const [borrowPrintOptIn, setBorrowPrintOptIn] = useState(false);

    useEffect(() => {
        if (open) {
            setBorrowAck(false);
            setBorrowPrintOptIn(false);
        }
    }, [open]);

    useEffect(() => {
        if (!open || !pitchId) {
            setRows([]);
            return;
        }
        setLoading(true);
        clientGetPitchEquipmentsBorrowable(pitchId)
            .then(res => {
                if (res.data.statusCode === 200) setRows(res.data.data ?? []);
            })
            .catch(() => toast.error('Không tải được thiết bị của sân'))
            .finally(() => setLoading(false));
    }, [open, pitchId]);

    const handleBorrow = async (pe: IPitchEquipment) => {
        if (!bookingId) return;
        if (!borrowAck) {
            toast.warning('Vui lòng tích xác nhận đã kiểm tra tình trạng thiết bị trước khi mượn.');
            return;
        }
        const qty = quantities[pe.id] ?? 1;
        const maxQty = Math.min(pe.quantity ?? 0, pe.equipmentAvailableQuantity ?? 0);
        if (maxQty <= 0 || qty > maxQty) {
            toast.warning('Số lượng không hợp lệ');
            return;
        }

        setBorrowing(prev => ({ ...prev, [pe.id]: true }));
        try {
            const res = await clientBorrowEquipment({
                bookingId,
                equipmentId: pe.equipmentId,
                quantity: qty,
                equipmentMobility: pe.equipmentMobility,
                borrowConditionNote: borrowNote.trim() || undefined,
                borrowConditionAcknowledged: true,
                borrowReportPrintOptIn: borrowPrintOptIn,
            });
            if (res.data.statusCode === 201 && res.data.data) {
                toast.success(`Đã mượn ${qty} ${pe.equipmentName}`);
                setBorrowed(prev => [...prev, res.data.data!]);
                setRows(prev =>
                    prev.map(r =>
                        r.id === pe.id
                            ? {
                                  ...r,
                                  equipmentAvailableQuantity: Math.max(
                                      0,
                                      (r.equipmentAvailableQuantity ?? 0) - qty
                                  ),
                              }
                            : r
                    )
                );
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? 'Không xác định';
            toast.error(m);
        } finally {
            setBorrowing(prev => ({ ...prev, [pe.id]: false }));
        }
    };

    const handleClose = () => {
        setBorrowed([]);
        setQuantities({});
        setRows([]);
        setBorrowNote('');
        setBorrowAck(false);
        setBorrowPrintOptIn(false);
        onClose();
    };

    const columns: ColumnsType<IPitchEquipment> = [
        {
            title: 'Thiết bị',
            key: 'name',
            render: (_: unknown, pe: IPitchEquipment) => (
                <Space>
                    {pe.equipmentImageUrl && (
                        <img
                            src={`/storage/equipment/${pe.equipmentImageUrl}`}
                            alt={pe.equipmentName}
                            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                        />
                    )}
                    <span>{pe.equipmentName}</span>
                </Space>
            ),
        },
        {
            title: 'Loại',
            key: 'mobility',
            width: 100,
            render: (_: unknown, pe: IPitchEquipment) => (
                <Tag color={pe.equipmentMobility === 'MOVABLE' ? 'blue' : 'geekblue'}>
                    {pe.equipmentMobility === 'MOVABLE' ? 'Lưu động' : 'Cố định'}
                </Tag>
            ),
        },
        {
            title: 'Còn mượn',
            key: 'avail',
            width: 90,
            render: (_: unknown, pe: IPitchEquipment) => {
                const a = Math.min(pe.quantity ?? 0, pe.equipmentAvailableQuantity ?? 0);
                return <Tag color={a > 0 ? 'green' : 'red'}>{a}</Tag>;
            },
        },
        {
            title: 'SL mượn',
            key: 'qty',
            width: 100,
            render: (_: unknown, pe: IPitchEquipment) => {
                const maxQty = Math.min(pe.quantity ?? 0, pe.equipmentAvailableQuantity ?? 0);
                return (
                    <InputNumber
                        min={1}
                        max={Math.max(1, maxQty)}
                        value={quantities[pe.id] ?? 1}
                        onChange={val => setQuantities(prev => ({ ...prev, [pe.id]: val ?? 1 }))}
                        style={{ width: 72 }}
                        disabled={maxQty <= 0}
                    />
                );
            },
        },
        {
            title: '',
            key: 'action',
            width: 100,
            render: (_: unknown, pe: IPitchEquipment) => {
                const maxQty = Math.min(pe.quantity ?? 0, pe.equipmentAvailableQuantity ?? 0);
                return (
                    <Button
                        type="primary"
                        size="small"
                        loading={borrowing[pe.id]}
                        disabled={maxQty <= 0}
                        onClick={() => handleBorrow(pe)}
                    >
                        Mượn
                    </Button>
                );
            },
        },
    ];

    return (
        <Modal
            title="Mượn thiết bị theo sân"
            open={open}
            onCancel={handleClose}
            footer={
                <Button type="primary" onClick={handleClose}>
                    Hoàn tất
                </Button>
            }
            width={720}
        >
            {!pitchId && (
                <Empty description="Thiếu thông tin sân — không thể tải thiết bị" style={{ margin: '24px 0' }} />
            )}

            {pitchId != null && (
                <>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                        Chỉ hiển thị thiết bị admin đã gắn với sân này. Ghi chú áp dụng cho các lần mượn tiếp theo trong
                        phiên.
                    </Text>
                    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Checkbox checked={borrowAck} onChange={e => setBorrowAck(e.target.checked)}>
                            Tôi xác nhận đã kiểm tra tình trạng thiết bị (biên bản mượn).
                        </Checkbox>
                        <Checkbox checked={borrowPrintOptIn} onChange={e => setBorrowPrintOptIn(e.target.checked)}>
                            In / lưu biên bản mượn (có chỗ ký chủ sân).
                        </Checkbox>
                    </div>
                    <Input.TextArea
                        rows={2}
                        value={borrowNote}
                        onChange={e => setBorrowNote(e.target.value)}
                        placeholder="Ghi chú biên bản lúc mượn (tùy chọn)"
                        style={{ marginBottom: 12 }}
                    />
                </>
            )}

            {borrowed.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                    <strong>Đã mượn:</strong>{' '}
                    {borrowed.map(b => (
                        <Tag key={b.id} color="blue">
                            {b.equipmentName} x{b.quantity}
                        </Tag>
                    ))}
                </div>
            )}

            {pitchId != null && loading ? (
                <div style={{ textAlign: 'center', padding: 32 }}>
                    <Spin />
                </div>
            ) : pitchId != null && rows.length === 0 ? (
                <Empty description="Sân chưa có thiết bị cho mượn hoặc đã hết hàng" />
            ) : pitchId != null ? (
                <Table<IPitchEquipment>
                    columns={columns}
                    dataSource={rows}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    bordered
                />
            ) : null}
        </Modal>
    );
};

export default ModalBorrowEquipment;
