import { InputNumber, Spin, Input, Typography, Switch, Checkbox, Image } from "antd";
import { useCallback, useEffect, useState } from "react";
import { clientGetPitchEquipmentsBorrowable } from "../../../../config/Api";
import type { EquipmentMobilityEnum, IPitchEquipment } from "../../../../types/pitchEquipment";

const { Text } = Typography;

export type IBorrowLinePayload = {
    equipmentId: number;
    equipmentMobility: EquipmentMobilityEnum;
    quantity: number;
    /** Ghi chú tình trạng riêng cho dòng thiết bị này (ưu tiên hơn ghi chú chung). */
    borrowConditionNote?: string;
};

export type IBorrowPlanOptions = {
    borrowConditionAcknowledged: boolean;
    borrowReportPrintOptIn: boolean;
};

interface IProps {
    pitchId: number;
    isAuthenticated: boolean;
    onPlanChange?: (lines: IBorrowLinePayload[], borrowNote: string, opts: IBorrowPlanOptions) => void;
    onBorrowInteraction?: () => void;
    /** Đổi khi đổi booking / sân để reset form trong section. */
    sessionKey?: string;
    /** Tăng khi đã tải xong dữ liệu mượn cũ (để hydrate lại). */
    initialVersion?: number;
    /** Số lượng đang mượn (theo equipmentId) — preload khi sửa lịch. */
    initialQtyByEquipmentId?: Record<number, number>;
    initialBorrowNote?: string;
}

const defaultOpts: IBorrowPlanOptions = {
    borrowConditionAcknowledged: false,
    borrowReportPrintOptIn: false,
};

function equipmentImageSrc(imageUrl?: string | null): string | undefined {
    const t = imageUrl?.trim();
    if (!t) return undefined;
    return `/storage/equipment/${t}`;
}

