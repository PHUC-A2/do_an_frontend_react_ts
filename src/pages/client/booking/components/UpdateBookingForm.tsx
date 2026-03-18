import { DatePicker, Form, Input, Popconfirm, Radio, Select, Spin, Switch, type PopconfirmProps } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

import { SHIRT_OPTION_OPTIONS } from "../../../../utils/constants/booking.constants";
import type { ShirtOptionEnum } from "../../../../types/booking";
import { getBookingById, updateBookingClient, getPublicEquipments, clientBorrowEquipment } from "../../../../config/Api";
import type { IEquipment } from "../../../../types/equipment";
import type { IPitch } from "../../../../types/pitch";
import { formatVND } from "../../../../utils/format/price";
import EquipmentBorrowSection from "./EquipmentBorrowSection";
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
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    pitchId?: number;
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, "0");
    const m = i % 2 === 0 ? "00" : "30";
    return `${h}:${m}`;
});

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
    const shirtOption = Form.useWatch("shirtOption", form);
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
    const [startTime, setStartTime] = useState("07:00");
    const [endDate, setEndDate] = useState(bookingDate.format("YYYY-MM-DD"));
    const [endTime, setEndTime] = useState("08:00");

    // Equipment state
    const [equipments, setEquipments] = useState<IEquipment[]>([]);
    const [ballQty, setBallQty] = useState<number>(1);
    const [borrowShirt, setBorrowShirt] = useState(false);
    const [shirtQty, setShirtQty] = useState<number>(1);
    // Chỉ borrow khi user chủ động thay đổi — không borrow mặc định
    const [equipmentTouched, setEquipmentTouched] = useState(false);

    // Fetch equipments
    useEffect(() => {
        if (!isAuthenticated) return;
        getPublicEquipments()
            .then(res => { if (res.data.statusCode === 200) setEquipments(res.data.data ?? []); })
            .catch(() => { });
    }, [isAuthenticated]);

    // Reset mượn áo khi bỏ chọn "Có lấy áo"
    useEffect(() => {
        if (shirtOption !== "WITH_PITCH_SHIRT") setBorrowShirt(false);
    }, [shirtOption]);

    // Sync pitch change
    useEffect(() => {
        if (changePitch && selectedPitchId) onPitchChange?.(selectedPitchId);
        if (!changePitch) onPitchChange?.(pitchIdNumber);
    }, [changePitch, selectedPitchId]);

    useEffect(() => {
        if (pitches.length === 0) dispatch(fetchPitches("page=1&pageSize=100"));
    }, [dispatch, pitches.length]);

    // Load booking
    useEffect(() => {
        setInitLoading(true);
        getBookingById(bookingId)
            .then(res => {
                const b = res.data.data;
                if (!b) return;

                if (b.status === "CANCELLED") {
                    toast.error("Booking đã bị huỷ, không thể cập nhật");
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

                setStartDate(start.format("YYYY-MM-DD"));
                setStartTime(start.format("HH:mm").slice(0, 5).replace(/:\d+$/, m => m.replace(/\d+/, v => {
                    const n = parseInt(v);
                    return String(n < 30 ? 0 : 30).padStart(2, "0");
                })));
                setEndDate(end.format("YYYY-MM-DD"));
                setEndTime(end.format("HH:mm").slice(0, 5).replace(/:\d+$/, m => m.replace(/\d+/, v => {
                    const n = parseInt(v);
                    return String(n < 30 ? 0 : 30).padStart(2, "0");
                })));

                // round to nearest 30-min option
                const roundTime = (dj: Dayjs) => {
                    const m = dj.minute() < 30 ? "00" : "30";
                    return `${String(dj.hour()).padStart(2, "0")}:${m}`;
                };
                setStartTime(roundTime(start));
                setEndTime(roundTime(end));
                setStartDate(start.format("YYYY-MM-DD"));
                setEndDate(end.format("YYYY-MM-DD"));

                form.setFieldsValue({
                    shirtOption: b.shirtOption,
                    contactPhone: b.contactPhone,
                });
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

    const startDj = useMemo(() => dayjs(`${startDate}T${startTime}`), [startDate, startTime]);
    const endDj = useMemo(() => dayjs(`${endDate}T${endTime}`), [endDate, endTime]);
    const minutes = endDj.diff(startDj, "minute");
    const isValid = minutes > 0;

    const preview = currentPitch && isValid
        ? Math.round((currentPitch.pricePerHour / 60) * minutes)
        : 0;

    const dtError = touched && !isValid ? "Giờ kết thúc phải sau giờ bắt đầu" : null;

    const handleUpdate = async (values: FormValues) => {
        setTouched(true);
        if (blocked || !isValid) return;

        if (!isAuthenticated) {
            toast.warning("Vui lòng đăng nhập để cập nhật lịch đặt");
            await new Promise(r => setTimeout(r, 2000));
            window.location.href = `/login?redirect=${location.pathname}`;
            return;
        }

        setLoading(true);
        try {
            await updateBookingClient(bookingId, {
                pitchId: changePitch ? values.pitchId! : pitchIdNumber,
                shirtOption: values.shirtOption,
                contactPhone: values.contactPhone,
                startDateTime: startDj.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: endDj.format("YYYY-MM-DDTHH:mm:ss"),
            });
            toast.success("Cập nhật lịch đặt thành công!");

            // Chỉ borrow khi user chủ động thay đổi equipment
            if (equipmentTouched) {
                const ballEq = equipments.find(e => e.name.toLowerCase().includes("bóng") || e.name.toLowerCase().includes("ball"));
                const shirtEq = equipments.find(e => e.name.toLowerCase().includes("áo") || e.name.toLowerCase().includes("shirt"));
                const tasks: Promise<any>[] = [];
                if (ballEq && ballQty > 0)
                    tasks.push(clientBorrowEquipment({ bookingId, equipmentId: ballEq.id, quantity: ballQty }).catch(() => { }));
                if (borrowShirt && shirtEq && shirtQty > 0)
                    tasks.push(clientBorrowEquipment({ bookingId, equipmentId: shirtEq.id, quantity: shirtQty }).catch(() => { }));
                if (tasks.length > 0) await Promise.all(tasks);
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
                        <div className="bk__price-total">
                            💰 Tạm tính: {formatVND(preview)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shirt */}
            <Form.Item
                label="Áo pitch"
                name="shirtOption"
                rules={[{ required: true, message: "Vui lòng chọn" }]}
                style={{ marginBottom: 12 }}
            >
                <Radio.Group className="bk__shirt-radio" buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                    {SHIRT_OPTION_OPTIONS.map(opt => (
                        <Radio.Button key={opt.value} value={opt.value} style={{ flex: 1, textAlign: 'center' }}>
                            {opt.label}
                        </Radio.Button>
                    ))}
                </Radio.Group>
            </Form.Item>

            {/* Phone */}
            <Form.Item
                label="Số điện thoại liên hệ"
                name="contactPhone"
                style={{ marginBottom: 16 }}
            >
                <Input className="bk__input-wrap" placeholder="0912 345 678" />
            </Form.Item>

            <EquipmentBorrowSection
                isAuthenticated={isAuthenticated}
                shirtOption={shirtOption}
                equipments={equipments}
                ballQty={ballQty}
                setBallQty={v => { setBallQty(v); setEquipmentTouched(true); }}
                borrowShirt={borrowShirt}
                setBorrowShirt={v => { setBorrowShirt(v); setEquipmentTouched(true); }}
                shirtQty={shirtQty}
                setShirtQty={v => { setShirtQty(v); setEquipmentTouched(true); }}
            />

            {/* Submit */}
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

        </Form>
    );
};

export default UpdateBookingForm;
