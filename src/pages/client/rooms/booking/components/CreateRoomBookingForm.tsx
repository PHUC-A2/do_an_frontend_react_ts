import { Form, Input, Popconfirm, Select, Spin, Switch, type PopconfirmProps } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { TbSoccerField } from 'react-icons/tb';
import { toast } from 'react-toastify';

import { createClientRoomBooking } from '../../../../../config/Api';
import { useAppSelector } from '../../../../../redux/hooks';
import type { IAsset } from '../../../../../types/asset';
import type { IAssetRoomTimeline } from '../../../../../types/roomTimeline';
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
}

const TIME_OPTIONS = Array.from({ length: 192 }, (_, i) => {
    const total = i * 5;
    const h = String(Math.floor(total / 60)).padStart(2, '0');
    const m = String(total % 60).padStart(2, '0');
    return `${h}:${m}`;
});

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
}: IProps) => {
    const [form] = Form.useForm<FormValues>();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const [loading, setLoading] = useState(false);

    // Lưu các dòng thiết bị user bật “Mượn” để gửi lên backend kèm booking.
    const [borrowLines, setBorrowLines] = useState<IRoomBorrowLinePayload[]>([]);
    const [borrowNote, setBorrowNote] = useState('');
    const [borrowOpts, setBorrowOpts] = useState<IRoomBorrowPlanOptions>({
        borrowConditionAcknowledged: false,
        borrowReportPrintOptIn: false,
    });

    // Dùng để reset section thiết bị sau khi tạo booking thành công.
    const [borrowSectionKey, setBorrowSectionKey] = useState(0);

    const periods = timeline?.mode === 'PERIODS' ? timeline.periods : [];
    const periodStart = Form.useWatch('periodStart', form);

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

    const createPayload = (values: FormValues) => {
        if (modeFlexible) {
            return {
                assetId,
                date: bookingDate.format('YYYY-MM-DD'),
                startTime: values.startTime!,
                endTime: values.endTime!,
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
            date: bookingDate.format('YYYY-MM-DD'),
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

    const handleSubmit = async (values: FormValues) => {
        if (!isAuthenticated) {
            toast.warning('Vui lòng đăng nhập để đặt phòng');
            await new Promise((resolve) => setTimeout(resolve, 1200));
            window.location.href = `/login?redirect=${location.pathname}`;
            return;
        }

        // Nếu user có chọn mượn thiết bị thì bắt buộc đã xác nhận kiểm tra tình trạng trước khi gửi yêu cầu.
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
                // Reset dữ liệu thiết bị mượn sau khi đặt thành công để lần sau không bị dính dữ liệu cũ.
                setBorrowLines([]);
                setBorrowNote('');
                setBorrowOpts({ borrowConditionAcknowledged: false, borrowReportPrintOptIn: false });
                setBorrowSectionKey((k) => k + 1);
                onSuccess?.();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể đặt phòng');
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !loading && !assetLoading;

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
                        <Input.TextArea className="bk__input-wrap" rows={3} placeholder="Nhập mục đích học tập / thực hành..." />
                    </Form.Item>

                    <Form.Item label="Số điện thoại liên hệ" name="contactPhone" style={{ marginBottom: 0 }}>
                        <Input className="bk__input-wrap" placeholder="0912 345 678" />
                    </Form.Item>

                    <Form.Item label="Ghi chú" name="bookingNote" style={{ marginBottom: 12 }}>
                        <Input.TextArea
                            className="bk__input-wrap"
                            rows={2}
                            placeholder="Ví dụ: Sinh viên lớp K63 CNTT A mượn thiết bị..."
                        />
                    </Form.Item>

                    <Form.Item label="Chế độ đặt lịch" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span>Theo tiết</span>
                            <Switch checked={modeFlexible} onChange={onModeFlexibleChange} />
                            <span>Giờ linh hoạt</span>
                        </div>
                    </Form.Item>

                    {!modeFlexible ? (
                        <div className="bk__dt-group">
                            <Form.Item
                                label="Tiết bắt đầu"
                                name="periodStart"
                                rules={[{ required: true, message: 'Chọn tiết bắt đầu' }]}
                            >
                                <Select className="bk__time-select" options={periodOptions} />
                            </Form.Item>
                            <Form.Item
                                label="Tiết kết thúc"
                                name="periodEnd"
                                rules={[{ required: true, message: 'Chọn tiết kết thúc' }]}
                            >
                                <Select className="bk__time-select" options={endPeriodOptions} disabled={!periodStart} />
                            </Form.Item>
                        </div>
                    ) : (
                        <div className="bk__dt-group">
                            <Form.Item
                                label="Giờ bắt đầu"
                                name="startTime"
                                rules={[{ required: true, message: 'Chọn giờ bắt đầu' }]}
                            >
                                <Select className="bk__time-select" options={TIME_OPTIONS.map((t) => ({ label: t, value: t }))} />
                            </Form.Item>
                            <Form.Item
                                label="Giờ kết thúc"
                                name="endTime"
                                rules={[{ required: true, message: 'Chọn giờ kết thúc' }]}
                            >
                                <Select className="bk__time-select" options={TIME_OPTIONS.map((t) => ({ label: t, value: t }))} />
                            </Form.Item>
                        </div>
                    )}

                    <div className="bk__form-submit-inline">
                        <Popconfirm
                            title="Xác nhận đặt phòng"
                            description={`Ngày ${bookingDate.format('DD/MM/YYYY')}`}
                            okText="Đặt ngay"
                            cancelText="Hủy"
                            placement="topLeft"
                            onCancel={cancel}
                            onConfirm={() => form.submit()}
                            disabled={!canSubmit}
                        >
                            <button className="bk__submit-btn" type="button" disabled={!canSubmit}>
                                {loading ? (
                                    <>
                                        <Spin size="small" /> Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <TbSoccerField size={16} /> Đặt phòng ngay
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
                        isAuthenticated={isAuthenticated}
                        onPlanChange={handlePlanChange}
                    />
                </div>
            </div>
        </Form>
    );
};

export default CreateRoomBookingForm;
