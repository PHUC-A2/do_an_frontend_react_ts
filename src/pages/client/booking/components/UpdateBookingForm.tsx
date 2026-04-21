import { DatePicker, Form, Input, Popconfirm, Select, Spin, Switch, type PopconfirmProps } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import { getBookingById, updateBookingClient, clientBorrowEquipment, clientGetBookingEquipments } from "../../../../config/Api";
import type { IPitch } from "../../../../types/pitch";
import { formatVND } from "../../../../utils/format/price";
import { calculatePitchTotalPrice } from "../../../../utils/pitch/pitchPricing";
import EquipmentBorrowSection, { type IBorrowLinePayload, type IBorrowPlanOptions } from "./EquipmentBorrowSection";
import {
    fetchPitches,
    selectPitches,
    selectPitchLoading,
} from "../../../../redux/features/pitchSlice";
import { useAppDispatch, useAppSelector } from "../../../../redux/hooks";
import { fetchBookingsClient } from "../../../../redux/features/bookingClientSlice";
import { TbSoccerField } from "react-icons/tb";

interface IProps {
    bookingId: number;
    pitchIdNumber: number;
    pitch: IPitch | null;
    pitchLoading: boolean;
    bookingDate: Dayjs;
    isDark: boolean;
    onSuccess?: () => void;
    onPitchChange?: (pitchId: number) => void;
}

type FormValues = {
    contactPhone?: string;
    pitchId?: number;
};

const TIME_OPTIONS = Array.from({ length: 24 * 12 }, (_, i) => {
    const h = String(Math.floor(i / 12)).padStart(2, "0");
    const m = String((i % 12) * 5).padStart(2, "0");
    return `${h}:${m}`;
});

/** Giờ bắt đầu = mốc 5p tiếp theo sau thời điểm hiện tại, giờ kết thúc = start + 30p */
function getDefaultBookingTimes(): { startTime: string; endTime: string } {
    const now = dayjs();
    const totalMins = now.hour() * 60 + now.minute();
    const startMins = Math.ceil((totalMins + 1) / 5) * 5;
    const start = dayjs().startOf("day").add(startMins, "minute");
    const end = start.add(30, "minute");
    return { startTime: start.format("HH:mm"), endTime: end.format("HH:mm") };
}

