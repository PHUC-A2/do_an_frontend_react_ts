import { InputNumber, Spin, Input, Typography, Switch } from "antd";
import { useCallback, useEffect, useState } from "react";
import { clientGetPitchEquipmentsBorrowable } from "../../../../config/Api";
import type { EquipmentMobilityEnum, IPitchEquipment } from "../../../../types/pitchEquipment";

const { Text } = Typography;

export type IBorrowLinePayload = {
    equipmentId: number;
    equipmentMobility: EquipmentMobilityEnum;
    quantity: number;
};

interface IProps {
    pitchId: number;
    isAuthenticated: boolean;
    onPlanChange?: (lines: IBorrowLinePayload[], borrowNote: string) => void;
    onBorrowInteraction?: () => void;
    /** Đổi khi đổi booking / sân để reset form trong section. */
    sessionKey?: string;
    /** Tăng khi đã tải xong dữ liệu mượn cũ (để hydrate lại). */
    initialVersion?: number;
    /** Số lượng đang mượn (theo equipmentId) — preload khi sửa lịch. */
    initialQtyByEquipmentId?: Record<number, number>;
    initialBorrowNote?: string;
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
    const [borrowNote, setBorrowNote] = useState("");
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
        setBorrowNote(initialBorrowNote ?? "");
        setHydrated(true);
    }, [equipLoading, items, hydrated, initialQtyByEquipmentId, initialBorrowNote]);

    useEffect(() => {
        if (!onPlanChange) return;
        const lines: IBorrowLinePayload[] = [];
        for (const pe of items) {
            if (!rowOn[pe.id]) continue;
            const q = quantities[pe.id] ?? 0;
            if (q > 0) {
                lines.push({
                    equipmentId: pe.equipmentId,
                    equipmentMobility: pe.equipmentMobility,
                    quantity: q,
                });
            }
        }
        onPlanChange(lines, borrowNote);
    }, [items, quantities, borrowNote, rowOn, onPlanChange]);

    if (!isAuthenticated) return null;

    const renderBorrowRows = (list: IPitchEquipment[]) => (
        <>
            {list.length === 0 ? (
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                    Chưa có thiết bị <strong>cho mượn</strong> nào trên sân (hoặc đang hết hàng / không hoạt động). Thiết bị cố định
                    (đèn, lưới, khung thành…) xem ở mô tả sân.
                </div>
            ) : (
                list.map(pe => {
                    const maxQty = Math.min(pe.quantity ?? 0, pe.equipmentAvailableQuantity ?? 0);
                    const disabled = maxQty <= 0;
                    const isOn = !!rowOn[pe.id];
                    return (
                        <div key={pe.id} className="bk__equip-row">
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
                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>Số lượng</Text>
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
                            {disabled && <span className="bk__equip-unavail">Hết hàng</span>}
                            {pe.equipmentConditionNote ? (
                                <div style={{ fontSize: 11, opacity: 0.8, width: "100%", marginTop: 4 }}>
                                    Ghi chú tình trạng: {pe.equipmentConditionNote}
                                </div>
                            ) : null}
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
                Bật <strong>Mượn</strong> từng loại thiết bị rồi nhập số lượng. Tắt nếu không mượn loại đó (ví dụ chỉ mượn bóng, không mượn
                áo).
            </p>

            {equipLoading ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}><Spin size="small" /></div>
            ) : (
                <>
                    <div style={{ marginBottom: 12 }}>
                        <Text strong>Chọn thiết bị mượn kèm booking</Text>
                        {renderBorrowRows(items)}
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Ghi chú biên bản lúc mượn (tùy chọn)</Text>
                        <Input.TextArea
                            rows={2}
                            value={borrowNote}
                            onChange={e => {
                                setBorrowNote(e.target.value);
                                onBorrowInteraction?.();
                            }}
                            placeholder="Tình trạng khi giao, số seri, vết trầy..."
                            style={{ marginTop: 4 }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default EquipmentBorrowSection;
