import { Checkbox, Image, Input, InputNumber, Spin, Switch, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getPublicAssetDevices } from '../../../../../config/Api';
import type { DeviceType, IDevice } from '../../../../../types/device';
import { toast } from 'react-toastify';
import { DEVICE_STATUS_META, DEVICE_TYPE_META } from '../../../../../utils/constants/device.constants';

const { Text } = Typography;

export type IRoomBorrowLinePayload = {
    /** ID thiết bị (devices.id). */
    deviceId: number;
    deviceName: string;
    deviceType: DeviceType;
    quantity: number;
    /** Ghi chú tình trạng cho riêng thiết bị này. */
    deviceNote?: string;

    /** Ảnh minh họa thiết bị (tên file hoặc URL) để đưa vào biên bản in. */
    deviceImageUrl?: string | null;
};

export type IRoomBorrowPlanOptions = {
    /** Xác nhận đã kiểm tra tình trạng thiết bị trước khi nhận/mượn. */
    borrowConditionAcknowledged: boolean;
    /** Tùy chọn in/lưu biên bản nhận phòng. */
    borrowReportPrintOptIn: boolean;
};

interface IProps {
    assetId: number;
    isAuthenticated: boolean;
    onPlanChange?: (lines: IRoomBorrowLinePayload[], note: string, opts: IRoomBorrowPlanOptions) => void;
    onBorrowInteraction?: () => void;

    /** Đổi khi người dùng tạo/sửa booking để reset section. */
    sessionKey?: string;
    /** Tăng khi đã preload dữ liệu cũ để hydrate lại. */
    initialVersion?: number;

    /** Số lượng đang chọn mượn theo deviceId (preload khi cập nhật). */
    initialQtyByDeviceId?: Record<number, number>;
    /** Ghi chú theo deviceId (preload khi cập nhật). */
    initialDeviceNotesByDeviceId?: Record<number, string>;
    /** Ghi chú chung tình trạng (preload khi cập nhật). */
    initialBorrowNote?: string;

    initialBorrowConditionAcknowledged?: boolean;
    initialBorrowReportPrintOptIn?: boolean;
}

const defaultOpts: IRoomBorrowPlanOptions = {
    borrowConditionAcknowledged: false,
    borrowReportPrintOptIn: false,
};

