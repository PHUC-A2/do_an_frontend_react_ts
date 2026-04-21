import { memo, useEffect, useState, useCallback } from "react";
import { Modal, Input, InputNumber, Checkbox, Typography, Button, Space } from "antd";
import { toast } from "react-toastify";
import type { IBooking } from "../../../../types/booking";
import type { IBookingEquipment, IUpdateBookingEquipmentStatusReq } from "../../../../types/bookingEquipment";

const { Text } = Typography;

export type ClientReturnPreset = "full" | "lost" | "damaged";

export interface ClientReturnEquipmentModalProps {
    open: boolean;
    booking: IBooking | null;
    record: IBookingEquipment | null;
    preset: ClientReturnPreset;
    confirmLoading: boolean;
    onCancel: () => void;
    /**
     * Gọi khi hợp lệ. Trả về Promise reject (hoặc throw) để giữ modal mở khi lỗi.
     */
    onSubmit: (
        booking: IBooking | null,
        record: IBookingEquipment,
        req: IUpdateBookingEquipmentStatusReq,
        meta: {
            returnNote: string;
            g: number;
            l: number;
            d: number;
            returnReportPrintOptIn: boolean;
            borrowerSign: string;
            staffSign: string;
        }
    ) => Promise<void>;
}

function ClientReturnEquipmentModalInner({
    open,
    booking,
    record,
    preset,
    confirmLoading,
    onCancel,
    onSubmit,
}: ClientReturnEquipmentModalProps) {
    // State điều khiển modal xem trước biên bản trước khi xác nhận trả.
    const [openPreview, setOpenPreview] = useState(false);
    const [returnNote, setReturnNote] = useState("");
    const [returnReportPrintOptIn, setReturnReportPrintOptIn] = useState(false);
    const [returnQtyGood, setReturnQtyGood] = useState(0);
    const [returnQtyLost, setReturnQtyLost] = useState(0);
    const [returnQtyDamaged, setReturnQtyDamaged] = useState(0);
    const [borrowerSign, setBorrowerSign] = useState("");
    const [staffSign, setStaffSign] = useState("");
    const [returnerName, setReturnerName] = useState("");
    const [returnerPhone, setReturnerPhone] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");

    const resetFormForRecord = useCallback((rec: IBookingEquipment, p: ClientReturnPreset) => {
        const q = rec.quantity;
        setReturnNote("");
        setReturnReportPrintOptIn(false);
        setReturnerName("");
        setReturnerPhone("");
        setReceiverName("");
        setReceiverPhone("");
        setBorrowerSign("");
        setStaffSign("");
        if (p === "full") {
            setReturnQtyGood(q);
            setReturnQtyLost(0);
            setReturnQtyDamaged(0);
        } else if (p === "lost") {
            setReturnQtyGood(0);
            setReturnQtyLost(q);
            setReturnQtyDamaged(0);
        } else {
            setReturnQtyGood(0);
            setReturnQtyLost(0);
            setReturnQtyDamaged(q);
        }
    }, []);

    useEffect(() => {
        if (!open || !record) return;
        resetFormForRecord(record, preset);
    }, [open, record?.id, preset, record, resetFormForRecord]);

    useEffect(() => {
        if (!open) setOpenPreview(false);
    }, [open]);

    const handleOk = async () => {
        if (!record) return;
        const note = returnNote.trim();
        const q = record.quantity;
        const g = returnQtyGood;
        const l = returnQtyLost;
        const d = returnQtyDamaged;
        if (g + l + d !== q) {
            toast.error(`Tổng (trả tốt + mất + hỏng) phải bằng ${q}.`);
            return Promise.reject(new Error("keep-open"));
        }
        if (l + d > 0 && (!borrowerSign.trim() || !staffSign.trim())) {
            toast.error("Khi có mất hoặc hỏng, vui lòng nhập họ tên người mượn và nhân viên ký xác nhận.");
            return Promise.reject(new Error("keep-open"));
        }
        if (!receiverName.trim() || !receiverPhone.trim()) {
            toast.error("Vui lòng nhập họ tên và số điện thoại người nhận thiết bị tại sân (bên giao nhận).");
            return Promise.reject(new Error("keep-open"));
        }

        const req: IUpdateBookingEquipmentStatusReq = {
            status: "RETURNED",
            returnConditionNote: note || null,
            quantityReturnedGood: g,
            quantityLost: l,
            quantityDamaged: d,
            borrowerSignName: l + d > 0 ? borrowerSign.trim() : null,
            staffSignName: l + d > 0 ? staffSign.trim() : null,
            returnerName: returnerName.trim() || null,
            returnerPhone: returnerPhone.trim() || null,
            receiverName: receiverName.trim(),
            receiverPhone: receiverPhone.trim(),
            returnReportPrintOptIn,
        };

        await onSubmit(booking, record, req, {
            returnNote: note,
            g,
            l,
            d,
            returnReportPrintOptIn,
            borrowerSign: borrowerSign.trim(),
            staffSign: staffSign.trim(),
        });
    };

    return (
        <>
            <Modal
                title="Trả thiết bị & biên bản"
                width={520}
                open={open}
                onCancel={onCancel}
                footer={[
                    <Button key="cancel" onClick={onCancel}>
                        Hủy
                    </Button>,
                    <Button key="preview" onClick={() => setOpenPreview(true)} disabled={!record}>
                        Xem trước biên bản
                    </Button>,
                    <Button key="confirm" type="primary" loading={confirmLoading} onClick={() => void handleOk()}>
                        Xác Nhận
                    </Button>,
                ]}
                destroyOnHidden
            >
                {record && (
                    <>
                    <p style={{ marginBottom: 8 }}>
                        <strong>{record.equipmentName}</strong> × {record.quantity}
                    </p>
                    <Text type="secondary">Kiểm đếm (tổng phải bằng {record.quantity})</Text>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 10,
                            marginTop: 8,
                            marginBottom: 12,
                        }}
                    >
                        <div>
                            <div style={{ fontSize: 12, marginBottom: 4 }}>Trả tốt</div>
                            <InputNumber
                                min={0}
                                max={record.quantity}
                                style={{ width: "100%" }}
                                value={returnQtyGood}
                                onChange={v => setReturnQtyGood(v ?? 0)}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, marginBottom: 4 }}>Mất</div>
                            <InputNumber
                                min={0}
                                max={record.quantity}
                                style={{ width: "100%" }}
                                value={returnQtyLost}
                                onChange={v => setReturnQtyLost(v ?? 0)}
                            />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, marginBottom: 4 }}>Hỏng</div>
                            <InputNumber
                                min={0}
                                max={record.quantity}
                                style={{ width: "100%" }}
                                value={returnQtyDamaged}
                                onChange={v => setReturnQtyDamaged(v ?? 0)}
                            />
                        </div>
                    </div>
                    {returnQtyLost + returnQtyDamaged > 0 && (
                        <>
                            <Text type="secondary">Ký xác nhận khi có mất / hỏng (hiện trên biên bản in)</Text>
                            <Input
                                placeholder="Họ tên người mượn"
                                value={borrowerSign}
                                onChange={e => setBorrowerSign(e.target.value)}
                                style={{ marginTop: 6, marginBottom: 8 }}
                                autoComplete="off"
                            />
                            <Input
                                placeholder="Họ tên nhân viên / bên giao nhận"
                                value={staffSign}
                                onChange={e => setStaffSign(e.target.value)}
                                style={{ marginBottom: 12 }}
                                autoComplete="off"
                            />
                        </>
                    )}
                    <Text type="secondary">Người trả thực tế (để trống = người đặt sân)</Text>
                    <Input
                        placeholder="Họ tên người giao trả"
                        value={returnerName}
                        onChange={e => setReturnerName(e.target.value)}
                        style={{ marginTop: 6, marginBottom: 8 }}
                        autoComplete="off"
                    />
                    <Input
                        placeholder="Số điện thoại người trả (tùy chọn)"
                        value={returnerPhone}
                        onChange={e => setReturnerPhone(e.target.value)}
                        style={{ marginBottom: 8 }}
                        autoComplete="off"
                    />
                    <Text type="secondary">Người nhận thiết bị tại sân (nhân viên / bên giao nhận — bắt buộc)</Text>
                    <Input
                        placeholder="Họ tên người nhận"
                        value={receiverName}
                        onChange={e => setReceiverName(e.target.value)}
                        style={{ marginTop: 6, marginBottom: 8 }}
                        autoComplete="off"
                    />
                    <Input
                        placeholder="Số điện thoại người nhận"
                        value={receiverPhone}
                        onChange={e => setReceiverPhone(e.target.value)}
                        style={{ marginBottom: 12 }}
                        autoComplete="off"
                    />
                    <Text type="secondary">Ghi chú biên bản khi trả (tình trạng nhận lại)</Text>
                    <Input.TextArea
                        rows={3}
                        value={returnNote}
                        onChange={e => setReturnNote(e.target.value)}
                        placeholder="VD: đủ phụ kiện, có trầy nhẹ…"
                        style={{ marginTop: 8, marginBottom: 12 }}
                    />
                    <Checkbox checked={returnReportPrintOptIn} onChange={e => setReturnReportPrintOptIn(e.target.checked)}>
                        In / lưu biên bản trả (chữ ký chủ sân — tùy chọn)
                    </Checkbox>
                    </>
                )}
            </Modal>

            <Modal
                title="Xem trước biên bản trả thiết bị"
                width={560}
                open={openPreview && !!record}
                onCancel={() => setOpenPreview(false)}
                footer={
                    <Space>
                        <Button onClick={() => setOpenPreview(false)}>Đóng</Button>
                        <Button type="primary" onClick={() => void handleOk()} loading={confirmLoading}>
                            Xác Nhận
                        </Button>
                    </Space>
                }
                destroyOnHidden
            >
                {record && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <Text>
                            <strong>Thiết bị:</strong> {record.equipmentName} × {record.quantity}
                        </Text>
                        <Text>
                            <strong>Kiểm đếm:</strong> Trả tốt {returnQtyGood} / Mất {returnQtyLost} / Hỏng {returnQtyDamaged}
                        </Text>
                        <Text>
                            <strong>Người trả thực tế:</strong> {returnerName.trim() || booking?.userName || "—"}
                            {returnerPhone.trim() ? ` — ${returnerPhone.trim()}` : ""}
                        </Text>
                        <Text>
                            <strong>Người nhận tại sân:</strong> {receiverName.trim() || "—"}
                            {receiverPhone.trim() ? ` — ${receiverPhone.trim()}` : ""}
                        </Text>
                        <Text>
                            <strong>Ghi chú trả:</strong> {returnNote.trim() || "—"}
                        </Text>
                        {returnQtyLost + returnQtyDamaged > 0 ? (
                            <Text>
                                <strong>Ký xác nhận mất / hỏng:</strong> {borrowerSign.trim() || "—"} / {staffSign.trim() || "—"}
                            </Text>
                        ) : null}
                        <Text>
                            <strong>In / lưu biên bản trả:</strong> {returnReportPrintOptIn ? "Có" : "Không"}
                        </Text>
                    </div>
                )}
            </Modal>
        </>
    );
}

export const ClientReturnEquipmentModal = memo(ClientReturnEquipmentModalInner);