const UpdateBookingForm = ({
    bookingId,
    pitchIdNumber,
    pitch,
    pitchLoading,
    bookingDate,
    isDark,
    onSuccess,
    onPitchChange,
}: IProps) => {
    const [form] = Form.useForm<FormValues>();
    const selectedPitchId = Form.useWatch("pitchId", form);

    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
    const pitches = useSelector(selectPitches);
    const pitchLoadingRedux = useSelector(selectPitchLoading);

    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [changePitch, setChangePitch] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [touched, setTouched] = useState(false);

    const [startDate, setStartDate] = useState(bookingDate.format("YYYY-MM-DD"));
    const [startTime, setStartTime] = useState(() => getDefaultBookingTimes().startTime);
    const [endDate, setEndDate] = useState(bookingDate.format("YYYY-MM-DD"));
    const [endTime, setEndTime] = useState(() => getDefaultBookingTimes().endTime);

    const [borrowLines, setBorrowLines] = useState<IBorrowLinePayload[]>([]);
    const [borrowNote, setBorrowNote] = useState("");
    const [borrowOpts, setBorrowOpts] = useState<IBorrowPlanOptions>({
        borrowConditionAcknowledged: false,
        borrowReportPrintOptIn: false,
    });
    const [equipmentTouched, setEquipmentTouched] = useState(false);
    const [initialQtyByEquipmentId, setInitialQtyByEquipmentId] = useState<Record<number, number>>({});
    const [initialBorrowNoteSeed, setInitialBorrowNoteSeed] = useState("");
    const [borrowInitialVersion, setBorrowInitialVersion] = useState(0);

    const handleBorrowPlanChange = useCallback((lines: IBorrowLinePayload[], note: string, opts: IBorrowPlanOptions) => {
        setBorrowLines(lines);
        setBorrowNote(note);
        setBorrowOpts(opts);
    }, []);

    // Sync pitch change
    useEffect(() => {
        if (changePitch && selectedPitchId) onPitchChange?.(selectedPitchId);
        if (!changePitch) onPitchChange?.(pitchIdNumber);
    }, [changePitch, selectedPitchId]);

    useEffect(() => {
        if (pitches.length === 0) dispatch(fetchPitches("page=1&pageSize=100"));
    }, [dispatch, pitches.length]);

    // Load booking + thiết bị đang mượn (để preload số lượng trên form)
    useEffect(() => {
        setInitLoading(true);
        Promise.all([getBookingById(bookingId), clientGetBookingEquipments(bookingId)])
            .then(([bookingRes, equipRes]) => {
                const b = bookingRes.data.data;
                if (!b) return;

                if (b.status === "CANCELLED") {
                    toast.error("Booking đã bị huỷ, không thể cập nhật");
                    setBlocked(true);
                    return;
                }
                if (b.status === "PAID") {
                    toast.error("Booking đã thanh toán, không thể cập nhật");
                    setBlocked(true);
                    return;
                }
                if (b.deletedByUser) {
                    toast.error("Booking đã bị xoá khỏi lịch sử");
                    setBlocked(true);
                    return;
                }

                const start = dayjs(b.startDateTime);
                const end = dayjs(b.endDateTime);

                const roundTime = (dj: Dayjs) => {
                    const roundedMinute = Math.floor(dj.minute() / 5) * 5;
                    const m = String(roundedMinute).padStart(2, "0");
                    return `${String(dj.hour()).padStart(2, "0")}:${m}`;
                };
                setStartTime(roundTime(start));
                setEndTime(roundTime(end));
                setStartDate(start.format("YYYY-MM-DD"));
                setEndDate(end.format("YYYY-MM-DD"));

                form.setFieldsValue({
                    contactPhone: b.contactPhone,
                    pitchId: b.pitchId,
                });

                const eqList = equipRes.data.data ?? [];
                const activeBorrow = eqList.filter(e => !e.deletedByClient && e.status === "BORROWED");
                const qtyMap: Record<number, number> = {};
                for (const e of activeBorrow) {
                    qtyMap[e.equipmentId] = (qtyMap[e.equipmentId] ?? 0) + e.quantity;
                }
                setInitialQtyByEquipmentId(qtyMap);
                const note = activeBorrow.find(e => e.borrowConditionNote?.trim())?.borrowConditionNote ?? "";
                setInitialBorrowNoteSeed(note);
                setBorrowInitialVersion(v => v + 1);
            })
            .finally(() => setInitLoading(false));
    }, [bookingId, form]);

    const pitchOptions = useMemo(
        () => pitches
            .filter(p => p.status === "ACTIVE")
            .map(p => ({ label: `${p.name} — ${formatVND(p.pricePerHour)}/giờ`, value: p.id })),
        [pitches]
    );

    const currentPitch: IPitch | null = useMemo(() => {
        if (!changePitch) return pitch ?? null;
        return pitches.find(p => p.id === selectedPitchId) ?? null;
    }, [changePitch, pitch, pitches, selectedPitchId]);

    const effectivePitchId = changePitch && selectedPitchId ? selectedPitchId : pitchIdNumber;

    const startDj = useMemo(() => dayjs(`${startDate}T${startTime}`), [startDate, startTime]);
    const endDj = useMemo(() => dayjs(`${endDate}T${endTime}`), [endDate, endTime]);
    const minutes = endDj.diff(startDj, "minute");
    const isValid = minutes > 0;

    const preview = currentPitch && isValid
        ? calculatePitchTotalPrice(currentPitch, startDj, endDj)
        : 0;

    const dtError = touched && !isValid ? "Giờ kết thúc phải sau giờ bắt đầu" : null;

    const handleUpdate = async (values: FormValues) => {
        setTouched(true);
        if (blocked || !isValid) return;
        if (minutes < 30) {
            toast.error("Thời lượng đặt sân tối thiểu là 30 phút.");
            return;
        }

        if (!isAuthenticated) {
            toast.warning("Vui lòng đăng nhập để cập nhật lịch đặt");
            await new Promise(r => setTimeout(r, 2000));
            window.location.href = `/login?redirect=${location.pathname}`;
            return;
        }

        if (equipmentTouched && borrowLines.length > 0 && !borrowOpts.borrowConditionAcknowledged) {
            toast.error("Vui lòng xác nhận đã kiểm tra tình trạng thiết bị trước khi thêm mượn.");
            return;
        }

        setLoading(true);
        try {
            await updateBookingClient(bookingId, {
                pitchId: changePitch ? values.pitchId! : pitchIdNumber,
                contactPhone: values.contactPhone,
                startDateTime: startDj.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: endDj.format("YYYY-MM-DDTHH:mm:ss"),
            });
            toast.success("Cập nhật lịch đặt thành công!");

            // Chỉ borrow khi user chủ động thay đổi equipment
            if (equipmentTouched && borrowLines.length > 0) {
                const tasks = borrowLines.map(line =>
                    clientBorrowEquipment({
                        bookingId,
                        equipmentId: line.equipmentId,
                        quantity: line.quantity,
                        equipmentMobility: line.equipmentMobility,
                        borrowConditionNote: line.borrowConditionNote?.trim() || borrowNote.trim() || undefined,
                        borrowConditionAcknowledged: true,
                        borrowReportPrintOptIn: borrowOpts.borrowReportPrintOptIn,
                    }).catch(() => { })
                );
                await Promise.all(tasks);
            }

            dispatch(fetchBookingsClient(""));
            onSuccess?.();
        } catch (e: any) {
            const m = e?.response?.data?.message ?? "Lỗi không xác định";
            toast.error(<div><strong>Có lỗi xảy ra!</strong><div>{m}</div></div>);
        } finally {
            setLoading(false);
        }
    };

    const cancel: PopconfirmProps["onCancel"] = () => toast.info("Đã huỷ cập nhật");
    const pickerPopupClass = isDark ? "bk__picker-popup bk__picker-popup--dark" : "bk__picker-popup bk__picker-popup--light";

    if (initLoading) return <div className="bk__spin-center"><Spin size="large" /></div>;
    if (blocked) return <div className="bk__blocked">Booking này không thể cập nhật (đã bị huỷ hoặc xoá).</div>;

    const canSubmit = isValid && !loading;

    const handleConfirmSubmit = async () => {
        try {
            await form.validateFields();
            form.submit();
        } catch {
            toast.warning("Vui lòng kiểm tra lại thông tin trước khi cập nhật lịch đặt");
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleUpdate}>

            <div className="bk__form-layout">
            <div className="bk__form-layout__primary">

            {/* Switch đổi sân */}
            <Form.Item label="Đổi sân thi đấu" style={{ marginBottom: 12 }}>
                <Switch
                    checked={changePitch}
                    onChange={checked => {
                        setChangePitch(checked);
                        if (!checked) form.setFieldValue("pitchId", undefined);
                    }}
                />
            </Form.Item>

            {changePitch && (
                <Form.Item
                    label="Chọn sân mới"
                    name="pitchId"
                    rules={[{ required: true, message: "Vui lòng chọn sân" }]}
                    style={{ marginBottom: 12 }}
                >
                    <Select
                        className="bk__select-wrap"
                        placeholder="Chọn sân"
                        options={pitchOptions}
                        loading={pitchLoadingRedux}
                        showSearch={{ optionFilterProp: "label" }}
                    />
                </Form.Item>
            )}

            {/* Date / time pickers */}
            <div className="bk__dt-group">
                <div className="bk__dt-block">
                    <span className="bk__dt-label">📅 Ngày bắt đầu</span>
                    <DatePicker
                        className={`bk__picker-input${dtError ? " bk__picker-input--error" : ""}`}
                        value={dayjs(startDate, "YYYY-MM-DD")}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        inputReadOnly
                        classNames={{ popup: pickerPopupClass }}
                        disabledDate={current => !!current && current.startOf("day").isBefore(dayjs().startOf("day"))}
                        onChange={value => {
                            if (!value) return;
                            setStartDate(value.format("YYYY-MM-DD"));
                            setTouched(true);
                        }}
                    />
                </div>

                <div className="bk__dt-block">
                    <span className="bk__dt-label">🕐 Giờ bắt đầu</span>
                    <Select
                        className="bk__time-select"
                        value={startTime}
                        options={TIME_OPTIONS.map(t => ({ label: t, value: t }))}
                        classNames={{ popup: { root: pickerPopupClass } }}
                        onChange={value => { setStartTime(value); setTouched(true); }}
                    />
                </div>

                <div className="bk__dt-block">
                    <span className="bk__dt-label">📅 Ngày kết thúc</span>
                    <DatePicker
                        className={`bk__picker-input${dtError ? " bk__picker-input--error" : ""}`}
                        value={dayjs(endDate, "YYYY-MM-DD")}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        inputReadOnly
                        classNames={{ popup: pickerPopupClass }}
                        disabledDate={current => !!current && current.startOf("day").isBefore(dayjs(startDate).startOf("day"))}
                        onChange={value => {
                            if (!value) return;
                            setEndDate(value.format("YYYY-MM-DD"));
                            setTouched(true);
                        }}
                    />
                </div>

                <div className="bk__dt-block">
                    <span className="bk__dt-label">🕐 Giờ kết thúc</span>
                    <Select
                        className={`bk__time-select${dtError ? " bk__time-select--error" : ""}`}
                        value={endTime}
                        options={TIME_OPTIONS.map(t => ({ label: t, value: t }))}
                        classNames={{ popup: { root: pickerPopupClass } }}
                        onChange={value => { setEndTime(value); setTouched(true); }}
                    />
                </div>
            </div>

            {dtError && <p className="bk__dt-error">{dtError}</p>}

            {/* Price preview */}
            <AnimatePresence>
                {!(pitchLoading || pitchLoadingRedux) && currentPitch && isValid && (
                    <motion.div
                        className="bk__price-preview"
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <p className="bk__price-row">⏱ Thời lượng: {minutes} phút</p>
                        <p className="bk__price-row">
                            📐 Kích thước: {currentPitch.length ?? '--'}m x {currentPitch.width ?? '--'}m x {currentPitch.height ?? '--'}m
                        </p>
                        <p className="bk__price-row">
                            📏 Diện tích: {currentPitch.length != null && currentPitch.width != null
                                ? `${Number((currentPitch.length * currentPitch.width).toFixed(2)).toLocaleString('vi-VN')} m2`
                                : 'Chưa cập nhật'}
                        </p>
                        <div className="bk__price-total">
                            💰 Tạm tính: {formatVND(preview)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Phone */}
            <Form.Item
                label="Số điện thoại liên hệ"
                name="contactPhone"
                style={{ marginBottom: 0 }}
            >
                <Input className="bk__input-wrap" placeholder="0912 345 678" />
            </Form.Item>

            <div className="bk__form-submit-inline">
                <Popconfirm
                    title="Xác nhận cập nhật"
                    description={
                        <span>
                            {startDj.format("HH:mm DD/MM")} → {endDj.format("HH:mm DD/MM")}
                            {preview > 0 && ` · ${formatVND(preview)}`}
                        </span>
                    }
                    okText="Xác nhận"
                    cancelText="Huỷ"
                    placement="topLeft"
                    onCancel={cancel}
                    onConfirm={handleConfirmSubmit}
                    disabled={!canSubmit}
                >
                    <button
                        className="bk__submit-btn"
                        type="button"
                        disabled={!canSubmit}
                    >
                        {loading
                            ? <><Spin size="small" /> Đang cập nhật...</>
                            : <><TbSoccerField size={16} /> Cập nhật lịch đặt</>}
                    </button>
                </Popconfirm>
            </div>

            </div>

            <div className="bk__form-layout__aside">
            <EquipmentBorrowSection
                pitchId={effectivePitchId}
                sessionKey={`${bookingId}-${effectivePitchId}`}
                initialVersion={borrowInitialVersion}
                initialQtyByEquipmentId={initialQtyByEquipmentId}
                initialBorrowNote={initialBorrowNoteSeed}
                isAuthenticated={isAuthenticated}
                onPlanChange={handleBorrowPlanChange}
                onBorrowInteraction={() => setEquipmentTouched(true)}
            />
            </div>

            </div>

        </Form>
    );
};

export default UpdateBookingForm;