const EquipmentBorrowSection = ({
    pitchId,
    isAuthenticated,
    onPlanChange,
    onBorrowInteraction,
    sessionKey = "default",
    initialVersion = 0,
    initialQtyByEquipmentId,
    initialBorrowNote = "",
}: IProps) => {
    const [items, setItems] = useState<IPitchEquipment[]>([]);
    const [equipLoading, setEquipLoading] = useState(false);
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [rowOn, setRowOn] = useState<Record<number, boolean>>({});
    const [rowNotes, setRowNotes] = useState<Record<number, string>>({});
    const [borrowNote, setBorrowNote] = useState("");
    const [borrowOpts, setBorrowOpts] = useState<IBorrowPlanOptions>(defaultOpts);
    const [hydrated, setHydrated] = useState(false);

    const reload = useCallback(() => {
        if (!pitchId) return;
        setEquipLoading(true);
        clientGetPitchEquipmentsBorrowable(pitchId)
            .then(res => {
                if (res.data.statusCode === 200) setItems(res.data.data ?? []);
            })
            .catch(() => setItems([]))
            .finally(() => setEquipLoading(false));
    }, [pitchId]);

    useEffect(() => {
        if (!isAuthenticated || !pitchId) {
            setItems([]);
            setQuantities({});
            setRowOn({});
            setRowNotes({});
            setHydrated(false);
            return;
        }
        reload();
    }, [isAuthenticated, pitchId, reload]);

    useEffect(() => {
        setHydrated(false);
    }, [sessionKey, pitchId, initialVersion]);

    useEffect(() => {
        if (equipLoading || items.length === 0 || hydrated) return;

        const q: Record<number, number> = {};
        const on: Record<number, boolean> = {};
        for (const pe of items) {
            const maxQty = Math.min(pe.quantity ?? 0, pe.equipmentAvailableQuantity ?? 0);
            const init = initialQtyByEquipmentId?.[pe.equipmentId] ?? 0;
            const clamped = Math.min(Math.max(init, 0), maxQty);
            if (clamped > 0) {
                q[pe.id] = clamped;
                on[pe.id] = true;
            } else {
                q[pe.id] = 0;
                on[pe.id] = false;
            }
        }
        setQuantities(q);
        setRowOn(on);
        setRowNotes({});
        setBorrowNote(initialBorrowNote ?? "");
        setBorrowOpts(defaultOpts);
        setHydrated(true);
    }, [equipLoading, items, hydrated, initialQtyByEquipmentId, initialBorrowNote]);

    useEffect(() => {
        if (!onPlanChange) return;
        const lines: IBorrowLinePayload[] = [];
        for (const pe of items) {
            if (!rowOn[pe.id]) continue;
            const q = quantities[pe.id] ?? 0;
            if (q > 0) {
                const per = rowNotes[pe.id]?.trim();
                const global = borrowNote.trim();
                lines.push({
                    equipmentId: pe.equipmentId,
                    equipmentMobility: pe.equipmentMobility,
                    quantity: q,
                    borrowConditionNote: per || global || undefined,
                });
            }
        }
        onPlanChange(lines, borrowNote, borrowOpts);
    }, [items, quantities, borrowNote, rowOn, rowNotes, borrowOpts, onPlanChange]);

    if (!isAuthenticated) return null;

    const anyBorrow = items.some(pe => rowOn[pe.id] && (quantities[pe.id] ?? 0) > 0);

    const renderBorrowRows = (list: IPitchEquipment[]) => (
        <>
            {list.length === 0 ? (
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    Chưa có thiết bị <strong>cho mượn</strong> nào trên sân (hoặc đang hết hàng / không hoạt động). Thiết bị cố
                    định (đèn, lưới, khung thành…) xem ở mô tả sân.
                </div>
            ) : (
                list.map(pe => {
                    const maxQty = Math.min(pe.quantity ?? 0, pe.equipmentAvailableQuantity ?? 0);
                    const disabled = maxQty <= 0;
                    const isOn = !!rowOn[pe.id];
                    const imgSrc = equipmentImageSrc(pe.equipmentImageUrl);
                    return (
                        <div key={pe.id} className="bk__equip-row">
                            <div
                                style={{
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                    width: "100%",
                                }}
                            >
                                <div className="bk__equip-thumb" style={{ flexShrink: 0 }}>
                                    {imgSrc ? (
                                        <Image
                                            src={imgSrc}
                                            alt={pe.equipmentName}
                                            width={80}
                                            height={80}
                                            style={{ objectFit: "cover", borderRadius: 8, display: "block" }}
                                            preview={{ mask: "Xem ảnh lớn" }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 8,
                                                border: "1px dashed rgba(128, 128, 128, 0.35)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 11,
                                                opacity: 0.7,
                                                textAlign: "center",
                                                padding: 6,
                                                lineHeight: 1.25,
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            Chưa có ảnh minh họa
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="bk__equip-row__head">
                                        <span className="bk__equip-label">
                                            {pe.equipmentName}
                                            <span className="bk__equip-avail"> (tối đa {maxQty} / sân)</span>
                                        </span>
                                        <Switch
                                            className="bk__equip-switch"
                                            checked={isOn}
                                            disabled={disabled}
                                            checkedChildren="Mượn"
                                            unCheckedChildren="Không"
                                            onChange={checked => {
                                                setRowOn(prev => ({ ...prev, [pe.id]: checked }));
                                                setQuantities(prev => ({
                                                    ...prev,
                                                    [pe.id]: checked ? Math.max(1, Math.min(prev[pe.id] || 1, maxQty)) : 0,
                                                }));
                                                onBorrowInteraction?.();
                                            }}
                                        />
                                    </div>
                                    {isOn && !disabled && (
                                        <div
                                            style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                                        >
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Số lượng
                                            </Text>
                                            <InputNumber
                                                className="bk__equip-qty"
                                                min={1}
                                                max={maxQty}
                                                value={quantities[pe.id] ?? 1}
                                                onChange={val => {
                                                    const v = val ?? 1;
                                                    setQuantities(prev => ({ ...prev, [pe.id]: v }));
                                                    onBorrowInteraction?.();
                                                }}
                                            />
                                        </div>
                                    )}
                                    {isOn && !disabled && (
                                        <div style={{ marginTop: 6, width: "100%" }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                Ghi chú tình trạng (thiết bị này)
                                            </Text>
                                            <Input.TextArea
                                                rows={2}
                                                value={rowNotes[pe.id] ?? ""}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    setRowNotes(prev => ({ ...prev, [pe.id]: v }));
                                                    onBorrowInteraction?.();
                                                }}
                                                placeholder="Tùy chọn — ví dụ: còn tốt, có vết trầy nhẹ…"
                                                style={{ marginTop: 4, fontSize: 12 }}
                                            />
                                        </div>
                                    )}
                                    {disabled && <span className="bk__equip-unavail">Hết hàng</span>}
                                    {pe.equipmentConditionNote ? (
                                        <div style={{ fontSize: 11, opacity: 0.8, width: "100%", marginTop: 4 }}>
                                            Ghi chú từ sân: {pe.equipmentConditionNote}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </>
    );

    return (
        <div className="bk__equipment-section">
            <p className="bk__section-title">Thiết bị mượn thêm (lưu động)</p>
            <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                Bật <strong>Mượn</strong> từng loại thiết bị rồi nhập số lượng. Xem ảnh minh họa để đối chiếu với mô tả trước khi tick xác
                nhận biên bản. Có thể ghi chú riêng từng loại; tắt nếu không mượn loại đó.
            </p>

            {equipLoading ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                    <Spin size="small" />
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 12 }}>
                        <Text strong>Chọn thiết bị mượn kèm booking</Text>
                        {renderBorrowRows(items)}
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Ghi chú chung biên bản lúc mượn (áp dụng nếu không nhập riêng từng dòng)
                        </Text>
                        <Input.TextArea
                            rows={2}
                            value={borrowNote}
                            onChange={e => {
                                setBorrowNote(e.target.value);
                                onBorrowInteraction?.();
                            }}
                            placeholder="Tình trạng khi giao, số seri, vết trầy…"
                            style={{ marginTop: 4 }}
                        />
                    </div>
                    {anyBorrow && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: "10px 12px",
                                borderRadius: 8,
                                background: "rgba(250, 173, 20, 0.08)",
                                border: "1px solid rgba(250, 173, 20, 0.25)",
                            }}
                        >
                            <Text strong style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
                                Biên bản mượn & xác nhận tình trạng
                            </Text>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <Checkbox
                                    checked={borrowOpts.borrowConditionAcknowledged}
                                    onChange={e =>
                                        setBorrowOpts(prev => ({ ...prev, borrowConditionAcknowledged: e.target.checked }))
                                    }
                                >
                                    Tôi xác nhận đã kiểm tra tình trạng thiết bị (tránh khiếu nại khi trả).
                                </Checkbox>
                                <Checkbox
                                    checked={borrowOpts.borrowReportPrintOptIn}
                                    onChange={e =>
                                        setBorrowOpts(prev => ({ ...prev, borrowReportPrintOptIn: e.target.checked }))
                                    }
                                >
                                    In / lưu biên bản mượn (có chữ ký chủ sân xác nhận hiện trạng).
                                </Checkbox>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default EquipmentBorrowSection;
