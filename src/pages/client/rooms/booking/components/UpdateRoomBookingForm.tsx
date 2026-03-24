import { Form, Input, Popconfirm, Select, Spin, Switch, type PopconfirmProps } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { MdMeetingRoom } from 'react-icons/md';
import { toast } from 'react-toastify';

import { getClientRoomBookingById, updateClientRoomBooking } from '../../../../../config/Api';
import { useAppSelector } from '../../../../../redux/hooks';
import type { IAssetUsage } from '../../../../../types/assetUsage';
import type { IAsset } from '../../../../../types/asset';
import type { DeviceType } from '../../../../../types/device';
import type { IAssetRoomTimeline } from '../../../../../types/roomTimeline';
import { ASSET_ROOM_FEE_MODE_META, resolveAssetRoomFeeMode } from '../../../../../utils/constants/asset.constants';
import RoomEquipmentBorrowSection, {
    type IRoomBorrowLinePayload,
    type IRoomBorrowPlanOptions,
} from './RoomEquipmentBorrowSection';

interface IProps {
    roomBookingId: number;
    assetId: number;
    asset: IAsset | null;
    assetLoading: boolean;
    bookingDate: Dayjs;
    timeline: IAssetRoomTimeline | null;
    modeFlexible: boolean;
    onModeFlexibleChange: (value: boolean) => void;
    onSuccess?: () => void;
    isDark: boolean;
}

type FormValues = {
    subject: string;
    contactPhone?: string;
    bookingNote?: string;
    periodStart?: number;
    periodEnd?: number;
    startTime?: string;
    endTime?: string;
};