/** Ghép đường dẫn thumbnail cho imageUrl thiết bị (imageUrl lưu tên file, không phải URL đầy đủ). */
function deviceImageSrc(imageUrl?: string | null): string | undefined {
    const t = imageUrl?.trim();
    if (!t) return undefined;
    if (/^https?:\/\//i.test(t)) return t;
    if (t.startsWith('/')) return t;
    return `/storage/device/${t}`;
}

const RoomEquipmentBorrowSection = ({
    assetId,
    isAuthenticated,
    onPlanChange,
    onBorrowInteraction,
    sessionKey = 'default',
    initialVersion = 0,
    initialQtyByDeviceId,
    initialDeviceNotesByDeviceId,
    initialBorrowNote = '',
    initialBorrowConditionAcknowledged,
    initialBorrowReportPrintOptIn,
}: IProps) => {
    const [items, setItems] = useState<IDevice[]>([]);
    const [loading, setLoading] = useState(false);

    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [rowOn, setRowOn] = useState<Record<number, boolean>>({});
    const [deviceNotes, setDeviceNotes] = useState<Record<number, string>>({});

    const [borrowNote, setBorrowNote] = useState('');
    const [borrowOpts, setBorrowOpts] = useState<IRoomBorrowPlanOptions>(defaultOpts);
    const [hydrated, setHydrated] = useState(false);

    // Chỉ lấy thiết bị lưu động (MOVABLE), tương tự luồng “mượn” của sân.
    const movableItems = useMemo(() => items.filter((d) => d.deviceType === 'MOVABLE'), [items]);

    const reload = useCallback(async () => {
        if (!assetId) return;
        setLoading(true);
        try {
            const res = await getPublicAssetDevices(assetId);
            setItems(res.data.data ?? []);
        } catch {
            toast.error('Không tải được danh sách thiết bị của phòng');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [assetId]);

    useEffect(() => {
        if (!isAuthenticated || !assetId) {
            setItems([]);
            setQuantities({});
            setRowOn({});
            setDeviceNotes({});
            setBorrowNote('');
            setBorrowOpts(defaultOpts);
            setHydrated(false);
            return;
        }
        void reload();
    }, [isAuthenticated, assetId, reload]);

    useEffect(() => {
        // Khi sessionKey/initialVersion thay đổi thì reset hydrate để nạp lại dữ liệu cũ.
        setHydrated(false);
    }, [sessionKey, assetId, initialVersion]);

    useEffect(() => {
        if (loading || movableItems.length === 0 || hydrated) return;

        const q: Record<number, number> = {};
        const on: Record<number, boolean> = {};
        const notes: Record<number, string> = {};

        for (const d of movableItems) {
            const maxQty = d.status === 'AVAILABLE' ? (d.quantity ?? 0) : 0;
            const initQty = initialQtyByDeviceId?.[d.id] ?? 0;
            const clamped = Math.min(Math.max(initQty, 0), maxQty);

            if (clamped > 0) {
                q[d.id] = clamped;
                on[d.id] = true;
                notes[d.id] = initialDeviceNotesByDeviceId?.[d.id] ?? '';
            } else {
                q[d.id] = 0;
                on[d.id] = false;
                notes[d.id] = '';
            }
        }

        setQuantities(q);
        setRowOn(on);
        setDeviceNotes(notes);

        setBorrowNote(initialBorrowNote ?? '');
        setBorrowOpts({
            borrowConditionAcknowledged: initialBorrowConditionAcknowledged ?? false,
            borrowReportPrintOptIn: initialBorrowReportPrintOptIn ?? false,
        });
        setHydrated(true);
    }, [
        loading,
        movableItems,
        hydrated,
        initialQtyByDeviceId,
        initialDeviceNotesByDeviceId,
        initialBorrowNote,
        initialBorrowConditionAcknowledged,
        initialBorrowReportPrintOptIn,
    ]);

    // Khi người dùng thay đổi chọn thiết bị thì push dữ liệu về parent.
    useEffect(() => {
        if (!onPlanChange) return;

        const lines: IRoomBorrowLinePayload[] = [];
        for (const d of movableItems) {
            if (!rowOn[d.id]) continue;
            const qty = quantities[d.id] ?? 0;
            if (qty > 0) {
                lines.push({
                    deviceId: d.id,
                    deviceName: d.deviceName,
                    deviceType: d.deviceType,
                    quantity: qty,
                    deviceNote: deviceNotes[d.id]?.trim() || undefined,
                    deviceImageUrl: d.imageUrl ?? null,
                });
            }
        }

        onPlanChange(lines, borrowNote, borrowOpts);
    }, [movableItems, rowOn, quantities, deviceNotes, borrowNote, borrowOpts, onPlanChange]);

    if (!isAuthenticated) return null;

    const anyBorrow = movableItems.some((d) => rowOn[d.id] && (quantities[d.id] ?? 0) > 0);

    return (
        <div className="bk__equipment-section">
            <p className="bk__section-title">Thiết bị mượn thêm (lưu động)</p>
            <p style={{ fontSize: 12, opacity: 0.85, marginBottom: 8 }}>
                Bật <strong>Mượn</strong> từng loại thiết bị rồi nhập số lượng. Nếu không mượn thiết bị thì để
                <strong> Không</strong>.
            </p>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <Spin size="small" />
                </div>
            ) : (
                <div style={{ marginBottom: 12 }}>
                    {movableItems.length === 0 ? (
                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                            Phòng chưa cấu hình thiết bị lưu động để mượn.
                        </div>
                    ) : (
                        movableItems.map((d) => {
                            const maxQty = d.status === 'AVAILABLE' ? (d.quantity ?? 0) : 0;
                            const disabled = maxQty <= 0;
                            const isOn = !!rowOn[d.id];
                            const imgSrc = deviceImageSrc(d.imageUrl);

                            return (
                                <div key={d.id} className="bk__equip-row">
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: '100%' }}>
                                        <div className="bk__equip-thumb" style={{ flexShrink: 0 }}>
                                            {imgSrc ? (
                                                <Image
                                                    src={imgSrc}
                                                    alt={d.deviceName}
                                                    width={80}
                                                    height={80}
                                                    style={{
                                                        objectFit: 'cover',
                                                        borderRadius: 8,
                                                        display: 'block',
                                                    }}
                                                    preview={{ mask: 'Xem ảnh lớn' }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                        borderRadius: 8,
                                                        border: '1px dashed rgba(128, 128, 128, 0.35)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 11,
                                                        opacity: 0.7,
                                                        textAlign: 'center',
                                                        padding: 6,
                                                        lineHeight: 1.25,
                                                        boxSizing: 'border-box',
                                                    }}
                                                >
                                                    Chưa có ảnh minh họa
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="bk__equip-row__head">
                                                <span className="bk__equip-label">
                                                    {d.deviceName}{' '}
                                                    <span className="bk__equip-avail">
                                                        (tối đa {maxQty} / phòng)
                                                    </span>
                                                </span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <Switch
                                                        className="bk__equip-switch"
                                                        checked={isOn}
                                                        disabled={disabled}
                                                        checkedChildren="Mượn"
                                                        unCheckedChildren="Không"
                                                        onChange={(checked) => {
                                                            setRowOn((prev) => ({ ...prev, [d.id]: checked }));
                                                            setQuantities((prev) => ({
                                                                ...prev,
                                                                [d.id]: checked ? Math.max(1, Math.min(prev[d.id] || 1, maxQty)) : 0,
                                                            }));
                                                            onBorrowInteraction?.();
                                                        }}
                                                    />
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        Trạng thái: {DEVICE_STATUS_META[d.status]?.label ?? d.status}
                                                    </Text>
                                                </div>
                                            </div>

                                            {isOn && !disabled && (
                                                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Số lượng
                                                    </Text>
                                                    <InputNumber
                                                        className="bk__equip-qty"
                                                        min={1}
                                                        max={maxQty}
                                                        value={quantities[d.id] ?? 1}
                                                        onChange={(val) => {
                                                            const v = val ?? 1;
                                                            setQuantities((prev) => ({ ...prev, [d.id]: v }));
                                                            onBorrowInteraction?.();
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {isOn && !disabled && (
                                                <div style={{ marginTop: 6, width: '100%' }}>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                                        Ghi chú tình trạng (thiết bị này)
                                                    </Text>
                                                    <Input.TextArea
                                                        rows={2}
                                                        value={deviceNotes[d.id] ?? ''}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            setDeviceNotes((prev) => ({ ...prev, [d.id]: v }));
                                                            onBorrowInteraction?.();
                                                        }}
                                                        placeholder="Tùy chọn — ví dụ: còn tốt, có vết trầy nhẹ…"
                                                        style={{ marginTop: 4, fontSize: 12 }}
                                                    />
                                                </div>
                                            )}

                                            {disabled && <span className="bk__equip-unavail">Hết hàng / không sẵn sàng</span>}

                                            {d.deviceType ? (
                                                <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
                                                    Loại: {DEVICE_TYPE_META[d.deviceType]?.label ?? d.deviceType}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {anyBorrow && (
                <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                        Ghi chú chung biên bản lúc mượn/nhận phòng (tình trạng, số seri, vết trầy…)
                    </Text>
                    <Input.TextArea
                        rows={2}
                        value={borrowNote}
                        onChange={(e) => {
                            setBorrowNote(e.target.value);
                            onBorrowInteraction?.();
                        }}
                        placeholder="Nhập ghi chú chung (tùy chọn)"
                    />

                    <div
                        style={{
                            marginTop: 12,
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: 'rgba(250, 173, 20, 0.08)',
                            border: '1px solid rgba(250, 173, 20, 0.25)',
                        }}
                    >
                        <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                            Biên bản mượn & xác nhận tình trạng
                        </Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <Checkbox
                                checked={borrowOpts.borrowConditionAcknowledged}
                                onChange={(e) =>
                                    setBorrowOpts((prev) => ({ ...prev, borrowConditionAcknowledged: e.target.checked }))
                                }
                            >
                                Tôi xác nhận đã kiểm tra tình trạng thiết bị (tránh khiếu nại khi trả).
                            </Checkbox>
                            <Checkbox
                                checked={borrowOpts.borrowReportPrintOptIn}
                                onChange={(e) => setBorrowOpts((prev) => ({ ...prev, borrowReportPrintOptIn: e.target.checked }))}
                            >
                                In / lưu biên bản nhận phòng (có chữ ký người phụ trách phòng xác nhận hiện trạng).
                            </Checkbox>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomEquipmentBorrowSection;

