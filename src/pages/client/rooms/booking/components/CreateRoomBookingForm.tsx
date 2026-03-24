import { Form, Input, Popconfirm, Select, Spin, Switch, type PopconfirmProps } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { MdMeetingRoom } from 'react-icons/md';
import { toast } from 'react-toastify';

import { createClientRoomBooking } from '../../../../../config/Api';
import { useAppSelector } from '../../../../../redux/hooks';
import type { IAsset } from '../../../../../types/asset';
import type { IAssetRoomTimeline } from '../../../../../types/roomTimeline';
import { ASSET_ROOM_FEE_MODE_META, resolveAssetRoomFeeMode } from '../../../../../utils/constants/asset.constants';
import RoomEquipmentBorrowSection, {
    type IRoomBorrowLinePayload,
    type IRoomBorrowPlanOptions,
} from './RoomEquipmentBorrowSection';

interface IProps {
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

const CreateRoomBookingForm = ({
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
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState(false);

    const [borrowLines, setBorrowLines] = useState<IRoomBorrowLinePayload[]>([]);
    const [borrowNote, setBorrowNote] = useState('');
    const [borrowOpts, setBorrowOpts] = useState<IRoomBorrowPlanOptions>({
        borrowConditionAcknowledged: false,
        borrowReportPrintOptIn: false,
    });
    const [borrowSectionKey, setBorrowSectionKey] = useState(0);

    const periods = timeline?.mode === 'PERIODS' ? timeline.periods : [];
    const flexibleSlots = timeline?.mode === 'FLEXIBLE' ? timeline.slots ?? [] : [];
    const periodStart = Form.useWatch('periodStart', form);
    const periodEnd = Form.useWatch('periodEnd', form);
    const startTime = Form.useWatch('startTime', form);
    const endTime = Form.useWatch('endTime', form);

    const periodOptions = useMemo(
        () =>
            periods
                .filter((p) => p.status === 'FREE')
                .map((p) => ({
                    label: `${p.label} (${dayjs(p.start).format('HH:mm')} - ${dayjs(p.end).format('HH:mm')})`,
                    value: p.periodIndex,
                })),
        [periods]
    );

    const endPeriodOptions = useMemo(
        () => periodOptions.filter((p) => !periodStart || p.value > periodStart),
        [periodOptions, periodStart]
    );

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

    /** Nhãn phí theo cấu hình phòng (admin Asset.roomFeeMode). */
    const roomFeeLabels = useMemo(() => {
        const mode = resolveAssetRoomFeeMode(asset?.roomFeeMode);
        return ASSET_ROOM_FEE_MODE_META[mode];
    }, [asset?.roomFeeMode]);

    const cancel: PopconfirmProps['onCancel'] = () => toast.info('Đã hủy thao tác');

    const handlePlanChange = useCallback(
        (lines: IRoomBorrowLinePayload[], note: string, opts: IRoomBorrowPlanOptions) => {
            setBorrowLines(lines);
            setBorrowNote(note);
            setBorrowOpts(opts);
        },
        []
    );

    const buildBorrowDevicesJson = useMemo(() => {
        if (borrowLines.length === 0) return null;
        return JSON.stringify(
            borrowLines.map((l) => ({
                deviceId: l.deviceId,
                deviceName: l.deviceName,
                deviceType: l.deviceType,
                quantity: l.quantity,
                deviceNote: l.deviceNote ?? null,
                deviceImageUrl: l.deviceImageUrl ?? null,
            }))
        );
    }, [borrowLines]);

    const dateStr = bookingDate.format('YYYY-MM-DD');

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

    const createPayload = (values: FormValues) => {
        if (modeFlexible) {
            return {
                assetId,
                date: dateStr,
                startTime: `${values.startTime}:00`,
                endTime: `${values.endTime}:00`,
                subject: values.subject.trim(),
                contactPhone: values.contactPhone?.trim() || null,
                bookingNote: values.bookingNote?.trim() || null,
                borrowDevicesJson: buildBorrowDevicesJson,
                borrowNote: borrowNote.trim() || null,
                borrowConditionAcknowledged: borrowOpts.borrowConditionAcknowledged,
                borrowReportPrintOptIn: borrowOpts.borrowReportPrintOptIn,
            };
        }
        const start = periods.find((p) => p.periodIndex === values.periodStart);
        const end = periods.find((p) => p.periodIndex === values.periodEnd);
        if (!start || !end) return null;
        return {
            assetId,
            date: dateStr,
            startTime: dayjs(start.start).format('HH:mm:ss'),
            endTime: dayjs(end.end).format('HH:mm:ss'),
            subject: values.subject.trim(),
            contactPhone: values.contactPhone?.trim() || null,
            bookingNote: values.bookingNote?.trim() || null,
            borrowDevicesJson: buildBorrowDevicesJson,
            borrowNote: borrowNote.trim() || null,
            borrowConditionAcknowledged: borrowOpts.borrowConditionAcknowledged,
            borrowReportPrintOptIn: borrowOpts.borrowReportPrintOptIn,
        };
    };

    const handleBooking = async (values: FormValues) => {
        setTouched(true);
        if (!isValid) return;

        if (!isAuthenticated) {
            toast.warning('Vui lòng đăng nhập để đặt phòng');
            await new Promise((resolve) => setTimeout(resolve, 1200));
            window.location.href = `/login?redirect=${location.pathname}`;
            return;
        }

        if (borrowLines.length > 0 && !borrowOpts.borrowConditionAcknowledged) {
            toast.error('Vui lòng xác nhận đã kiểm tra tình trạng thiết bị trước khi gửi yêu cầu đặt phòng có mượn thiết bị.');
            return;
        }

        if (!modeFlexible && (!values.periodStart || !values.periodEnd || values.periodStart >= values.periodEnd)) {
            toast.error('Vui lòng chọn tiết bắt đầu và tiết kết thúc hợp lệ');
            return;
        }
        if (modeFlexible && (!values.startTime || !values.endTime || values.startTime >= values.endTime)) {
            toast.error('Vui lòng chọn khung giờ linh hoạt hợp lệ');
            return;
        }

        const payload = createPayload(values);
        if (!payload) return;

        setLoading(true);
        try {
            const res = await createClientRoomBooking(payload);
            if (res.data.statusCode === 201) {
                toast.success('Yêu cầu đặt phòng đã được gửi, đang chờ duyệt!');
                form.resetFields();
                setBorrowLines([]);
                setBorrowNote('');
                setBorrowOpts({ borrowConditionAcknowledged: false, borrowReportPrintOptIn: false });
                setBorrowSectionKey((k) => k + 1);
                setTouched(false);
                onSuccess?.();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể đặt phòng');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSubmit = async () => {
        try {
            await form.validateFields();
            form.submit();
        } catch {
            toast.warning('Vui lòng kiểm tra lại thông tin trước khi đặt phòng');
        }
    };

    const canSubmit = isValid && !loading && !assetLoading;

    return (
        <Form form={form} layout="vertical" onFinish={handleBooking}>
            <div className="bk__form-layout">
                <div className="bk__form-layout__primary">
                    <p className="bk__panel-label" style={{ marginBottom: 8 }}>
                        Ngày đặt lấy theo ô lịch phía trên — chỉ chọn tiết hoặc giờ tại đây (không nhập lại ngày).
                    </p>

                    <div className="bk__dt-group">
                        {!modeFlexible ? (
                            <>
                                <Form.Item
                                    label="Tiết bắt đầu"
                                    name="periodStart"
                                    rules={[{ required: true, message: 'Chọn tiết bắt đầu' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Select
                                        className={`bk__time-select${dtError ? ' bk__time-select--error' : ''}`}
                                        options={periodOptions}
                                        classNames={{ popup: { root: pickerPopupClass } }}
                                        onChange={() => setTouched(true)}
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Tiết kết thúc"
                                    name="periodEnd"
                                    rules={[{ required: true, message: 'Chọn tiết kết thúc' }]}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Select
                                        className={`bk__time-select${dtError ? ' bk__time-select--error' : ''}`}
                                        options={endPeriodOptions}
                                        disabled={!periodStart}
                                        classNames={{ popup: { root: pickerPopupClass } }}
                                        onChange={() => setTouched(true)}
                                    />
                                </Form.Item>
                            </>
                        ) : (
                            <>
                                <Form.Item
                                    label="Giờ bắt đầu"
                                    name="startTime"
                                    rules={[{ required: true, message: 'Chọn giờ bắt đầu' }]}
                                    style={{ marginBottom: 0 }}
                                >
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
                                <Form.Item
                                    label="Giờ kết thúc"
                                    name="endTime"
                                    rules={[{ required: true, message: 'Chọn giờ kết thúc' }]}
                                    style={{ marginBottom: 0 }}
                                >
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

                    <Form.Item label="Chế độ đặt lịch" style={{ marginBottom: 12 }}>
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

                    <Form.Item
                        label="Mục đích sử dụng"
                        name="subject"
                        rules={[{ required: true, message: 'Vui lòng nhập mục đích sử dụng phòng' }]}
                    >
                        <Input.TextArea className="bk__input-wrap" rows={3} placeholder="Nhập mục đích học tập / thực hành..." />
                    </Form.Item>

                    <Form.Item label="Ghi chú" name="bookingNote" style={{ marginBottom: 12 }}>
                        <Input.TextArea
                            className="bk__input-wrap"
                            rows={2}
                            placeholder="Ví dụ: Sinh viên lớp K63 CNTT A mượn thiết bị..."
                        />
                    </Form.Item>

                    <Form.Item label="Số điện thoại liên hệ" name="contactPhone" style={{ marginBottom: 0 }}>
                        <Input className="bk__input-wrap" placeholder="0912 345 678" />
                    </Form.Item>

                    <div className="bk__form-submit-inline">
                        <Popconfirm
                            title="Xác nhận đặt phòng"
                            description={
                                <span>
                                    {startDj && endDj
                                        ? `${startDj.format('HH:mm DD/MM')} → ${endDj.format('HH:mm DD/MM')} · ${roomFeeLabels.popconfirmShort}`
                                        : `Ngày ${bookingDate.format('DD/MM/YYYY')}`}
                                </span>
                            }
                            okText="Đặt ngay"
                            cancelText="Huỷ"
                            placement="topLeft"
                            onCancel={cancel}
                            onConfirm={handleConfirmSubmit}
                            disabled={!canSubmit}
                        >
                            <button className="bk__submit-btn" type="button" disabled={!canSubmit}>
                                {loading ? (
                                    <>
                                        <Spin size="small" /> Đang đặt phòng...
                                    </>
                                ) : (
                                    <>
                                        <MdMeetingRoom size={16} /> Đặt phòng ngay
                                    </>
                                )}
                            </button>
                        </Popconfirm>
                    </div>
                </div>

                <div className="bk__form-layout__aside">
                    <RoomEquipmentBorrowSection
                        key={`create-${assetId}-${borrowSectionKey}`}
                        assetId={assetId}
                        sessionKey={`create-${assetId}-${borrowSectionKey}`}
                        isAuthenticated={isAuthenticated}
                        onPlanChange={handlePlanChange}
                    />
                </div>
            </div>
        </Form>
    );
};

export default CreateRoomBookingForm;