const UpdateRoomBookingForm = ({
    roomBookingId,
    assetId,
    asset,
    assetLoading,
    bookingDate,
    timeline,
    modeFlexible,
    onModeFlexibleChange,
    onSuccess,
    isDark,
}: IProps) => {
    const [form] = Form.useForm<FormValues>();
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [booking, setBooking] = useState<IAssetUsage | null>(null);
    const [touched, setTouched] = useState(false);
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const [borrowLines, setBorrowLines] = useState<IRoomBorrowLinePayload[]>([]);
    const [borrowNote, setBorrowNote] = useState('');
    const [borrowOpts, setBorrowOpts] = useState<IRoomBorrowPlanOptions>({
        borrowConditionAcknowledged: false,
        borrowReportPrintOptIn: false,
    });
    const [borrowInitialVersion, setBorrowInitialVersion] = useState(0);
    const [initialQtyByDeviceId, setInitialQtyByDeviceId] = useState<Record<number, number>>({});
    const [initialDeviceNotesByDeviceId, setInitialDeviceNotesByDeviceId] = useState<Record<number, string>>({});
    const [initialBorrowNote, setInitialBorrowNote] = useState('');
    const [initialBorrowConditionAcknowledged, setInitialBorrowConditionAcknowledged] = useState(false);
    const [initialBorrowReportPrintOptIn, setInitialBorrowReportPrintOptIn] = useState(false);

    const periodStart = Form.useWatch('periodStart', form);
    const periodEnd = Form.useWatch('periodEnd', form);
    const startTime = Form.useWatch('startTime', form);
    const endTime = Form.useWatch('endTime', form);

    /** Danh sách tiết theo timeline ngày đang chọn (chỉ khi không linh hoạt). */
    const periods = timeline?.mode === 'PERIODS' ? timeline.periods : [];
    const flexibleSlots = timeline?.mode === 'FLEXIBLE' ? timeline.slots ?? [] : [];

    /** Phí hiển thị: ưu tiên asset từ trang, fallback theo API booking (lịch sử đúng khi admin đổi phí). */
    const roomFeeLabels = useMemo(() => {
        const mode = resolveAssetRoomFeeMode(asset?.roomFeeMode ?? booking?.usageFeeMode ?? booking?.assetRoomFeeMode);
        return ASSET_ROOM_FEE_MODE_META[mode];
    }, [asset?.roomFeeMode, booking?.usageFeeMode, booking?.assetRoomFeeMode]);

    // Tải booking hiện tại: điền form + khôi phục kế hoạch mượn thiết bị.
    useEffect(() => {
        setInitLoading(true);
        getClientRoomBookingById(roomBookingId)
            .then((res) => {
                const data = res.data.data ?? null;
                setBooking(data);
                if (data) {
                    form.setFieldValue('subject', data.subject);
                    form.setFieldValue('contactPhone', data.contactPhone ?? undefined);
                    form.setFieldValue('bookingNote', data.bookingNote ?? undefined);
                    form.setFieldValue('startTime', data.startTime?.slice(0, 5));
                    form.setFieldValue('endTime', data.endTime?.slice(0, 5));

                    const parsedBorrow = (() => {
                        if (!data.borrowDevicesJson) return [] as unknown[];
                        try {
                            const v = JSON.parse(data.borrowDevicesJson);
                            return Array.isArray(v) ? v : [];
                        } catch {
                            return [] as unknown[];
                        }
                    })();

                    const qtyMap: Record<number, number> = {};
                    const noteMap: Record<number, string> = {};
                    const lines: IRoomBorrowLinePayload[] = [];

                    for (const item of parsedBorrow as { deviceId?: number; quantity?: number; deviceNote?: string; deviceName?: string; deviceType?: string; deviceImageUrl?: string | null }[]) {
                        const deviceId = Number(item?.deviceId);
                        const qty = Number(item?.quantity ?? 0);
                        if (!Number.isFinite(deviceId) || deviceId <= 0 || qty <= 0) continue;

                        qtyMap[deviceId] = qty;
                        if (typeof item?.deviceNote === 'string' && item.deviceNote.trim()) {
                            noteMap[deviceId] = item.deviceNote;
                        }

                        const dt = item?.deviceType;
                        const deviceType: DeviceType = dt === 'FIXED' || dt === 'MOVABLE' ? dt : 'MOVABLE';
                        lines.push({
                            deviceId,
                            deviceName: String(item?.deviceName ?? 'Thiết bị'),
                            deviceType,
                            quantity: qty,
                            deviceNote: typeof item?.deviceNote === 'string' ? item.deviceNote : undefined,
                            deviceImageUrl: typeof item?.deviceImageUrl === 'string' ? item.deviceImageUrl : null,
                        });
                    }

                    setInitialQtyByDeviceId(qtyMap);
                    setInitialDeviceNotesByDeviceId(noteMap);
                    setInitialBorrowNote(data.borrowNote ?? '');
                    setInitialBorrowConditionAcknowledged(!!data.borrowConditionAcknowledged);
                    setInitialBorrowReportPrintOptIn(!!data.borrowReportPrintOptIn);
                    setBorrowLines(lines);
                    setBorrowNote(data.borrowNote ?? '');
                    setBorrowOpts({
                        borrowConditionAcknowledged: !!data.borrowConditionAcknowledged,
                        borrowReportPrintOptIn: !!data.borrowReportPrintOptIn,
                    });
                    setBorrowInitialVersion((v) => v + 1);
                }
            })
            .finally(() => setInitLoading(false));
    }, [roomBookingId, form]);

    // Map startTime/endTime đã lưu sang chỉ số tiết khi timeline đã có (không phụ thuộc click trên lưới).
    useEffect(() => {
        if (!booking || modeFlexible || !periods.length) return;
        const st = booking.startTime;
        const en = booking.endTime;
        const ps = periods.find(
            (p) => dayjs(p.start).format('HH:mm:ss') === st || dayjs(p.start).format('HH:mm') === st?.slice(0, 5)
        );
        const pe = periods.find(
            (p) => dayjs(p.end).format('HH:mm:ss') === en || dayjs(p.end).format('HH:mm') === en?.slice(0, 5)
        );
        if (ps) form.setFieldValue('periodStart', ps.periodIndex);
        if (pe) form.setFieldValue('periodEnd', pe.periodIndex);
    }, [booking, modeFlexible, periods, form]);

    const periodOptions = useMemo(
        () =>
            periods
                .filter((p) => p.status === 'FREE') // Chỉ chọn slot trống — giống luồng đặt mới.
                .map((p) => ({ label: `${p.label} (${dayjs(p.start).format('HH:mm')} - ${dayjs(p.end).format('HH:mm')})`, value: p.periodIndex })),
        [periods]
    );
    const endPeriodOptions = useMemo(() => periodOptions.filter((p) => !periodStart || p.value > periodStart), [periodOptions, periodStart]);

    const flexibleStartOptions = useMemo(() => {
        const seen = new Set<string>();
        return flexibleSlots
            .filter((s) => s.status === 'FREE')
            .map((s) => dayjs(s.start).format('HH:mm'))
            .filter((t) => {
                if (seen.has(t)) return false;
                seen.add(t);
                return true;
            })
            .map((t) => ({ label: t, value: t }));
    }, [flexibleSlots]);

    const flexibleEndOptions = useMemo(() => {
        if (!startTime) return [];
        const startIdx = flexibleSlots.findIndex((s) => dayjs(s.start).format('HH:mm') === startTime && s.status === 'FREE');
        if (startIdx < 0) return [];
        const options: { label: string; value: string }[] = [];
        for (let i = startIdx; i < flexibleSlots.length; i += 1) {
            const slot = flexibleSlots[i];
            if (slot.status !== 'FREE') break;
            const t = dayjs(slot.end).format('HH:mm');
            options.push({ label: t, value: t });
        }
        return options;
    }, [flexibleSlots, startTime]);

    const cancel: PopconfirmProps['onCancel'] = () => toast.info('Đã hủy thao tác');

    const handlePlanChange = useCallback(
        (lines: IRoomBorrowLinePayload[], note: string, opts: IRoomBorrowPlanOptions) => {
            setBorrowLines(lines);
            setBorrowNote(note);
            setBorrowOpts(opts);
        },
        []
    );

    const dateStr = bookingDate.format('YYYY-MM-DD');

    // Kiểm tra hợp lệ khung giờ + tính phút cho preview (tiết hoặc HH:mm).
    const { minutes, isValid, startDj, endDj } = useMemo(() => {
        if (modeFlexible) {
            if (!startTime || !endTime) return { minutes: 0, isValid: false, startDj: null as Dayjs | null, endDj: null as Dayjs | null };
            const s = dayjs(`${dateStr}T${startTime}:00`);
            const e = dayjs(`${dateStr}T${endTime}:00`);
            const m = e.diff(s, 'minute');
            return { minutes: m, isValid: m >= 30, startDj: s, endDj: e };
        }
        const ps = periods.find((p) => p.periodIndex === periodStart);
        const pe = periods.find((p) => p.periodIndex === periodEnd);
        if (!ps || !pe || periodStart == null || periodEnd == null || periodStart >= periodEnd) {
            return { minutes: 0, isValid: false, startDj: null, endDj: null };
        }
        const s = dayjs(ps.start);
        const e = dayjs(pe.end);
        const m = e.diff(s, 'minute');
        return { minutes: m, isValid: m > 0, startDj: s, endDj: e };
    }, [modeFlexible, dateStr, startTime, endTime, periods, periodStart, periodEnd]);

    const dtError = touched && !isValid ? 'Thời lượng đặt phòng tối thiểu 30 phút và giờ kết thúc phải sau giờ bắt đầu' : null;
    const pickerPopupClass = isDark ? 'bk__picker-popup bk__picker-popup--dark' : 'bk__picker-popup bk__picker-popup--light';

    const handleSubmit = async (values: FormValues) => {
        setTouched(true);
        if (!isValid) return;

        let startT: string;
        let endT: string;
        // Quy đổi tiết/giờ form → HH:mm:ss gửi API (ngày lấy theo lịch trang).
        if (modeFlexible) {
            startT = `${values.startTime}:00`;
            endT = `${values.endTime}:00`;
        } else {
            const start = periods.find((p) => p.periodIndex === values.periodStart);
            const end = periods.find((p) => p.periodIndex === values.periodEnd);
            if (!start || !end) {
                toast.error('Vui lòng chọn tiết hợp lệ');
                return;
            }
            startT = dayjs(start.start).format('HH:mm:ss');
            endT = dayjs(end.end).format('HH:mm:ss');
        }
        if (!startT || !endT || startT >= endT) {
            toast.error('Khung giờ không hợp lệ');
            return;
        }

        if (borrowLines.length > 0 && !borrowOpts.borrowConditionAcknowledged) {
            toast.error('Vui lòng xác nhận đã kiểm tra tình trạng thiết bị trước khi gửi yêu cầu cập nhật đặt phòng có mượn thiết bị.');
            return;
        }

        setLoading(true);
        try {
            await updateClientRoomBooking(roomBookingId, {
                date: dateStr,
                startTime: startT,
                endTime: endT,
                subject: values.subject.trim(),
                contactPhone: values.contactPhone?.trim() || null,
                bookingNote: values.bookingNote?.trim() || null,
                borrowDevicesJson:
                    borrowLines.length > 0
                        ? JSON.stringify(
                              borrowLines.map((l) => ({
                                  deviceId: l.deviceId,
                                  deviceName: l.deviceName,
                                  deviceType: l.deviceType,
                                  quantity: l.quantity,
                                  deviceNote: l.deviceNote ?? null,
                                  deviceImageUrl: l.deviceImageUrl ?? null,
                              }))
                          )
                        : null,
                borrowNote: borrowNote.trim() || null,
                borrowConditionAcknowledged: borrowOpts.borrowConditionAcknowledged,
                borrowReportPrintOptIn: borrowOpts.borrowReportPrintOptIn,
            });
            toast.success('Cập nhật đặt phòng thành công');
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể cập nhật đặt phòng');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSubmit = async () => {
        try {
            await form.validateFields();
            form.submit();
        } catch {
            toast.warning('Vui lòng kiểm tra lại thông tin trước khi cập nhật đặt phòng');
        }
    };

    const canSubmit = isValid && !loading && !assetLoading;

    if (initLoading) {
        return (
            <div className="bk__spin-center">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="bk__form-layout">
                <div className="bk__form-layout__primary">
                    <p className="bk__panel-label" style={{ marginBottom: 8 }}>
                        Ngày đặt theo lịch phía trên — chỉ đổi tiết / giờ tại đây (mã #{booking?.id ?? roomBookingId}).
                    </p>

                    <div className="bk__dt-group">
                        {!modeFlexible ? (
                            <>
                                <Form.Item label="Tiết bắt đầu" name="periodStart" rules={[{ required: true, message: 'Chọn tiết bắt đầu' }]} style={{ marginBottom: 0 }}>
                                    <Select className={`bk__time-select${dtError ? ' bk__time-select--error' : ''}`} options={periodOptions} classNames={{ popup: { root: pickerPopupClass } }} onChange={() => setTouched(true)} />
                                </Form.Item>
                                <Form.Item label="Tiết kết thúc" name="periodEnd" rules={[{ required: true, message: 'Chọn tiết kết thúc' }]} style={{ marginBottom: 0 }}>
                                    <Select className={`bk__time-select${dtError ? ' bk__time-select--error' : ''}`} options={endPeriodOptions} disabled={!periodStart} classNames={{ popup: { root: pickerPopupClass } }} onChange={() => setTouched(true)} />
                                </Form.Item>
                            </>
                        ) : (
                            <>
                                <Form.Item label="Giờ bắt đầu" name="startTime" rules={[{ required: true, message: 'Chọn giờ bắt đầu' }]} style={{ marginBottom: 0 }}>
                                    <Select
                                        className="bk__time-select"
                                        options={flexibleStartOptions}
                                        classNames={{ popup: { root: pickerPopupClass } }}
                                        onChange={() => {
                                            form.setFieldValue('endTime', undefined);
                                            setTouched(true);
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item label="Giờ kết thúc" name="endTime" rules={[{ required: true, message: 'Chọn giờ kết thúc' }]} style={{ marginBottom: 0 }}>
                                    <Select
                                        className={`bk__time-select${dtError ? ' bk__time-select--error' : ''}`}
                                        options={flexibleEndOptions}
                                        disabled={!startTime}
                                        classNames={{ popup: { root: pickerPopupClass } }}
                                        onChange={() => setTouched(true)}
                                    />
                                </Form.Item>
                            </>
                        )}
                    </div>

                    {dtError ? <p className="bk__dt-error">{dtError}</p> : null}

                    <Form.Item label="Chế độ cập nhật lịch" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span>Theo tiết</span>
                            <Switch checked={modeFlexible} onChange={onModeFlexibleChange} />
                            <span>Giờ linh hoạt</span>
                        </div>
                    </Form.Item>

                    <AnimatePresence>
                        {!assetLoading && asset && isValid && (
                            <motion.div
                                className="bk__price-preview"
                                initial={{ opacity: 0, y: -8, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -8, height: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <p className="bk__price-row">⏱ Thời lượng: {minutes} phút</p>
                                <div className="bk__price-total">{roomFeeLabels.estimateLine}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Form.Item label="Tên phòng" style={{ marginBottom: 8 }}>
                        <Input className="bk__input-wrap" value={asset?.assetName ?? ''} disabled />
                    </Form.Item>

                    <Form.Item label="Mục đích sử dụng" name="subject" rules={[{ required: true, message: 'Vui lòng nhập mục đích sử dụng phòng' }]}>
                        <Input.TextArea className="bk__input-wrap" rows={3} />
                    </Form.Item>

                    <Form.Item label="Ghi chú" name="bookingNote" style={{ marginBottom: 12 }}>
                        <Input.TextArea className="bk__input-wrap" rows={2} />
                    </Form.Item>

                    <Form.Item label="Số điện thoại liên hệ" name="contactPhone" style={{ marginBottom: 0 }}>
                        <Input className="bk__input-wrap" placeholder="0912 345 678" />
                    </Form.Item>

                    <div className="bk__form-submit-inline">
                        <Popconfirm
                            title="Xác nhận cập nhật đặt phòng"
                            description={
                                <span>
                                    {startDj && endDj
                                        ? `${startDj.format('HH:mm DD/MM')} → ${endDj.format('HH:mm DD/MM')} · ${roomFeeLabels.popconfirmShort}`
                                        : `Mã đăng ký #${booking?.id ?? roomBookingId}`}
                                </span>
                            }
                            okText="Xác nhận"
                            cancelText="Huỷ"
                            placement="topLeft"
                            onCancel={cancel}
                            onConfirm={handleConfirmSubmit}
                            disabled={!canSubmit}
                        >
                            <button className="bk__submit-btn" type="button" disabled={!canSubmit}>
                                {loading ? (
                                    <>
                                        <Spin size="small" /> Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <MdMeetingRoom size={16} /> Cập nhật đặt phòng
                                    </>
                                )}
                            </button>
                        </Popconfirm>
                    </div>
                </div>

                <div className="bk__form-layout__aside">
                    <RoomEquipmentBorrowSection
                        key={`update-${roomBookingId}`}
                        assetId={assetId}
                        isAuthenticated={isAuthenticated}
                        sessionKey={`update-${roomBookingId}`}
                        initialVersion={borrowInitialVersion}
                        initialQtyByDeviceId={initialQtyByDeviceId}
                        initialDeviceNotesByDeviceId={initialDeviceNotesByDeviceId}
                        initialBorrowNote={initialBorrowNote}
                        initialBorrowConditionAcknowledged={initialBorrowConditionAcknowledged}
                        initialBorrowReportPrintOptIn={initialBorrowReportPrintOptIn}
                        onPlanChange={handlePlanChange}
                    />
                </div>
            </div>
        </Form>
    );
};

export default UpdateRoomBookingForm;
