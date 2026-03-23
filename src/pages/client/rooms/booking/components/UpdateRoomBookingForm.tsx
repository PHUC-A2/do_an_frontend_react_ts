import { Form, Input, Popconfirm, Select, Spin, Switch, type PopconfirmProps } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { TbSoccerField } from 'react-icons/tb';
import { toast } from 'react-toastify';

import { getClientRoomBookingById, updateClientRoomBooking } from '../../../../../config/Api';
import { useAppSelector } from '../../../../../redux/hooks';
import type { IAssetUsage } from '../../../../../types/assetUsage';
import type { IAsset } from '../../../../../types/asset';
import type { IAssetRoomTimeline } from '../../../../../types/roomTimeline';
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

const TIME_OPTIONS = Array.from({ length: 192 }, (_, i) => {
    const total = i * 5;
    const h = String(Math.floor(total / 60)).padStart(2, '0');
    const m = String(total % 60).padStart(2, '0');
    return `${h}:${m}`;
});

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
}: IProps) => {
    const [form] = Form.useForm<FormValues>();
    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [booking, setBooking] = useState<IAssetUsage | null>(null);
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    // Dữ liệu thiết bị user chọn mượn để gửi cập nhật lên backend.
    const [borrowLines, setBorrowLines] = useState<IRoomBorrowLinePayload[]>([]);
    const [borrowNote, setBorrowNote] = useState('');
    const [borrowOpts, setBorrowOpts] = useState<IRoomBorrowPlanOptions>({
        borrowConditionAcknowledged: false,
        borrowReportPrintOptIn: false,
    });

    // Các field dùng để preload/hydrate lại RoomEquipmentBorrowSection khi mở form.
    const [borrowInitialVersion, setBorrowInitialVersion] = useState(0);
    const [initialQtyByDeviceId, setInitialQtyByDeviceId] = useState<Record<number, number>>({});
    const [initialDeviceNotesByDeviceId, setInitialDeviceNotesByDeviceId] = useState<Record<number, string>>({});
    const [initialBorrowNote, setInitialBorrowNote] = useState('');
    const [initialBorrowConditionAcknowledged, setInitialBorrowConditionAcknowledged] = useState(false);
    const [initialBorrowReportPrintOptIn, setInitialBorrowReportPrintOptIn] = useState(false);
    const periodStart = Form.useWatch('periodStart', form);

    const periods = timeline?.mode === 'PERIODS' ? timeline.periods : [];

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

                    // Parse danh sách thiết bị mượn đã lưu trên booking để preload lại switch/quantity/note.
                    const parsedBorrow = (() => {
                        if (!data.borrowDevicesJson) return [] as any[];
                        try {
                            const v = JSON.parse(data.borrowDevicesJson);
                            return Array.isArray(v) ? v : [];
                        } catch {
                            return [] as any[];
                        }
                    })();

                    const qtyMap: Record<number, number> = {};
                    const noteMap: Record<number, string> = {};
                    const lines: IRoomBorrowLinePayload[] = [];

                    for (const item of parsedBorrow) {
                        const deviceId = Number(item?.deviceId);
                        const qty = Number(item?.quantity ?? 0);
                        if (!Number.isFinite(deviceId) || deviceId <= 0 || qty <= 0) continue;

                        qtyMap[deviceId] = qty;
                        if (typeof item?.deviceNote === 'string' && item.deviceNote.trim()) {
                            noteMap[deviceId] = item.deviceNote;
                        }

                        lines.push({
                            deviceId,
                            deviceName: String(item?.deviceName ?? 'Thiết bị'),
                            deviceType: item?.deviceType ?? 'MOVABLE',
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

    const periodOptions = useMemo(
        () =>
            periods
                .filter((p) => p.status === 'FREE')
                .map((p) => ({ label: `${p.label} (${dayjs(p.start).format('HH:mm')} - ${dayjs(p.end).format('HH:mm')})`, value: p.periodIndex })),
        [periods]
    );
    const endPeriodOptions = useMemo(() => periodOptions.filter((p) => !periodStart || p.value > periodStart), [periodOptions, periodStart]);

    const cancel: PopconfirmProps['onCancel'] = () => toast.info('Đã hủy thao tác');

    // Memo hóa callback để tránh vòng lặp render giữa child <RoomEquipmentBorrowSection /> và parent setState.
    const handlePlanChange = useCallback(
        (lines: IRoomBorrowLinePayload[], note: string, opts: IRoomBorrowPlanOptions) => {
            setBorrowLines(lines);
            setBorrowNote(note);
            setBorrowOpts(opts);
        },
        []
    );

    const handleSubmit = async (values: FormValues) => {
        const payloadBase = {
            assetId,
            date: bookingDate.format('YYYY-MM-DD'),
            subject: values.subject.trim(),
            contactPhone: values.contactPhone?.trim() || null,
            bookingNote: values.bookingNote?.trim() || null,
            borrowDevicesJson: borrowLines.length > 0 ? JSON.stringify(
                borrowLines.map((l) => ({
                    deviceId: l.deviceId,
                    deviceName: l.deviceName,
                    deviceType: l.deviceType,
                    quantity: l.quantity,
                    deviceNote: l.deviceNote ?? null,
                    deviceImageUrl: l.deviceImageUrl ?? null,
                }))
            ) : null,
            borrowNote: borrowNote.trim() || null,
            borrowConditionAcknowledged: borrowOpts.borrowConditionAcknowledged,
            borrowReportPrintOptIn: borrowOpts.borrowReportPrintOptIn,
        };
        let startTime = values.startTime ?? '';
        let endTime = values.endTime ?? '';

        // Nếu user có chọn mượn thiết bị thì bắt buộc đã xác nhận kiểm tra tình trạng.
        if (borrowLines.length > 0 && !borrowOpts.borrowConditionAcknowledged) {
            toast.error('Vui lòng xác nhận đã kiểm tra tình trạng thiết bị trước khi gửi yêu cầu cập nhật đặt phòng có mượn thiết bị.');
            return;
        }

        if (!modeFlexible) {
            const start = periods.find((p) => p.periodIndex === values.periodStart);
            const end = periods.find((p) => p.periodIndex === values.periodEnd);
            if (!start || !end) {
                toast.error('Vui lòng chọn tiết hợp lệ');
                return;
            }
            startTime = dayjs(start.start).format('HH:mm:ss');
            endTime = dayjs(end.end).format('HH:mm:ss');
        }
        if (!startTime || !endTime || startTime >= endTime) {
            toast.error('Khung giờ không hợp lệ');
            return;
        }
        setLoading(true);
        try {
            await updateClientRoomBooking(roomBookingId, { ...payloadBase, startTime, endTime });
            toast.success('Cập nhật đặt phòng thành công');
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể cập nhật đặt phòng');
        } finally {
            setLoading(false);
        }
    };

    if (initLoading) {
        return <div className="bk__spin-center"><Spin size="large" /></div>;
    }

    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="bk__form-layout">
                <div className="bk__form-layout__primary">
                    <Form.Item label="Tên phòng" style={{ marginBottom: 8 }}>
                        <Input className="bk__input-wrap" value={asset?.assetName ?? ''} disabled />
                    </Form.Item>

                    <Form.Item
                        label="Mục đích sử dụng"
                        name="subject"
                        rules={[{ required: true, message: 'Vui lòng nhập mục đích sử dụng phòng' }]}
                    >
                        <Input.TextArea className="bk__input-wrap" rows={3} />
                    </Form.Item>

                    <Form.Item label="Số điện thoại liên hệ" name="contactPhone" style={{ marginBottom: 0 }}>
                        <Input className="bk__input-wrap" placeholder="0912 345 678" />
                    </Form.Item>

                    <Form.Item label="Ghi chú" name="bookingNote" style={{ marginBottom: 12 }}>
                        <Input.TextArea className="bk__input-wrap" rows={2} />
                    </Form.Item>

                    <Form.Item label="Chế độ cập nhật lịch" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span>Theo tiết</span>
                            <Switch checked={modeFlexible} onChange={onModeFlexibleChange} />
                            <span>Giờ linh hoạt</span>
                        </div>
                    </Form.Item>

                    {!modeFlexible ? (
                        <div className="bk__dt-group">
                            <Form.Item label="Tiết bắt đầu" name="periodStart" rules={[{ required: true, message: 'Chọn tiết bắt đầu' }]}>
                                <Select className="bk__time-select" options={periodOptions} />
                            </Form.Item>
                            <Form.Item label="Tiết kết thúc" name="periodEnd" rules={[{ required: true, message: 'Chọn tiết kết thúc' }]}>
                                <Select className="bk__time-select" options={endPeriodOptions} disabled={!periodStart} />
                            </Form.Item>
                        </div>
                    ) : (
                        <div className="bk__dt-group">
                            <Form.Item label="Giờ bắt đầu" name="startTime" rules={[{ required: true, message: 'Chọn giờ bắt đầu' }]}>
                                <Select className="bk__time-select" options={TIME_OPTIONS.map((t) => ({ label: t, value: t }))} />
                            </Form.Item>
                            <Form.Item label="Giờ kết thúc" name="endTime" rules={[{ required: true, message: 'Chọn giờ kết thúc' }]}>
                                <Select className="bk__time-select" options={TIME_OPTIONS.map((t) => ({ label: t, value: t }))} />
                            </Form.Item>
                        </div>
                    )}

                    <div className="bk__form-submit-inline">
                        <Popconfirm
                            title="Xác nhận cập nhật đặt phòng"
                            description={`Mã đăng ký #${booking?.id ?? roomBookingId}`}
                            okText="Xác nhận"
                            cancelText="Hủy"
                            placement="topLeft"
                            onCancel={cancel}
                            onConfirm={() => form.submit()}
                            disabled={loading || assetLoading}
                        >
                            <button className="bk__submit-btn" type="button" disabled={loading || assetLoading}>
                                {loading ? (
                                    <>
                                        <Spin size="small" /> Đang cập nhật...
                                    </>
                                ) : (
                                    <>
                                        <TbSoccerField size={16} /> Cập nhật đặt phòng
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
